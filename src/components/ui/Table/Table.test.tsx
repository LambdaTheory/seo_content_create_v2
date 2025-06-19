import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Table } from './Table';
import { TableColumn } from './Table.types';

// 测试数据
const mockData = [
  { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com', status: 'active' },
  { id: 2, name: '李四', age: 30, email: 'lisi@example.com', status: 'inactive' },
  { id: 3, name: '王五', age: 28, email: 'wangwu@example.com', status: 'active' },
  { id: 4, name: '赵六', age: 35, email: 'zhaoliu@example.com', status: 'pending' },
];

// 基础列配置
const basicColumns: TableColumn[] = [
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { key: 'age', title: '年龄', dataIndex: 'age' },
  { key: 'email', title: '邮箱', dataIndex: 'email' },
];

// 可排序列配置
const sortableColumns: TableColumn[] = [
  { key: 'name', title: '姓名', dataIndex: 'name', sortable: true },
  { key: 'age', title: '年龄', dataIndex: 'age', sortable: true },
  { key: 'email', title: '邮箱', dataIndex: 'email' },
];

// 自定义渲染列配置
const customColumns: TableColumn[] = [
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { 
    key: 'age', 
    title: '年龄', 
    dataIndex: 'age',
    render: (value) => `${value}岁`
  },
  {
    key: 'status',
    title: '状态',
    dataIndex: 'status',
    render: (value) => (
      <span className={`px-2 py-1 rounded ${
        value === 'active' ? 'bg-green-100 text-green-800' :
        value === 'inactive' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {value === 'active' ? '激活' : value === 'inactive' ? '未激活' : '待定'}
      </span>
    )
  },
];

describe('Table Component', () => {
  // 基础渲染测试
  describe('基础渲染', () => {
    it('应该正确渲染表格', () => {
      render(<Table dataSource={mockData} columns={basicColumns} />);
      
      // 检查表格是否存在
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // 检查表头
      expect(screen.getByText('姓名')).toBeInTheDocument();
      expect(screen.getByText('年龄')).toBeInTheDocument();
      expect(screen.getByText('邮箱')).toBeInTheDocument();
      
      // 检查数据行
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
    });

    it('应该渲染所有数据行', () => {
      render(<Table dataSource={mockData} columns={basicColumns} />);
      
      mockData.forEach(item => {
        expect(screen.getByText(item.name)).toBeInTheDocument();
        expect(screen.getByText(item.age.toString())).toBeInTheDocument();
        expect(screen.getByText(item.email)).toBeInTheDocument();
      });
    });

    it('应该显示空数据状态', () => {
      render(<Table dataSource={[]} columns={basicColumns} />);
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('应该显示自定义空数据文本', () => {
      render(
        <Table 
          dataSource={[]} 
          columns={basicColumns} 
          emptyText="没有找到数据"
        />
      );
      expect(screen.getByText('没有找到数据')).toBeInTheDocument();
    });
  });

  // 尺寸变体测试
  describe('尺寸变体', () => {
    it('应该应用小尺寸样式', () => {
      render(<Table dataSource={mockData} columns={basicColumns} size="sm" />);
      const table = screen.getByRole('table');
      expect(table).toHaveClass('text-sm');
    });

    it('应该应用中等尺寸样式', () => {
      render(<Table dataSource={mockData} columns={basicColumns} size="md" />);
      const table = screen.getByRole('table');
      expect(table).toHaveClass('text-base');
    });

    it('应该应用大尺寸样式', () => {
      render(<Table dataSource={mockData} columns={basicColumns} size="lg" />);
      const table = screen.getByRole('table');
      expect(table).toHaveClass('text-lg');
    });
  });

  // 样式配置测试
  describe('样式配置', () => {
    it('应该应用边框样式', () => {
      render(<Table dataSource={mockData} columns={basicColumns} bordered />);
      const table = screen.getByRole('table');
      expect(table).toHaveClass('border');
    });

    it('应该应用悬停效果', () => {
      render(<Table dataSource={mockData} columns={basicColumns} hoverable />);
      const rows = screen.getAllByRole('row');
      // 跳过表头行，检查数据行
      expect(rows[1]).toHaveClass('hover:bg-gray-50');
    });

    it('应该应用斑马纹样式', () => {
      render(<Table dataSource={mockData} columns={basicColumns} striped />);
      const rows = screen.getAllByRole('row');
      // 检查偶数行有斑马纹样式
      expect(rows[2]).toHaveClass('even:bg-gray-50/50');
    });
  });

  // 排序功能测试
  describe('排序功能', () => {
    it('应该显示排序图标', () => {
      render(<Table dataSource={mockData} columns={sortableColumns} />);
      
      // 检查可排序列有排序图标
      const nameHeader = screen.getByText('姓名').closest('th');
      expect(nameHeader).toHaveClass('cursor-pointer');
    });

    it('应该处理排序点击', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <Table 
          dataSource={mockData} 
          columns={sortableColumns} 
          onChange={handleChange}
        />
      );
      
      const nameHeader = screen.getByText('姓名').closest('th');
      await user.click(nameHeader!);
      
      expect(handleChange).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        { columnKey: 'name', order: 'asc' }
      );
    });

    it('应该切换排序方向', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <Table 
          dataSource={mockData} 
          columns={sortableColumns} 
          onChange={handleChange}
        />
      );
      
      const nameHeader = screen.getByText('姓名').closest('th');
      
      // 第一次点击：升序
      await user.click(nameHeader!);
      expect(handleChange).toHaveBeenLastCalledWith(
        expect.any(Object),
        expect.any(Object),
        { columnKey: 'name', order: 'asc' }
      );
      
      // 第二次点击：降序
      await user.click(nameHeader!);
      expect(handleChange).toHaveBeenLastCalledWith(
        expect.any(Object),
        expect.any(Object),
        { columnKey: 'name', order: 'desc' }
      );
    });
  });

  // 自定义渲染测试
  describe('自定义渲染', () => {
    it('应该渲染自定义内容', () => {
      render(<Table dataSource={mockData} columns={customColumns} />);
      
      // 检查自定义渲染的年龄
      expect(screen.getByText('25岁')).toBeInTheDocument();
      expect(screen.getByText('30岁')).toBeInTheDocument();
      
      // 检查自定义渲染的状态
      expect(screen.getAllByText('激活')).toHaveLength(2); // 有两个active状态
      expect(screen.getByText('未激活')).toBeInTheDocument();
      expect(screen.getByText('待定')).toBeInTheDocument();
    });

    it('应该应用自定义样式类', () => {
      const columnsWithClass: TableColumn[] = [
        { 
          key: 'name', 
          title: '姓名', 
          dataIndex: 'name',
          cellClassName: 'custom-cell-class'
        },
      ];
      
      render(<Table dataSource={[mockData[0]]} columns={columnsWithClass} />);
      
      const cell = screen.getByText('张三').closest('td');
      expect(cell).toHaveClass('custom-cell-class');
    });
  });

  // 行交互测试
  describe('行交互', () => {
    it('应该处理行点击事件', async () => {
      const user = userEvent.setup();
      const handleRowClick = jest.fn();
      
      const onRow = (record: any) => ({
        onClick: () => handleRowClick(record),
      });
      
      render(
        <Table 
          dataSource={mockData} 
          columns={basicColumns} 
          onRow={onRow}
        />
      );
      
      const firstDataRow = screen.getAllByRole('row')[1];
      await user.click(firstDataRow);
      
      expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('应该处理行双击事件', async () => {
      const user = userEvent.setup();
      const handleRowDoubleClick = jest.fn();
      
      const onRow = (record: any) => ({
        onDoubleClick: () => handleRowDoubleClick(record),
      });
      
      render(
        <Table 
          dataSource={mockData} 
          columns={basicColumns} 
          onRow={onRow}
        />
      );
      
      const firstDataRow = screen.getAllByRole('row')[1];
      await user.dblClick(firstDataRow);
      
      expect(handleRowDoubleClick).toHaveBeenCalledWith(mockData[0]);
    });
  });

  // 加载状态测试
  describe('加载状态', () => {
    it('应该显示加载状态', () => {
      render(<Table dataSource={mockData} columns={basicColumns} loading />);
      
      expect(screen.getByText('加载中...')).toBeInTheDocument();
      
      // 检查最外层容器有加载样式
      const tableWrapper = screen.getByRole('table').closest('div');
      expect(tableWrapper).toHaveClass('opacity-50', 'pointer-events-none');
    });

    it('加载时应该禁用交互', () => {
      render(
        <Table 
          dataSource={mockData} 
          columns={sortableColumns} 
          loading 
        />
      );
      
      const tableWrapper = screen.getByRole('table').closest('div');
      expect(tableWrapper).toHaveClass('opacity-50', 'pointer-events-none');
    });
  });

  // 列配置测试
  describe('列配置', () => {
    it('应该隐藏指定的列', () => {
      const columnsWithHidden: TableColumn[] = [
        { key: 'name', title: '姓名', dataIndex: 'name' },
        { key: 'age', title: '年龄', dataIndex: 'age', hidden: true },
        { key: 'email', title: '邮箱', dataIndex: 'email' },
      ];
      
      render(<Table dataSource={mockData} columns={columnsWithHidden} />);
      
      expect(screen.getByText('姓名')).toBeInTheDocument();
      expect(screen.queryByText('年龄')).not.toBeInTheDocument();
      expect(screen.getByText('邮箱')).toBeInTheDocument();
    });

    it('应该应用列对齐方式', () => {
      const columnsWithAlign: TableColumn[] = [
        { key: 'name', title: '姓名', dataIndex: 'name', align: 'left' },
        { key: 'age', title: '年龄', dataIndex: 'age', align: 'center' },
        { key: 'email', title: '邮箱', dataIndex: 'email', align: 'right' },
      ];
      
      render(<Table dataSource={[mockData[0]]} columns={columnsWithAlign} />);
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveClass('text-left');
      expect(headers[1]).toHaveClass('text-center');
      expect(headers[2]).toHaveClass('text-right');
    });

    it('应该设置列宽度', () => {
      const columnsWithWidth: TableColumn[] = [
        { key: 'name', title: '姓名', dataIndex: 'name', width: 100 },
        { key: 'age', title: '年龄', dataIndex: 'age', width: '20%' },
      ];
      
      render(<Table dataSource={[mockData[0]]} columns={columnsWithWidth} />);
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveStyle({ width: '100px' });
      expect(headers[1]).toHaveStyle({ width: '20%' });
    });
  });

  // 数据索引测试
  describe('数据索引', () => {
    it('应该支持嵌套数据索引', () => {
      const nestedData = [
        { 
          id: 1, 
          user: { name: '张三', profile: { age: 25 } },
          contact: { email: 'zhangsan@example.com' }
        },
      ];
      
      const nestedColumns: TableColumn[] = [
        { key: 'name', title: '姓名', dataIndex: 'user.name' },
        { key: 'age', title: '年龄', dataIndex: 'user.profile.age' },
        { key: 'email', title: '邮箱', dataIndex: 'contact.email' },
      ];
      
      render(<Table dataSource={nestedData} columns={nestedColumns} />);
      
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
    });

    it('应该处理缺失的嵌套数据', () => {
      const incompleteData = [
        { id: 1, user: { name: '张三' } }, // 缺少 profile.age
      ];
      
      const nestedColumns: TableColumn[] = [
        { key: 'name', title: '姓名', dataIndex: 'user.name' },
        { key: 'age', title: '年龄', dataIndex: 'user.profile.age' },
      ];
      
      render(<Table dataSource={incompleteData} columns={nestedColumns} />);
      
      expect(screen.getByText('张三')).toBeInTheDocument();
      // 缺失的数据应该显示为空
      const cells = screen.getAllByRole('cell');
      expect(cells[1]).toBeEmptyDOMElement();
    });
  });

  // 自定义rowKey测试
  describe('自定义rowKey', () => {
    it('应该使用字符串rowKey', () => {
      render(
        <Table 
          dataSource={mockData} 
          columns={basicColumns} 
          rowKey="email"
        />
      );
      
      const rows = screen.getAllByRole('row');
      // 检查是否正确渲染（无报错即可）
      expect(rows.length).toBe(mockData.length + 1); // +1 for header
    });

    it('应该使用函数rowKey', () => {
      const getRowKey = (record: any) => `user-${record.id}`;
      
      render(
        <Table 
          dataSource={mockData} 
          columns={basicColumns} 
          rowKey={getRowKey}
        />
      );
      
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(mockData.length + 1); // +1 for header
    });
  });

  // 固定表头测试
  describe('固定表头', () => {
    it('应该默认启用固定表头', () => {
      render(<Table dataSource={mockData} columns={basicColumns} />);
      
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveClass('sticky', 'top-0');
      });
    });

    it('应该可以禁用固定表头', () => {
      render(
        <Table 
          dataSource={mockData} 
          columns={basicColumns} 
          stickyHeader={false}
        />
      );
      
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveClass('static');
      });
    });
  });

  // 边界情况测试
  describe('边界情况', () => {
    it('应该处理空列配置', () => {
      render(<Table dataSource={mockData} columns={[]} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // 应该显示空数据（空列配置会导致表格无法渲染列，所以显示空状态）
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('应该处理undefined数据', () => {
      const dataWithUndefined = [
        { id: 1, name: undefined, age: 25, email: null },
      ];
      
      render(<Table dataSource={dataWithUndefined} columns={basicColumns} />);
      
      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('应该处理空字符串数据', () => {
      const dataWithEmpty = [
        { id: 1, name: '', age: 0, email: '' },
      ];
      
      render(<Table dataSource={dataWithEmpty} columns={basicColumns} />);
      
      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('应该处理大量数据', () => {
      const largeData = Array.from({ length: 1000 }, (_, index) => ({
        id: index + 1,
        name: `用户${index + 1}`,
        age: 20 + (index % 30),
        email: `user${index + 1}@example.com`,
      }));
      
      render(<Table dataSource={largeData} columns={basicColumns} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // 应该渲染所有行
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(1001); // +1 for header
    });
  });
}); 