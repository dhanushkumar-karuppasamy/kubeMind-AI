import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="about-page">
      {/* Header */}
      <motion.header className="about-header" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Link to="/" className="back-btn">← Back to Dashboard</Link>
        <h1>About KubeMind AI</h1>
        <p className="subtitle">Kubernetes Intelligence Platform | Enterprise Observability & Chaos Engineering</p>
      </motion.header>

      {/* Main Content */}
      <motion.main className="about-content" variants={containerVariants} initial="hidden" animate="visible">

        {/* Overview */}
        <motion.section className="about-section" variants={itemVariants}>
          <h2>Project Overview</h2>
          <p>
            KubeMind AI is an intelligent Kubernetes monitoring and anomaly detection platform that combines real-time metrics collection, AI-powered insights, and chaos engineering to provide complete visibility into cluster health and performance.
          </p>
          <p>
            Built with <strong>FastAPI</strong>, <strong>React</strong>, and <strong>Ollama</strong> LLM integration, KubeMind AI enables DevOps teams to detect, understand, and respond to anomalies before they impact production.
          </p>
        </motion.section>

        {/* Key Features */}
        <motion.section className="about-section" variants={itemVariants}>
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Live Metrics Dashboard</h3>
              <p>Real-time CPU, memory, network, and I/O metrics for all pods with interactive visualizations and trend analysis.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Insights</h3>
              <p>LLM-generated incident summaries and recommendations powered by Ollama. Understand anomalies in plain English.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Chaos Engineering</h3>
              <p>Inject controlled failures (CPU spikes, memory leaks, network bursts) to test resilience and validate incident response.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Dependency Mapping</h3>
              <p>Visual graph of service dependencies and correlations. Quickly identify blast radius and root causes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Predictive Forecasting</h3>
              <p>Forecast CPU and memory usage trends. Get alerts before thresholds are breached.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💚</div>
              <h3>Health Scoring</h3>
              <p>Cluster health grade (A-F) based on anomalies, performance, and reliability metrics. One-glance cluster status.</p>
            </div>
          </div>
        </motion.section>

        {/* Metrics Explained */}
        <motion.section className="about-section" variants={itemVariants}>
          <h2>Metrics Explained</h2>
          <div className="metrics-explained">
            <div className="metric-item">
              <h4>CPU Usage (%)</h4>
              <p>Percentage of CPU core time used by the pod. Spikes above 80% indicate potential performance bottlenecks. Values above 95% risk throttling or pod eviction.</p>
            </div>
            <div className="metric-item">
              <h4>Memory Usage (%)</h4>
              <p>Percentage of memory allocated to the pod. Steady increases indicate memory leaks. Values above 95% risk Out-of-Memory (OOM) kills.</p>
            </div>
            <div className="metric-item">
              <h4>Network In/Out (bytes/sec)</h4>
              <p>Incoming and outgoing network traffic. Sudden spikes may indicate DDoS, data exfiltration, or misconfigured load distribution.</p>
            </div>
            <div className="metric-item">
              <h4>I/O Operations (IOPS)</h4>
              <p>Read and write operations per second. High values indicate disk stress. Sustained high IOPS may indicate runaway processes or database issues.</p>
            </div>
            <div className="metric-item">
              <h4>Health Score (A-F)</h4>
              <p>Composite grade based on anomaly count, pod restarts, and SLA compliance. Grade A = excellent, F = critical issues.</p>
            </div>
            <div className="metric-item">
              <h4>Anomaly Types</h4>
              <p><strong>CPU Spike:</strong> Sudden CPU surge. <strong>Memory Leak:</strong> Gradual memory increase. <strong>Network Burst:</strong> Traffic flood. <strong>I/O Spike:</strong> Disk storm.</p>
            </div>
          </div>
        </motion.section>

        {/* Risks & Alerts */}
        <motion.section className="about-section" variants={itemVariants}>
          <h2>Risk Levels & Alert Strategy</h2>
          <div className="risk-levels">
            <div className="risk-level critical">
              <span className="risk-badge">🚨 CRITICAL</span>
              <p>Pod OOM killer active, CPU throttled, pod restarting. Immediate action required.</p>
            </div>
            <div className="risk-level high">
              <span className="risk-badge">⚠️ HIGH</span>
              <p>CPU > 85%, Memory > 80%, network anomaly. Likely to escalate within minutes.</p>
            </div>
            <div className="risk-level medium">
              <span className="risk-badge">⚡ MEDIUM</span>
              <p>Unusual but not critical. Monitor closely, prepare incident response plan.</p>
            </div>
            <div className="risk-level low">
              <span className="risk-badge">ℹ️ LOW</span>
              <p>Minor performance deviation. Informational only, no action needed.</p>
            </div>
          </div>
        </motion.section>

        {/* Architecture */}
        <motion.section className="about-section" variants={itemVariants}>
          <h2>Architecture</h2>
          <div className="architecture">
            <div className="arch-component">
              <h4>Backend (FastAPI)</h4>
              <p>Collects metrics from Prometheus, runs anomaly detection agents (CPU, Memory, Network, I/O), integrates with Ollama for LLM insights, and exposes REST APIs.</p>
            </div>
            <div className="arch-component">
              <h4>Frontend (React + Framer Motion)</h4>
              <p>Interactive dashboard with real-time data updates, animations, dark/light theme support, and smooth page transitions.</p>
            </div>
            <div className="arch-component">
              <h4>LLM Integration (Ollama)</h4>
              <p>Local LLM service generating human-readable summaries of incidents, dependencies, and recommendations. Runs without external API calls.</p>
            </div>
            <div className="arch-component">
              <h4>Chaos Engine</h4>
              <p>Simulates real-world failures at controlled intervals. Validates runbook effectiveness and tests resilience in safe, predictable manner.</p>
            </div>
          </div>
        </motion.section>

        {/* Technology Stack */}
        <motion.section className="about-section" variants={itemVariants}>
          <h2>Technology Stack</h2>
          <div className="tech-stack">
            <div className="tech-category">
              <h4>Backend</h4>
              <ul>
                <li>FastAPI (Python web framework)</li>
                <li>Prometheus (metrics source)</li>
                <li>Ollama (local LLM)</li>
                <li>Kubernetes (container orchestration)</li>
                <li>NumPy (numerical computations)</li>
              </ul>
            </div>
            <div className="tech-category">
              <h4>Frontend</h4>
              <ul>
                <li>React 19 (UI library)</li>
                <li>Framer Motion (animations)</li>
                <li>Recharts (data visualizations)</li>
                <li>React Router (navigation)</li>
                <li>Cytoscape (dependency graphs)</li>
              </ul>
            </div>
            <div className="tech-category">
              <h4>DevOps</h4>
              <ul>
                <li>Kubernetes YAML manifests</li>
                <li>Docker (containerization)</li>
                <li>Minikube (local K8s)</li>
                <li>PowerShell scripts (automation)</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Getting Started */}
        <motion.section className="about-section" variants={itemVariants}>
          <h2>Quick Start</h2>
          <div className="quick-start">
            <ol>
              <li><strong>Run quick-start:</strong> <code>.\scripts\quick-start.ps1</code></li>
              <li><strong>Open dashboard:</strong> <code>http://localhost:3000</code></li>
              <li><strong>Inject anomalies:</strong> Click "⚡ Inject Now" in Chaos Engine</li>
              <li><strong>View insights:</strong> Check AI Insights panel for LLM-generated analysis</li>
              <li><strong>Stop services:</strong> <code>.\scripts\stop-all.ps1</code></li>
            </ol>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.section className="about-footer" variants={itemVariants}>
          <h3>Built with ❤️ for Kubernetes DevOps</h3>
          <p>© 2026 KubeMind AI · ABB Accelerator Program · FastAPI + React + Ollama</p>
        </motion.section>

      </motion.main>
    </div>
  );
}
