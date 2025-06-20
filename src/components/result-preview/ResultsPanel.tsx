/**
 * 结果展示面板组件
 * 任务10.2.4：实现结果展示界面 - 分屏预览布局、生成项目列表、详情查看面板
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar, RealTimeStats } from '@/components/ui';
import { ResultPreview, QualityAnalysis } from './index';
import { 
  FileText, 
  BarChart3, 
  Eye, 
  Download,
  Search,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export interface GenerationResultItem {
  id: string;
  gameId: string;
  gameName: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  content?: any;
  structuredData?: any;
  qualityScore?: number;
  wordCount?: number;
  keywordDensity?: number;
  generatedAt?: Date;
  errors?: string[];
}

export interface ResultsPanelProps {
  results: GenerationResultItem[];
  selectedResultId?: string;
  onResultSelect: (resultId: string) => void;
  onExport?: (resultIds: string[]) => void;
  onRegenerate?: (resultId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  selectedResultId,
  onResultSelect,
  onExport,
  onRegenerate,
  isLoading = false,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  // 过滤和搜索结果
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      const matchesSearch = result.gameName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [results, searchQuery, statusFilter]);

  // 选中的结果详情
  const selectedResult = useMemo(() => {
    return results.find(result => result.id === selectedResultId);
  }, [results, selectedResultId]);

  // 统计信息
  const stats = useMemo(() => {
    const total = results.length;
    const completed = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const generating = results.filter(r => r.status === 'generating').length;
    const avgQuality = results.filter(r => r.qualityScore)
      .reduce((acc, r) => acc + (r.qualityScore || 0), 0) / 
      (results.filter(r => r.qualityScore).length || 1);

    return { total, completed, failed, generating, avgQuality };
  }, [results]);

  // 处理批量选择
  const handleBatchSelect = (resultId: string, checked: boolean) => {
    const newSelected = new Set(selectedResults);
    if (checked) {
      newSelected.add(resultId);
    } else {
      newSelected.delete(resultId);
    }
    setSelectedResults(newSelected);
  };

  // 获取状态图标和颜色
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', variant: 'success' as const };
      case 'failed':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', variant: 'danger' as const };
      case 'generating':
        return { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100', variant: 'primary' as const };
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', variant: 'secondary' as const };
    }
  };

  // 渲染结果列表项
  const renderResultItem = (result: GenerationResultItem) => {
    const statusConfig = getStatusConfig(result.status);
    const StatusIcon = statusConfig.icon;

    if (viewMode === 'grid') {
      return (
        <Card 
          key={result.id}
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md
            ${selectedResultId === result.id ? 'ring-2 ring-blue-500 shadow-md' : ''}
          `}
          onClick={() => onResultSelect(result.id)}
        >
          <div className="space-y-3">
            {/* 头部：游戏名和状态 */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 truncate flex-1 mr-2">
                {result.gameName}
              </h4>
              <Badge variant={statusConfig.variant} size="sm">
                <StatusIcon className="h-3 w-3 mr-1" />
                {result.status}
              </Badge>
            </div>

            {/* 进度条（生成中时显示） */}
            {result.status === 'generating' && (
              <ProgressBar
                value={result.progress}
                size="sm"
                variant="primary"
                animated
                showValue={false}
              />
            )}

            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
              <div>
                <div className="font-medium text-gray-700">{result.wordCount || 0}</div>
                <div>字数</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{result.qualityScore || 0}</div>
                <div>质量</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{(result.keywordDensity || 0).toFixed(1)}%</div>
                <div>密度</div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onResultSelect(result.id);
                }}
                className="flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
                查看
              </Button>
              {result.status === 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport?.([result.id]);
                  }}
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      );
    }

    // 列表模式
    return (
      <Card 
        key={result.id}
        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-sm
          ${selectedResultId === result.id ? 'ring-2 ring-blue-500 shadow-sm' : ''}
        `}
        onClick={() => onResultSelect(result.id)}
      >
        <div className="flex items-center gap-4">
          {/* 复选框 */}
          <input
            type="checkbox"
            checked={selectedResults.has(result.id)}
            onChange={(e) => {
              e.stopPropagation();
              handleBatchSelect(result.id, e.target.checked);
            }}
            className="rounded border-gray-300 text-blue-600"
          />

          {/* 状态图标 */}
          <div className={`p-2 rounded-full ${statusConfig.bg}`}>
            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
          </div>

          {/* 主要信息 */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{result.gameName}</h4>
            <p className="text-sm text-gray-500">ID: {result.gameId}</p>
          </div>

          {/* 进度（生成中时显示） */}
          {result.status === 'generating' && (
            <div className="w-32">
              <ProgressBar
                value={result.progress}
                size="sm"
                variant="primary"
                animated
                showValue
              />
            </div>
          )}

          {/* 统计信息 */}
          <div className="flex gap-6 text-sm text-gray-500">
            <div className="text-center">
              <div className="font-medium text-gray-700">{result.wordCount || 0}</div>
              <div className="text-xs">字数</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-700">{result.qualityScore || 0}</div>
              <div className="text-xs">质量</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-700">{(result.keywordDensity || 0).toFixed(1)}%</div>
              <div className="text-xs">密度</div>
            </div>
          </div>

          {/* 时间 */}
          {result.generatedAt && (
            <div className="text-xs text-gray-500">
              {result.generatedAt.toLocaleString()}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onResultSelect(result.id);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {result.status === 'completed' && onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onExport([result.id]);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {result.status === 'failed' && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(result.id);
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className={`h-full flex ${isDetailExpanded ? 'space-x-4' : ''} ${className}`}>
      {/* 左侧：结果列表 */}
      <div className={`${isDetailExpanded && selectedResult ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
        <Card className="h-full flex flex-col">
          {/* 头部工具栏 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">生成结果</h3>
                <Badge variant="secondary">{filteredResults.length} 项</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 视图模式切换 */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-1"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="p-1"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>

                {/* 展开/收起详情面板 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailExpanded(!isDetailExpanded)}
                  className="p-2"
                >
                  {isDetailExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索游戏名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="completed">已完成</option>
                <option value="generating">生成中</option>
                <option value="failed">失败</option>
                <option value="pending">待处理</option>
              </select>
            </div>

            {/* 统计概览 */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">总计</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-gray-500">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{stats.failed}</div>
                <div className="text-xs text-gray-500">失败</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.avgQuality.toFixed(0)}</div>
                <div className="text-xs text-gray-500">平均质量</div>
              </div>
            </div>

            {/* 批量操作 */}
            {selectedResults.size > 0 && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  已选择 {selectedResults.size} 项
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExport?.(Array.from(selectedResults))}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    批量导出
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedResults(new Set())}
                  >
                    取消选择
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 结果列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无生成结果</p>
                {searchQuery && <p className="text-sm mt-2">尝试调整搜索条件</p>}
              </div>
            ) : (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                  : 'space-y-3'
                }
              `}>
                {filteredResults.map(renderResultItem)}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 右侧：详情面板 */}
      {isDetailExpanded && selectedResult && (
        <div className="w-1/2 transition-all duration-300">
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">详情预览</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailExpanded(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 基本信息 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedResult.gameName}</h4>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={getStatusConfig(selectedResult.status).variant}>
                    {selectedResult.status}
                  </Badge>
                  {selectedResult.generatedAt && (
                    <span className="text-sm text-gray-500">
                      {selectedResult.generatedAt.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {/* 实时统计 */}
              {selectedResult.status === 'completed' && (
                <RealTimeStats
                  stats={{
                    wordCount: {
                      current: selectedResult.wordCount || 0,
                      target: 1000,
                      min: 800,
                      max: 1200
                    },
                    keywordDensity: {
                      main: selectedResult.keywordDensity || 0,
                      target: 2.5
                    },
                    qualityScore: {
                      overall: selectedResult.qualityScore || 0,
                      seo: 85,
                      readability: 90,
                      originality: 95
                    }
                  }}
                  compact={false}
                  showAll={true}
                />
              )}

              {/* 内容预览 */}
              {selectedResult.content && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">内容预览</h4>
                  <ResultPreview
                    content={selectedResult.content}
                    editable={false}
                    maxHeight="300px"
                  />
                </div>
              )}

              {/* 质量分析 */}
              {selectedResult.status === 'completed' && (
                <QualityAnalysis
                  content={selectedResult.content}
                  compact={false}
                />
              )}

              {/* 错误信息 */}
              {selectedResult.errors && selectedResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">错误信息</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    {selectedResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel; 