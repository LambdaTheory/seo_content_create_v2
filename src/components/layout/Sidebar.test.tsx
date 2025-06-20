import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import '@testing-library/jest-dom';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock utils
jest.mock('../../utils/classNames', () => ({
  cn: (...classes: any[]) => {
    return classes
      .map(cls => {
        if (typeof cls === 'string') return cls;
        if (typeof cls === 'object' && cls !== null) {
          return Object.entries(cls)
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key)
            .join(' ');
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染默认状态的侧边栏', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('工作台')).toBeInTheDocument();
    expect(screen.getByText('工作流管理')).toBeInTheDocument();
    expect(screen.getByText('数据上传')).toBeInTheDocument();
    expect(screen.getByText('内容生成')).toBeInTheDocument();
    expect(screen.getByText('生成结果')).toBeInTheDocument();
    expect(screen.getByText('数据分析')).toBeInTheDocument();
    expect(screen.getByText('设置')).toBeInTheDocument();
    expect(screen.getByText('帮助')).toBeInTheDocument();
    expect(screen.getByText('文档')).toBeInTheDocument();
  });

  it('应该正确显示激活状态', () => {
    mockUsePathname.mockReturnValue('/workflow');
    render(<Sidebar />);
    
    const workflowItem = screen.getByText('工作流管理').closest('div');
    expect(workflowItem).toHaveClass('bg-primary-50');
  });

  it('应该处理菜单项点击', () => {
    const handleItemClick = jest.fn();
    render(<Sidebar onItemClick={handleItemClick} />);
    
    const workflowItem = screen.getByText('工作流管理');
    fireEvent.click(workflowItem);
    
    expect(handleItemClick).toHaveBeenCalled();
  });

  it('应该显示搜索框', () => {
    render(<Sidebar showSearch={true} />);
    
    const searchInput = screen.getByPlaceholderText('搜索...');
    expect(searchInput).toBeInTheDocument();
  });

  it('收起状态下不应该显示搜索框', () => {
    render(<Sidebar collapsed={true} showSearch={true} />);
    
    const searchInput = screen.queryByPlaceholderText('搜索...');
    expect(searchInput).not.toBeInTheDocument();
  });

  it('应该显示切换按钮', () => {
    const handleToggle = jest.fn();
    render(<Sidebar onToggleCollapse={handleToggle} />);
    
    const toggleButton = screen.getByLabelText('收起侧边栏');
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(handleToggle).toHaveBeenCalled();
  });

  it('应该正确渲染收起状态', () => {
    render(<Sidebar collapsed={true} />);
    
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveStyle({ width: '64px' });
  });

  it('应该处理自定义菜单项', () => {
    const customMenuItems = [
      {
        id: 'custom',
        label: '自定义项目',
        href: '/custom'
      }
    ];
    
    render(<Sidebar menuItems={customMenuItems} />);
    
    expect(screen.getByText('自定义项目')).toBeInTheDocument();
    expect(screen.queryByText('工作台')).not.toBeInTheDocument();
  });

  it('应该应用自定义样式', () => {
    render(<Sidebar style={{ backgroundColor: 'red' }} />);
    
    const sidebar = screen.getByRole('complementary');
    expect(sidebar.style.backgroundColor).toBe('red');
  });
}); 