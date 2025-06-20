/**
 * EditableTable组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableTable } from './EditableTable';
import { GameData } from '@/types/GameData.types';

// 模拟数据
const mockData: GameData[] = [
  {
    gameName: 'Test Game 1',
    mainKeyword: 'test game',
    longTailKeywords: 'online test game',
    videoLink: 'https://youtube.com/watch?v=123',
    internalLinks: 'https://example.com/game1',
    competitorPages: 'https://competitor.com/game1',
    iconUrl: 'https://example.com/icon1.jpg',
    realUrl: 'https://game.com/game1'
  },
  {
    gameName: 'Test Game 2',
    mainKeyword: 'second game',
    longTailKeywords: 'online second game',
    videoLink: 'https://youtube.com/watch?v=456',
    internalLinks: 'https://example.com/game2',
    competitorPages: 'https://competitor.com/game2',
    iconUrl: 'https://example.com/icon2.jpg',
    realUrl: 'https://game.com/game2'
  }
];

// 表格列配置
const mockColumns = [
  { key: 'gameName', title: '游戏名称', width: 200 },
  { key: 'mainKeyword', title: '主关键词', width: 150 },
  { key: 'realUrl', title: '游戏链接', width: 250 }
];

// 编辑规则配置
const mockEditRule = {
  fields: {
    gameName: {
      type: 'text' as const,
      validate: (value: string) => !value ? '游戏名称不能为空' : null
    },
    mainKeyword: {
      type: 'text' as const,
      validate: (value: string) => !value ? '主关键词不能为空' : null
    },
    realUrl: {
      type: 'text' as const,
      validate: (value: string) => {
        if (!value) return '游戏链接不能为空';
        if (!value.startsWith('http')) return '游戏链接格式不正确';
        return null;
      }
    }
  },
  allowAdd: true,
  allowDelete: true,
  allowCopy: true
};

// Mock回调函数
const mockCallbacks = {
  onDataChange: jest.fn(),
  onRowSave: jest.fn(),
  onRowDelete: jest.fn(),
  onRowAdd: jest.fn()
};

describe('EditableTable组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染表格数据', () => {
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    // 检查表格是否渲染
    expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    expect(screen.getByText('Test Game 2')).toBeInTheDocument();
    expect(screen.getByText('test game')).toBeInTheDocument();
    expect(screen.getByText('second game')).toBeInTheDocument();
  });

  it('应该显示行号', () => {
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        showRowNumber={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('应该显示编辑按钮', () => {
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    const editButtons = screen.getAllByText('编辑');
    expect(editButtons).toHaveLength(2);
  });

  it('应该进入编辑模式', async () => {
    const user = userEvent.setup();
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    const editButton = screen.getAllByText('编辑')[0];
    await user.click(editButton);

    // 检查是否显示保存和取消按钮
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();

    // 检查是否显示输入框
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('应该支持编辑字段值', async () => {
    const user = userEvent.setup();
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    // 进入编辑模式
    const editButton = screen.getAllByText('编辑')[0];
    await user.click(editButton);

    // 找到游戏名称输入框并修改
    const nameInput = screen.getByDisplayValue('Test Game 1');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified Game Name');

    expect(nameInput).toHaveValue('Modified Game Name');
  });

  it('应该支持保存编辑', async () => {
    const user = userEvent.setup();
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    // 进入编辑模式
    const editButton = screen.getAllByText('编辑')[0];
    await user.click(editButton);

    // 修改字段值
    const nameInput = screen.getByDisplayValue('Test Game 1');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified Game Name');

    // 保存编辑
    const saveButton = screen.getByText('保存');
    await user.click(saveButton);

    // 检查回调函数是否被调用
    await waitFor(() => {
      expect(mockCallbacks.onDataChange).toHaveBeenCalled();
      expect(mockCallbacks.onRowSave).toHaveBeenCalled();
    });
  });

  it('应该支持取消编辑', async () => {
    const user = userEvent.setup();
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    // 进入编辑模式
    const editButton = screen.getAllByText('编辑')[0];
    await user.click(editButton);

    // 修改字段值
    const nameInput = screen.getByDisplayValue('Test Game 1');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified Game Name');

    // 取消编辑
    const cancelButton = screen.getByText('取消');
    await user.click(cancelButton);

    // 检查是否恢复原始值
    expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    expect(screen.queryByText('Modified Game Name')).not.toBeInTheDocument();
  });

  it('应该显示验证错误', async () => {
    const user = userEvent.setup();
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    // 进入编辑模式
    const editButton = screen.getAllByText('编辑')[0];
    await user.click(editButton);

    // 清空必填字段
    const nameInput = screen.getByDisplayValue('Test Game 1');
    await user.clear(nameInput);

    // 尝试保存
    const saveButton = screen.getByText('保存');
    await user.click(saveButton);

    // 检查是否显示验证错误
    await waitFor(() => {
      expect(screen.getByText('游戏名称不能为空')).toBeInTheDocument();
    });
  });

  it('应该支持删除行', async () => {
    const user = userEvent.setup();
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    const deleteButton = screen.getAllByText('删除')[0];
    await user.click(deleteButton);

    expect(mockCallbacks.onDataChange).toHaveBeenCalled();
    expect(mockCallbacks.onRowDelete).toHaveBeenCalled();
  });

  it('应该支持复制行', async () => {
    const user = userEvent.setup();
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    const copyButton = screen.getAllByText('复制')[0];
    await user.click(copyButton);

    expect(mockCallbacks.onDataChange).toHaveBeenCalled();
  });

  it('应该支持添加新行', async () => {
    const user = userEvent.setup();
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    const addButton = screen.getByText('添加新行');
    await user.click(addButton);

    expect(mockCallbacks.onDataChange).toHaveBeenCalled();
    expect(mockCallbacks.onRowAdd).toHaveBeenCalled();
  });

  it('应该显示统计信息', () => {
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('共 2 条记录')).toBeInTheDocument();
  });

  it('应该支持不同的编辑器类型', async () => {
    const user = userEvent.setup();
    const editRuleWithSelect = {
      ...mockEditRule,
      fields: {
        ...mockEditRule.fields,
        category: {
          type: 'select' as const,
          options: [
            { value: 'action', label: '动作' },
            { value: 'puzzle', label: '益智' }
          ]
        }
      }
    };

    const columnsWithSelect = [
      ...mockColumns,
      { key: 'category', title: '分类', width: 100 }
    ];

    const dataWithCategory = mockData.map(item => ({
      ...item,
      category: 'action'
    }));

    render(
      <EditableTable
        data={dataWithCategory}
        columns={columnsWithSelect}
        editRule={editRuleWithSelect}
        {...mockCallbacks}
      />
    );

    // 进入编辑模式
    const editButton = screen.getAllByText('编辑')[0];
    await user.click(editButton);

    // 检查是否显示选择框
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('应该支持自定义渲染函数', () => {
    const columnsWithCustomRender = [
      {
        key: 'gameName',
        title: '游戏名称',
        width: 200,
        render: (value: string) => <span data-testid="custom-render">{value}</span>
      }
    ];

    render(
      <EditableTable
        data={mockData}
        columns={columnsWithCustomRender}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    expect(screen.getAllByTestId('custom-render')).toHaveLength(2);
  });

  it('应该在编辑时显示正在编辑的统计信息', async () => {
    const user = userEvent.setup();
    render(
      <EditableTable
        data={mockData}
        columns={mockColumns}
        editRule={mockEditRule}
        {...mockCallbacks}
      />
    );

    // 进入编辑模式
    const editButton = screen.getAllByText('编辑')[0];
    await user.click(editButton);

    expect(screen.getByText('正在编辑 1 行')).toBeInTheDocument();
  });
}); 