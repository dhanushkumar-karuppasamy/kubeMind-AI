// PATH: frontend/src/App.jsx — MAIN ROUTER + THEME WRAPPER

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import MetricsPanel          from './components/MetricsPanel';
import DependencyGraph       from './components/DependencyGraph';
import InsightsPanel         from './components/InsightsPanel';
import AnomalyTimeline       from './components/AnomalyTimeline';
import HealthScore           from './components/HealthScore';
import RecommendationsPanel  from './components/RecommendationsPanel';
import ForecastPanel         from './components/ForecastPanel';
import CorrelationMatrix     from './components/CorrelationMatrix';
import ChaosControl          from './components/ChaosControl';
import ActivityFeed          from './components/ActivityFeed';
import About                 from './pages/About';

const API = 'http://localhost:8000';

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="header-time">
      {t.toLocaleTimeString('en-IN', { hour12: false })}
    </span>
  );
}

function Dashboard() {
  const [metrics,   setMetrics]   = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [graph,     setGraph]     = useState(null);
  const [podCount,  setPodCount]  = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [backendOk,  setBackendOk]  = useState(true);

  // Metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const r = await fetch(`${API}/api/metrics/current`);
        const d = await r.json();
        setMetrics(d.metrics || {});
        setPodCount(d.pod_count || 0);
        setBackendOk(true);
      } catch (e) {
        console.error(e);
        setBackendOk(false);
      }
    };
    fetchMetrics();
    const i = setInterval(fetchMetrics, 5000);
    return () => clearInterval(i);
  }, []);

  // Anomalies
  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const r = await fetch(`${API}/api/anomalies/current`);
        const d = await r.json();
        setAnomalies(d.anomalies || []);
      } catch (e) { console.error(e); }
    };
    fetchAnomalies();
    const i = setInterval(fetchAnomalies, 8000);
    return () => clearInterval(i);
  }, []);

  // Dependency graph (one-time + every 30s)
  useEffect(() => {
    const fetchGraph = () =>
      fetch(`${API}/api/dependencies`)
        .then(r => r.json())
        .then(d => setGraph(d))
        .catch(console.error);
    fetchGraph();
    const i = setInterval(fetchGraph, 30000);
    return () => clearInterval(i);
  }, []);

  // Global refresh key for child panels (triggers their own refetch)
  useEffect(() => {
    const i = setInterval(() => setRefreshKey(k => k + 1), 10000);
    return () => clearInterval(i);
  }, []);

  const activeCritical = anomalies.filter(a => a.severity === 'critical').length;
  const highCpuPods    = Object.values(metrics).filter(m => m.cpu_percent > 80).length;

  return (
    <>
      <div className="app">

        {/* ── Header ── */}
        <motion.header
          className="app-header"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="header-left">
            <motion.div
              className="logo-mark"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              K
            </motion.div>
            <div>
              <div className="app-title">KubeMind AI</div>
              <div className="app-subtitle">Kubernetes Intelligence Platform</div>
            </div>
          </div>

          <div className="header-right">
            {!backendOk && (
              <span className="header-error">⚠ Backend offline</span>
            )}

            <AnimatePresence>
              {activeCritical > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  style={{
                    fontSize: 11, color: 'var(--red)', fontWeight: 700,
                    background: 'var(--red-dim)', padding: '6px 14px',
                    borderRadius: 20, border: '1px solid rgba(248,113,113,0.3)',
                    letterSpacing: '0.5px',
                  }}
                >
                  ⚠ {activeCritical} CRITICAL
                </motion.span>
              )}
            </AnimatePresence>

            {highCpuPods > 0 && (
              <span style={{
                fontSize: 11, color: 'var(--orange)', fontWeight: 700,
                background: 'var(--orange-dim)', padding: '6px 14px',
                borderRadius: 20, border: '1px solid rgba(251,146,60,0.3)',
              }}>
                🔥 {highCpuPods} HIGH CPU
              </span>
            )}

            <motion.div
              className="live-badge"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <span className="live-dot" />LIVE
            </motion.div>

            <motion.span
              style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {podCount} pods
            </motion.span>

            <Clock />

            {/* About Button */}
            <motion.a
              href="/about"
              className="header-about-btn"
              whileHover={{ scale: 1.05, backgroundColor: 'var(--accent)' }}
              whileTap={{ scale: 0.95 }}
              style={{
                fontSize: 12,
                color: 'var(--text)',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid var(--border)',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-block',
              }}
            >
              ⓘ About
            </motion.a>
          </div>
        </motion.header>

        {/* ── Main ── */}
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

          {/* Row 2: Dependency graph (2/3) + Right column (1/3) */}
          <motion.div
            className="grid-row cols-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <DependencyGraph graph={graph} />

            {/* Right column stacks InsightsPanel + HealthScore */}
            <div className="col-stack">
              <InsightsPanel anomalies={anomalies} />
              <HealthScore key={`hs-${refreshKey}`} apiBase={API} />
            </div>
          </motion.div>

          {/* Row 3: Forecast (1/2) + Correlation (1/2) */}
          <motion.div
            className="grid-row cols-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <ForecastPanel    key={`fp-${refreshKey}`} apiBase={API} />
            <CorrelationMatrix key={`cm-${refreshKey}`} apiBase={API} />
          </motion.div>

          {/* Row 4: Timeline (full width) */}
          <motion.div
            className="grid-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AnomalyTimeline apiBase={API} />
          </motion.div>

          {/* Row 5: ChaosControl (1/3) + ActivityFeed (2/3) */}
          <motion.div
            className="grid-row cols-chaos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <ChaosControl  key={`cc-${refreshKey}`} apiBase={API} />
            <ActivityFeed  key={`af-${refreshKey}`} apiBase={API} />
          </motion.div>

          {/* Row 6: Recommendations (full width) */}
          <motion.div
            className="grid-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <RecommendationsPanel key={`rp-${refreshKey}`} apiBase={API} />
          </motion.div>

        </main>

        {/* ── Footer ── */}
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

// ============ APP CONTENT (with theme toggle) ============
function AppContent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            <Dashboard />
          } />
          <Route path="/about" element={
            <About />
          } />
        </Routes>
      </AnimatePresence>

      {/* Theme Toggle Button - Fixed position */}
      <motion.button
        className="theme-toggle"
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </motion.button>
    </>
  );
}

// ============ MAIN APP (with Router + ThemeProvider) ============
export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}