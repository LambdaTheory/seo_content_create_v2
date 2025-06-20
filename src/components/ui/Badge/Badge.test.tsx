import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, StatusBadge, CountBadge, NotificationBadge, BadgeGroup } from './Badge';

describe('Badge Components', () => {
  describe('Badge Component', () => {
    it('should render basic badge', () => {
      render(<Badge>Test Badge</Badge>);
      
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render different variants', () => {
      const { rerender } = render(<Badge variant="primary">Primary</Badge>);
      expect(screen.getByText('Primary')).toHaveClass('text-primary-800');
      
      rerender(<Badge variant="success">Success</Badge>);
      expect(screen.getByText('Success')).toHaveClass('text-green-800');
    });

    it('should render different sizes', () => {
      const { rerender } = render(<Badge size="sm">Small</Badge>);
      expect(screen.getByText('Small')).toHaveClass('text-xs');
      
      rerender(<Badge size="lg">Large</Badge>);
      expect(screen.getByText('Large')).toHaveClass('px-3');
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      
      render(<Badge onClick={onClick}>Clickable</Badge>);
      
      await user.click(screen.getByText('Clickable'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should render removable badge', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      
      render(<Badge removable onRemove={onRemove}>Removable</Badge>);
      
      const removeButton = screen.getByLabelText('移除标签');
      await user.click(removeButton);
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('should render dot variant', () => {
      const { container } = render(<Badge dot variant="success" />);
      
      const badge = container.firstChild;
      expect(badge).toHaveClass('w-2.5', 'h-2.5', 'rounded-full');
    });

    it('should render pill style', () => {
      render(<Badge pill>Pill Badge</Badge>);
      
      expect(screen.getByText('Pill Badge')).toHaveClass('rounded-full');
    });

    it('should render outline style', () => {
      render(<Badge outline variant="primary">Outline</Badge>);
      
      expect(screen.getByText('Outline')).toHaveClass('border-primary-300');
    });
  });

  describe('StatusBadge Component', () => {
    it('should render online status', () => {
      render(<StatusBadge status="online" />);
      
      expect(screen.getByText('在线')).toBeInTheDocument();
    });

    it('should render custom status text', () => {
      render(<StatusBadge status="online" statusText="活跃" />);
      
      expect(screen.getByText('活跃')).toBeInTheDocument();
    });

    it('should hide text when showText is false', () => {
      render(<StatusBadge status="online" showText={false}>Custom</StatusBadge>);
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.queryByText('在线')).not.toBeInTheDocument();
    });
  });

  describe('CountBadge Component', () => {
    it('should render count', () => {
      render(<CountBadge count={5} />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle overflow count', () => {
      render(<CountBadge count={150} max={99} />);
      
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should not render zero by default', () => {
      const { container } = render(<CountBadge count={0} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should render zero when showZero is true', () => {
      render(<CountBadge count={0} showZero />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('NotificationBadge Component', () => {
    it('should render notification badge', () => {
      render(
        <NotificationBadge>
          <button>Button</button>
        </NotificationBadge>
      );
      
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should not render badge when show is false', () => {
      const { container } = render(
        <NotificationBadge show={false}>
          <button>Button</button>
        </NotificationBadge>
      );
      
      expect(screen.getByText('Button')).toBeInTheDocument();
      expect(container.querySelector('.absolute')).toBeNull();
    });

    it('should render custom content', () => {
      render(
        <NotificationBadge content={<span>Custom</span>}>
          <button>Button</button>
        </NotificationBadge>
      );
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  describe('BadgeGroup Component', () => {
    it('should render badge group', () => {
      const badges = ['Tag 1', 'Tag 2', 'Tag 3'];
      
      render(<BadgeGroup badges={badges} />);
      
      expect(screen.getByText('Tag 1')).toBeInTheDocument();
      expect(screen.getByText('Tag 2')).toBeInTheDocument();
      expect(screen.getByText('Tag 3')).toBeInTheDocument();
    });

    it('should handle max limit', () => {
      const badges = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4'];
      
      render(<BadgeGroup badges={badges} max={2} />);
      
      expect(screen.getByText('Tag 1')).toBeInTheDocument();
      expect(screen.getByText('Tag 2')).toBeInTheDocument();
      expect(screen.queryByText('Tag 3')).not.toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should render badge objects', () => {
      const badges = [
        { children: 'Badge 1', variant: 'primary' as const },
        { children: 'Badge 2', variant: 'success' as const }
      ];
      
      render(<BadgeGroup badges={badges} />);
      
      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
    });
  });
}); 