'use client';

/**
 * Ink splash / brush stroke decorative elements in WWM style
 */

export function InkDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-4 ${className}`}>
      <svg width="300" height="20" viewBox="0 0 300 20" fill="none" className="opacity-30">
        {/* Left brush stroke */}
        <path
          d="M 0 10 Q 30 8, 60 10 Q 80 11, 100 10 Q 120 9, 140 10"
          stroke="#c9a84c"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Center diamond */}
        <path d="M 144 6 L 150 2 L 156 6 L 150 10 Z" fill="#c9a84c" opacity="0.5" />
        <path d="M 144 14 L 150 10 L 156 14 L 150 18 Z" fill="#c9a84c" opacity="0.3" />
        {/* Right brush stroke */}
        <path
          d="M 160 10 Q 180 9, 200 10 Q 220 11, 240 10 Q 270 8, 300 10"
          stroke="#c9a84c"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}

export function InkCorner({ position = 'top-left', size = 80 }: { position?: string; size?: number }) {
  const transform = {
    'top-left': '',
    'top-right': 'scaleX(-1)',
    'bottom-left': 'scaleY(-1)',
    'bottom-right': 'scale(-1)',
  }[position] || '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      style={{ transform }}
      className="opacity-20"
    >
      {/* Corner brush strokes */}
      <path d="M 5 5 L 5 40" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
      <path d="M 5 5 L 40 5" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
      {/* Inner detail */}
      <path d="M 12 12 L 12 30" stroke="#c9a84c" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <path d="M 12 12 L 30 12" stroke="#c9a84c" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      {/* Dot accent */}
      <circle cx="8" cy="8" r="2" fill="#c9a84c" opacity="0.4" />
    </svg>
  );
}

export function BrushStroke({ width = 200, className = '' }: { width?: number; className?: string }) {
  return (
    <svg width={width} height="8" viewBox="0 0 200 8" fill="none" className={className}>
      <path
        d="M 0 4 Q 10 2, 30 3 Q 60 5, 100 4 Q 140 3, 170 5 Q 190 6, 200 4"
        stroke="#c9a84c"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M 20 4 Q 50 2, 100 4 Q 150 6, 180 4"
        stroke="#c9a84c"
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.15"
      />
    </svg>
  );
}
