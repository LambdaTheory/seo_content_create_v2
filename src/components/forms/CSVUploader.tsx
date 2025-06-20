/**
 * CSV文件上传组件 - 专门用于CSV文件的上传和解析
 * 
 * 功能特性：
 * - 专门针对CSV文件的上传和解析
 * - 拖拽上传支持
 * - 自动文件验证和编码检测
 * - 实时解析预览
 * - 错误处理和修复建议
 * - 进度指示和状态反馈
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { CSVService } from '@/services/csvService';
import { 
  CSVParseResult, 
  CSVUploadProgress, 
  CSVParseConfig,
  CSVFileInfo 
} from '@/types/CSV.types';
import { cn } from '@/utils/classNames';

/**
 * CSV上传组件属性接口
 */
export interface CSVUploaderProps {
  /** 上传成功回调 */
  onUploadSuccess?: (result: CSVParseResult) => void;
  /** 上传错误回调 */
  onUploadError?: (error: Error) => void;
  /** 进度回调 */
  onProgress?: (progress: CSVUploadProgress) => void;
  /** 文件验证回调 */
  onFileValidation?: (file: File) => Promise<boolean> | boolean;
  /** 解析配置 */
  parseConfig?: Partial<CSVParseConfig>;
  /** 最大文件大小 (bytes) */
  maxSize?: number;
  /** 是否显示解析预览 */
  showPreview?: boolean;
  /** 是否自动开始解析 */
  autoParser?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * CSV上传状态接口
 */
interface CSVUploadState {
  /** 当前上传的文件 */
  file: File | null;
  /** 文件信息 */
  fileInfo: CSVFileInfo | null;
  /** 解析结果 */
  parseResult: CSVParseResult | null;
  /** 上传进度 */
  progress: CSVUploadProgress | null;
  /** 是否正在处理 */
  isProcessing: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否显示预览模态框 */
  showPreviewModal: boolean;
}

/**
 * CSV上传组件
 */
export const CSVUploader: React.FC<CSVUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  onProgress,
  onFileValidation,
  parseConfig = {},
  maxSize = 50 * 1024 * 1024, // 50MB
  showPreview = true,
  autoParser = true,
  className,
  disabled = false,
}) => {
  // 状态管理
  const [state, setState] = useState<CSVUploadState>({
    file: null,
    fileInfo: null,
    parseResult: null,
    progress: null,
    isProcessing: false,
    error: null,
    showPreviewModal: false,
  });

  const [isDragActive, setIsDragActive] = useState(false);

  // CSV服务实例
  const csvService = new CSVService();

  // 重置状态
  const resetState = useCallback(() => {
    setState({
      file: null,
      fileInfo: null,
      parseResult: null,
      progress: null,
      isProcessing: false,
      error: null,
      showPreviewModal: false,
    });
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (disabled || files.length === 0) return;

    const file = files[0]; // 只处理第一个文件
    setState(prev => ({ 
      ...prev, 
      file, 
      error: null,
      isProcessing: true 
    }));

    try {
      // 文件验证
      const validation = csvService.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // 自定义验证
      if (onFileValidation) {
        const isValid = await onFileValidation(file);
        if (!isValid) {
          throw new Error('文件验证失败');
        }
      }

      // 获取文件信息
      const fileInfo = csvService.getFileInfo(file);
      setState(prev => ({ ...prev, fileInfo }));

      // 自动开始解析
      if (autoParser) {
        await startParsing(file);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件处理失败';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false 
      }));
      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [disabled, onFileValidation, onUploadError, autoParser]);

  // 开始解析
  const startParsing = useCallback(async (file?: File) => {
    const targetFile = file || state.file;
    if (!targetFile) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // 进度回调
      const progressCallback = (progress: CSVUploadProgress) => {
        setState(prev => ({ ...prev, progress }));
        onProgress?.(progress);
      };

      // 解析CSV
      const result = await csvService.parseCSV(
        targetFile,
        parseConfig,
        progressCallback
      );

      setState(prev => ({ 
        ...prev, 
        parseResult: result,
        isProcessing: false,
        progress: null
      }));

      if (result.success) {
        onUploadSuccess?.(result);
        if (showPreview) {
          setState(prev => ({ ...prev, showPreviewModal: true }));
        }
      } else {
        const errorMessage = result.errors.map(e => e.message).join(', ');
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '解析失败';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false,
        progress: null
      }));
      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.file, parseConfig, onProgress, onUploadSuccess, onUploadError, showPreview]);

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFileUpload(files);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragActive ? "border-primary-500 bg-primary-50" : "border-gray-300",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400 cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          disabled={disabled || state.isProcessing}
          className="hidden"
          id="csv-file-input"
        />
        
        <label htmlFor="csv-file-input" className="cursor-pointer">
          <div className="space-y-4">
            <div className="text-4xl text-gray-400">📄</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                拖拽CSV文件到此处
              </p>
              <p className="text-sm text-gray-600">
                或点击选择CSV文件
              </p>
            </div>
            <p className="text-xs text-gray-500">
              支持CSV格式，最大{Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </label>

        {state.isProcessing && (
          <div className="mt-4">
            <Loading size="md" />
            <p className="text-sm text-gray-600 mt-2">正在处理文件...</p>
          </div>
        )}

        {state.file && !state.isProcessing && !state.error && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              文件上传成功: {state.file.name}
            </p>
          </div>
        )}
      </div>

      {/* 进度指示器 */}
      {state.progress && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{state.progress.message}</span>
            <span>{state.progress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.progress.progress}%` }}
            />
          </div>
          {state.progress.processedRows && state.progress.totalRows && (
            <div className="text-xs text-gray-500">
              已处理: {state.progress.processedRows} / {state.progress.totalRows} 行
              {state.progress.speed && (
                <span className="ml-2">
                  速度: {Math.round(state.progress.speed)} 行/秒
                </span>
              )}
              {state.progress.estimatedTime && (
                <span className="ml-2">
                  预计剩余: {Math.round(state.progress.estimatedTime)} 秒
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 文件信息 */}
      {state.fileInfo && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">文件信息</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>文件名:</span>
              <span className="font-mono">{state.fileInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span>文件大小:</span>
              <span>{formatFileSize(state.fileInfo.size)}</span>
            </div>
            <div className="flex justify-between">
              <span>文件类型:</span>
              <span>{state.fileInfo.type || 'unknown'}</span>
            </div>
            {state.fileInfo.encoding && (
              <div className="flex justify-between">
                <span>编码格式:</span>
                <span>{state.fileInfo.encoding}</span>
              </div>
            )}
            {state.fileInfo.lineCount && (
              <div className="flex justify-between">
                <span>行数:</span>
                <span>{state.fileInfo.lineCount.toLocaleString()}</span>
              </div>
            )}
            {state.fileInfo.columnCount && (
              <div className="flex justify-between">
                <span>列数:</span>
                <span>{state.fileInfo.columnCount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 解析结果摘要 */}
      {state.parseResult && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">解析结果</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-green-700">
              <span>解析行数:</span>
              <span>{state.parseResult.data.length.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-green-700">
              <span>字段数量:</span>
              <span>{state.parseResult.headers.length}</span>
            </div>
            {state.parseResult.errors.length > 0 && (
              <div className="flex justify-between text-red-600">
                <span>错误数量:</span>
                <span>{state.parseResult.errors.length}</span>
              </div>
            )}
            {state.parseResult.warnings.length > 0 && (
              <div className="flex justify-between text-yellow-600">
                <span>警告数量:</span>
                <span>{state.parseResult.warnings.length}</span>
              </div>
            )}
          </div>
          {showPreview && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setState(prev => ({ ...prev, showPreviewModal: true }))}
            >
              查看详细内容
            </Button>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {state.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">处理失败</h4>
          <p className="text-sm text-red-700">{state.error}</p>
          <div className="mt-3 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startParsing()}
              disabled={!state.file}
            >
              重试
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetState}
            >
              重新上传
            </Button>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {state.file && !state.isProcessing && !state.parseResult && !autoParser && (
        <div className="mt-4 flex space-x-3">
          <Button
            onClick={() => startParsing()}
            disabled={state.isProcessing}
          >
            开始解析
          </Button>
          <Button
            variant="ghost"
            onClick={resetState}
          >
            重新上传
          </Button>
        </div>
      )}

      {/* 预览模态框 */}
      {state.showPreviewModal && state.parseResult && (
        <CSVPreviewModal
          parseResult={state.parseResult}
          onClose={() => setState(prev => ({ ...prev, showPreviewModal: false }))}
        />
      )}
    </div>
  );

  // 格式化文件大小
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

/**
 * CSV预览模态框属性
 */
interface CSVPreviewModalProps {
  parseResult: CSVParseResult;
  onClose: () => void;
}

/**
 * CSV预览模态框组件
 */
const CSVPreviewModal: React.FC<CSVPreviewModalProps> = ({ 
  parseResult, 
  onClose 
}) => {
  const { data, headers, errors, warnings } = parseResult;
  const previewData = data.slice(0, 100); // 只显示前100行

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="xl"
      title="CSV数据预览"
    >
      <div className="space-y-4">
        {/* 统计信息 */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.length}</div>
            <div className="text-sm text-gray-600">总行数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{headers.length}</div>
            <div className="text-sm text-gray-600">字段数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errors.length}</div>
            <div className="text-sm text-gray-600">错误</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{warnings.length}</div>
            <div className="text-sm text-gray-600">警告</div>
          </div>
        </div>

        {/* 字段列表 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">字段列表</h4>
          <div className="flex flex-wrap gap-2">
            {headers.map((header, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {header}
              </span>
            ))}
          </div>
        </div>

        {/* 数据预览表格 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">
            数据预览 
            {data.length > 100 && (
              <span className="text-sm text-gray-500 ml-2">
                (显示前100行，共{data.length}行)
              </span>
            )}
          </h4>
          <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {rowIndex + 1}
                    </td>
                    {headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate"
                        title={String(row[header] || '')}
                      >
                        {String(row[header] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 错误和警告 */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="space-y-3">
            {errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-900 mb-2">解析错误</h4>
                <div className="space-y-2 max-h-32 overflow-auto">
                  {errors.slice(0, 10).map((error, index) => (
                    <div
                      key={index}
                      className="p-2 bg-red-50 border border-red-200 rounded text-sm"
                    >
                      <div className="text-red-800">{error.message}</div>
                      {error.row && (
                        <div className="text-red-600 text-xs mt-1">
                          行 {error.row} {error.column && `列 ${error.column}`}
                        </div>
                      )}
                      {error.suggestion && (
                        <div className="text-red-700 text-xs mt-1">
                          建议: {error.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                  {errors.length > 10 && (
                    <div className="text-sm text-gray-500 text-center">
                      还有 {errors.length - 10} 个错误...
                    </div>
                  )}
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">警告信息</h4>
                <div className="space-y-2 max-h-32 overflow-auto">
                  {warnings.slice(0, 5).map((warning, index) => (
                    <div
                      key={index}
                      className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800"
                    >
                      {warning}
                    </div>
                  ))}
                  {warnings.length > 5 && (
                    <div className="text-sm text-gray-500 text-center">
                      还有 {warnings.length - 5} 个警告...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 底部操作 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CSVUploader; 