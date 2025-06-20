import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  LayoutProps, 
  LayoutContainerProps, 
  ContentAreaProps, 
  LayoutDividerProps,
  LayoutGridProps,
  LayoutContextValue,
  LayoutBreakpoint,
  LAYOUT_SIZES,
  LAYOUT_BREAKPOINTS
} from './Layout.types';
import { cn } from '@/utils/classNames';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { LayoutProvider, useLayout } from './useLayout';

/**
 * 获取当前断点
 */
const getBreakpoint = (width: number): LayoutBreakpoint => {
  if (width >= LAYOUT_BREAKPOINTS['2xl']) return '2xl';
  if (width >= LAYOUT_BREAKPOINTS.xl) return 'xl';
  if (width >= LAYOUT_BREAKPOINTS.lg) return 'lg';
  if (width >= LAYOUT_BREAKPOINTS.md) return 'md';
  return 'sm';
};

/**
 * 布局容器组件
 */
export const LayoutContainer: React.FC<LayoutContainerProps> = ({
  children,
  className,
  fullscreen = false,
  maxWidth = 'full',
  padding = 'md',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        fullscreen ? 'h-screen' : 'min-h-screen',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * 内容区域组件
 */
export const ContentArea: React.FC<ContentAreaProps> = ({
  children,
  className,
  hasSidebar = true,
  hasHeader = true,
  hasFooter = true,
  sidebarCollapsed = false,
  padding = 'md',
  scrollable = true,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-6',
    lg: 'p-8',
  };

  // 计算内容区域的位置和尺寸
  const getContentStyles = () => {
    const styles: React.CSSProperties = {};
    
    // 顶部偏移（头部高度）
    if (hasHeader) {
      styles.paddingTop = `${LAYOUT_SIZES.HEADER_HEIGHT}px`;
    }
    
    // 左侧偏移（侧边栏宽度）
    if (hasSidebar) {
      const sidebarWidth = sidebarCollapsed 
        ? LAYOUT_SIZES.SIDEBAR_COLLAPSED_WIDTH 
        : LAYOUT_SIZES.SIDEBAR_WIDTH;
      styles.paddingLeft = `${sidebarWidth}px`;
    }
    
    // 底部偏移（底部状态栏高度）
    if (hasFooter) {
      styles.paddingBottom = `${LAYOUT_SIZES.FOOTER_HEIGHT}px`;
    }

    return styles;
  };

  return (
    <main
      className={cn(
        'flex-1 transition-all duration-300 ease-in-out',
        scrollable ? 'overflow-auto' : 'overflow-hidden',
        paddingClasses[padding],
        className
      )}
      style={getContentStyles()}
    >
      <div className="w-full h-full">
        {children}
      </div>
    </main>
  );
};

/**
 * 布局分割线组件
 */
export const LayoutDivider: React.FC<LayoutDividerProps> = ({
  orientation = 'horizontal',
  size = 'thin',
  className,
  shadow = false,
}) => {
  const orientationClasses = {
    horizontal: 'w-full h-px',
    vertical: 'w-px h-full',
  };

  const sizeClasses = {
    thin: orientation === 'horizontal' ? 'h-px' : 'w-px',
    medium: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
    thick: orientation === 'horizontal' ? 'h-1' : 'w-1',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        orientationClasses[orientation],
        sizeClasses[size],
        shadow && (orientation === 'horizontal' 
          ? 'shadow-sm' 
          : 'shadow-sm'
        ),
        className
      )}
    />
  );
};

/**
 * 布局网格组件
 */
export const LayoutGrid: React.FC<LayoutGridProps> = ({
  children,
  cols = 12,
  gap = 'md',
  className,
  responsive,
}) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  // 响应式类名
  const responsiveClasses = responsive ? [
    responsive.sm && `sm:grid-cols-${responsive.sm}`,
    responsive.md && `md:grid-cols-${responsive.md}`,
    responsive.lg && `lg:grid-cols-${responsive.lg}`,
    responsive.xl && `xl:grid-cols-${responsive.xl}`,
  ].filter(Boolean).join(' ') : '';

  return (
    <div
      className={cn(
        'grid',
        colsClasses[cols],
        gapClasses[gap],
        responsiveClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * 主布局组件，提供应用的整体布局结构
 * 支持响应式设计：
 * - 移动端：侧边栏抽屉式
 * - 平板端：侧边栏收起模式
 * - 桌面端：完整布局
 */
const LayoutComponent: React.FC<LayoutProps> = ({
  children,
  className,
  showHeader = true,
  showSidebar = true,
  showFooter = true,
  sidebarCollapsed: controlledCollapsed,
  onSidebarToggle,
  theme: controlledTheme,
  onThemeChange,
  ...props
}) => {
  const {
    theme,
    toggleTheme,
    sidebarCollapsed,
    toggleSidebar,
    sidebarMobileOpen,
    setSidebarMobileOpen,
    isMobile,
    isTablet,
    isDesktop
  } = useLayout();

  // 使用受控或非受控模式
  const actualTheme = controlledTheme ?? theme;
  const actualCollapsed = controlledCollapsed ?? sidebarCollapsed;

  const handleThemeChange = () => {
    if (onThemeChange) {
      onThemeChange(actualTheme === 'light' ? 'dark' : 'light');
    } else {
      toggleTheme();
    }
  };

  const handleSidebarToggle = () => {
    if (onSidebarToggle) {
      onSidebarToggle(!actualCollapsed);
    } else {
      toggleSidebar();
    }
  };

  // 移动端专用的侧边栏切换
  const handleMobileSidebarToggle = () => {
    setSidebarMobileOpen(!sidebarMobileOpen);
  };

  // 移动端侧边栏关闭
  const handleMobileSidebarClose = () => {
    setSidebarMobileOpen(false);
  };

  // 计算布局类名
  const layoutClasses = cn(
    'min-h-screen',
    'flex flex-col',
    'bg-gray-50 dark:bg-gray-900',
    'transition-colors duration-200',
    // 桌面端最大宽度限制
    'max-w-[1920px] mx-auto',
    className
  );

  // 计算主容器类名
  const mainContainerClasses = cn(
    'flex flex-1',
    'relative',
    // 移动端全宽，桌面端自适应
    'w-full'
  );

  // 计算主内容区类名
  const mainContentClasses = cn(
    'flex-1',
    'min-w-0', // 防止flex子元素溢出
    'transition-all duration-200 ease-in-out',
    {
      // 桌面端侧边栏处理
      'lg:ml-60': showSidebar && !actualCollapsed && isDesktop,
      'lg:ml-15': showSidebar && actualCollapsed && isDesktop,
      // 平板端侧边栏收起
      'md:ml-15': showSidebar && isTablet,
      // 移动端全宽
      'ml-0': isMobile,
    }
  );

  // 移动端遮罩层
  const mobileOverlayClasses = cn(
    'fixed inset-0',
    'bg-black/50',
    'z-40',
    'lg:hidden',
    'transition-opacity duration-200',
    {
      'opacity-100 pointer-events-auto': sidebarMobileOpen,
      'opacity-0 pointer-events-none': !sidebarMobileOpen,
    }
  );

  return (
    <div className={layoutClasses} data-theme={actualTheme} {...props}>
      {/* Header */}
      {showHeader && (
        <Header
          theme={actualTheme}
          onThemeToggle={handleThemeChange}
          onSidebarToggle={isMobile ? handleMobileSidebarToggle : handleSidebarToggle}
          sidebarCollapsed={actualCollapsed}
          className="relative z-30"
        />
      )}

      {/* 主容器 */}
      <div className={mainContainerClasses}>
        {/* 移动端遮罩层 */}
        {showSidebar && (
          <div 
            className={mobileOverlayClasses}
            onClick={handleMobileSidebarClose}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            collapsed={isMobile ? false : actualCollapsed}
            onToggle={isMobile ? handleMobileSidebarClose : handleSidebarToggle}
            className={cn(
              // 桌面端固定定位
              'lg:fixed lg:top-16 lg:left-0 lg:bottom-10 lg:z-20',
              // 平板端固定定位但收起
              'md:fixed md:top-16 md:left-0 md:bottom-10 md:z-20',
              // 移动端抽屉式
              'fixed top-16 left-0 bottom-10 z-50',
              'transition-transform duration-200 ease-in-out',
              {
                // 移动端显示/隐藏
                'translate-x-0': !isMobile || sidebarMobileOpen,
                '-translate-x-full': isMobile && !sidebarMobileOpen,
                // 平板端始终显示但收起
                'lg:translate-x-0': isTablet || isDesktop,
              }
            )}
            // 移动端特殊处理
            mobileOpen={sidebarMobileOpen}
            onMobileClose={handleMobileSidebarClose}
          />
        )}

        {/* 主内容区 */}
        <main className={mainContentClasses}>
          <div className={cn(
            'min-h-full',
            'flex flex-col',
            // 内容区内边距
            'p-4 sm:p-6 lg:p-8',
            // 顶部边距（考虑固定头部）
            'pt-4 sm:pt-6 lg:pt-8',
            // 底部边距（考虑固定底部）
            'pb-12 sm:pb-16 lg:pb-20'
          )}>
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {showFooter && (
        <Footer 
          className={cn(
            'relative z-30',
            // 桌面端左边距适应侧边栏
            {
              'lg:ml-60': showSidebar && !actualCollapsed && isDesktop,
              'lg:ml-15': showSidebar && actualCollapsed && isDesktop,
              'md:ml-15': showSidebar && isTablet,
              'ml-0': isMobile,
            }
          )}
          collapsed={actualCollapsed}
        />
      )}

      {/* 触摸友好的悬浮按钮区域（移动端） */}
      {isMobile && showSidebar && (
        <button
          onClick={handleMobileSidebarToggle}
          className={cn(
            'fixed bottom-20 right-4',
            'w-14 h-14', // 触摸友好的尺寸
            'bg-primary-600 text-white',
            'rounded-full shadow-lg',
            'flex items-center justify-center',
            'z-40',
            'transition-all duration-200',
            'hover:bg-primary-700',
            'active:scale-95',
            // 只在移动端未打开侧边栏时显示
            {
              'opacity-100 translate-y-0': !sidebarMobileOpen,
              'opacity-0 translate-y-2': sidebarMobileOpen,
            }
          )}
          aria-label="打开侧边栏"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * 布局组件包装器，提供Layout Context
 */
export const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <LayoutProvider>
      <LayoutComponent {...props} />
    </LayoutProvider>
  );
};

export default Layout; 