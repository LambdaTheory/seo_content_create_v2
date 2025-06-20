import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Footer, useFooterStatus } from './Footer';
import { OperationStatus, ProgressInfo, StatusItem } from './Footer.types';
import '@testing-library/jest-dom';

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

// 模拟时间
const mockDate = new Date('2025-01-24T14:30:45.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

describe('Footer', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('应该正确渲染默认状态的Footer', () => {
    render(<Footer />);
    
    expect(screen.getByText('就绪')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('应该显示不同的操作状态', () => {
    const { rerender } = render(<Footer status="loading" />);
    expect(screen.getByText('加载中')).toBeInTheDocument();
    
    rerender(<Footer status="success" />);
    expect(screen.getByText('成功')).toBeInTheDocument();
    
    rerender(<Footer status="error" />);
    expect(screen.getByText('错误')).toBeInTheDocument();
  });

  it('应该显示自定义状态文本', () => {
    render(<Footer status="processing" statusText="正在处理数据..." />);
    
    expect(screen.getByText('正在处理数据...')).toBeInTheDocument();
  });

  it('应该显示进度信息', () => {
    const progress: ProgressInfo = {
      current: 3,
      total: 10,
      percentage: 30,
      label: '上传进度',
      unit: '个文件'
    };
    
    render(<Footer progress={progress} showProgress={true} />);
    
    expect(screen.getByText('上传进度: 30%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('应该处理左侧状态项', () => {
    const leftItems: StatusItem[] = [
      {
        id: 'files',
        label: '文件',
        value: '5',
        icon: '📁',
        variant: 'primary'
      },
      {
        id: 'size',
        label: '大小',
        value: '2.5MB',
        icon: '💾',
        variant: 'default'
      }
    ];
    
    render(<Footer leftItems={leftItems} />);
    
    expect(screen.getByText('文件')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('大小')).toBeInTheDocument();
    expect(screen.getByText('2.5MB')).toBeInTheDocument();
  });

  it('应该处理右侧状态项', () => {
    const rightItems: StatusItem[] = [
      {
        id: 'user',
        label: '用户',
        value: 'admin',
        icon: '👤',
        variant: 'success'
      }
    ];
    
    render(<Footer rightItems={rightItems} />);
    
    expect(screen.getByText('用户')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('应该处理收起状态', () => {
    const leftItems: StatusItem[] = [
      {
        id: 'test',
        label: '测试项',
        value: 'test',
        icon: '🔧'
      }
    ];
    
    render(<Footer collapsed={true} leftItems={leftItems} />);
    
    // 收起状态下文本应该不显示，只显示图标
    expect(screen.queryByText('测试项')).not.toBeInTheDocument();
  });

  it('应该处理状态点击事件', () => {
    const handleStatusClick = jest.fn();
    render(<Footer status="ready" onStatusClick={handleStatusClick} />);
    
    const statusElement = screen.getByText('就绪').closest('div');
    fireEvent.click(statusElement!);
    
    expect(handleStatusClick).toHaveBeenCalledWith('ready');
  });

  it('应该处理状态项点击事件', () => {
    const handleItemClick = jest.fn();
    const leftItems: StatusItem[] = [
      {
        id: 'clickable',
        label: '可点击项',
        value: 'click me',
        icon: '👆'
      }
    ];
    
    render(<Footer leftItems={leftItems} onItemClick={handleItemClick} />);
    
    const itemElement = screen.getByText('可点击项').closest('div');
    fireEvent.click(itemElement!);
    
    expect(handleItemClick).toHaveBeenCalledWith(leftItems[0]);
  });

  it('应该显示实时时间', () => {
    render(<Footer />);
    
    // 检查时间格式
    expect(screen.getByText(/^\d{2}:\d{2}:\d{2}$/)).toBeInTheDocument();
    expect(screen.getByText(/^\d{4}\/\d{1,2}\/\d{1,2}$/)).toBeInTheDocument();
  });

  it('应该更新实时时间', () => {
    render(<Footer />);
    
    const initialTime = screen.getByText(/^\d{2}:\d{2}:\d{2}$/);
    
    // 推进时间1秒
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // 时间应该更新了
    const updatedTime = screen.getByText(/^\d{2}:\d{2}:\d{2}$/);
    expect(updatedTime).toBeInTheDocument();
  });

  it('应该应用正确的高度', () => {
    const { rerender } = render(<Footer />);
    let footer = screen.getByRole('contentinfo');
    expect(footer).toHaveStyle({ height: '40px' });
    
    // 带进度条的高度
    const progress: ProgressInfo = { current: 1, total: 10 };
    rerender(<Footer progress={progress} showProgress={true} />);
    footer = screen.getByRole('contentinfo');
    expect(footer).toHaveStyle({ height: '48px' });
    
    // 收起状态的高度
    rerender(<Footer collapsed={true} />);
    footer = screen.getByRole('contentinfo');
    expect(footer).toHaveStyle({ height: '32px' });
  });

  it('应该应用自定义样式和类名', () => {
    render(
      <Footer 
        className="custom-footer" 
        style={{ backgroundColor: 'red' }}
      />
    );
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('custom-footer');
    expect(footer.style.backgroundColor).toBe('red');
  });

  it('应该显示活动状态的动画点', () => {
    render(<Footer status="loading" />);
    
    // 活动状态应该有动画点
    const animationDots = screen.getByText('加载中').parentElement?.querySelectorAll('.animate-pulse');
    expect(animationDots).toHaveLength(3);
  });

  it('应该正确格式化进度文本', () => {
    // 测试百分比格式
    const progressPercent: ProgressInfo = {
      current: 0,
      total: 0,
      percentage: 75,
      label: '处理进度'
    };
    const { rerender } = render(<Footer progress={progressPercent} showProgress={true} />);
    expect(screen.getByText('处理进度: 75%')).toBeInTheDocument();
    
    // 测试计数格式
    const progressCount: ProgressInfo = {
      current: 8,
      total: 20,
      label: '文件处理',
      unit: '个文件'
    };
    rerender(<Footer progress={progressCount} showProgress={true} />);
    expect(screen.getByText('文件处理: 8/20 个文件')).toBeInTheDocument();
  });
});

// 测试useFooterStatus Hook
describe('useFooterStatus', () => {
  const TestComponent = () => {
    const {
      status,
      statusText,
      progress,
      showProgress,
      updateStatus,
      updateProgress,
      hideProgress,
      reset
    } = useFooterStatus();

    return (
      <div>
        <div data-testid="status">{status}</div>
        <div data-testid="status-text">{statusText}</div>
        <div data-testid="show-progress">{showProgress.toString()}</div>
        {progress && (
          <div data-testid="progress">{progress.current}/{progress.total}</div>
        )}
        
        <button onClick={() => updateStatus('loading', '正在加载...')}>
          Update Status
        </button>
        <button onClick={() => updateProgress({ current: 5, total: 10 })}>
          Update Progress
        </button>
        <button onClick={hideProgress}>Hide Progress</button>
        <button onClick={reset}>Reset</button>
      </div>
    );
  };

  it('应该提供初始状态', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('status-text')).toHaveTextContent('');
    expect(screen.getByTestId('show-progress')).toHaveTextContent('false');
  });

  it('应该更新状态', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Update Status'));
    
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    expect(screen.getByTestId('status-text')).toHaveTextContent('正在加载...');
  });

  it('应该更新进度', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Update Progress'));
    
    expect(screen.getByTestId('show-progress')).toHaveTextContent('true');
    expect(screen.getByTestId('progress')).toHaveTextContent('5/10');
  });

  it('应该隐藏进度', () => {
    render(<TestComponent />);
    
    // 首先设置进度
    fireEvent.click(screen.getByText('Update Progress'));
    expect(screen.getByTestId('show-progress')).toHaveTextContent('true');
    
    // 然后隐藏进度
    fireEvent.click(screen.getByText('Hide Progress'));
    expect(screen.getByTestId('show-progress')).toHaveTextContent('false');
  });

  it('应该重置所有状态', () => {
    render(<TestComponent />);
    
    // 设置一些状态
    fireEvent.click(screen.getByText('Update Status'));
    fireEvent.click(screen.getByText('Update Progress'));
    
    // 重置
    fireEvent.click(screen.getByText('Reset'));
    
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('status-text')).toHaveTextContent('');
    expect(screen.getByTestId('show-progress')).toHaveTextContent('false');
  });
}); 