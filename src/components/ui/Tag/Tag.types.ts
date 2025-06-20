import { ReactNode } from 'react';

export type TagVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info';

export type TagSize = 'sm' | 'md' | 'lg';

export interface TagProps {
  /** Tag显示内容 */
  children: ReactNode;
  /** Tag变体样式 */
  variant?: TagVariant;
  /** Tag尺寸 */
  size?: TagSize;
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 是否可点击 */
  clickable?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否选中 */
  checked?: boolean;
  /** 选中状态改变回调 */
  onCheckedChange?: (checked: boolean) => void;
  /** 左侧图标 */
  icon?: ReactNode;
  /** 自定义颜色 */
  color?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

export interface TagGroupProps {
  /** Tag数组 */
  tags: (TagProps | string)[];
  /** 是否允许多选 */
  multiple?: boolean;
  /** 选中的值 */
  value?: string | string[];
  /** 选中状态改变回调 */
  onChange?: (value: string | string[]) => void;
  /** 最大显示数量 */
  max?: number;
  /** 超出显示的文本 */
  overflowText?: string;
  /** 间距 */
  spacing?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

export interface EditableTagProps extends Omit<TagProps, 'children'> {
  /** 默认标签文本 */
  defaultValue?: string;
  /** 标签文本 */
  value?: string;
  /** 文本改变回调 */
  onChange?: (value: string) => void;
  /** 编辑完成回调 */
  onEdit?: (value: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 最大长度 */
  maxLength?: number;
}

export interface CategoryTagProps extends Omit<TagProps, 'variant'> {
  /** 分类名称 */
  category: string;
  /** 分类颜色配置 */
  colorMap?: Record<string, string>;
} 