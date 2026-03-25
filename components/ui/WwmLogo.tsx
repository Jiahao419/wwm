'use client';

/**
 * WWM (Where Winds Meet) game logo
 * Uses the actual game logo image from /images/wwm-logo.png
 */
export default function WwmLogo({ size = 60, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/images/wwm-logo.png"
      alt="燕云十六声"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
