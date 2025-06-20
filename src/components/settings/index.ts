/**
 * 内容设置组件统一导出
 */

// 字数控制滑块组件
export { WordCountSlider } from './WordCountSlider';
export type {
  WordCountRange,
  WordCountSliderConfig,
  WordCountSliderProps,
  SliderHandle,
  DragState
} from './WordCountSlider';

// 关键词密度控制组件
export { KeywordDensityControl } from './KeywordDensityControl';
export type {
  KeywordDensityControlProps,
  DensityValue,
  KeywordDensitySettings,
  DensityControlConfig,
  DensityLevel,
  DensityRecommendation
} from './KeywordDensityControl';

// 生成模式选择器组件
export { GenerationModeSelector } from './GenerationModeSelector';
export type {
  GenerationModeSelectorProps,
  GenerationModeOption
} from './GenerationModeSelector';

// 质量控制滑块组件
export { QualityControlSlider } from './QualityControlSlider';
export type {
  QualityControlSliderProps,
  QualityMetric,
  QualityScore,
  QualityRating,
  QualityPreset,
  SliderChangeEvent
} from './QualityControlSlider';

// 内容设置表单组件
export { ContentSettingsForm } from './ContentSettingsForm';
export type {
  ContentSettingsFormProps,
  FormStep,
  FormValidationResult,
  FormStepConfig,
  FormState,
  FormActions
} from './ContentSettingsForm';

// 高级设置模态框组件
export { default as AdvancedSettingsModal } from './AdvancedSettingsModal';
export type {
  AdvancedSettingsModalProps
} from './AdvancedSettingsModal'; 