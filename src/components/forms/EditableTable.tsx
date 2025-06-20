/**
 * 可编辑表格组件 - 支持内联编辑功能
 * 
 * 功能特性：
 * - 表格内联编辑
 * - 行级操作功能
 * - 数据验证和保存
 * - 编辑状态管理
 * - 自定义编辑器支持
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { GameData } from '@/types/GameData.types';
import { cn } from '@/utils/classNames';

/**
 * 编辑器类型
 */
type EditorType = 'text' | 'textarea' | 'select' | 'number' | 'date' | 'custom';

/**
 * 字段编辑器配置
 */
interface FieldEditor {
  /** 编辑器类型 */
  type: EditorType;
  /** 选项列表（用于select类型） */
  options?: Array<{ value: string; label: string }>;
  /** 自定义渲染函数 */
  render?: (
    value: any, 
    onChange: (value: any) => void, 
    record: any, 
    field: string
  ) => React.ReactNode;
  /** 验证函数 */
  validate?: (value: any, record: any) => string | null;
  /** 转换函数 */
  transform?: (value: any) => any;
}

/**
 * 编辑规则配置
 */
interface EditRule {
  /** 可编辑字段配置 */
  fields: Record<string, FieldEditor>;
  /** 是否允许添加新行 */
  allowAdd?: boolean;
  /** 是否允许删除行 */
  allowDelete?: boolean;
  /** 是否允许复制行 */
  allowCopy?: boolean;
  /** 保存验证函数 */
  validateSave?: (record: any) => string | null;
}

/**
 * 可编辑表格组件属性
 */
export interface EditableTableProps {
  /** 数据列表 */
  data: GameData[];
  /** 表格列配置 */
  columns: Array<{
    key: string;
    title: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, record: any, index: number) => React.ReactNode;
  }>;
  /** 编辑规则 */
  editRule: EditRule;
  /** 数据更新回调 */
  onDataChange?: (data: GameData[]) => void;
  /** 行保存回调 */
  onRowSave?: (record: GameData, index: number) => void;
  /** 行删除回调 */
  onRowDelete?: (record: GameData, index: number) => void;
  /** 行添加回调 */
  onRowAdd?: (record: GameData) => void;
  /** 是否显示行号 */
  showRowNumber?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 编辑状态
 */
interface EditState {
  /** 编辑模式的行索引 */
  editingRows: Set<number>;
  /** 编辑中的数据 */
  editingData: Record<number, Partial<GameData>>;
  /** 验证错误 */
  validationErrors: Record<number, Record<string, string>>;
  /** 正在保存的行 */
  savingRows: Set<number>;
}

/**
 * 可编辑表格组件
 */
export const EditableTable: React.FC<EditableTableProps> = ({
  data,
  columns,
  editRule,
  onDataChange,
  onRowSave,
  onRowDelete,
  onRowAdd,
  showRowNumber = true,
  className = ''
}) => {
  // 编辑状态管理
  const [editState, setEditState] = useState<EditState>({
    editingRows: new Set(),
    editingData: {},
    validationErrors: {},
    savingRows: new Set()
  });

  // 表格引用
  const tableRef = useRef<HTMLDivElement>(null);

  // 开始编辑行
  const startEdit = useCallback((rowIndex: number) => {
    setEditState(prev => ({
      ...prev,
      editingRows: new Set([...prev.editingRows, rowIndex]),
      editingData: {
        ...prev.editingData,
        [rowIndex]: { ...data[rowIndex] }
      },
      validationErrors: {
        ...prev.validationErrors,
        [rowIndex]: {}
      }
    }));
  }, [data]);

  // 取消编辑
  const cancelEdit = useCallback((rowIndex: number) => {
    setEditState(prev => {
      const newEditingRows = new Set(prev.editingRows);
      newEditingRows.delete(rowIndex);
      
      const newEditingData = { ...prev.editingData };
      delete newEditingData[rowIndex];
      
      const newValidationErrors = { ...prev.validationErrors };
      delete newValidationErrors[rowIndex];

      return {
        ...prev,
        editingRows: newEditingRows,
        editingData: newEditingData,
        validationErrors: newValidationErrors
      };
    });
  }, []);

  // 保存编辑
  const saveEdit = useCallback(async (rowIndex: number) => {
    const editingRecord = editState.editingData[rowIndex];
    if (!editingRecord) return;

    // 验证数据
    const errors: Record<string, string> = {};
    
    // 字段级验证
    Object.entries(editRule.fields).forEach(([field, editor]) => {
      if (editor.validate) {
        const error = editor.validate(editingRecord[field as keyof GameData], editingRecord);
        if (error) {
          errors[field] = error;
        }
      }
    });

    // 行级验证
    if (editRule.validateSave) {
      const saveError = editRule.validateSave(editingRecord);
      if (saveError) {
        errors._row = saveError;
      }
    }

    // 如果有验证错误，显示错误信息
    if (Object.keys(errors).length > 0) {
      setEditState(prev => ({
        ...prev,
        validationErrors: {
          ...prev.validationErrors,
          [rowIndex]: errors
        }
      }));
      return;
    }

    // 开始保存
    setEditState(prev => ({
      ...prev,
      savingRows: new Set([...prev.savingRows, rowIndex])
    }));

    try {
      // 应用数据转换
      const transformedRecord = { ...editingRecord };
      Object.entries(editRule.fields).forEach(([field, editor]) => {
        if (editor.transform) {
          const fieldKey = field as keyof GameData;
          transformedRecord[fieldKey] = editor.transform(transformedRecord[fieldKey]);
        }
      });

      // 更新数据
      const newData = [...data];
      newData[rowIndex] = transformedRecord as GameData;
      
      onDataChange?.(newData);
      onRowSave?.(transformedRecord as GameData, rowIndex);

      // 退出编辑模式
      cancelEdit(rowIndex);
    } catch (error) {
      console.error('保存失败:', error);
      // 可以在这里显示错误提示
    } finally {
      setEditState(prev => {
        const newSavingRows = new Set(prev.savingRows);
        newSavingRows.delete(rowIndex);
        return {
          ...prev,
          savingRows: newSavingRows
        };
      });
    }
  }, [editState.editingData, editRule, data, onDataChange, onRowSave, cancelEdit]);

  // 删除行
  const deleteRow = useCallback((rowIndex: number) => {
    const newData = [...data];
    const deletedRecord = newData.splice(rowIndex, 1)[0];
    
    onDataChange?.(newData);
    onRowDelete?.(deletedRecord, rowIndex);
  }, [data, onDataChange, onRowDelete]);

  // 复制行
  const copyRow = useCallback((rowIndex: number) => {
    const originalRecord = data[rowIndex];
    const copiedRecord = {
      ...originalRecord,
      // 可以在这里修改复制后的数据，比如添加"复制"标识
    };
    
    const newData = [...data];
    newData.splice(rowIndex + 1, 0, copiedRecord);
    
    onDataChange?.(newData);
  }, [data, onDataChange]);

  // 添加新行
  const addNewRow = useCallback(() => {
    const newRecord: Partial<GameData> = {};
    
    // 初始化字段默认值
    Object.keys(editRule.fields).forEach(field => {
      const fieldKey = field as keyof GameData;
      newRecord[fieldKey] = '' as any;
    });

    const newData = [...data, newRecord as GameData];
    onDataChange?.(newData);
    onRowAdd?.(newRecord as GameData);

    // 自动进入编辑模式
    setTimeout(() => {
      startEdit(data.length);
    }, 0);
  }, [data, editRule.fields, onDataChange, onRowAdd, startEdit]);

  // 更新字段值
  const updateFieldValue = useCallback((rowIndex: number, field: string, value: any) => {
    setEditState(prev => ({
      ...prev,
      editingData: {
        ...prev.editingData,
        [rowIndex]: {
          ...prev.editingData[rowIndex],
          [field]: value
        }
      },
      // 清空该字段的验证错误
      validationErrors: {
        ...prev.validationErrors,
        [rowIndex]: {
          ...prev.validationErrors[rowIndex],
          [field]: ''
        }
      }
    }));
  }, []);

  // 渲染编辑器
  const renderEditor = useCallback((
    field: string,
    editor: FieldEditor,
    value: any,
    record: any,
    rowIndex: number
  ) => {
    const onChange = (newValue: any) => updateFieldValue(rowIndex, field, newValue);
    const hasError = editState.validationErrors[rowIndex]?.[field];

    if (editor.render) {
      return editor.render(value, onChange, record, field);
    }

    const commonProps = {
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        onChange(e.target.value),
      className: cn(
        'w-full',
        hasError && 'border-red-300 focus:border-red-500 focus:ring-red-500'
      )
    };

    switch (editor.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={2}
            className={cn(commonProps.className, 'resize-none')}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">请选择</option>
            {editor.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className={hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          />
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          />
        );
    }
  }, [updateFieldValue, editState.validationErrors]);

  // 构建表格列
  const tableColumns = useMemo(() => {
    const cols = [];

    // 行号列
    if (showRowNumber) {
      cols.push({
        key: '_rowNumber',
        title: '#',
        width: 60,
        render: (value: any, record: any, index: number) => (
          <span className="text-gray-500">{index + 1}</span>
        )
      });
    }

    // 数据列
    columns.forEach(column => {
      cols.push({
        ...column,
        render: (value: any, record: any, index: number) => {
          const isEditing = editState.editingRows.has(index);
          const fieldEditor = editRule.fields[column.key];
          const hasError = editState.validationErrors[index]?.[column.key];

          if (isEditing && fieldEditor) {
            const editingValue = editState.editingData[index]?.[column.key as keyof GameData];
            return (
              <div className="space-y-1">
                {renderEditor(column.key, fieldEditor, editingValue, record, index)}
                {hasError && (
                  <div className="text-xs text-red-600">{hasError}</div>
                )}
              </div>
            );
          }

          if (column.render) {
            return column.render(value, record, index);
          }

          return (
            <div className="min-h-[24px] flex items-center">
              {String(value || '')}
            </div>
          );
        }
      });
    });

    // 操作列
    cols.push({
      key: '_actions',
      title: '操作',
      width: 200,
      render: (value: any, record: any, index: number) => {
        const isEditing = editState.editingRows.has(index);
        const isSaving = editState.savingRows.has(index);
        const hasRowError = editState.validationErrors[index]?._row;

        if (isEditing) {
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => saveEdit(index)}
                disabled={isSaving}
                loading={isSaving}
              >
                保存
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => cancelEdit(index)}
                disabled={isSaving}
              >
                取消
              </Button>
                             {hasRowError && (
                 <Badge variant="error" size="sm">
                   错误
                 </Badge>
               )}
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => startEdit(index)}
            >
              编辑
            </Button>
            {editRule.allowCopy && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyRow(index)}
                title="复制行"
              >
                复制
              </Button>
            )}
            {editRule.allowDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteRow(index)}
                title="删除行"
                className="text-red-600 hover:text-red-700"
              >
                删除
              </Button>
            )}
          </div>
        );
      }
    });

    return cols;
  }, [
    showRowNumber,
    columns,
    editState,
    editRule,
    renderEditor,
    saveEdit,
    cancelEdit,
    startEdit,
    copyRow,
    deleteRow
  ]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 工具栏 */}
      {editRule.allowAdd && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={addNewRow}
          >
            添加新行
          </Button>
        </div>
      )}

      {/* 表格 */}
      <div ref={tableRef} className="overflow-auto">
                <Table
           columns={tableColumns}
           dataSource={data}
           hoverable
           bordered
         />
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>共 {data.length} 条记录</span>
        {editState.editingRows.size > 0 && (
          <span>正在编辑 {editState.editingRows.size} 行</span>
        )}
      </div>
    </div>
  );
};

export default EditableTable; 