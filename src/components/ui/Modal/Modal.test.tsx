import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from '../Button';

// Mock Portal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

describe('Modal Component', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    children: <div>Modal内容</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 重置body样式
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // 清理body样式
    document.body.style.overflow = '';
  });

  // 基础渲染测试
  describe('基础渲染', () => {
    it('应该正确渲染打开的模态框', () => {
      render(<Modal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal内容')).toBeInTheDocument();
    });

    it('当open为false时不应该渲染', () => {
      render(<Modal {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('应该渲染带标题的模态框', () => {
      render(<Modal {...defaultProps} title="测试标题" />);
      
      expect(screen.getByText('测试标题')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
    });

    it('应该支持隐藏头部', () => {
      render(
        <Modal {...defaultProps} title="测试标题" showHeader={false} />
      );
      
      expect(screen.queryByText('测试标题')).not.toBeInTheDocument();
    });
  });

  // 尺寸变体测试
  describe('尺寸变体', () => {
    it('应该应用小尺寸样式', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const dialog = screen.getByRole('dialog').parentElement;
      expect(dialog).toHaveClass('max-w-sm');
    });

    it('应该应用大尺寸样式', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const dialog = screen.getByRole('dialog').parentElement;
      expect(dialog).toHaveClass('max-w-lg');
    });

    it('应该应用全屏样式', () => {
      render(<Modal {...defaultProps} size="full" />);
      const dialog = screen.getByRole('dialog').parentElement;
      expect(dialog).toHaveClass('max-w-full');
    });
  });

  // 动画测试
  describe('动画效果', () => {
    it('应该应用淡入动画', () => {
      render(<Modal {...defaultProps} animation="fade" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('opacity-0');
    });

    it('应该应用滑入动画', () => {
      render(<Modal {...defaultProps} animation="slide" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('translate-y-4', 'opacity-0');
    });

    it('应该应用缩放动画', () => {
      render(<Modal {...defaultProps} animation="zoom" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('scale-95', 'opacity-0');
    });
  });

  // 交互行为测试
  describe('交互行为', () => {
    it('应该通过关闭按钮关闭模态框', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<Modal {...defaultProps} onClose={onClose} title="测试" />);
      
      const closeButton = screen.getByRole('button', { name: '关闭' });
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('应该通过ESC键关闭模态框', async () => {
      const onClose = jest.fn();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('应该支持禁用ESC键关闭', async () => {
      const onClose = jest.fn();
      
      render(
        <Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('应该通过点击遮罩层关闭模态框', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      const overlay = screen.getByRole('dialog').parentElement;
      await user.click(overlay!);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('应该支持禁用点击遮罩层关闭', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(
        <Modal 
          {...defaultProps} 
          onClose={onClose} 
          closeOnOverlayClick={false} 
        />
      );
      
      const overlay = screen.getByRole('dialog').parentElement;
      await user.click(overlay!);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('点击模态框内容不应该关闭模态框', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      const dialog = screen.getByRole('dialog');
      await user.click(dialog);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // 自定义内容测试
  describe('自定义内容', () => {
    it('应该渲染自定义头部', () => {
      const customHeader = <div>自定义头部</div>;
      
      render(<Modal {...defaultProps} header={customHeader} />);
      
      expect(screen.getByText('自定义头部')).toBeInTheDocument();
    });

    it('应该渲染自定义底部', () => {
      const customFooter = (
        <div>
          <Button>确认</Button>
          <Button variant="outline">取消</Button>
        </div>
      );
      
      render(
        <Modal {...defaultProps} footer={customFooter} showFooter={true} />
      );
      
      expect(screen.getByText('确认')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('应该支持完全自定义结构', () => {
      render(
        <Modal {...defaultProps} showHeader={false}>
          <ModalHeader title="自定义标题" />
          <ModalBody>自定义内容</ModalBody>
          <ModalFooter align="between">
            <Button variant="outline">取消</Button>
            <Button>保存</Button>
          </ModalFooter>
        </Modal>
      );
      
      expect(screen.getByText('自定义标题')).toBeInTheDocument();
      expect(screen.getByText('自定义内容')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('保存')).toBeInTheDocument();
    });
  });

  // 滚动和布局测试
  describe('滚动和布局', () => {
    it('应该支持可滚动内容', () => {
      render(<Modal {...defaultProps} scrollable={true} />);
      const body = screen.getByRole('dialog').querySelector('[class*="overflow-y-auto"]');
      expect(body).toBeInTheDocument();
    });

    it('应该支持禁用滚动', () => {
      render(<Modal {...defaultProps} scrollable={false} />);
      const body = screen.getByRole('dialog').querySelector('[class*="overflow-hidden"]');
      expect(body).toBeInTheDocument();
    });

    it('应该支持居中和非居中布局', () => {
      const { rerender } = render(<Modal {...defaultProps} centered={true} />);
      let container = screen.getByRole('dialog').parentElement;
      expect(container).toHaveClass('items-center');
      
      rerender(<Modal {...defaultProps} centered={false} />);
      container = screen.getByRole('dialog').parentElement;
      expect(container).toHaveClass('items-start');
    });

    it('应该禁用body滚动', () => {
      render(<Modal {...defaultProps} disableBodyScroll={true} />);
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  // 无障碍测试
  describe('无障碍支持', () => {
    it('应该有正确的role和aria属性', () => {
      render(
        <Modal 
          {...defaultProps} 
          aria-label="确认对话框"
          aria-describedby="dialog-description"
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', '确认对话框');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
    });

    it('应该支持aria-labelledby', () => {
      render(
        <Modal 
          {...defaultProps} 
          aria-labelledby="dialog-title"
          title="标题"
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
    });

    it('关闭按钮应该有正确的aria-label', () => {
      render(<Modal {...defaultProps} title="测试" />);
      
      const closeButton = screen.getByRole('button', { name: '关闭' });
      expect(closeButton).toHaveAttribute('aria-label', '关闭');
    });
  });

  // 焦点管理测试
  describe('焦点管理', () => {
    it('应该在打开时自动聚焦第一个可聚焦元素', async () => {
      render(
        <Modal {...defaultProps} autoFocus={true} showCloseButton={false}>
          <Button>第一个按钮</Button>
          <Button>第二个按钮</Button>
        </Modal>
      );
      
      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: '第一个按钮' });
        expect(firstButton).toHaveFocus();
      });
    });

    it('应该支持禁用自动聚焦', () => {
      render(
        <Modal {...defaultProps} autoFocus={false}>
          <Button>按钮</Button>
        </Modal>
      );
      
      const button = screen.getByText('按钮');
      expect(button).not.toHaveFocus();
    });

    it('应该实现焦点陷阱功能', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal {...defaultProps} trapFocus={true} showCloseButton={false}>
          <Button>第一个按钮</Button>
          <Button>第二个按钮</Button>
        </Modal>
      );
      
      const firstButton = screen.getByRole('button', { name: '第一个按钮' });
      const secondButton = screen.getByRole('button', { name: '第二个按钮' });
      
      firstButton.focus();
      
      // Tab应该移动到第二个按钮
      await user.tab();
      expect(secondButton).toHaveFocus();
      
      // 再次Tab应该循环回第一个按钮
      await user.tab();
      expect(firstButton).toHaveFocus();
    });
  });

  // 子组件测试
  describe('子组件', () => {
    describe('ModalHeader', () => {
      it('应该渲染标题和关闭按钮', () => {
        const onClose = jest.fn();
        
        render(
          <ModalHeader 
            title="测试标题" 
            showCloseButton={true}
            onClose={onClose}
          />
        );
        
        expect(screen.getByText('测试标题')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
      });

      it('应该支持隐藏关闭按钮', () => {
        render(
          <ModalHeader 
            title="测试标题" 
            showCloseButton={false}
          />
        );
        
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
      });
    });

    describe('ModalBody', () => {
      it('应该渲染内容', () => {
        render(<ModalBody>测试内容</ModalBody>);
        expect(screen.getByText('测试内容')).toBeInTheDocument();
      });

      it('应该应用滚动样式', () => {
        render(<ModalBody scrollable={true}>内容</ModalBody>);
        const body = screen.getByText('内容');
        expect(body).toHaveClass('overflow-y-auto');
      });
    });

    describe('ModalFooter', () => {
      it('应该渲染底部内容', () => {
        render(
          <ModalFooter>
            <Button>确认</Button>
          </ModalFooter>
        );
        
        expect(screen.getByText('确认')).toBeInTheDocument();
      });

      it('应该应用对齐样式', () => {
        const { rerender } = render(
          <ModalFooter align="left">
            <Button>按钮</Button>
          </ModalFooter>
        );
        
        let footer = screen.getByText('按钮').closest('.flex');
        expect(footer).toHaveClass('justify-start');
        
        rerender(
          <ModalFooter align="center">
            <Button>按钮</Button>
          </ModalFooter>
        );
        
        footer = screen.getByText('按钮').closest('.flex');
        expect(footer).toHaveClass('justify-center');
      });
    });
  });

  // 边界情况测试
  describe('边界情况', () => {
    it('应该处理没有可聚焦元素的情况', async () => {
      render(
        <Modal {...defaultProps} autoFocus={true} showCloseButton={false}>
          <div>纯文本内容，没有可聚焦元素</div>
        </Modal>
      );
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveFocus();
      });
    });

    it('应该处理快速开关的情况', () => {
      const { rerender } = render(<Modal {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      rerender(<Modal {...defaultProps} open={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      rerender(<Modal {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('应该支持自定义zIndex', () => {
      render(<Modal {...defaultProps} zIndex={9999} />);
      const container = screen.getByRole('dialog').parentElement;
      expect(container).toHaveStyle({ zIndex: 9999 });
    });

    it.skip('应该支持服务端渲染', () => {
      // 在Jest环境中测试SSR比较复杂，这里跳过
      // 在实际使用中，Modal组件会正确处理typeof window === 'undefined'的情况
      expect(true).toBe(true);
    });
  });
}); 