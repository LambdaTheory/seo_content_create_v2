/**
 * 质量控制滑块组件
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  QualityControlSliderProps, 
  QualityMetric, 
  QualityScore, 
  QualityRating,
  QualityPreset,
  SliderChangeEvent
} from './QualityControlSlider.types';
import { QualityParameters } from '@/types/ContentSettings.types';

export const QualityControlSlider: React.FC<QualityControlSliderProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  metrics,
  showPresets = true,
  presets,
  showScore = true,
  error,
  warning,
  className = '',
  disabled = false,
  layout = 'vertical',
  compact = false
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // 默认质量指标配置
  const defaultMetrics: QualityMetric[] = useMemo(() => [
    {
      key: 'contentCompleteness',
      name: '内容完整性',
      description: '内容覆盖的完整程度和深度',
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 80,
      unit: '%',
      icon: '📝',
      color: 'primary',
      recommendedRange: [70, 90],
      riskThreshold: 60
    },
    {
      key: 'readability',
      name: '可读性',
      description: '内容的易读性和用户体验',
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 75,
      unit: '%',
      icon: '👀',
      color: 'success',
      recommendedRange: [70, 85],
      riskThreshold: 60
    },
    {
      key: 'seoOptimization',
      name: 'SEO优化度',
      description: '搜索引擎优化的程度',
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 85,
      unit: '%',
      icon: '🔍',
      color: 'warning',
      recommendedRange: [75, 95],
      riskThreshold: 70
    },
    {
      key: 'uniqueness',
      name: '原创性',
      description: '内容的独特性和原创度',
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 90,
      unit: '%',
      icon: '✨',
      color: 'secondary',
      recommendedRange: [85, 95],
      riskThreshold: 80
    },
    {
      key: 'relevance',
      name: '相关性',
      description: '内容与主题的相关程度',
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 88,
      unit: '%',
      icon: '🎯',
      color: 'danger',
      recommendedRange: [80, 95],
      riskThreshold: 75
    }
  ], []);

  // 默认预设配置
  const defaultPresets: QualityPreset[] = useMemo(() => [
    {
      id: 'balanced',
      name: '平衡模式',
      description: '平衡各项指标，适合大多数场景',
      icon: '⚖️',
      recommended: true,
      parameters: {
        contentCompleteness: 80,
        readability: 75,
        seoOptimization: 85,
        uniqueness: 90,
        relevance: 88
      }
    },
    {
      id: 'seo-focused',
      name: 'SEO优化',
      description: '突出SEO优化，适合竞争激烈的关键词',
      icon: '🚀',
      recommended: false,
      parameters: {
        contentCompleteness: 85,
        readability: 70,
        seoOptimization: 95,
        uniqueness: 85,
        relevance: 90
      }
    },
    {
      id: 'user-friendly',
      name: '用户友好',
      description: '强调用户体验和可读性',
      icon: '👥',
      recommended: false,
      parameters: {
        contentCompleteness: 75,
        readability: 90,
        seoOptimization: 75,
        uniqueness: 95,
        relevance: 85
      }
    }
  ], []);

  const qualityMetrics = metrics || defaultMetrics;
  const qualityPresets = presets || defaultPresets;

  // 计算质量评分
  const calculateQualityScore = useCallback((params: QualityParameters): QualityScore => {
    const scores = {} as { [K in keyof QualityParameters]: number };
    let totalScore = 0;
    let maxScore = 0;

    qualityMetrics.forEach(metric => {
      const value = params[metric.key] as number;
      const weight = 1; // 可以根据指标重要性调整权重
      const score = (value / metric.max) * 100 * weight;
      scores[metric.key] = score;
      totalScore += score;
      maxScore += 100 * weight;
    });

    const finalScore = (totalScore / maxScore) * 100;
    
    // 计算评级
    let rating: QualityRating;
    if (finalScore >= 90) rating = QualityRating.EXCELLENT;
    else if (finalScore >= 75) rating = QualityRating.GOOD;
    else if (finalScore >= 60) rating = QualityRating.FAIR;
    else rating = QualityRating.POOR;

    // 生成建议
    const suggestions: string[] = [];
    qualityMetrics.forEach(metric => {
      const value = params[metric.key] as number;
      if (metric.riskThreshold && value < metric.riskThreshold) {
        suggestions.push(`建议提高${metric.name}至${metric.riskThreshold}%以上`);
      }
      if (metric.recommendedRange && (value < metric.recommendedRange[0] || value > metric.recommendedRange[1])) {
        suggestions.push(`${metric.name}建议范围：${metric.recommendedRange[0]}%-${metric.recommendedRange[1]}%`);
      }
    });

    return {
      total: Math.round(finalScore),
      rating,
      scores,
      suggestions
    };
  }, [qualityMetrics]);

  const qualityScore = useMemo(() => calculateQualityScore(value), [value, calculateQualityScore]);

  // 处理滑块变化
  const handleSliderChange = useCallback((metric: keyof QualityParameters, newValue: number) => {
    const oldValue = value[metric] as number;
    const newParams = { ...value, [metric]: newValue };
    
    const event: SliderChangeEvent = {
      metric,
      value: newValue,
      oldValue,
      fullParams: newParams
    };

    onChange(newParams);
  }, [value, onChange]);

  // 应用预设
  const applyPreset = useCallback((presetId: string) => {
    const preset = qualityPresets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      onChange(preset.parameters);
    }
  }, [qualityPresets, onChange]);

  // 获取滑块颜色类
  const getSliderColorClass = (metric: QualityMetric, value: number) => {
    const colorMap = {
      primary: 'accent-blue-500',
      secondary: 'accent-purple-500',
      success: 'accent-green-500',
      warning: 'accent-yellow-500',
      danger: 'accent-red-500'
    };

    return colorMap[metric.color] || 'accent-gray-500';
  };

  // 获取值状态样式
  const getValueStatus = (metric: QualityMetric, value: number) => {
    if (metric.riskThreshold && value < metric.riskThreshold) {
      return 'text-red-600 bg-red-50';
    }
    if (metric.recommendedRange) {
      const [min, max] = metric.recommendedRange;
      if (value >= min && value <= max) {
        return 'text-green-600 bg-green-50';
      }
      if (value < min || value > max) {
        return 'text-yellow-600 bg-yellow-50';
      }
    }
    return 'text-gray-600 bg-gray-50';
  };

  // 渲染质量评分
  const renderQualityScore = () => {
    if (!showScore) return null;

    const ratingColors = {
      [QualityRating.POOR]: 'text-red-600 bg-red-100',
      [QualityRating.FAIR]: 'text-yellow-600 bg-yellow-100',
      [QualityRating.GOOD]: 'text-green-600 bg-green-100',
      [QualityRating.EXCELLENT]: 'text-blue-600 bg-blue-100'
    };

    const ratingLabels = {
      [QualityRating.POOR]: '较差',
      [QualityRating.FAIR]: '一般',
      [QualityRating.GOOD]: '良好',
      [QualityRating.EXCELLENT]: '优秀'
    };

    return (
      <div className="quality-score mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">质量评分</h4>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">{qualityScore.total}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ratingColors[qualityScore.rating]}`}>
              {ratingLabels[qualityScore.rating]}
            </span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              qualityScore.total >= 90 ? 'bg-green-500' :
              qualityScore.total >= 75 ? 'bg-blue-500' :
              qualityScore.total >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${qualityScore.total}%` }}
          />
        </div>

        {/* 建议 */}
        {qualityScore.suggestions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">优化建议：</p>
            <ul className="space-y-1">
              {qualityScore.suggestions.slice(0, 3).map((suggestion, index) => (
                <li key={index} className="text-xs text-gray-500 flex items-start">
                  <span className="text-yellow-500 mr-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // 渲染预设选择器
  const renderPresets = () => {
    if (!showPresets) return null;

    return (
      <div className="presets-section mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">质量预设</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {qualityPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => applyPreset(preset.id)}
              className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                selectedPreset === preset.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
            >
              <div className="flex items-center mb-1">
                <span className="text-lg mr-2">{preset.icon}</span>
                <span className="text-sm font-medium">{preset.name}</span>
                {preset.recommended && (
                  <span className="ml-1 text-xs">⭐</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 渲染滑块组
  const renderSliders = () => {
    const containerClass = layout === 'grid' 
      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
      : layout === 'horizontal' 
      ? 'flex flex-wrap gap-4'
      : 'space-y-4';

    return (
      <div className={`sliders-container ${containerClass}`}>
        {qualityMetrics.map((metric) => {
          const currentValue = value[metric.key] as number;
          const status = getValueStatus(metric, currentValue);

          return (
            <div key={metric.key} className={`slider-item ${layout === 'horizontal' ? 'flex-1 min-w-64' : ''}`}>
              {/* 标签和值 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{metric.icon}</span>
                  <label className="text-sm font-medium text-gray-700">
                    {metric.name}
                  </label>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${status}`}>
                  {currentValue}{metric.unit}
                </div>
              </div>

              {/* 滑块 */}
              <div className="slider-wrapper">
                <input
                  type="range"
                  id={`${id}-${metric.key}`}
                  min={metric.min}
                  max={metric.max}
                  step={metric.step}
                  value={currentValue}
                  disabled={disabled}
                  onChange={(e) => handleSliderChange(metric.key, Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${getSliderColorClass(metric, currentValue)} ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />

                {/* 推荐范围指示器 */}
                {metric.recommendedRange && !compact && (
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>{metric.min}</span>
                    <span className="text-green-600">
                      推荐: {metric.recommendedRange[0]}-{metric.recommendedRange[1]}
                    </span>
                    <span>{metric.max}</span>
                  </div>
                )}
              </div>

              {/* 描述 */}
              {!compact && (
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`quality-control-slider ${className}`}>
      {/* 标签和描述 */}
      <div className="header mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>

      {/* 质量评分 */}
      {renderQualityScore()}

      {/* 预设选择器 */}
      {renderPresets()}

      {/* 滑块组 */}
      {renderSliders()}

      {/* 错误和警告信息 */}
      {error && (
        <div className="mt-4 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {warning && !error && (
        <div className="mt-4 text-sm text-yellow-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {warning}
        </div>
      )}
    </div>
  );
};

export default QualityControlSlider; 