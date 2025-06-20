import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  Layout, 
  LayoutContainer, 
  ContentArea, 
  LayoutDivider, 
  LayoutGrid,
  useLayout 
} from './Layout';

// Mock window properties
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Layout组件测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('应该渲染基本布局结构', () => {
    render(
      <Layout>
        <div>测试内容</div>
      </Layout>
    );

    expect(screen.getByText('SEO内容生成工具')).toBeInTheDocument();
    expect(screen.getByText('测试内容')).toBeInTheDocument();
    expect(screen.getByText('就绪')).toBeInTheDocument();
  });

  it('应该支持隐藏头部', () => {
    render(
      <Layout showHeader={false}>
        <div>测试内容</div>
      </Layout>
    );

    expect(screen.queryByText('SEO内容生成工具')).not.toBeInTheDocument();
  });

  it('应该支持隐藏侧边栏', () => {
    render(
      <Layout showSidebar={false}>
        <div>测试内容</div>
      </Layout>
    );

    expect(screen.queryByText('工作流')).not.toBeInTheDocument();
  });

  it('应该支持隐藏底部状态栏', () => {
    render(
      <Layout showFooter={false}>
        <div>测试内容</div>
      </Layout>
    );

    expect(screen.queryByText('就绪')).not.toBeInTheDocument();
  });

  it('应该支持主题切换', async () => {
    render(
      <Layout>
        <div>测试内容</div>
      </Layout>
    );

    const themeButton = screen.getByLabelText('切换主题');
    expect(themeButton).toBeInTheDocument();

    fireEvent.click(themeButton);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  it('应该在移动端显示侧边栏切换按钮', () => {
    // 模拟移动端尺寸
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    });

    render(
      <Layout>
        <div>测试内容</div>
      </Layout>
    );

    const sidebarButton = screen.getByLabelText('切换侧边栏');
    expect(sidebarButton).toBeInTheDocument();
  });

  it('应该支持外部控制侧边栏状态', () => {
    const onToggle = jest.fn();
    
    render(
      <Layout sidebarCollapsed={true} onSidebarToggle={onToggle}>
        <div>测试内容</div>
      </Layout>
    );

    // 在收起状态下，侧边栏应该只显示图标
    expect(screen.queryByText('工作流')).not.toBeInTheDocument();
  });
});

describe('LayoutContainer组件测试', () => {
  it('应该渲染容器组件', () => {
    render(
      <LayoutContainer>
        <div>容器内容</div>
      </LayoutContainer>
    );

    expect(screen.getByText('容器内容')).toBeInTheDocument();
  });

  it('应该支持不同的最大宽度', () => {
    const { container } = render(
      <LayoutContainer maxWidth="md">
        <div>容器内容</div>
      </LayoutContainer>
    );

    expect(container.firstChild).toHaveClass('max-w-md');
  });

  it('应该支持全屏模式', () => {
    const { container } = render(
      <LayoutContainer fullscreen>
        <div>容器内容</div>
      </LayoutContainer>
    );

    expect(container.firstChild).toHaveClass('h-screen');
  });
});

describe('ContentArea组件测试', () => {
  it('应该渲染内容区域', () => {
    render(
      <ContentArea>
        <div>主要内容</div>
      </ContentArea>
    );

    expect(screen.getByText('主要内容')).toBeInTheDocument();
  });

  it('应该支持禁用滚动', () => {
    const { container } = render(
      <ContentArea scrollable={false}>
        <div>主要内容</div>
      </ContentArea>
    );

    expect(container.firstChild).toHaveClass('overflow-hidden');
  });
});

describe('LayoutDivider组件测试', () => {
  it('应该渲染分割线', () => {
    const { container } = render(<LayoutDivider />);
    
    expect(container.firstChild).toHaveClass('bg-gray-200');
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('应该支持垂直方向', () => {
    const { container } = render(<LayoutDivider orientation="vertical" />);
    
    expect(container.firstChild).toHaveClass('w-px');
    expect(container.firstChild).toHaveClass('h-full');
  });

  it('应该支持不同粗细', () => {
    const { container } = render(<LayoutDivider size="thick" />);
    
    expect(container.firstChild).toHaveClass('h-1');
  });
});

describe('LayoutGrid组件测试', () => {
  it('应该渲染网格布局', () => {
    const { container } = render(
      <LayoutGrid cols={3}>
        <div>项目1</div>
        <div>项目2</div>
        <div>项目3</div>
      </LayoutGrid>
    );

    expect(container.firstChild).toHaveClass('grid');
    expect(container.firstChild).toHaveClass('grid-cols-3');
  });

  it('应该支持响应式配置', () => {
    const { container } = render(
      <LayoutGrid cols={1} responsive={{ md: 2, lg: 3 }}>
        <div>项目1</div>
      </LayoutGrid>
    );

    expect(container.firstChild).toHaveClass('grid-cols-1');
  });
});

describe('useLayout Hook测试', () => {
  const TestComponent = () => {
    const layout = useLayout();
    return (
      <div>
        <span>断点: {layout.breakpoint}</span>
        <span>主题: {layout.theme}</span>
        <span>侧边栏收起: {layout.sidebarCollapsed ? '是' : '否'}</span>
      </div>
    );
  };

  it('应该提供布局上下文', () => {
    render(
      <Layout>
        <TestComponent />
      </Layout>
    );

    expect(screen.getByText(/断点:/)).toBeInTheDocument();
    expect(screen.getByText(/主题:/)).toBeInTheDocument();
    expect(screen.getByText(/侧边栏收起:/)).toBeInTheDocument();
  });

  it('应该在没有Provider时抛出错误', () => {
    // 抑制控制台错误输出
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useLayout must be used within a LayoutProvider');

    consoleSpy.mockRestore();
  });
}); 