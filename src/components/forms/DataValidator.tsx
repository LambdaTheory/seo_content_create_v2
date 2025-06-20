/**
 * 数据验证组件 - 用于验证和清洗CSV数据
 * 
 * 功能特性：
 * - 必填字段验证
 * - URL格式验证
 * - 数据类型验证
 * - 数据清洗规则
 * - 错误数据标记
 * - 批量数据编辑
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Loading } from '@/components/ui/Loading';
import { CSVService } from '@/services/csvService';
import { 
  CSVValidationResult,
  CSVValidationError,
  CSVFieldMapping,
  CSVValidationRule,
  CSVCleaningOptions
} from '@/types/CSV.types';
import { GameData } from '@/types/GameData.types';
import { cn } from '@/utils/classNames';

/**
 * 数据验证组件属性
 */
export interface DataValidatorProps {
  /** 原始数据 */
  data: any[];
  /** 字段映射配置 */
  fieldMappings: CSVFieldMapping[];
  /** 验证规则 */
  validationRules?: CSVValidationRule[];
  /** 清洗选项 */
  cleaningOptions?: CSVCleaningOptions;
  /** 验证完成回调 */
  onValidationComplete?: (result: CSVValidationResult) => void;
  /** 数据修复回调 */
  onDataFixed?: (fixedData: GameData[]) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 验证状态
 */
interface ValidationState {
  /** 验证结果 */
  result: CSVValidationResult | null;
  /** 是否正在验证 */
  isValidating: boolean;
  /** 是否正在修复 */
  isFixing: boolean;
  /** 当前编辑的行 */
  editingRow: number | null;
  /** 编辑的数据 */
  editingData: Partial<GameData>;
  /** 是否显示错误详情 */
  showErrorDetails: boolean;
  /** 选中的错误行 */
  selectedErrors: Set<number>;
}

/**
 * 数据验证组件
 */
export const DataValidator: React.FC<DataValidatorProps> = ({
  data,
  fieldMappings,
  validationRules = [],
  cleaningOptions = {},
  onValidationComplete,
  onDataFixed,
  className
}) => {
  // 状态管理
  const [state, setState] = useState<ValidationState>({
    result: null,
    isValidating: false,
    isFixing: false,
    editingRow: null,
    editingData: {},
    showErrorDetails: false,
    selectedErrors: new Set(),
  });

  // CSV服务实例
  const csvService = new CSVService();

  // 开始验证数据
  const startValidation = useCallback(async () => {
    setState(prev => ({ ...prev, isValidating: true }));

    try {
      // 数据清洗
      let cleanedData = data;
      if (Object.keys(cleaningOptions).length > 0) {
        cleanedData = csvService.cleanData(data, cleaningOptions);
      }

      // 数据验证
      const result = csvService.validateCSVData(cleanedData, fieldMappings, validationRules);
      
      setState(prev => ({ 
        ...prev, 
        result,
        isValidating: false 
      }));

      onValidationComplete?.(result);
    } catch (error) {
      console.error('验证失败:', error);
      setState(prev => ({ ...prev, isValidating: false }));
    }
  }, [data, fieldMappings, validationRules, cleaningOptions, onValidationComplete]);

  // 修复单个字段
  const fixFieldValue = useCallback((rowIndex: number, field: string, newValue: any) => {
    if (!state.result) return;

    const updatedData = [...state.result.data];
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [field]: newValue
    };

    // 移除该字段的错误
    const updatedErrors = state.result.errors.filter(
      error => !(error.row === rowIndex && error.field === field)
    );

    setState(prev => ({
      ...prev,
      result: {
        ...state.result!,
        data: updatedData,
        errors: updatedErrors
      }
    }));
  }, [state.result]);

  // 批量修复错误
  const batchFixErrors = useCallback(async () => {
    if (!state.result || state.selectedErrors.size === 0) return;

    setState(prev => ({ ...prev, isFixing: true }));

    try {
      const updatedData = [...state.result.data];
      const updatedErrors = [...state.result.errors];

      // 应用自动修复规则
      for (const rowIndex of state.selectedErrors) {
        const rowErrors = state.result.errors.filter(error => error.row === rowIndex);
        
        for (const error of rowErrors) {
          const suggestion = getFixSuggestion(error, updatedData[rowIndex]);
          if (suggestion) {
            updatedData[rowIndex] = {
              ...updatedData[rowIndex],
              [error.field]: suggestion
            };
            
            // 移除已修复的错误
            const errorIndex = updatedErrors.findIndex(
              e => e.row === error.row && e.field === error.field
            );
            if (errorIndex !== -1) {
              updatedErrors.splice(errorIndex, 1);
            }
          }
        }
      }

      const fixedResult = {
        ...state.result,
        data: updatedData,
        errors: updatedErrors,
        valid: updatedErrors.length === 0
      };

      setState(prev => ({
        ...prev,
        result: fixedResult,
        isFixing: false,
        selectedErrors: new Set()
      }));

      onDataFixed?.(updatedData as GameData[]);
    } catch (error) {
      console.error('批量修复失败:', error);
      setState(prev => ({ ...prev, isFixing: false }));
    }
  }, [state.result, state.selectedErrors, onDataFixed]);

  // 获取修复建议
  const getFixSuggestion = (error: CSVValidationError, rowData: any): any => {
    const { field, type, value } = error;

    switch (type) {
      case 'required':
        // 必填字段为空，尝试从其他字段推导
        if (field === 'name' && rowData.url) {
          // 从URL推导游戏名称
          try {
            const url = new URL(rowData.url);
            const pathParts = url.pathname.split('/').filter(Boolean);
            return pathParts[pathParts.length - 1]?.replace(/-/g, ' ') || '未知游戏';
          } catch {
            return '未知游戏';
          }
        }
        break;

      case 'url':
        // URL格式错误，尝试修复
        if (typeof value === 'string' && value) {
          if (!value.startsWith('http')) {
            return `https://${value}`;
          }
          // 移除多余的空格和特殊字符
          return value.trim().replace(/\s+/g, '');
        }
        break;

      case 'number':
        // 数字格式错误，尝试转换
        if (typeof value === 'string') {
          const numStr = value.replace(/[^\d.-]/g, '');
          const num = parseFloat(numStr);
          return isNaN(num) ? 0 : num;
        }
        break;

      default:
        return null;
    }

    return null;
  };

  // 开始编辑行
  const startEditRow = useCallback((rowIndex: number) => {
    if (!state.result) return;

    setState(prev => ({
      ...prev,
      editingRow: rowIndex,
      editingData: { ...state.result!.data[rowIndex] }
    }));
  }, [state.result]);

  // 保存编辑
  const saveEdit = useCallback(() => {
    if (state.editingRow === null || !state.result) return;

    const updatedData = [...state.result.data];
    updatedData[state.editingRow] = { ...state.editingData };

    setState(prev => ({
      ...prev,
      result: {
        ...state.result!,
        data: updatedData
      },
      editingRow: null,
      editingData: {}
    }));
  }, [state.editingRow, state.editingData, state.result]);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setState(prev => ({
      ...prev,
      editingRow: null,
      editingData: {}
    }));
  }, []);

  // 计算统计信息
  const statistics = useMemo(() => {
    if (!state.result) return null;

    const { data, errors } = state.result;
    const errorRows = new Set(errors.map(e => e.row));
    
    return {
      totalRows: data.length,
      validRows: data.length - errorRows.size,
      errorRows: errorRows.size,
      totalErrors: errors.length,
      errorRate: ((errorRows.size / data.length) * 100).toFixed(1)
    };
  }, [state.result]);

  // 错误分组
  const errorsByType = useMemo(() => {
    if (!state.result) return {};

    return state.result.errors.reduce((acc, error) => {
      if (!acc[error.type]) {
        acc[error.type] = [];
      }
      acc[error.type].push(error);
      return acc;
    }, {} as Record<string, CSVValidationError[]>);
  }, [state.result]);

  // 表格列定义
  const tableColumns = useMemo(() => {
    if (!fieldMappings.length) return [];

    const columns = [
      {
        key: 'row',
        title: '行号',
        width: 80,
        render: (value: any, record: any, index: number) => (
          <span className="text-gray-500">{index + 1}</span>
        )
      }
    ];

    // 添加字段列
    fieldMappings.forEach(mapping => {
      columns.push({
        key: mapping.targetField,
        title: mapping.csvColumn,
        render: (value: any, record: any, index: number) => {
          const fieldErrors = state.result?.errors.filter(
            error => error.row === index && error.field === mapping.targetField
          ) || [];

          const isEditing = state.editingRow === index;

          if (isEditing) {
            return (
              <Input
                value={state.editingData[mapping.targetField] || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  editingData: {
                    ...prev.editingData,
                    [mapping.targetField]: e.target.value
                  }
                }))}
                size="sm"
              />
            );
          }

          return (
            <div className="space-y-1">
              <span className={cn(
                fieldErrors.length > 0 ? 'text-red-600' : 'text-gray-900'
              )}>
                {String(value || '')}
              </span>
              {fieldErrors.map((error, errorIndex) => (
                <Badge
                  key={errorIndex}
                  variant="danger"
                  size="sm"
                  className="text-xs"
                  title={error.message}
                >
                  {error.type}
                </Badge>
              ))}
            </div>
          );
        }
      });
    });

    // 添加操作列
    columns.push({
      key: 'actions',
      title: '操作',
      width: 120,
      render: (value: any, record: any, index: number) => {
        const isEditing = state.editingRow === index;
        const hasErrors = state.result?.errors.some(error => error.row === index);

        if (isEditing) {
          return (
            <div className="flex space-x-2">
              <Button size="sm" onClick={saveEdit}>
                保存
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                取消
              </Button>
            </div>
          );
        }

        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => startEditRow(index)}
            >
              编辑
            </Button>
            {hasErrors && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newSelected = new Set(state.selectedErrors);
                  if (newSelected.has(index)) {
                    newSelected.delete(index);
                  } else {
                    newSelected.add(index);
                  }
                  setState(prev => ({ ...prev, selectedErrors: newSelected }));
                }}
              >
                {state.selectedErrors.has(index) ? '取消选择' : '选择'}
              </Button>
            )}
          </div>
        );
      }
    });

    return columns;
  }, [fieldMappings, state.result, state.editingRow, state.editingData, state.selectedErrors]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* 操作区域 */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <Button
            onClick={startValidation}
            disabled={state.isValidating || data.length === 0}
          >
            {state.isValidating ? <Loading size="sm" className="mr-2" /> : null}
            开始验证
          </Button>
          
          {state.result && state.result.errors.length > 0 && (
            <Button
              variant="outline"
              onClick={batchFixErrors}
              disabled={state.isFixing || state.selectedErrors.size === 0}
            >
              {state.isFixing ? <Loading size="sm" className="mr-2" /> : null}
              批量修复 ({state.selectedErrors.size})
            </Button>
          )}

          {state.result && state.result.errors.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setState(prev => ({ ...prev, showErrorDetails: true }))}
            >
              查看错误详情
            </Button>
          )}
        </div>

        {statistics && (
          <div className="text-sm text-gray-600">
            总计 {statistics.totalRows} 行，
            有效 {statistics.validRows} 行，
            错误 {statistics.errorRows} 行 ({statistics.errorRate}%)
          </div>
        )}
      </div>

      {/* 统计卡片 */}
      {statistics && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">{statistics.totalRows}</div>
            <div className="text-sm text-blue-700">总行数</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-900">{statistics.validRows}</div>
            <div className="text-sm text-green-700">有效行数</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-900">{statistics.errorRows}</div>
            <div className="text-sm text-red-700">错误行数</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-900">{statistics.totalErrors}</div>
            <div className="text-sm text-yellow-700">错误总数</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-900">{statistics.errorRate}%</div>
            <div className="text-sm text-purple-700">错误率</div>
          </div>
        </div>
      )}

      {/* 数据表格 */}
      {state.result && (
        <div className="border border-gray-200 rounded-lg">
          <Table
            columns={tableColumns}
            data={state.result.data}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true
            }}
            scroll={{ x: 'max-content' }}
            rowClassName={(record, index) => {
              const hasErrors = state.result?.errors.some(error => error.row === index);
              const isSelected = state.selectedErrors.has(index);
              
              return cn(
                hasErrors && 'bg-red-50',
                isSelected && 'bg-blue-50',
                state.editingRow === index && 'bg-yellow-50'
              );
            }}
          />
        </div>
      )}

      {/* 错误详情模态框 */}
      {state.showErrorDetails && state.result && (
        <Modal
          open={true}
          onClose={() => setState(prev => ({ ...prev, showErrorDetails: false }))}
          title="错误详情"
          size="lg"
        >
          <div className="space-y-4">
            {Object.entries(errorsByType).map(([type, errors]) => (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  {type} 错误 ({errors.length} 个)
                </h4>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {errors.slice(0, 20).map((error, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded border text-sm"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">
                          行 {error.row + 1}，字段 {error.field}
                        </span>
                        <Badge variant="outline" size="sm">
                          {error.type}
                        </Badge>
                      </div>
                      <div className="text-gray-600 mb-1">
                        错误值: <code className="bg-gray-200 px-1 rounded">{String(error.value)}</code>
                      </div>
                      <div className="text-red-600">{error.message}</div>
                      {error.suggestion && (
                        <div className="text-blue-600 mt-1">
                          建议: {error.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                  {errors.length > 20 && (
                    <div className="text-center text-gray-500 py-2">
                      还有 {errors.length - 20} 个错误...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, showErrorDetails: false }))}
            >
              关闭
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DataValidator; 