import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LayoutContextValue, LayoutBreakpoint, LayoutTheme, getBreakpoint } from './Layout.types';

// 创建Layout Context
const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

// useLayout hook
export const useLayout = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

// Layout Provider Props
interface LayoutProviderProps {
  children: ReactNode;
}

// Layout Provider组件
export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [breakpoint, setBreakpoint] = useState<LayoutBreakpoint>('lg');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [theme, setTheme] = useState<LayoutTheme>('light');

  // 响应式断点检测
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const currentBreakpoint = getBreakpoint(width);
      setBreakpoint(currentBreakpoint);
      
      // 在移动端自动收起侧边栏
      if (currentBreakpoint === 'sm') {
        setSidebarCollapsed(true);
        setSidebarMobileOpen(false);
      }
      // 在平板端自动收起侧边栏
      else if (currentBreakpoint === 'md') {
        setSidebarCollapsed(true);
        setSidebarMobileOpen(false);
      }
      // 桌面端可以展开侧边栏
      else {
        setSidebarMobileOpen(false);
      }
    };

    // 初始化
    handleResize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 主题初始化和持久化
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as LayoutTheme | null;
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

  // 计算断点状态
  const isMobile = breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';

  // 侧边栏切换
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // 主题切换
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const contextValue: LayoutContextValue = {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    sidebarCollapsed,
    sidebarMobileOpen,
    toggleSidebar,
    setSidebarMobileOpen,
    theme,
    toggleTheme,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
}; 