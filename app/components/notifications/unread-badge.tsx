'use client';

interface UnreadBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'notification';
  className?: string;
  showZero?: boolean;
}

export function UnreadBadge({ 
  count, 
  maxCount = 99, 
  size = 'md', 
  variant = 'default',
  className = '',
  showZero = false
}: UnreadBadgeProps) {
  if (count === 0 && !showZero) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4 text-xs min-w-[16px]';
      case 'lg':
        return 'h-7 w-7 text-sm min-w-[28px]';
      default:
        return 'h-5 w-5 text-xs min-w-[20px]';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'notification':
        return 'bg-orange-500 text-white border-2 border-white';
      default:
        return 'bg-red-500 text-white border-2 border-white';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center 
        rounded-full font-medium
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${className}
      `}
      title={`${count} unread ${count === 1 ? 'message' : 'messages'}`}
    >
      {displayCount}
    </span>
  );
}

// Floating Badge Component (for positioning over other elements)
interface FloatingUnreadBadgeProps extends UnreadBadgeProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function FloatingUnreadBadge({ 
  position = 'top-right', 
  ...props 
}: FloatingUnreadBadgeProps) {
  if (props.count === 0 && !props.showZero) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'absolute -top-1 -left-1';
      case 'bottom-right':
        return 'absolute -bottom-1 -right-1';
      case 'bottom-left':
        return 'absolute -bottom-1 -left-1';
      default:
        return 'absolute -top-1 -right-1';
    }
  };

  return (
    <UnreadBadge
      {...props}
      className={`${getPositionClasses()} ${props.className || ''}`}
    />
  );
}

// Pulsing Badge for active notifications
interface PulsingUnreadBadgeProps extends UnreadBadgeProps {
  isPulsing?: boolean;
}

export function PulsingUnreadBadge({ isPulsing = false, ...props }: PulsingUnreadBadgeProps) {
  const pulseClass = isPulsing ? 'animate-pulse' : '';
  
  return (
    <UnreadBadge
      {...props}
      className={`${pulseClass} ${props.className || ''}`}
    />
  );
}
