import React, { forwardRef } from 'react';
import { ButtonProps } from './Button.types';
import { cn, createVariants } from '@/utils/classNames';

/**
 * 按钮变体样式配置
 */
const buttonVariants = createVariants({
  base: [
    'inline-flex items-center justify-center font-medium',
    'rounded-md transition-all duration-200',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ].join(' '),
  variants: {
    variant: {
      primary: [
        'bg-blue-600 text-white shadow-sm',
        'hover:bg-blue-700 active:bg-blue-800',
        'focus-visible:outline-blue-600',
        'border border-blue-600 hover:border-blue-700',
      ].join(' '),
      secondary: [
        'bg-gray-100 text-gray-900 shadow-sm',
        'hover:bg-gray-200 active:bg-gray-300',
        'focus-visible:outline-gray-500',
        'border border-gray-200 hover:border-gray-300',
      ].join(' '),
      outline: [
        'border-2 border-gray-300 bg-white text-gray-700 shadow-sm',
        'hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100',
        'focus-visible:outline-gray-500 focus-visible:border-blue-500',
      ].join(' '),
      ghost: [
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100 active:bg-gray-200',
        'focus-visible:outline-gray-500',
      ].join(' '),
      danger: [
        'bg-red-600 text-white shadow-sm',
        'hover:bg-red-700 active:bg-red-800',
        'focus-visible:outline-red-600',
        'border border-red-600 hover:border-red-700',
      ].join(' '),
    },
    size: {
      sm: 'px-3 py-2 text-sm font-medium h-8 min-w-[64px]',
      md: 'px-4 py-2 text-base font-medium h-10 min-w-[80px]',
      lg: 'px-6 py-3 text-lg font-semibold h-12 min-w-[96px]',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

/**
 * Loading Spinner 组件
 */
const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin h-4 w-4', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Button 组件
 * 
 * 功能特性：
 * - 支持多种变体：primary、secondary、outline、ghost、danger
 * - 支持多种尺寸：sm、md、lg
 * - 支持加载状态和禁用状态
 * - 支持左右图标
 * - 完全的键盘导航支持
 * - 无障碍友好设计
 * - 优化的对比度和视觉效果
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   点击我
 * </Button>
 * 
 * <Button variant="outline" loading>
 *   加载中...
 * </Button>
 * 
 * <Button variant="danger" leftIcon={<TrashIcon />}>
 *   删除
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      children,
      className,
      type = 'button',
      fullWidth = false,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={buttonVariants({
          variant,
          size,
          className: cn(
            fullWidth && 'w-full',
            loading && 'cursor-wait',
            className
          ),
        })}
        {...props}
      >
        {/* 左侧图标或加载状态 */}
        {loading ? (
          <Spinner className="mr-2" />
        ) : leftIcon ? (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        ) : null}

        {/* 按钮文字内容 */}
        <span className="truncate font-inherit">{children}</span>

        {/* 右侧图标 */}
        {rightIcon && !loading && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button; 