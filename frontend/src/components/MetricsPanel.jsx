import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from 'recharts';

const severityColor = (val, warn, danger) =>
  val >= danger ? 'var(--red)' : val >= warn ? 'var(--orange)' : 'var(--green)';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'rgba(17, 17, 24, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-hover)',
        borderRadius: 12,
        padding: '12px 16px',
        fontSize: 12,
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)', fontSize: 13 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 4 }}>
          <span>{p.name}:</span>
          <b>{p.value?.toFixed(1)}%</b>
        </div>
      ))}
    </motion.div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

export default function MetricsPanel({ metrics, selectedPod }) {
  const allPods = Object.entries(metrics || {});
  const pods = selectedPod ? allPods.filter(([name]) => name === selectedPod) : allPods;
  const chartData = pods.map(([name, m]) => ({
    name: name.replace('-', '\n').substring(0, 16),
    cpu: parseFloat(m.cpu_percent ?? 0),
    memory: parseFloat(m.memory_percent ?? 0),
  }));
  const metricsLoaded = allPods.length > 0;

  if (!metricsLoaded) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Live Pod Metrics</span>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '60px 0',
            color: 'var(--text-muted)',
            fontSize: 13
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{ fontSize: 32, marginBottom: 12 }}
          >
            ⏳
          </motion.div>
          Waiting for metrics...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Live Pod Metrics</span>
        <motion.span
          className="card-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          {selectedPod ? '1 pod' : `${pods.length} pods`}
        </motion.span>
      </div>

      {selectedPod && (
        <div style={{
          marginBottom: 14,
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap'
        }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--accent-bright)',
            fontWeight: 700,
            letterSpacing: '0.4px'
          }}>
            Filtered by {selectedPod}
          </span>
        </div>
      )}

      {pods.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: 'var(--text-muted)',
            fontSize: 13
          }}
        >
          No metrics found for the selected pod.
        </motion.div>
      ) : (
        <>
          <motion.div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
              gap: 16,
              marginBottom: 28
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {pods.map(([name, m]) => {
              const cpu = parseFloat(m.cpu_percent ?? 0);
              const mem = parseFloat(m.memory_percent ?? 0);
              const cpuColor = severityColor(cpu, 60, 80);
              const memColor = severityColor(mem, 65, 85);
              const hasIssue = cpu > 80 || mem > 85 || m.restarts > 0;
              const selected = selectedPod === name;

              return (
                <motion.div
                  key={name}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.02,
                    y: -4,
                    transition: { type: 'spring', stiffness: 400, damping: 17 }
                  }}
                  style={{
                    background: 'var(--surface-2)',
                    backdropFilter: 'blur(10px)',
                    border: selected
                      ? '1px solid rgba(255,167,38,0.45)'
                      : hasIssue
                        ? '1px solid rgba(248,113,113,0.3)'
                        : '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: selected
                      ? '0 0 0 1px rgba(255,167,38,0.12), var(--shadow-sm)'
                      : hasIssue ? '0 4px 20px rgba(248,113,113,0.15)' : 'var(--shadow-sm)'
                  }}
                >
                  {hasIssue && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, var(--red), transparent)',
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 14,
                      color: 'var(--text)',
                      letterSpacing: '-0.3px'
                    }}>
                      {name}
                    </span>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 500, damping: 25 }}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.8px',
                        color: m.restarts > 0 ? 'var(--red)' : 'var(--green)',
                        background: m.restarts > 0 ? 'var(--red-dim)' : 'var(--green-dim)',
                        padding: '4px 10px',
                        borderRadius: 20,
                        textTransform: 'uppercase',
                        border: m.restarts > 0
                          ? '1px solid rgba(248,113,113,0.3)'
                          : '1px solid rgba(74,222,128,0.3)'
                      }}
                    >
                      {m.restarts > 0 ? `↺ ${m.restarts}` : '✓ Running'}
                    </motion.span>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                      fontWeight: 600
                    }}>
                      <span>CPU Usage</span>
                      <span style={{ color: cpuColor, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{cpu.toFixed(1)}%</span>
                    </div>
                    <div style={{
                      height: 6,
                      background: 'var(--surface-3)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(cpu, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        style={{
                          height: '100%',
                          background: `linear-gradient(90deg, ${cpuColor}, ${cpuColor}dd)`,
                          borderRadius: 4,
                          boxShadow: `0 0 10px ${cpuColor}44`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                      fontWeight: 600
                    }}>
                      <span>Memory Usage</span>
                      <span style={{ color: memColor, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{mem.toFixed(1)}%</span>
                    </div>
                    <div style={{
                      height: 6,
                      background: 'var(--surface-3)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(mem, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        style={{
                          height: '100%',
                          background: `linear-gradient(90deg, ${memColor}, ${memColor}dd)`,
                          borderRadius: 4,
                          boxShadow: `0 0 10px ${memColor}44`
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ height: 200 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={6} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cpu" name="CPU" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={severityColor(entry.cpu, 60, 80)} />
                  ))}
                </Bar>
                <Bar dataKey="memory" name="Memory" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={severityColor(entry.memory, 65, 85)} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}
    </div>
  );
}
