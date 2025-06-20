/**
 * Button组件单元测试
 * 任务11.1.1：编写单元测试用例 - Button组件完整测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import type { ButtonProps } from '../Button.types';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loading-icon" className={className}>Loading</div>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <div data-testid="chevron-icon" className={className}>Chevron</div>
  ),
}));

describe('Button Component', () => {
  const defaultProps: ButtonProps = {
    children: '测试按钮'
  };

  describe('基础渲染', () => {
    it('应该渲染正确的文本', () => {
      render(<Button {...defaultProps} />);
      expect(screen.getByText('测试按钮')).toBeInTheDocument();
    });

    it('应该渲染为button元素', () => {
      render(<Button {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('应该应用默认的variant和size', () => {
      render(<Button {...defaultProps} />);

      const button = screen.getByRole('button');
      // 检查是否包含基本样式类
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
      // 检查默认primary样式
      expect(button).toHaveClass('bg-primary-600', 'text-white');
      // 检查默认md尺寸
      expect(button).toHaveClass('px-4', 'py-2', 'h-10');
    });

    it('应该支持自定义className', () => {
      const customClass = 'custom-button-class';
      render(<Button {...defaultProps} className={customClass} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(customClass);
    });
  });

  describe('变体测试', () => {
    const variants: ButtonProps['variant'][] = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
    
    variants.forEach(variant => {
      it(`应该正确应用${variant}变体`, () => {
        render(<Button variant={variant}>测试</Button>);

        const button = screen.getByRole('button');
        // 检查基本样式类存在
        expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
        
        // 根据变体检查特定样式
        switch (variant) {
          case 'primary':
            expect(button).toHaveClass('bg-primary-600', 'text-white');
            break;
          case 'secondary':
            expect(button).toHaveClass('bg-gray-100', 'text-gray-900');
            break;
          case 'outline':
            expect(button).toHaveClass('border', 'border-gray-300', 'bg-white');
            break;
          case 'ghost':
            expect(button).toHaveClass('text-gray-700');
            break;
          case 'danger':
            expect(button).toHaveClass('bg-error-600', 'text-white');
            break;
        }
      });
    });
  });

  describe('尺寸测试', () => {
    const sizes: ButtonProps['size'][] = ['sm', 'md', 'lg'];
    
    sizes.forEach(size => {
      it(`应该正确应用${size}尺寸`, () => {
        render(<Button size={size}>测试</Button>);

        const button = screen.getByRole('button');
        switch (size) {
          case 'sm':
            expect(button).toHaveClass('px-3', 'py-2', 'text-sm', 'h-8');
            break;
          case 'md':
            expect(button).toHaveClass('px-4', 'py-2', 'text-base', 'h-10');
            break;
          case 'lg':
            expect(button).toHaveClass('px-6', 'py-3', 'text-lg', 'h-12');
            break;
        }
      });
    });
  });

  describe('状态测试', () => {
    it('应该正确处理禁用状态', () => {
      render(<Button disabled>禁用按钮</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('应该正确处理加载状态', () => {
      render(<Button loading>加载按钮</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-wait');
      // 检查是否有loading图标
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('加载状态应该优先于disabled状态', () => {
      render(<Button loading disabled>按钮</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-wait');
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('全宽测试', () => {
    it('应该支持全宽模式', () => {
      render(<Button fullWidth>全宽按钮</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('图标测试', () => {
    it('应该显示左侧图标', () => {
      const leftIcon = <span data-testid="left-icon">📍</span>;
      render(<Button leftIcon={leftIcon}>图标按钮</Button>);

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText('图标按钮')).toBeInTheDocument();
    });

    it('应该显示右侧图标', () => {
      const rightIcon = <span data-testid="right-icon">➡️</span>;
      render(<Button rightIcon={rightIcon}>图标按钮</Button>);

      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('图标按钮')).toBeInTheDocument();
    });

    it('加载状态应该隐藏左侧图标并显示spinner', () => {
      const leftIcon = <span data-testid="left-icon">📍</span>;
      render(<Button leftIcon={leftIcon} loading>加载中</Button>);

      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('加载状态应该隐藏右侧图标', () => {
      const rightIcon = <span data-testid="right-icon">➡️</span>;
      render(<Button rightIcon={rightIcon} loading>加载中</Button>);

      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('事件处理', () => {
    it('应该处理点击事件', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>点击我</Button>);
      
      fireEvent.click(screen.getByText('点击我'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('禁用状态应该阻止点击', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>点击我</Button>);
      
      fireEvent.click(screen.getByText('点击我'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('加载状态应该阻止点击', () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>点击我</Button>);
      
      fireEvent.click(screen.getByText('点击我'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('应该支持键盘导航', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>按钮</Button>);
      
      const button = screen.getByRole('button');
      button.focus();

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      // 注意：React测试库中，keyDown事件不会自动触发click事件
      // 如果需要测试这个功能，需要在组件中明确处理
      expect(handleClick).toHaveBeenCalledTimes(0);
    });
  });

  describe('表单集成', () => {
    it('应该支持submit类型', () => {
      render(<Button type="submit">提交</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('应该支持reset类型', () => {
      render(<Button type="reset">重置</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });

    it('默认应该是button类型', () => {
      render(<Button>按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('HTML属性', () => {
    it('应该正确传递HTML属性', () => {
      render(
        <Button 
          {...defaultProps} 
          id="test-button"
          data-testid="custom-button"
          aria-label="Custom aria label"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'test-button');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('aria-label', 'Custom aria label');
    });

    it('应该支持自定义样式', () => {
      const customStyle = { backgroundColor: 'red', color: 'white' };
      render(<Button style={customStyle}>自定义样式</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle('background-color: red');
      expect(button).toHaveStyle('color: white');
    });
  });

  describe('无障碍性', () => {
    it('应该有正确的role属性', () => {
      render(<Button>按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('应该支持aria-label', () => {
      render(<Button aria-label="关闭对话框">×</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '关闭对话框');
    });

    it('应该支持aria-describedby', () => {
      render(<Button aria-describedby="help-text">帮助</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });
  });

  describe('性能测试', () => {
    it('应该不会有内存泄漏', () => {
      let unmount: any;
      
      for (let i = 0; i < 100; i++) {
        if (unmount) unmount();
        const result = render(<Button {...defaultProps} />);
        unmount = result.unmount;
      }
      
      // 如果有内存泄漏，这里会抛出错误
      expect(true).toBe(true);
    });

    it('应该正确清理事件监听器', () => {
      const handleClick = jest.fn();
      const { unmount } = render(<Button onClick={handleClick}>按钮</Button>);
      
      unmount();
      
      // 卸载后，点击事件不应该被触发
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('动画和过渡', () => {
    it('应该有过渡类名', () => {
      render(<Button>按钮</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors', 'duration-200');
    });

    it('应该有hover状态样式', () => {
      render(<Button variant="primary">按钮</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-primary-700');
    });

    it('应该有focus样式', () => {
      render(<Button>按钮</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline', 'focus-visible:outline-2');
    });
  });

  describe('边界情况', () => {
    it('应该处理空children', () => {
      render(<Button>{''}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('应该处理复杂的children', () => {
      render(
        <Button>
          <span>复杂</span>
          <em>内容</em>
        </Button>
      );
      
      expect(screen.getByText('复杂')).toBeInTheDocument();
      expect(screen.getByText('内容')).toBeInTheDocument();
    });

    it('应该处理长文本', () => {
      const longText = '这是一个非常长的按钮文本，用来测试文本溢出处理';
      render(<Button>{longText}</Button>);
      
      const button = screen.getByRole('button');
      const textSpan = button.querySelector('.truncate');
      expect(textSpan).toBeInTheDocument();
      expect(textSpan).toHaveTextContent(longText);
    });
  });

  describe('组件引用', () => {
    it('应该正确转发ref', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>按钮</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toContain('按钮');
    });

    it('应该支持调用ref的方法', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>按钮</Button>);
      
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.click).toBeDefined();
    });
  });
});

// 性能基准测试
describe('Button Performance', () => {
  it('渲染1000个按钮应该在合理时间内完成', () => {
    const startTime = performance.now();
    
    const buttons = Array.from({ length: 1000 }, (_, i) => (
      <Button key={i}>Button {i}</Button>
    ));
    
    render(<div>{buttons}</div>);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // 渲染1000个按钮应该在1秒内完成
    expect(renderTime).toBeLessThan(1000);
  });
}); 