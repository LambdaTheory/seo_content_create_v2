import { ReactNode } from 'react';

export type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge显示内容 */
  children: ReactNode;
  /** Badge变体样式 */
  variant?: BadgeVariant;
  /** Badge尺寸 */
  size?: BadgeSize;
  /** 是否为圆角药丸样式 */
  pill?: boolean;
  /** 是否为点状指示器 */
  dot?: boolean;
  /** 是否为轮廓样式 */
  outline?: boolean;
  /** 是否可移除 */
  removable?: boolean;
  /** 移除回调 */
  onRemove?: () => void;
  /** 左侧图标 */
  leftIcon?: ReactNode;
  /** 右侧图标 */
  rightIcon?: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface BadgeGroupProps {
  /** Badge数组 */
  badges: (BadgeProps | string)[];
  /** 最大显示数量 */
  max?: number;
  /** 超出显示的文本 */
  overflowText?: string;
  /** 间距 */
  spacing?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  /** 状态类型 */
  status: 'online' | 'offline' | 'away' | 'busy' | 'pending' | 'approved' | 'rejected';
  /** 是否显示状态文本 */
  showText?: boolean;
  /** 自定义状态文本 */
  statusText?: string;
}

export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  /** 计数值 */
  count: number;
  /** 最大显示数量 */
  max?: number;
  /** 超出显示的文本 */
  overflowText?: string;
  /** 是否显示零值 */
  showZero?: boolean;
}

export interface NotificationBadgeProps extends Omit<BadgeProps, 'children'> {
  /** 是否显示 */
  show?: boolean;
  /** 徽标内容 */
  content?: ReactNode;
  /** 偏移位置 */
  offset?: [number, number];
  /** 子元素 */
  children: ReactNode;
} 