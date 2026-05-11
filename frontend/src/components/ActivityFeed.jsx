// PATH: frontend/src/components/ActivityFeed.jsx
import React, { useState, useEffect } from 'react';

const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };

export default function ActivityFeed() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch('http://localhost:8000/api/activity');
        const d = await r.json();
        setEvents(d.events || []);
      } catch {}
    };
    fetch_();
    const iv = setInterval(fetch_, 5000);
    return () => clearInterval(iv);
  }, []);

  const fmt = ts => {
    try { return new Date(ts + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    catch { return '—'; }
  };

  return (
    <div className="activity-feed">
      <div className="panel-header">
        <span className="panel-title">Live Activity</span>
        <div className="activity-dot" />
      </div>

      {events.length === 0 ? (
        <div className="activity-empty">No events yet — waiting for anomalies…</div>
      ) : (
        <div className="activity-list">
          {events.slice(0, 15).map((e, i) => (
            <div key={i} className="activity-item"
              style={{ borderLeftColor: SEV_COLOR[e.severity] || '#3a3a55' }}>
              <div className="activity-row1">
                <span className="activity-icon">{e.icon || '⚡'}</span>
                <span className="activity-pod">{e.pod}</span>
                <span className="activity-time">{fmt(e.timestamp)}</span>
              </div>
              <div className="activity-msg">{e.message}</div>
              {e.insight && <div className="activity-insight">💡 {e.insight}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}