// PATH: frontend/src/components/ChaosControl.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PODS = ['face-recognition', 'student-portal', 'api-gateway', 'notification', 'logging-service'];
const TYPES = ['cpu_spike', 'memory_leak', 'network_burst', 'io_spike'];

const DEFAULT_SCENARIOS = [
  { id: 'cpu_storm', title: 'CPU Storm', description: 'Simulates high CPU load on face-recognition', icon: '⚡' },
  { id: 'memory_pressure', title: 'Memory Pressure', description: 'Gradual memory leak on student-portal', icon: '📈' },
  { id: 'network_burst', title: 'Network Burst', description: 'Spikes network traffic across all pods', icon: '🌐' },
  { id: 'cascading_failure', title: 'Cascading Failure', description: 'Triggers CPU spike then memory pressure in sequence', icon: '🔥' },
  { id: 'recovery_test', title: 'Full Recovery Test', description: 'Injects then auto-clears an anomaly to show resilience', icon: '🔄' },
];

export default function ChaosControl({ apiBase = 'http://localhost:8000' }) {
  const [status, setStatus] = useState({ enabled: false, total_injections: 0 });
  const [selectedPod, setSelectedPod] = useState(PODS[0]);
  const [selectedType, setSelectedType] = useState(TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [scenarioState, setScenarioState] = useState(null);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const r = await fetch(`${apiBase}/api/chaos/status`);
        setStatus(await r.json());
      } catch {}
    };

    const fetchScenarios = async () => {
      try {
        const r = await fetch(`${apiBase}/api/chaos/scenarios`);
        const payload = await r.json();
        if (Array.isArray(payload.scenarios) && payload.scenarios.length) {
          setScenarios(payload.scenarios);
        }
      } catch {}
    };

    fetchStatus();
    fetchScenarios();
    const iv = setInterval(fetchStatus, 5000);
    return () => clearInterval(iv);
  }, [apiBase]);

  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const toggleChaos = async () => {
    setLoading(true);
    const endpoint = status.enabled ? '/api/chaos/disable' : '/api/chaos/enable';
    try {
      await fetch(`${apiBase}${endpoint}`, { method: 'POST' });
      setResult(status.enabled ? 'Chaos engine stopped' : 'Chaos engine enabled — auto-injecting every 2-5 min');
    } catch {
      setResult('Failed — is backend running?');
    }
    setLoading(false);
  };

  const injectManual = async () => {
    setLoading(true);
    try {
      await fetch(
        `${apiBase}/api/chaos/inject?pod_name=${selectedPod}&anomaly_type=${selectedType}&duration=60`,
        { method: 'POST' }
      );
      setResult(`✅ Injected ${selectedType} → ${selectedPod} (60s)`);
    } catch {
      setResult('Inject failed — is backend running?');
    }
    setLoading(false);
    setTimeout(() => setResult(''), 4000);
  };

  const launchScenario = async (scenarioId) => {
    if (activeScenarioId) return;

    setActiveScenarioId(scenarioId);
    setScenarioState({ scenarioId, status: 'triggering' });

    try {
      const response = await fetch(`${apiBase}/api/chaos/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setScenarioState({ scenarioId, status: 'triggered' });
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setActiveScenarioId(null);
        setScenarioState(null);
      }, 2000);
    } catch {
      setScenarioState({ scenarioId, status: 'failed' });
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setActiveScenarioId(null);
        setScenarioState(null);
      }, 2000);
    }
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
        <button
          className={`chaos-toggle-btn ${status.enabled ? 'on' : 'off'}`}
          onClick={toggleChaos}
          disabled={loading || activeScenarioId !== null}
        >
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
          <select value={selectedPod} onChange={(e) => setSelectedPod(e.target.value)} disabled={loading || activeScenarioId !== null}>
            {PODS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} disabled={loading || activeScenarioId !== null}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button className="chaos-inject-btn" onClick={injectManual} disabled={loading || activeScenarioId !== null}>
          ⚡ Inject Now
        </button>
        {result && <div className="chaos-result">{result}</div>}
      </div>

      <div className="chaos-scenarios-section">
        <div className="chaos-manual-title">Scenario Presets</div>
        <div className="chaos-scenarios-grid">
          {scenarios.map((scenario) => {
            const isActive = activeScenarioId === scenario.id;
            const state = isActive ? scenarioState?.status : null;
            const buttonsDisabled = Boolean(activeScenarioId && !isActive);
            const isTriggering = state === 'triggering';
            const isTriggered = state === 'triggered';
            const isFailed = state === 'failed';

            return (
              <motion.div
                key={scenario.id}
                className={`chaos-scenario-card ${isActive ? 'active' : ''}`}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              >
                <div className="chaos-scenario-card-top">
                  <div className="chaos-scenario-icon">{scenario.icon}</div>
                  <div className="chaos-scenario-copy">
                    <div className="chaos-scenario-title">{scenario.title}</div>
                    <div className="chaos-scenario-description">{scenario.description}</div>
                  </div>
                </div>

                <div className="chaos-scenario-actions">
                  <button
                    type="button"
                    className="chaos-scenario-btn"
                    onClick={() => launchScenario(scenario.id)}
                    disabled={buttonsDisabled || isTriggering || isTriggered || isFailed}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isTriggering ? (
                        <motion.span
                          key="triggering"
                          className="chaos-scenario-btn-content"
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -2 }}
                        >
                          <span className="chaos-spinner" />
                          Triggering...
                        </motion.span>
                      ) : isTriggered ? (
                        <motion.span
                          key="triggered"
                          className="chaos-scenario-btn-content"
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -2 }}
                        >
                          ✅ Triggered
                        </motion.span>
                      ) : isFailed ? (
                        <motion.span
                          key="failed"
                          className="chaos-scenario-btn-content"
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -2 }}
                        >
                          ❌ Failed
                        </motion.span>
                      ) : (
                        <motion.span
                          key="launch"
                          className="chaos-scenario-btn-content"
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -2 }}
                        >
                          ▶ Launch
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="chaos-stats">
        Total injections: <strong>{status.total_injections}</strong>
      </div>
    </div>
  );
}
