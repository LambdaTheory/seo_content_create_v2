import React, { useState, useRef, useEffect } from 'react';
import {
  HeaderProps,
  LogoProps,
  WorkflowSelectorProps,
  UserActionsProps,
  WorkflowOption,
  SearchBoxProps,
  BreadcrumbProps,
  HEADER_CONSTANTS
} from './Header.types';
import { cn } from '@/utils/classNames';
import { useLayout } from './Layout';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

/**
 * Logo组件
 */
export const Logo: React.FC<LogoProps> = ({
  text = 'SEO内容生成工具',
  icon,
  imageUrl,
  iconOnly = false,
  size = 'md',
  onClick,
  className,
  href
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <div
      className={cn(
        'flex items-center space-x-3 cursor-pointer',
        onClick && 'hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {(icon || imageUrl) && (
        <div className="flex items-center justify-center w-8 h-8">
          {imageUrl ? (
            <img src={imageUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            icon || <span className="text-2xl">🎯</span>
          )}
        </div>
      )}
      {!iconOnly && (
        <span className={cn(
          'font-semibold text-gray-900 dark:text-white truncate',
          sizeClasses[size]
        )}>
          {text}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="no-underline">
        {content}
      </a>
    );
  }

  return content;
};

/**
 * 工作流选择器组件
 */
export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  currentWorkflow,
  workflows,
  onWorkflowChange,
  disabled = false,
  showCreateButton = true,
  onCreateWorkflow,
  className,
  placeholder = '选择工作流'
}) => {
  const options = workflows.map(workflow => ({
    value: workflow.id,
    label: workflow.name,
    description: workflow.description,
    disabled: workflow.status === 'inactive'
  }));

  const handleChange = (value: string | number | (string | number)[]) => {
    const stringValue = typeof value === 'string' ? value : String(value);
    const workflow = workflows.find(w => w.id === stringValue);
    if (workflow) {
      onWorkflowChange(workflow);
    }
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Dropdown
        options={options}
        value={currentWorkflow?.id}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-64"
      />
      {showCreateButton && onCreateWorkflow && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateWorkflow}
          disabled={disabled}
        >
          新建
        </Button>
      )}
    </div>
  );
};

/**
 * 搜索框组件
 */
export const SearchBox: React.FC<SearchBoxProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = '搜索...',
  showSuggestions = false,
  suggestions = [],
  onSuggestionSelect,
  loading = false,
  className,
  size = 'md'
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange?.(val);
    setShowDropdown(showSuggestions && suggestions.length > 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch?.(inputValue);
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onSuggestionSelect?.(suggestion);
    setShowDropdown(false);
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        size={size}
        leftIcon="🔍"
        loading={loading}
      />
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 用户操作区组件
 */
export const UserActions: React.FC<UserActionsProps> = ({
  showThemeToggle = true,
  showSettings = true,
  showHelp = true,
  showNotifications = false,
  showUserMenu = false,
  theme = 'light',
  onThemeToggle,
  onSettingsClick,
  onHelpClick,
  onNotificationsClick,
  notificationCount = 0,
  user,
  className
}) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* 主题切换 */}
      {showThemeToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onThemeToggle}
          aria-label="切换主题"
          className="p-2"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
      )}

      {/* 通知 */}
      {showNotifications && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNotificationsClick}
            aria-label="通知"
            className="p-2"
          >
            🔔
          </Button>
          {notificationCount > 0 && (
            <Badge
              variant="error"
              className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs"
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </Badge>
          )}
        </div>
      )}

      {/* 帮助 */}
      {showHelp && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onHelpClick}
          aria-label="帮助"
          className="p-2"
        >
          ❓
        </Button>
      )}

      {/* 设置 */}
      {showSettings && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          aria-label="设置"
          className="p-2"
        >
          ⚙️
        </Button>
      )}

      {/* 用户菜单 */}
      {showUserMenu && user && (
        <div className="flex items-center space-x-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <Avatar
            src={user.avatar}
            name={user.name}
            size="sm"
          />
          <div className="hidden md:block">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.role}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 面包屑导航组件
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = '/',
  maxItems = 5,
  onItemClick,
  className
}) => {
  const displayItems = items.length > maxItems 
    ? [...items.slice(0, 1), { id: 'ellipsis', title: '...' }, ...items.slice(-maxItems + 2)]
    : items;

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)}>
      {displayItems.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <span className="text-gray-400 dark:text-gray-600 select-none">
              {separator}
            </span>
          )}
          {item.id === 'ellipsis' ? (
            <span className="text-gray-400 dark:text-gray-600">...</span>
          ) : (
            <button
              className={cn(
                'flex items-center space-x-1 transition-colors',
                item.current 
                  ? 'text-gray-900 dark:text-white font-medium' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                onItemClick && !item.current && 'cursor-pointer'
              )}
              onClick={() => !item.current && onItemClick?.(item)}
              disabled={item.current}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.title}</span>
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

/**
 * 主Header组件
 */
export const Header: React.FC<HeaderProps> = ({
  showLogo = true,
  showWorkflowSelector = true,
  showUserActions = true,
  showSidebarToggle = true,
  className,
  height = HEADER_CONSTANTS.DEFAULT_HEIGHT,
  background = 'white',
  shadow = true,
  border = true,
  sidebarCollapsed,
  onSidebarToggle
}) => {
  const layout = useLayout();

  const backgroundClasses = {
    white: 'bg-white dark:bg-gray-800',
    gray: 'bg-gray-50 dark:bg-gray-900',
    transparent: 'bg-transparent',
  };

  // 模拟工作流数据
  const mockWorkflows: WorkflowOption[] = [
    {
      id: '1',
      name: '默认工作流',
      description: '通用SEO内容生成工作流',
      status: 'active',
      isDefault: true
    },
    {
      id: '2',
      name: '游戏评测工作流',
      description: '专门用于游戏评测内容生成',
      status: 'active'
    }
  ];

  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowOption>(mockWorkflows[0]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        backgroundClasses[background],
        border && 'border-b border-gray-200 dark:border-gray-700',
        shadow && 'shadow-sm',
        className
      )}
      style={{ height: `${height}px` }}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* 左侧区域 */}
        <div className="flex items-center space-x-6">
          {/* 侧边栏切换按钮（移动端显示） */}
          {showSidebarToggle && layout.isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle || layout.toggleSidebar}
              aria-label="切换侧边栏"
              className="p-2 lg:hidden"
            >
              ☰
            </Button>
          )}

          {/* Logo */}
          {showLogo && (
            <Logo
              iconOnly={layout.isMobile}
              size={layout.isMobile ? 'sm' : 'md'}
            />
          )}

          {/* 工作流选择器 */}
          {showWorkflowSelector && !layout.isMobile && (
            <WorkflowSelector
              currentWorkflow={currentWorkflow}
              workflows={mockWorkflows}
              onWorkflowChange={setCurrentWorkflow}
              onCreateWorkflow={() => console.log('创建新工作流')}
            />
          )}
        </div>

        {/* 中间区域 */}
        <div className="flex-1 flex justify-center max-w-md mx-6">
          {!layout.isMobile && (
            <SearchBox
              placeholder="搜索工作流、数据..."
              className="w-full"
            />
          )}
        </div>

        {/* 右侧区域 */}
        {showUserActions && (
          <UserActions
            theme={layout.theme}
            onThemeToggle={layout.toggleTheme}
            onSettingsClick={() => console.log('打开设置')}
            onHelpClick={() => console.log('打开帮助')}
            showNotifications={!layout.isMobile}
            notificationCount={3}
            showUserMenu={!layout.isMobile}
            user={{
              id: '1',
              name: '用户名',
              email: 'user@example.com',
              role: '管理员'
            }}
          />
        )}
      </div>
    </header>
  );
};

export default Header; 