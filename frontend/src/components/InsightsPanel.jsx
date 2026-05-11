import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_STYLE = {
  critical: { color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(248,113,113,0.3)',   label: '● CRITICAL', icon: '🔴' },
  high:     { color: 'var(--orange)', bg: 'var(--orange-dim)', border: 'rgba(251,146,60,0.3)', label: '● HIGH', icon: '🟠'     },
  medium:   { color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'rgba(255,167,38,0.3)',  label: '● MEDIUM', icon: '🟡'   },
  low:      { color: 'var(--blue)',   bg: 'var(--blue-dim)',   border: 'rgba(96,165,250,0.3)', label: '● LOW', icon: '🔵'      },
};

const TYPE_LABELS = {
  cpu_spike:              '⚡ CPU Spike',
  memory_leak:            '💧 Memory Leak',
  high_memory:            '📊 High Memory',
  network_spike_inbound:  '↓ Network Surge',
  network_spike_outbound: '↑ Network Surge',
  dependency_failure:     '🔗 Cascade Risk',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

export default function InsightsPanel({ anomalies }) {
  const latest = [...anomalies].reverse().slice(0, 8);

  return (
    <div className="card" style={{display:'flex',flexDirection:'column',minHeight:360}}>
      <div className="card-header">
        <span className="card-title">AI Insights</span>
        <AnimatePresence mode="wait">
          {anomalies.length > 0 ? (
            <motion.span 
              key="active"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="card-badge" 
              style={{
                background:'var(--red-dim)',
                color:'var(--red-bright)',
                borderColor:'rgba(248,113,113,0.3)',
                boxShadow: '0 0 20px rgba(248,113,113,0.2)'
              }}
            >
              {anomalies.length} active
            </motion.span>
          ) : (
            <motion.span 
              key="clear"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="card-badge" 
              style={{
                background:'var(--green-dim)',
                color:'var(--green-bright)',
                borderColor:'rgba(74,222,128,0.3)'
              }}
            >
              all clear
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {latest.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              flex:1,
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              justifyContent:'center',
              gap:12,
              color:'var(--text-muted)',
              padding: '40px 20px'
            }}
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{fontSize:48}}
            >
              ✓
            </motion.div>
            <div style={{fontSize:15,fontWeight:700,color:'var(--green-bright)'}}>All systems healthy</div>
            <div style={{fontSize:12,textAlign:'center',maxWidth:200,lineHeight:1.6}}>
              No anomalies detected in the last 5 minutes
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              display:'flex',
              flexDirection:'column',
              gap:10,
              overflowY:'auto',
              maxHeight:480,
              paddingRight: 4
            }}
          >
            <AnimatePresence>
              {latest.map((a, i) => {
                const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.low;
                return (
                  <motion.div 
                    key={`${a.pod}-${a.timestamp}-${i}`}
                    variants={itemVariants}
                    layout
                    whileHover={{ 
                      scale: 1.02,
                      x: 4,
                      transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    style={{
                      background:'var(--surface-2)',
                      backdropFilter: 'blur(10px)',
                      border:`1px solid ${s.border}`,
                      borderLeft:`3px solid ${s.color}`,
                      borderRadius:'var(--radius-md)',
                      padding:'14px 16px',
                      cursor:'pointer',
                      position:'relative',
                      overflow:'hidden',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {/* Animated gradient overlay */}
                    <motion.div
                      animate={{
                        opacity: [0.05, 0.1, 0.05],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, ${s.color}22, transparent)`,
                        pointerEvents: 'none'
                      }}
                    />

                    <div style={{
                      display:'flex',
                      justifyContent:'space-between',
                      alignItems:'center',
                      marginBottom:6,
                      position:'relative',
                      zIndex:1
                    }}>
                      <span style={{
                        fontSize:11,
                        fontWeight:700,
                        color:s.color,
                        letterSpacing:'0.5px',
                        display:'flex',
                        alignItems:'center',
                        gap:6
                      }}>
                        <span style={{fontSize:14}}>{s.icon}</span>
                        {TYPE_LABELS[a.type] || a.type}
                      </span>
                      <span style={{
                        fontSize:10,
                        color:'var(--text-faint)',
                        fontVariantNumeric:'tabular-nums',
                        fontFamily:'var(--font-mono)',
                        fontWeight:600
                      }}>
                        {a.timestamp ? new Date(a.timestamp+'Z').toLocaleTimeString('en-IN',{hour12:false}) : ''}
                      </span>
                    </div>
                    
                    <div style={{
                      fontSize:12,
                      fontWeight:700,
                      color:'var(--text-muted)',
                      marginBottom:6,
                      position:'relative',
                      zIndex:1
                    }}>
                      📦 {a.pod}
                    </div>
                    
                    <div style={{
                      fontSize:13,
                      color:'var(--text)',
                      lineHeight:1.6,
                      marginBottom:8,
                      position:'relative',
                      zIndex:1
                    }}>
                      {a.insight || a.message}
                    </div>
                    
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      style={{position:'relative',zIndex:1}}
                    >
                      <span style={{
                        fontSize:10,
                        padding:'4px 10px',
                        borderRadius:20,
                        background:s.bg,
                        color:s.color,
                        fontWeight:700,
                        letterSpacing:'0.5px',
                        border: `1px solid ${s.border}`,
                        display:'inline-block'
                      }}>
                        {s.label}
                      </span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
