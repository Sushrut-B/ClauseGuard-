
import './ShinyText.css';

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: 'normal' | 'fast';
}

export default function ShinyText({ text, className = '', speed = 'normal' }: ShinyTextProps) {
  return (
    <span className={`shiny-text ${speed === 'fast' ? 'fast' : ''} ${className}`}>
      {text}
    </span>
  );
}
