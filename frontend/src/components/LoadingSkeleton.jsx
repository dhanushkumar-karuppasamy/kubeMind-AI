import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSkeleton = ({ width = '100%', height = '20px', borderRadius = '8px' }) => (
  <motion.div
    animate={{
      backgroundPosition: ['200% 0', '-200% 0'],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    }}
    style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 50%, var(--surface-2) 100%)',
      backgroundSize: '200% 100%',
    }}
  />
);

export const PulseLoader = () => (
  <motion.div
    style={{
      display: 'flex',
      gap: 8,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: 'easeInOut',
        }}
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 10px var(--accent-glow)',
        }}
      />
    ))}
  </motion.div>
);
