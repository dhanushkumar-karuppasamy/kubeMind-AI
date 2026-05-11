// PATH: frontend/src/components/ForecastPanel.jsx
import React, { useState, useEffect } from 'react';

export default function ForecastPanel() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('cpu');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch('http://localhost:8000/api/forecast');
        setData(await r.json());
      } catch { setData(null); }
    };
    fetch_();
    const iv = setInterval(fetch_, 15000);
    return () => clearInterval(iv);
  }, []);

  if (!data) return <div className="panel-loading">⏳ Loading forecast…</div>;

  const forecasts = data[tab] || {};
  const atRiskCount = Object.values(forecasts).filter(
    f => f.will_exceed_threshold || f.will_oom
  ).length;

  return (
    <div className="forecast-panel">
      <div className="panel-header">
        <span className="panel-title">Predictive Forecast</span>
        {atRiskCount > 0 && (
          <span className="forecast-warning-badge">⚠ {atRiskCount} at risk</span>
        )}
      </div>

      <div className="forecast-tabs">
        {['cpu', 'memory'].map(t => (
          <button key={t} className={`ftab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}>
            {t === 'cpu' ? '⚡ CPU' : '💾 Memory'}
          </button>
        ))}
      </div>

      {Object.keys(forecasts).length === 0 ? (
        <div className="forecast-empty">⏳ Collecting data — check back in 30 seconds</div>
      ) : (
        <div className="forecast-list">
          {Object.entries(forecasts).map(([pod, f]) => {
            const isRisk = f.will_exceed_threshold || f.will_oom;
            const current = tab === 'cpu' ? f.current_cpu : f.current_memory;
            const predicted = tab === 'cpu' ? f.predicted_cpu : f.predicted_memory;
            return (
              <div key={pod} className={`forecast-item ${isRisk ? 'at-risk' : ''}`}>
                <div className="forecast-pod">{pod}</div>
                <div className="forecast-values">
                  <span className="forecast-current">{current?.toFixed(1)}%</span>
                  <span className="forecast-arrow">→</span>
                  <span className={`forecast-predicted ${isRisk ? 'danger' : ''}`}>
                    {predicted?.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: 10, color: '#7a7a9a', marginLeft: 4 }}>
                    in {f.minutes_ahead}m
                  </span>
                </div>
                <div className="forecast-msg">{f.message}</div>
                {f.is_memory_leak && (
                  <div className="forecast-leak-badge">🚨 MEMORY LEAK DETECTED</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}