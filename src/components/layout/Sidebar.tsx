import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  SparklesIcon, 
  FolderIcon,
  ChartBarIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CloudArrowUpIcon as CloudArrowUpIconSolid,
  SparklesIcon as SparklesIconSolid,
  FolderIcon as FolderIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CogIcon as CogIconSolid
} from '@heroicons/react/24/solid';
import { cn } from '@/utils/classNames';
import { SIDEBAR_CONSTANTS } from './Sidebar.types';

// 菜单项接口定义
interface MenuItemBadge {
  text: string;
  variant: 'primary' | 'danger' | 'warning' | 'default';
}

interface SidebarMenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
  activeIcon?: React.ComponentType<any>;
  isActive?: boolean;
  disabled?: boolean;
  badge?: MenuItemBadge;
}

// Sidebar组件Props接口
interface SidebarProps {
  collapsed?: boolean;
  menuItems?: SidebarMenuItem[];
  footerItems?: SidebarMenuItem[];
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onItemClick?: (item: SidebarMenuItem, e: React.MouseEvent) => void;
  onToggleCollapse?: () => void;
  header?: {
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
  };
  className?: string;
  style?: React.CSSProperties;
}

interface LocalTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'right' | 'left' | 'top' | 'bottom';
}

/**
 * 默认菜单项配置
 */
const DEFAULT_MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: 'dashboard',
    label: '工作台',
    href: '/',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
    isActive: false
  },
  {
    id: 'workflows',
    label: '工作流管理',
    href: '/workflow',
    icon: DocumentTextIcon,
    activeIcon: DocumentTextIconSolid,
    isActive: false
  },
  {
    id: 'upload',
    label: '数据上传',
    href: '/upload',
    icon: CloudArrowUpIcon,
    activeIcon: CloudArrowUpIconSolid,
    isActive: false
  },
  {
    id: 'generate',
    label: '内容生成',
    href: '/generate',
    icon: SparklesIcon,
    activeIcon: SparklesIconSolid,
    isActive: false
  },
  {
    id: 'results',
    label: '生成结果',
    href: '/results',
    icon: FolderIcon,
    activeIcon: FolderIconSolid,
    isActive: false
  },
  {
    id: 'analytics',
    label: '数据分析',
    href: '/analytics',
    icon: ChartBarIcon,
    activeIcon: ChartBarIconSolid,
    isActive: false,
    disabled: true // 暂未开发
  }
];

const FOOTER_MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: 'settings',
    label: '设置',
    href: '/settings',
    icon: CogIcon,
    activeIcon: CogIconSolid,
    isActive: false
  },
  {
    id: 'help',
    label: '帮助',
    href: '/help',
    icon: QuestionMarkCircleIcon,
    isActive: false
  },
  {
    id: 'docs',
    label: '文档',
    href: '/docs',
    icon: BookOpenIcon,
    isActive: false
  }
];

/**
 * Sidebar工具提示组件
 */
const SidebarTooltip: React.FC<LocalTooltipProps> = ({
  content,
  children,
  position = 'right'
}) => {
  return (
    <div className="relative group">
      {children}
      <div className={cn(
        "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 pointer-events-none transition-opacity duration-200 whitespace-nowrap",
        "group-hover:opacity-100 group-hover:pointer-events-auto",
        {
          'left-full ml-2 top-1/2 -translate-y-1/2': position === 'right',
          'right-full mr-2 top-1/2 -translate-y-1/2': position === 'left',
          'bottom-full mb-2 left-1/2 -translate-x-1/2': position === 'top',
          'top-full mt-2 left-1/2 -translate-x-1/2': position === 'bottom'
        }
      )}>
        {content}
        <div className={cn(
          "absolute w-2 h-2 bg-gray-900 transform rotate-45",
          {
            '-left-1 top-1/2 -translate-y-1/2': position === 'right',
            '-right-1 top-1/2 -translate-y-1/2': position === 'left',
            '-bottom-1 left-1/2 -translate-x-1/2': position === 'top',
            '-top-1 left-1/2 -translate-x-1/2': position === 'bottom'
          }
        )} />
      </div>
    </div>
  );
};

/**
 * Sidebar头部组件
 */
const SidebarHeader: React.FC<{
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  collapsed?: boolean;
}> = ({
  title = "SEO内容生成",
  subtitle,
  icon,
  collapsed = false
}) => {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
        {icon && (
          <SidebarTooltip content={title}>
            <div className="w-8 h-8 flex items-center justify-center text-primary-600">
              {icon}
            </div>
          </SidebarTooltip>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="w-8 h-8 flex items-center justify-center text-primary-600">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Sidebar搜索组件
 */
const SidebarSearch: React.FC<{
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  collapsed?: boolean;
}> = ({
  placeholder = "搜索...",
  value,
  onChange,
  collapsed = false
}) => {
  if (collapsed) {
    return null; // 收起状态下不显示搜索框
  }

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

/**
 * Sidebar菜单项组件
 */
const SidebarMenuItemComponent: React.FC<{
  item: SidebarMenuItem;
  collapsed?: boolean;
  onClick?: (item: SidebarMenuItem, e: React.MouseEvent) => void;
}> = ({
  item,
  collapsed = false,
  onClick
}) => {
  const pathname = usePathname();
  const isActive = item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href || ''));
  
  const IconComponent = isActive && item.activeIcon ? item.activeIcon : item.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(item, e);
  };

  const menuItemContent = (
    <div className={cn(
      "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer",
      "hover:bg-gray-100 dark:hover:bg-gray-800",
      {
        'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30': isActive,
        'text-gray-700 dark:text-gray-300': !isActive && !item.disabled,
        'text-gray-400 dark:text-gray-600 cursor-not-allowed': item.disabled,
        'justify-center': collapsed
      }
    )}>
      {IconComponent && (
        <IconComponent className={cn(
          "w-5 h-5 flex-shrink-0",
          {
            'text-primary-600 dark:text-primary-400': isActive,
            'text-gray-500 dark:text-gray-400': !isActive && !item.disabled,
            'text-gray-400 dark:text-gray-600': item.disabled
          }
        )} />
      )}
      
      {!collapsed && (
        <span className="text-sm font-medium truncate">
          {item.label}
        </span>
      )}
      
      {!collapsed && item.badge && (
        <span className={cn(
          "ml-auto px-2 py-0.5 text-xs rounded-full",
          {
            'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400': item.badge.variant === 'primary',
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': item.badge.variant === 'danger',
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': item.badge.variant === 'warning',
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400': item.badge.variant === 'default'
          }
        )}>
          {item.badge.text}
        </span>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <SidebarTooltip content={item.label}>
        {item.href ? (
          <Link 
            href={item.href} 
            onClick={handleClick}
            className={cn({ 'pointer-events-none': item.disabled })}
          >
            {menuItemContent}
          </Link>
        ) : (
          <div onClick={handleClick}>
            {menuItemContent}
          </div>
        )}
      </SidebarTooltip>
    );
  }

  return item.href ? (
    <Link 
      href={item.href} 
      onClick={handleClick}
      className={cn({ 'pointer-events-none': item.disabled })}
    >
      {menuItemContent}
    </Link>
  ) : (
    <div onClick={handleClick}>
      {menuItemContent}
    </div>
  );
};

/**
 * 主Sidebar组件
 */
export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  menuItems = DEFAULT_MENU_ITEMS,
  footerItems = FOOTER_MENU_ITEMS,
  showSearch = true,
  searchValue,
  onSearchChange,
  onItemClick,
  onToggleCollapse,
  header,
  className,
  style,
  ...props
}) => {
  const sidebarWidth = collapsed ? SIDEBAR_CONSTANTS.COLLAPSED_WIDTH : SIDEBAR_CONSTANTS.DEFAULT_WIDTH;
  
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col",
        className
      )}
      style={{
        width: sidebarWidth,
        ...style
      }}
      {...props}
    >
      {/* 头部 */}
      {header && (
        <SidebarHeader
          title={header.title}
          subtitle={header.subtitle}
          icon={header.icon}
          collapsed={collapsed}
        />
      )}
      
      {/* 搜索 */}
      {showSearch && (
        <SidebarSearch
          value={searchValue}
          onChange={onSearchChange}
          collapsed={collapsed}
        />
      )}
      
      {/* 主导航 */}
      <nav className="flex-1 py-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <SidebarMenuItemComponent
              key={item.id}
              item={item}
              collapsed={collapsed}
              onClick={onItemClick}
            />
          ))}
        </div>
      </nav>
      
      {/* 底部菜单 */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="py-2">
          <div className="space-y-1">
            {footerItems.map((item) => (
              <SidebarMenuItemComponent
                key={item.id}
                item={item}
                collapsed={collapsed}
                onClick={onItemClick}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* 折叠切换按钮 */}
      {onToggleCollapse && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            <svg 
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                { 'rotate-180': collapsed }
              )} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar; 