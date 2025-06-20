/**
 * 质量控制滑块组件类型定义
 */

import { QualityParameters } from '@/types/ContentSettings.types';

/**
 * 质量指标配置
 */
export interface QualityMetric {
  /** 指标标识 */
  key: keyof QualityParameters;
  /** 指标名称 */
  name: string;
  /** 指标描述 */
  description: string;
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
  /** 步长 */
  step: number;
  /** 默认值 */
  defaultValue: number;
  /** 单位 */
  unit?: string;
  /** 图标 */
  icon: string;
  /** 颜色主题 */
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** 是否必需 */
  required?: boolean;
  /** 建议范围 */
  recommendedRange?: [number, number];
  /** 风险阈值 */
  riskThreshold?: number;
}

/**
 * 质量评级
 */
export enum QualityRating {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  EXCELLENT = 'excellent'
}

/**
 * 质量评分详情
 */
export interface QualityScore {
  /** 总分 */
  total: number;
  /** 评级 */
  rating: QualityRating;
  /** 各项指标得分 */
  scores: {
    [K in keyof QualityParameters]: number;
  };
  /** 建议 */
  suggestions: string[];
}

/**
 * 质量控制滑块组件属性
 */
export interface QualityControlSliderProps {
  /** 组件标识 */
  id?: string;
  /** 标签文本 */
  label: string;
  /** 描述文本 */
  description?: string;
  /** 当前质量参数 */
  value: QualityParameters;
  /** 值变化回调 */
  onChange: (params: QualityParameters) => void;
  /** 可用的质量指标 */
  metrics?: QualityMetric[];
  /** 是否显示预设 */
  showPresets?: boolean;
  /** 预设配置 */
  presets?: QualityPreset[];
  /** 是否显示实时评分 */
  showScore?: boolean;
  /** 错误状态 */
  error?: string;
  /** 警告状态 */
  warning?: string;
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 布局模式 */
  layout?: 'vertical' | 'horizontal' | 'grid';
  /** 是否紧凑模式 */
  compact?: boolean;
}

/**
 * 质量预设配置
 */
export interface QualityPreset {
  /** 预设标识 */
  id: string;
  /** 预设名称 */
  name: string;
  /** 预设描述 */
  description: string;
  /** 预设参数 */
  parameters: QualityParameters;
  /** 图标 */
  icon: string;
  /** 是否推荐 */
  recommended?: boolean;
}

/**
 * 滑块变化事件
 */
export interface SliderChangeEvent {
  /** 变化的指标 */
  metric: keyof QualityParameters;
  /** 新值 */
  value: number;
  /** 旧值 */
  oldValue: number;
  /** 完整参数 */
  fullParams: QualityParameters;
} 