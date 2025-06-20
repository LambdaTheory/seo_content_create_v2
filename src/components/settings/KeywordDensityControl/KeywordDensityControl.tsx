/**
 * 关键词密度调节器组件
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  KeywordDensityControlProps,
  DensityValue,
  DensityLevel,
  DensityRecommendation
} from './KeywordDensityControl.types';

export const KeywordDensityControl: React.FC<KeywordDensityControlProps> = ({
  id,
  label,
  description,
  value,
  config,
  onChange,
  error,
  warning,
  className = '',
  showAdvanced = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));

  // 定义密度等级
  const densityLevels: DensityLevel[] = useMemo(() => [
    { min: 0, max: 1, label: '极低', color: 'text-blue-600', description: '可能不利于SEO' },
    { min: 1, max: 2.5, label: '适中', color: 'text-green-600', description: '推荐范围' },
    { min: 2.5, max: 4, label: '较高', color: 'text-yellow-600', description: '需要注意自然度' },
    { min: 4, max: 6, label: '过高', color: 'text-orange-600', description: '可能被视为垃圾内容' },
    { min: 6, max: 100, label: '危险', color: 'text-red-600', description: '严重影响SEO' }
  ], []);

  // 获取密度等级
  const getDensityLevel = useCallback((density: number): DensityLevel => {
    return densityLevels.find(level => density >= level.min && density < level.max) || densityLevels[0];
  }, [densityLevels]);

  // 生成密度建议
  const generateRecommendations = useCallback((): DensityRecommendation[] => {
    const recommendations: DensityRecommendation[] = [];

    // 主关键词建议
    const mainLevel = getDensityLevel(value.mainKeyword.target);
    if (value.mainKeyword.target < 1.5) {
      recommendations.push({
        keywordType: 'main',
        currentValue: value.mainKeyword.target,
        recommendedRange: { min: 1.5, max: 3.0 },
        suggestion: '主关键词密度过低，建议增加到1.5-3.0%之间',
        severity: 'warning'
      });
    } else if (value.mainKeyword.target > 4.0) {
      recommendations.push({
        keywordType: 'main',
        currentValue: value.mainKeyword.target,
        recommendedRange: { min: 1.5, max: 3.0 },
        suggestion: '主关键词密度过高，可能影响SEO效果',
        severity: 'error'
      });
    }

    // 长尾关键词建议
    if (value.longTailKeywords.target > value.mainKeyword.target) {
      recommendations.push({
        keywordType: 'longTail',
        currentValue: value.longTailKeywords.target,
        recommendedRange: { min: 0.5, max: value.mainKeyword.target },
        suggestion: '长尾关键词密度不应超过主关键词密度',
        severity: 'warning'
      });
    }

    // 相关关键词建议
    if (value.relatedKeywords && value.relatedKeywords.target > 2.0) {
      recommendations.push({
        keywordType: 'related',
        currentValue: value.relatedKeywords.target,
        recommendedRange: { min: 0.5, max: 2.0 },
        suggestion: '相关关键词密度过高，建议控制在2%以下',
        severity: 'warning'
      });
    }

    return recommendations;
  }, [value, getDensityLevel]);

  // 更新密度值
  const updateDensityValue = useCallback((
    keywordType: 'mainKeyword' | 'longTailKeywords' | 'relatedKeywords',
    field: 'target' | 'min' | 'max',
    newValue: number
  ) => {
    const clampedValue = Math.max(config.minDensity, Math.min(config.maxDensity, newValue));
    
    onChange({
      ...value,
      [keywordType]: {
        ...value[keywordType],
        [field]: clampedValue
      }
    });
  }, [value, onChange, config]);

  // 更新布尔设置
  const updateBooleanSetting = useCallback((
    field: 'naturalDistribution' | 'useVariations' | 'contextualRelevance',
    newValue: boolean
  ) => {
    onChange({
      ...value,
      [field]: newValue
    });
  }, [value, onChange]);

  // 应用预设
  const applyPreset = useCallback((keywordType: 'mainKeyword' | 'longTailKeywords' | 'relatedKeywords', presetValue: DensityValue) => {
    onChange({
      ...value,
      [keywordType]: presetValue
    });
  }, [value, onChange]);

  // 切换展开状态
  const toggleSection = useCallback((section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  }, [expandedSections]);

  const recommendations = generateRecommendations();

  return (
    <div className={`keyword-density-control ${className}`}>
      {/* 标签和描述 */}
      <div className="control-header mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mb-2">{description}</p>
        )}
      </div>

      {/* 主关键词密度 */}
      <div className="keyword-section mb-6">
        <div className="section-header flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">主关键词密度</h4>
          <span className={`text-xs font-medium ${getDensityLevel(value.mainKeyword.target).color}`}>
            {getDensityLevel(value.mainKeyword.target).label}
          </span>
        </div>

        <div className="density-inputs grid grid-cols-3 gap-3 mb-3">
          <div className="input-group">
            <label className="block text-xs text-gray-600 mb-1">目标值 (%)</label>
            <input
              type="number"
              value={value.mainKeyword.target}
              onChange={(e) => updateDensityValue('mainKeyword', 'target', parseFloat(e.target.value) || 0)}
              min={config.minDensity}
              max={config.maxDensity}
              step={config.step}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="input-group">
            <label className="block text-xs text-gray-600 mb-1">最小值 (%)</label>
            <input
              type="number"
              value={value.mainKeyword.min}
              onChange={(e) => updateDensityValue('mainKeyword', 'min', parseFloat(e.target.value) || 0)}
              min={config.minDensity}
              max={value.mainKeyword.target}
              step={config.step}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="input-group">
            <label className="block text-xs text-gray-600 mb-1">最大值 (%)</label>
            <input
              type="number"
              value={value.mainKeyword.max}
              onChange={(e) => updateDensityValue('mainKeyword', 'max', parseFloat(e.target.value) || 0)}
              min={value.mainKeyword.target}
              max={config.maxDensity}
              step={config.step}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 密度级别指示器 */}
        <div className="density-indicator mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-orange-500 to-red-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, (value.mainKeyword.target / 8) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>{value.mainKeyword.target.toFixed(1)}%</span>
            <span>8%+</span>
          </div>
        </div>

        {/* 快速预设 */}
        {config.presets && config.presets.length > 0 && (
          <div className="preset-buttons">
            <div className="text-xs text-gray-600 mb-2">快速设置:</div>
            <div className="flex flex-wrap gap-2">
              {config.presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyPreset('mainKeyword', preset.value)}
                  className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 长尾关键词密度 */}
      <div className="keyword-section mb-6">
        <button
          onClick={() => toggleSection('longTail')}
          className="w-full flex items-center justify-between text-left mb-3 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
        >
          <h4 className="text-sm font-medium text-gray-700">长尾关键词密度</h4>
          <svg
            className={`w-4 h-4 transition-transform ${expandedSections.has('longTail') ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.has('longTail') && (
          <div className="density-inputs grid grid-cols-3 gap-3">
            <div className="input-group">
              <label className="block text-xs text-gray-600 mb-1">目标值 (%)</label>
              <input
                type="number"
                value={value.longTailKeywords.target}
                onChange={(e) => updateDensityValue('longTailKeywords', 'target', parseFloat(e.target.value) || 0)}
                min={config.minDensity}
                max={config.maxDensity}
                step={config.step}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="input-group">
              <label className="block text-xs text-gray-600 mb-1">最小值 (%)</label>
              <input
                type="number"
                value={value.longTailKeywords.min}
                onChange={(e) => updateDensityValue('longTailKeywords', 'min', parseFloat(e.target.value) || 0)}
                min={config.minDensity}
                max={value.longTailKeywords.target}
                step={config.step}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="input-group">
              <label className="block text-xs text-gray-600 mb-1">最大值 (%)</label>
              <input
                type="number"
                value={value.longTailKeywords.max}
                onChange={(e) => updateDensityValue('longTailKeywords', 'max', parseFloat(e.target.value) || 0)}
                min={value.longTailKeywords.target}
                max={config.maxDensity}
                step={config.step}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* 相关关键词密度 */}
      {value.relatedKeywords && (
        <div className="keyword-section mb-6">
          <button
            onClick={() => toggleSection('related')}
            className="w-full flex items-center justify-between text-left mb-3 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
          >
            <h4 className="text-sm font-medium text-gray-700">相关关键词密度</h4>
            <svg
              className={`w-4 h-4 transition-transform ${expandedSections.has('related') ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has('related') && (
            <div className="density-inputs grid grid-cols-3 gap-3">
              <div className="input-group">
                <label className="block text-xs text-gray-600 mb-1">目标值 (%)</label>
                <input
                  type="number"
                  value={value.relatedKeywords.target}
                  onChange={(e) => updateDensityValue('relatedKeywords', 'target', parseFloat(e.target.value) || 0)}
                  min={config.minDensity}
                  max={config.maxDensity}
                  step={config.step}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="input-group">
                <label className="block text-xs text-gray-600 mb-1">最小值 (%)</label>
                <input
                  type="number"
                  value={value.relatedKeywords.min}
                  onChange={(e) => updateDensityValue('relatedKeywords', 'min', parseFloat(e.target.value) || 0)}
                  min={config.minDensity}
                  max={value.relatedKeywords.target}
                  step={config.step}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="input-group">
                <label className="block text-xs text-gray-600 mb-1">最大值 (%)</label>
                <input
                  type="number"
                  value={value.relatedKeywords.max}
                  onChange={(e) => updateDensityValue('relatedKeywords', 'max', parseFloat(e.target.value) || 0)}
                  min={value.relatedKeywords.target}
                  max={config.maxDensity}
                  step={config.step}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 高级选项 */}
      {showAdvanced && (
        <div className="advanced-options mb-6">
          <button
            onClick={() => toggleSection('advanced')}
            className="w-full flex items-center justify-between text-left mb-3 p-2 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
          >
            <h4 className="text-sm font-medium text-blue-700">高级选项</h4>
            <svg
              className={`w-4 h-4 transition-transform ${expandedSections.has('advanced') ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has('advanced') && (
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="naturalDistribution"
                  checked={value.naturalDistribution}
                  onChange={(e) => updateBooleanSetting('naturalDistribution', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="naturalDistribution" className="ml-2 text-sm text-gray-700">
                  自然分布控制
                  <span className="block text-xs text-gray-500">确保关键词在内容中自然分布</span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useVariations"
                  checked={value.useVariations}
                  onChange={(e) => updateBooleanSetting('useVariations', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="useVariations" className="ml-2 text-sm text-gray-700">
                  使用关键词变体
                  <span className="block text-xs text-gray-500">包含同义词和相关变体</span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="contextualRelevance"
                  checked={value.contextualRelevance}
                  onChange={(e) => updateBooleanSetting('contextualRelevance', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="contextualRelevance" className="ml-2 text-sm text-gray-700">
                  上下文相关性
                  <span className="block text-xs text-gray-500">确保关键词与上下文语义相关</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 密度建议 */}
      {config.showRecommendations && recommendations.length > 0 && (
        <div className="recommendations mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">密度建议</h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  rec.severity === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
                  rec.severity === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                  'bg-blue-50 border-blue-400 text-blue-700'
                }`}
              >
                <div className="flex items-start">
                  <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">
                      {rec.keywordType === 'main' ? '主关键词' : 
                       rec.keywordType === 'longTail' ? '长尾关键词' : '相关关键词'}
                    </p>
                    <p className="text-xs mt-1">{rec.suggestion}</p>
                    <p className="text-xs mt-1 opacity-75">
                      推荐范围: {rec.recommendedRange.min}% - {rec.recommendedRange.max}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 错误和警告信息 */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {warning && !error && (
        <div className="mt-2 text-sm text-yellow-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {warning}
        </div>
      )}
    </div>
  );
};

export default KeywordDensityControl; 