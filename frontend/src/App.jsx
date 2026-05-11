import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import MetricsPanel    from './components/MetricsPanel';
import DependencyGraph from './components/DependencyGraph';
import InsightsPanel   from './components/InsightsPanel';
import AnomalyTimeline from './components/AnomalyTimeline';
// import CustomCursor from './components/CustomCursor'; // Uncomment for custom cursor
// import ParticleBackground from './components/ParticleBackground'; // Uncomment for particle effect

const API = 'http://localhost:8000';

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <span className="header-time">{t.toLocaleTimeString('en-IN', { hour12: false })}</span>;
}

export default function App() {
  const [metrics,  setMetrics]  = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [graph,    setGraph]    = useState(null);
  const [podCount, setPodCount] = useState(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const r = await fetch(`${API}/api/metrics/current`);
        const d = await r.json();
        setMetrics(d.metrics || {});
        setPodCount(d.pod_count || 0);
      } catch(e) { console.error(e); }
    };
    fetchMetrics();
    const i = setInterval(fetchMetrics, 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const r = await fetch(`${API}/api/anomalies/current`);
        const d = await r.json();
        setAnomalies(d.anomalies || []);
      } catch(e) { console.error(e); }
    };
    fetchAnomalies();
    const i = setInterval(fetchAnomalies, 8000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/dependencies`)
      .then(r => r.json())
      .then(d => setGraph(d))
      .catch(console.error);
  }, []);

  const activeCritical = anomalies.filter(a => a.severity === 'critical').length;

  return (
    <>
      {/* <ParticleBackground /> */} {/* Uncomment for animated particle background */}
      {/* <CustomCursor /> */} {/* Uncomment for custom cursor effect */}
      <div className="app">
      <motion.header 
        className="app-header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="header-left">
          <motion.div 
            className="logo-mark"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            K
          </motion.div>
          <div>
            <div className="app-title">KubeMind AI</div>
            <div className="app-subtitle">Kubernetes Intelligence Platform</div>
          </div>
        </div>
        <div className="header-right">
          <AnimatePresence>
            {activeCritical > 0 && (
              <motion.span 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                style={{
                  fontSize:11,
                  color:'var(--red)',
                  fontWeight:700,
                  background:'var(--red-dim)',
                  padding:'6px 14px',
                  borderRadius:20,
                  border:'1px solid rgba(248,113,113,0.3)',
                  letterSpacing:'0.5px'
                }}
              >
                ⚠ {activeCritical} CRITICAL
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div 
            className="live-badge"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className="live-dot"/>LIVE
          </motion.div>
          <motion.span 
            style={{fontSize:11,color:'var(--text-muted)',fontWeight:600}}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {podCount} pods
          </motion.span>
          <Clock />
        </div>
      </motion.header>

      <main className="app-main">
        {/* Row 1: Full-width metrics */}
        <motion.div 
          className="grid-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MetricsPanel metrics={metrics} />
        </motion.div>

        {/* Row 2: Dependency graph + Insights */}
        <motion.div 
          className="grid-row cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <DependencyGraph graph={graph} />
          <InsightsPanel   anomalies={anomalies} />
        </motion.div>

        {/* Row 3: Timeline */}
        <motion.div 
          className="grid-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AnomalyTimeline apiBase={API} />
        </motion.div>
      </main>

      <motion.footer 
        className="app-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        KubeMind AI · ABB Accelerator 2026 · Built with FastAPI + React + Ollama
      </motion.footer>
    </div>
    </>
  );
}