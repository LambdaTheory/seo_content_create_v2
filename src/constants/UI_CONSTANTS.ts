/**
 * UI相关常量配置
 * 遵循产品设计文档中的设计规范
 */

// 按钮高度配置
export const BUTTON_HEIGHT = {
  sm: '32px',
  md: '40px',
  lg: '48px',
} as const;

// 间距系统 - 8px基准
export const SPACING = {
  1: '4px',   // 0.25rem
  2: '8px',   // 0.5rem
  3: '12px',  // 0.75rem
  4: '16px',  // 1rem
  5: '20px',  // 1.25rem
  6: '24px',  // 1.5rem
  8: '32px',  // 2rem
  12: '48px', // 3rem
} as const;

// 圆角配置
export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

// 阴影层级
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// 布局尺寸
export const LAYOUT = {
  HEADER_HEIGHT: '64px',
  SIDEBAR_WIDTH: '240px',
  SIDEBAR_COLLAPSED_WIDTH: '60px',
  FOOTER_HEIGHT: '40px',
  LOGO_WIDTH: '160px',
} as const;

// 动画持续时间
export const ANIMATION_DURATION = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
} as const;

// Z-index层级
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal_backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// 响应式断点
export const BREAKPOINTS = {
  sm: '640px',   // 平板竖屏
  md: '768px',   // 平板横屏
  lg: '1024px',  // 笔记本
  xl: '1280px',  // 桌面
  '2xl': '1536px', // 大屏桌面
} as const;

// 字体大小
export const FONT_SIZE = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
} as const;

// 行高
export const LINE_HEIGHT = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const; 