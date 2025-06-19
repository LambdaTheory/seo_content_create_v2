import React, { forwardRef, useState, useCallback } from 'react';
import { InputProps } from './Input.types';
import { cn, createVariants } from '@/utils/classNames';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * 输入框变体样式配置
 */
const inputVariants = createVariants({
  base: [
    'w-full font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
    'placeholder:text-gray-400',
  ].join(' '),
  variants: {
    variant: {
      default: [
        'border border-gray-300 bg-white text-gray-900',
        'hover:border-gray-400',
        'focus:border-primary-500',
      ].join(' '),
      filled: [
        'border border-gray-200 bg-gray-50 text-gray-900',
        'hover:bg-gray-100 hover:border-gray-300',
        'focus:bg-white focus:border-primary-500',
      ].join(' '),
      outline: [
        'border-2 border-gray-300 bg-transparent text-gray-900',
        'hover:border-gray-400',
        'focus:border-primary-500',
      ].join(' '),
      borderless: [
        'border-0 bg-transparent text-gray-900',
        'focus:ring-1',
      ].join(' '),
    },
    size: {
      sm: 'px-3 py-2 text-sm h-9 rounded-md',
      md: 'px-4 py-2 text-base h-10 rounded-lg',
      lg: 'px-4 py-3 text-lg h-12 rounded-lg',
    },
    hasError: {
      true: [
        'border-error-300 bg-error-50 text-error-900',
        'focus:border-error-500 focus:ring-error-500',
      ].join(' '),
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    hasError: 'false' as const,
  },
});

/**
 * 标签样式配置
 */
const labelVariants = createVariants({
  base: 'block font-medium mb-2',
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    hasError: {
      true: 'text-error-700',
      false: 'text-gray-700',
    },
    required: {
      true: "after:content-['*'] after:text-error-500 after:ml-1",
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    hasError: 'false' as const,
    required: 'false' as const,
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
 * Input 组件
 * 
 * 功能特性：
 * - 支持多种变体：default、filled、outline、borderless
 * - 支持多种尺寸：sm、md、lg
 * - 支持错误状态和验证
 * - 支持左右图标和附加内容
 * - 支持清除和密码切换功能
 * - 支持加载状态
 * - 完全的键盘导航支持
 * - 无障碍友好设计
 * 
 * @example
 * ```tsx
 * <Input 
 *   label="用户名" 
 *   placeholder="请输入用户名"
 *   required
 * />
 * 
 * <Input
 *   variant="filled"
 *   leftIcon={<UserIcon />}
 *   clearable
 * />
 * 
 * <Input
 *   type="password"
 *   showPasswordToggle
 *   error
 *   errorMessage="密码格式不正确"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error = false,
      errorMessage,
      helpText,
      label,
      required = false,
      loading = false,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      fullWidth = true,
      clearable = false,
      onClear,
      showPasswordToggle = false,
      inputClassName,
      labelClassName,
      errorClassName,
      helpClassName,
      className,
      type = 'text',
      value,
      defaultValue,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    // 状态管理
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    
    // 获取当前值
    const currentValue = value !== undefined ? value : internalValue;
    const isControlled = value !== undefined;

    // 确定实际的input类型
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // 处理输入变化
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(e);
    }, [isControlled, onChange]);

    // 处理清除
    const handleClear = useCallback(() => {
      if (!isControlled) {
        setInternalValue('');
      }
      onClear?.();
      
      // 触发onChange事件
      if (onChange) {
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }, [isControlled, onClear, onChange]);

    // 处理密码显示切换
    const handlePasswordToggle = useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);

    // 计算样式
    const containerClassName = cn(
      'relative',
      fullWidth ? 'w-full' : 'w-auto',
      className
    );

    const inputWrapperClassName = cn(
      'relative flex items-center',
      leftAddon && 'rounded-l-none',
      rightAddon && 'rounded-r-none'
    );

    const actualInputClassName = inputVariants({
      variant,
      size,
      hasError: error ? 'true' : 'false',
      className: cn(
        // 左右内边距调整
        leftIcon && 'pl-10',
        rightIcon && 'pr-10',
        (clearable && currentValue) && 'pr-10',
        (showPasswordToggle && type === 'password') && 'pr-10',
        loading && 'pr-10',
        // 附加内容时的圆角处理
        leftAddon && 'rounded-l-none border-l-0',
        rightAddon && 'rounded-r-none border-r-0',
        inputClassName
      ),
    });

    // 图标/按钮样式
    const iconButtonClassName = 'absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors';
    const iconClassName = 'h-5 w-5';

    return (
      <div className={containerClassName}>
        {/* 标签 */}
        {label && (
          <label 
            htmlFor={props.id}
            className={labelVariants({
              size,
              hasError: error ? 'true' : 'false',
              required: required ? 'true' : 'false',
              className: labelClassName,
            })}
          >
            {label}
          </label>
        )}

        {/* 输入框容器 */}
        <div className="flex">
          {/* 左侧附加内容 */}
          {leftAddon && (
            <div className={cn(
              'flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500',
              size === 'sm' && 'text-sm rounded-l-md',
              size === 'md' && 'text-base rounded-l-lg',
              size === 'lg' && 'text-lg rounded-l-lg',
              error && 'border-error-300 bg-error-50 text-error-700'
            )}>
              {leftAddon}
            </div>
          )}

          {/* 输入框包装器 */}
          <div className={cn(inputWrapperClassName, 'flex-1')}>
            {/* 左侧图标 */}
            {leftIcon && (
              <div className={cn(iconButtonClassName, 'left-3 pointer-events-none')}>
                <span className={iconClassName}>{leftIcon}</span>
              </div>
            )}

            {/* 输入框 */}
            <input
              ref={ref}
              type={inputType}
              value={currentValue}
              onChange={handleChange}
              disabled={disabled || loading}
              className={actualInputClassName}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={errorMessage ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
              {...props}
            />

            {/* 右侧功能按钮区域 */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* 加载状态 */}
              {loading && (
                <Spinner className="text-primary-500" />
              )}

              {/* 清除按钮 */}
              {clearable && currentValue && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(iconButtonClassName, 'relative p-1 rounded hover:bg-gray-100')}
                  aria-label="清除内容"
                >
                  <XMarkIcon className={iconClassName} />
                </button>
              )}

              {/* 密码切换按钮 */}
              {showPasswordToggle && type === 'password' && !loading && (
                <button
                  type="button"
                  onClick={handlePasswordToggle}
                  className={cn(iconButtonClassName, 'relative p-1 rounded hover:bg-gray-100')}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className={iconClassName} />
                  ) : (
                    <EyeIcon className={iconClassName} />
                  )}
                </button>
              )}

              {/* 右侧图标 */}
              {rightIcon && !loading && !(clearable && currentValue) && !(showPasswordToggle && type === 'password') && (
                <div className="pointer-events-none">
                  <span className={iconClassName}>{rightIcon}</span>
                </div>
              )}
            </div>
          </div>

          {/* 右侧附加内容 */}
          {rightAddon && (
            <div className={cn(
              'flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500',
              size === 'sm' && 'text-sm rounded-r-md',
              size === 'md' && 'text-base rounded-r-lg',
              size === 'lg' && 'text-lg rounded-r-lg',
              error && 'border-error-300 bg-error-50 text-error-700'
            )}>
              {rightAddon}
            </div>
          )}
        </div>

        {/* 帮助文本和错误信息 */}
        {(helpText || errorMessage) && (
          <div className="mt-2 text-sm">
            {error && errorMessage ? (
              <p 
                id={`${props.id}-error`}
                className={cn('text-error-600', errorClassName)}
              >
                {errorMessage}
              </p>
            ) : helpText ? (
              <p 
                id={`${props.id}-help`}
                className={cn('text-gray-500', helpClassName)}
              >
                {helpText}
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 