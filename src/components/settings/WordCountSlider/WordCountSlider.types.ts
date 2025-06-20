/**
 * 字数范围滑块组件类型定义
 */

/**
 * 字数范围值
 */
export interface WordCountRange {
  min: number;
  max: number;
  target?: number;
}

/**
 * 字数滑块配置
 */
export interface WordCountSliderConfig {
  /** 最小允许值 */
  absoluteMin: number;
  /** 最大允许值 */
  absoluteMax: number;
  /** 步长 */
  step: number;
  /** 显示目标值 */
  showTarget?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 快速预设值 */
  presets?: {
    label: string;
    value: WordCountRange;
  }[];
}

/**
 * 字数滑块组件属性
 */
export interface WordCountSliderProps {
  /** 组件标识 */
  id?: string;
  /** 标签文本 */
  label: string;
  /** 描述文本 */
  description?: string;
  /** 当前值 */
  value: WordCountRange;
  /** 滑块配置 */
  config: WordCountSliderConfig;
  /** 值变化回调 */
  onChange: (value: WordCountRange) => void;
  /** 错误状态 */
  error?: string;
  /** 警告状态 */
  warning?: string;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示预设按钮 */
  showPresets?: boolean;
  /** 是否显示数值输入框 */
  showInputs?: boolean;
}

/**
 * 滑块手柄类型
 */
export type SliderHandle = 'min' | 'max' | 'target';

/**
 * 拖拽状态
 */
export interface DragState {
  isDragging: boolean;
  handle: SliderHandle | null;
  startValue: number;
  startPosition: number;
} 