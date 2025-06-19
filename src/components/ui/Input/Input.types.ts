import { InputHTMLAttributes, ReactNode } from 'react';

/**
 * Input组件的基础属性接口
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 输入框变体 */
  variant?: 'default' | 'filled' | 'outline' | 'borderless';
  /** 输入框大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示错误状态 */
  error?: boolean;
  /** 错误信息 */
  errorMessage?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 标签文本 */
  label?: string;
  /** 标签是否必填 */
  required?: boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 左侧图标 */
  leftIcon?: ReactNode;
  /** 右侧图标 */
  rightIcon?: ReactNode;
  /** 左侧附加内容 */
  leftAddon?: ReactNode;
  /** 右侧附加内容 */
  rightAddon?: ReactNode;
  /** 是否全宽 */
  fullWidth?: boolean;
  /** 是否清除按钮 */
  clearable?: boolean;
  /** 清除按钮回调 */
  onClear?: () => void;
  /** 是否显示密码切换按钮 */
  showPasswordToggle?: boolean;
  /** 自定义输入框类名 */
  inputClassName?: string;
  /** 自定义标签类名 */
  labelClassName?: string;
  /** 自定义错误信息类名 */
  errorClassName?: string;
  /** 自定义帮助文本类名 */
  helpClassName?: string;
}

/**
 * InputGroup组件属性接口
 */
export interface InputGroupProps {
  /** 子组件 */
  children: ReactNode;
  /** 组合样式 */
  variant?: 'attached' | 'separated';
  /** 大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

/**
 * InputAddon组件属性接口
 */
export interface InputAddonProps {
  /** 内容 */
  children: ReactNode;
  /** 位置 */
  placement?: 'left' | 'right';
  /** 是否为按钮 */
  isButton?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
} 