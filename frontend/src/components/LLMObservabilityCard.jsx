import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'No calls yet';

  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'Just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function LLMObservabilityCard({ apiBase = 'http://localhost:8000' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBase}/api/llm/stats`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        if (!mounted) return;
        setData(payload);
        setError(false);
      } catch (err) {
        console.error('LLM stats fetch error:', err);
        if (!mounted) return;
        setData(null);
        setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    const intervalId = setInterval(fetchStats, 10000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [apiBase]);

  const status = data?.status || 'offline';
  const statusColor = status === 'online' ? 'var(--green)' : status === 'degraded' ? 'var(--orange)' : 'var(--red)';
  const statusLabel = status.toUpperCase();

  if (loading && !data) {
    return <div className="panel-loading">⏳ Loading LLM observability…</div>;
  }

  if (error && !data) {
    return <div className="panel-loading">⚠ AI observability unavailable</div>;
  }

  return (
    <motion.div
      className="llm-observability-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="llm-observability-header">
        <span className="llm-observability-title">LLM Observability</span>
        <span className="llm-model-badge">{data?.model_name || 'unknown model'}</span>
      </div>

      <div className="llm-observability-status">
        <span className={`llm-status-dot ${status}` } style={{ background: statusColor }} />
        <span className="llm-status-label" style={{ color: statusColor }}>{statusLabel}</span>
      </div>

      <div className="llm-observability-grid">
        <div className="llm-observability-stat">
          <div className="llm-stat-label">Calls</div>
          <div className="llm-stat-value">{data?.total_calls ?? '—'}</div>
        </div>
        <div className="llm-observability-stat">
          <div className="llm-stat-label">Avg latency</div>
          <div className="llm-stat-value">{data?.avg_latency_ms != null ? `${Math.round(data.avg_latency_ms)} ms` : '—'}</div>
        </div>
        <div className="llm-observability-stat">
          <div className="llm-stat-label">Last call</div>
          <div className="llm-stat-value llm-stat-small">{formatRelativeTime(data?.last_call_at)}</div>
        </div>
      </div>

      {error && data && (
        <div className="llm-observability-note">Showing last known LLM stats.</div>
      )}
    </motion.div>
  );
}