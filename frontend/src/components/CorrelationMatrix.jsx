// PATH: frontend/src/components/CorrelationMatrix.jsx
import React, { useState, useEffect } from 'react';

export default function CorrelationMatrix() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch('http://localhost:8000/api/correlations');
        setData(await r.json());
      } catch { setData(null); }
    };
    fetch_();
    const iv = setInterval(fetch_, 20000);
    return () => clearInterval(iv);
  }, []);

  if (!data) return <div className="panel-loading">⏳ Loading correlations…</div>;

  const entries = Object.entries(data.correlations || {});

  return (
    <div className="correlation-panel">
      <div className="panel-header">
        <span className="panel-title">Service Correlations</span>
        <span className="corr-subtitle">{entries.length} pair{entries.length !== 1 ? 's' : ''}</span>
      </div>

      {entries.length === 0 ? (
        <div className="corr-empty">⏳ Need 2+ pods with 30s+ data</div>
      ) : (
        <div className="corr-list">
          {entries.slice(0, 5).map(([key, c]) => {
            const barColor = c.type === 'positive' ? '#3b82f6' : '#a855f7';
            return (
              <div key={key} className="corr-item">
                <div className="corr-pair">{c.pod1} ↔ {c.pod2}</div>
                <div className="corr-bar-wrap">
                  <div className="corr-bar"
                    style={{ width: `${c.percentage}%`, background: barColor }} />
                  <span className="corr-pct">{c.percentage}%</span>
                </div>
                <div className="corr-strength">
                  <span className={`corr-type ${c.type}`}>{c.type}</span>
                  <span className="corr-strength-label">{c.strength}</span>
                </div>
                <div className="corr-meaning">{c.meaning}</div>
              </div>
            );
          })}
          {entries.length > 5 && (
            <div className="corr-hint">+{entries.length - 5} more pairs</div>
          )}
        </div>
      )}
    </div>
  );
}