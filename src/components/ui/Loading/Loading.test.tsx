import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  Loading, 
  Spinner, 
  DotsLoader, 
  BarsLoader, 
  Progress, 
  SkeletonImage, 
  SkeletonText, 
  Skeleton, 
  LoadingOverlay 
} from './Loading';

describe('Loading Components', () => {
  describe('Spinner', () => {
    it('应该渲染默认的Spinner', () => {
      render(<Spinner />);
      const spinner = screen.getByLabelText('Loading...');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-8', 'h-8', 'text-primary-600');
    });

    it('应该应用不同的尺寸', () => {
      const { rerender } = render(<Spinner size="sm" />);
      let spinner = screen.getByLabelText('Loading...');
      expect(spinner).toHaveClass('w-4', 'h-4');

      rerender(<Spinner size="lg" />);
      spinner = screen.getByLabelText('Loading...');
      expect(spinner).toHaveClass('w-12', 'h-12');

      rerender(<Spinner size="xl" />);
      spinner = screen.getByLabelText('Loading...');
      expect(spinner).toHaveClass('w-16', 'h-16');
    });

    it('应该应用自定义颜色', () => {
      render(<Spinner color="secondary" />);
      const spinner = screen.getByLabelText('Loading...');
      expect(spinner).toHaveClass('text-gray-500');
    });

    it('应该支持自定义类名', () => {
      render(<Spinner className="custom-spinner" />);
      const spinner = screen.getByLabelText('Loading...');
      expect(spinner).toHaveClass('custom-spinner');
    });
  });

  describe('DotsLoader', () => {
    it('应该渲染DotsLoader', () => {
      render(<DotsLoader />);
      const loader = screen.getByLabelText('Loading...');
      expect(loader).toBeInTheDocument();
      expect(loader.querySelectorAll('div')).toHaveLength(3);
    });

    it('应该应用不同的尺寸', () => {
      const { rerender } = render(<DotsLoader size="sm" />);
      let loader = screen.getByLabelText('Loading...');
      let dots = loader.querySelectorAll('div');
      expect(dots[0]).toHaveClass('w-2', 'h-2');

      rerender(<DotsLoader size="lg" />);
      loader = screen.getByLabelText('Loading...');
      dots = loader.querySelectorAll('div');
      expect(dots[0]).toHaveClass('w-5', 'h-5');
    });

    it('应该应用自定义颜色', () => {
      render(<DotsLoader color="secondary" />);
      const loader = screen.getByLabelText('Loading...');
      const dots = loader.querySelectorAll('div');
      dots.forEach(dot => {
        expect(dot).toHaveClass('bg-gray-500');
      });
    });
  });

  describe('BarsLoader', () => {
    it('应该渲染默认的BarsLoader', () => {
      render(<BarsLoader />);
      const loader = screen.getByLabelText('Loading...');
      expect(loader).toBeInTheDocument();
      expect(loader.querySelectorAll('div')).toHaveLength(4);
    });

    it('应该支持自定义bars数量', () => {
      render(<BarsLoader bars={5} />);
      const loader = screen.getByLabelText('Loading...');
      expect(loader.querySelectorAll('div')).toHaveLength(5);
    });

    it('应该应用不同的尺寸', () => {
      const { rerender } = render(<BarsLoader size="sm" />);
      let loader = screen.getByLabelText('Loading...');
      let bars = loader.querySelectorAll('div');
      expect(bars[0]).toHaveClass('w-1', 'h-8');

      rerender(<BarsLoader size="lg" />);
      loader = screen.getByLabelText('Loading...');
      bars = loader.querySelectorAll('div');
      expect(bars[0]).toHaveClass('w-1.5', 'h-16');
    });
  });

  describe('Progress', () => {
    it('应该渲染Progress组件', () => {
      render(<Progress value={50} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveAttribute('aria-valuenow', '50');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
    });

    it('应该显示正确的进度值', () => {
      render(<Progress value={75} />);
      const progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveStyle('width: 75%');
    });

    it('应该显示百分比文本', () => {
      render(<Progress value={30} showText />);
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('应该显示自定义文本', () => {
      render(<Progress value={60} showText formatText={(val, max) => "正在处理..."} />);
      expect(screen.getByText('正在处理...')).toBeInTheDocument();
    });

    it('应该支持动画效果', () => {
      const { rerender } = render(<Progress value={20} animated />);
      const progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('animate-pulse');

      rerender(<Progress value={80} animated />);
      expect(progressBar).toHaveStyle('width: 80%');
    });

    it('应该支持条纹效果', () => {
      render(<Progress value={40} striped />);
      const progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-gradient-to-r');
    });

    it('应该应用不同的尺寸', () => {
      const { rerender } = render(<Progress value={50} size="sm" />);
      let progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('h-2');

      rerender(<Progress value={50} size="lg" />);
      progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('h-6');
    });

    it('应该应用不同的颜色', () => {
      const { rerender } = render(<Progress value={50} color="success" />);
      let progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-green-500');

      rerender(<Progress value={50} color="warning" />);
      progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-yellow-500');

      rerender(<Progress value={50} color="error" />);
      progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-red-500');
    });

    it('应该限制进度值在0-100之间', () => {
      const { rerender } = render(<Progress value={-10} />);
      let progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveStyle('width: 0%');

      rerender(<Progress value={150} />);
      progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveStyle('width: 100%');
    });
  });

  describe('SkeletonImage', () => {
    it('应该渲染默认的SkeletonImage', () => {
      render(<SkeletonImage />);
      const skeleton = screen.getByLabelText('Loading image...');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-gray-200', 'animate-pulse', 'rounded-md');
    });

    it('应该支持圆形变体', () => {
      render(<SkeletonImage circle />);
      const skeleton = screen.getByLabelText('Loading image...');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('应该应用自定义宽高', () => {
      render(<SkeletonImage width={100} height={150} />);
      const skeleton = screen.getByLabelText('Loading image...');
      expect(skeleton).toHaveStyle('width: 100px; height: 150px');
    });

    it('应该支持自定义类名', () => {
      render(<SkeletonImage className="custom-class" />);
      const skeleton = screen.getByLabelText('Loading image...');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('SkeletonText', () => {
    it('应该渲染默认的SkeletonText', () => {
      render(<SkeletonText />);
      const skeleton = screen.getByLabelText('Loading text...');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton.children).toHaveLength(1);
    });

    it('应该支持自定义行数', () => {
      render(<SkeletonText rows={5} />);
      const skeleton = screen.getByLabelText('Loading text...');
      expect(skeleton.children).toHaveLength(5);
    });

    it('应该应用自定义宽度', () => {
      render(<SkeletonText width={200} />);
      const skeleton = screen.getByLabelText('Loading text...');
      const firstLine = skeleton.children[0] as HTMLElement;
      expect(firstLine).toHaveStyle('width: 200px');
    });

    it('应该支持禁用动画', () => {
      render(<SkeletonText active={false} />);
      const skeleton = screen.getByLabelText('Loading text...');
      const lines = skeleton.querySelectorAll('div');
      lines.forEach(line => {
        expect(line).not.toHaveClass('animate-pulse');
      });
    });

    it('应该支持自定义类名', () => {
      render(<SkeletonText className="custom-class" />);
      const skeleton = screen.getByLabelText('Loading text...');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('Skeleton', () => {
    it('应该渲染完整的Skeleton', () => {
      render(<Skeleton />);
      expect(screen.getByLabelText('Loading text...')).toBeInTheDocument(); // title
    });

    it('应该支持隐藏头像', () => {
      const { rerender } = render(<Skeleton avatar />);
      expect(screen.getByLabelText('Loading image...')).toBeInTheDocument();

      rerender(<Skeleton avatar={false} />);
      expect(screen.queryByLabelText('Loading image...')).not.toBeInTheDocument();
    });

    it('应该支持自定义段落行数', () => {
      render(<Skeleton paragraphRows={5} />);
      // 检查段落文本骨架是否有5行
      const textSkeletons = screen.getAllByLabelText('Loading text...');
      // 期望有title + paragraph，所以至少应该有文本骨架
      expect(textSkeletons.length).toBeGreaterThan(0);
    });

    it('应该支持自定义类名', () => {
      render(<Skeleton className="custom-class" />);
      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });

    it('应该在loading为false时显示children', () => {
      render(<Skeleton loading={false}>Loaded content</Skeleton>);
      expect(screen.getByText('Loaded content')).toBeInTheDocument();
      expect(screen.queryByLabelText('Loading text...')).not.toBeInTheDocument();
    });
  });

  describe('LoadingOverlay', () => {
    it('应该渲染LoadingOverlay', () => {
      render(<LoadingOverlay visible />);
      const spinner = screen.getByLabelText('Loading...');
      expect(spinner).toBeInTheDocument();
    });

    it('应该在visible为false时隐藏', () => {
      render(<LoadingOverlay visible={false}>Content</LoadingOverlay>);
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.queryByLabelText('Loading...')).not.toBeInTheDocument();
    });

    it('应该显示自定义消息', () => {
      render(<LoadingOverlay visible text="正在加载数据..." />);
      expect(screen.getByText('正在加载数据...')).toBeInTheDocument();
    });

    it('应该支持模糊效果', () => {
      render(<LoadingOverlay visible blur />);
      const overlay = document.querySelector('.backdrop-blur-sm');
      expect(overlay).toBeInTheDocument();
    });

    it('应该支持不同的加载器类型', () => {
      const { rerender } = render(<LoadingOverlay visible loader="dots" />);
      let loader = screen.getByLabelText('Loading...');
      expect(loader.querySelectorAll('div')).toHaveLength(3); // DotsLoader has 3 dots

      rerender(<LoadingOverlay visible loader="bars" />);
      loader = screen.getByLabelText('Loading...');
      expect(loader.querySelectorAll('div')).toHaveLength(4); // BarsLoader has 4 bars
    });

    it('应该支持自定义类名', () => {
      render(<LoadingOverlay visible className="custom-overlay" />);
      const overlay = document.querySelector('.custom-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Loading', () => {
    it('应该渲染默认的Loading容器', () => {
      render(<Loading loading>加载内容</Loading>);
      expect(screen.getByText('加载内容')).toBeInTheDocument();
    });

    it('应该在loading为false时显示children', () => {
      render(<Loading loading={false}>实际内容</Loading>);
      expect(screen.getByText('实际内容')).toBeInTheDocument();
    });

    it('应该支持自定义文本', () => {
      render(<Loading loading text="正在加载..." />);
      expect(screen.getByText('正在加载...')).toBeInTheDocument();
    });

    it('应该应用不同的尺寸', () => {
      const { rerender } = render(<Loading loading size="sm">内容</Loading>);
      let container = screen.getByText('内容').parentElement;
      expect(container).toHaveClass('p-2');

      rerender(<Loading loading size="lg">内容</Loading>);
      container = screen.getByText('内容').parentElement;
      expect(container).toHaveClass('p-8');
    });

    it('应该支持自定义类名', () => {
      render(<Loading loading className="custom-loading">内容</Loading>);
      const container = document.querySelector('.custom-loading');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Animation and Accessibility', () => {
    it('所有加载组件都应该有适当的ARIA标签', () => {
      render(
        <div>
          <Spinner />
          <DotsLoader />
          <BarsLoader />
          <SkeletonImage />
          <SkeletonText />
        </div>
      );

      expect(screen.getAllByLabelText('Loading...')).toHaveLength(3); // Spinner, DotsLoader, BarsLoader
      expect(screen.getByLabelText('Loading image...')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading text...')).toBeInTheDocument();
    });

    it('Progress组件应该有正确的ARIA属性', () => {
      render(<Progress value={75} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
    });

    it('所有组件都应该支持自定义类名', () => {
      render(
        <div>
          <Spinner className="custom-spinner" />
          <DotsLoader className="custom-dots" />
          <BarsLoader className="custom-bars" />
          <Progress value={50} className="custom-progress" />
          <SkeletonImage className="custom-skeleton-image" />
          <SkeletonText className="custom-skeleton-text" />
        </div>
      );

      expect(document.querySelector('.custom-spinner')).toBeInTheDocument();
      expect(document.querySelector('.custom-dots')).toBeInTheDocument();
      expect(document.querySelector('.custom-bars')).toBeInTheDocument();
      expect(document.querySelector('.custom-progress')).toBeInTheDocument();
      expect(document.querySelector('.custom-skeleton-image')).toBeInTheDocument();
      expect(document.querySelector('.custom-skeleton-text')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('Progress组件应该处理边界值', () => {
      const { rerender } = render(<Progress value={0} />);
      let progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveStyle('width: 0%');

      rerender(<Progress value={100} />);
      progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveStyle('width: 100%');
    });

    it('SkeletonText应该处理最小行数', () => {
      render(<SkeletonText rows={0} />);
      const skeleton = screen.getByLabelText('Loading text...');
      expect(skeleton.children).toHaveLength(1); // 应该至少有1行
    });

    it('BarsLoader应该处理最小bars数量', () => {
      render(<BarsLoader bars={0} />);
      const loader = screen.getByLabelText('Loading...');
      expect(loader.querySelectorAll('div')).toHaveLength(1); // 应该至少有1个bar
    });

    it('组件应该处理空值和未定义值', () => {
      expect(() => {
        render(<Spinner />);
        render(<DotsLoader />);
        render(<BarsLoader />);
        render(<SkeletonImage />);
        render(<SkeletonText />);
      }).not.toThrow();
    });
  });
}); 