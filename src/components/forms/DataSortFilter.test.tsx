/**
 * DataSortFilter组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSortFilter, SortConfig, FilterConfig } from './DataSortFilter';
import { GameData } from '@/types/GameData.types';

// 模拟数据
const mockData: GameData[] = [
  {
    gameName: 'Action Game',
    mainKeyword: 'action',
    longTailKeywords: 'action adventure',
    videoLink: 'https://youtube.com/watch?v=123',
    internalLinks: 'https://example.com/action',
    competitorPages: 'https://competitor.com/action',
    iconUrl: 'https://example.com/action.jpg',
    realUrl: 'https://game.com/action'
  },
  {
    gameName: 'Puzzle Game',
    mainKeyword: 'puzzle',
    longTailKeywords: 'puzzle solving',
    videoLink: 'https://youtube.com/watch?v=456',
    internalLinks: 'https://example.com/puzzle',
    competitorPages: 'https://competitor.com/puzzle',
    iconUrl: 'https://example.com/puzzle.jpg',
    realUrl: 'https://game.com/puzzle'
  },
  {
    gameName: 'Racing Game',
    mainKeyword: 'racing',
    longTailKeywords: 'car racing',
    videoLink: '',
    internalLinks: 'https://example.com/racing',
    competitorPages: '',
    iconUrl: 'https://example.com/racing.jpg',
    realUrl: 'https://game.com/racing'
  }
];

// 表格列配置
const mockColumns = [
  { key: 'gameName', title: '游戏名称', sortable: true, filterable: true },
  { key: 'mainKeyword', title: '主关键词', sortable: true, filterable: true },
  { key: 'videoLink', title: '视频链接', sortable: false, filterable: true },
  { key: 'realUrl', title: '游戏链接', sortable: true, filterable: false }
];

// Mock回调函数
const mockCallbacks = {
  onDataChange: jest.fn(),
  onSortChange: jest.fn(),
  onFilterChange: jest.fn()
};

describe('DataSortFilter组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染搜索框和工具栏', () => {
    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        {...mockCallbacks}
      />
    );

    expect(screen.getByPlaceholderText('搜索游戏名称、关键词...')).toBeInTheDocument();
    expect(screen.getByText('筛选')).toBeInTheDocument();
    expect(screen.getByText('显示 3 / 3 条记录')).toBeInTheDocument();
  });

  it('应该显示排序按钮', () => {
    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        {...mockCallbacks}
      />
    );

    // 检查可排序的列是否显示排序按钮
    expect(screen.getByText('游戏名称')).toBeInTheDocument();
    expect(screen.getByText('主关键词')).toBeInTheDocument();
    expect(screen.getByText('游戏链接')).toBeInTheDocument();
    
    // 不可排序的列不应显示排序按钮
    expect(screen.queryByText('视频链接')).not.toBeInTheDocument();
  });

  it('应该支持搜索功能', async () => {
    const user = userEvent.setup();
    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        {...mockCallbacks}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜索游戏名称、关键词...');
    await user.type(searchInput, 'action');

    await waitFor(() => {
      expect(mockCallbacks.onFilterChange).toHaveBeenCalled();
    });
  });

  it('应该支持排序功能', async () => {
    const user = userEvent.setup();
    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        {...mockCallbacks}
      />
    );

    const sortButton = screen.getByText('游戏名称');
    await user.click(sortButton);

    expect(mockCallbacks.onSortChange).toHaveBeenCalledWith({
      field: 'gameName',
      direction: 'asc'
    });
  });

  it('应该支持切换排序方向', async () => {
    const user = userEvent.setup();
    const initialSortConfig: SortConfig = {
      field: 'gameName',
      direction: 'asc'
    };

    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        sortConfig={initialSortConfig}
        {...mockCallbacks}
      />
    );

    const sortButton = screen.getByText('游戏名称');
    await user.click(sortButton);

    expect(mockCallbacks.onSortChange).toHaveBeenCalledWith({
      field: 'gameName',
      direction: 'desc'
    });
  });

  it('应该显示筛选条件编辑器', async () => {
    const user = userEvent.setup();
    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        {...mockCallbacks}
      />
    );

    const filterButton = screen.getByText('筛选');
    await user.click(filterButton);

    expect(screen.getByText('添加筛选条件')).toBeInTheDocument();
    expect(screen.getByDisplayValue('gameName')).toBeInTheDocument();
    expect(screen.getByDisplayValue('contains')).toBeInTheDocument();
  });

  it('应该支持添加筛选条件', async () => {
    const user = userEvent.setup();
    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        {...mockCallbacks}
      />
    );

    // 打开筛选编辑器
    const filterButton = screen.getByText('筛选');
    await user.click(filterButton);

    // 填写筛选条件
    const valueInput = screen.getByPlaceholderText('筛选值');
    await user.type(valueInput, 'action');

    // 添加筛选条件
    const addButton = screen.getByText('添加');
    await user.click(addButton);

    await waitFor(() => {
      expect(mockCallbacks.onFilterChange).toHaveBeenCalled();
    });
  });

  it('应该显示现有筛选条件', () => {
    const initialFilterConfig: FilterConfig = {
      conditions: [
        {
          field: 'gameName',
          type: 'contains',
          value: 'action',
          caseSensitive: false
        }
      ],
      operator: 'and',
      searchKeyword: '',
      searchFields: ['gameName', 'mainKeyword']
    };

    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        filterConfig={initialFilterConfig}
        {...mockCallbacks}
      />
    );

    // 检查筛选按钮是否显示条件数量
    expect(screen.getByText('筛选 (1)')).toBeInTheDocument();
  });

  it('应该支持删除筛选条件', async () => {
    const user = userEvent.setup();
    const initialFilterConfig: FilterConfig = {
      conditions: [
        {
          field: 'gameName',
          type: 'contains',
          value: 'action',
          caseSensitive: false
        }
      ],
      operator: 'and',
      searchKeyword: '',
      searchFields: ['gameName', 'mainKeyword']
    };

    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        filterConfig={initialFilterConfig}
        {...mockCallbacks}
      />
    );

    // 打开筛选编辑器
    const filterButton = screen.getByText('筛选 (1)');
    await user.click(filterButton);

    // 删除筛选条件
    const deleteButton = screen.getByText('×');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockCallbacks.onFilterChange).toHaveBeenCalled();
    });
  });

  it('应该支持清除所有筛选', async () => {
    const user = userEvent.setup();
    const initialFilterConfig: FilterConfig = {
      conditions: [
        {
          field: 'gameName',
          type: 'contains',
          value: 'action',
          caseSensitive: false
        }
      ],
      operator: 'and',
      searchKeyword: 'test',
      searchFields: ['gameName', 'mainKeyword']
    };

    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        filterConfig={initialFilterConfig}
        {...mockCallbacks}
      />
    );

    const clearButton = screen.getByText('清除筛选');
    await user.click(clearButton);

    expect(mockCallbacks.onFilterChange).toHaveBeenCalledWith({
      conditions: [],
      operator: 'and',
      searchKeyword: '',
      searchFields: ['gameName', 'mainKeyword']
    });
  });

  it('应该正确处理不同筛选类型', async () => {
    const user = userEvent.setup();
    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        {...mockCallbacks}
      />
    );

    // 打开筛选编辑器
    const filterButton = screen.getByText('筛选');
    await user.click(filterButton);

    // 选择"为空"筛选类型
    const typeSelect = screen.getByDisplayValue('contains');
    await user.selectOptions(typeSelect, 'empty');

    // 添加筛选条件（"为空"类型不需要输入值）
    const addButton = screen.getByText('添加');
    await user.click(addButton);

    await waitFor(() => {
      expect(mockCallbacks.onFilterChange).toHaveBeenCalled();
    });
  });

  it('应该支持逻辑操作符选择', async () => {
    const user = userEvent.setup();
    const initialFilterConfig: FilterConfig = {
      conditions: [
        {
          field: 'gameName',
          type: 'contains',
          value: 'action',
          caseSensitive: false
        },
        {
          field: 'mainKeyword',
          type: 'equals',
          value: 'puzzle',
          caseSensitive: false
        }
      ],
      operator: 'and',
      searchKeyword: '',
      searchFields: ['gameName', 'mainKeyword']
    };

    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        filterConfig={initialFilterConfig}
        {...mockCallbacks}
      />
    );

    // 打开筛选编辑器
    const filterButton = screen.getByText('筛选 (2)');
    await user.click(filterButton);

    // 检查逻辑操作符选择器是否显示
    expect(screen.getByText('条件关系：')).toBeInTheDocument();
    expect(screen.getByDisplayValue('and')).toBeInTheDocument();
  });

  it('应该显示正确的排序图标', () => {
    const sortConfig: SortConfig = {
      field: 'gameName',
      direction: 'asc'
    };

    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        sortConfig={sortConfig}
        {...mockCallbacks}
      />
    );

    // 检查排序图标
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('应该支持自定义初始配置', () => {
    const initialSortConfig: SortConfig = {
      field: 'mainKeyword',
      direction: 'desc'
    };

    const initialFilterConfig: FilterConfig = {
      conditions: [],
      operator: 'or',
      searchKeyword: 'test search',
      searchFields: ['gameName']
    };

    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        sortConfig={initialSortConfig}
        filterConfig={initialFilterConfig}
        {...mockCallbacks}
      />
    );

    expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
  });

  it('应该更新统计信息', () => {
    const filteredData = mockData.slice(0, 2);
    
    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        {...mockCallbacks}
      />
    );

    // 初始状态应显示所有记录
    expect(screen.getByText('显示 3 / 3 条记录')).toBeInTheDocument();
  });

  it('应该调用onDataChange回调', () => {
    render(
      <DataSortFilter
        data={mockData}
        columns={mockColumns}
        {...mockCallbacks}
      />
    );

    // 组件挂载时应该调用onDataChange
    expect(mockCallbacks.onDataChange).toHaveBeenCalled();
  });
}); 