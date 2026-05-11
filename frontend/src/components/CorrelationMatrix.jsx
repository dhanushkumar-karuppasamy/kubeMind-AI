// PATH: frontend/src/components/CorrelationMatrix.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CorrelationMatrix({ apiBase = 'http://localhost:8000' }) {
  const [data, setData] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [explanationError, setExplanationError] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${apiBase}/api/correlations`);
        setData(await r.json());
      } catch { setData(null); }
    };
    fetch_();
    const iv = setInterval(fetch_, 20000);
    return () => clearInterval(iv);
  }, [apiBase]);

  const explainView = async () => {
    setThinking(true);
    setExplanationError(false);
    try {
      const r = await fetch(`${apiBase}/api/summary/correlations`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const payload = await r.json();
      setExplanation({
        bullets: Array.isArray(payload.bullets) ? payload.bullets : [],
        generated_at: payload.generated_at,
      });
    } catch (error) {
      console.error('Correlation summary error:', error);
      setExplanation(null);
      setExplanationError(true);
    } finally {
      setThinking(false);
    }
  };

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

      <div className="corr-ai-row">
        <motion.button
          type="button"
          className="corr-ai-btn"
          onClick={explainView}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={thinking}
        >
          {thinking ? 'Thinking...' : '🤖 Explain this'}
        </motion.button>

        {thinking && !explanation && (
          <div className="corr-ai-card corr-ai-loading">Thinking about these correlations...</div>
        )}

        {explanationError && !thinking && !explanation && (
          <div className="corr-ai-card corr-ai-error">AI explanation unavailable</div>
        )}

        {explanation && !explanationError && (
          <div className="corr-ai-card">
            <ul className="corr-ai-bullets">
              {explanation.bullets.slice(0, 3).map((bullet, index) => (
                <li key={`${index}-${bullet}`}>{bullet}</li>
              ))}
            </ul>
            <div className="corr-ai-meta">
              Generated {explanation.generated_at ? new Date(explanation.generated_at).toLocaleString('en-IN', { hour12: false }) : 'just now'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}