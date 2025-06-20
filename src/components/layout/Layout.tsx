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

/**
 * 布局上下文
 */
const LayoutContext = createContext<LayoutContextValue | null>(null);

/**
 * 使用布局上下文Hook
 */
export const useLayout = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

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
 * 主布局组件
 */
export const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebar = true,
  showHeader = true,
  showFooter = true,
  className,
  sidebarCollapsed: externalSidebarCollapsed,
  onSidebarToggle,
}) => {
  // 内部状态管理
  const [internalSidebarCollapsed, setInternalSidebarCollapsed] = useState(false);
  const [breakpoint, setBreakpoint] = useState<LayoutBreakpoint>('lg');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // 使用外部控制的侧边栏状态，否则使用内部状态
  const sidebarCollapsed = externalSidebarCollapsed !== undefined 
    ? externalSidebarCollapsed 
    : internalSidebarCollapsed;

  // 响应式断点检测
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const currentBreakpoint = getBreakpoint(width);
      setBreakpoint(currentBreakpoint);
      
      // 在移动端自动收起侧边栏
      if (currentBreakpoint === 'sm' || currentBreakpoint === 'md') {
        if (externalSidebarCollapsed === undefined) {
          setInternalSidebarCollapsed(true);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [externalSidebarCollapsed]);

  // 主题初始化
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // 主题应用
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 侧边栏切换处理
  const handleSidebarToggle = useCallback(() => {
    if (onSidebarToggle) {
      onSidebarToggle(!sidebarCollapsed);
    } else {
      setInternalSidebarCollapsed(prev => !prev);
    }
  }, [sidebarCollapsed, onSidebarToggle]);

  // 主题切换处理
  const handleThemeToggle = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // 计算断点状态
  const isMobile = breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = !isMobile && !isTablet;

  // 布局上下文值
  const layoutContextValue: LayoutContextValue = {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    sidebarCollapsed,
    toggleSidebar: handleSidebarToggle,
    theme,
    toggleTheme: handleThemeToggle,
  };

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div 
        className={cn(
          'min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200',
          className
        )}
      >
        {/* 头部导航栏 */}
        {showHeader && (
          <header 
            className={cn(
              'fixed top-0 left-0 right-0 z-50',
              'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
              'transition-all duration-300 ease-in-out'
            )}
            style={{ height: `${LAYOUT_SIZES.HEADER_HEIGHT}px` }}
          >
            {/* 头部内容将在Header组件中实现 */}
            <div className="h-full flex items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  SEO内容生成工具
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleThemeToggle}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="切换主题"
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
                {showSidebar && (
                  <button
                    onClick={handleSidebarToggle}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
                    aria-label="切换侧边栏"
                  >
                    ☰
                  </button>
                )}
              </div>
            </div>
          </header>
        )}

        {/* 侧边栏 */}
        {showSidebar && (
          <aside
            className={cn(
              'fixed top-0 left-0 bottom-0 z-40',
              'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
              'transition-all duration-300 ease-in-out',
              sidebarCollapsed ? 'w-16' : 'w-60'
            )}
            style={{ 
              top: showHeader ? `${LAYOUT_SIZES.HEADER_HEIGHT}px` : '0',
              bottom: showFooter ? `${LAYOUT_SIZES.FOOTER_HEIGHT}px` : '0'
            }}
          >
            {/* 侧边栏内容将在Sidebar组件中实现 */}
            <div className="h-full p-4">
              <nav className="space-y-2">
                <div className={cn(
                  'flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700',
                  sidebarCollapsed && 'justify-center'
                )}>
                  <span>📊</span>
                  {!sidebarCollapsed && <span className="text-gray-700 dark:text-gray-300">工作流</span>}
                </div>
                <div className={cn(
                  'flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700',
                  sidebarCollapsed && 'justify-center'
                )}>
                  <span>📁</span>
                  {!sidebarCollapsed && <span className="text-gray-700 dark:text-gray-300">数据上传</span>}
                </div>
                <div className={cn(
                  'flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700',
                  sidebarCollapsed && 'justify-center'
                )}>
                  <span>⚡</span>
                  {!sidebarCollapsed && <span className="text-gray-700 dark:text-gray-300">内容生成</span>}
                </div>
                <div className={cn(
                  'flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700',
                  sidebarCollapsed && 'justify-center'
                )}>
                  <span>📋</span>
                  {!sidebarCollapsed && <span className="text-gray-700 dark:text-gray-300">结果查看</span>}
                </div>
              </nav>
            </div>
          </aside>
        )}

        {/* 主内容区域 */}
        <ContentArea
          hasSidebar={showSidebar}
          hasHeader={showHeader}
          hasFooter={showFooter}
          sidebarCollapsed={sidebarCollapsed}
        >
          {children}
        </ContentArea>

        {/* 底部状态栏 */}
        {showFooter && (
          <footer
            className={cn(
              'fixed bottom-0 left-0 right-0 z-30',
              'bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700',
              'transition-all duration-300 ease-in-out'
            )}
            style={{ 
              height: `${LAYOUT_SIZES.FOOTER_HEIGHT}px`,
              paddingLeft: showSidebar ? (sidebarCollapsed ? '64px' : '240px') : '0'
            }}
          >
            {/* 底部状态栏内容将在Footer组件中实现 */}
            <div className="h-full flex items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  就绪
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {breakpoint.toUpperCase()} - {window.innerWidth}px
                </span>
              </div>
            </div>
          </footer>
        )}
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout; 