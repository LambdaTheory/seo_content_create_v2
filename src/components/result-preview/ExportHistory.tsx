/**
 * 导出历史组件
 * 显示导出记录和统计信息
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { 
  resultExportService, 
  ExportResult, 
  ExportStats,
  ExportFormat 
} from '@/services/resultExportService';

// 组件属性接口
export interface ExportHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 导出历史组件
 */
export const ExportHistory: React.FC<ExportHistoryProps> = ({
  isOpen,
  onClose
}) => {
  // 状态管理
  const [exportHistory, setExportHistory] = useState<ExportResult[]>([]);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | 'all'>('all');

  /**
   * 加载导出历史
   */
  const loadExportHistory = useCallback(() => {
    const history = resultExportService.getExportHistory();
    const stats = resultExportService.getExportStats();
    
    setExportHistory(history);
    setExportStats(stats);
  }, []);

  /**
   * 清理导出历史
   */
  const handleClearHistory = useCallback(() => {
    if (confirm('确定要清空所有导出历史吗？此操作不可撤销。')) {
      resultExportService.clearExportHistory();
      loadExportHistory();
    }
  }, [loadExportHistory]);

  /**
   * 重新下载文件
   */
  const handleRedownload = useCallback((exportResult: ExportResult) => {
    try {
      if (exportResult.downloadUrl) {
        resultExportService.downloadFile(exportResult);
      } else {
        alert('下载链接已过期，无法重新下载');
      }
    } catch (error) {
      alert('下载失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, []);

  /**
   * 获取状态标识符
   */
  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="success">成功</Badge>
    ) : (
      <Badge variant="error">失败</Badge>
    );
  };

  /**
   * 获取格式标识符
   */
  const getFormatBadge = (format: ExportFormat) => {
    const variants: Record<ExportFormat, 'primary' | 'secondary'> = {
      [ExportFormat.JSON]: 'primary',
      [ExportFormat.CSV]: 'secondary',
      [ExportFormat.XLSX]: 'secondary',
      [ExportFormat.TXT]: 'secondary'
    };

    return (
      <Badge variant={variants[format]}>
        {format.toUpperCase()}
      </Badge>
    );
  };

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * 格式化日期时间
   */
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * 过滤导出历史
   */
  const filteredHistory = exportHistory.filter(item => 
    selectedFormat === 'all' || item.metadata.format === selectedFormat
  );

  // 组件挂载时加载数据
  useEffect(() => {
    if (isOpen) {
      loadExportHistory();
    }
  }, [isOpen, loadExportHistory]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="导出历史"
      size="xl"
    >
      <div className="space-y-6">
        {/* 统计信息 */}
        {exportStats && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              导出统计
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {exportStats.totalExports}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  总导出次数
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {exportStats.successfulExports}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  成功次数
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {exportStats.failedExports}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  失败次数
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatFileSize(exportStats.averageFileSize)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  平均文件大小
                </div>
              </div>
            </div>

            {/* 格式分布 */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                格式分布
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(exportStats.exportsByFormat).map(([format, count]) => (
                  <div key={format} className="flex items-center space-x-2">
                    {getFormatBadge(format as ExportFormat)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {count} 次
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 筛选和操作 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              筛选格式:
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ExportFormat | 'all')}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="all">全部格式</option>
              {Object.values(ExportFormat).map(format => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadExportHistory}
            >
              刷新
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={exportHistory.length === 0}
            >
              清空历史
            </Button>
          </div>
        </div>

        {/* 导出历史列表 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {exportHistory.length === 0 ? '暂无导出历史' : '没有匹配的导出记录'}
            </div>
          ) : (
            filteredHistory.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.fileName}
                      </h4>
                      {getStatusBadge(item.success)}
                      {getFormatBadge(item.metadata.format)}
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        导出时间: {formatDateTime(item.metadata.exportTime)}
                      </div>
                      <div>
                        记录数: {item.metadata.totalRecords}
                      </div>
                      <div>
                        文件大小: {formatFileSize(item.metadata.fileSize)}
                      </div>
                      <div>
                        格式: {item.metadata.format.toUpperCase()}
                      </div>
                    </div>
                    
                    {item.error && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                        错误: {item.error}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    {item.success && item.downloadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRedownload(item)}
                      >
                        重新下载
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 关闭按钮 */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onClose}>
          关闭
        </Button>
      </div>
    </Modal>
  );
}; 