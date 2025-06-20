/**
 * 内容设置表单组件类型定义
 */

import { ContentSettings, PresetTemplate } from '@/types/ContentSettings.types';

/**
 * 表单步骤
 */
export enum FormStep {
  BASIC_SETTINGS = 'basic',
  WORD_COUNT = 'wordCount',
  KEYWORD_DENSITY = 'keywordDensity',
  GENERATION_MODE = 'generationMode',
  QUALITY_CONTROL = 'qualityControl',
  SEO_PARAMETERS = 'seoParameters',
  PREVIEW = 'preview'
}

/**
 * 表单验证结果
 */
export interface FormValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息 */
  errors: { [key: string]: string };
  /** 警告信息 */
  warnings: { [key: string]: string };
}

/**
 * 表单步骤配置
 */
export interface FormStepConfig {
  /** 步骤标识 */
  step: FormStep;
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  description: string;
  /** 图标 */
  icon: string;
  /** 是否必填 */
  required: boolean;
  /** 是否完成 */
  completed?: boolean;
  /** 是否有错误 */
  hasError?: boolean;
}

/**
 * 内容设置表单组件属性
 */
export interface ContentSettingsFormProps {
  /** 组件标识 */
  id?: string;
  /** 初始设置值 */
  initialValue?: Partial<ContentSettings>;
  /** 可用的预设模板 */
  presets?: PresetTemplate[];
  /** 是否显示预设选择器 */
  showPresets?: boolean;
  /** 是否显示步骤导航 */
  showSteps?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 表单提交回调 */
  onSubmit: (settings: ContentSettings) => void;
  /** 表单重置回调 */
  onReset?: () => void;
  /** 设置变化回调 */
  onChange?: (settings: Partial<ContentSettings>) => void;
  /** 验证回调 */
  onValidate?: (result: FormValidationResult) => void;
  /** 预设应用回调 */
  onPresetApplied?: (preset: PresetTemplate) => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readonly?: boolean;
}

/**
 * 表单状态
 */
export interface FormState {
  /** 当前步骤 */
  currentStep: FormStep;
  /** 表单数据 */
  formData: Partial<ContentSettings>;
  /** 验证结果 */
  validation: FormValidationResult;
  /** 是否正在提交 */
  isSubmitting: boolean;
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
  /** 应用的预设 */
  appliedPreset?: string;
}

/**
 * 表单动作
 */
export interface FormActions {
  /** 更新表单数据 */
  updateFormData: (data: Partial<ContentSettings>) => void;
  /** 设置当前步骤 */
  setCurrentStep: (step: FormStep) => void;
  /** 验证表单 */
  validateForm: () => void;
  /** 重置表单 */
  resetForm: () => void;
  /** 应用预设 */
  applyPreset: (presetId: string) => void;
  /** 下一步 */
  nextStep: () => void;
  /** 上一步 */
  previousStep: () => void;
  /** 跳转到指定步骤 */
  goToStep: (step: FormStep) => void;
} 