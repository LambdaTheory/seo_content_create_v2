import React from 'react';

/**
 * 操作状态类型
 */
export type OperationStatus = 
  | 'idle'      // 空闲
  | 'loading'   // 加载中
  | 'processing'// 处理中
  | 'success'   // 成功
  | 'error'     // 错误
  | 'warning'   // 警告
  | 'uploading' // 上传中
  | 'generating'// 生成中
  | 'ready';    // 就绪

/**
 * 进度信息类型
 */
export interface ProgressInfo {
  current: number;    // 当前进度
  total: number;      // 总数
  percentage?: number; // 百分比(0-100)
  label?: string;      // 进度标签
  unit?: string;       // 单位(如: 个, MB, 条)
}

/**
 * 状态项接口
 */
export interface StatusItem {
  id: string;
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  tooltip?: string;
}

/**
 * Footer组件Props
 */
export interface FooterProps {
  /** 主要操作状态 */
  status?: OperationStatus;
  /** 状态文本 */
  statusText?: string;
  /** 进度信息 */
  progress?: ProgressInfo;
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 左侧状态项列表 */
  leftItems?: StatusItem[];
  /** 右侧状态项列表 */
  rightItems?: StatusItem[];
  /** 是否收起状态（响应布局时） */
  collapsed?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 点击事件回调 */
  onStatusClick?: (status: OperationStatus) => void;
  /** 状态项点击回调 */
  onItemClick?: (item: StatusItem) => void;
}

/**
 * 状态显示组件Props
 */
export interface StatusDisplayProps {
  status: OperationStatus;
  text?: string;
  showIcon?: boolean;
  onClick?: (status: OperationStatus) => void;
}

/**
 * 进度显示组件Props
 */
export interface ProgressDisplayProps {
  progress: ProgressInfo;
  showBar?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 状态项组件Props
 */
export interface StatusItemProps {
  item: StatusItem;
  collapsed?: boolean;
  onClick?: (item: StatusItem) => void;
}

/**
 * Footer常量
 */
export const FOOTER_CONSTANTS = {
  /** 高度配置 */
  HEIGHT: {
    DEFAULT: 40,      // 默认高度
    COLLAPSED: 32,    // 收起高度
    WITH_PROGRESS: 48 // 带进度条高度
  },
  
  /** 状态配置 */
  STATUS: {
    idle: { 
      label: '空闲', 
      color: 'text-gray-500', 
      icon: '⚪' 
    },
    ready: { 
      label: '就绪', 
      color: 'text-green-600', 
      icon: '✅' 
    },
    loading: { 
      label: '加载中', 
      color: 'text-blue-600', 
      icon: '🔄' 
    },
    processing: { 
      label: '处理中', 
      color: 'text-blue-600', 
      icon: '⚡' 
    },
    uploading: { 
      label: '上传中', 
      color: 'text-indigo-600', 
      icon: '📤' 
    },
    generating: { 
      label: '生成中', 
      color: 'text-purple-600', 
      icon: '🤖' 
    },
    success: { 
      label: '成功', 
      color: 'text-green-600', 
      icon: '✅' 
    },
    warning: { 
      label: '警告', 
      color: 'text-yellow-600', 
      icon: '⚠️' 
    },
    error: { 
      label: '错误', 
      color: 'text-red-600', 
      icon: '❌' 
    }
  },
  
  /** 动画配置 */
  ANIMATION: {
    TRANSITION_DURATION: '200ms',
    PROGRESS_ANIMATION: '1.5s ease-in-out infinite'
  }
} as const;

/**
 * 状态工具函数类型
 */
export interface StatusUtils {
  getStatusConfig: (status: OperationStatus) => {
    label: string;
    color: string;
    icon: string;
  };
  formatProgress: (progress: ProgressInfo) => string;
  isActiveStatus: (status: OperationStatus) => boolean;
}

export default FooterProps; 