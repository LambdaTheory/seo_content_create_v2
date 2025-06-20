/**
 * CSV上传和解析相关类型定义
 */

import { GameData } from './GameData.types';

/**
 * CSV解析配置
 */
export interface CSVParseConfig {
  /** 分隔符 */
  delimiter?: string;
  /** 是否有标题行 */
  header?: boolean;
  /** 跳过空行 */
  skipEmptyLines?: boolean;
  /** 编码格式 */
  encoding?: string;
  /** 预览行数 */
  preview?: number;
  /** 动态类型检测 */
  dynamicTyping?: boolean;
  /** 转换函数 */
  transform?: (value: string, field: string) => any;
}

/**
 * CSV文件信息
 */
export interface CSVFileInfo {
  /** 文件名 */
  name: string;
  /** 文件大小(字节) */
  size: number;
  /** 文件类型 */
  type: string;
  /** 最后修改时间 */
  lastModified: number;
  /** 文件编码(检测结果) */
  encoding?: string;
  /** 行数统计 */
  lineCount?: number;
  /** 列数统计 */
  columnCount?: number;
}

/**
 * CSV解析结果
 */
export interface CSVParseResult {
  /** 是否成功 */
  success: boolean;
  /** 解析的数据 */
  data: any[];
  /** 列名(标题行) */
  headers: string[];
  /** 错误信息 */
  errors: CSVParseError[];
  /** 警告信息 */
  warnings: string[];
  /** 元数据 */
  meta: CSVParseMeta;
  /** 文件信息 */
  fileInfo: CSVFileInfo;
}

/**
 * CSV解析错误
 */
export interface CSVParseError {
  /** 错误类型 */
  type: 'delimiter' | 'encoding' | 'format' | 'data' | 'size' | 'validation';
  /** 错误消息 */
  message: string;
  /** 错误行号 */
  row?: number;
  /** 错误列名或索引 */
  column?: string | number;
  /** 错误的原始值 */
  value?: any;
  /** 建议的修复方案 */
  suggestion?: string;
}

/**
 * CSV解析元数据
 */
export interface CSVParseMeta {
  /** 总行数 */
  linebreak: string;
  /** 分隔符 */
  delimiter: string;
  /** 是否被截断 */
  truncated: boolean;
  /** 游标位置 */
  cursor: number;
  /** 解析时间(毫秒) */
  parseTime?: number;
  /** 检测到的编码 */
  detectedEncoding?: string;
}

/**
 * CSV字段映射
 */
export interface CSVFieldMapping {
  /** CSV列名 */
  csvColumn: string;
  /** 目标字段名 */
  targetField: keyof GameData;
  /** 是否必填 */
  required: boolean;
  /** 数据类型 */
  type: 'string' | 'number' | 'boolean' | 'date' | 'url' | 'array';
  /** 转换函数 */
  transform?: (value: any) => any;
  /** 验证函数 */
  validate?: (value: any) => boolean | string;
  /** 默认值 */
  defaultValue?: any;
}

/**
 * CSV验证规则
 */
export interface CSVValidationRule {
  /** 字段名 */
  field: string;
  /** 规则类型 */
  type: 'required' | 'url' | 'email' | 'number' | 'date' | 'length' | 'pattern' | 'custom';
  /** 规则参数 */
  params?: any;
  /** 错误消息 */
  message: string;
  /** 自定义验证函数 */
  validator?: (value: any, row: any) => boolean | string;
}

/**
 * CSV数据验证结果
 */
export interface CSVValidationResult {
  /** 是否通过验证 */
  valid: boolean;
  /** 验证的数据 */
  data: GameData[];
  /** 验证错误 */
  errors: CSVValidationError[];
  /** 警告信息 */
  warnings: string[];
  /** 统计信息 */
  stats: CSVValidationStats;
}

/**
 * CSV验证错误
 */
export interface CSVValidationError {
  /** 行号 */
  row: number;
  /** 字段名 */
  field: string;
  /** 错误值 */
  value: any;
  /** 错误类型 */
  type: string;
  /** 错误消息 */
  message: string;
  /** 建议的修复方案 */
  suggestion?: string;
}

/**
 * CSV验证统计
 */
export interface CSVValidationStats {
  /** 总行数 */
  totalRows: number;
  /** 有效行数 */
  validRows: number;
  /** 错误行数 */
  errorRows: number;
  /** 警告行数 */
  warningRows: number;
  /** 字段统计 */
  fieldStats: Record<string, {
    filled: number;
    empty: number;
    errors: number;
  }>;
}

/**
 * CSV上传状态
 */
export type CSVUploadStatus = 'idle' | 'uploading' | 'parsing' | 'validating' | 'completed' | 'error';

/**
 * CSV上传进度
 */
export interface CSVUploadProgress {
  /** 当前状态 */
  status: CSVUploadStatus;
  /** 进度百分比 */
  progress: number;
  /** 当前步骤描述 */
  message: string;
  /** 处理的行数 */
  processedRows?: number;
  /** 总行数 */
  totalRows?: number;
  /** 处理速度(行/秒) */
  speed?: number;
  /** 预计剩余时间(秒) */
  estimatedTime?: number;
}

/**
 * CSV处理配置
 */
export interface CSVProcessConfig {
  /** 解析配置 */
  parseConfig: CSVParseConfig;
  /** 字段映射 */
  fieldMappings: CSVFieldMapping[];
  /** 验证规则 */
  validationRules: CSVValidationRule[];
  /** 数据清洗选项 */
  cleaningOptions: CSVCleaningOptions;
  /** 大文件处理选项 */
  largeFileOptions: CSVLargeFileOptions;
}

/**
 * CSV数据清洗选项
 */
export interface CSVCleaningOptions {
  /** 去除前后空格 */
  trimWhitespace?: boolean;
  /** 移除空行 */
  removeEmptyRows?: boolean;
  /** 移除重复行 */
  removeDuplicates?: boolean;
  /** 标准化URL格式 */
  normalizeUrls?: boolean;
  /** 修复常见格式错误 */
  fixCommonErrors?: boolean;
  /** 自动类型转换 */
  autoTypeConversion?: boolean;
}

/**
 * CSV大文件处理选项
 */
export interface CSVLargeFileOptions {
  /** 分块大小(行数) */
  chunkSize?: number;
  /** 是否启用流式处理 */
  streaming?: boolean;
  /** 内存限制(MB) */
  memoryLimit?: number;
  /** 是否启用Web Worker */
  useWebWorker?: boolean;
  /** 进度回调频率(毫秒) */
  progressInterval?: number;
}

/**
 * CSV导出配置
 */
export interface CSVExportConfig {
  /** 文件名 */
  filename?: string;
  /** 分隔符 */
  delimiter?: string;
  /** 是否包含标题行 */
  header?: boolean;
  /** 编码格式 */
  encoding?: string;
  /** 换行符 */
  linebreak?: string;
  /** 是否引用所有字段 */
  quoteAll?: boolean;
  /** 包含的字段 */
  fields?: string[];
  /** 字段顺序 */
  fieldOrder?: string[];
}

/**
 * CSV模板
 */
export interface CSVTemplate {
  /** 模板ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description?: string;
  /** 字段映射配置 */
  fieldMappings: CSVFieldMapping[];
  /** 验证规则 */
  validationRules: CSVValidationRule[];
  /** 示例数据 */
  sampleData?: any[];
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 是否为系统模板 */
  isSystem?: boolean;
} 