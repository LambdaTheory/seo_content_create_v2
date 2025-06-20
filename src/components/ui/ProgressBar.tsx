/**
 * 进度条组件
 * 任务10.2.3：添加进度显示组件 - 进度条动画设计
 */

'use client';

import React from 'react';
import { Badge } from './Badge';

export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showValue = true,
  showLabel = false,
  label,
  animated = true,
  striped = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-cyan-600'
  };

  const bgClasses = {
    primary: 'bg-blue-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    danger: 'bg-red-100',
    info: 'bg-cyan-100'
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || '进度'}
          </span>
          {showValue && (
            <Badge variant="secondary" size="sm">
              {percentage.toFixed(0)}%
            </Badge>
          )}
        </div>
      )}
      
      <div className={`
        w-full ${sizeClasses[size]} ${bgClasses[variant]} 
        rounded-full overflow-hidden relative
      `}>
        <div
          className={`
            ${sizeClasses[size]} ${variantClasses[variant]} 
            rounded-full transition-all duration-500 ease-out
            ${animated ? 'animate-pulse' : ''}
            ${striped ? 'bg-gradient-to-r from-transparent via-white to-transparent bg-size-200 animate-shimmer' : ''}
            relative overflow-hidden
          `}
          style={{ width: `${percentage}%` }}
        >
          {striped && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar; 