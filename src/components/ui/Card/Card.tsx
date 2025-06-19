import React, { forwardRef } from 'react';
import { CardProps } from './Card.types';
import { cn, createVariants } from '@/utils/classNames';

/**
 * 卡片变体样式配置
 */
const cardVariants = createVariants({
  base: [
    'relative flex flex-col',
    'transition-all duration-200',
    'focus-within:outline-2 focus-within:outline-offset-2',
  ].join(' '),
  variants: {
    variant: {
      default: [
        'bg-white border border-gray-200',
        'shadow-sm',
      ].join(' '),
      outlined: [
        'bg-white border-2 border-gray-300',
        'shadow-none',
      ].join(' '),
      elevated: [
        'bg-white border border-gray-100',
        'shadow-lg',
      ].join(' '),
      filled: [
        'bg-gray-50 border border-gray-200',
        'shadow-none',
      ].join(' '),
    },
    size: {
      sm: 'p-4 gap-3 rounded-md',
      md: 'p-6 gap-4 rounded-lg',
      lg: 'p-8 gap-6 rounded-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

/**
 * Loading Skeleton 组件
 */
const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse space-y-4', className)}>
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
    </div>
    <div className="h-8 bg-gray-200 rounded w-1/3" />
  </div>
);

/**
 * Card 组件
 * 
 * 功能特性：
 * - 支持多种变体：default、outlined、elevated、filled
 * - 支持多种尺寸：sm、md、lg
 * - 支持可点击和悬停效果
 * - 支持加载状态
 * - 支持标题、描述、头部、底部内容
 * - 完全可定制的样式
 * - 无障碍友好设计
 * 
 * @example
 * ```tsx
 * <Card title="卡片标题" description="卡片描述">
 *   卡片内容
 * </Card>
 * 
 * <Card variant="elevated" hoverable clickable>
 *   可交互的卡片
 * </Card>
 * 
 * <Card 
 *   header={<CustomHeader />}
 *   footer={<CustomFooter />}
 * >
 *   自定义头部和底部
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      title,
      description,
      header,
      footer,
      children,
      variant = 'default',
      size = 'md',
      clickable = false,
      hoverable = false,
      loading = false,
      rounded,
      border,
      shadow,
      className,
      contentClassName,
      headerClassName,
      footerClassName,
      onClick,
      ...props
    },
    ref
  ) => {
    // 处理点击事件
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (clickable && onClick) {
        onClick(e);
      }
    };

    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (clickable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (onClick) {
          onClick(e as any);
        }
      }
    };

    // 构建样式类名
    const cardClassName = cardVariants({
      variant,
      size,
      className: cn(
        // 交互状态
        clickable && 'cursor-pointer focus-within:outline-primary-500',
        hoverable && [
          'hover:shadow-md hover:-translate-y-0.5',
          variant === 'default' && 'hover:border-gray-300',
          variant === 'outlined' && 'hover:border-primary-300 hover:shadow-sm',
          variant === 'elevated' && 'hover:shadow-xl',
          variant === 'filled' && 'hover:bg-gray-100 hover:shadow-sm',
        ],
        // 自定义圆角
        rounded && {
          'rounded-none': rounded === 'none',
          'rounded-sm': rounded === 'sm',
          'rounded-md': rounded === 'md',
          'rounded-lg': rounded === 'lg',
          'rounded-xl': rounded === 'xl',
          'rounded-full': rounded === 'full',
        },
        // 自定义边框
        border && {
          'border-0': border === 'none',
          'border': border === 'sm',
          'border-2': border === 'md',
          'border-4': border === 'lg',
        },
        // 自定义阴影
        shadow && {
          'shadow-none': shadow === 'none',
          'shadow-sm': shadow === 'sm',
          'shadow-md': shadow === 'md',
          'shadow-lg': shadow === 'lg',
          'shadow-xl': shadow === 'xl',
        },
        className
      ),
    });

    if (loading) {
      return (
        <div ref={ref} className={cardClassName} {...props}>
          <CardSkeleton />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cardClassName}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        {...props}
      >
        {/* 头部区域 */}
        {(header || title || description) && (
          <div className={cn('flex flex-col gap-2', headerClassName)}>
            {header}
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* 内容区域 */}
        {children && (
          <div className={cn('flex-1', contentClassName)}>
            {children}
          </div>
        )}

        {/* 底部区域 */}
        {footer && (
          <div className={cn('mt-auto', footerClassName)}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card; 