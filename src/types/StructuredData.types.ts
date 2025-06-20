/**
 * 结构化数据生成模块的类型定义
 * 定义所有与结构化数据生成相关的接口和类型
 */

import {
  SchemaGameData,
  SchemaGameType,
} from '@/services/structuredData/schemaOrgStandards';

import {
  StructuredDataConfig,
  StructuredDataResult,
  BatchStructuredDataResult,
} from '@/services/structuredData/StructuredDataService';

/**
 * 结构化数据生成模式
 */
export enum StructuredDataMode {
  BASIC = 'basic',              // 基础模式：仅包含核心字段
  STANDARD = 'standard',        // 标准模式：包含常用SEO字段
  COMPREHENSIVE = 'comprehensive', // 综合模式：包含所有可用字段
  CUSTOM = 'custom',           // 自定义模式：用户自定义字段
}

/**
 * 输出格式类型
 */
export enum OutputFormat {
  JSON_LD = 'json-ld',
  MICRODATA = 'microdata',
  RDFA = 'rdfa',
  ALL = 'all',
}

/**
 * 数据源类型
 */
export enum DataSourceType {
  GAMES_JSON = 'games_json',    // games.json文件
  CSV_UPLOAD = 'csv_upload',    // CSV上传
  API_FETCH = 'api_fetch',      // API获取
  MANUAL_INPUT = 'manual_input', // 手动输入
  COMPETITOR_ANALYSIS = 'competitor_analysis', // 竞品分析
}

/**
 * 验证严格级别
 */
export enum ValidationLevel {
  STRICT = 'strict',       // 严格验证：所有字段都必须符合Schema.org规范
  STANDARD = 'standard',   // 标准验证：主要字段验证
  LOOSE = 'loose',        // 宽松验证：基础字段验证
  NONE = 'none',          // 无验证
}

/**
 * SEO优化级别
 */
export enum SeoOptimizationLevel {
  AGGRESSIVE = 'aggressive', // 激进优化：最大化SEO效果
  BALANCED = 'balanced',     // 平衡优化：SEO与可读性平衡
  CONSERVATIVE = 'conservative', // 保守优化：保持原始内容
  NONE = 'none',            // 无优化
}

/**
 * 结构化数据字段配置
 */
export interface FieldConfig {
  name: string;                    // 字段名
  label: string;                   // 显示标签
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'url';
  required: boolean;               // 是否必填
  schemaProperty: string;          // 对应的Schema.org属性
  defaultValue?: any;              // 默认值
  validation?: {
    pattern?: string;              // 正则验证
    minLength?: number;            // 最小长度
    maxLength?: number;            // 最大长度
    min?: number;                  // 最小值
    max?: number;                  // 最大值
    enum?: string[];               // 枚举值
  };
  mapping?: {
    sourceField: string;           // 源字段名
    transformer?: string;          // 转换函数名
  };
  seoWeight: number;               // SEO权重 (0-10)
  description: string;             // 字段描述
  examples?: string[];             // 示例值
}

/**
 * 结构化数据模板
 */
export interface StructuredDataTemplate {
  id: string;                      // 模板ID
  name: string;                    // 模板名称
  description: string;             // 模板描述
  schemaType: SchemaGameType;      // Schema类型
  mode: StructuredDataMode;        // 生成模式
  fields: FieldConfig[];           // 字段配置
  config: Partial<StructuredDataConfig>; // 生成配置
  isBuiltIn: boolean;              // 是否内置模板
  version: string;                 // 模板版本
  createdAt: string;               // 创建时间
  updatedAt: string;               // 更新时间
  usage: {
    count: number;                 // 使用次数
    lastUsed: string;              // 最后使用时间
  };
  tags: string[];                  // 标签
  category: string;                // 分类
}

/**
 * 结构化数据生成请求
 */
export interface StructuredDataGenerationRequest {
  gameData: any;                   // 游戏数据
  gameId?: string;                 // 游戏ID
  templateId?: string;             // 使用的模板ID
  schemaType?: SchemaGameType;     // Schema类型
  mode?: StructuredDataMode;       // 生成模式
  config?: Partial<StructuredDataConfig>; // 自定义配置
  outputFormat?: OutputFormat;     // 输出格式
  validationLevel?: ValidationLevel; // 验证级别
  seoOptimization?: SeoOptimizationLevel; // SEO优化级别
  customFields?: Record<string, any>; // 自定义字段
  includeOptional?: boolean;       // 是否包含可选字段
}

/**
 * 批量生成请求
 */
export interface BatchStructuredDataRequest {
  gamesData: any[];               // 游戏数据数组
  templateId?: string;            // 使用的模板ID
  config?: Partial<StructuredDataConfig>; // 生成配置
  options?: {
    concurrency?: number;         // 并发数
    batchSize?: number;           // 批次大小
    skipErrors?: boolean;         // 是否跳过错误
    onProgress?: (completed: number, total: number) => void; // 进度回调
    onError?: (error: Error, gameData: any, index: number) => void; // 错误回调
  };
}

/**
 * 结构化数据分析结果
 */
export interface StructuredDataAnalysis {
  gameId: string;                 // 游戏ID
  schemaType: SchemaGameType;     // 检测到的Schema类型
  completeness: {
    score: number;                // 完整性评分 (0-100)
    requiredFields: {
      total: number;              // 必填字段总数
      filled: number;             // 已填写数量
      missing: string[];          // 缺失字段
    };
    optionalFields: {
      total: number;              // 可选字段总数
      filled: number;             // 已填写数量
      suggestions: string[];      // 建议添加的字段
    };
  };
  seoOptimization: {
    score: number;                // SEO优化评分 (0-100)
    keywords: {
      density: number;            // 关键词密度
      distribution: Record<string, number>; // 关键词分布
      suggestions: string[];      // 关键词建议
    };
    structure: {
      titleOptimized: boolean;    // 标题是否优化
      descriptionOptimized: boolean; // 描述是否优化
      imageOptimized: boolean;    // 图片是否优化
      ratingIncluded: boolean;    // 是否包含评分
      priceIncluded: boolean;     // 是否包含价格
    };
    recommendations: string[];    // 优化建议
  };
  validation: {
    isValid: boolean;             // 是否通过验证
    errors: Array<{
      field: string;              // 错误字段
      type: 'missing' | 'invalid' | 'format'; // 错误类型
      message: string;            // 错误信息
      severity: 'error' | 'warning' | 'info'; // 严重程度
    }>;
    warnings: Array<{
      field: string;
      message: string;
      suggestion?: string;
    }>;
    score: number;                // 验证评分
  };
  performance: {
    generationTime: number;       // 生成耗时 (ms)
    dataSize: number;             // 数据大小 (bytes)
    compressionRatio?: number;    // 压缩比例
  };
  metadata: {
    generatedAt: string;          // 生成时间
    version: string;              // 生成器版本
    templateUsed?: string;        // 使用的模板
    configUsed: StructuredDataConfig; // 使用的配置
  };
}

/**
 * 结构化数据预览配置
 */
export interface StructuredDataPreviewConfig {
  format: OutputFormat;           // 预览格式
  theme: 'light' | 'dark';       // 主题
  showLineNumbers: boolean;       // 显示行号
  enableSyntaxHighlight: boolean; // 语法高亮
  enableFolding: boolean;         // 代码折叠
  enableSearch: boolean;          // 搜索功能
  enableValidation: boolean;      // 实时验证
  autoFormat: boolean;            // 自动格式化
  maxDisplayLines: number;        // 最大显示行数
}

/**
 * 结构化数据导出配置
 */
export interface StructuredDataExportConfig {
  format: OutputFormat | 'html' | 'txt'; // 导出格式
  includeMetadata: boolean;       // 包含元数据
  includeValidation: boolean;     // 包含验证结果
  includeAnalysis: boolean;       // 包含分析结果
  compression: boolean;           // 是否压缩
  filename?: string;              // 文件名
  batchExport?: {
    enabled: boolean;             // 启用批量导出
    archiveFormat: 'zip' | 'tar'; // 压缩格式
    separateFiles: boolean;       // 分离文件
  };
}

/**
 * 结构化数据导入配置
 */
export interface StructuredDataImportConfig {
  source: DataSourceType;         // 数据源类型
  validation: ValidationLevel;    // 验证级别
  autoMapping: boolean;           // 自动字段映射
  overrideExisting: boolean;      // 覆盖现有数据
  batchSize: number;             // 批处理大小
  errorHandling: 'skip' | 'stop' | 'collect'; // 错误处理策略
  fieldMappings?: Record<string, string>; // 字段映射
  defaultValues?: Record<string, any>; // 默认值
}

/**
 * 结构化数据统计信息
 */
export interface StructuredDataStats {
  total: {
    generated: number;            // 总生成数量
    successful: number;           // 成功数量
    failed: number;               // 失败数量
    cached: number;               // 缓存命中数量
  };
  bySchemaType: Record<SchemaGameType, number>; // 按Schema类型统计
  byMode: Record<StructuredDataMode, number>; // 按生成模式统计
  byTemplate: Record<string, number>; // 按模板统计
  validation: {
    passed: number;               // 验证通过数量
    failed: number;               // 验证失败数量
    averageScore: number;         // 平均验证分数
  };
  seo: {
    averageScore: number;         // 平均SEO分数
    highQuality: number;          // 高质量数量 (>80分)
    mediumQuality: number;        // 中等质量数量 (50-80分)
    lowQuality: number;           // 低质量数量 (<50分)
  };
  performance: {
    averageGenerationTime: number; // 平均生成时间
    totalGenerationTime: number;   // 总生成时间
    averageDataSize: number;       // 平均数据大小
    cacheHitRate: number;          // 缓存命中率
  };
  trends: {
    dailyGeneration: Array<{
      date: string;
      count: number;
    }>;
    popularTemplates: Array<{
      templateId: string;
      name: string;
      usage: number;
    }>;
    commonErrors: Array<{
      error: string;
      count: number;
    }>;
  };
}

/**
 * 结构化数据API响应
 */
export interface StructuredDataApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    version: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 结构化数据生成事件
 */
export interface StructuredDataEvent {
  type: 'generation_started' | 'generation_completed' | 'generation_failed' | 
        'validation_completed' | 'batch_progress' | 'cache_updated';
  gameId?: string;
  batchId?: string;
  timestamp: string;
  data?: any;
  error?: Error;
}

/**
 * 结构化数据生成器状态
 */
export interface StructuredDataGeneratorState {
  isGenerating: boolean;          // 是否正在生成
  currentBatch?: {
    id: string;
    total: number;
    completed: number;
    failed: number;
    startTime: string;
    estimatedCompletion?: string;
  };
  recentResults: StructuredDataResult[]; // 最近结果
  stats: StructuredDataStats;     // 统计信息
  cache: {
    size: number;
    hitRate: number;
    keys: string[];
  };
  templates: StructuredDataTemplate[]; // 可用模板
  config: StructuredDataConfig;   // 当前配置
}

/**
 * 导出所有主要类型
 */
export type {
  SchemaGameData,
  SchemaGameType,
  StructuredDataConfig,
  StructuredDataResult,
  BatchStructuredDataResult,
}; 