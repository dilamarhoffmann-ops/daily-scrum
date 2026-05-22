import React from 'react';

const ScrumCard = ({ children, className = "" }) => (
  <div className={`glass-card p-8 ${className}`}>
    {children}
  </div>
);

export default ScrumCard;
