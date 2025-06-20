import React from 'react';
import { 
  BadgeProps, 
  BadgeGroupProps, 
  StatusBadgeProps, 
  CountBadgeProps, 
  NotificationBadgeProps 
} from './Badge.types';
import { cn } from '@/utils/classNames';

/**
 * 基础Badge组件
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  pill = false,
  dot = false,
  outline = false,
  removable = false,
  onRemove,
  leftIcon,
  rightIcon,
  className,
  onClick,
  disabled = false,
  ...props
}) => {
  // 基础样式类
  const baseClasses = 'inline-flex items-center font-medium transition-colors duration-200';
  
  // 尺寸样式
  const sizeClasses = {
    sm: dot ? 'w-2 h-2' : 'px-2 py-0.5 text-xs',
    md: dot ? 'w-2.5 h-2.5' : 'px-2.5 py-0.5 text-sm',
    lg: dot ? 'w-3 h-3' : 'px-3 py-1 text-sm'
  };

  // 圆角样式
  const roundedClasses = pill || dot ? 'rounded-full' : 'rounded-md';

  // 变体样式
  const variantClasses = {
    default: outline 
      ? 'text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-50'
      : 'text-gray-800 bg-gray-100 hover:bg-gray-200',
    primary: outline
      ? 'text-primary-700 bg-transparent border border-primary-300 hover:bg-primary-50'
      : 'text-primary-800 bg-primary-100 hover:bg-primary-200',
    secondary: outline
      ? 'text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-50'
      : 'text-gray-800 bg-gray-200 hover:bg-gray-300',
    success: outline
      ? 'text-green-700 bg-transparent border border-green-300 hover:bg-green-50'
      : 'text-green-800 bg-green-100 hover:bg-green-200',
    warning: outline
      ? 'text-yellow-700 bg-transparent border border-yellow-300 hover:bg-yellow-50'
      : 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200',
    error: outline
      ? 'text-red-700 bg-transparent border border-red-300 hover:bg-red-50'
      : 'text-red-800 bg-red-100 hover:bg-red-200',
    info: outline
      ? 'text-blue-700 bg-transparent border border-blue-300 hover:bg-blue-50'
      : 'text-blue-800 bg-blue-100 hover:bg-blue-200'
  };

  // 禁用样式
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : onClick 
    ? 'cursor-pointer' 
    : '';

  // 点击处理
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  // 移除处理
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onRemove) {
      onRemove();
    }
  };

  // 如果是点状指示器，只显示圆点
  if (dot) {
    return (
      <span
        className={cn(
          baseClasses,
          sizeClasses[size],
          roundedClasses,
          variantClasses[variant],
          disabledClasses,
          className
        )}
        onClick={handleClick}
        {...props}
      />
    );
  }

  return (
    <span
      className={cn(
        baseClasses,
        sizeClasses[size],
        roundedClasses,
        variantClasses[variant],
        disabledClasses,
        'gap-1',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {leftIcon && (
        <span className="flex-shrink-0">
          {leftIcon}
        </span>
      )}
      
      <span className="truncate">
        {children}
      </span>
      
      {rightIcon && !removable && (
        <span className="flex-shrink-0">
          {rightIcon}
        </span>
      )}
      
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="flex-shrink-0 ml-0.5 h-4 w-4 rounded-full hover:bg-black hover:bg-opacity-10 focus:outline-none focus:bg-black focus:bg-opacity-10 transition-colors"
          aria-label="移除标签"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </span>
  );
};

/**
 * 状态Badge组件
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showText = true,
  statusText,
  children,
  ...props
}) => {
  const statusConfig = {
    online: { variant: 'success', text: '在线', color: 'bg-green-500' },
    offline: { variant: 'default', text: '离线', color: 'bg-gray-400' },
    away: { variant: 'warning', text: '离开', color: 'bg-yellow-500' },
    busy: { variant: 'error', text: '忙碌', color: 'bg-red-500' },
    pending: { variant: 'warning', text: '待处理', color: 'bg-yellow-500' },
    approved: { variant: 'success', text: '已通过', color: 'bg-green-500' },
    rejected: { variant: 'error', text: '已拒绝', color: 'bg-red-500' }
  } as const;

  const config = statusConfig[status];
  const displayText = statusText || config.text;

  return (
    <Badge
      variant={config.variant as any}
      leftIcon={
        <span className={cn('w-2 h-2 rounded-full', config.color)} />
      }
      {...props}
    >
      {showText ? displayText : children}
    </Badge>
  );
};

/**
 * 计数Badge组件
 */
export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  overflowText = '+',
  showZero = false,
  ...props
}) => {
  // 不显示零值且计数为0时不渲染
  if (!showZero && count === 0) {
    return null;
  }

  // 处理超出最大值的显示
  const displayCount = count > max ? `${max}${overflowText}` : count.toString();

  return (
    <Badge variant="error" size="sm" pill {...props}>
      {displayCount}
    </Badge>
  );
};

/**
 * 通知Badge组件（用于叠加在其他元素上）
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  show = true,
  content,
  offset = [0, 0],
  children,
  ...props
}) => {
  if (!show) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      {children}
      <span
        className="absolute z-10"
        style={{
          top: offset[1],
          right: offset[0],
          transform: 'translate(50%, -50%)'
        }}
      >
        {content || <Badge variant="error" size="sm" pill dot {...props}>{''}</Badge>}
      </span>
    </div>
  );
};

/**
 * Badge组合组件
 */
export const BadgeGroup: React.FC<BadgeGroupProps> = ({
  badges,
  max,
  overflowText = '...',
  spacing = 'md',
  className,
  ...props
}) => {
  const spacingClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  };

  // 处理显示数量限制
  const displayBadges = max ? badges.slice(0, max) : badges;
  const hasOverflow = max && badges.length > max;
  const overflowCount = badges.length - max!;

  return (
    <div 
      className={cn('flex flex-wrap items-center', spacingClasses[spacing], className)}
      {...props}
    >
      {displayBadges.map((badge, index) => {
        if (typeof badge === 'string') {
          return (
            <Badge key={index} variant="default">
              {badge}
            </Badge>
          );
        }
        return <Badge key={index} {...badge} />;
      })}
      
      {hasOverflow && (
        <Badge variant="default" size="sm">
          +{overflowCount}
        </Badge>
      )}
    </div>
  );
};

export default Badge; 