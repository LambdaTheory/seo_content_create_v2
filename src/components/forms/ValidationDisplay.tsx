import React, { useMemo } from 'react';
import { GameData, GameDataValidation } from '@/types/GameData.types';
import { DataValidationService } from '@/services/dataValidation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export interface ValidationDisplayProps {
  /** 要验证的数据 */
  data: Partial<GameData>[];
  /** 验证完成回调 */
  onValidationComplete?: (validations: GameDataValidation[]) => void;
  /** 数据修复回调 */
  onDataRepair?: (repairedData: GameData[]) => void;
  /** 显示模式 */
  mode?: 'summary' | 'detailed';
  /** 是否显示修复按钮 */
  showRepairActions?: boolean;
  /** 类名 */
  className?: string;
}

/**
 * 验证结果显示组件
 * 展示数据验证结果、错误统计和修复建议
 */
export const ValidationDisplay: React.FC<ValidationDisplayProps> = ({
  data,
  onValidationComplete,
  onDataRepair,
  mode = 'summary',
  showRepairActions = true,
  className = ''
}) => {
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

export default ValidationDisplay; 