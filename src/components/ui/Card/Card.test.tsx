import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from './Card';

// Mock组件
const MockIcon = () => <span data-testid="mock-icon">Icon</span>;
const MockFooter = () => <div data-testid="mock-footer">Footer</div>;

describe('Card Component', () => {
  describe('基础功能', () => {
    it('应该正确渲染卡片内容', () => {
      render(<Card>卡片内容</Card>);
      expect(screen.getByText('卡片内容')).toBeInTheDocument();
    });

    it('应该支持自定义类名', () => {
      render(<Card className="custom-class">内容</Card>);
      const card = screen.getByText('内容').parentElement;
      expect(card).toHaveClass('custom-class');
    });

    it('应该渲染标题和描述', () => {
      render(
        <Card title="卡片标题" description="卡片描述">
          内容
        </Card>
      );
      
      expect(screen.getByText('卡片标题')).toBeInTheDocument();
      expect(screen.getByText('卡片描述')).toBeInTheDocument();
      expect(screen.getByText('内容')).toBeInTheDocument();
    });

    it('应该渲染自定义头部和底部', () => {
      render(
        <Card 
          header={<MockIcon />}
          footer={<MockFooter />}
        >
          内容
        </Card>
      );
      
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
      expect(screen.getByText('内容')).toBeInTheDocument();
    });
  });

  describe('变体样式', () => {
    it('应该应用default变体样式', () => {
      render(<Card variant="default">Default</Card>);
      const card = screen.getByText('Default').parentElement;
      expect(card).toHaveClass('bg-white', 'border', 'border-gray-200', 'shadow-sm');
    });

    it('应该应用outlined变体样式', () => {
      render(<Card variant="outlined">Outlined</Card>);
      const card = screen.getByText('Outlined').parentElement;
      expect(card).toHaveClass('bg-white', 'border-2', 'border-gray-300', 'shadow-none');
    });

    it('应该应用elevated变体样式', () => {
      render(<Card variant="elevated">Elevated</Card>);
      const card = screen.getByText('Elevated').parentElement;
      expect(card).toHaveClass('bg-white', 'border', 'border-gray-100', 'shadow-lg');
    });

    it('应该应用filled变体样式', () => {
      render(<Card variant="filled">Filled</Card>);
      const card = screen.getByText('Filled').parentElement;
      expect(card).toHaveClass('bg-gray-50', 'border', 'border-gray-200', 'shadow-none');
    });
  });

  describe('尺寸配置', () => {
    it('应该应用small尺寸样式', () => {
      render(<Card size="sm">Small</Card>);
      const card = screen.getByText('Small').parentElement;
      expect(card).toHaveClass('p-4', 'gap-3', 'rounded-md');
    });

    it('应该应用medium尺寸样式', () => {
      render(<Card size="md">Medium</Card>);
      const card = screen.getByText('Medium').parentElement;
      expect(card).toHaveClass('p-6', 'gap-4', 'rounded-lg');
    });

    it('应该应用large尺寸样式', () => {
      render(<Card size="lg">Large</Card>);
      const card = screen.getByText('Large').parentElement;
      expect(card).toHaveClass('p-8', 'gap-6', 'rounded-xl');
    });
  });

  describe('交互状态', () => {
    it('可点击状态应该添加正确的样式和属性', () => {
      const handleClick = jest.fn();
      render(
        <Card clickable onClick={handleClick}>
          可点击卡片
        </Card>
      );
      
      const card = screen.getByText('可点击卡片').parentElement;
      expect(card).toHaveClass('cursor-pointer', 'focus-within:outline-primary-500');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('可点击状态应该处理点击事件', () => {
      const handleClick = jest.fn();
      render(
        <Card clickable onClick={handleClick}>
          可点击卡片
        </Card>
      );
      
      const card = screen.getByText('可点击卡片').parentElement;
      fireEvent.click(card!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('可点击状态应该处理键盘事件', () => {
      const handleClick = jest.fn();
      render(
        <Card clickable onClick={handleClick}>
          可点击卡片
        </Card>
      );
      
      const card = screen.getByText('可点击卡片').parentElement;
      fireEvent.keyDown(card!, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(card!, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('非点击状态不应该处理点击事件', () => {
      const handleClick = jest.fn();
      render(
        <Card onClick={handleClick}>
          普通卡片
        </Card>
      );
      
      const card = screen.getByText('普通卡片').parentElement;
      fireEvent.click(card!);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('悬停状态应该添加正确的样式', () => {
      render(<Card hoverable>悬停卡片</Card>);
      const card = screen.getByText('悬停卡片').parentElement;
      expect(card).toHaveClass('hover:shadow-md', 'hover:-translate-y-0.5');
    });

    it('悬停状态应该根据变体添加不同的样式', () => {
      render(<Card variant="outlined" hoverable>悬停卡片</Card>);
      const card = screen.getByText('悬停卡片').parentElement;
      expect(card).toHaveClass('hover:border-primary-300', 'hover:shadow-sm');
    });
  });

  describe('加载状态', () => {
    it('加载状态应该显示骨架屏', () => {
      render(<Card loading>内容</Card>);
      
      // 检查是否有骨架屏的动画元素
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      
      // 内容不应该显示
      expect(screen.queryByText('内容')).not.toBeInTheDocument();
    });

    it('加载状态应该保持卡片的基础样式', () => {
      render(<Card loading variant="elevated" size="lg">内容</Card>);
      
      const skeleton = document.querySelector('.animate-pulse');
      const card = skeleton?.parentElement;
      expect(card).toHaveClass('bg-white', 'shadow-lg', 'p-8');
    });
  });

  describe('自定义样式', () => {
    it('应该支持自定义圆角', () => {
      render(<Card rounded="xl">内容</Card>);
      const card = screen.getByText('内容').parentElement;
      expect(card).toHaveClass('rounded-xl');
    });

    it('应该支持自定义边框', () => {
      render(<Card border="lg">内容</Card>);
      const card = screen.getByText('内容').parentElement;
      expect(card).toHaveClass('border-4');
    });

    it('应该支持自定义阴影', () => {
      render(<Card shadow="xl">内容</Card>);
      const card = screen.getByText('内容').parentElement;
      expect(card).toHaveClass('shadow-xl');
    });

    it('应该支持自定义内容区域类名', () => {
      render(
        <Card contentClassName="custom-content">
          内容
        </Card>
      );
      
      const content = screen.getByText('内容');
      expect(content).toHaveClass('custom-content');
    });

    it('应该支持自定义头部类名', () => {
      render(
        <Card 
          title="标题" 
          headerClassName="custom-header"
        >
          内容
        </Card>
      );
      
      const header = screen.getByText('标题').parentElement;
      expect(header).toHaveClass('custom-header');
    });

    it('应该支持自定义底部类名', () => {
      render(
        <Card 
          footer={<div>底部</div>}
          footerClassName="custom-footer"
        >
          内容
        </Card>
      );
      
      const footer = screen.getByText('底部').parentElement;
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('无障碍属性', () => {
    it('应该有正确的语义结构', () => {
      render(
        <Card title="标题" description="描述">
          内容
        </Card>
      );
      
      const title = screen.getByText('标题');
      expect(title.tagName).toBe('H3');
      
      const description = screen.getByText('描述');
      expect(description.tagName).toBe('P');
    });

    it('可点击卡片应该有正确的无障碍属性', () => {
      render(<Card clickable>可点击卡片</Card>);
      
      const card = screen.getByText('可点击卡片').parentElement;
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('普通卡片不应该有按钮相关的无障碍属性', () => {
      render(<Card>普通卡片</Card>);
      
      const card = screen.getByText('普通卡片').parentElement;
      expect(card).not.toHaveAttribute('role', 'button');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('默认值', () => {
    it('应该使用默认的variant和size', () => {
      render(<Card>默认卡片</Card>);
      const card = screen.getByText('默认卡片').parentElement;
      
      // 默认应该是default variant
      expect(card).toHaveClass('bg-white', 'border', 'border-gray-200', 'shadow-sm');
      // 默认应该是md size
      expect(card).toHaveClass('p-6', 'gap-4', 'rounded-lg');
    });

    it('默认不应该是可点击或可悬停的', () => {
      render(<Card>默认卡片</Card>);
      const card = screen.getByText('默认卡片').parentElement;
      
      expect(card).not.toHaveClass('cursor-pointer');
      expect(card).not.toHaveClass('hover:shadow-md');
    });
  });

  describe('复合使用场景', () => {
    it('应该支持标题、描述和自定义内容的组合', () => {
      render(
        <Card 
          title="游戏卡片"
          description="这是一个游戏卡片的描述"
          variant="elevated"
          size="lg"
          hoverable
        >
          <div>游戏详细信息</div>
          <button>立即下载</button>
        </Card>
      );
      
      expect(screen.getByText('游戏卡片')).toBeInTheDocument();
      expect(screen.getByText('这是一个游戏卡片的描述')).toBeInTheDocument();
      expect(screen.getByText('游戏详细信息')).toBeInTheDocument();
      expect(screen.getByText('立即下载')).toBeInTheDocument();
      
      const card = screen.getByText('游戏卡片').parentElement?.parentElement;
      expect(card).toHaveClass('shadow-lg', 'p-8', 'hover:shadow-md');
    });
  });
}); 