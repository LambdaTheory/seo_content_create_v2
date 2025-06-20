import React, { useEffect, useState, useRef, createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/classNames';
import {
  ToastProps,
  ToastContainerProps,
  ToastOptions,
  ToastState,
  UseToastReturn,
  ToastHookOptions,
  ToastType,
  ToastPosition
} from './Toast.types';

// Toast上下文
const ToastContext = createContext<ToastState | null>(null);

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 默认配置
const DEFAULT_DURATION = 4000;
const DEFAULT_POSITION: ToastPosition = 'top-right';
const DEFAULT_MAX_TOASTS = 5;

/**
 * 图标组件
 */
const ToastIcon: React.FC<{ type: ToastType; size?: number }> = ({ type, size = 20 }) => {
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case 'success':
      return (
        <svg {...iconProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
      );
    case 'error':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...iconProps}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'info':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    default:
      return null;
  }
};

/**
 * 关闭按钮图标
 */
const CloseIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Toast组件
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  icon,
  closable = true,
  duration = DEFAULT_DURATION,
  clickable = false,
  onClick,
  onClose,
  className,
  style,
  showProgress = false,
  animationDuration = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // 类型样式映射
  const typeStyles = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-600',
      progress: 'bg-green-600',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-600',
      progress: 'bg-red-600',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-600',
      progress: 'bg-yellow-600',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-600',
      progress: 'bg-blue-600',
    },
  };

  const currentStyle = typeStyles[type];

  // 进入动画
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 处理关闭
  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.(id);
    }, animationDuration);
  };

  // 自动关闭逻辑
  useEffect(() => {
    if (duration > 0) {
      // 设置关闭定时器
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);

      // 进度条动画
      if (showProgress) {
        const interval = 50; // 50ms更新一次
        const step = (interval / duration) * 100;
        
        progressIntervalRef.current = setInterval(() => {
          setProgress(prev => {
            const next = prev - step;
            return next <= 0 ? 0 : next;
          });
        }, interval);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [duration, showProgress, handleClose]);

  // 处理点击
  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  // 鼠标悬停时暂停自动关闭
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  // 鼠标离开时恢复自动关闭
  const handleMouseLeave = () => {
    if (duration > 0) {
      const remainingTime = (progress / 100) * duration;
      
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, remainingTime);

      if (showProgress) {
        const interval = 50;
        const step = (interval / remainingTime) * progress;
        
        progressIntervalRef.current = setInterval(() => {
          setProgress(prev => {
            const next = prev - step;
            return next <= 0 ? 0 : next;
          });
        }, interval);
      }
    }
  };

  return (
    <div
      className={cn(
        'relative mb-2 mx-4 min-w-80 max-w-md p-4 rounded-lg border shadow-lg transition-all duration-300 transform',
        currentStyle.container,
        {
          'translate-x-0 opacity-100': isVisible && !isLeaving,
          'translate-x-full opacity-0': !isVisible || isLeaving,
          'cursor-pointer hover:shadow-xl': clickable,
        },
        className
      )}
      style={{
        ...style,
        transitionDuration: `${animationDuration}ms`,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={clickable ? 'button' : 'alert'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start space-x-3">
        {/* 图标 */}
        <div className={cn('flex-shrink-0 mt-0.5', currentStyle.icon)}>
          {icon || <ToastIcon type={type} />}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold mb-1 pr-8">
              {title}
            </h4>
          )}
          <p className={cn('text-sm', { 'pr-8': closable })}>
            {message}
          </p>
        </div>

        {/* 关闭按钮 */}
        {closable && (
          <button
            type="button"
            className={cn(
              'absolute top-2 right-2 p-1.5 rounded-md transition-colors',
              'hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-1',
              currentStyle.icon
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            aria-label="关闭通知"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* 进度条 */}
      {showProgress && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-lg overflow-hidden">
          <div
            className={cn('h-full transition-all duration-100 ease-linear', currentStyle.progress)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Toast容器组件
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = DEFAULT_POSITION,
  maxToasts = DEFAULT_MAX_TOASTS,
  className,
  style,
  spacing = 8,
  reverseOrder = false,
}) => {
  const toastState = useContext(ToastContext);

  if (!toastState) {
    console.warn('ToastContainer must be used within ToastProvider');
    return null;
  }

  const { toasts, removeToast } = toastState;

  // 位置样式映射
  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  // 限制显示数量
  const displayToasts = reverseOrder 
    ? toasts.slice(-maxToasts).reverse()
    : toasts.slice(0, maxToasts);

  if (displayToasts.length === 0) {
    return null;
  }

  const containerElement = (
    <div
      className={cn(
        'fixed z-50 flex flex-col pointer-events-none',
        positionStyles[position],
        className
      )}
      style={{
        ...style,
        gap: `${spacing}px`,
      }}
    >
      {displayToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );

  // 使用Portal渲染到body
  return typeof window !== 'undefined'
    ? createPortal(containerElement, document.body)
    : null;
};

/**
 * Toast Provider组件
 */
export const ToastProvider: React.FC<{ children: ReactNode; options?: ToastHookOptions }> = ({
  children,
  options = {},
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (options: ToastOptions): string => {
    const id = options.id || generateId();
    const newToast: ToastProps = {
      id,
      type: 'info',
      message: '',
      closable: true,
      duration: DEFAULT_DURATION,
      ...options,
      onClose: (toastId) => removeToast(toastId),
    };

    setToasts(prev => {
      // 如果设置了最大数量，移除最旧的
      const maxToasts = options.maxToasts || DEFAULT_MAX_TOASTS;
      const newToasts = [...prev, newToast];
      return newToasts.length > maxToasts 
        ? newToasts.slice(-maxToasts)
        : newToasts;
    });

    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  const updateToast = (id: string, options: Partial<ToastOptions>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id 
        ? { ...toast, ...options }
        : toast
    ));
  };

  const value: ToastState = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    updateToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer {...options} />
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook
 */
export const useToast = (): UseToastReturn => {
  const toastState = useContext(ToastContext);

  if (!toastState) {
    throw new Error('useToast must be used within ToastProvider');
  }

  const { toasts, addToast, removeToast, clearToasts } = toastState;

  const success = (message: string, options: Omit<ToastOptions, 'type' | 'message'> = {}) => {
    return addToast({ ...options, type: 'success', message });
  };

  const error = (message: string, options: Omit<ToastOptions, 'type' | 'message'> = {}) => {
    return addToast({ ...options, type: 'error', message });
  };

  const warning = (message: string, options: Omit<ToastOptions, 'type' | 'message'> = {}) => {
    return addToast({ ...options, type: 'warning', message });
  };

  const info = (message: string, options: Omit<ToastOptions, 'type' | 'message'> = {}) => {
    return addToast({ ...options, type: 'info', message });
  };

  const toast = (options: ToastOptions) => {
    return addToast(options);
  };

  const dismiss = (id: string) => {
    removeToast(id);
  };

  const dismissAll = () => {
    clearToasts();
  };

  return {
    success,
    error,
    warning,
    info,
    toast,
    dismiss,
    dismissAll,
    toasts,
  };
}; 