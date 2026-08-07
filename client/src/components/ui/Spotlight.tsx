import { useRef, useState, useEffect } from 'react';

interface SpotlightProps {
  isDragging: boolean;
}

export default function Spotlight({ isDragging }: SpotlightProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | DragEvent) => {
      if (!divRef.current || !divRef.current.parentElement) return;

      const parent = divRef.current.parentElement;
      const rect = parent.getBoundingClientRect();
      
      setPosition({
        x: (e as MouseEvent).clientX - rect.left,
        y: (e as MouseEvent).clientY - rect.top,
      });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    const parent = divRef.current?.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove as any);
      parent.addEventListener('dragover', handleMouseMove as any);
      parent.addEventListener('mouseenter', handleMouseEnter);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove as any);
        parent.removeEventListener('dragover', handleMouseMove as any);
        parent.removeEventListener('mouseenter', handleMouseEnter);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  // When dragging, we want the spotlight to be fully visible and wider
  const currentOpacity = isDragging ? 1 : opacity;
  const radius = isDragging ? 800 : 400;
  const intensity = isDragging ? 0.2 : 0.12;

  return (
    <div
      ref={divRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        transition: 'opacity 0.5s ease',
        opacity: currentOpacity,
        background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, rgba(184, 144, 71, ${intensity}), transparent 40%)`
      }}
    />
  );
}
