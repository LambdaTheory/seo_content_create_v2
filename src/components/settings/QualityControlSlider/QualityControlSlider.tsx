/**
 * 质量控制滑块组件 - 简化版本
 */

import React from 'react';
import { QualityControlSliderProps } from './QualityControlSlider.types';

export const QualityControlSlider: React.FC<QualityControlSliderProps> = ({
  id = 'quality-control',
  label,
  description,
  value,
  onChange,
  error,
  warning,
  className = '',
  disabled = false,
}) => {
  // 处理数值类型的安全转换
  const getNumericValue = (val: any): number => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof val === 'boolean') return val ? 1 : 0;
    return 0;
  };

  // 简化的质量控制参数
  const qualityControls = [
    {
      key: 'targetAudience',
      label: '目标受众',
      description: '内容的目标用户群体',
      icon: '👥',
      options: [
        { value: 'children', label: '儿童' },
        { value: 'teens', label: '青少年' },
        { value: 'adults', label: '成年人' },
        { value: 'gamers', label: '游戏玩家' },
        { value: 'casual', label: '休闲用户' },
        { value: 'all', label: '全年龄' }
      ]
    },
    {
      key: 'readabilityLevel',
      label: '可读性级别',
      description: '内容的阅读难度',
      icon: '📖',
      options: [
        { value: 'beginner', label: '初级' },
        { value: 'intermediate', label: '中级' },
        { value: 'advanced', label: '高级' }
      ]
    },
    {
      key: 'professionalTone',
      label: '专业性程度',
      description: '内容的专业性和正式程度',
      icon: '💼',
      type: 'boolean'
    },
    {
      key: 'creativeFreedom',
      label: '创意自由度',
      description: '允许的创意和个性化程度',
      icon: '🎨',
      type: 'boolean'
    },
    {
      key: 'emotionalTone',
      label: '情感色彩',
      description: '内容传达的情感基调',
      icon: '😊',
      options: [
        { value: 'neutral', label: '中性' },
        { value: 'excited', label: '兴奋' },
        { value: 'friendly', label: '友好' },
        { value: 'professional', label: '专业' },
        { value: 'playful', label: '愉快' }
      ]
    },
    {
      key: 'languageStyle',
      label: '语言风格',
      description: '内容的表达方式',
      icon: '✍️',
      options: [
        { value: 'formal', label: '正式' },
        { value: 'conversational', label: '对话式' },
        { value: 'descriptive', label: '描述性' },
        { value: 'action-oriented', label: '行动导向' }
      ]
    }
  ];

  const handleChange = (key: string, newValue: any) => {
    const updatedValue = {
      ...value,
      [key]: newValue
    };
    onChange(updatedValue);
  };

  return (
    <div className={`quality-control-slider ${className}`}>
      {/* 标题 */}
      <div className="mb-6">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>

      {/* 控制项 */}
      <div className="space-y-6">
        {qualityControls.map((control) => (
          <div key={control.key} className="control-item">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">{control.icon}</span>
              <label className="text-sm font-medium text-gray-700">
                {control.label}
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-2">{control.description}</p>

            {control.type === 'boolean' ? (
              // 布尔开关
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={Boolean(value[control.key as keyof typeof value])}
                  onChange={(e) => handleChange(control.key, e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {Boolean(value[control.key as keyof typeof value]) ? '启用' : '禁用'}
                </span>
              </label>
            ) : control.options ? (
              // 选择器
              <select
                value={value[control.key as keyof typeof value] as string || control.options[0].value}
                onChange={(e) => handleChange(control.key, e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {control.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              // 数值输入
              <input
                type="number"
                value={getNumericValue(value[control.key as keyof typeof value])}
                onChange={(e) => handleChange(control.key, Number(e.target.value))}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        ))}
      </div>

      {/* 错误和警告 */}
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