import React, { ReactNode } from 'react';

/**
 * 侧边栏组件属性
 */
export interface SidebarProps {
  /** 是否收起 */
  collapsed?: boolean;
  /** 收起状态切换回调 */
  onToggle?: () => void;
  /** 宽度（正常状态） */
  width?: number;
  /** 收起时宽度 */
  collapsedWidth?: number;
  /** 自定义类名 */
  className?: string;
  /** 侧边栏位置 */
  position?: 'left' | 'right';
  /** 是否可调整大小 */
  resizable?: boolean;
  /** 是否显示切换按钮 */
  showToggleButton?: boolean;
  /** 是否覆盖内容（移动端） */
  overlay?: boolean;
  /** 覆盖模式点击外部关闭 */
  closeOnOverlayClick?: boolean;
  /** 子内容 */
  children?: React.ReactNode;
  /** 顶部内容 */
  header?: React.ReactNode;
  /** 底部内容 */
  footer?: React.ReactNode;
  /** 移动端是否打开 */
  mobileOpen?: boolean;
  /** 移动端关闭回调 */
  onMobileClose?: () => void;
  /** 自定义菜单项 */
  menuItems?: SidebarMenuItem[];
  /** 自定义菜单分组 */
  menuGroups?: SidebarMenuGroup[];
  /** 当前激活的菜单项ID */
  activeMenuItem?: string;
  /** 菜单项点击回调 */
  onMenuItemClick?: (item: SidebarMenuItem) => void;
  /** 是否显示搜索框 */
  showSearch?: boolean;
  /** 搜索框占位符 */
  searchPlaceholder?: string;
  /** 搜索回调 */
  onSearch?: (query: string) => void;
  /** 切换按钮位置 */
  togglePosition?: 'top' | 'bottom';
  /** 其他HTML属性 */
  [key: string]: any;
}

/**
 * 侧边栏菜单项
 */
export interface SidebarMenuItem {
  /** 菜单项ID */
  id: string;
  /** 菜单项标题 */
  title?: string;
  /** 菜单项标签（显示文本） */
  label: string;
  /** 菜单项图标 */
  icon?: ReactNode;
  /** 菜单项链接 */
  href?: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否激活 */
  active?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子菜单 */
  children?: SidebarMenuItem[];
  /** 徽章文本 */
  badge?: string | number;
  /** 徽章类型 */
  badgeType?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** 是否展开（有子菜单时） */
  expanded?: boolean;
  /** 菜单项类型 */
  type?: 'item' | 'group' | 'divider';
  /** 权限要求 */
  permission?: string;
  /** 自定义样式 */
  className?: string;
  /** 工具提示 */
  tooltip?: string;
}

/**
 * 侧边栏导航属性
 */
export interface SidebarNavProps {
  /** 菜单项列表 */
  items: SidebarMenuItem[];
  /** 当前激活的菜单项ID */
  activeId?: string;
  /** 菜单项点击回调 */
  onItemClick?: (item: SidebarMenuItem) => void;
  /** 子菜单展开回调 */
  onItemExpand?: (itemId: string, expanded: boolean) => void;
  /** 是否收起状态 */
  collapsed?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 显示工具提示 */
  showTooltips?: boolean;
}

/**
 * 侧边栏菜单项组件属性
 */
export interface SidebarMenuItemProps {
  /** 菜单项数据 */
  item: SidebarMenuItem;
  /** 是否激活 */
  active?: boolean;
  /** 是否收起状态 */
  collapsed?: boolean;
  /** 层级深度 */
  depth?: number;
  /** 点击回调 */
  onClick?: (item: SidebarMenuItem) => void;
  /** 展开回调 */
  onExpand?: (itemId: string, expanded: boolean) => void;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 侧边栏分组属性
 */
export interface SidebarGroupProps {
  /** 分组标题 */
  title?: string;
  /** 分组图标 */
  icon?: React.ReactNode;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 是否展开 */
  expanded?: boolean;
  /** 展开状态切换回调 */
  onToggle?: (expanded: boolean) => void;
  /** 是否收起状态 */
  collapsed?: boolean;
  /** 子内容 */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * 侧边栏搜索属性
 */
export interface SidebarSearchProps {
  /** 搜索值 */
  value?: string;
  /** 搜索变化回调 */
  onChange?: (value: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 是否收起状态 */
  collapsed?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 侧边栏底部操作属性
 */
export interface SidebarFooterProps {
  /** 是否收起状态 */
  collapsed?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子内容 */
  children?: React.ReactNode;
  /** 显示收起按钮 */
  showToggleButton?: boolean;
  /** 收起按钮点击回调 */
  onToggleClick?: () => void;
  /** 用户信息 */
  user?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  /** 显示用户信息 */
  showUserInfo?: boolean;
}

/**
 * 侧边栏头部属性
 */
export interface SidebarHeaderProps {
  /** 是否收起状态 */
  collapsed?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子内容 */
  children?: React.ReactNode;
  /** Logo */
  logo?: React.ReactNode;
  /** 标题 */
  title?: string;
  /** 显示切换按钮 */
  showToggleButton?: boolean;
  /** 切换按钮点击回调 */
  onToggleClick?: () => void;
}

/**
 * 侧边栏工具提示属性
 */
export interface SidebarTooltipProps {
  /** 提示内容 */
  content: string;
  /** 是否显示 */
  show?: boolean;
  /** 子组件 */
  children: React.ReactNode;
  /** 位置 */
  placement?: 'right' | 'left' | 'top' | 'bottom';
  /** 延迟显示时间 */
  delay?: number;
}

/**
 * 侧边栏常量
 */
export const SIDEBAR_CONSTANTS = {
  DEFAULT_WIDTH: 240,
  COLLAPSED_WIDTH: 64,
  ITEM_HEIGHT: 48,
  GROUP_HEADER_HEIGHT: 36,
  PADDING: 16,
  ANIMATION_DURATION: 300,
  TOOLTIP_DELAY: 500,
  WIDTH: {
    expanded: 240,
    collapsed: 60,
  },
  MENU_ITEM_HEIGHT: 48,
  SEARCH_HEIGHT: 40,
  TOGGLE_HEIGHT: 32,
} as const;

/**
 * 侧边栏主题
 */
export type SidebarTheme = 'light' | 'dark' | 'auto';

/**
 * 侧边栏变体
 */
export type SidebarVariant = 'default' | 'minimal' | 'compact' | 'floating';

/**
 * 侧边栏菜单分组类型
 */
export interface SidebarMenuGroup {
  id: string;
  label?: string;
  items: SidebarMenuItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * 侧边栏菜单项提示信息类型
 */
export interface SidebarTooltip {
  content: string;
  placement?: 'right' | 'left';
  delay?: number;
}

/**
 * 默认菜单项配置
 */
export const DEFAULT_MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: 'dashboard',
    label: '仪表板',
    icon: '📊',
    href: '/',
  },
  {
    id: 'workflow',
    label: '工作流管理',
    icon: '⚙️',
    href: '/workflow',
  },
  {
    id: 'upload',
    label: '数据上传',
    icon: '📁',
    href: '/upload',
  },
  {
    id: 'generate',
    label: '内容生成',
    icon: '⚡',
    href: '/generate',
  },
  {
    id: 'results',
    label: '结果查看',
    icon: '📋',
    href: '/results',
  },
  {
    id: 'analytics',
    label: '数据分析',
    icon: '📈',
    href: '/analytics',
  },
];

/**
 * 默认底部菜单项配置
 */
export const DEFAULT_FOOTER_MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: 'settings',
    label: '设置',
    icon: '⚙️',
    href: '/settings',
  },
  {
    id: 'help',
    label: '帮助',
    icon: '❓',
    href: '/help',
  },
  {
    id: 'docs',
    label: '文档',
    icon: '📚',
    href: '/docs',
  },
]; 