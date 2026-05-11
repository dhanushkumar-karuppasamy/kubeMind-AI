import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
         CartesianGrid, Tooltip, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      style={{
        background:'rgba(17, 17, 24, 0.95)',
        backdropFilter: 'blur(20px)',
        border:'1px solid var(--border-hover)',
        borderRadius:12,
        padding:'12px 16px',
        fontSize:12,
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <div style={{fontWeight:700,color:'var(--text)',marginBottom:4,fontSize:13}}>{d.time}</div>
      <div style={{color:'var(--accent-bright)',fontWeight:700}}>
        {d.count} anomal{d.count===1?'y':'ies'}
      </div>
    </motion.div>
  );
};

export default function AnomalyTimeline({ apiBase }) {
  const [data,     setData]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [configEvents, setConfigEvents] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${apiBase}/api/anomalies/history?hours=1`);
        const d = await r.json();
        const rows = Object.entries(d.timeline || {})
          .map(([time, v]) => ({ time, count: v.count, anomalies: v.anomalies }))
          .sort((a, b) => a.time.localeCompare(b.time));
        setData(rows);
        // fetch config events in parallel
        try {
          setLoadingConfig(true);
          const rc = await fetch(`${apiBase}/api/events/config?hours=1`);
          const dc = await rc.json();
          setConfigEvents(dc.events || []);
        } catch (e) {
          console.error('config events', e);
          setConfigEvents([]);
        } finally {
          setLoadingConfig(false);
        }
      } catch(e) { console.error(e); }
    };
    fetch_();
    const i = setInterval(fetch_, 30000);
    return () => clearInterval(i);
  }, [apiBase]);

  const maxCount = Math.max(...data.map(d => d.count), 1);

  const iconMap = {
    apply: '📦',
    scale: '📈',
    rollout: '🚀',
    restart: '🔄'
  };

  const severityColor = (sev) => {
    return sev === 'critical' ? 'var(--red)' : sev === 'warning' ? 'var(--orange)' : 'var(--blue)';
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Anomaly Timeline</span>
        <span style={{
          fontSize:11,
          color:'var(--text-muted)',
          fontWeight:600,
          display:'flex',
          alignItems:'center',
          gap:8
        }}>
          <span style={{
            width:6,
            height:6,
            borderRadius:'50%',
            background:'var(--accent)',
            display:'inline-block'
          }}/>
          Last 60 minutes · Click bar for details
        </span>
      </div>

      <AnimatePresence mode="wait">
        {data.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              height:140,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              color:'var(--text-muted)',
              fontSize:13,
              flexDirection:'column',
              gap:10
            }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{fontSize:32}}
            >
              ⏱️
            </motion.div>
            No anomaly history yet — data accumulates over time
          </motion.div>
        ) : (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Config events row (shows config/deployment changes correlated with anomalies) */}
            <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:13,fontWeight:800,color:'var(--text)'}}>Config changes</div>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>{loadingConfig ? 'Loading…' : `${configEvents.length} recent`}</div>
              </div>
              <div style={{display:'flex',gap:8,overflowX:'auto',paddingTop:6,paddingBottom:6}}>
                {loadingConfig ? (
                  <div style={{color:'var(--text-muted)',fontSize:13}}>Loading config events…</div>
                ) : configEvents.length === 0 ? (
                  <div style={{color:'var(--text-muted)',fontSize:13}}>No recent config changes</div>
                ) : (
                  configEvents.map((ev) => (
                    <motion.div key={ev.id}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        minWidth:220,
                        background:'var(--surface-2)',
                        border:'1px solid var(--border-hover)',
                        padding:'8px 12px',
                        borderRadius:10,
                        display:'flex',
                        flexDirection:'column',
                        gap:6,
                        boxShadow:'var(--shadow-sm)'
                      }}
                    >
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{fontSize:18}}>{iconMap[ev.type] || '🔔'}</div>
                          <div style={{fontWeight:700,color:'var(--text)'}}>{ev.title}</div>
                        </div>
                        <div style={{fontSize:11,padding:'4px 8px',borderRadius:12,background:'var(--surface-3)',color:severityColor(ev.severity),fontWeight:800}}>{ev.service}</div>
                      </div>
                      <div style={{fontSize:12,color:'var(--text-muted)'}}>{ev.description}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)',textAlign:'right'}}>{new Date(ev.timestamp).toLocaleTimeString()}</div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
            <div style={{height:150}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data} 
                  barSize={18}
                  onClick={e => e?.activePayload && setSelected(
                    selected?.time === e.activePayload[0]?.payload?.time
                      ? null : e.activePayload[0]?.payload
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis 
                    dataKey="time" 
                    tick={{fill:'var(--text-muted)',fontSize:10,fontWeight:600}}
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{fill:'var(--text-muted)',fontSize:10,fontWeight:600}}
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="count" radius={[6,6,0,0]} cursor="pointer">
                    {data.map((entry, i) => {
                      const isSelected = entry === selected;
                      const intensity = entry.count / maxCount;
                      let color = intensity > 0.7 ? 'var(--red)' :
                                 intensity > 0.4 ? 'var(--orange)' : 'var(--blue)';
                      if (isSelected) color = 'var(--accent-bright)';
                      
                      return (
                        <Cell 
                          key={i}
                          fill={color}
                          fillOpacity={isSelected ? 1 : 0.8}
                          style={{
                            filter: isSelected ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <AnimatePresence>
              {selected && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    padding:'16px 18px',
                    background:'var(--surface-2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius:'var(--radius-md)',
                    border:'1px solid var(--border-hover)',
                    boxShadow: 'var(--shadow-md)',
                    overflow:'hidden'
                  }}
                >
                  <div style={{
                    fontSize:11,
                    fontWeight:700,
                    color:'var(--accent-bright)',
                    marginBottom:12,
                    letterSpacing:'1px',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between'
                  }}>
                    <span>ANOMALIES AT {selected.time}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelected(null)}
                      style={{
                        background:'transparent',
                        border:'1px solid var(--border)',
                        borderRadius:6,
                        padding:'4px 8px',
                        color:'var(--text-muted)',
                        cursor:'pointer',
                        fontSize:10,
                        fontWeight:700
                      }}
                    >
                      ✕
                    </motion.button>
                  </div>
                  
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.08
                        }
                      }
                    }}
                  >
                    {selected.anomalies?.slice(0,3).map((a, i) => (
                      <motion.div 
                        key={i} 
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          visible: { opacity: 1, x: 0 }
                        }}
                        style={{
                          fontSize:12,
                          color:'var(--text-muted)',
                          padding:'10px 0',
                          borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                          lineHeight:1.6
                        }}
                      >
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{
                            color:'var(--text)',
                            fontWeight:700,
                            fontSize:13
                          }}>
                            📦 {a.pod}
                          </span>
                          <span style={{
                            fontSize:10,
                            padding:'2px 8px',
                            borderRadius:12,
                            background:'var(--accent-dim)',
                            color:'var(--accent)',
                            fontWeight:700,
                            border:'1px solid rgba(255,167,38,0.3)'
                          }}>
                            {a.type?.replace(/_/g,' ')}
                          </span>
                        </div>
                        <div style={{color:'var(--text-muted)',fontSize:12}}>
                          {a.insight || a.message}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
