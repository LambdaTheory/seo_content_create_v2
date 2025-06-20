import React, { useEffect, useRef, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps, ModalOverlayProps } from './Modal.types';
import { cn, createVariants } from '@/utils/classNames';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Modal容器样式配置
 */
const modalVariants = createVariants({
  base: [
    'fixed inset-0 flex items-center justify-center p-4',
    'overflow-x-hidden overflow-y-auto',
  ].join(' '),
  variants: {
    size: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4',
    },
    centered: {
      true: 'items-center',
      false: 'items-start pt-16',
    },
  },
  defaultVariants: {
    size: 'md',
    centered: 'true' as const,
  },
});

/**
 * Modal内容样式配置
 */
const modalContentVariants = createVariants({
  base: [
    'relative w-full bg-white rounded-lg shadow-xl',
    'flex flex-col max-h-full',
    'transform transition-all duration-300 ease-out',
  ].join(' '),
  variants: {
    animation: {
      fade: 'opacity-0 data-[state=open]:opacity-100',
      slide: 'translate-y-4 opacity-0 data-[state=open]:translate-y-0 data-[state=open]:opacity-100',
      zoom: 'scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
      none: '',
    },
  },
  defaultVariants: {
    animation: 'fade',
  },
});

/**
 * Modal遮罩层组件
 */
const ModalOverlay = forwardRef<HTMLDivElement, ModalOverlayProps>(
  ({ visible, onClick, className, animation = 'fade', zIndex = 40 }, ref) => {
    if (!visible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 bg-black/50 transition-opacity duration-300 cursor-pointer',
          animation === 'fade' && 'opacity-0 data-[state=open]:opacity-100',
          className
        )}
        style={{ zIndex }}
        onClick={onClick}
        data-state={visible ? 'open' : 'closed'}
        aria-hidden="true"
      />
    );
  }
);

ModalOverlay.displayName = 'ModalOverlay';

/**
 * Modal头部组件
 */
export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ title, children, showCloseButton = true, onClose, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between p-6 border-b border-gray-200',
          className
        )}
      >
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 leading-6">
              {title}
            </h3>
          )}
          {children}
        </div>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'ml-4 p-2 text-gray-400 hover:text-gray-600',
              'rounded-md hover:bg-gray-100 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
            aria-label="关闭"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
);

ModalHeader.displayName = 'ModalHeader';

/**
 * Modal主体组件
 */
export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ children, scrollable = true, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex-1 p-6',
          scrollable ? 'overflow-y-auto' : 'overflow-hidden',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

ModalBody.displayName = 'ModalBody';

/**
 * Modal底部组件
 */
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, align = 'right', className }, ref) => {
    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 p-6 border-t border-gray-200',
          alignClasses[align],
          className
        )}
      >
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = 'ModalFooter';

/**
 * Modal 主组件
 * 
 * 功能特性：
 * - 支持多种尺寸：sm、md、lg、xl、full
 * - 支持多种动画：fade、slide、zoom、none
 * - 完整的键盘支持（ESC关闭、Tab焦点陷阱）
 * - 自动焦点管理和焦点恢复
 * - 可配置的关闭行为
 * - 完整的无障碍支持
 * - Portal渲染到body
 * - Body滚动锁定
 * 
 * @example
 * ```tsx
 * <Modal open={isOpen} onClose={handleClose} title="确认操作">
 *   <p>确定要删除这个项目吗？</p>
 * </Modal>
 * 
 * <Modal 
 *   open={isOpen} 
 *   onClose={handleClose}
 *   size="lg"
 *   animation="slide"
 *   showHeader={false}
 * >
 *   <ModalHeader title="自定义头部" />
 *   <ModalBody>内容区域</ModalBody>
 *   <ModalFooter align="between">
 *     <Button variant="outline">取消</Button>
 *     <Button>确认</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      children,
      size = 'md',
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showHeader = true,
      showFooter = false,
      header,
      footer,
      className,
      contentClassName,
      headerClassName,
      footerClassName,
      overlayClassName,
      animation = 'fade',
      centered = true,
      scrollable = true,
      maxHeight,
      zIndex = 50,
      disableBodyScroll = true,
      autoFocus = true,
      returnFocus = true,
      trapFocus = true,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // 获取可聚焦元素
    const getFocusableElements = useCallback((container: HTMLElement) => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    }, []);

    // 处理ESC键关闭
    const handleEscapeKey = useCallback((event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }, [closeOnEscape, onClose]);

    // 处理Tab键焦点陷阱
    const handleTabKey = useCallback((event: KeyboardEvent) => {
      if (!trapFocus || event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = getFocusableElements(modal);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }, [trapFocus, getFocusableElements]);

    // 处理遮罩层点击
    const handleOverlayClick = useCallback(() => {
      if (closeOnOverlayClick) {
        onClose();
      }
    }, [closeOnOverlayClick, onClose]);

    // 处理模态框容器点击
    const handleContainerClick = useCallback((event: React.MouseEvent) => {
      // 只有点击容器本身（不是子元素）时才关闭
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose();
      }
    }, [closeOnOverlayClick, onClose]);

    // 处理焦点管理
    useEffect(() => {
      if (open) {
        // 保存当前聚焦元素
        if (returnFocus) {
          previousActiveElement.current = document.activeElement as HTMLElement;
        }

        // 禁用body滚动
        if (disableBodyScroll) {
          document.body.style.overflow = 'hidden';
        }

        // 自动聚焦第一个可聚焦元素
        if (autoFocus) {
          const timer = setTimeout(() => {
            const modal = modalRef.current;
            if (modal) {
              const focusableElements = getFocusableElements(modal);
              if (focusableElements.length > 0) {
                focusableElements[0].focus();
              } else {
                modal.focus();
              }
            }
          }, 100);
          return () => clearTimeout(timer);
        }
      } else {
        // 恢复body滚动
        if (disableBodyScroll) {
          document.body.style.overflow = '';
        }

        // 恢复焦点
        if (returnFocus && previousActiveElement.current) {
          previousActiveElement.current.focus();
          previousActiveElement.current = null;
        }
      }
    }, [open, autoFocus, returnFocus, disableBodyScroll, getFocusableElements]);

    // 绑定键盘事件
    useEffect(() => {
      if (open) {
        document.addEventListener('keydown', handleEscapeKey);
        document.addEventListener('keydown', handleTabKey);

        return () => {
          document.removeEventListener('keydown', handleEscapeKey);
          document.removeEventListener('keydown', handleTabKey);
        };
      }
    }, [open, handleEscapeKey, handleTabKey]);

    // 不渲染未打开的模态框
    if (!open) return null;

    const modalContent = (
      <>
        {/* 遮罩层 */}
        <ModalOverlay
          ref={overlayRef}
          visible={open}
          animation={animation === 'fade' ? 'fade' : 'none'}
          zIndex={zIndex}
          className={overlayClassName}
          onClick={handleOverlayClick}
        />
        
        {/* 模态框容器 */}
        <div
          className={modalVariants({
            size,
            centered: centered ? 'true' : 'false',
            className,
          })}
          style={{ zIndex: zIndex + 10 }}
          onClick={handleContainerClick}
        >
          {/* 模态框内容 */}
          <div
            ref={ref || modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            aria-describedby={ariaDescribedby}
            tabIndex={-1}
            className={modalContentVariants({
              animation,
              className: cn(
                maxHeight && `max-h-[${maxHeight}]`,
                contentClassName
              ),
            })}
            data-state={open ? 'open' : 'closed'}
            style={{ maxHeight }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            {(showHeader || header) && (
              <>
                {header || (
                  <ModalHeader
                    title={title}
                    showCloseButton={showCloseButton}
                    onClose={onClose}
                    className={headerClassName}
                  />
                )}
              </>
            )}

            {/* 主体内容 */}
            <ModalBody scrollable={scrollable}>
              {children}
            </ModalBody>

            {/* 底部 */}
            {(showFooter || footer) && (
              <>
                {footer || (
                  <ModalFooter className={footerClassName}>
                    <div></div>
                  </ModalFooter>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );

    // 使用Portal渲染到body
    if (typeof window === 'undefined') {
      return null;
    }
    
    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';

export default Modal; 