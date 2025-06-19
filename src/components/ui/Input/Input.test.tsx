import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Input } from './Input';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

describe('Input Component', () => {
  // 基础渲染测试
  describe('基础渲染', () => {
    it('应该正确渲染基础输入框', () => {
      render(<Input placeholder="请输入内容" />);
      const input = screen.getByPlaceholderText('请输入内容');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('w-full');
    });

    it('应该渲染带标签的输入框', () => {
      render(<Input label="用户名" placeholder="请输入用户名" />);
      expect(screen.getByText('用户名')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument();
    });

    it('应该显示必填标记', () => {
      render(<Input label="密码" required />);
      const label = screen.getByText('密码');
      expect(label).toHaveClass('after:content-[\'*\']');
    });
  });

  // 变体测试
  describe('变体样式', () => {
    it('应该应用默认变体样式', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border', 'border-gray-300', 'bg-white');
    });

    it('应该应用填充变体样式', () => {
      render(<Input variant="filled" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('bg-gray-50');
    });

    it('应该应用轮廓变体样式', () => {
      render(<Input variant="outline" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-2');
    });

    it('应该应用无边框变体样式', () => {
      render(<Input variant="borderless" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-0');
    });
  });

  // 尺寸测试
  describe('尺寸规格', () => {
    it('应该应用小尺寸样式', () => {
      render(<Input size="sm" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-9', 'text-sm');
    });

    it('应该应用中等尺寸样式', () => {
      render(<Input size="md" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-10', 'text-base');
    });

    it('应该应用大尺寸样式', () => {
      render(<Input size="lg" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-12', 'text-lg');
    });
  });

  // 状态测试
  describe('状态处理', () => {
    it('应该显示错误状态', () => {
      render(
        <Input 
          error 
          errorMessage="输入格式错误" 
          data-testid="input" 
        />
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-error-300');
      expect(screen.getByText('输入格式错误')).toBeInTheDocument();
    });

    it('应该显示帮助文本', () => {
      render(<Input helpText="这是帮助文本" />);
      expect(screen.getByText('这是帮助文本')).toBeInTheDocument();
    });

    it('应该在禁用状态下禁用输入', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed');
    });

    it('应该在加载状态下显示加载指示器', () => {
      render(<Input loading data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
      expect(document.querySelector('svg')).toBeInTheDocument(); // spinner
    });
  });

  // 图标测试
  describe('图标功能', () => {
    it('应该渲染左侧图标', () => {
      render(
        <Input 
          leftIcon={<UserIcon data-testid="left-icon" />} 
          data-testid="input"
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-10');
    });

    it('应该渲染右侧图标', () => {
      render(
        <Input 
          rightIcon={<LockClosedIcon data-testid="right-icon" />} 
          data-testid="input"
        />
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  // 交互功能测试
  describe('交互功能', () => {
    it('应该处理输入变化事件', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input onChange={handleChange} data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.type(input, 'Hello');
      
      expect(handleChange).toHaveBeenCalledTimes(5);
      expect(input).toHaveValue('Hello');
    });

    it('应该支持受控组件模式', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('初始值');
        return (
          <Input 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="input"
          />
        );
      };
      
      render(<TestComponent />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveValue('初始值');
      
      await user.clear(input);
      await user.type(input, '新值');
      
      expect(input).toHaveValue('新值');
    });

    it('应该支持清除功能', async () => {
      const user = userEvent.setup();
      const handleClear = jest.fn();
      
      render(
        <Input 
          defaultValue="要清除的内容"
          clearable
          onClear={handleClear}
          data-testid="input"
        />
      );
      
      const clearButton = screen.getByRole('button', { name: '清除内容' });
      await user.click(clearButton);
      
      expect(handleClear).toHaveBeenCalledTimes(1);
      const input = screen.getByTestId('input');
      expect(input).toHaveValue('');
    });

    it('应该支持密码显示切换', async () => {
      const user = userEvent.setup();
      
      render(
        <Input 
          type="password"
          showPasswordToggle
          defaultValue="secret"
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'password');
      
      const toggleButton = screen.getByRole('button', { name: '显示密码' });
      await user.click(toggleButton);
      
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: '隐藏密码' })).toBeInTheDocument();
    });
  });

  // 附加内容测试
  describe('附加内容', () => {
    it('应该渲染左侧附加内容', () => {
      render(
        <Input 
          leftAddon={<span>@</span>}
          data-testid="input"
        />
      );
      expect(screen.getByText('@')).toBeInTheDocument();
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('rounded-l-none', 'border-l-0');
    });

    it('应该渲染右侧附加内容', () => {
      render(
        <Input 
          rightAddon={<span>.com</span>}
          data-testid="input"
        />
      );
      expect(screen.getByText('.com')).toBeInTheDocument();
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('rounded-r-none', 'border-r-0');
    });
  });

  // 无障碍测试
  describe('无障碍支持', () => {
    it('应该关联标签和输入框', () => {
      render(<Input label="用户名" id="username" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('用户名');
      
      // 标签应该正确关联到输入框
      expect(input).toHaveAccessibleName('用户名');
      expect(label).toHaveAttribute('for', 'username');
    });

    it('应该提供正确的aria标签', () => {
      render(
        <Input 
          id="test-input"
          error
          errorMessage="输入错误"
          helpText="帮助信息"
          data-testid="input"
        />
      );
      
      // 错误状态应该有适当的aria属性
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
    });

    it('清除和密码切换按钮应该有正确的aria-label', () => {
      render(
        <Input 
          type="password"
          showPasswordToggle
          clearable
          defaultValue="test"
        />
      );
      
      expect(screen.getByRole('button', { name: '清除内容' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '显示密码' })).toBeInTheDocument();
    });
  });

  // 边界情况测试
  describe('边界情况', () => {
    it('应该处理空的默认值', () => {
      render(<Input defaultValue="" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveValue('');
    });

    it('应该在值为空时不显示清除按钮', () => {
      render(<Input clearable value="" />);
      expect(screen.queryByRole('button', { name: '清除内容' })).not.toBeInTheDocument();
    });

    it('应该在加载时隐藏其他功能按钮', () => {
      render(
        <Input 
          loading
          clearable
          showPasswordToggle
          type="password"
          defaultValue="test"
        />
      );
      
      expect(screen.queryByRole('button', { name: '清除内容' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '显示密码' })).not.toBeInTheDocument();
    });
  });
}); 