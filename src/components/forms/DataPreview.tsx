/**
 * CSV数据预览和编辑组件
 * 
 * 功能特性：
 * - 表格内联编辑
 * - 行级操作功能
 * - 数据排序筛选
 * - 分页功能
 * - 数据导出功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CSVService } from '@/services/csvService';
import { GameData } from '@/types/GameData.types';
import { CSVExportConfig } from '@/types/CSV.types';
import { cn } from '@/utils/classNames';

/**
 * 数据预览组件属性
 */
export interface DataPreviewProps {
  /** 数据 */
  data: GameData[];
  /** 字段配置 */
  fields: Array<{
    key: keyof GameData;
    title: string;
    editable?: boolean;
    type?: 'text' | 'url' | 'number' | 'select';
    options?: string[];
  }>;
  /** 数据变更回调 */
  onDataChange?: (data: GameData[]) => void;
  /** 行删除回调 */
  onRowDelete?: (index: number) => void;
  /** 数据导出回调 */
  onExport?: (config: CSVExportConfig) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 预览状态
 */
interface PreviewState {
  /** 编辑中的单元格 */
  editingCell: { row: number; field: keyof GameData } | null;
  /** 编辑值 */
  editingValue: string;
  /** 搜索关键词 */
  searchKeyword: string;
  /** 排序配置 */
  sortConfig: { field: keyof GameData; direction: 'asc' | 'desc' } | null;
  /** 选中的行 */
  selectedRows: Set<number>;
  /** 是否显示导出对话框 */
  showExportDialog: boolean;
  /** 分页配置 */
  pagination: {
    current: number;
    pageSize: number;
  };
}

/**
 * 数据预览组件
 */
export const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  fields,
  onDataChange,
  onRowDelete,
  onExport,
  className
}) => {
  // 状态管理
  const [state, setState] = useState<PreviewState>({
    editingCell: null,
    editingValue: '',
    searchKeyword: '',
    sortConfig: null,
    selectedRows: new Set(),
    showExportDialog: false,
    pagination: {
      current: 1,
      pageSize: 20
    }
  });

  // CSV服务实例
  const csvService = new CSVService();

  // 过滤和排序数据
  const processedData = useMemo(() => {
    let result = [...data];

    // 搜索过滤
    if (state.searchKeyword) {
      const keyword = state.searchKeyword.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(keyword)
        )
      );
    }

    // 排序
    if (state.sortConfig) {
      const { field, direction } = state.sortConfig;
      result.sort((a, b) => {
        const aValue = String(a[field] || '');
        const bValue = String(b[field] || '');
        const comparison = aValue.localeCompare(bValue);
        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, state.searchKeyword, state.sortConfig]);

  // 开始编辑单元格
  const startEditCell = useCallback((row: number, field: keyof GameData) => {
    const fieldConfig = fields.find(f => f.key === field);
    if (!fieldConfig?.editable) return;

    setState(prev => ({
      ...prev,
      editingCell: { row, field },
      editingValue: String(data[row][field] || '')
    }));
  }, [data, fields]);

  // 保存编辑
  const saveEdit = useCallback(() => {
    if (!state.editingCell) return;

    const { row, field } = state.editingCell;
    const newData = [...data];
    
    // 类型转换
    let value: any = state.editingValue;
    const fieldConfig = fields.find(f => f.key === field);
    
    if (fieldConfig?.type === 'number') {
      value = parseFloat(value) || 0;
    }

    newData[row] = {
      ...newData[row],
      [field]: value
    };

    onDataChange?.(newData);
    cancelEdit();
  }, [state.editingCell, state.editingValue, data, fields, onDataChange]);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setState(prev => ({
      ...prev,
      editingCell: null,
      editingValue: ''
    }));
  }, []);

  // 删除行
  const deleteRow = useCallback((index: number) => {
    if (confirm('确定要删除这行数据吗？')) {
      const newData = data.filter((_, i) => i !== index);
      onDataChange?.(newData);
      onRowDelete?.(index);
    }
  }, [data, onDataChange, onRowDelete]);

  // 批量删除
  const batchDelete = useCallback(() => {
    if (state.selectedRows.size === 0) return;
    
    if (confirm(`确定要删除选中的 ${state.selectedRows.size} 行数据吗？`)) {
      const newData = data.filter((_, index) => !state.selectedRows.has(index));
      onDataChange?.(newData);
      setState(prev => ({ ...prev, selectedRows: new Set() }));
    }
  }, [data, state.selectedRows, onDataChange]);

  // 排序处理
  const handleSort = useCallback((field: keyof GameData) => {
    setState(prev => {
      const currentSort = prev.sortConfig;
      let newSort: typeof currentSort = { field, direction: 'asc' };

      if (currentSort?.field === field) {
        if (currentSort.direction === 'asc') {
          newSort.direction = 'desc';
        } else {
          newSort = null; // 取消排序
        }
      }

      return { ...prev, sortConfig: newSort };
    });
  }, []);

  // 导出数据
  const exportData = useCallback((config: CSVExportConfig) => {
    const exportData = state.selectedRows.size > 0
      ? data.filter((_, index) => state.selectedRows.has(index))
      : processedData;

    if (onExport) {
      onExport({ ...config, data: exportData });
    } else {
      // 默认导出行为
      csvService.downloadCSV(exportData, config);
    }

    setState(prev => ({ ...prev, showExportDialog: false }));
  }, [data, processedData, state.selectedRows, onExport, csvService]);

  // 表格列定义
  const tableColumns = useMemo(() => {
    const columns = [
      // 选择列
      {
        key: 'selection',
        title: (
          <input
            type="checkbox"
            checked={state.selectedRows.size === data.length && data.length > 0}
            onChange={(e) => {
              const newSelected = e.target.checked
                ? new Set(data.map((_, index) => index))
                : new Set<number>();
              setState(prev => ({ ...prev, selectedRows: newSelected }));
            }}
          />
        ),
        width: 50,
        render: (value: any, record: GameData, index: number) => (
          <input
            type="checkbox"
            checked={state.selectedRows.has(index)}
            onChange={(e) => {
              const newSelected = new Set(state.selectedRows);
              if (e.target.checked) {
                newSelected.add(index);
              } else {
                newSelected.delete(index);
              }
              setState(prev => ({ ...prev, selectedRows: newSelected }));
            }}
          />
        )
      },
      // 行号列
      {
        key: 'index',
        title: '#',
        width: 60,
        render: (value: any, record: GameData, index: number) => (
          <span className="text-gray-500">{index + 1}</span>
        )
      }
    ];

    // 添加数据字段列
    fields.forEach(field => {
      columns.push({
        key: field.key,
        title: (
          <div
            className="flex items-center cursor-pointer hover:text-blue-600"
            onClick={() => handleSort(field.key)}
          >
            <span>{field.title}</span>
            {state.sortConfig?.field === field.key && (
              <span className="ml-1">
                {state.sortConfig.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
        ),
        render: (value: any, record: GameData, index: number) => {
          const isEditing = state.editingCell?.row === index && state.editingCell?.field === field.key;

          if (isEditing) {
            return (
              <div className="flex items-center space-x-2">
                {field.type === 'select' && field.options ? (
                  <select
                    value={state.editingValue}
                    onChange={(e) => setState(prev => ({ ...prev, editingValue: e.target.value }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    autoFocus
                  >
                    {field.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={state.editingValue}
                    onChange={(e) => setState(prev => ({ ...prev, editingValue: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveEdit();
                      } else if (e.key === 'Escape') {
                        cancelEdit();
                      }
                    }}
                    size="sm"
                    autoFocus
                  />
                )}
                <Button size="sm" onClick={saveEdit}>
                  ✓
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  ✕
                </Button>
              </div>
            );
          }

          const displayValue = String(value || '');
          
          return (
            <div
              className={cn(
                "cursor-pointer hover:bg-gray-50 px-2 py-1 rounded",
                field.editable && "border-l-2 border-transparent hover:border-blue-300"
              )}
              onClick={() => field.editable && startEditCell(index, field.key)}
              title={field.editable ? '点击编辑' : undefined}
            >
              {field.type === 'url' && displayValue ? (
                <a
                  href={displayValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {displayValue.length > 50 ? `${displayValue.slice(0, 50)}...` : displayValue}
                </a>
              ) : (
                <span className={cn(
                  displayValue.length > 50 && "truncate",
                  !displayValue && "text-gray-400 italic"
                )}>
                  {displayValue || '(空)'}
                </span>
              )}
            </div>
          );
        }
      });
    });

    // 操作列
    columns.push({
      key: 'actions',
      title: '操作',
      width: 100,
      render: (value: any, record: GameData, index: number) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => deleteRow(index)}
            className="text-red-600 hover:text-red-700"
          >
            删除
          </Button>
        </div>
      )
    });

    return columns;
  }, [fields, state, data, handleSort, startEditCell, saveEdit, cancelEdit, deleteRow]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* 工具栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* 搜索 */}
          <Input
            placeholder="搜索数据..."
            value={state.searchKeyword}
            onChange={(e) => setState(prev => ({ ...prev, searchKeyword: e.target.value }))}
            className="w-64"
          />

          {/* 批量操作 */}
          {state.selectedRows.size > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                已选择 {state.selectedRows.size} 行
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={batchDelete}
                className="text-red-600"
              >
                批量删除
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 导出按钮 */}
          <Button
            variant="outline"
            onClick={() => setState(prev => ({ ...prev, showExportDialog: true }))}
          >
            导出数据
          </Button>

          {/* 数据统计 */}
          <div className="text-sm text-gray-600">
            显示 {processedData.length} / {data.length} 行
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table
          columns={tableColumns}
          data={processedData}
          pagination={{
            current: state.pagination.current,
            pageSize: state.pagination.pageSize,
            total: processedData.length,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => {
              setState(prev => ({
                ...prev,
                pagination: { current: page, pageSize: pageSize || 20 }
              }));
            }
          }}
          scroll={{ x: 'max-content' }}
          rowClassName={(record, index) => cn(
            state.selectedRows.has(index) && 'bg-blue-50'
          )}
        />
      </div>

      {/* 导出对话框 */}
      {state.showExportDialog && (
        <ExportDialog
          onExport={exportData}
          onCancel={() => setState(prev => ({ ...prev, showExportDialog: false }))}
          selectedCount={state.selectedRows.size}
          totalCount={data.length}
        />
      )}
    </div>
  );
};

/**
 * 导出对话框属性
 */
interface ExportDialogProps {
  onExport: (config: CSVExportConfig) => void;
  onCancel: () => void;
  selectedCount: number;
  totalCount: number;
}

/**
 * 导出对话框组件
 */
const ExportDialog: React.FC<ExportDialogProps> = ({
  onExport,
  onCancel,
  selectedCount,
  totalCount
}) => {
  const [config, setConfig] = useState<CSVExportConfig>({
    filename: `游戏数据_${new Date().toISOString().split('T')[0]}`,
    delimiter: ',',
    header: true,
    encoding: 'utf-8'
  });

  const handleExport = () => {
    onExport(config);
  };

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title="导出数据"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            文件名
          </label>
          <Input
            value={config.filename}
            onChange={(e) => setConfig(prev => ({ ...prev, filename: e.target.value }))}
            placeholder="输入文件名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            分隔符
          </label>
          <select
            value={config.delimiter}
            onChange={(e) => setConfig(prev => ({ ...prev, delimiter: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value=",">逗号 (,)</option>
            <option value=";">分号 (;)</option>
            <option value="\t">制表符</option>
            <option value="|">竖线 (|)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            编码格式
          </label>
          <select
            value={config.encoding}
            onChange={(e) => setConfig(prev => ({ ...prev, encoding: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="utf-8">UTF-8</option>
            <option value="gbk">GBK</option>
            <option value="utf-8-bom">UTF-8 with BOM</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="include-header"
            checked={config.header}
            onChange={(e) => setConfig(prev => ({ ...prev, header: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="include-header" className="text-sm text-gray-700">
            包含标题行
          </label>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">
            {selectedCount > 0 ? (
              <>将导出选中的 <strong>{selectedCount}</strong> 行数据</>
            ) : (
              <>将导出全部 <strong>{totalCount}</strong> 行数据</>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={handleExport}>
          导出
        </Button>
      </div>
    </Modal>
  );
};

export default DataPreview; 