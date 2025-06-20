export interface LoadingProps {
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 加载文案 */
  text?: string;
  /** 加载组件尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
  /** 子组件 */
  children?: React.ReactNode;
}

export interface SpinnerProps {
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 颜色 */
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  /** 自定义类名 */
  className?: string;
}

export interface ProgressProps {
  /** 当前进度值 (0-100) */
  value: number;
  /** 最大值 */
  max?: number;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 颜色主题 */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** 是否显示进度文字 */
  showText?: boolean;
  /** 自定义进度文字格式化函数 */
  formatText?: (value: number, max: number) => string;
  /** 是否显示动画 */
  animated?: boolean;
  /** 是否显示条纹 */
  striped?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 标签文本 */
  label?: string;
}

export interface SkeletonProps {
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 骨架屏行数 */
  rows?: number;
  /** 是否显示头像占位 */
  avatar?: boolean;
  /** 头像尺寸 */
  avatarSize?: 'sm' | 'md' | 'lg';
  /** 是否显示段落占位 */
  paragraph?: boolean;
  /** 段落行数 */
  paragraphRows?: number;
  /** 是否显示标题占位 */
  title?: boolean;
  /** 标题宽度 */
  titleWidth?: string | number;
  /** 是否激活动画 */
  active?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子组件 */
  children?: React.ReactNode;
}

export interface SkeletonImageProps {
  /** 图片宽度 */
  width?: string | number;
  /** 图片高度 */
  height?: string | number;
  /** 是否圆形 */
  circle?: boolean;
  /** 自定义类名 */
  className?: string;
}

export interface SkeletonTextProps {
  /** 文本宽度 */
  width?: string | number;
  /** 文本行数 */
  rows?: number;
  /** 是否激活动画 */
  active?: boolean;
  /** 自定义类名 */
  className?: string;
}

export interface LoadingOverlayProps {
  /** 是否显示遮罩 */
  visible: boolean;
  /** 遮罩透明度 */
  opacity?: number;
  /** 背景颜色 */
  background?: string;
  /** 是否模糊背景 */
  blur?: boolean;
  /** 加载器类型 */
  loader?: 'spinner' | 'dots' | 'bars';
  /** 加载文案 */
  text?: string;
  /** 自定义类名 */
  className?: string;
  /** 子组件 */
  children?: React.ReactNode;
}

export interface DotsLoaderProps {
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 颜色 */
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  /** 自定义类名 */
  className?: string;
}

export interface BarsLoaderProps {
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 颜色 */
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  /** 柱子数量 */
  bars?: number;
  /** 自定义类名 */
  className?: string;
} 