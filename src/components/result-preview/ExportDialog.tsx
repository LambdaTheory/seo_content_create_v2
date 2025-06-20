/**
 * 导出对话框组件
 * 提供导出配置和操作界面
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { 
  resultExportService, 
  ExportFormat, 
  ExportConfig, 
  BatchExportConfig,
  ExportResult 
} from '@/services/resultExportService';
import { PreviewGenerationResult } from '@/types/ResultPreview.types';

// 组件属性接口
export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  results: PreviewGenerationResult[];
  selectedResults?: PreviewGenerationResult[];
  mode: 'single' | 'batch';
}

// 导出配置状态
interface ExportFormData {
  format: ExportFormat;
  includeMetadata: boolean;
  includeQualityAnalysis: boolean;
  compression: boolean;
  encoding: 'utf-8' | 'utf-16' | 'ascii';
  customFields: string[];
  // 批量导出特有配置
  batchSize: number;
  includeIndex: boolean;
  separateFiles: boolean;
  zipOutput: boolean;
}

/**
 * 导出对话框组件
 */
export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  results,
  selectedResults,
  mode
}) => {
  // 表单数据状态
  const [formData, setFormData] = useState<ExportFormData>({
    format: ExportFormat.JSON,
    includeMetadata: true,
    includeQualityAnalysis: true,
    compression: false,
    encoding: 'utf-8',
    customFields: [],
    batchSize: 50,
    includeIndex: false,
    separateFiles: false,
    zipOutput: false
  });

  // 导出状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 可用字段列表（从第一个结果中提取）
  const availableFields = results.length > 0 
    ? Object.keys(results[0].content.rawContent)
    : [];

  /**
   * 处理表单字段变更
   */
  const handleFieldChange = useCallback((
    field: keyof ExportFormData,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * 处理自定义字段选择
   */
  const handleCustomFieldToggle = useCallback((field: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.includes(field)
        ? prev.customFields.filter(f => f !== field)
        : [...prev.customFields, field]
    }));
  }, []);

  /**
   * 执行导出
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    setExportResult(null);

    try {
      const exportConfig: ExportConfig = {
        format: formData.format,
        includeMetadata: formData.includeMetadata,
        includeQualityAnalysis: formData.includeQualityAnalysis,
        customFields: formData.customFields.length > 0 ? formData.customFields : undefined,
        compression: formData.compression,
        encoding: formData.encoding
      };

      let result: ExportResult;

      if (mode === 'single' && selectedResults && selectedResults.length === 1) {
        // 单个结果导出
        result = await resultExportService.exportSingle(
          selectedResults[0],
          exportConfig
        );
      } else {
        // 批量导出
        const batchConfig: BatchExportConfig = {
          ...exportConfig,
          batchSize: formData.batchSize,
          includeIndex: formData.includeIndex,
          separateFiles: formData.separateFiles,
          zipOutput: formData.zipOutput
        };

        const resultsToExport = selectedResults && selectedResults.length > 0
          ? selectedResults
          : results;

        result = await resultExportService.exportBatch(
          resultsToExport,
          batchConfig
        );
      }

      if (result.success) {
        setExportResult(result);
        // 自动下载文件
        if (result.downloadUrl) {
          resultExportService.downloadFile(result);
        }
      } else {
        setError(result.error || '导出失败');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '导出过程中发生错误');
    } finally {
      setIsExporting(false);
    }
  }, [formData, mode, results, selectedResults]);

  /**
   * 关闭对话框
   */
  const handleClose = useCallback(() => {
    // 清理下载URL
    if (exportResult?.downloadUrl) {
      resultExportService.cleanupDownloadUrl(exportResult);
    }
    
    setExportResult(null);
    setError(null);
    onClose();
  }, [exportResult, onClose]);

  // 计算将要导出的结果数量
  const exportCount = mode === 'single' 
    ? 1 
    : (selectedResults && selectedResults.length > 0 ? selectedResults.length : results.length);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'single' ? '导出结果' : '批量导出结果'}
      size="lg"
    >
      <div className="space-y-6">
        {/* 导出概览 */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            导出概览
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>导出模式: {mode === 'single' ? '单个结果' : '批量导出'}</div>
            <div>结果数量: {exportCount} 个</div>
          </div>
        </div>

        {/* 基础配置 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            基础配置
          </h3>
          
          {/* 导出格式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              导出格式
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(ExportFormat).map(format => (
                <button
                  key={format}
                  type="button"
                  onClick={() => handleFieldChange('format', format)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    formData.format === format
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 编码格式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              编码格式
            </label>
            <select
              value={formData.encoding}
              onChange={(e) => handleFieldChange('encoding', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="utf-8">UTF-8</option>
              <option value="utf-16">UTF-16</option>
              <option value="ascii">ASCII</option>
            </select>
          </div>
        </div>

        {/* 内容配置 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            包含内容
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeMetadata}
                onChange={(e) => handleFieldChange('includeMetadata', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                包含元数据（生成信息、Token使用量等）
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeQualityAnalysis}
                onChange={(e) => handleFieldChange('includeQualityAnalysis', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                包含质量分析（SEO评分、关键词密度等）
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.compression}
                onChange={(e) => handleFieldChange('compression', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                启用压缩（减少文件大小）
              </span>
            </label>
          </div>
        </div>

        {/* 自定义字段选择 */}
        {availableFields.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              自定义字段选择
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {availableFields.map(field => (
                <label key={field} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.customFields.includes(field)}
                    onChange={() => handleCustomFieldToggle(field)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {field}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 批量导出配置 */}
        {mode === 'batch' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              批量导出配置
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  批处理大小
                </label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.batchSize}
                  onChange={(e) => handleFieldChange('batchSize', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeIndex}
                  onChange={(e) => handleFieldChange('includeIndex', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  包含索引号
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.separateFiles}
                  onChange={(e) => handleFieldChange('separateFiles', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  分别保存为独立文件
                </span>
              </label>

              {formData.separateFiles && (
                <label className="flex items-center ml-6">
                  <input
                    type="checkbox"
                    checked={formData.zipOutput}
                    onChange={(e) => handleFieldChange('zipOutput', e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    打包为ZIP文件
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  导出失败
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 成功信息 */}
        {exportResult && exportResult.success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                  导出成功
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <div>文件名: {exportResult.fileName}</div>
                  <div>文件大小: {(exportResult.metadata.fileSize / 1024).toFixed(2)} KB</div>
                  <div>导出记录: {exportResult.metadata.totalRecords} 条</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isExporting}
        >
          取消
        </Button>
        <Button
          onClick={handleExport}
          loading={isExporting}
          disabled={isExporting}
        >
          {isExporting ? '导出中...' : '开始导出'}
        </Button>
      </div>
    </Modal>
  );
}; 