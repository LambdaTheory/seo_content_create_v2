import React from 'react';
import {
  LoadingProps,
  SpinnerProps,
  ProgressProps,
  SkeletonProps,
  SkeletonImageProps,
  SkeletonTextProps,
  LoadingOverlayProps,
  DotsLoaderProps,
  BarsLoaderProps,
} from './Loading.types';
import { cn } from '@/utils/classNames';

/**
 * Spinner 组件 - 旋转加载指示器
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
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
};

/**
 * DotsLoader 组件 - 点状加载指示器
 */
export const DotsLoader: React.FC<DotsLoaderProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
    gray: 'bg-gray-400',
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
};

/**
 * BarsLoader 组件 - 柱状加载指示器
 */
export const BarsLoader: React.FC<BarsLoaderProps> = ({
  size = 'md',
  color = 'primary',
  bars = 4,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-0.5 h-4',
    md: 'w-1 h-6',
    lg: 'w-1.5 h-8',
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
    gray: 'bg-gray-400',
  };

  return (
    <div className={cn('flex items-end space-x-1', className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-sm',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1.2s',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Progress 组件 - 进度条
 */
export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showText = false,
  formatText,
  animated = false,
  striped = false,
  className,
  label,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  const defaultFormatText = (val: number, maxVal: number) => 
    `${Math.round((val / maxVal) * 100)}%`;

  const textFormatter = formatText || defaultFormatText;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showText && (
            <span className="text-sm text-gray-500">
              {textFormatter(value, max)}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            colorClasses[color],
            {
              'bg-gradient-to-r from-transparent to-current opacity-75': striped,
              'animate-pulse': animated,
            }
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * SkeletonImage 组件 - 图片骨架屏
 */
export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width = '100%',
  height = '200px',
  circle = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-gray-200 animate-pulse',
        {
          'rounded-full': circle,
          'rounded-md': !circle,
        },
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

/**
 * SkeletonText 组件 - 文本骨架屏
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  width = '100%',
  rows = 1,
  active = true,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 rounded',
            {
              'animate-pulse': active,
            }
          )}
          style={{
            width: i === rows - 1 ? '60%' : typeof width === 'number' ? `${width}px` : width,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton 组件 - 完整骨架屏
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  loading = true,
  rows = 3,
  avatar = false,
  avatarSize = 'md',
  paragraph = true,
  paragraphRows = 3,
  title = true,
  titleWidth = '40%',
  active = true,
  className,
  children,
}) => {
  if (!loading && children) {
    return <>{children}</>;
  }

  const avatarSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex space-x-4">
        {avatar && (
          <SkeletonImage
            width={avatarSizes[avatarSize].split(' ')[1].replace('w-', '')}
            height={avatarSizes[avatarSize].split(' ')[0].replace('h-', '')}
            circle
            className={cn({ 'animate-pulse': active })}
          />
        )}
        <div className="flex-1 space-y-3">
          {title && (
            <SkeletonText
              width={titleWidth}
              rows={1}
              active={active}
            />
          )}
          {paragraph && (
            <SkeletonText
              rows={paragraphRows}
              active={active}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * LoadingOverlay 组件 - 加载遮罩层
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  opacity = 0.75,
  background = 'white',
  blur = false,
  loader = 'spinner',
  text,
  className,
  children,
}) => {
  if (!visible) {
    return <>{children}</>;
  }

  const renderLoader = () => {
    switch (loader) {
      case 'dots':
        return <DotsLoader size="lg" />;
      case 'bars':
        return <BarsLoader size="lg" />;
      default:
        return <Spinner size="lg" />;
    }
  };

  return (
    <div className="relative">
      {children}
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center z-50',
          {
            'backdrop-blur-sm': blur,
          },
          className
        )}
        style={{
          backgroundColor: `${background}`,
          opacity,
        }}
      >
        {renderLoader()}
        {text && (
          <p className="mt-4 text-sm text-gray-600 font-medium">{text}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Loading 组件 - 通用加载容器
 */
export const Loading: React.FC<LoadingProps> = ({
  loading = false,
  text,
  size = 'md',
  className,
  children,
}) => {
  if (!loading && children) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8',
        className
      )}
    >
      <Spinner size={size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'} />
      {text && (
        <p className={cn(
          'mt-4 text-gray-600 font-medium',
          {
            'text-sm': size === 'sm',
            'text-base': size === 'md',
            'text-lg': size === 'lg',
          }
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default Loading; 