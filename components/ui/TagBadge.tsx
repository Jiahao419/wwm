interface TagBadgeProps {
  tag: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function TagBadge({ tag, active = false, onClick, size = 'md' }: TagBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      onClick={onClick}
      className={`
        inline-block rounded-full border transition-all duration-200
        ${sizeClasses}
        ${onClick ? 'cursor-pointer' : ''}
        ${active
          ? 'bg-gold/20 border-gold/60 text-gold'
          : 'bg-bg-card border-gold/10 text-text-secondary hover:border-gold/30 hover:text-gold/80'
        }
      `}
    >
      {tag}
    </span>
  );
}
