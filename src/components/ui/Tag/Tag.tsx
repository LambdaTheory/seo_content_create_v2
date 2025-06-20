import React, { useState, useRef, useEffect } from 'react';
import { TagProps, TagGroupProps, EditableTagProps, CategoryTagProps } from './Tag.types';
import { cn } from '@/utils/classNames';

/**
 * 基础Tag组件
 */
export const Tag: React.FC<TagProps> = ({
  children,
  variant = 'default',
  size = 'md',
  closable = false,
  onClose,
  clickable = false,
  onClick,
  checked = false,
  onCheckedChange,
  icon,
  color,
  disabled = false,
  className,
  ...props
}) => {
  // 基础样式类
  const baseClasses = 'inline-flex items-center font-medium rounded-md transition-all duration-200';
  
  // 尺寸样式
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-2.5 py-1.5 text-sm gap-1.5',
    lg: 'px-3 py-2 text-sm gap-2'
  };

  // 变体样式
  const variantClasses = {
    default: checked
      ? 'text-gray-800 bg-gray-200 border border-gray-300'
      : 'text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200',
    primary: checked
      ? 'text-primary-800 bg-primary-200 border border-primary-300'
      : 'text-primary-700 bg-primary-100 border border-primary-200 hover:bg-primary-200',
    secondary: checked
      ? 'text-gray-800 bg-gray-300 border border-gray-400'
      : 'text-gray-700 bg-gray-200 border border-gray-300 hover:bg-gray-300',
    success: checked
      ? 'text-green-800 bg-green-200 border border-green-300'
      : 'text-green-700 bg-green-100 border border-green-200 hover:bg-green-200',
    warning: checked
      ? 'text-yellow-800 bg-yellow-200 border border-yellow-300'
      : 'text-yellow-700 bg-yellow-100 border border-yellow-200 hover:bg-yellow-200',
    error: checked
      ? 'text-red-800 bg-red-200 border border-red-300'
      : 'text-red-700 bg-red-100 border border-red-200 hover:bg-red-200',
    info: checked
      ? 'text-blue-800 bg-blue-200 border border-blue-300'
      : 'text-blue-700 bg-blue-100 border border-blue-200 hover:bg-blue-200'
  };

  // 交互样式
  const interactiveClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : (clickable || onCheckedChange)
    ? 'cursor-pointer select-none'
    : '';

  // 点击处理
  const handleClick = () => {
    if (disabled) return;
    
    if (onCheckedChange) {
      onCheckedChange(!checked);
    } else if (onClick) {
      onClick();
    }
  };

  // 关闭处理
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onClose) {
      onClose();
    }
  };

  // 自定义颜色样式
  const customColorStyle = color ? {
    backgroundColor: `${color}20`,
    borderColor: `${color}40`,
    color: color
  } : {};

  return (
    <span
      className={cn(
        baseClasses,
        sizeClasses[size],
        !color && variantClasses[variant],
        interactiveClasses,
        className
      )}
      style={color ? customColorStyle : undefined}
      onClick={clickable || onCheckedChange ? handleClick : undefined}
      {...props}
    >
      {icon && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}
      
      <span className="truncate">
        {children}
      </span>
      
      {closable && (
        <button
          type="button"
          onClick={handleClose}
          disabled={disabled}
          className="flex-shrink-0 ml-1 h-4 w-4 rounded-full hover:bg-black hover:bg-opacity-10 focus:outline-none focus:bg-black focus:bg-opacity-10 transition-colors"
          aria-label="关闭标签"
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
 * 可编辑Tag组件
 */
export const EditableTag: React.FC<EditableTagProps> = ({
  defaultValue = '',
  value,
  onChange,
  onEdit,
  placeholder = '输入标签',
  maxLength = 20,
  ...tagProps
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTagClick = () => {
    if (!tagProps.disabled) {
      setIsEditing(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (inputValue.trim()) {
      onEdit?.(inputValue.trim());
    } else {
      setInputValue(value || defaultValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(value || defaultValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className="px-2.5 py-1.5 text-sm border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
        style={{ width: Math.max(inputValue.length * 8 + 20, 80) }}
      />
    );
  }

  return (
    <Tag
      {...tagProps}
      clickable
      onClick={handleTagClick}
      className={cn('border-dashed', tagProps.className)}
    >
      {inputValue || placeholder}
    </Tag>
  );
};

/**
 * 分类Tag组件
 */
export const CategoryTag: React.FC<CategoryTagProps> = ({
  category,
  colorMap = {},
  children,
  ...tagProps
}) => {
  // 预定义的分类颜色
  const defaultColorMap: Record<string, string> = {
    technology: '#3b82f6',
    business: '#10b981',
    design: '#8b5cf6',
    marketing: '#f59e0b',
    development: '#ef4444',
    research: '#06b6d4',
    management: '#84cc16',
    sales: '#f97316'
  };

  const categoryColor = colorMap[category] || defaultColorMap[category] || '#6b7280';

  return (
    <Tag {...tagProps} color={categoryColor}>
      {children || category}
    </Tag>
  );
};

/**
 * Tag组合组件
 */
export const TagGroup: React.FC<TagGroupProps> = ({
  tags,
  multiple = false,
  value,
  onChange,
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

  // 处理选中状态
  const isTagSelected = (tagValue: string) => {
    if (!value) return false;
    
    if (multiple) {
      return Array.isArray(value) && value.includes(tagValue);
    } else {
      return value === tagValue;
    }
  };

  // 处理标签点击
  const handleTagClick = (tagValue: string) => {
    if (!onChange) return;

    if (multiple) {
      const currentValue = (Array.isArray(value) ? value : []) as string[];
      const newValue = currentValue.includes(tagValue)
        ? currentValue.filter(v => v !== tagValue)
        : [...currentValue, tagValue];
      onChange(newValue);
    } else {
      onChange(value === tagValue ? '' : tagValue);
    }
  };

  // 处理显示数量限制
  const displayTags = max ? tags.slice(0, max) : tags;
  const hasOverflow = max && tags.length > max;
  const overflowCount = tags.length - max!;

  return (
    <div 
      className={cn('flex flex-wrap items-center', spacingClasses[spacing], className)}
      {...props}
    >
      {displayTags.map((tag, index) => {
        if (typeof tag === 'string') {
          const tagValue = tag;
          return (
            <Tag 
              key={index} 
              variant="default"
              clickable={!!onChange}
              checked={isTagSelected(tagValue)}
              onCheckedChange={() => handleTagClick(tagValue)}
            >
              {tag}
            </Tag>
          );
        }
        
        const tagValue = typeof tag.children === 'string' ? tag.children : index.toString();
        return (
          <Tag 
            key={index}
            clickable={!!onChange}
            checked={isTagSelected(tagValue)}
            onCheckedChange={() => handleTagClick(tagValue)}
            {...tag}
          />
        );
      })}
      
      {hasOverflow && (
        <Tag variant="default" size="sm">
          +{overflowCount}
        </Tag>
      )}
    </div>
  );
};

export default Tag; 