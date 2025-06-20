/**
 * 关键词密度调节器组件类型定义
 */

/**
 * 密度值配置
 */
export interface DensityValue {
  target: number;
  min: number;
  max: number;
}

/**
 * 关键词密度设置
 */
export interface KeywordDensitySettings {
  /** 主关键词密度 */
  mainKeyword: DensityValue;
  /** 长尾关键词密度 */
  longTailKeywords: DensityValue;
  /** 相关关键词密度 */
  relatedKeywords?: DensityValue;
  /** 自然分布控制 */
  naturalDistribution: boolean;
  /** 关键词变体使用 */
  useVariations: boolean;
  /** 关键词上下文相关性 */
  contextualRelevance: boolean;
}

/**
 * 密度控制配置
 */
export interface DensityControlConfig {
  /** 最小密度值 */
  minDensity: number;
  /** 最大密度值 */
  maxDensity: number;
  /** 步长 */
  step: number;
  /** 是否显示百分比 */
  showPercentage?: boolean;
  /** 是否显示建议 */
  showRecommendations?: boolean;
  /** 预设值 */
  presets?: {
    label: string;
    value: DensityValue;
  }[];
}

/**
 * 关键词密度控制组件属性
 */
export interface KeywordDensityControlProps {
  /** 组件标识 */
  id?: string;
  /** 标签文本 */
  label: string;
  /** 描述文本 */
  description?: string;
  /** 当前密度设置 */
  value: KeywordDensitySettings;
  /** 密度控制配置 */
  config: DensityControlConfig;
  /** 值变化回调 */
  onChange: (value: KeywordDensitySettings) => void;
  /** 错误状态 */
  error?: string;
  /** 警告状态 */
  warning?: string;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示高级选项 */
  showAdvanced?: boolean;
}

/**
 * 密度等级定义
 */
export interface DensityLevel {
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
}

/**
 * 密度建议
 */
export interface DensityRecommendation {
  keywordType: 'main' | 'longTail' | 'related';
  currentValue: number;
  recommendedRange: {
    min: number;
    max: number;
  };
  suggestion: string;
  severity: 'info' | 'warning' | 'error';
} 