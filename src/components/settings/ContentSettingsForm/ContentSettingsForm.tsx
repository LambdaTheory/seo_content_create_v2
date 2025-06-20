/**
 * 内容设置表单组件
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  ContentSettingsFormProps, 
  FormStep, 
  FormState, 
  FormStepConfig,
  FormValidationResult
} from './ContentSettingsForm.types';
import { 
  ContentSettings, 
  GenerationMode, 
  SEOParameters
} from '@/types/ContentSettings.types';

// 导入子组件
import { WordCountSlider } from '../WordCountSlider';
import { KeywordDensityControl } from '../KeywordDensityControl';
import { GenerationModeSelector } from '../GenerationModeSelector';
import { QualityControlSlider } from '../QualityControlSlider';

export const ContentSettingsForm: React.FC<ContentSettingsFormProps> = ({
  id,
  initialValue,
  presets = [],
  showPresets = true,
  showSteps = true,
  compact = false,
  onSubmit,
  onReset,
  onChange,
  onValidate,
  onPresetApplied,
  className = '',
  disabled = false,
  readonly = false
}) => {
  // 默认设置值
  const defaultSettings: ContentSettings = useMemo(() => ({
    id: '',
    name: '默认设置',
    description: '',
    wordCount: {
      total: { min: 800, max: 1200, target: 1000 },
      modules: {
        description: { min: 100, max: 200, target: 150 },
        features: { min: 200, max: 300, target: 250 },
        gameplay: { min: 80, max: 120, target: 100 },
        review: { min: 80, max: 120, target: 100 },
        faq: { min: 100, max: 200, target: 150 }
      }
    },
    keywordDensity: {
      mainKeyword: { min: 1.5, max: 3.0, target: 2.5 },
      longTailKeywords: { min: 0.3, max: 0.8, target: 0.5 },
      naturalDistribution: true,
      useVariations: true,
      contextualRelevance: true
    },
    generationMode: GenerationMode.STANDARD,
    qualityParams: {
      targetAudience: 'gamers',
      readabilityLevel: 'intermediate',
      professionalTone: true,
      creativeFreedom: false,
      emotionalTone: 'friendly',
      languageStyle: 'conversational'
    },
    seoParams: {
      titleOptimization: {
        includeMainKeyword: true,
        maxLength: 60,
        keywordPosition: 'beginning'
      },
      metaDescription: {
        includeMainKeyword: true,
        includeCTA: true,
        maxLength: 160
      },
      internalLinking: false,
      relatedGamesSuggestion: true,
      structuredDataGeneration: true
    },
    advanced: {
      concurrency: 3,
      retryAttempts: 2,
      timeout: 60,
      enableCaching: true,
      qualityCheckStrictness: 'medium'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPreset: false,
    isDefault: true
  }), []);

  // 表单状态
  const [formState, setFormState] = useState<FormState>({
    currentStep: FormStep.BASIC_SETTINGS,
    formData: initialValue || defaultSettings,
    validation: { isValid: true, errors: {}, warnings: {} },
    isSubmitting: false,
    hasUnsavedChanges: false
  });

  // 更新表单数据
  const updateFormData = useCallback((newData: Partial<ContentSettings>) => {
    setFormState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...newData },
      hasUnsavedChanges: true
    }));
    onChange?.(newData);
  }, [onChange]);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const completeSettings: ContentSettings = {
        ...defaultSettings,
        ...formState.formData,
                 id: formState.formData.id || `settings_${Date.now()}`,
         updatedAt: new Date().toISOString()
      };

      await onSubmit(completeSettings);
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        hasUnsavedChanges: false 
      }));
    } catch (error) {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      console.error('提交设置失败:', error);
    }
  }, [formState.formData, defaultSettings, onSubmit]);

  return (
    <div className={`content-settings-form ${className}`}>
      <div className="space-y-6">
        {/* 基础设置 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            设置名称
          </label>
          <input
            type="text"
            value={formState.formData.name || ''}
            onChange={(e) => updateFormData({ name: e.target.value })}
            disabled={disabled || readonly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入设置名称"
          />
        </div>

                 {/* 字数控制 */}
         <WordCountSlider
           label="总体字数控制"
           value={formState.formData.wordCount?.total || defaultSettings.wordCount.total}
           config={{
             absoluteMin: 100,
             absoluteMax: 3000,
             step: 50,
             showTarget: true
           }}
           onChange={(total) => updateFormData({ 
             wordCount: { 
               ...formState.formData.wordCount, 
               ...defaultSettings.wordCount,
               total 
             } 
           })}
           disabled={disabled || readonly}
         />

         {/* 关键词密度 */}
         <KeywordDensityControl
           label="关键词密度设置"
           value={formState.formData.keywordDensity || defaultSettings.keywordDensity}
           onChange={(keywordDensity) => updateFormData({ keywordDensity })}
           disabled={disabled || readonly}
         />

         {/* 生成模式 */}
         <GenerationModeSelector
           label="生成模式选择"
           value={formState.formData.generationMode || defaultSettings.generationMode}
           onChange={(generationMode) => updateFormData({ generationMode })}
           disabled={disabled || readonly}
         />

         {/* 质量控制 */}
         <QualityControlSlider
           label="质量控制参数"
           value={formState.formData.qualityParams || defaultSettings.qualityParams}
           onChange={(qualityParams) => updateFormData({ qualityParams })}
           disabled={disabled || readonly}
         />

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onReset}
            disabled={disabled || readonly || formState.isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            重置
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || readonly || formState.isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {formState.isSubmitting ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentSettingsForm; 