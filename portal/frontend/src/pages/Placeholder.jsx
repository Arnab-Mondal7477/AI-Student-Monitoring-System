import React from 'react';
import { Construction } from 'lucide-react';

const Placeholder = ({ title }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <Construction size={64} style={{ marginBottom: '1.5rem', color: 'var(--primary)' }} />
      <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)' }}>This module is currently under development and will be available in the next release.</p>
    </div>
  );
};

export default Placeholder;
