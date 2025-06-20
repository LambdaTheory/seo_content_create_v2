/**
 * Pagination组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

// Mock回调函数
const mockCallbacks = {
  onChange: jest.fn(),
  onShowSizeChange: jest.fn()
};

describe('Pagination组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染分页组件', () => {
    render(
      <Pagination
        current={1}
        pageSize={10}
        total={100}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('显示第 1-10 条，共 100 条')).toBeInTheDocument();
    expect(screen.getByText('上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('应该显示页面大小选择器', () => {
    render(
      <Pagination
        current={1}
        pageSize={10}
        total={100}
        showSizeChanger={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('每页')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByText('条')).toBeInTheDocument();
  });

  it('应该支持页码点击', async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        current={1}
        pageSize={10}
        total={100}
        {...mockCallbacks}
      />
    );

    const page2Button = screen.getByText('2');
    await user.click(page2Button);

    expect(mockCallbacks.onChange).toHaveBeenCalledWith(2, 10);
  });

  it('应该支持上一页下一页按钮', async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        current={2}
        pageSize={10}
        total={100}
        {...mockCallbacks}
      />
    );

    // 测试上一页
    const prevButton = screen.getByText('上一页');
    await user.click(prevButton);
    expect(mockCallbacks.onChange).toHaveBeenCalledWith(1, 10);

    // 测试下一页
    const nextButton = screen.getByText('下一页');
    await user.click(nextButton);
    expect(mockCallbacks.onChange).toHaveBeenCalledWith(3, 10);
  });

  it('应该在第一页时禁用上一页按钮', () => {
    render(
      <Pagination
        current={1}
        pageSize={10}
        total={100}
        {...mockCallbacks}
      />
    );

    const prevButton = screen.getByText('上一页');
    expect(prevButton).toBeDisabled();
  });

  it('应该在最后一页时禁用下一页按钮', () => {
    render(
      <Pagination
        current={10}
        pageSize={10}
        total={100}
        {...mockCallbacks}
      />
    );

    const nextButton = screen.getByText('下一页');
    expect(nextButton).toBeDisabled();
  });

  it('应该支持页面大小变化', async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        current={2}
        pageSize={10}
        total={100}
        {...mockCallbacks}
      />
    );

    const sizeSelect = screen.getByDisplayValue('10');
    await user.selectOptions(sizeSelect, '20');

    expect(mockCallbacks.onShowSizeChange).toHaveBeenCalledWith(1, 20);
    expect(mockCallbacks.onChange).toHaveBeenCalledWith(1, 20);
  });

  it('应该显示快速跳转功能', () => {
    render(
      <Pagination
        current={1}
        pageSize={10}
        total={100}
        showQuickJumper={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('跳至')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('页码')).toBeInTheDocument();
    expect(screen.getByText('页')).toBeInTheDocument();
  });

  it('应该支持快速跳转', async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        current={1}
        pageSize={10}
        total={100}
        showQuickJumper={true}
        {...mockCallbacks}
      />
    );

    const jumpInput = screen.getByPlaceholderText('页码');
    await user.type(jumpInput, '5');
    await user.keyboard('{Enter}');

    expect(mockCallbacks.onChange).toHaveBeenCalledWith(5, 10);
  });

  it('应该正确显示省略号', () => {
    render(
      <Pagination
        current={5}
        pageSize={10}
        total={200}
        {...mockCallbacks}
      />
    );

    // 应该显示省略号
    expect(screen.getAllByText('...')).toHaveLength(2);
  });

  it('应该正确计算数据范围', () => {
    render(
      <Pagination
        current={3}
        pageSize={10}
        total={95}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('显示第 21-30 条，共 95 条')).toBeInTheDocument();
  });

  it('应该在最后一页显示正确的数据范围', () => {
    render(
      <Pagination
        current={10}
        pageSize={10}
        total={95}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('显示第 91-95 条，共 95 条')).toBeInTheDocument();
  });

  it('应该隐藏只有一页的分页', () => {
    const { container } = render(
      <Pagination
        current={1}
        pageSize={10}
        total={5}
        {...mockCallbacks}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('应该隐藏没有数据的分页', () => {
    const { container } = render(
      <Pagination
        current={1}
        pageSize={10}
        total={0}
        {...mockCallbacks}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('应该支持禁用状态', async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        current={2}
        pageSize={10}
        total={100}
        disabled={true}
        {...mockCallbacks}
      />
    );

    const page3Button = screen.getByText('3');
    await user.click(page3Button);

    // 禁用状态下不应触发回调
    expect(mockCallbacks.onChange).not.toHaveBeenCalled();
  });

  it('应该隐藏页面大小选择器', () => {
    render(
      <Pagination
        current={1}
        pageSize={10}
        total={100}
        showSizeChanger={false}
        {...mockCallbacks}
      />
    );

    expect(screen.queryByText('每页')).not.toBeInTheDocument();
  });

  it('应该隐藏总数信息', () => {
    render(
      <Pagination
        current={1}
        pageSize={10}
        total={100}
        showTotal={false}
        {...mockCallbacks}
      />
    );

    expect(screen.queryByText(/显示第.*条/)).not.toBeInTheDocument();
  });

  it('应该支持自定义页面大小选项', () => {
    render(
      <Pagination
        current={1}
        pageSize={25}
        total={100}
        pageSizeOptions={[25, 50, 75]}
        {...mockCallbacks}
      />
    );

    const sizeSelect = screen.getByDisplayValue('25');
    expect(sizeSelect).toBeInTheDocument();
    
    // 检查选项
    const options = Array.from(sizeSelect.querySelectorAll('option')).map(
      option => option.textContent
    );
    expect(options).toEqual(['25', '50', '75']);
  });

  it('应该限制快速跳转的页码范围', async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        current={1}
        pageSize={10}
        total={50}
        showQuickJumper={true}
        {...mockCallbacks}
      />
    );

    const jumpInput = screen.getByPlaceholderText('页码');
    
    // 测试超出最大页码
    await user.type(jumpInput, '10');
    await user.keyboard('{Enter}');
    
    // 应该跳转到最后一页（第5页）
    expect(mockCallbacks.onChange).toHaveBeenCalledWith(5, 10);
  });

  it('应该正确高亮当前页码', () => {
    render(
      <Pagination
        current={3}
        pageSize={10}
        total={100}
        {...mockCallbacks}
      />
    );

    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('bg-blue-600', 'text-white');
  });
}); 