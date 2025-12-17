import React from 'react';

export const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/40 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl overflow-hidden ${className}`}>
    {children}
  </div>
);
