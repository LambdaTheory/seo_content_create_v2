import React, { useState, useMemo, useCallback, forwardRef } from 'react';
import { ChevronUpIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { TableProps, TableColumn, TableSorter, TableFilter } from './Table.types';
import { cn, createVariants } from '@/utils/classNames';

/**
 * 表格容器样式配置
 */
const tableVariants = createVariants({
  base: [
    'w-full border-collapse',
    'bg-white dark:bg-gray-900',
  ].join(' '),
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    bordered: {
      true: 'border border-gray-200 dark:border-gray-700',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    bordered: false,
  },
});

/**
 * 表格容器样式配置
 */
const wrapperVariants = createVariants({
  base: [
    'relative overflow-auto',
    'border border-gray-200 dark:border-gray-700 rounded-lg',
  ].join(' '),
  variants: {
    loading: {
      true: 'opacity-50 pointer-events-none',
      false: '',
    },
  },
  defaultVariants: {
    loading: false,
  },
});

/**
 * 表头样式配置
 */
const headerCellVariants = createVariants({
  base: [
    'px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100',
    'bg-gray-50 dark:bg-gray-800',
    'border-b border-gray-200 dark:border-gray-700',
    'sticky top-0 z-10',
  ].join(' '),
  variants: {
    size: {
      sm: 'px-3 py-2 text-xs',
      md: 'px-4 py-3 text-sm',
      lg: 'px-5 py-4 text-base',
    },
    sortable: {
      true: 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700',
      false: '',
    },
    sorted: {
      true: 'bg-gray-100 dark:bg-gray-700',
      false: '',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    size: 'md',
    sortable: false,
    sorted: false,
    align: 'left',
  },
});

/**
 * 表格行样式配置
 */
const rowVariants = createVariants({
  base: [
    'border-b border-gray-200 dark:border-gray-700',
    'transition-colors duration-150',
  ].join(' '),
  variants: {
    hoverable: {
      true: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      false: '',
    },
    striped: {
      true: 'even:bg-gray-50/50 dark:even:bg-gray-800/50',
      false: '',
    },
    selected: {
      true: 'bg-primary-50 dark:bg-primary-900/20',
      false: '',
    },
  },
  defaultVariants: {
    hoverable: true,
    striped: false,
    selected: false,
  },
});

/**
 * 表格单元格样式配置
 */
const cellVariants = createVariants({
  base: [
    'px-4 py-3 text-gray-900 dark:text-gray-100',
  ].join(' '),
  variants: {
    size: {
      sm: 'px-3 py-2 text-xs',
      md: 'px-4 py-3 text-sm',
      lg: 'px-5 py-4 text-base',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    size: 'md',
    align: 'left',
  },
});

/**
 * 获取嵌套对象的值
 */
const getValue = (obj: any, path: string): any => {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
};

/**
 * 排序图标组件
 */
const SortIcon: React.FC<{ 
  sortOrder: 'asc' | 'desc' | null; 
  active: boolean; 
}> = ({ sortOrder, active }) => {
  if (!active) {
    return (
      <div className="flex flex-col ml-2">
        <ChevronUpIcon className="w-3 h-3 text-gray-400" />
        <ChevronDownIcon className="w-3 h-3 text-gray-400 -mt-1" />
      </div>
    );
  }

  return (
    <div className="flex flex-col ml-2">
      <ChevronUpIcon 
        className={cn(
          'w-3 h-3 -mb-1',
          sortOrder === 'asc' ? 'text-primary-600' : 'text-gray-400'
        )} 
      />
      <ChevronDownIcon 
        className={cn(
          'w-3 h-3',
          sortOrder === 'desc' ? 'text-primary-600' : 'text-gray-400'
        )} 
      />
    </div>
  );
};

/**
 * 空数据组件
 */
const TableEmpty: React.FC<{ emptyText?: React.ReactNode }> = ({ 
  emptyText = '暂无数据' 
}) => (
  <tr>
    <td 
      colSpan={999} 
      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
    >
      {emptyText}
    </td>
  </tr>
);

/**
 * Table 主组件
 * 
 * 功能特性：
 * - 固定表头支持
 * - 行悬停效果
 * - 排序功能
 * - 多种尺寸规格
 * - 斑马纹和边框
 * - 自定义列渲染
 * - 响应式设计
 * 
 * @example
 * ```tsx
 * const columns = [
 *   { key: 'name', title: '姓名', dataIndex: 'name', sortable: true },
 *   { key: 'age', title: '年龄', dataIndex: 'age', sortable: true },
 *   { key: 'email', title: '邮箱', dataIndex: 'email' },
 * ];
 * 
 * const data = [
 *   { name: '张三', age: 25, email: 'zhangsan@example.com' },
 *   { name: '李四', age: 30, email: 'lisi@example.com' },
 * ];
 * 
 * <Table 
 *   dataSource={data} 
 *   columns={columns}
 *   bordered
 *   striped
 *   hoverable
 * />
 * ```
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    {
      dataSource = [],
      columns = [],
      rowKey = 'id',
      size = 'md',
      bordered = false,
      striped = false,
      hoverable = true,
      compact = false,
      loading = false,
      emptyText,
      stickyHeader = true,
      onChange,
      onRow,
      onHeaderRow,
      className,
      wrapperClassName,
      headerClassName,
      bodyClassName,
      rowClassName,
      wrapperStyle,
      style,
      ...props
    },
    ref
  ) => {
    // 状态管理
    const [sorter, setSorter] = useState<TableSorter | null>(null);
    const [filters, setFilters] = useState<Record<string, any[]>>({});

    // 获取行key
    const getRowKey = useCallback((record: any, index: number): string => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return record[rowKey] || index.toString();
    }, [rowKey]);

    // 处理排序
    const handleSort = useCallback((columnKey: string) => {
      const column = columns.find(col => col.key === columnKey);
      if (!column?.sortable) return;

      let newOrder: 'asc' | 'desc';
      
      if (sorter?.columnKey === columnKey) {
        newOrder = sorter.order === 'asc' ? 'desc' : 'asc';
      } else {
        newOrder = 'asc';
      }

      const newSorter = { columnKey, order: newOrder };
      setSorter(newSorter);

      // 通知父组件
      onChange?.(
        { current: 1, pageSize: 10, total: dataSource.length },
        filters,
        newSorter
      );
    }, [columns, sorter, filters, dataSource.length, onChange]);

    // 处理筛选
    const handleFilter = useCallback((columnKey: string, value: any[]) => {
      const newFilters = { ...filters, [columnKey]: value };
      setFilters(newFilters);

      // 通知父组件
      onChange?.(
        { current: 1, pageSize: 10, total: dataSource.length },
        newFilters,
        sorter || { columnKey: '', order: 'asc' }
      );
    }, [filters, dataSource.length, sorter, onChange]);

    // 处理数据排序和筛选
    const processedData = useMemo(() => {
      let result = [...dataSource];

      // 筛选
      Object.entries(filters).forEach(([columnKey, filterValues]) => {
        if (filterValues && filterValues.length > 0) {
          const column = columns.find(col => col.key === columnKey);
          if (column?.onFilter) {
            result = result.filter(record => 
              filterValues.some(filterValue => 
                column.onFilter!(filterValue, record)
              )
            );
          }
        }
      });

      // 排序
      if (sorter) {
        const column = columns.find(col => col.key === sorter.columnKey);
        if (column) {
          result.sort((a, b) => {
            let aValue = column.dataIndex ? getValue(a, column.dataIndex) : a[sorter.columnKey];
            let bValue = column.dataIndex ? getValue(b, column.dataIndex) : b[sorter.columnKey];

            // 自定义排序函数
            if (typeof column.sorter === 'function') {
              const sortResult = column.sorter(a, b);
              return sorter.order === 'desc' ? -sortResult : sortResult;
            }

            // 默认排序
            if (aValue === bValue) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            const result = aValue < bValue ? -1 : 1;
            return sorter.order === 'desc' ? -result : result;
          });
        }
      }

      return result;
    }, [dataSource, columns, sorter, filters]);

    // 渲染表头
    const renderHeader = () => (
      <thead className={headerClassName}>
        <tr>
          {columns.map((column) => {
            if (column.hidden) return null;

            const isSorted = sorter?.columnKey === column.key;
            const sortOrder = isSorted ? sorter.order : null;

            return (
              <th
                key={column.key}
                className={headerCellVariants({
                  size,
                  sortable: !!column.sortable,
                  sorted: isSorted,
                  align: column.align,
                  className: cn(
                    !stickyHeader && 'static',
                    column.headerClassName
                  ),
                })}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                  ...column.headerStyle,
                }}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
                {...(onHeaderRow?.(columns, 0) || {})}
              >
                <div className="flex items-center">
                  <span className="flex-1">{column.title}</span>
                  {column.sortable && (
                    <SortIcon 
                      sortOrder={sortOrder} 
                      active={isSorted} 
                    />
                  )}
                  {column.filterable && (
                    <FunnelIcon className="w-4 h-4 ml-2 text-gray-400 hover:text-gray-600" />
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
    );

    // 渲染表体
    const renderBody = () => (
      <tbody className={bodyClassName}>
        {processedData.length === 0 || columns.length === 0 ? (
          <TableEmpty emptyText={emptyText} />
        ) : (
          processedData.map((record, index) => {
            const key = getRowKey(record, index);
            const rowProps = onRow?.(record, index) || {};
            const customRowClassName = typeof rowClassName === 'function' 
              ? rowClassName(record, index) 
              : rowClassName;

            return (
              <tr
                key={key}
                className={rowVariants({
                  hoverable,
                  striped,
                  className: customRowClassName,
                })}
                {...rowProps}
              >
                {columns.map((column) => {
                  if (column.hidden) return null;

                  const value = column.dataIndex 
                    ? getValue(record, column.dataIndex) 
                    : record[column.key];

                  const cellContent = column.render 
                    ? column.render(value, record, index)
                    : value;

                  return (
                    <td
                      key={column.key}
                      className={cellVariants({
                        size,
                        align: column.align,
                        className: column.cellClassName,
                      })}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                        ...column.cellStyle,
                      }}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })
        )}
      </tbody>
    );

    return (
      <div 
        className={wrapperVariants({
          loading,
          className: wrapperClassName,
        })}
        style={wrapperStyle}
      >
        <table
          ref={ref}
          className={tableVariants({
            size,
            bordered,
            className,
          })}
          style={style}
          {...props}
        >
          {renderHeader()}
          {renderBody()}
        </table>
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>加载中...</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

Table.displayName = 'Table';

export default Table; 