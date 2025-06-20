import { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export interface ToastProps {
  /** 唯一标识符 */
  id: string;
  /** 通知类型 */
  type: ToastType;
  /** 标题 */
  title?: string;
  /** 消息内容 */
  message: string;
  /** 自定义图标 */
  icon?: ReactNode;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 自动关闭时间（毫秒），0表示不自动关闭 */
  duration?: number;
  /** 是否可点击 */
  clickable?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 关闭回调 */
  onClose?: (id: string) => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 动画持续时间 */
  animationDuration?: number;
}

export interface ToastContainerProps {
  /** Toast显示位置 */
  position?: ToastPosition;
  /** 最大显示数量 */
  maxToasts?: number;
  /** 容器自定义类名 */
  className?: string;
  /** 容器自定义样式 */
  style?: React.CSSProperties;
  /** Toast间距 */
  spacing?: number;
  /** 是否反转顺序（新的在上面） */
  reverseOrder?: boolean;
}

export interface ToastOptions extends Omit<ToastProps, 'id' | 'onClose'> {
  /** Toast ID，如果不提供会自动生成 */
  id?: string;
}

export interface ToastState {
  /** 当前显示的toasts */
  toasts: ToastProps[];
  /** 添加toast */
  addToast: (options: ToastOptions) => string;
  /** 移除toast */
  removeToast: (id: string) => void;
  /** 清除所有toast */
  clearToasts: () => void;
  /** 更新toast */
  updateToast: (id: string, options: Partial<ToastOptions>) => void;
}

export interface UseToastReturn {
  /** 显示成功通知 */
  success: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  /** 显示错误通知 */
  error: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  /** 显示警告通知 */
  warning: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  /** 显示信息通知 */
  info: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  /** 显示自定义通知 */
  toast: (options: ToastOptions) => string;
  /** 移除通知 */
  dismiss: (id: string) => void;
  /** 清除所有通知 */
  dismissAll: () => void;
  /** 当前通知列表 */
  toasts: ToastProps[];
}

export interface ToastHookOptions {
  /** 默认位置 */
  position?: ToastPosition;
  /** 默认自动关闭时间 */
  duration?: number;
  /** 最大显示数量 */
  maxToasts?: number;
  /** 是否反转顺序 */
  reverseOrder?: boolean;
} 