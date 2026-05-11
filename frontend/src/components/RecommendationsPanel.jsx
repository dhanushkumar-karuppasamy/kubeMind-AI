// PATH: frontend/src/components/RecommendationsPanel.jsx
import React, { useState, useEffect } from 'react';

const PRIORITY_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const TYPE_ICON = { scaling: '⚖️', restart: '🔄', investigate: '🔍', info: 'ℹ️' };

export default function RecommendationsPanel() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch('http://localhost:8000/api/recommendations');
        setData(await r.json());
      } catch { setData(null); }
    };
    fetch_();
    const iv = setInterval(fetch_, 10000);
    return () => clearInterval(iv);
  }, []);

  const copy = (cmd, idx) => {
    if (!cmd) return;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (!data) return <div className="panel-loading">⏳ Loading recommendations…</div>;

  return (
    <div className="recommendations-panel">
      <div className="panel-header">
        <span className="panel-title">AI Recommendations</span>
        <span className="rec-count">{data.count} action{data.count !== 1 ? 's' : ''}</span>
      </div>

      {data.recommendations?.length === 0 ? (
        <div style={{ color: '#7a7a9a', fontSize: 12, padding: '10px 0' }}>
          ✅ No actions needed — system running optimally
        </div>
      ) : (
        <div className="rec-list">
          {data.recommendations.map((rec, i) => (
            <div key={i} className="rec-card">
              <div className="rec-header">
                <span className="rec-icon">{TYPE_ICON[rec.type] || '⚡'}</span>
                <span className="rec-type">{rec.type?.toUpperCase()}</span>
                <span className="rec-priority-badge"
                  style={{ color: PRIORITY_COLOR[rec.priority] || '#7a7a9a' }}>
                  ● {rec.priority?.toUpperCase()}
                </span>
              </div>
              <div className="rec-pod">{rec.pod}</div>
              <div className="rec-action">{rec.action}</div>
              <div className="rec-meta">
                {rec.expected_benefit && (
                  <span className="rec-benefit">✓ {rec.expected_benefit}</span>
                )}
                {rec.estimated_time && (
                  <span className="rec-time">⏱ {rec.estimated_time}</span>
                )}
              </div>
              {rec.kubectl_command && (
                <div className="rec-command">
                  <code>{rec.kubectl_command}</code>
                  <button className="copy-btn" onClick={() => copy(rec.kubectl_command, i)}>
                    {copied === i ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}