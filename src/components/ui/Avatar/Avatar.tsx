import React, { useState, useRef } from 'react';
import { AvatarProps, AvatarGroupProps, StatusAvatarProps, UploadAvatarProps } from './Avatar.types';
import { cn } from '@/utils/classNames';

/**
 * 生成用户名首字母
 */
const getInitials = (name?: string): string => {
  if (!name) return '';
  
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  
  return name.slice(0, 2).toUpperCase();
};

/**
 * 根据名称生成背景颜色
 */
const getAvatarColor = (name?: string): string => {
  if (!name) return '#6b7280';
  
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * 基础Avatar组件
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  variant = 'circular',
  children,
  fallback,
  className,
  onClick,
  disabled = false,
  bgColor,
  textColor,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  
  // 尺寸样式
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  // 形状样式
  const variantClasses = {
    circular: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none'
  };

  // 基础样式
  const baseClasses = 'inline-flex items-center justify-center font-medium text-white bg-gray-500 overflow-hidden transition-all duration-200';

  // 交互样式
  const interactiveClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : onClick 
    ? 'cursor-pointer hover:opacity-80' 
    : '';

  // 计算背景颜色和文本颜色
  const computedBgColor = bgColor || getAvatarColor(name);
  const computedTextColor = textColor || '#ffffff';

  // 图片加载错误处理
  const handleImageError = () => {
    setImageError(true);
  };

  // 点击处理
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  // 渲染内容
  const renderContent = () => {
    // 优先显示自定义children
    if (children) {
      return children;
    }

    // 显示图片（如果没有错误）
    if (src && !imageError) {
      return (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      );
    }

    // 显示fallback内容
    if (fallback) {
      return fallback;
    }

    // 显示首字母
    if (name) {
      return <span>{getInitials(name)}</span>;
    }

    // 默认用户图标
    return (
      <svg className="w-2/3 h-2/3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <span
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        interactiveClasses,
        className
      )}
      style={{
        backgroundColor: computedBgColor,
        color: computedTextColor
      }}
      onClick={handleClick}
      {...props}
    >
      {renderContent()}
    </span>
  );
};

/**
 * 状态Avatar组件
 */
export const StatusAvatar: React.FC<StatusAvatarProps> = ({
  status = 'offline',
  statusPosition = 'bottom-right',
  showStatus = true,
  className,
  ...avatarProps
}) => {
  // 状态颜色配置
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  // 状态位置样式
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'bottom-right': 'bottom-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-left': 'bottom-0 left-0'
  };

  if (!showStatus) {
    return <Avatar {...avatarProps} className={className} />;
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar {...avatarProps} />
      <span
        className={cn(
          'absolute w-3 h-3 rounded-full border-2 border-white',
          statusColors[status],
          positionClasses[statusPosition]
        )}
        style={{ transform: 'translate(25%, 25%)' }}
      />
    </div>
  );
};

/**
 * 可上传Avatar组件
 */
export const UploadAvatar: React.FC<UploadAvatarProps> = ({
  value,
  onChange,
  uploadable = true,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  uploadText = '上传头像',
  removeText = '移除',
  className,
  ...avatarProps
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // 文件选择处理
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      onChange?.(null);
      return;
    }

    // 验证文件大小
    if (file.size > maxSize) {
      alert(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    // 验证文件类型
    if (accept !== '*' && !file.type.match(accept.replace('*', '.*'))) {
      alert('文件类型不支持');
      return;
    }

    onChange?.(file);
  };

  // 文件输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
    
    // 清空input值以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  // 点击上传
  const handleUploadClick = () => {
    if (uploadable) {
      fileInputRef.current?.click();
    }
  };

  // 移除头像
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  };

  if (!uploadable) {
    return <Avatar {...avatarProps} src={value} className={className} />;
  }

  return (
    <div className={cn('relative inline-block group', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      
      <div
        className={cn(
          'relative cursor-pointer transition-all duration-200',
          dragOver && 'ring-2 ring-primary-500 ring-offset-2'
        )}
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Avatar {...avatarProps} src={value} />
        
        {/* 悬停遮罩 */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-medium">
            {value ? '更换' : '上传'}
          </span>
        </div>
      </div>

      {/* 移除按钮 */}
      {value && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
          aria-label={removeText}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * Avatar组合组件
 */
export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max,
  overflowText = '+',
  size = 'md',
  stacked = true,
  spacing = 'sm',
  className,
  ...props
}) => {
  // 间距样式
  const spacingClasses = {
    none: 'gap-0',
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  };

  // 重叠样式
  const stackedClass = stacked ? '-space-x-2' : '';

  // 处理显示数量限制
  const displayAvatars = max ? avatars.slice(0, max) : avatars;
  const hasOverflow = max && avatars.length > max;
  const overflowCount = avatars.length - max!;

  return (
    <div 
      className={cn(
        'flex items-center',
        stacked ? stackedClass : spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {displayAvatars.map((avatar, index) => (
        <Avatar 
          key={index} 
          size={size}
          className={stacked ? 'ring-2 ring-white' : ''}
          {...avatar}
        />
      ))}
      
      {hasOverflow && (
        <Avatar 
          size={size}
          className={stacked ? 'ring-2 ring-white' : ''}
        >
          {overflowText}{overflowCount}
        </Avatar>
      )}
    </div>
  );
};

export default Avatar; 