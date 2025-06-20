import { ReactNode } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type AvatarVariant = 'circular' | 'rounded' | 'square';

export interface AvatarProps {
  /** 头像图片源 */
  src?: string;
  /** 替代文本 */
  alt?: string;
  /** 显示的名称（用于生成首字母） */
  name?: string;
  /** Avatar尺寸 */
  size?: AvatarSize;
  /** Avatar形状变体 */
  variant?: AvatarVariant;
  /** 自定义头像内容 */
  children?: ReactNode;
  /** 图片加载失败时的后备内容 */
  fallback?: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义背景颜色 */
  bgColor?: string;
  /** 自定义文本颜色 */
  textColor?: string;
}

export interface AvatarGroupProps {
  /** Avatar数组 */
  avatars: AvatarProps[];
  /** 最大显示数量 */
  max?: number;
  /** 超出显示的文本 */
  overflowText?: string;
  /** Avatar尺寸 */
  size?: AvatarSize;
  /** 重叠样式 */
  stacked?: boolean;
  /** 间距 */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

export interface StatusAvatarProps extends AvatarProps {
  /** 在线状态 */
  status?: 'online' | 'offline' | 'away' | 'busy';
  /** 状态指示器位置 */
  statusPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  /** 是否显示状态指示器 */
  showStatus?: boolean;
}

export interface UploadAvatarProps extends Omit<AvatarProps, 'src'> {
  /** 当前头像URL */
  value?: string;
  /** 头像改变回调 */
  onChange?: (file: File | null) => void;
  /** 是否可上传 */
  uploadable?: boolean;
  /** 接受的文件类型 */
  accept?: string;
  /** 最大文件大小 */
  maxSize?: number;
  /** 上传按钮文本 */
  uploadText?: string;
  /** 移除按钮文本 */
  removeText?: string;
} 