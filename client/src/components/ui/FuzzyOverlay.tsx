import React from 'react';
import './FuzzyOverlay.css';

interface FuzzyOverlayProps {
  active?: boolean;
}

export default function FuzzyOverlay({ active = false }: FuzzyOverlayProps) {
  return (
    <div className={`fuzzy-overlay ${active ? 'active' : ''}`} />
  );
}
