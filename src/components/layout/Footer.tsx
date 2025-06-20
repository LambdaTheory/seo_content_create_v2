import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/classNames';
import {
  FooterProps,
  OperationStatus,
  ProgressInfo,
  StatusItem,
  StatusDisplayProps,
  ProgressDisplayProps,
  StatusItemProps,
  FOOTER_CONSTANTS
} from './Footer.types';

/**
 * 状态工具函数
 */
const statusUtils = {
  getStatusConfig: (status: OperationStatus) => {
    return FOOTER_CONSTANTS.STATUS[status] || FOOTER_CONSTANTS.STATUS.idle;
  },
  
  formatProgress: (progress: ProgressInfo): string => {
    const { current, total, percentage, label, unit = '个' } = progress;
    
    if (percentage !== undefined) {
      return `${label ? label + ': ' : ''}${percentage}%`;
    }
    
    if (current !== undefined && total !== undefined) {
      return `${label ? label + ': ' : ''}${current}/${total} ${unit}`;
    }
    
    return label || '处理中...';
  },
  
  isActiveStatus: (status: OperationStatus): boolean => {
    return ['loading', 'processing', 'uploading', 'generating'].includes(status);
  }
};

/**
 * 状态显示组件
 */
const StatusDisplay: React.FC<StatusDisplayProps> = ({
  status,
  text,
  showIcon = true,
  onClick
}) => {
  const config = statusUtils.getStatusConfig(status);
  const isActive = statusUtils.isActiveStatus(status);
  
  return (
    <div 
      className={cn(
        "flex items-center space-x-2 cursor-pointer transition-colors duration-200",
        config.color,
        "hover:opacity-80"
      )}
      onClick={() => onClick?.(status)}
    >
      {showIcon && (
        <span 
          className={cn(
            "text-sm",
            { 'animate-spin': status === 'loading' || status === 'processing' }
          )}
        >
          {config.icon}
        </span>
      )}
      <span className="text-sm font-medium">
        {text || config.label}
      </span>
      {isActive && (
        <div className="flex space-x-0.5">
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
};

/**
 * 进度显示组件
 */
const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  progress,
  showBar = true,
  showText = true,
  size = 'sm'
}) => {
  const progressPercentage = progress.percentage !== undefined 
    ? progress.percentage 
    : Math.round((progress.current / progress.total) * 100);
    
  const progressText = statusUtils.formatProgress(progress);
  
  const barHeight = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }[size];
  
  return (
    <div className="flex items-center space-x-3">
      {showText && (
        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {progressText}
        </span>
      )}
      {showBar && (
        <div className={cn("flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden", barHeight)}>
          <div
            className={cn(
              "h-full bg-primary-600 transition-all duration-300 ease-out rounded-full",
              "relative overflow-hidden"
            )}
            style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
          >
            {/* 进度条动画效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
      )}
      {showText && (
        <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
          {progressPercentage}%
        </span>
      )}
    </div>
  );
};

/**
 * 状态项组件
 */
const StatusItemComponent: React.FC<StatusItemProps> = ({
  item,
  collapsed = false,
  onClick
}) => {
  const variantStyles = {
    default: 'text-gray-600 dark:text-gray-400',
    primary: 'text-primary-600 dark:text-primary-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400'
  };
  
  const handleClick = () => {
    onClick?.(item);
  };
  
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center cursor-pointer transition-colors duration-200 hover:opacity-80",
          variantStyles[item.variant || 'default']
        )}
        onClick={handleClick}
        title={item.tooltip || `${item.label}: ${item.value}`}
      >
        {item.icon && (
          <span className="text-sm">{item.icon}</span>
        )}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        "flex items-center space-x-2 cursor-pointer transition-colors duration-200 hover:opacity-80",
        variantStyles[item.variant || 'default']
      )}
      onClick={handleClick}
      title={item.tooltip}
    >
      {item.icon && (
        <span className="text-sm">{item.icon}</span>
      )}
      <span className="text-sm">
        {item.label}
      </span>
      <span className="text-sm font-mono">
        {item.value}
      </span>
    </div>
  );
};

/**
 * 主Footer组件
 */
export const Footer: React.FC<FooterProps> = ({
  status = 'ready',
  statusText,
  progress,
  showProgress = false,
  leftItems = [],
  rightItems = [],
  collapsed = false,
  className,
  style,
  onStatusClick,
  onItemClick,
  ...props
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 实时时间更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // 计算Footer高度
  const footerHeight = showProgress && progress 
    ? FOOTER_CONSTANTS.HEIGHT.WITH_PROGRESS
    : collapsed 
      ? FOOTER_CONSTANTS.HEIGHT.COLLAPSED 
      : FOOTER_CONSTANTS.HEIGHT.DEFAULT;
  
  // 默认右侧状态项
  const defaultRightItems: StatusItem[] = [
    {
      id: 'time',
      label: '时间',
      value: currentTime.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      icon: '🕐',
      variant: 'default'
    },
    {
      id: 'date',
      label: '日期',
      value: currentTime.toLocaleDateString('zh-CN'),
      icon: '📅',
      variant: 'default'
    }
  ];
  
  const allRightItems = [...rightItems, ...defaultRightItems];
  
  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out",
        className
      )}
      style={{
        height: `${footerHeight}px`,
        ...style
      }}
      {...props}
    >
      <div className="h-full flex flex-col">
        {/* 进度条区域 */}
        {showProgress && progress && (
          <div className="px-6 py-1 border-b border-gray-200 dark:border-gray-700">
            <ProgressDisplay
              progress={progress}
              showBar={true}
              showText={!collapsed}
              size="sm"
            />
          </div>
        )}
        
        {/* 主状态栏 */}
        <div className="flex-1 flex items-center justify-between px-6">
          {/* 左侧状态区域 */}
          <div className="flex items-center space-x-6">
            {/* 主状态显示 */}
            <StatusDisplay
              status={status}
              text={statusText}
              showIcon={!collapsed}
              onClick={onStatusClick}
            />
            
            {/* 左侧状态项 */}
            {leftItems.map((item) => (
              <StatusItemComponent
                key={item.id}
                item={item}
                collapsed={collapsed}
                onClick={onItemClick}
              />
            ))}
          </div>
          
          {/* 右侧信息区域 */}
          <div className="flex items-center space-x-6">
            {allRightItems.map((item) => (
              <StatusItemComponent
                key={item.id}
                item={item}
                collapsed={collapsed}
                onClick={onItemClick}
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

/**
 * Footer Hook - 提供状态管理功能
 */
export const useFooterStatus = () => {
  const [status, setStatus] = useState<OperationStatus>('ready');
  const [statusText, setStatusText] = useState<string>('');
  const [progress, setProgress] = useState<ProgressInfo | undefined>();
  const [showProgress, setShowProgress] = useState(false);
  
  const updateStatus = (newStatus: OperationStatus, text?: string) => {
    setStatus(newStatus);
    if (text !== undefined) {
      setStatusText(text);
    }
  };
  
  const updateProgress = (newProgress: ProgressInfo) => {
    setProgress(newProgress);
    setShowProgress(true);
  };
  
  const hideProgress = () => {
    setShowProgress(false);
    setProgress(undefined);
  };
  
  const reset = () => {
    setStatus('ready');
    setStatusText('');
    hideProgress();
  };
  
  return {
    status,
    statusText,
    progress,
    showProgress,
    updateStatus,
    updateProgress,
    hideProgress,
    reset
  };
};

export default Footer; 