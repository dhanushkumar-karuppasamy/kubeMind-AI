// PATH: frontend/src/components/ChaosControl.jsx
import React, { useState, useEffect } from 'react';

const PODS = ['face-recognition', 'student-portal', 'api-gateway', 'notification', 'logging-service'];
const TYPES = ['cpu_spike', 'memory_leak', 'network_burst', 'io_spike'];

export default function ChaosControl({ apiBase = 'http://localhost:8000' }) {
  const [status, setStatus] = useState({ enabled: false, total_injections: 0 });
  const [selectedPod, setSelectedPod] = useState(PODS[0]);
  const [selectedType, setSelectedType] = useState(TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${apiBase}/api/chaos/status`);
        setStatus(await r.json());
      } catch {}
    };
    fetch_();
    const iv = setInterval(fetch_, 5000);
    return () => clearInterval(iv);
  }, []);

  const toggleChaos = async () => {
    setLoading(true);
    const endpoint = status.enabled ? '/api/chaos/disable' : '/api/chaos/enable';
    try {
      await fetch(`${apiBase}${endpoint}`, { method: 'POST' });
      setResult(status.enabled ? 'Chaos engine stopped' : 'Chaos engine enabled — auto-injecting every 2-5 min');
    } catch { setResult('Failed — is backend running?'); }
    setLoading(false);
  };

  const injectManual = async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `${apiBase}/api/chaos/inject?pod_name=${selectedPod}&anomaly_type=${selectedType}&duration=60`,
        { method: 'POST' }
      );
      const d = await r.json();
      setResult(`✅ Injected ${selectedType} → ${selectedPod} (60s)`);
    } catch { setResult('Inject failed — is backend running?'); }
    setLoading(false);
    setTimeout(() => setResult(''), 4000);
  };

  return (
    <div className="chaos-panel">
      <div className="panel-header">
        <span className="panel-title">Chaos Engine</span>
        <span className={`chaos-badge ${status.enabled ? 'active' : 'inactive'}`}>
          {status.enabled ? '🔴 ACTIVE' : '⚫ IDLE'}
        </span>
      </div>

      <div className="chaos-auto">
        <button className={`chaos-toggle-btn ${status.enabled ? 'on' : 'off'}`}
          onClick={toggleChaos} disabled={loading}>
          {status.enabled ? '⏹ Stop Auto-Chaos' : '▶ Start Auto-Chaos'}
        </button>
        <div className="chaos-desc">
          {status.enabled
            ? 'Injecting random anomalies every 2–5 minutes'
            : 'Simulate real-world failures automatically'}
        </div>
      </div>

      <div className="chaos-manual">
        <div className="chaos-manual-title">Manual Injection</div>
        <div className="chaos-selects">
          <select value={selectedPod} onChange={e => setSelectedPod(e.target.value)}>
            {PODS.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button className="chaos-inject-btn" onClick={injectManual} disabled={loading}>
          ⚡ Inject Now
        </button>
        {result && <div className="chaos-result">{result}</div>}
      </div>

      <div className="chaos-stats">
        Total injections: <strong>{status.total_injections}</strong>
      </div>
    </div>
  );
}