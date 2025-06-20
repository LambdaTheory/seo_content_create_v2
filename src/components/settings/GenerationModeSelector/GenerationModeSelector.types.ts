/**
 * 生成模式选择器组件类型定义
 */

import { GenerationMode } from '@/types/ContentSettings.types';

/**
 * 生成模式选项
 */
export interface GenerationModeOption {
  value: GenerationMode;
  label: string;
  description: string;
  icon: string;
  features: string[];
  recommended?: boolean;
  color: string;
}

/**
 * 生成模式选择器组件属性
 */
export interface GenerationModeSelectorProps {
  /** 组件标识 */
  id?: string;
  /** 标签文本 */
  label: string;
  /** 描述文本 */
  description?: string;
  /** 当前选中的模式 */
  value: GenerationMode;
  /** 值变化回调 */
  onChange: (mode: GenerationMode) => void;
  /** 可用的模式选项 */
  options?: GenerationModeOption[];
  /** 错误状态 */
  error?: string;
  /** 警告状态 */
  warning?: string;
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 显示模式 */
  displayMode?: 'cards' | 'list' | 'compact';
  /** 是否显示详细描述 */
  showDetails?: boolean;
} 