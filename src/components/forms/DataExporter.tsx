/**
 * 数据导出组件
 * 
 * 功能特性：
 * - 导出格式选择
 * - 字段选择
 * - 导出配置
 * - 导出进度显示
 * - 导出结果预览
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { GameData } from '@/types/GameData.types';
import { DataExportService, ExportFormat, ExportConfig, ExportResult } from '@/services/dataExport';
import { cn } from '@/utils/classNames';

/**
 * 数据导出组件属性
 */
export interface DataExporterProps {
  /** 要导出的数据 */
  data: GameData[];
  /** 触发导出的按钮文本 */
  buttonText?: string;
  /** 按钮变体 */
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** 按钮大小 */
  buttonSize?: 'sm' | 'md' | 'lg';
  /** 默认导出格式 */
  defaultFormat?: ExportFormat;
  /** 默认选中的字段 */
  defaultFields?: (keyof GameData)[];
  /** 自定义样式类名 */
  className?: string;
  /** 导出完成回调 */
  onExportComplete?: (result: ExportResult) => void;
  /** 导出开始回调 */
  onExportStart?: (config: ExportConfig) => void;
}

/**
 * 数据导出组件
 */
export const DataExporter: React.FC<DataExporterProps> = ({
  data,
  buttonText = '导出数据',
  buttonVariant = 'outline',
  buttonSize = 'md',
  defaultFormat = 'csv',
  defaultFields,
  className = '',
  onExportComplete,
  onExportStart
}) => {
  // 状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: defaultFormat,
    fields: defaultFields,
    includeHeaders: true,
    prettifyJson: true,
    csvDelimiter: ',',
    encoding: 'utf-8'
  });
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  // 字段配置
  const allFields: (keyof GameData)[] = [
    'gameName',
    'mainKeyword', 
    'longTailKeywords',
    'videoLink',
    'internalLinks',
    'competitorPages',
    'iconUrl',
    'realUrl'
  ];

  const fieldLabels = DataExportService.getDefaultFieldLabels();

  // 选中的字段
  const selectedFields = useMemo(() => {
    return exportConfig.fields || allFields;
  }, [exportConfig.fields]);

  // 格式选项
  const formatOptions = [
    { value: 'csv', label: 'CSV文件', description: '逗号分隔值，支持Excel打开' },
    { value: 'json', label: 'JSON文件', description: '结构化数据格式，便于程序处理' },
    { value: 'excel', label: 'Excel文件', description: 'Excel兼容格式，支持中文' }
  ];

  // 打开导出配置对话框
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
    setExportResult(null);
  }, []);

  // 关闭对话框
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setIsExporting(false);
    setExportResult(null);
  }, []);

  // 更新导出配置
  const updateConfig = useCallback((updates: Partial<ExportConfig>) => {
    setExportConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // 切换字段选择
  const toggleField = useCallback((field: keyof GameData) => {
    const currentFields = exportConfig.fields || allFields;
    const newFields = currentFields.includes(field)
      ? currentFields.filter(f => f !== field)
      : [...currentFields, field];
    
    updateConfig({ fields: newFields });
  }, [exportConfig.fields, allFields, updateConfig]);

  // 全选/全不选字段
  const toggleAllFields = useCallback((selectAll: boolean) => {
    updateConfig({ fields: selectAll ? allFields : [] });
  }, [allFields, updateConfig]);

  // 执行导出
  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      setExportResult(null);

      // 验证配置
      const errors = DataExportService.validateConfig(exportConfig);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // 触发导出开始回调
      onExportStart?.(exportConfig);

      // 执行导出
      const result = await DataExportService.exportData(data, {
        ...exportConfig,
        fieldLabels: fieldLabels
      });

      setExportResult(result);

      // 自动下载成功的导出
      if (result.success) {
        DataExportService.downloadFile(result);
      }

      // 触发导出完成回调
      onExportComplete?.(result);

    } catch (error) {
      const errorResult: ExportResult = {
        success: false,
        filename: exportConfig.filename || `export-${Date.now()}.${exportConfig.format}`,
        error: error instanceof Error ? error.message : '导出失败'
      };
      
      setExportResult(errorResult);
      onExportComplete?.(errorResult);
    } finally {
      setIsExporting(false);
    }
  }, [exportConfig, data, fieldLabels, onExportStart, onExportComplete]);

  // 重新下载
  const handleRedownload = useCallback(() => {
    if (exportResult?.success) {
      DataExportService.downloadFile(exportResult);
    }
  }, [exportResult]);

  return (
    <>
      {/* 导出按钮 */}
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleOpenModal}
        disabled={data.length === 0}
        className={className}
      >
        {buttonText}
      </Button>

      {/* 导出配置对话框 */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="导出数据"
        size="lg"
      >
        <div className="space-y-6">
          {/* 导出格式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              导出格式
            </label>
            <div className="grid grid-cols-1 gap-3">
              {formatOptions.map(option => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center p-3 border rounded-lg cursor-pointer transition-colors',
                    exportConfig.format === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={exportConfig.format === option.value}
                    onChange={(e) => updateConfig({ format: e.target.value as ExportFormat })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 字段选择 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                选择字段 ({selectedFields.length}/{allFields.length})
              </label>
              <div className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllFields(true)}
                  disabled={selectedFields.length === allFields.length}
                >
                  全选
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllFields(false)}
                  disabled={selectedFields.length === 0}
                >
                  全不选
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {allFields.map(field => (
                <label
                  key={field}
                  className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field)}
                    onChange={() => toggleField(field)}
                    className="rounded"
                  />
                  <span className="text-sm">{fieldLabels[field]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 高级选项 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              高级选项
            </label>
            <div className="space-y-3">
              {/* 文件名 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">文件名（可选）</label>
                <Input
                  value={exportConfig.filename || ''}
                  onChange={(e) => updateConfig({ filename: e.target.value })}
                  placeholder="自动生成带时间戳的文件名"
                />
              </div>

              {/* CSV选项 */}
              {exportConfig.format === 'csv' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportConfig.includeHeaders}
                        onChange={(e) => updateConfig({ includeHeaders: e.target.checked })}
                      />
                      <span className="text-sm">包含标题行</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">分隔符</label>
                    <select
                      value={exportConfig.csvDelimiter}
                      onChange={(e) => updateConfig({ csvDelimiter: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value=",">逗号 (,)</option>
                      <option value=";">分号 (;)</option>
                      <option value="\t">制表符</option>
                    </select>
                  </div>
                </div>
              )}

              {/* JSON选项 */}
              {exportConfig.format === 'json' && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportConfig.prettifyJson}
                      onChange={(e) => updateConfig({ prettifyJson: e.target.checked })}
                    />
                    <span className="text-sm">格式化JSON（美化输出）</span>
                  </label>
                </div>
              )}

              {/* Excel选项 */}
              {exportConfig.format === 'excel' && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeHeaders}
                      onChange={(e) => updateConfig({ includeHeaders: e.target.checked })}
                    />
                    <span className="text-sm">包含标题行</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* 导出预览 */}
          <Card className="p-4 bg-gray-50">
            <div className="text-sm">
              <div className="font-medium mb-2">导出预览</div>
              <div className="space-y-1 text-gray-600">
                <div>格式: {formatOptions.find(f => f.value === exportConfig.format)?.label}</div>
                <div>总记录数: {data.length}</div>
                <div>导出字段: {selectedFields.length} 个</div>
                <div>预计文件大小: ~{Math.ceil(data.length * selectedFields.length * 20 / 1024)} KB</div>
              </div>
            </div>
          </Card>

          {/* 导出结果 */}
          {exportResult && (
            <Card className={cn(
              'p-4',
              exportResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <div className={cn(
                    'font-medium',
                    exportResult.success ? 'text-green-800' : 'text-red-800'
                  )}>
                    {exportResult.success ? '导出成功' : '导出失败'}
                  </div>
                  {exportResult.success && exportResult.stats && (
                    <div className="text-sm text-green-700 mt-1">
                      成功导出 {exportResult.stats.exportedRows} 条记录，
                      文件大小 {DataExportService.formatFileSize(exportResult.stats.fileSize)}
                    </div>
                  )}
                  {exportResult.error && (
                    <div className="text-sm text-red-700 mt-1">
                      {exportResult.error}
                    </div>
                  )}
                </div>
                {exportResult.success && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRedownload}
                  >
                    重新下载
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleCloseModal}
              disabled={isExporting}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting || selectedFields.length === 0}
            >
              {isExporting ? (
                <>
                  <Loading className="w-4 h-4 mr-2" />
                  导出中...
                </>
              ) : (
                '开始导出'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DataExporter; 