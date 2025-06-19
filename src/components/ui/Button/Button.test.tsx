import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './Button';

// Mock图标组件
const MockIcon = () => <span data-testid="mock-icon">Icon</span>;

describe('Button Component', () => {
  describe('基础功能', () => {
    it('应该正确渲染按钮文字', () => {
      render(<Button>点击我</Button>);
      expect(screen.getByText('点击我')).toBeInTheDocument();
    });

    it('应该处理点击事件', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>点击我</Button>);
      
      fireEvent.click(screen.getByRole('button', { name: '点击我' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('应该支持自定义类名', () => {
      render(<Button className="custom-class">按钮</Button>);
      const button = screen.getByRole('button', { name: '按钮' });
      expect(button).toHaveClass('custom-class');
    });

    it('应该正确设置按钮类型', () => {
      render(<Button type="submit">提交</Button>);
      const button = screen.getByRole('button', { name: '提交' });
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('变体样式', () => {
    it('应该应用primary变体样式', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button', { name: 'Primary' });
      expect(button).toHaveClass('bg-primary-600', 'text-white');
    });

    it('应该应用secondary变体样式', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button', { name: 'Secondary' });
      expect(button).toHaveClass('bg-gray-100', 'text-gray-900');
    });

    it('应该应用outline变体样式', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button', { name: 'Outline' });
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-white');
    });

    it('应该应用ghost变体样式', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button', { name: 'Ghost' });
      expect(button).toHaveClass('text-gray-700');
    });

    it('应该应用danger变体样式', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button', { name: 'Danger' });
      expect(button).toHaveClass('bg-error-600', 'text-white');
    });
  });

  describe('尺寸配置', () => {
    it('应该应用small尺寸样式', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button', { name: 'Small' });
      expect(button).toHaveClass('px-3', 'py-2', 'text-sm', 'h-8');
    });

    it('应该应用medium尺寸样式', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button', { name: 'Medium' });
      expect(button).toHaveClass('px-4', 'py-2', 'text-base', 'h-10');
    });

    it('应该应用large尺寸样式', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button', { name: 'Large' });
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg', 'h-12');
    });
  });

  describe('状态管理', () => {
    it('禁用状态应该阻止点击', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>禁用按钮</Button>);
      
      const button = screen.getByRole('button', { name: '禁用按钮' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('加载状态应该显示加载图标', () => {
      render(<Button loading>加载中</Button>);
      
      const button = screen.getByRole('button', { name: '加载中' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-wait');
      
      // 检查是否有加载图标
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('加载状态应该阻止点击事件', () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>加载中</Button>);
      
      fireEvent.click(screen.getByRole('button', { name: '加载中' }));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('图标支持', () => {
    it('应该显示左侧图标', () => {
      render(
        <Button leftIcon={<MockIcon />}>
          有图标按钮
        </Button>
      );
      
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
      expect(screen.getByText('有图标按钮')).toBeInTheDocument();
    });

    it('应该显示右侧图标', () => {
      render(
        <Button rightIcon={<MockIcon />}>
          有图标按钮
        </Button>
      );
      
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
      expect(screen.getByText('有图标按钮')).toBeInTheDocument();
    });

    it('加载状态时不应该显示右侧图标', () => {
      render(
        <Button loading rightIcon={<MockIcon />}>
          加载中
        </Button>
      );
      
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });

    it('加载状态时应该用加载图标替换左侧图标', () => {
      render(
        <Button loading leftIcon={<MockIcon />}>
          加载中
        </Button>
      );
      
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
      const spinner = screen.getByText('加载中').parentElement?.querySelector('svg');
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('全宽选项', () => {
    it('应该支持全宽显示', () => {
      render(<Button fullWidth>全宽按钮</Button>);
      const button = screen.getByRole('button', { name: '全宽按钮' });
      expect(button).toHaveClass('w-full');
    });
  });

  describe('键盘导航', () => {
    it('应该可以获得焦点', () => {
      render(<Button>按钮</Button>);
      
      const button = screen.getByRole('button', { name: '按钮' });
      button.focus();
      
      expect(button).toHaveFocus();
    });

    it('禁用状态下不应该获得焦点', () => {
      render(<Button disabled>禁用按钮</Button>);
      
      const button = screen.getByRole('button', { name: '禁用按钮' });
      button.focus();
      
      expect(button).not.toHaveFocus();
    });

    it('应该是可聚焦的元素', () => {
      render(<Button>按钮</Button>);
      
      const button = screen.getByRole('button', { name: '按钮' });
      // button元素天然可聚焦，不需要显式的tabindex
      expect(button.tagName).toBe('BUTTON');
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('无障碍属性', () => {
    it('应该有正确的焦点样式', () => {
      render(<Button>按钮</Button>);
      const button = screen.getByRole('button', { name: '按钮' });
      expect(button).toHaveClass('focus-visible:outline', 'focus-visible:outline-2');
    });

    it('应该支持aria-label', () => {
      render(<Button aria-label="关闭对话框">×</Button>);
      const button = screen.getByLabelText('关闭对话框');
      expect(button).toBeInTheDocument();
    });

    it('加载状态应该有适当的aria属性', () => {
      render(<Button loading aria-label="正在保存">保存</Button>);
      const button = screen.getByLabelText('正在保存');
      expect(button).toBeDisabled();
    });
  });

  describe('默认值', () => {
    it('应该使用默认的variant和size', () => {
      render(<Button>默认按钮</Button>);
      const button = screen.getByRole('button', { name: '默认按钮' });
      
      // 默认应该是primary variant
      expect(button).toHaveClass('bg-primary-600', 'text-white');
      // 默认应该是md size
      expect(button).toHaveClass('px-4', 'py-2', 'h-10');
    });

    it('默认类型应该是button', () => {
      render(<Button>按钮</Button>);
      const button = screen.getByRole('button', { name: '按钮' });
      expect(button).toHaveAttribute('type', 'button');
    });
  });
}); 