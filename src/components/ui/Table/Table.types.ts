import { ReactNode, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/**
 * 表格列定义
 */
export interface TableColumn<T = any> {
  /** 列的唯一标识 */
  key: string;
  /** 列标题 */
  title: ReactNode;
  /** 数据索引，支持嵌套路径如 'user.name' */
  dataIndex?: string;
  /** 列宽度 */
  width?: number | string;
  /** 最小列宽 */
  minWidth?: number;
  /** 最大列宽 */
  maxWidth?: number;
  /** 是否固定列 */
  fixed?: 'left' | 'right' | boolean;
  /** 列对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否可排序 */
  sortable?: boolean;
  /** 自定义排序函数 */
  sorter?: boolean | ((a: T, b: T) => number);
  /** 是否可筛选 */
  filterable?: boolean;
  /** 筛选选项 */
  filters?: Array<{ text: string; value: any }>;
  /** 自定义筛选函数 */
  onFilter?: (value: any, record: T) => boolean;
  /** 自定义渲染函数 */
  render?: (value: any, record: T, index: number) => ReactNode;
  /** 是否可编辑 */
  editable?: boolean;
  /** 编辑类型 */
  editType?: 'input' | 'select' | 'custom';
  /** 编辑选项 */
  editOptions?: Array<{ label: string; value: any }>;
  /** 编辑验证规则 */
  editRules?: Array<{
    required?: boolean;
    pattern?: RegExp;
    message?: string;
    validator?: (value: any) => boolean | string;
  }>;
  /** 列是否可调整大小 */
  resizable?: boolean;
  /** 列是否隐藏 */
  hidden?: boolean;
  /** 表头自定义样式类名 */
  headerClassName?: string;
  /** 单元格自定义样式类名 */
  cellClassName?: string;
  /** 表头自定义样式 */
  headerStyle?: React.CSSProperties;
  /** 单元格自定义样式 */
  cellStyle?: React.CSSProperties;
}

/**
 * 排序配置
 */
export interface TableSorter {
  /** 排序列的key */
  columnKey: string;
  /** 排序方向 */
  order: 'asc' | 'desc';
}

/**
 * 筛选配置
 */
export interface TableFilter {
  /** 筛选列的key */
  columnKey: string;
  /** 筛选值 */
  value: any[];
}

/**
 * 分页配置
 */
export interface TablePagination {
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 是否显示页面大小选择器 */
  showSizeChanger?: boolean;
  /** 页面大小选项 */
  pageSizeOptions?: string[];
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
  /** 是否显示总数 */
  showTotal?: boolean | ((total: number, range: [number, number]) => ReactNode);
  /** 页码改变回调 */
  onChange?: (page: number, pageSize: number) => void;
  /** 页面大小改变回调 */
  onShowSizeChange?: (current: number, size: number) => void;
}

/**
 * 行选择配置
 */
export interface TableRowSelection<T = any> {
  /** 选择类型 */
  type?: 'checkbox' | 'radio';
  /** 已选择的行key数组 */
  selectedRowKeys?: React.Key[];
  /** 选择变化回调 */
  onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
  /** 全选/取消全选回调 */
  onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  /** 单行选择回调 */
  onSelect?: (record: T, selected: boolean, selectedRows: T[], nativeEvent: Event) => void;
  /** 自定义选择列表头 */
  columnTitle?: ReactNode;
  /** 自定义选择列宽度 */
  columnWidth?: number | string;
  /** 是否固定选择列 */
  fixed?: boolean;
  /** 是否禁用某行选择 */
  getCheckboxProps?: (record: T) => { disabled?: boolean; name?: string };
  /** 是否保留选择项在数据更新后 */
  preserveSelectedRowKeys?: boolean;
  /** 选择列是否隐藏 */
  hideSelectAll?: boolean;
}

/**
 * 虚拟滚动配置
 */
export interface TableVirtualScroll {
  /** 是否启用虚拟滚动 */
  enabled: boolean;
  /** 每行高度 */
  itemHeight: number;
  /** 缓冲区大小 */
  buffer?: number;
  /** 容器高度 */
  height: number;
}

/**
 * 表格主要属性
 */
export interface TableProps<T = any> extends Omit<HTMLAttributes<HTMLTableElement>, 'onChange'> {
  /** 数据源 */
  dataSource: T[];
  /** 列定义 */
  columns: TableColumn<T>[];
  /** 行key的取值字段 */
  rowKey?: string | ((record: T) => string);
  /** 表格大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否有边框 */
  bordered?: boolean;
  /** 是否斑马纹 */
  striped?: boolean;
  /** 是否悬停高亮 */
  hoverable?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 空数据提示 */
  emptyText?: ReactNode;
  /** 表格滚动配置 */
  scroll?: {
    x?: number | string | true;
    y?: number | string;
    scrollToFirstRowOnChange?: boolean;
  };
  /** 固定表头 */
  stickyHeader?: boolean;
  /** 分页配置 */
  pagination?: TablePagination | false;
  /** 行选择配置 */
  rowSelection?: TableRowSelection<T>;
  /** 虚拟滚动配置 */
  virtualScroll?: TableVirtualScroll;
  
  /** 排序变化回调 */
  onChange?: (
    pagination: TablePagination,
    filters: Record<string, any[]>,
    sorter: TableSorter | TableSorter[]
  ) => void;
  /** 行点击事件 */
  onRow?: (record: T, index: number) => {
    onClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void;
    onDoubleClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLTableRowElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLTableRowElement>) => void;
    [key: string]: any;
  };
  /** 表头行事件 */
  onHeaderRow?: (columns: TableColumn<T>[], index: number) => {
    onClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void;
    [key: string]: any;
  };
  /** 单元格编辑保存回调 */
  onCellEdit?: (record: T, columnKey: string, value: any) => void;
  /** 列宽度变化回调 */
  onColumnResize?: (columnKey: string, width: number) => void;
  
  /** 表格容器自定义样式类名 */
  wrapperClassName?: string;
  /** 表头自定义样式类名 */
  headerClassName?: string;
  /** 表体自定义样式类名 */
  bodyClassName?: string;
  /** 行自定义样式类名 */
  rowClassName?: string | ((record: T, index: number) => string);
  /** 表格容器自定义样式 */
  wrapperStyle?: React.CSSProperties;
  /** 表格自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 表头属性
 */
export interface TableHeaderProps<T = any> extends ThHTMLAttributes<HTMLTableCellElement> {
  /** 列定义 */
  column: TableColumn<T>;
  /** 是否可排序 */
  sortable?: boolean;
  /** 当前排序状态 */
  sortOrder?: 'asc' | 'desc' | null;
  /** 排序点击回调 */
  onSort?: (columnKey: string, order: 'asc' | 'desc') => void;
  /** 是否可筛选 */
  filterable?: boolean;
  /** 当前筛选值 */
  filterValue?: any[];
  /** 筛选变化回调 */
  onFilter?: (columnKey: string, value: any[]) => void;
  /** 是否可调整大小 */
  resizable?: boolean;
  /** 调整大小回调 */
  onResize?: (columnKey: string, width: number) => void;
}

/**
 * 表格单元格属性
 */
export interface TableCellProps<T = any> extends TdHTMLAttributes<HTMLTableCellElement> {
  /** 列定义 */
  column: TableColumn<T>;
  /** 行数据 */
  record: T;
  /** 行索引 */
  rowIndex: number;
  /** 单元格值 */
  value: any;
  /** 是否编辑模式 */
  editing?: boolean;
  /** 编辑变化回调 */
  onEdit?: (value: any) => void;
  /** 编辑完成回调 */
  onEditComplete?: (value: any) => void;
  /** 编辑取消回调 */
  onEditCancel?: () => void;
}

/**
 * 表格行属性
 */
export interface TableRowProps<T = any> extends Omit<HTMLAttributes<HTMLTableRowElement>, 'onSelect'> {
  /** 行数据 */
  record: T;
  /** 行索引 */
  index: number;
  /** 列定义 */
  columns: TableColumn<T>[];
  /** 是否选中 */
  selected?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 选择变化回调 */
  onSelect?: (selected: boolean) => void;
  /** 行事件配置 */
  onRow?: (record: T, index: number) => Record<string, any>;
}

/**
 * 分页组件属性
 */
export interface TablePaginationProps {
  /** 分页配置 */
  pagination: TablePagination;
  /** 页码变化回调 */
  onChange?: (page: number, pageSize: number) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 空数据组件属性
 */
export interface TableEmptyProps {
  /** 空数据文本 */
  emptyText?: ReactNode;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 表格筛选器属性
 */
export interface TableFilterProps {
  /** 筛选选项 */
  filters: Array<{ text: string; value: any }>;
  /** 当前筛选值 */
  value?: any[];
  /** 筛选变化回调 */
  onChange?: (value: any[]) => void;
  /** 是否多选 */
  multiple?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 列调整器属性
 */
export interface TableResizerProps {
  /** 列key */
  columnKey: string;
  /** 调整回调 */
  onResize: (columnKey: string, width: number) => void;
  /** 自定义样式类名 */
  className?: string;
} 