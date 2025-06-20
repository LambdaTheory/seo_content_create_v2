import React, { ReactNode } from 'react';

/**
 * 主布局组件属性
 */
export interface LayoutProps {
  /** 子内容 */
  children: ReactNode;
  /** 是否显示侧边栏 */
  showSidebar?: boolean;
  /** 是否显示头部 */
  showHeader?: boolean;
  /** 是否显示底部状态栏 */
  showFooter?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 侧边栏是否收起（响应式） */
  sidebarCollapsed?: boolean;
  /** 侧边栏收起状态变化回调 */
  onSidebarToggle?: (collapsed: boolean) => void;
  /** 受控的主题状态 */
  theme?: 'light' | 'dark';
  /** 主题变更回调 */
  onThemeChange?: (theme: 'light' | 'dark') => void;
  /** 其他HTML属性 */
  [key: string]: any;
}

/**
 * 布局容器属性
 */
export interface LayoutContainerProps {
  /** 子内容 */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否全屏模式 */
  fullscreen?: boolean;
  /** 最大宽度限制 */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** 内边距 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * 内容区域属性
 */
export interface ContentAreaProps {
  /** 子内容 */
  children: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否显示侧边栏 */
  hasSidebar?: boolean;
  /** 是否显示头部 */
  hasHeader?: boolean;
  /** 是否显示底部 */
  hasFooter?: boolean;
  /** 侧边栏是否收起 */
  sidebarCollapsed?: boolean;
  /** 内容区域内边距 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 是否可滚动 */
  scrollable?: boolean;
}

/**
 * 布局分割线属性
 */
export interface LayoutDividerProps {
  /** 分割线方向 */
  orientation?: 'horizontal' | 'vertical';
  /** 分割线粗细 */
  size?: 'thin' | 'medium' | 'thick';
  /** 自定义类名 */
  className?: string;
  /** 是否显示阴影 */
  shadow?: boolean;
}

/**
 * 布局网格属性
 */
export interface LayoutGridProps {
  /** 子内容 */
  children: React.ReactNode;
  /** 列数 */
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  /** 间距 */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** 自定义类名 */
  className?: string;
  /** 响应式断点配置 */
  responsive?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

/**
 * 布局断点
 */
export type LayoutBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 主题类型
 */
export type LayoutTheme = 'light' | 'dark';

/**
 * 布局上下文
 */
export interface LayoutContextValue {
  /** 当前断点 */
  breakpoint: LayoutBreakpoint;
  /** 是否移动端 */
  isMobile: boolean;
  /** 是否平板端 */
  isTablet: boolean;
  /** 是否桌面端 */
  isDesktop: boolean;
  /** 侧边栏是否收起 */
  sidebarCollapsed: boolean;
  /** 侧边栏是否移动端打开 */
  sidebarMobileOpen: boolean;
  /** 切换侧边栏状态 */
  toggleSidebar: () => void;
  /** 设置侧边栏移动端打开状态 */
  setSidebarMobileOpen: (open: boolean) => void;
  /** 当前主题 */
  theme: LayoutTheme;
  /** 切换主题 */
  toggleTheme: () => void;
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  /** 头部高度 */
  headerHeight: number;
  /** 侧边栏宽度 */
  sidebarWidth: number;
  /** 侧边栏收起宽度 */
  sidebarCollapsedWidth: number;
  /** 底部状态栏高度 */
  footerHeight: number;
  /** 断点配置 */
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
}

/**
 * 布局尺寸常量
 */
export const LAYOUT_SIZES = {
  HEADER_HEIGHT: 64,
  SIDEBAR_WIDTH: 240,
  SIDEBAR_COLLAPSED_WIDTH: 60,
  FOOTER_HEIGHT: 40,
  LOGO_WIDTH: 160,
} as const;

/**
 * 布局断点常量
 */
export const LAYOUT_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * 断点检测函数
 */
export const getBreakpoint = (width: number): LayoutBreakpoint => {
  if (width < 640) return 'sm';
  if (width < 768) return 'md'; 
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
}; 