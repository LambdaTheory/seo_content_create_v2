import React, { ReactNode } from 'react';

/**
 * 头部导航组件属性
 */
export interface HeaderProps {
  /** 是否显示Logo */
  showLogo?: boolean;
  /** 是否显示工作流选择器 */
  showWorkflowSelector?: boolean;
  /** 是否显示用户操作区 */
  showUserActions?: boolean;
  /** 是否显示侧边栏切换按钮 */
  showSidebarToggle?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 头部高度 */
  height?: number;
  /** 头部背景色 */
  background?: 'white' | 'gray' | 'transparent';
  /** 是否显示阴影 */
  shadow?: boolean;
  /** 是否显示边框 */
  border?: boolean;
  /** 侧边栏收起状态 */
  sidebarCollapsed?: boolean;
  /** 侧边栏切换回调 */
  onSidebarToggle?: () => void;
  /** 子组件 */
  children?: ReactNode;
  /** 当前主题 */
  theme?: 'light' | 'dark';
  /** 主题切换回调 */
  onThemeToggle?: () => void;
  /** 用户信息 */
  user?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  /** 工作流列表 */
  workflows?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  /** 当前选中的工作流ID */
  currentWorkflowId?: string;
  /** 工作流选择回调 */
  onWorkflowChange?: (workflowId: string) => void;
  /** 其他HTML属性 */
  [key: string]: any;
}

/**
 * Logo组件属性
 */
export interface LogoProps {
  /** Logo文本 */
  text?: string;
  /** Logo图标 */
  icon?: React.ReactNode;
  /** Logo图片URL */
  imageUrl?: string;
  /** 是否仅显示图标（收起状态） */
  iconOnly?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 链接地址 */
  href?: string;
}

/**
 * 工作流选择器属性
 */
export interface WorkflowSelectorProps {
  /** 当前工作流 */
  currentWorkflow?: WorkflowOption;
  /** 工作流选项列表 */
  workflows: WorkflowOption[];
  /** 工作流切换回调 */
  onWorkflowChange: (workflow: WorkflowOption) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示创建工作流按钮 */
  showCreateButton?: boolean;
  /** 创建工作流回调 */
  onCreateWorkflow?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 占位符文本 */
  placeholder?: string;
}

/**
 * 工作流选项
 */
export interface WorkflowOption {
  /** 工作流ID */
  id: string;
  /** 工作流名称 */
  name: string;
  /** 工作流描述 */
  description?: string;
  /** 工作流状态 */
  status?: 'active' | 'inactive' | 'draft';
  /** 最后修改时间 */
  lastModified?: Date;
  /** 工作流图标 */
  icon?: React.ReactNode;
  /** 是否为默认工作流 */
  isDefault?: boolean;
}

/**
 * 用户操作区属性
 */
export interface UserActionsProps {
  /** 是否显示主题切换 */
  showThemeToggle?: boolean;
  /** 是否显示设置按钮 */
  showSettings?: boolean;
  /** 是否显示帮助按钮 */
  showHelp?: boolean;
  /** 是否显示通知按钮 */
  showNotifications?: boolean;
  /** 是否显示用户菜单 */
  showUserMenu?: boolean;
  /** 当前主题 */
  theme?: 'light' | 'dark';
  /** 主题切换回调 */
  onThemeToggle?: () => void;
  /** 设置点击回调 */
  onSettingsClick?: () => void;
  /** 帮助点击回调 */
  onHelpClick?: () => void;
  /** 通知点击回调 */
  onNotificationsClick?: () => void;
  /** 通知数量 */
  notificationCount?: number;
  /** 用户信息 */
  user?: UserInfo;
  /** 自定义类名 */
  className?: string;
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户ID */
  id: string;
  /** 用户名 */
  name: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户头像 */
  avatar?: string;
  /** 用户角色 */
  role?: string;
}

/**
 * 导航菜单项
 */
export interface NavMenuItem {
  /** 菜单项ID */
  id: string;
  /** 菜单项标题 */
  title: string;
  /** 菜单项图标 */
  icon?: React.ReactNode;
  /** 菜单项链接 */
  href?: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否激活 */
  active?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子菜单 */
  children?: NavMenuItem[];
  /** 徽章文本 */
  badge?: string;
  /** 徽章类型 */
  badgeType?: 'primary' | 'success' | 'warning' | 'error';
}

/**
 * 导航栏属性
 */
export interface NavBarProps {
  /** 导航菜单项 */
  items: NavMenuItem[];
  /** 当前激活的菜单项ID */
  activeId?: string;
  /** 菜单项点击回调 */
  onItemClick?: (item: NavMenuItem) => void;
  /** 导航栏方向 */
  orientation?: 'horizontal' | 'vertical';
  /** 导航栏变体 */
  variant?: 'default' | 'pills' | 'underline';
  /** 自定义类名 */
  className?: string;
}

/**
 * 搜索框属性
 */
export interface SearchBoxProps {
  /** 搜索值 */
  value?: string;
  /** 搜索变化回调 */
  onChange?: (value: string) => void;
  /** 搜索提交回调 */
  onSearch?: (value: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否显示搜索建议 */
  showSuggestions?: boolean;
  /** 搜索建议列表 */
  suggestions?: string[];
  /** 建议选择回调 */
  onSuggestionSelect?: (suggestion: string) => void;
  /** 是否正在搜索 */
  loading?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 面包屑导航属性
 */
export interface BreadcrumbProps {
  /** 面包屑路径 */
  items: BreadcrumbItem[];
  /** 分隔符 */
  separator?: React.ReactNode;
  /** 最大显示项数 */
  maxItems?: number;
  /** 项目点击回调 */
  onItemClick?: (item: BreadcrumbItem) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 面包屑项
 */
export interface BreadcrumbItem {
  /** 项目ID */
  id: string;
  /** 项目标题 */
  title: string;
  /** 项目链接 */
  href?: string;
  /** 项目图标 */
  icon?: React.ReactNode;
  /** 是否为当前页 */
  current?: boolean;
}

/**
 * Header导航菜单项类型
 */
export interface HeaderMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  badge?: string | number;
  disabled?: boolean;
}

/**
 * Header用户菜单项类型
 */
export interface HeaderUserMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  divider?: boolean;
  danger?: boolean;
}

/**
 * 头部常量
 */
export const HEADER_CONSTANTS = {
  DEFAULT_HEIGHT: 64,
  LOGO_WIDTH: 160,
  SEARCH_WIDTH: 320,
  USER_ACTIONS_WIDTH: 200,
  Z_INDEX: 50,
  HEIGHT: 64,
  SEARCH_MAX_WIDTH: 400,
  USER_MENU_WIDTH: 240,
  NOTIFICATION_MAX_COUNT: 99,
} as const; 