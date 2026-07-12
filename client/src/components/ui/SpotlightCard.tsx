import React, { useRef } from 'react';
import './SpotlightCard.css';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
}

export default function SpotlightCard({ 
  children, 
  className = '', 
  spotlightColor = 'rgba(184, 144, 71, 0.15)',
  onClick
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || !overlayRef.current) return;
    
    // Bypass React state entirely for 60fps buttery smooth performance
    requestAnimationFrame(() => {
      if (!divRef.current || !overlayRef.current) return;
      const rect = divRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      overlayRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, ${spotlightColor}, transparent 40%)`;
    });
  };

  const handleMouseEnter = () => {
    if (overlayRef.current) overlayRef.current.style.opacity = '1';
  };

  const handleMouseLeave = () => {
    if (overlayRef.current) overlayRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`spotlight-card ${className}`}
    >
      <div
        ref={overlayRef}
        className="spotlight-card-overlay"
        style={{ opacity: 0 }}
      />
      <div className="spotlight-card-content">
        {children}
      </div>
    </div>
  );
}
