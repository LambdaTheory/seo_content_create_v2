import { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * 按钮变体类型
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * 按钮尺寸类型
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * 按钮属性接口
 */
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** 按钮变体 */
  variant?: ButtonVariant;
  /** 按钮尺寸 */
  size?: ButtonSize;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 按钮内容 */
  children: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 按钮类型 */
  type?: 'button' | 'submit' | 'reset';
  /** 是否全宽 */
  fullWidth?: boolean;
  /** 左侧图标 */
  leftIcon?: ReactNode;
  /** 右侧图标 */
  rightIcon?: ReactNode;
} 