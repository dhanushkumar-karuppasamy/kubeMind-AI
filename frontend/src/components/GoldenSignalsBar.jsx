import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function GoldenSignalsBar({ apiBase }) {
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchSignals = async () => {
      try {
        setLoading(true);
        const r = await fetch(`${apiBase}/api/signals/golden`);
        if (!r.ok) throw new Error('status ' + r.status);
        const d = await r.json();
        if (!mounted) return;
        setSignals(d);
        setError(false);
      } catch (e) {
        console.error('golden signals', e);
        setError(true);
        setSignals(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSignals();
    const i = setInterval(fetchSignals, 5000);
    return () => { mounted = false; clearInterval(i); };
  }, [apiBase]);

  const statusColor = (s) => s === 'critical' ? 'var(--red)' : s === 'warning' ? 'var(--orange)' : 'var(--green)';

  return (
    <motion.div className="golden-bar card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontWeight:800,color:'var(--text)',fontSize:13}}>Golden Signals</div>
          <div style={{fontSize:12,color:'var(--text-muted)'}}>
            {loading ? 'Loading…' : (signals ? `Updated ${new Date(signals.updated_at).toLocaleTimeString()}` : 'Unavailable')}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontSize:12,fontWeight:800,color: statusColor(signals?.status || 'healthy'), padding:'6px 10px', borderRadius:12, background:'var(--surface-2)'}}>
            {signals?.status?.toUpperCase() || 'UNKNOWN'}
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:12,marginTop:12,flexWrap:'wrap'}}>
        {/* Throughput */}
        <div className="signal-card">
          <div className="signal-icon">📈</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:'var(--text-muted)',fontWeight:700}}>Throughput</div>
            <div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>
              {loading ? '—' : (signals ? `${signals.throughput_rps} req/s` : 'unavailable')}
            </div>
          </div>
        </div>

        {/* Error rate */}
        <div className="signal-card">
          <div className="signal-icon">❗</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:'var(--text-muted)',fontWeight:700}}>Error Rate</div>
            <div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>
              {loading ? '—' : (signals ? `${signals.error_rate_pct}%` : 'unavailable')}
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className="signal-card">
          <div className="signal-icon">⏱️</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:'var(--text-muted)',fontWeight:700}}>Latency</div>
            <div style={{fontSize:16,fontWeight:800,color:'var(--text)'}}>
              {loading ? '—' : (signals ? `${signals.avg_latency_ms} ms` : 'unavailable')}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{marginTop:10,fontSize:12,color:'var(--text-muted)'}}>Signals unavailable — using fallback values</div>
      )}
    </motion.div>
  );
}
