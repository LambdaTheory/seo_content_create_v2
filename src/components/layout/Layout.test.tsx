import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  Layout, 
  LayoutContainer, 
  ContentArea, 
  LayoutDivider, 
  LayoutGrid,
  useLayout,
  LayoutProvider
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

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// 测试用例组件
const TestComponent: React.FC = () => {
  const { isMobile, isTablet, isDesktop, breakpoint, sidebarCollapsed, toggleSidebar } = useLayout();
  
  return (
    <div>
      <div data-testid="breakpoint">{breakpoint}</div>
      <div data-testid="isMobile">{isMobile.toString()}</div>
      <div data-testid="isTablet">{isTablet.toString()}</div>
      <div data-testid="isDesktop">{isDesktop.toString()}</div>
      <div data-testid="sidebarCollapsed">{sidebarCollapsed.toString()}</div>
      <button onClick={toggleSidebar} data-testid="toggleSidebar">Toggle</button>
    </div>
  );
};

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

describe('Layout 响应式组件测试', () => {
  beforeEach(() => {
    // 重置窗口大小
    global.innerWidth = 1024;
    global.innerHeight = 768;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('响应式断点检测', () => {
    it('应该正确检测移动端断点 (sm: < 640px)', async () => {
      // 模拟移动端尺寸
      global.innerWidth = 480;
      
      render(
        <LayoutProvider>
          <TestComponent />
        </LayoutProvider>
      );

      // 触发 resize 事件
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('breakpoint')).toHaveTextContent('sm');
        expect(screen.getByTestId('isMobile')).toHaveTextContent('true');
        expect(screen.getByTestId('isTablet')).toHaveTextContent('false');
        expect(screen.getByTestId('isDesktop')).toHaveTextContent('false');
      });
    });

    it('应该正确检测平板端断点 (md: 768px - 1024px)', async () => {
      global.innerWidth = 800;
      
      render(
        <LayoutProvider>
          <TestComponent />
        </LayoutProvider>
      );

      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('breakpoint')).toHaveTextContent('md');
        expect(screen.getByTestId('isMobile')).toHaveTextContent('false');
        expect(screen.getByTestId('isTablet')).toHaveTextContent('true');
        expect(screen.getByTestId('isDesktop')).toHaveTextContent('false');
      });
    });

    it('应该正确检测桌面端断点 (lg: >= 1024px)', async () => {
      global.innerWidth = 1200;
      
      render(
        <LayoutProvider>
          <TestComponent />
        </LayoutProvider>
      );

      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('breakpoint')).toHaveTextContent('lg');
        expect(screen.getByTestId('isMobile')).toHaveTextContent('false');
        expect(screen.getByTestId('isTablet')).toHaveTextContent('false');
        expect(screen.getByTestId('isDesktop')).toHaveTextContent('true');
      });
    });
  });

  describe('侧边栏响应式行为', () => {
    it('在移动端应该自动收起侧边栏', async () => {
      global.innerWidth = 480;
      
      render(
        <LayoutProvider>
          <TestComponent />
        </LayoutProvider>
      );

      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('sidebarCollapsed')).toHaveTextContent('true');
      });
    });

    it('在平板端应该自动收起侧边栏', async () => {
      global.innerWidth = 800;
      
      render(
        <LayoutProvider>
          <TestComponent />
        </LayoutProvider>
      );

      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('sidebarCollapsed')).toHaveTextContent('true');
      });
    });

    it('应该支持侧边栏状态切换', async () => {
      render(
        <LayoutProvider>
          <TestComponent />
        </LayoutProvider>
      );

      const toggleButton = screen.getByTestId('toggleSidebar');
      const initialState = screen.getByTestId('sidebarCollapsed').textContent;
      
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('sidebarCollapsed')).not.toHaveTextContent(initialState);
      });
    });
  });

  describe('Layout组件渲染', () => {
    it('应该正确渲染带有所有布局元素的完整布局', () => {
      render(
        <Layout>
          <div data-testid="main-content">主要内容</div>
        </Layout>
      );

      // 检查主要布局元素是否存在
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      
      // 检查布局容器
      const layoutContainer = screen.getByTestId('main-content').closest('[data-theme]');
      expect(layoutContainer).toBeInTheDocument();
    });

    it('应该支持隐藏特定布局元素', () => {
      render(
        <Layout showHeader={false} showSidebar={false} showFooter={false}>
          <div data-testid="main-content">主要内容</div>
        </Layout>
      );

      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('应该正确应用桌面端最大宽度限制', () => {
      render(
        <Layout>
          <div data-testid="main-content">主要内容</div>
        </Layout>
      );

      const layoutContainer = screen.getByTestId('main-content').closest('[data-theme]');
      expect(layoutContainer).toHaveClass('max-w-[1920px]');
    });
  });

  describe('主题切换功能', () => {
    it('应该支持主题状态持久化', () => {
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      render(
        <Layout>
          <div>内容</div>
        </Layout>
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
    });
  });

  describe('移动端特殊功能', () => {
    it('移动端应该显示触摸友好的悬浮按钮', async () => {
      global.innerWidth = 480;
      
      render(
        <Layout>
          <div>内容</div>
        </Layout>
      );

      fireEvent(window, new Event('resize'));
      
      // 等待组件重新渲染
      await waitFor(() => {
        const floatingButton = screen.queryByLabelText('打开侧边栏');
        expect(floatingButton).toBeInTheDocument();
      });
    });

    it('桌面端不应该显示悬浮按钮', async () => {
      global.innerWidth = 1200;
      
      render(
        <Layout>
          <div>内容</div>
        </Layout>
      );

      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        const floatingButton = screen.queryByLabelText('打开侧边栏');
        expect(floatingButton).not.toBeInTheDocument();
      });
    });
  });

  describe('无障碍功能', () => {
    it('应该提供正确的ARIA标签', () => {
      render(
        <Layout>
          <div>内容</div>
        </Layout>
      );

      // 检查main标签的存在
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('移动端遮罩层应该有正确的aria-hidden属性', async () => {
      global.innerWidth = 480;
      
      render(
        <Layout>
          <div>内容</div>
        </Layout>
      );

      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        const overlay = document.querySelector('[aria-hidden="true"]');
        expect(overlay).toBeInTheDocument();
      });
    });
  });

  describe('性能优化', () => {
    it('应该正确清理事件监听器', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <LayoutProvider>
          <TestComponent />
        </LayoutProvider>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});

describe('LayoutProvider Context', () => {
  it('应该在没有Provider时抛出错误', () => {
    // 捕获错误信息
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useLayout must be used within a LayoutProvider');

    consoleSpy.mockRestore();
  });

  it('应该正确提供所有context值', () => {
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );

    // 验证所有必要的值都被提供
    expect(screen.getByTestId('breakpoint')).toBeInTheDocument();
    expect(screen.getByTestId('isMobile')).toBeInTheDocument();
    expect(screen.getByTestId('isTablet')).toBeInTheDocument();
    expect(screen.getByTestId('isDesktop')).toBeInTheDocument();
    expect(screen.getByTestId('sidebarCollapsed')).toBeInTheDocument();
    expect(screen.getByTestId('toggleSidebar')).toBeInTheDocument();
  });
}); 