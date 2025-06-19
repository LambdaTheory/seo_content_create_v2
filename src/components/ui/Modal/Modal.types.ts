import { ReactNode } from 'react';

/**
 * Modal组件的基础属性接口
 */
export interface ModalProps {
  /** 是否显示模态框 */
  open: boolean;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
  /** 模态框标题 */
  title?: string;
  /** 模态框内容 */
  children: ReactNode;
  /** 模态框尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 是否点击遮罩层关闭 */
  closeOnOverlayClick?: boolean;
  /** 是否按ESC键关闭 */
  closeOnEscape?: boolean;
  /** 是否显示头部 */
  showHeader?: boolean;
  /** 是否显示底部 */
  showFooter?: boolean;
  /** 头部内容 */
  header?: ReactNode;
  /** 底部内容 */
  footer?: ReactNode;
  /** 自定义模态框类名 */
  className?: string;
  /** 自定义内容区域类名 */
  contentClassName?: string;
  /** 自定义头部类名 */
  headerClassName?: string;
  /** 自定义底部类名 */
  footerClassName?: string;
  /** 自定义遮罩层类名 */
  overlayClassName?: string;
  /** 动画类型 */
  animation?: 'fade' | 'slide' | 'zoom' | 'none';
  /** 是否居中显示 */
  centered?: boolean;
  /** 是否可滚动 */
  scrollable?: boolean;
  /** 最大高度 */
  maxHeight?: string;
  /** z-index值 */
  zIndex?: number;
  /** 是否禁用body滚动 */
  disableBodyScroll?: boolean;
  /** 焦点管理 */
  autoFocus?: boolean;
  /** 返回焦点的元素 */
  returnFocus?: boolean;
  /** 焦点陷阱 */
  trapFocus?: boolean;
  /** aria-label */
  'aria-label'?: string;
  /** aria-labelledby */
  'aria-labelledby'?: string;
  /** aria-describedby */
  'aria-describedby'?: string;
}

/**
 * ModalHeader组件属性接口
 */
export interface ModalHeaderProps {
  /** 标题 */
  title?: string;
  /** 子组件 */
  children?: ReactNode;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 关闭按钮回调 */
  onClose?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * ModalBody组件属性接口
 */
export interface ModalBodyProps {
  /** 子组件 */
  children: ReactNode;
  /** 是否可滚动 */
  scrollable?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * ModalFooter组件属性接口
 */
export interface ModalFooterProps {
  /** 子组件 */
  children: ReactNode;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right' | 'between';
  /** 自定义类名 */
  className?: string;
}

/**
 * ModalOverlay组件属性接口
 */
export interface ModalOverlayProps {
  /** 是否可见 */
  visible: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 动画类型 */
  animation?: 'fade' | 'none';
  /** z-index值 */
  zIndex?: number;
} 