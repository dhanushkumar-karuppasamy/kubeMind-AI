import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const getPodStatus = (podName, metrics, anomalies) => {
  const podMetrics = metrics[podName] || {};
  const podAnomalies = anomalies.filter((anomaly) => anomaly.pod === podName);
  const hasCriticalAnomaly = podAnomalies.some((anomaly) => anomaly.severity === 'critical');
  const hasWarningAnomaly = podAnomalies.some((anomaly) => ['high', 'medium'].includes(anomaly.severity));
  const cpu = Number(podMetrics.cpu_percent ?? 0);
  const memory = Number(podMetrics.memory_percent ?? 0);
  const restarts = Number(podMetrics.restarts ?? 0);

  if (hasCriticalAnomaly || cpu >= 90 || memory >= 90 || restarts > 1) {
    return { color: 'var(--red)', label: 'critical' };
  }

  if (hasWarningAnomaly || cpu >= 75 || memory >= 80 || restarts === 1) {
    return { color: 'var(--orange)', label: 'warning' };
  }

  return { color: 'var(--green)', label: 'healthy' };
};

const treeVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.05 },
  },
  exit: { opacity: 0, y: -6 },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 320, damping: 26 },
  },
  exit: { opacity: 0, x: -8 },
};

const SidebarItem = ({ active, compact, icon, label, secondary, onClick, statusColor, statusLabel }) => (
  <motion.button
    type="button"
    className={`explorer-item ${active ? 'active' : ''}`}
    onClick={onClick}
    whileHover={{ x: compact ? 0 : 2 }}
    whileTap={{ scale: 0.98 }}
  >
    <span className="explorer-item-icon">{icon}</span>
    <span className="explorer-item-body">
      <span className="explorer-item-row">
        <span className="explorer-item-label">{label}</span>
        {secondary && <span className="explorer-item-secondary">{secondary}</span>}
      </span>
      {statusLabel && (
        <span className="explorer-item-status" style={{ color: statusColor }}>
          <span className="explorer-status-dot" style={{ background: statusColor }} />
          {statusLabel}
        </span>
      )}
    </span>
  </motion.button>
);

export default function ClusterExplorer({
  metrics,
  anomalies,
  selectedPod,
  onSelectPod,
  collapsed,
  onToggleCollapsed,
}) {
  const [clusterOpen, setClusterOpen] = useState(true);
  const [namespaceOpen, setNamespaceOpen] = useState(true);

  const pods = useMemo(() => Object.keys(metrics || {}), [metrics]);

  return (
    <motion.aside
      className={`cluster-explorer ${collapsed ? 'collapsed' : 'expanded'}`}
      animate={{ width: collapsed ? 56 : 216 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <div className="cluster-explorer-inner">
        <div className="cluster-explorer-topbar">
          <button
            type="button"
            className="cluster-toggle"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand cluster explorer' : 'Collapse cluster explorer'}
          >
            {collapsed ? '☰' : '◀'}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                className="cluster-explorer-title"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className="cluster-explorer-heading">Cluster Explorer</div>
                <div className="cluster-explorer-subheading">minikube · kubemind-demo</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="cluster-explorer-tree">
          <motion.button
            type="button"
            className="explorer-node explorer-node-root"
            onClick={() => setClusterOpen((prev) => !prev)}
            whileTap={{ scale: 0.99 }}
          >
            <span className="explorer-node-chevron">{clusterOpen ? '▾' : '▸'}</span>
            <span className="explorer-node-icon">⎈</span>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  className="explorer-node-label"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                >
                  Cluster: minikube
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence initial={false}>
            {clusterOpen && (
              <motion.div
                className="explorer-branch"
                variants={treeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.button
                  type="button"
                  className="explorer-node explorer-node-namespace"
                  onClick={() => setNamespaceOpen((prev) => !prev)}
                  variants={itemVariants}
                >
                  <span className="explorer-node-chevron">{namespaceOpen ? '▾' : '▸'}</span>
                  <span className="explorer-node-icon">▣</span>
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        className="explorer-node-label"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                      >
                        Namespace: kubemind-demo
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <AnimatePresence initial={false}>
                  {namespaceOpen && (
                    <motion.div
                      className="explorer-branch explorer-branch-leaf"
                      variants={treeVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <motion.button
                        type="button"
                        className={`explorer-all-pods ${!selectedPod ? 'active' : ''}`}
                        onClick={() => onSelectPod(null)}
                        variants={itemVariants}
                      >
                        <span className="explorer-node-icon">◎</span>
                        <AnimatePresence initial={false}>
                          {!collapsed && (
                            <motion.span
                              className="explorer-node-label"
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                            >
                              All Pods
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      <div className="explorer-pod-list">
                        {pods.map((podName) => {
                          const status = getPodStatus(podName, metrics, anomalies);
                          const active = selectedPod === podName;

                          return (
                            <motion.div key={podName} variants={itemVariants}>
                              <SidebarItem
                                active={active}
                                compact={collapsed}
                                icon={collapsed ? '◉' : '▸'}
                                label={podName}
                                secondary={!collapsed ? 'Pod' : null}
                                onClick={() => onSelectPod(podName)}
                                statusColor={status.color}
                                statusLabel={collapsed ? null : status.label}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}