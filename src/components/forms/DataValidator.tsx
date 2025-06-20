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
import { GameData, GameDataValidation } from '@/types/GameData.types';
import { cn } from '@/utils/classNames';
import { DataValidationService } from '@/services/dataValidation';
import { Card } from '@/components/ui/Card';

/**
 * 数据验证组件属性
 */
export interface DataValidatorProps {
  /** 原始数据 */
  data: Partial<GameData>[];
  /** 字段映射配置 */
  fieldMappings: CSVFieldMapping[];
  /** 验证规则 */
  validationRules?: CSVValidationRule[];
  /** 清洗选项 */
  cleaningOptions?: CSVCleaningOptions;
  /** 验证完成回调 */
  onValidationComplete?: (validations: GameDataValidation[]) => void;
  /** 数据修复回调 */
  onDataRepair?: (repairedData: GameData[]) => void;
  /** 显示模式 */
  mode?: 'summary' | 'detailed';
  /** 是否显示修复按钮 */
  showRepairActions?: boolean;
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
  onDataRepair,
  mode = 'summary',
  showRepairActions = true,
  className = ''
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

      onValidationComplete?.(DataValidationService.validateBatch(cleanedData));
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

      onDataRepair?.(updatedData as GameData[]);
    } catch (error) {
      console.error('批量修复失败:', error);
      setState(prev => ({ ...prev, isFixing: false }));
    }
  }, [state.result, state.selectedErrors, onDataRepair]);

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

  // 执行数据验证
  const validationResults = useMemo(() => {
    const results = DataValidationService.validateBatch(data);
    onValidationComplete?.(results);
    return results;
  }, [data, onValidationComplete]);

  // 计算验证统计
  const validationStats = useMemo(() => {
    const totalRecords = validationResults.length;
    const validRecords = validationResults.filter(v => v.isValid).length;
    const invalidRecords = totalRecords - validRecords;
    const totalErrors = validationResults.reduce((sum, v) => sum + v.errors.length, 0);
    const totalWarnings = validationResults.reduce((sum, v) => sum + v.warnings.length, 0);

    return {
      totalRecords,
      validRecords,
      invalidRecords,
      totalErrors,
      totalWarnings,
      validationRate: totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 0
    };
  }, [validationResults]);

  // 处理数据修复
  const handleRepairData = () => {
    try {
      const repairedData = data.map(item => DataValidationService.cleanData(item));
      onDataRepair?.(repairedData);
    } catch (error) {
      console.error('数据修复失败:', error);
    }
  };

  // 处理批量修复建议
  const handleBatchRepair = () => {
    const repairableData = data.map((item, index) => {
      const validation = validationResults[index];
      const suggestions = DataValidationService.getRepairSuggestions(validation);
      
      // 只处理可自动修复的问题
      const autoRepairableErrors = suggestions.filter(s => s.type === 'auto');
      if (autoRepairableErrors.length > 0) {
        return DataValidationService.cleanData(item);
      }
      return item as GameData;
    });

    onDataRepair?.(repairableData);
  };

  // 获取错误类型统计
  const errorTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    
    validationResults.forEach(validation => {
      validation.errors.forEach(error => {
        stats[error.type] = (stats[error.type] || 0) + 1;
      });
    });

    return stats;
  }, [validationResults]);

  if (mode === 'summary') {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">数据验证结果</h3>
          {showRepairActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRepairData}
                disabled={validationStats.totalErrors === 0}
              >
                自动修复
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBatchRepair}
                disabled={validationStats.totalErrors === 0}
              >
                批量修复
              </Button>
            </div>
          )}
        </div>

        {/* 验证统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{validationStats.totalRecords}</div>
            <div className="text-sm text-gray-600">总记录数</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{validationStats.validRecords}</div>
            <div className="text-sm text-green-600">有效记录</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{validationStats.invalidRecords}</div>
            <div className="text-sm text-red-600">无效记录</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{validationStats.validationRate}%</div>
            <div className="text-sm text-blue-600">验证通过率</div>
          </div>
        </div>

        {/* 错误和警告统计 */}
        {(validationStats.totalErrors > 0 || validationStats.totalWarnings > 0) && (
          <div className="flex flex-wrap gap-4 mb-4">
                     {validationStats.totalErrors > 0 && (
           <Badge variant="error" size="lg">
             {validationStats.totalErrors} 个错误
           </Badge>
         )}
         {validationStats.totalWarnings > 0 && (
           <Badge variant="warning" size="lg">
             {validationStats.totalWarnings} 个警告
           </Badge>
         )}
          </div>
        )}

        {/* 错误类型统计 */}
        {Object.keys(errorTypeStats).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">错误类型分布：</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(errorTypeStats).map(([type, count]) => (
                               <Badge key={type} outline>
                 {getErrorTypeDisplayName(type)}: {count}
               </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 验证成功状态 */}
        {validationStats.totalErrors === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">所有数据验证通过</span>
          </div>
        )}
      </Card>
    );
  }

  // 详细模式
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">详细验证结果</h3>
        {showRepairActions && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchRepair}
            disabled={validationStats.totalErrors === 0}
          >
            批量修复可修复项
          </Button>
        )}
      </div>

      {validationResults.map((validation, index) => (
        <ValidationDetailCard
          key={index}
          validation={validation}
          data={data[index]}
          rowIndex={index}
          onRepair={(repairedData) => {
            const newData = [...data];
            newData[index] = repairedData;
            onDataRepair?.(newData as GameData[]);
          }}
          showRepairActions={showRepairActions}
        />
      ))}
    </div>
  );
};

interface ValidationDetailCardProps {
  validation: GameDataValidation;
  data: Partial<GameData>;
  rowIndex: number;
  onRepair?: (repairedData: GameData) => void;
  showRepairActions?: boolean;
}

const ValidationDetailCard: React.FC<ValidationDetailCardProps> = ({
  validation,
  data,
  rowIndex,
  onRepair,
  showRepairActions
}) => {
  const handleRepairRow = () => {
    try {
      const repairedData = DataValidationService.cleanData(data);
      onRepair?.(repairedData);
    } catch (error) {
      console.error('行数据修复失败:', error);
    }
  };

  const repairSuggestions = useMemo(() => {
    return DataValidationService.getRepairSuggestions(validation);
  }, [validation]);

  const autoRepairableCount = repairSuggestions.filter(s => s.type === 'auto').length;

  return (
    <Card className={`p-4 ${validation.isValid ? 'border-green-200' : 'border-red-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">第 {rowIndex + 1} 行</span>
          <span className="text-gray-500">({data.gameName || '未命名游戏'})</span>
                     {validation.isValid ? (
             <Badge variant="success">验证通过</Badge>
           ) : (
             <Badge variant="error">验证失败</Badge>
           )}
        </div>

        {showRepairActions && !validation.isValid && autoRepairableCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRepairRow}
          >
            修复 ({autoRepairableCount})
          </Button>
        )}
      </div>

      {/* 错误列表 */}
      {validation.errors.length > 0 && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-red-600 mb-2">错误：</h5>
          <div className="space-y-1">
            {validation.errors.map((error, errorIndex) => (
              <div key={errorIndex} className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700">
                  <span className="font-medium">{getFieldDisplayName(error.field)}：</span>
                  {error.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 警告列表 */}
      {validation.warnings.length > 0 && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-yellow-600 mb-2">警告：</h5>
          <div className="space-y-1">
            {validation.warnings.map((warning, warningIndex) => (
              <div key={warningIndex} className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-yellow-700">
                  <div className="font-medium">{getFieldDisplayName(warning.field)}：{warning.message}</div>
                  {warning.suggestion && (
                    <div className="text-xs text-yellow-600 mt-1">建议：{warning.suggestion}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 修复建议 */}
      {repairSuggestions.length > 0 && (
        <div className="border-t pt-3">
          <h5 className="text-sm font-medium text-gray-600 mb-2">修复建议：</h5>
          <div className="space-y-1">
            {repairSuggestions.map((suggestion, suggestionIndex) => (
              <div key={suggestionIndex} className="flex items-center gap-2 text-sm">
                <Badge variant={suggestion.type === 'auto' ? 'success' : 'default'} size="sm">
                  {suggestion.type === 'auto' ? '自动' : '手动'}
                </Badge>
                <span className="text-gray-700">{suggestion.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// 辅助函数：获取错误类型显示名称
function getErrorTypeDisplayName(type: string): string {
  const typeNames: Record<string, string> = {
    required: '必填项',
    format: '格式错误',
    length: '长度错误',
    url: 'URL错误'
  };
  return typeNames[type] || type;
}

// 辅助函数：获取字段显示名称
function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    gameName: '游戏名称',
    mainKeyword: '主关键词',
    longTailKeywords: '长尾关键词',
    videoLink: '视频链接',
    internalLinks: '站内链接',
    competitorPages: '竞品页面',
    iconUrl: '游戏图标',
    realUrl: '游戏链接'
  };
  return fieldNames[field] || field;
}

export default DataValidator; 