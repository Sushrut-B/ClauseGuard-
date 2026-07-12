import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export interface TiltedCardProps {
  containerHeight?: string | number;
  containerWidth?: string | number;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  innerZ?: number; // How much the inner content pops out in 3D space
}

export default function TiltedCard({
  containerHeight = "auto",
  containerWidth = "100%",
  scaleOnHover = 1.05,
  rotateAmplitude = 12,
  children,
  className = "",
  style = {},
  innerZ = 20,
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const rotateYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate rotation mapping (-0.5 to 0.5 mapped to amplitude)
    const rotateX = ((mouseY / height) - 0.5) * -rotateAmplitude;
    const rotateY = ((mouseX / width) - 0.5) * rotateAmplitude;
    
    x.set(rotateX);
    y.set(rotateY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
        height: containerHeight,
        width: containerWidth,
        ...style
      }}
      className={className}
    >
      <motion.div
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: "preserve-3d",
          width: "100%",
          height: "100%",
        }}
        whileHover={{ scale: scaleOnHover }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div 
          style={{ 
            width: "100%", 
            height: "100%", 
            transform: `translateZ(${innerZ}px)` 
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
