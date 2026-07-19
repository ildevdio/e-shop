import { useState, useEffect, useCallback } from 'react';

interface FloatingProductsProps {
  className?: string;
  count?: number;
}

const PRODUCTS = [
  // Trigo — espiga minimalista
  (key: number) => (
    <svg key={key} viewBox="0 0 60 160" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <line x1="30" y1="20" x2="30" y2="155" strokeWidth="1.2" />
      <ellipse cx="22" cy="28" rx="6" ry="14" transform="rotate(-18 22 28)" />
      <ellipse cx="38" cy="42" rx="6" ry="14" transform="rotate(18 38 42)" />
      <ellipse cx="22" cy="56" rx="6" ry="14" transform="rotate(-18 22 56)" />
      <ellipse cx="38" cy="70" rx="6" ry="14" transform="rotate(18 38 70)" />
      <ellipse cx="22" cy="84" rx="6" ry="14" transform="rotate(-18 22 84)" />
      <ellipse cx="38" cy="98" rx="5" ry="11" transform="rotate(18 38 98)" />
      <ellipse cx="22" cy="110" rx="4" ry="8" transform="rotate(-15 22 110)" />
      <ellipse cx="30" cy="20" rx="4" ry="7" />
    </svg>
  ),
  // Amendoim — forma orgânica
  (key: number) => (
    <svg key={key} viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <ellipse cx="60" cy="40" rx="52" ry="26" />
      <path d="M22,30 Q38,20 60,38 Q82,56 98,46" strokeWidth="0.8" opacity="0.4" />
      <ellipse cx="38" cy="34" rx="18" ry="20" strokeWidth="0.8" opacity="0.3" />
      <ellipse cx="82" cy="46" rx="18" ry="20" strokeWidth="0.8" opacity="0.3" />
    </svg>
  ),
  // Pimenta
  (key: number) => (
    <svg key={key} viewBox="0 0 50 90" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <path d="M25,8 Q38,20 40,45 Q42,65 30,82 Q25,88 20,82 Q8,65 10,45 Q12,20 25,8Z" />
      <path d="M25,8 Q28,4 25,2 Q22,4 25,8" strokeWidth="1.2" />
      <line x1="25" y1="18" x2="25" y2="60" strokeWidth="0.6" opacity="0.4" />
    </svg>
  ),
  // Cravo da Índia
  (key: number) => (
    <svg key={key} viewBox="0 0 50 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <line x1="25" y1="30" x2="25" y2="95" strokeWidth="1.2" />
      <circle cx="25" cy="22" r="12" />
      <circle cx="25" cy="22" r="5" strokeWidth="0.8" opacity="0.4" />
      <line x1="25" y1="10" x2="25" y2="5" strokeWidth="1.2" />
      <line x1="18" y1="14" x2="14" y2="10" strokeWidth="0.8" />
      <line x1="32" y1="14" x2="36" y2="10" strokeWidth="0.8" />
    </svg>
  ),
  // Alho
  (key: number) => (
    <svg key={key} viewBox="0 0 80 90" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <path d="M40,12 Q55,8 60,20 Q65,35 58,50 Q52,62 40,70 Q28,62 22,50 Q15,35 20,20 Q25,8 40,12Z" />
      <path d="M40,12 L40,70" strokeWidth="0.6" opacity="0.3" />
      <path d="M30,20 Q32,40 35,65" strokeWidth="0.5" opacity="0.25" />
      <path d="M50,20 Q48,40 45,65" strokeWidth="0.5" opacity="0.25" />
      <path d="M38,10 Q40,4 42,10" strokeWidth="1" />
    </svg>
  ),
  // Folha de ervas
  (key: number) => (
    <svg key={key} viewBox="0 0 60 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
      <path d="M30,95 Q6,60 10,30 Q14,5 30,2 Q46,5 50,30 Q54,60 30,95Z" />
      <line x1="30" y1="12" x2="30" y2="90" strokeWidth="0.8" />
      <line x1="30" y1="30" x2="18" y2="50" strokeWidth="0.5" opacity="0.4" />
      <line x1="30" y1="30" x2="42" y2="50" strokeWidth="0.5" opacity="0.4" />
      <line x1="30" y1="50" x2="20" y2="68" strokeWidth="0.5" opacity="0.4" />
      <line x1="30" y1="50" x2="40" y2="68" strokeWidth="0.5" opacity="0.4" />
    </svg>
  ),
];

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function FloatingProducts({ className = '' }: FloatingProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  const pickNewPosition = useCallback(() => {
    const x = 15 + seededRandom(Date.now() + Math.random()) * 55;
    const y = 15 + seededRandom(Date.now() + Math.random() + 999) * 55;
    return { x, y };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => {
        if (prev === 'in') return 'hold';
        if (prev === 'hold') return 'out';
        return 'in';
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase === 'out') {
      const timeout = setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % PRODUCTS.length);
        setPosition(pickNewPosition());
        setPhase('in');
      }, 2000);
      return () => clearTimeout(timeout);
    }
    if (phase === 'in') {
      setPosition(pickNewPosition());
    }
  }, [phase, currentIndex, pickNewPosition]);

  const ProductSvg = PRODUCTS[currentIndex];

  const getOpacity = () => {
    if (phase === 'in') return 'opacity-1';
    if (phase === 'hold') return 'opacity-1';
    return 'opacity-0';
  };

  const getTransform = () => {
    if (phase === 'in') return 'scale(0.85)';
    if (phase === 'hold') return 'scale(1)';
    return 'scale(1.05)';
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div
        className={`absolute text-white/[0.06] transition-all ease-in-out ${getOpacity()}`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: `translate(-50%, -50%) ${getTransform()}`,
          transitionDuration: phase === 'out' ? '2000ms' : '1800ms',
          width: '280px',
          height: '280px',
        }}
      >
        {ProductSvg(currentIndex)}
      </div>
    </div>
  );
}
