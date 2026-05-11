import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import cytoscape from 'cytoscape';

export default function DependencyGraph({ graph }) {
  const cyRef = useRef(null);
  const cyInstance = useRef(null);

  useEffect(() => {
    if (!graph || !cyRef.current) return;

    if (cyInstance.current) cyInstance.current.destroy();

    const colorMap = { 
      green: '#4ade80', 
      red: '#f87171', 
      orange: '#fb923c' 
    };

    cyInstance.current = cytoscape({
      container: cyRef.current,
      elements: [
        ...graph.nodes.map(n => ({
          data: { id: n.id, label: n.label, color: colorMap[n.color] || '#8b8b9e' }
        })),
        ...graph.edges.map(e => ({
          data: { source: e.source, target: e.target }
        }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#f0f0f5',
            'font-size': '12px',
            'font-family': 'Inter, sans-serif',
            'font-weight': '700',
            'text-valign': 'bottom',
            'text-margin-y': '8px',
            'text-outline-color': '#0a0a0f',
            'text-outline-width': '3px',
            'width': '48px',
            'height': '48px',
            'border-width': '3px',
            'border-color': 'data(color)',
            'border-opacity': '0.5',
            'transition-property': 'background-color, border-color, border-width',
            'transition-duration': '0.3s',
          }
        },
        {
          selector: 'node:hover',
          style: {
            'border-width': '4px',
            'border-opacity': '0.8',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'rgba(255,255,255,0.15)',
            'target-arrow-color': 'rgba(255,255,255,0.3)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1,
            'transition-property': 'line-color, width',
            'transition-duration': '0.3s',
          }
        },
        {
          selector: 'edge:hover',
          style: {
            'line-color': 'rgba(255,167,38,0.5)',
            'width': 3,
          }
        },
        {
          selector: 'node:active',
          style: { 'overlay-opacity': 0 }
        }
      ],
      layout: { 
        name: 'breadthfirst', 
        directed: true, 
        spacingFactor: 1.8, 
        padding: 30,
        animate: true,
        animationDuration: 500,
        animationEasing: 'ease-out'
      },
      userZoomingEnabled: false,
      userPanningEnabled: false,
      boxSelectionEnabled: false,
    });

    return () => { if (cyInstance.current) cyInstance.current.destroy(); };
  }, [graph]);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Service Dependencies</span>
        <motion.span 
          className="card-badge"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          live
        </motion.span>
      </div>

      {/* Legend */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{display:'flex',gap:20,marginBottom:16,flexWrap:'wrap'}}
      >
        {[
          ['var(--green)','Healthy'],
          ['var(--orange)','High CPU'],
          ['var(--red)','Restarted']
        ].map(([c,l], i)=>(
          <motion.div 
            key={l} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            style={{
              display:'flex',
              alignItems:'center',
              gap:7,
              fontSize:11,
              color:'var(--text-muted)',
              fontWeight:600
            }}
          >
            <motion.div 
              whileHover={{ scale: 1.3 }}
              style={{
                width:10,
                height:10,
                borderRadius:'50%',
                background:c,
                boxShadow: `0 0 10px ${c}88`
              }}
            />
            {l}
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        ref={cyRef} 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          height: 280,
          background: 'var(--surface-2)',
          backdropFilter: 'blur(10px)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.3,
          pointerEvents: 'none'
        }}/>
      </motion.div>
    </div>
  );
}
