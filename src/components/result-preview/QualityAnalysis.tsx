/**
 * 内容质量分析面板组件
 * 任务10.2.4：内容质量分析面板 - 关键词密度可视化图表、字数分布统计图
 */

'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Info,
  Hash,
  FileText,
  Eye,
  Zap
} from 'lucide-react';

export interface QualityMetrics {
  overall: number;
  seo: number;
  readability: number;
  originality: number;
  keywordOptimization: number;
  contentStructure: number;
}

export interface KeywordAnalysis {
  keyword: string;
  density: number;
  frequency: number;
  target: number;
  status: 'optimal' | 'low' | 'high' | 'over';
  positions: number[];
}

export interface ContentAnalysisData {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgSentencesPerParagraph: number;
  readabilityScore: number;
  seoScore: number;
  duplicateRate: number;
}

export interface QualityAnalysisProps {
  content?: any;
  metrics?: QualityMetrics;
  keywords?: KeywordAnalysis[];
  analysisData?: ContentAnalysisData;
  compact?: boolean;
  className?: string;
}

const QualityAnalysis: React.FC<QualityAnalysisProps> = ({
  content,
  metrics = {
    overall: 85,
    seo: 82,
    readability: 88,
    originality: 92,
    keywordOptimization: 78,
    contentStructure: 85
  },
  keywords = [
    { keyword: '游戏攻略', density: 2.5, frequency: 12, target: 2.0, status: 'optimal', positions: [1, 15, 28, 45] },
    { keyword: 'RPG游戏', density: 1.8, frequency: 8, target: 1.5, status: 'optimal', positions: [8, 22, 38] },
    { keyword: '角色扮演', density: 0.8, frequency: 4, target: 1.0, status: 'low', positions: [12, 35] },
    { keyword: '游戏评测', density: 3.2, frequency: 15, target: 2.5, status: 'high', positions: [5, 18, 31, 42] }
  ],
  analysisData = {
    wordCount: 1200,
    sentenceCount: 58,
    paragraphCount: 8,
    avgWordsPerSentence: 20.7,
    avgSentencesPerParagraph: 7.3,
    readabilityScore: 88,
    seoScore: 82,
    duplicateRate: 3.2
  },
  compact = false,
  className = ''
}) => {
  // 计算整体质量等级
  const qualityLevel = useMemo(() => {
    if (metrics.overall >= 90) return { label: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
    if (metrics.overall >= 80) return { label: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (metrics.overall >= 70) return { label: '一般', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: '需改进', color: 'text-red-600', bg: 'bg-red-100' };
  }, [metrics.overall]);

  // 关键词状态配置
  const getKeywordStatusConfig = (status: string) => {
    switch (status) {
      case 'optimal':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: '最佳' };
      case 'low':
        return { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', label: '偏低' };
      case 'high':
        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', label: '偏高' };
      case 'over':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', label: '过高' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-100', label: '未知' };
    }
  };

  // 计算关键词密度图表数据
  const keywordChartData = useMemo(() => {
    return keywords.map(kw => ({
      ...kw,
      percentage: (kw.density / Math.max(...keywords.map(k => k.density))) * 100
    }));
  }, [keywords]);

  if (compact) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            质量分析
          </h4>
          <Badge variant={qualityLevel.label === '优秀' ? 'success' : qualityLevel.label === '良好' ? 'primary' : 'warning'}>
            {qualityLevel.label} {metrics.overall}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-700">{metrics.seo}</div>
            <div className="text-xs text-gray-500">SEO分数</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-700">{metrics.readability}</div>
            <div className="text-xs text-gray-500">可读性</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-700">{metrics.originality}</div>
            <div className="text-xs text-gray-500">原创性</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 整体质量概览 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            质量分析概览
          </h3>
          <div className={`px-3 py-1 rounded-full ${qualityLevel.bg}`}>
            <span className={`text-sm font-medium ${qualityLevel.color}`}>
              {qualityLevel.label} {metrics.overall}分
            </span>
          </div>
        </div>

        {/* 质量指标 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Target className="h-4 w-4" />
                SEO优化
              </span>
              <span className="text-sm font-medium">{metrics.seo}</span>
            </div>
            <ProgressBar value={metrics.seo} variant="primary" size="sm" showValue={false} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Eye className="h-4 w-4" />
                可读性
              </span>
              <span className="text-sm font-medium">{metrics.readability}</span>
            </div>
            <ProgressBar value={metrics.readability} variant="success" size="sm" showValue={false} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Zap className="h-4 w-4" />
                原创性
              </span>
              <span className="text-sm font-medium">{metrics.originality}</span>
            </div>
            <ProgressBar value={metrics.originality} variant="success" size="sm" showValue={false} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Hash className="h-4 w-4" />
                关键词优化
              </span>
              <span className="text-sm font-medium">{metrics.keywordOptimization}</span>
            </div>
            <ProgressBar value={metrics.keywordOptimization} variant="warning" size="sm" showValue={false} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <FileText className="h-4 w-4" />
                内容结构
              </span>
              <span className="text-sm font-medium">{metrics.contentStructure}</span>
            </div>
            <ProgressBar value={metrics.contentStructure} variant="primary" size="sm" showValue={false} />
          </div>
        </div>
      </Card>

      {/* 关键词密度分析 */}
      <Card className="p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Hash className="h-4 w-4" />
          关键词密度分析
        </h4>

        <div className="space-y-4">
          {keywordChartData.map((keyword, index) => {
            const statusConfig = getKeywordStatusConfig(keyword.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{keyword.keyword}</span>
                    <Badge variant={keyword.status === 'optimal' ? 'success' : keyword.status === 'low' ? 'primary' : 'warning'} size="sm">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{keyword.density}%</div>
                    <div className="text-xs text-gray-500">目标: {keyword.target}%</div>
                  </div>
                </div>

                {/* 密度条形图 */}
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        keyword.status === 'optimal' ? 'bg-green-500' :
                        keyword.status === 'low' ? 'bg-blue-500' :
                        keyword.status === 'high' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(keyword.percentage, 100)}%` }}
                    />
                  </div>
                  
                  {/* 目标线 */}
                  <div 
                    className="absolute top-0 w-0.5 h-2 bg-gray-600"
                    style={{ left: `${(keyword.target / Math.max(...keywords.map(k => k.density))) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>出现 {keyword.frequency} 次</span>
                  <span>位置: {keyword.positions.slice(0, 3).join(', ')}{keyword.positions.length > 3 ? '...' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 内容统计分析 */}
      <Card className="p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          内容统计分析
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 字数统计 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{analysisData.wordCount}</div>
            <div className="text-sm text-blue-600">总字数</div>
            <div className="text-xs text-gray-500 mt-1">推荐范围: 800-1200</div>
          </div>

          {/* 句子统计 */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{analysisData.sentenceCount}</div>
            <div className="text-sm text-green-600">句子数</div>
            <div className="text-xs text-gray-500 mt-1">平均 {analysisData.avgWordsPerSentence.toFixed(1)} 字/句</div>
          </div>

          {/* 段落统计 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{analysisData.paragraphCount}</div>
            <div className="text-sm text-purple-600">段落数</div>
            <div className="text-xs text-gray-500 mt-1">平均 {analysisData.avgSentencesPerParagraph.toFixed(1)} 句/段</div>
          </div>

          {/* 重复率 */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{analysisData.duplicateRate}%</div>
            <div className="text-sm text-yellow-600">重复率</div>
            <div className="text-xs text-gray-500 mt-1">建议 &lt; 5%</div>
          </div>
        </div>

        {/* 质量建议 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">优化建议</h5>
          <div className="space-y-2 text-sm text-gray-600">
            {metrics.keywordOptimization < 80 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>建议优化关键词分布，提高关键词在标题和首段的出现频率</span>
              </div>
            )}
            {analysisData.avgWordsPerSentence > 25 && (
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>句子偏长，建议将复杂句子拆分为更简洁的表达</span>
              </div>
            )}
            {analysisData.duplicateRate > 5 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>重复内容较多，建议增加原创性表达</span>
              </div>
            )}
            {metrics.overall >= 85 && (
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>内容质量良好，符合SEO优化标准</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QualityAnalysis; 