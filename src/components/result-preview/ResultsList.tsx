import React, { useState, useMemo, useCallback } from 'react';
import { PreviewGenerationResult } from '@/types/ResultPreview.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Dropdown';
import styles from './ResultsList.module.css';

interface ResultsListProps {
  results: PreviewGenerationResult[];
  selectedResultId?: string;
  onResultSelect: (result: PreviewGenerationResult) => void;
  onResultEdit?: (resultId: string, newContent: any) => void;
  onResultDelete?: (resultId: string) => void;
  onResultExport?: (resultId: string) => void;
  onBatchExport?: (resultIds: string[]) => void;
  className?: string;
}

export const ResultsList: React.FC<ResultsListProps> = ({
  results,
  selectedResultId,
  onResultSelect,
  onResultEdit,
  onResultDelete,
  onResultExport,
  onBatchExport,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'gameName' | 'status'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);

  // 筛选和排序结果
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results;

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result =>
        result.gameName.toLowerCase().includes(query) ||
        result.id.toLowerCase().includes(query) ||
        result.workflowId.toLowerCase().includes(query)
      );
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter);
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // 处理日期字段
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // 处理字符串字段
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [results, searchQuery, statusFilter, sortBy, sortOrder]);

  // 处理搜索
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // 处理选择
  const handleResultSelect = useCallback((result: PreviewGenerationResult) => {
    onResultSelect(result);
  }, [onResultSelect]);

  // 处理批量选择
  const handleSelectAll = useCallback(() => {
    if (selectedResults.length === filteredAndSortedResults.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(filteredAndSortedResults.map(r => r.id));
    }
  }, [selectedResults.length, filteredAndSortedResults]);

  const handleSelectResult = useCallback((resultId: string) => {
    setSelectedResults(prev => {
      if (prev.includes(resultId)) {
        return prev.filter(id => id !== resultId);
      } else {
        return [...prev, resultId];
      }
    });
  }, []);

  // 获取状态显示样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'processing':
        return styles.statusProcessing;
      case 'failed':
        return styles.statusFailed;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⟳';
      case 'failed':
        return '✗';
      case 'cancelled':
        return '⊘';
      default:
        return '⏳';
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // 计算质量评分
  const getQualityScore = (result: PreviewGenerationResult) => {
    return result.qualityAnalysis?.overallScore || 0;
  };

  // 获取质量评分颜色
  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`${styles.resultsList} ${className || ''}`}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        {/* 搜索和筛选 */}
        <div className={styles.filters}>
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by game name, ID, or workflow..."
            className={styles.searchInput}
          />
          
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as string)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'processing', label: 'Processing' },
              { value: 'failed', label: 'Failed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'pending', label: 'Pending' }
            ]}
            className={styles.statusFilter}
          />
        </div>

        {/* 排序和批量操作 */}
        <div className={styles.actions}>
          <Select
            value={`${sortBy}-${sortOrder}`}
            onChange={(value) => {
              const stringValue = value as string;
              const [field, order] = stringValue.split('-');
              setSortBy(field as any);
              setSortOrder(order as 'asc' | 'desc');
            }}
            options={[
              { value: 'updatedAt-desc', label: 'Latest Updated' },
              { value: 'updatedAt-asc', label: 'Oldest Updated' },
              { value: 'createdAt-desc', label: 'Latest Created' },
              { value: 'createdAt-asc', label: 'Oldest Created' },
              { value: 'gameName-asc', label: 'Game Name A-Z' },
              { value: 'gameName-desc', label: 'Game Name Z-A' },
              { value: 'status-asc', label: 'Status A-Z' }
            ]}
            className={styles.sortSelect}
          />

          {selectedResults.length > 0 && (
            <div className={styles.batchActions}>
              <span className={styles.selectedCount}>
                {selectedResults.length} selected
              </span>
              
              {onBatchExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBatchExport(selectedResults)}
                >
                  Export Selected
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedResults([])}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 批量选择栏 */}
      {filteredAndSortedResults.length > 0 && (
        <div className={styles.bulkSelectBar}>
          <label className={styles.selectAllCheckbox}>
            <input
              type="checkbox"
              checked={selectedResults.length === filteredAndSortedResults.length}
              onChange={handleSelectAll}
            />
            <span>Select All ({filteredAndSortedResults.length})</span>
          </label>
        </div>
      )}

      {/* 结果列表 */}
      <div className={styles.resultsContainer}>
        {filteredAndSortedResults.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📄</div>
            <div className={styles.emptyTitle}>No results found</div>
            <div className={styles.emptyDescription}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No generation results available'
              }
            </div>
          </div>
        ) : (
          filteredAndSortedResults.map(result => (
            <div
              key={result.id}
              className={`${styles.resultItem} ${
                selectedResultId === result.id ? styles.resultItemSelected : ''
              }`}
              onClick={() => handleResultSelect(result)}
            >
              {/* 选择框 */}
              <div className={styles.resultCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedResults.includes(result.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectResult(result.id);
                  }}
                />
              </div>

              {/* 主要信息 */}
              <div className={styles.resultMain}>
                <div className={styles.resultHeader}>
                  <div className={styles.gameName}>{result.gameName}</div>
                  <div className={`${styles.status} ${getStatusStyle(result.status)}`}>
                    <span className={styles.statusIcon}>{getStatusIcon(result.status)}</span>
                    <span className={styles.statusText}>{result.status}</span>
                  </div>
                </div>

                <div className={styles.resultMeta}>
                  <span className={styles.metaItem}>ID: {result.id.slice(0, 8)}...</span>
                  <span className={styles.metaItem}>Workflow: {result.workflowId.slice(0, 8)}...</span>
                  <span className={styles.metaItem}>Updated: {formatTime(result.updatedAt)}</span>
                </div>

                {/* 质量评分 */}
                {result.qualityAnalysis && (
                  <div className={styles.qualityScore}>
                    <span className={styles.qualityLabel}>Quality Score:</span>
                    <span className={`${styles.qualityValue} ${getQualityScoreColor(getQualityScore(result))}`}>
                      {getQualityScore(result)}%
                    </span>
                  </div>
                )}

                {/* 元数据 */}
                {result.metadata && (
                  <div className={styles.metadata}>
                    <span className={styles.metadataItem}>
                      Tokens: {result.metadata.totalTokens}
                    </span>
                    <span className={styles.metadataItem}>
                      Time: {result.metadata.generationTime}ms
                    </span>
                    {result.metadata.retryCount > 0 && (
                      <span className={styles.metadataItem}>
                        Retries: {result.metadata.retryCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className={styles.resultActions}>
                {onResultExport && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResultExport(result.id);
                    }}
                    title="Export result"
                  >
                    📥
                  </Button>
                )}
                
                {onResultEdit && result.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResultEdit(result.id, result.content.rawContent);
                    }}
                    title="Edit result"
                  >
                    ✏️
                  </Button>
                )}
                
                {onResultDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResultDelete(result.id);
                    }}
                    title="Delete result"
                    className={styles.deleteButton}
                  >
                    🗑️
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部统计 */}
      <div className={styles.footer}>
        <div className={styles.stats}>
          <span>Total: {results.length}</span>
          <span>Shown: {filteredAndSortedResults.length}</span>
          {selectedResults.length > 0 && (
            <span>Selected: {selectedResults.length}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsList; 