'use client';

import { ButtonHTMLAttributes } from 'react';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function GoldButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: GoldButtonProps) {
  const base = 'relative overflow-hidden font-title tracking-wider transition-all duration-300 cursor-pointer';

  const variants = {
    primary: 'bg-gradient-to-r from-gold-dark to-gold text-bg-primary hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] shimmer-btn',
    secondary: 'border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold',
    ghost: 'text-text-secondary hover:text-gold',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
