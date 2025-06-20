/**
 * 生成模式选择器组件
 */

import React, { useMemo } from 'react';
import { GenerationModeSelectorProps, GenerationModeOption } from './GenerationModeSelector.types';
import { GenerationMode } from '@/types/ContentSettings.types';

export const GenerationModeSelector: React.FC<GenerationModeSelectorProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  options,
  error,
  warning,
  className = '',
  disabled = false,
  displayMode = 'cards',
  showDetails = true
}) => {
  // 默认模式选项
  const defaultOptions: GenerationModeOption[] = useMemo(() => [
    {
      value: GenerationMode.STRICT,
      label: 'SEO优化模式',
      description: '严格优化SEO效果，适合竞争激烈的关键词',
      icon: '🎯',
      color: 'border-red-200 bg-red-50 text-red-700',
      recommended: false,
      features: [
        '高关键词密度控制',
        '严格的字数要求',
        '优化搜索排名',
        '结构化数据生成'
      ]
    },
    {
      value: GenerationMode.STANDARD,
      label: '平衡模式',
      description: '平衡SEO效果和用户体验，适合大多数场景',
      icon: '⚖️',
      color: 'border-green-200 bg-green-50 text-green-700',
      recommended: true,
      features: [
        '适中的关键词密度',
        '灵活的字数控制',
        'SEO与可读性平衡',
        '自然的内容风格'
      ]
    },
    {
      value: GenerationMode.CREATIVE,
      label: '创意模式',
      description: '注重创意和自然度，降低SEO约束',
      icon: '🎨',
      color: 'border-blue-200 bg-blue-50 text-blue-700',
      recommended: false,
      features: [
        '低关键词密度',
        '自由的内容风格',
        '强调用户体验',
        '创意优先表达'
      ]
    },
    {
      value: GenerationMode.CUSTOM,
      label: '自定义模式',
      description: '完全自定义所有参数，适合专业用户',
      icon: '⚙️',
      color: 'border-purple-200 bg-purple-50 text-purple-700',
      recommended: false,
      features: [
        '完全自定义控制',
        '高级参数调节',
        '专业用户专用',
        '无限制灵活性'
      ]
    }
  ], []);

  const modeOptions = options || defaultOptions;

  // 渲染卡片模式
  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {modeOptions.map((option) => (
        <div
          key={option.value}
          className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
            value === option.value
              ? `${option.color} border-opacity-100 shadow-md`
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && onChange(option.value)}
        >
          {/* 推荐标签 */}
          {option.recommended && (
            <div className="absolute -top-2 -right-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                推荐
              </span>
            </div>
          )}

          {/* 选中指示器 */}
          <div className="absolute top-3 right-3">
            <div className={`w-4 h-4 rounded-full border-2 ${
              value === option.value
                ? 'bg-current border-current'
                : 'border-gray-300'
            }`}>
              {value === option.value && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5" />
              )}
            </div>
          </div>

          {/* 图标和标题 */}
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-3">{option.icon}</span>
            <h3 className="text-lg font-medium text-gray-900">{option.label}</h3>
          </div>

          {/* 描述 */}
          {showDetails && (
            <>
              <p className="text-sm text-gray-600 mb-3">{option.description}</p>

              {/* 特性列表 */}
              <div className="space-y-1">
                {option.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-500">
                    <svg className="w-3 h-3 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );

  // 渲染列表模式
  const renderList = () => (
    <div className="space-y-3">
      {modeOptions.map((option) => (
        <div
          key={option.value}
          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            value === option.value
              ? `${option.color} border-opacity-100`
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && onChange(option.value)}
        >
          {/* 选中指示器 */}
          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
            value === option.value
              ? 'bg-current border-current'
              : 'border-gray-300'
          }`}>
            {value === option.value && (
              <div className="w-2 h-2 bg-white rounded-full m-0.5" />
            )}
          </div>

          {/* 图标 */}
          <span className="text-xl mr-3">{option.icon}</span>

          {/* 内容 */}
          <div className="flex-1">
            <div className="flex items-center">
              <h4 className="text-sm font-medium text-gray-900">{option.label}</h4>
              {option.recommended && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  推荐
                </span>
              )}
            </div>
            {showDetails && (
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // 渲染紧凑模式
  const renderCompact = () => (
    <div className="flex flex-wrap gap-2">
      {modeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            value === option.value
              ? `${option.color} border-opacity-100`
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
        >
          <span className="mr-2">{option.icon}</span>
          {option.label}
          {option.recommended && (
            <span className="ml-1 text-xs">⭐</span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`generation-mode-selector ${className}`}>
      {/* 标签和描述 */}
      <div className="selector-header mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mb-2">{description}</p>
        )}
      </div>

      {/* 模式选择器 */}
      <div className="mode-options">
        {displayMode === 'cards' && renderCards()}
        {displayMode === 'list' && renderList()}
        {displayMode === 'compact' && renderCompact()}
      </div>

      {/* 当前选择的详细信息 */}
      {displayMode === 'compact' && showDetails && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          {(() => {
            const selectedOption = modeOptions.find(opt => opt.value === value);
            return selectedOption ? (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {selectedOption.icon} {selectedOption.label}
                </h4>
                <p className="text-xs text-gray-600 mb-2">{selectedOption.description}</p>
                <div className="grid grid-cols-2 gap-1">
                  {selectedOption.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-500">
                      <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
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

export default GenerationModeSelector; 