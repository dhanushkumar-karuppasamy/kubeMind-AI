// PATH: frontend/src/components/HealthScore.jsx
import React, { useState, useEffect } from 'react';

export default function HealthScore({ apiBase = 'http://localhost:8000' }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${apiBase}/api/health-score`);
        setData(await r.json());
      } catch { setData(null); }
    };
    fetch_();
    const iv = setInterval(fetch_, 5000);
    return () => clearInterval(iv);
  }, []);

  if (!data) return <div className="panel-loading">⏳ Loading health score…</div>;

  const color = data.score >= 90 ? '#22c55e' : data.score >= 70 ? '#eab308' : '#ef4444';
  const r = 36, circ = 2 * Math.PI * r;
  const fill = circ - (data.score / 100) * circ;

  return (
    <div className="health-score-panel">
      <div className="panel-header">
        <span className="panel-title">Cluster Health</span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>{data.status}</span>
      </div>

      <div className="health-gauge-wrap">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#2a2a40" strokeWidth="8"/>
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={fill}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
          <text x="50" y="46" textAnchor="middle" fill={color}
            fontSize="20" fontWeight="700">{data.score}</text>
          <text x="50" y="60" textAnchor="middle" fill="#7a7a9a"
            fontSize="11">Grade {data.grade}</text>
        </svg>
      </div>

      <div className="health-breakdown">
        {Object.entries(data.breakdown || {}).map(([sev, count]) => (
          <div key={sev} className={`breakdown-item ${sev}`}>
            <span style={{ textTransform: 'capitalize' }}>{sev}</span>
            <span>{count} issue{count !== 1 ? 's' : ''}</span>
          </div>
        ))}
        <div className="breakdown-item ok">
          <span>Active Pods</span>
          <span>{data.pod_count}</span>
        </div>
      </div>
    </div>
  );
}