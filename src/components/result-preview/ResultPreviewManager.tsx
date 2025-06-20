/**
 * 结果预览管理器组件
 * 整合预览、质量分析和导出功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { ResultPreview } from './ResultPreview';
import { QualityAnalysis } from './QualityAnalysis';
import { ResultsList } from './ResultsList';
import { ExportDialog } from './ExportDialog';
import { ExportHistory } from './ExportHistory';
import { PreviewGenerationResult } from '@/types/ResultPreview.types';

// 组件属性接口
export interface ResultPreviewManagerProps {
  /** 预览结果数据 */
  results: PreviewGenerationResult[];
  /** 当前选中的结果 */
  selectedResult?: PreviewGenerationResult;
  /** 选择结果回调 */
  onSelectResult?: (result: PreviewGenerationResult) => void;
  /** 结果更新回调 */
  onUpdateResult?: (result: PreviewGenerationResult) => void;
  /** 是否显示质量分析 */
  showQualityAnalysis?: boolean;
  /** 是否显示导出功能 */
  showExportFeatures?: boolean;
  /** 自定义类名 */
  className?: string;
}

// 视图模式
type ViewMode = 'list' | 'preview' | 'analysis';

/**
 * 结果预览管理器组件
 */
export const ResultPreviewManager: React.FC<ResultPreviewManagerProps> = ({
  results,
  selectedResult,
  onSelectResult,
  onUpdateResult,
  showQualityAnalysis = true,
  showExportFeatures = true,
  className = ''
}) => {
  // 状态管理
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedResults, setSelectedResults] = useState<PreviewGenerationResult[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExportHistoryOpen, setIsExportHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  /**
   * 处理结果选择
   */
  const handleSelectResult = useCallback((result: PreviewGenerationResult) => {
    onSelectResult?.(result);
    setViewMode('preview');
  }, [onSelectResult]);

  /**
   * 处理批量选择
   */
  const handleBatchSelect = useCallback((results: PreviewGenerationResult[]) => {
    setSelectedResults(results);
  }, []);

  /**
   * 处理结果更新
   */
  const handleUpdateResult = useCallback((updatedResult: PreviewGenerationResult) => {
    onUpdateResult?.(updatedResult);
  }, [onUpdateResult]);

  /**
   * 打开导出对话框
   */
  const handleOpenExportDialog = useCallback((mode: 'single' | 'batch') => {
    setIsExportDialogOpen(true);
  }, []);

  /**
   * 处理搜索
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  /**
   * 处理状态筛选
   */
  const handleFilterStatus = useCallback((status: string) => {
    setFilterStatus(status);
  }, []);

  /**
   * 过滤后的结果
   */
  const filteredResults = useMemo(() => {
    let filtered = results;

    // 状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(result => result.status === filterStatus);
    }

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result =>
        result.gameName.toLowerCase().includes(query) ||
        result.gameId.toLowerCase().includes(query) ||
        JSON.stringify(result.content.rawContent).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [results, filterStatus, searchQuery]);

  /**
   * 导出操作菜单
   */
  const exportMenuItems = [
    {
      key: 'export-selected',
      label: `导出选中项 (${selectedResults.length})`,
      disabled: selectedResults.length === 0,
      onClick: () => handleOpenExportDialog('batch')
    },
    {
      key: 'export-all',
      label: `导出全部 (${filteredResults.length})`,
      disabled: filteredResults.length === 0,
      onClick: () => handleOpenExportDialog('batch')
    },
    {
      key: 'export-current',
      label: '导出当前结果',
      disabled: !selectedResult,
      onClick: () => handleOpenExportDialog('single')
    },
    { key: 'divider', type: 'divider' },
    {
      key: 'export-history',
      label: '导出历史',
      onClick: () => setIsExportHistoryOpen(true)
    }
  ];

  /**
   * 视图模式切换按钮
   */
  const viewModeButtons = [
    {
      key: 'list',
      label: '列表视图',
      active: viewMode === 'list',
      onClick: () => setViewMode('list')
    },
    {
      key: 'preview',
      label: '预览视图',
      active: viewMode === 'preview',
      disabled: !selectedResult,
      onClick: () => setViewMode('preview')
    }
  ];

  if (showQualityAnalysis && selectedResult?.qualityAnalysis) {
    viewModeButtons.push({
      key: 'analysis',
      label: '质量分析',
      active: viewMode === 'analysis',
      disabled: !selectedResult?.qualityAnalysis,
      onClick: () => setViewMode('analysis')
    });
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {/* 视图模式切换 */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {viewModeButtons.map(button => (
              <button
                key={button.key}
                onClick={button.onClick}
                disabled={button.disabled}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  button.active
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                } ${
                  button.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>

          {/* 结果统计 */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            共 {filteredResults.length} 个结果
            {selectedResults.length > 0 && `, 已选中 ${selectedResults.length} 个`}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索结果..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* 状态筛选 */}
          <select
            value={filterStatus}
            onChange={(e) => handleFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">全部状态</option>
            <option value="completed">已完成</option>
            <option value="processing">处理中</option>
            <option value="failed">失败</option>
            <option value="pending">待处理</option>
          </select>

          {/* 导出功能 */}
          {showExportFeatures && (
            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  导出 ▼
                </Button>
              }
              items={exportMenuItems}
              placement="bottom-end"
            />
          )}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' && (
          <ResultsList
            results={filteredResults}
            selectedResults={selectedResults}
            onSelectResult={handleSelectResult}
            onBatchSelect={handleBatchSelect}
            onUpdateResult={handleUpdateResult}
            searchQuery={searchQuery}
            className="h-full"
          />
        )}

        {viewMode === 'preview' && selectedResult && (
          <ResultPreview
            result={selectedResult}
            onUpdate={handleUpdateResult}
            className="h-full"
          />
        )}

        {viewMode === 'analysis' && selectedResult?.qualityAnalysis && (
          <QualityAnalysis
            analysis={selectedResult.qualityAnalysis}
            className="h-full p-4"
          />
        )}

        {/* 空状态 */}
        {filteredResults.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">
                {results.length === 0 ? '暂无结果' : '没有匹配的结果'}
              </div>
              <div className="text-sm">
                {results.length === 0 
                  ? '开始生成内容后，结果将在这里显示'
                  : '尝试调整搜索条件或筛选器'
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 导出对话框 */}
      {showExportFeatures && (
        <>
          <ExportDialog
            isOpen={isExportDialogOpen}
            onClose={() => setIsExportDialogOpen(false)}
            results={filteredResults}
            selectedResults={selectedResults.length > 0 ? selectedResults : (selectedResult ? [selectedResult] : [])}
            mode={selectedResults.length > 0 || filteredResults.length > 1 ? 'batch' : 'single'}
          />

          <ExportHistory
            isOpen={isExportHistoryOpen}
            onClose={() => setIsExportHistoryOpen(false)}
          />
        </>
      )}
    </div>
  );
}; 