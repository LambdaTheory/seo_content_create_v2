import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header, Logo, WorkflowSelector, UserActions, SearchBox, Breadcrumb } from './Header';
import { Layout } from './Layout';

// Mock Layout context
const MockLayoutProvider = ({ children }: { children: React.ReactNode }) => (
  <Layout>
    {children}
  </Layout>
);

describe('Header组件测试', () => {
  it('应该渲染完整的Header组件', () => {
    render(
      <MockLayoutProvider>
        <Header />
      </MockLayoutProvider>
    );

    expect(screen.getByText('SEO内容生成工具')).toBeInTheDocument();
  });

  it('应该支持隐藏Logo', () => {
    render(
      <MockLayoutProvider>
        <Header showLogo={false} />
      </MockLayoutProvider>
    );

    expect(screen.queryByText('SEO内容生成工具')).not.toBeInTheDocument();
  });

  it('应该支持隐藏工作流选择器', () => {
    render(
      <MockLayoutProvider>
        <Header showWorkflowSelector={false} />
      </MockLayoutProvider>
    );

    // 工作流选择器应该不可见
    expect(screen.queryByText('默认工作流')).not.toBeInTheDocument();
  });

  it('应该支持隐藏用户操作区', () => {
    render(
      <MockLayoutProvider>
        <Header showUserActions={false} />
      </MockLayoutProvider>
    );

    expect(screen.queryByLabelText('切换主题')).not.toBeInTheDocument();
  });
});

describe('Logo组件测试', () => {
  it('应该渲染Logo文本', () => {
    render(<Logo text="测试Logo" />);
    
    expect(screen.getByText('测试Logo')).toBeInTheDocument();
  });

  it('应该支持仅图标模式', () => {
    render(<Logo text="测试Logo" iconOnly />);
    
    expect(screen.queryByText('测试Logo')).not.toBeInTheDocument();
  });

  it('应该支持点击回调', () => {
    const handleClick = jest.fn();
    render(<Logo text="测试Logo" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('测试Logo'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该支持链接模式', () => {
    render(<Logo text="测试Logo" href="/home" />);
    
    const link = screen.getByText('测试Logo').closest('a');
    expect(link).toHaveAttribute('href', '/home');
  });
});

describe('WorkflowSelector组件测试', () => {
  const mockWorkflows = [
    { id: '1', name: '工作流1', status: 'active' as const },
    { id: '2', name: '工作流2', status: 'inactive' as const }
  ];

  it('应该渲染工作流选择器', () => {
    const handleChange = jest.fn();
    
    render(
      <WorkflowSelector
        workflows={mockWorkflows}
        onWorkflowChange={handleChange}
      />
    );

    // 下拉组件应该存在
    expect(document.querySelector('[role="button"]')).toBeInTheDocument();
  });

  it('应该显示创建按钮', () => {
    const handleChange = jest.fn();
    const handleCreate = jest.fn();
    
    render(
      <WorkflowSelector
        workflows={mockWorkflows}
        onWorkflowChange={handleChange}
        onCreateWorkflow={handleCreate}
      />
    );

    expect(screen.getByText('新建')).toBeInTheDocument();
  });

  it('应该支持禁用状态', () => {
    const handleChange = jest.fn();
    
    render(
      <WorkflowSelector
        workflows={mockWorkflows}
        onWorkflowChange={handleChange}
        disabled
      />
    );

    const dropdown = document.querySelector('[role="button"]');
    expect(dropdown).toHaveClass('disabled');
  });
});

describe('SearchBox组件测试', () => {
  it('应该渲染搜索框', () => {
    render(<SearchBox placeholder="搜索测试" />);
    
    expect(screen.getByPlaceholderText('搜索测试')).toBeInTheDocument();
  });

  it('应该支持输入变化', () => {
    const handleChange = jest.fn();
    render(<SearchBox onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '测试输入' } });
    
    expect(handleChange).toHaveBeenCalledWith('测试输入');
  });

  it('应该支持回车搜索', () => {
    const handleSearch = jest.fn();
    render(<SearchBox onSearch={handleSearch} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '搜索内容' } });
    fireEvent.keyPress(input, { key: 'Enter' });
    
    expect(handleSearch).toHaveBeenCalledWith('搜索内容');
  });

  it('应该显示搜索建议', () => {
    const suggestions = ['建议1', '建议2'];
    render(
      <SearchBox
        showSuggestions
        suggestions={suggestions}
        value="建议"
      />
    );

    // 这里需要根据实际实现来测试建议显示
  });
});

describe('UserActions组件测试', () => {
  it('应该渲染用户操作按钮', () => {
    render(<UserActions />);
    
    expect(screen.getByLabelText('切换主题')).toBeInTheDocument();
    expect(screen.getByLabelText('帮助')).toBeInTheDocument();
    expect(screen.getByLabelText('设置')).toBeInTheDocument();
  });

  it('应该支持主题切换', () => {
    const handleThemeToggle = jest.fn();
    render(<UserActions onThemeToggle={handleThemeToggle} />);
    
    fireEvent.click(screen.getByLabelText('切换主题'));
    expect(handleThemeToggle).toHaveBeenCalledTimes(1);
  });

  it('应该显示通知徽章', () => {
    render(
      <UserActions
        showNotifications
        notificationCount={5}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('应该显示用户菜单', () => {
    const user = {
      id: '1',
      name: '测试用户',
      email: 'test@example.com',
      role: '管理员'
    };

    render(
      <UserActions
        showUserMenu
        user={user}
      />
    );

    expect(screen.getByText('测试用户')).toBeInTheDocument();
    expect(screen.getByText('管理员')).toBeInTheDocument();
  });
});

describe('Breadcrumb组件测试', () => {
  const mockItems = [
    { id: '1', title: '首页', href: '/' },
    { id: '2', title: '工作流', href: '/workflow' },
    { id: '3', title: '详情', current: true }
  ];

  it('应该渲染面包屑导航', () => {
    render(<Breadcrumb items={mockItems} />);
    
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('工作流')).toBeInTheDocument();
    expect(screen.getByText('详情')).toBeInTheDocument();
  });

  it('应该显示分隔符', () => {
    render(<Breadcrumb items={mockItems} />);
    
    // 应该有分隔符（默认是 '/'）
    expect(screen.getAllByText('/')).toHaveLength(2);
  });

  it('应该支持自定义分隔符', () => {
    render(<Breadcrumb items={mockItems} separator=">" />);
    
    expect(screen.getAllByText('>')).toHaveLength(2);
  });

  it('应该支持项目点击', () => {
    const handleItemClick = jest.fn();
    render(<Breadcrumb items={mockItems} onItemClick={handleItemClick} />);
    
    fireEvent.click(screen.getByText('首页'));
    expect(handleItemClick).toHaveBeenCalledWith(mockItems[0]);
  });

  it('应该限制最大显示项数', () => {
    const manyItems = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      title: `项目${i}`,
      href: `/item/${i}`
    }));

    render(<Breadcrumb items={manyItems} maxItems={3} />);
    
    // 应该显示省略号
    expect(screen.getByText('...')).toBeInTheDocument();
  });
}); 