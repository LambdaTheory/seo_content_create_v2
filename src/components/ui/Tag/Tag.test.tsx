import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag, EditableTag, CategoryTag, TagGroup } from './Tag';

describe('Tag Components', () => {
  describe('Tag Component', () => {
    it('should render basic tag', () => {
      render(<Tag>Test Tag</Tag>);
      expect(screen.getByText('Test Tag')).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      
      render(<Tag clickable onClick={onClick}>Clickable Tag</Tag>);
      
      await user.click(screen.getByText('Clickable Tag'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should render closable tag', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<Tag closable onClose={onClose}>Closable Tag</Tag>);
      
      const closeButton = screen.getByLabelText('关闭标签');
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should render checked state', () => {
      render(<Tag checked>Checked Tag</Tag>);
      expect(screen.getByText('Checked Tag')).toHaveClass('bg-gray-200');
    });

    it('should render with icon', () => {
      render(<Tag icon={<span>🔥</span>}>Tag with Icon</Tag>);
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('Tag with Icon')).toBeInTheDocument();
    });

    it('should render different variants', () => {
      const { rerender } = render(<Tag variant="primary">Primary</Tag>);
      expect(screen.getByText('Primary')).toHaveClass('text-primary-700');
      
      rerender(<Tag variant="success">Success</Tag>);
      expect(screen.getByText('Success')).toHaveClass('text-green-700');
    });

    it('should render different sizes', () => {
      const { rerender } = render(<Tag size="sm">Small</Tag>);
      expect(screen.getByText('Small')).toHaveClass('text-xs');
      
      rerender(<Tag size="lg">Large</Tag>);
      expect(screen.getByText('Large')).toHaveClass('px-3');
    });
  });

  describe('EditableTag Component', () => {
    it('should render editable tag', () => {
      render(<EditableTag defaultValue="Editable" />);
      expect(screen.getByText('Editable')).toBeInTheDocument();
    });

    it('should enter edit mode on click', async () => {
      const user = userEvent.setup();
      render(<EditableTag defaultValue="Edit me" />);
      
      await user.click(screen.getByText('Edit me'));
      expect(screen.getByDisplayValue('Edit me')).toBeInTheDocument();
    });

    it('should save on blur', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();
      
      render(<EditableTag defaultValue="Test" onEdit={onEdit} />);
      
      await user.click(screen.getByText('Test'));
      const input = screen.getByDisplayValue('Test');
      
      await user.clear(input);
      await user.type(input, 'New Value');
      await user.tab();
      
      expect(onEdit).toHaveBeenCalledWith('New Value');
    });
  });

  describe('CategoryTag Component', () => {
    it('should render category tag', () => {
      render(<CategoryTag category="technology">Tech Tag</CategoryTag>);
      expect(screen.getByText('Tech Tag')).toBeInTheDocument();
    });

    it('should use default category as children', () => {
      render(<CategoryTag category="business" />);
      expect(screen.getByText('business')).toBeInTheDocument();
    });
  });

  describe('TagGroup Component', () => {
    const tags = ['Tag 1', 'Tag 2', 'Tag 3'];

    it('should render tag group', () => {
      render(<TagGroup tags={tags} />);
      
      expect(screen.getByText('Tag 1')).toBeInTheDocument();
      expect(screen.getByText('Tag 2')).toBeInTheDocument();
      expect(screen.getByText('Tag 3')).toBeInTheDocument();
    });

    it('should handle single selection', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<TagGroup tags={tags} onChange={onChange} />);
      
      await user.click(screen.getByText('Tag 1'));
      expect(onChange).toHaveBeenCalledWith('Tag 1');
    });

    it('should handle multiple selection', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<TagGroup tags={tags} multiple onChange={onChange} />);
      
      await user.click(screen.getByText('Tag 1'));
      expect(onChange).toHaveBeenCalledWith(['Tag 1']);
    });

    it('should handle max limit', () => {
      const manyTags = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4'];
      
      render(<TagGroup tags={manyTags} max={2} />);
      
      expect(screen.getByText('Tag 1')).toBeInTheDocument();
      expect(screen.getByText('Tag 2')).toBeInTheDocument();
      expect(screen.queryByText('Tag 3')).not.toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });
}); 