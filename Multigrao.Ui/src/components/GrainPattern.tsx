interface GrainPatternProps {
  className?: string;
  opacity?: number;
  color?: string;
  animated?: boolean;
}

export default function GrainPattern({ className = '', opacity = 0.08, color = 'currentColor', animated = false }: GrainPatternProps) {
  const patternId = `grain-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      className={`absolute pointer-events-none ${animated ? 'grain-animate' : ''} ${className}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        <pattern id={patternId} x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
          <g transform="translate(20, 25) rotate(-20)">
            <ellipse cx="0" cy="0" rx="12" ry="7" fill="none" stroke={color} strokeWidth="1.2" />
            <line x1="-8" y1="0" x2="8" y2="0" stroke={color} strokeWidth="0.6" />
            <ellipse cx="-4" cy="-1" rx="4" ry="5" fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" />
            <ellipse cx="4" cy="1" rx="4" ry="5" fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" />
          </g>

          <g transform="translate(110, 15) rotate(10)">
            <line x1="0" y1="0" x2="0" y2="40" stroke={color} strokeWidth="1" />
            <ellipse cx="-4" cy="5" rx="2.5" ry="5.5" fill="none" stroke={color} strokeWidth="0.8" transform="rotate(-25 -4 5)" />
            <ellipse cx="4" cy="10" rx="2.5" ry="5.5" fill="none" stroke={color} strokeWidth="0.8" transform="rotate(25 4 10)" />
            <ellipse cx="-4" cy="15" rx="2.5" ry="5.5" fill="none" stroke={color} strokeWidth="0.8" transform="rotate(-25 -4 15)" />
            <ellipse cx="4" cy="20" rx="2.5" ry="5.5" fill="none" stroke={color} strokeWidth="0.8" transform="rotate(25 4 20)" />
            <ellipse cx="-4" cy="25" rx="2.5" ry="5.5" fill="none" stroke={color} strokeWidth="0.8" transform="rotate(-25 -4 25)" />
            <ellipse cx="4" cy="30" rx="2.5" ry="5.5" fill="none" stroke={color} strokeWidth="0.8" transform="rotate(25 4 30)" />
            <ellipse cx="0" cy="0" rx="2" ry="4" fill="none" stroke={color} strokeWidth="0.8" />
          </g>

          <g transform="translate(60, 100)">
            <path d="M0,18 Q9,0 18,18 Q9,12 0,18Z" fill="none" stroke={color} strokeWidth="1" />
            <line x1="9" y1="3" x2="9" y2="18" stroke={color} strokeWidth="0.5" />
            <line x1="5" y1="8" x2="9" y2="12" stroke={color} strokeWidth="0.3" />
            <line x1="13" y1="8" x2="9" y2="12" stroke={color} strokeWidth="0.3" />
          </g>

          <g transform="translate(130, 80) rotate(35)">
            <ellipse cx="0" cy="0" rx="8" ry="5" fill="none" stroke={color} strokeWidth="1" />
            <line x1="-5" y1="0" x2="5" y2="0" stroke={color} strokeWidth="0.5" />
          </g>

          <g transform="translate(10, 130) rotate(-15)">
            <path d="M0,14 Q7,0 14,14 Q7,9 0,14Z" fill="none" stroke={color} strokeWidth="0.9" />
            <line x1="7" y1="2" x2="7" y2="14" stroke={color} strokeWidth="0.4" />
          </g>

          <g transform="translate(85, 50) rotate(-8)">
            <line x1="0" y1="0" x2="0" y2="24" stroke={color} strokeWidth="0.8" />
            <ellipse cx="-3" cy="4" rx="2" ry="4" fill="none" stroke={color} strokeWidth="0.6" transform="rotate(-20 -3 4)" />
            <ellipse cx="3" cy="8" rx="2" ry="4" fill="none" stroke={color} strokeWidth="0.6" transform="rotate(20 3 8)" />
            <ellipse cx="-3" cy="12" rx="2" ry="4" fill="none" stroke={color} strokeWidth="0.6" transform="rotate(-20 -3 12)" />
            <ellipse cx="3" cy="16" rx="2" ry="4" fill="none" stroke={color} strokeWidth="0.6" transform="rotate(20 3 16)" />
            <ellipse cx="0" cy="0" rx="1.5" ry="3" fill="none" stroke={color} strokeWidth="0.6" />
          </g>

          <circle cx="45" cy="55" r="3.5" fill="none" stroke={color} strokeWidth="0.8" />
          <circle cx="45" cy="55" r="1.2" fill={color} fillOpacity="0.3" />
          <circle cx="145" cy="130" r="2.5" fill="none" stroke={color} strokeWidth="0.7" />
          <circle cx="145" cy="130" r="0.8" fill={color} fillOpacity="0.25" />
          <circle cx="30" cy="80" r="2" fill="none" stroke={color} strokeWidth="0.6" />

          <g transform="translate(130, 145) rotate(20)">
            <path d="M0,10 Q5,0 10,10 Q5,6 0,10Z" fill="none" stroke={color} strokeWidth="0.7" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
