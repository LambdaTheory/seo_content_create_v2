import { ReactNode, HTMLAttributes } from 'react';

/**
 * Card组件的基础属性接口
 */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 卡片标题 */
  title?: ReactNode;
  /** 卡片描述 */
  description?: ReactNode;
  /** 卡片头部内容 */
  header?: ReactNode;
  /** 卡片底部内容 */
  footer?: ReactNode;
  /** 卡片变体 */
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  /** 卡片大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否显示悬停效果 */
  hoverable?: boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 圆角大小 */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 边框样式 */
  border?: 'none' | 'sm' | 'md' | 'lg';
  /** 阴影样式 */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** 自定义内容区域类名 */
  contentClassName?: string;
  /** 自定义头部类名 */
  headerClassName?: string;
  /** 自定义底部类名 */
  footerClassName?: string;
} 