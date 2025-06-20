/**
 * 工作流导入导出类型定义
 */

import { Workflow, StructuredDataType, WorkflowStatus } from './Workflow.types';

/**
 * 工作流配置文件版本
 */
export const WORKFLOW_CONFIG_VERSION = '1.0.0';

/**
 * 工作流导出配置格式
 */
export interface WorkflowExportConfig {
  /** 配置文件版本 */
  version: string;
  /** 导出时间戳 */
  exportedAt: number;
  /** 导出者信息 */
  exportedBy?: string;
  /** 导出来源 */
  source?: string;
  /** 文件描述 */
  description?: string;
  /** 工作流数据 */
  workflow: WorkflowExportData;
}

/**
 * 工作流导出数据格式
 */
export interface WorkflowExportData {
  /** 工作流名称 */
  name: string;
  /** 工作流描述 */
  description?: string;
  /** AI生成内容的Prompt模板 */
  prompt: string;
  /** games.json参考格式 */
  gameDataFormat?: string;
  /** 选择的结构化数据类型 */
  structuredDataTypes: StructuredDataType[];
  /** 工作流状态 */
  status: WorkflowStatus;
  /** 是否为默认工作流 */
  isDefault?: boolean;
  /** 导出时的元数据 */
  metadata?: WorkflowExportMetadata;
}

/**
 * 工作流导出元数据
 */
export interface WorkflowExportMetadata {
  /** 原始创建时间 */
  originalCreatedAt?: number;
  /** 原始更新时间 */
  originalUpdatedAt?: number;
  /** 原始ID (用于追溯) */
  originalId?: string;
  /** 导出时的使用统计 */
  usageStats?: WorkflowUsageStats;
  /** 标签 */
  tags?: string[];
  /** 分类 */
  category?: string;
  /** 作者信息 */
  author?: string;
  /** 许可证信息 */
  license?: string;
}

/**
 * 工作流使用统计
 */
export interface WorkflowUsageStats {
  /** 生成次数 */
  generationCount?: number;
  /** 最后使用时间 */
  lastUsedAt?: number;
  /** 成功率 */
  successRate?: number;
  /** 平均处理时间 */
  averageProcessingTime?: number;
}

/**
 * 批量工作流导出配置
 */
export interface BatchWorkflowExportConfig {
  /** 配置文件版本 */
  version: string;
  /** 导出时间戳 */
  exportedAt: number;
  /** 导出者信息 */
  exportedBy?: string;
  /** 导出来源 */
  source?: string;
  /** 文件描述 */
  description?: string;
  /** 工作流数量 */
  count: number;
  /** 工作流列表 */
  workflows: WorkflowExportData[];
}

/**
 * 工作流导入选项
 */
export interface WorkflowImportOptions {
  /** 是否覆盖同名工作流 */
  overwriteExisting?: boolean;
  /** 是否保留原始ID */
  preserveIds?: boolean;
  /** 是否保留原始时间戳 */
  preserveTimestamps?: boolean;
  /** 是否设置为默认工作流 */
  setAsDefault?: boolean;
  /** 导入后的状态 */
  importStatus?: WorkflowStatus;
  /** 名称前缀 */
  namePrefix?: string;
  /** 名称后缀 */
  nameSuffix?: string;
  /** 是否验证配置文件 */
  validateConfig?: boolean;
}

/**
 * 工作流导入结果
 */
export interface WorkflowImportResult {
  /** 是否成功 */
  success: boolean;
  /** 导入的工作流 */
  workflow?: Workflow;
  /** 错误信息 */
  errors?: string[];
  /** 警告信息 */
  warnings?: string[];
  /** 导入的原始数据 */
  originalData?: WorkflowExportConfig;
}

/**
 * 批量工作流导入结果
 */
export interface BatchWorkflowImportResult {
  /** 是否全部成功 */
  success: boolean;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 导入结果列表 */
  results: WorkflowImportResult[];
  /** 整体错误信息 */
  errors?: string[];
  /** 导入的原始数据 */
  originalData?: BatchWorkflowExportConfig;
}

/**
 * 工作流配置文件验证结果
 */
export interface WorkflowConfigValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
  /** 支持的版本 */
  supportedVersions: string[];
  /** 文件版本 */
  fileVersion?: string;
}

/**
 * 工作流冲突信息
 */
export interface WorkflowConflict {
  /** 冲突类型 */
  type: 'name_duplicate' | 'id_duplicate' | 'default_conflict';
  /** 冲突的工作流名称 */
  workflowName: string;
  /** 现有工作流 */
  existingWorkflow: Workflow;
  /** 导入的工作流数据 */
  importingWorkflow: WorkflowExportData;
  /** 建议的解决方案 */
  suggestedResolution: 'overwrite' | 'rename' | 'skip' | 'merge';
}

/**
 * 工作流冲突解决选项
 */
export interface WorkflowConflictResolution {
  /** 冲突ID */
  conflictId: string;
  /** 解决方案 */
  resolution: 'overwrite' | 'rename' | 'skip' | 'merge';
  /** 新名称 (当选择重命名时) */
  newName?: string;
  /** 合并选项 (当选择合并时) */
  mergeOptions?: WorkflowMergeOptions;
}

/**
 * 工作流合并选项
 */
export interface WorkflowMergeOptions {
  /** 保留哪个版本的Prompt */
  promptSource: 'existing' | 'importing' | 'manual';
  /** 手动指定的Prompt (当选择manual时) */
  manualPrompt?: string;
  /** 保留哪个版本的游戏数据格式 */
  gameDataFormatSource: 'existing' | 'importing' | 'manual';
  /** 手动指定的游戏数据格式 */
  manualGameDataFormat?: string;
  /** 结构化数据类型合并策略 */
  structuredDataTypesStrategy: 'union' | 'intersection' | 'existing' | 'importing';
} 