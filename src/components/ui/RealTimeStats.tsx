/**
 * 实时统计显示组件
 * 任务10.2.3：添加进度显示组件 - 实时字数统计、关键词密度监控、内容质量评分显示
 */

'use client';

import React from 'react';
import { Badge } from './Badge';
import { Card } from './Card';
import ProgressBar from './ProgressBar';
import { 
  FileText, 
  Target, 
  BarChart3, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';

export interface RealTimeStatsProps {
  stats: {
    wordCount?: {
      current: number;
      target: number;
      min: number;
      max: number;
    };
    keywordDensity?: {
      main: number;
      target: number;
      secondary?: number;
    };
    qualityScore?: {
      overall: number;
      seo: number;
      readability: number;
      originality: number;
    };
    progress?: {
      processed: number;
      total: number;
      speed?: number; // 每分钟处理数
    };
    timing?: {
      elapsed: number; // 已用时间(秒)
      estimated: number; // 预估剩余时间(秒)
    };
  };
  showAll?: boolean;
  compact?: boolean;
  className?: string;
}

const RealTimeStats: React.FC<RealTimeStatsProps> = ({
  stats,
  showAll = true,
  compact = false,
  className = ''
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordCountStatus = () => {
    if (!stats.wordCount) return 'secondary';
    const { current, min, max } = stats.wordCount;
    if (current >= min && current <= max) return 'success';
    if (current < min) return 'warning';
    return 'danger';
  };

  const getDensityStatus = () => {
    if (!stats.keywordDensity) return 'secondary';
    const { main, target } = stats.keywordDensity;
    const diff = Math.abs(main - target);
    if (diff <= 0.3) return 'success';
    if (diff <= 0.8) return 'warning';
    return 'danger';
  };

  const getQualityStatus = () => {
    if (!stats.qualityScore) return 'secondary';
    const { overall } = stats.qualityScore;
    if (overall >= 85) return 'success';
    if (overall >= 70) return 'warning';
    return 'danger';
  };

  if (compact) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {stats.wordCount && (
          <Badge variant={getWordCountStatus()} size="sm">
            <FileText className="h-3 w-3 mr-1" />
            {stats.wordCount.current}字
          </Badge>
        )}
        {stats.keywordDensity && (
          <Badge variant={getDensityStatus()} size="sm">
            <Target className="h-3 w-3 mr-1" />
            {stats.keywordDensity.main.toFixed(1)}%
          </Badge>
        )}
        {stats.qualityScore && (
          <Badge variant={getQualityStatus()} size="sm">
            <BarChart3 className="h-3 w-3 mr-1" />
            {stats.qualityScore.overall}分
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 字数统计 */}
      {showAll && stats.wordCount && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">字数统计</h4>
            </div>
            <Badge variant={getWordCountStatus()}>
              {stats.wordCount.current} / {stats.wordCount.target}
            </Badge>
          </div>
          <ProgressBar
            value={stats.wordCount.current}
            max={stats.wordCount.target}
            variant={getWordCountStatus() === 'success' ? 'success' : 
                    getWordCountStatus() === 'warning' ? 'warning' : 'danger'}
            showValue={false}
            animated={true}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>最小: {stats.wordCount.min}</span>
            <span>目标: {stats.wordCount.target}</span>
            <span>最大: {stats.wordCount.max}</span>
          </div>
        </Card>
      )}

      {/* 关键词密度 */}
      {showAll && stats.keywordDensity && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-900">关键词密度</h4>
            </div>
            <Badge variant={getDensityStatus()}>
              {stats.keywordDensity.main.toFixed(1)}%
            </Badge>
          </div>
          <div className="space-y-2">
            <ProgressBar
              value={stats.keywordDensity.main}
              max={stats.keywordDensity.target * 2}
              variant={getDensityStatus() === 'success' ? 'success' : 
                      getDensityStatus() === 'warning' ? 'warning' : 'danger'}
              label="主关键词"
              showValue={false}
              animated={true}
            />
            {stats.keywordDensity.secondary && (
              <ProgressBar
                value={stats.keywordDensity.secondary}
                max={stats.keywordDensity.target}
                variant="info"
                label="次要关键词"
                showValue={true}
                size="sm"
              />
            )}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            目标密度: {stats.keywordDensity.target}%
          </div>
        </Card>
      )}

      {/* 质量评分 */}
      {showAll && stats.qualityScore && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">质量评分</h4>
            </div>
            <Badge variant={getQualityStatus()}>
              {stats.qualityScore.overall}分
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {stats.qualityScore.overall}
              </span>
              <div className="flex items-center gap-1">
                {stats.qualityScore.overall >= 85 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-sm text-gray-500">
                  {stats.qualityScore.overall >= 85 ? '优秀' : 
                   stats.qualityScore.overall >= 70 ? '良好' : '需改进'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">{stats.qualityScore.seo}</div>
                <div className="text-gray-500">SEO</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">{stats.qualityScore.readability}</div>
                <div className="text-gray-500">可读性</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">{stats.qualityScore.originality}</div>
                <div className="text-gray-500">原创性</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 处理进度 */}
      {showAll && stats.progress && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <h4 className="font-medium text-gray-900">处理进度</h4>
            </div>
            <Badge variant="primary">
              {stats.progress.processed} / {stats.progress.total}
            </Badge>
          </div>
          <ProgressBar
            value={stats.progress.processed}
            max={stats.progress.total}
            variant="primary"
            showValue={true}
            animated={true}
          />
          {stats.progress.speed && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <Zap className="h-4 w-4" />
              <span>处理速度: {stats.progress.speed}/分钟</span>
            </div>
          )}
        </Card>
      )}

      {/* 时间统计 */}
      {showAll && stats.timing && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h4 className="font-medium text-gray-900">时间统计</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">已用时间</div>
              <div className="font-medium text-gray-900">
                {formatTime(stats.timing.elapsed)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">预估剩余</div>
              <div className="font-medium text-gray-900">
                {formatTime(stats.timing.estimated)}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RealTimeStats; 