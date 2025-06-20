/**
 * 内容设置相关类型定义
 */

/**
 * 字数控制设置
 */
export interface WordCountSettings {
  /** 总体字数限制 */
  total: {
    min: number;
    max: number;
    target?: number; // 目标字数
  };
  /** 各模块字数限制 */
  modules: {
    /** 游戏描述 */
    description: {
      min: number;
      max: number;
      target?: number;
    };
    /** 游戏特色 */
    features: {
      min: number;
      max: number;
      target?: number;
    };
    /** 玩法说明 */
    gameplay?: {
      min: number;
      max: number;
      target?: number;
    };
    /** 游戏评价 */
    review?: {
      min: number;
      max: number;
      target?: number;
    };
    /** 常见问题 */
    faq?: {
      min: number;
      max: number;
      target?: number;
    };
  };
}

/**
 * 关键词密度配置
 */
export interface KeywordDensitySettings {
  /** 主关键词密度 */
  mainKeyword: {
    target: number; // 目标密度百分比
    min: number;    // 最小密度
    max: number;    // 最大密度
  };
  /** 长尾关键词密度 */
  longTailKeywords: {
    target: number;
    min: number;
    max: number;
  };
  /** 相关关键词密度 */
  relatedKeywords?: {
    target: number;
    min: number;
    max: number;
  };
  /** 自然分布控制 */
  naturalDistribution: boolean;
  /** 关键词变体使用 */
  useVariations: boolean;
  /** 关键词上下文相关性 */
  contextualRelevance: boolean;
}

/**
 * 生成模式枚举
 */
export enum GenerationMode {
  /** 严格模式 - SEO优化优先 */
  STRICT = 'strict',
  /** 标准模式 - 平衡SEO和可读性 */
  STANDARD = 'standard',
  /** 自由模式 - 创意和自然度优先 */
  CREATIVE = 'creative',
  /** 自定义模式 */
  CUSTOM = 'custom'
}

/**
 * 内容质量参数
 */
export interface QualityParameters {
  /** 目标受众 */
  targetAudience: 'children' | 'teens' | 'adults' | 'gamers' | 'casual' | 'all';
  /** 可读性级别 */
  readabilityLevel: 'beginner' | 'intermediate' | 'advanced';
  /** 专业性程度 */
  professionalTone: boolean;
  /** 创意自由度 */
  creativeFreedom: boolean;
  /** 情感色彩 */
  emotionalTone: 'neutral' | 'excited' | 'friendly' | 'professional' | 'playful';
  /** 语言风格 */
  languageStyle: 'formal' | 'conversational' | 'descriptive' | 'action-oriented';
}

/**
 * SEO优化参数
 */
export interface SEOParameters {
  /** 标题优化 */
  titleOptimization: {
    includeMainKeyword: boolean;
    maxLength: number;
    keywordPosition: 'beginning' | 'middle' | 'end' | 'natural';
  };
  /** Meta描述优化 */
  metaDescription?: {
    includeMainKeyword: boolean;
    includeCTA: boolean; // 包含行动号召
    maxLength: number;
  };
  /** 内部链接建议 */
  internalLinking: boolean;
  /** 相关游戏推荐 */
  relatedGamesSuggestion: boolean;
  /** 结构化数据生成 */
  structuredDataGeneration: boolean;
}

/**
 * 内容设置完整配置
 */
export interface ContentSettings {
  /** 配置ID */
  id: string;
  /** 配置名称 */
  name: string;
  /** 配置描述 */
  description?: string;
  /** 字数控制设置 */
  wordCount: WordCountSettings;
  /** 关键词密度配置 */
  keywordDensity: KeywordDensitySettings;
  /** 生成模式 */
  generationMode: GenerationMode;
  /** 内容质量参数 */
  qualityParams: QualityParameters;
  /** SEO优化参数 */
  seoParams: SEOParameters;
  /** 高级设置 */
  advanced: {
    /** 并发生成数量 */
    concurrency: number;
    /** 重试次数 */
    retryAttempts: number;
    /** 生成超时时间(秒) */
    timeout: number;
    /** 启用缓存 */
    enableCaching: boolean;
    /** 质量检查严格程度 */
    qualityCheckStrictness: 'low' | 'medium' | 'high';
  };
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 是否为预设模板 */
  isPreset: boolean;
  /** 是否为默认配置 */
  isDefault: boolean;
}

/**
 * 预设模板配置
 */
export interface PresetTemplate {
  /** 模板ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description: string;
  /** 模板图标 */
  icon?: string;
  /** 适用场景 */
  useCase: string[];
  /** 推荐指数 */
  rating: number;
  /** 内容设置 */
  settings: Omit<ContentSettings, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'isPreset' | 'isDefault'>;
  /** 是否为系统内置 */
  isBuiltIn: boolean;
  /** 排序权重 */
  sortOrder: number;
}

/**
 * 内容设置验证结果
 */
export interface ContentSettingsValidation {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
  /** 建议信息 */
  suggestions: string[];
}

/**
 * 内容设置对比结果
 */
export interface ContentSettingsComparison {
  /** 对比的两个设置 */
  settings: [ContentSettings, ContentSettings];
  /** 差异列表 */
  differences: {
    field: string;
    path: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'modified';
  }[];
  /** 相似度评分 */
  similarity: number;
}

/**
 * 内容设置统计信息
 */
export interface ContentSettingsStats {
  /** 总配置数 */
  totalConfigs: number;
  /** 预设模板数 */
  presetCount: number;
  /** 自定义配置数 */
  customCount: number;
  /** 最常用的生成模式 */
  mostUsedMode: GenerationMode;
  /** 平均字数设置 */
  averageWordCount: {
    min: number;
    max: number;
    target: number;
  };
  /** 平均关键词密度设置 */
  averageKeywordDensity: {
    main: number;
    longTail: number;
  };
}

/**
 * 内容设置导入导出数据
 */
export interface ContentSettingsExportData {
  /** 导出版本 */
  version: string;
  /** 导出时间 */
  exportedAt: string;
  /** 设置列表 */
  settings: ContentSettings[];
  /** 预设模板列表 */
  presets: PresetTemplate[];
  /** 元数据 */
  metadata: {
    exportedBy?: string;
    exportReason?: string;
    includeBuiltInPresets: boolean;
  };
}

/**
 * 内容设置操作日志
 */
export interface ContentSettingsLog {
  /** 日志ID */
  id: string;
  /** 操作类型 */
  action: 'create' | 'update' | 'delete' | 'apply' | 'import' | 'export';
  /** 设置ID */
  settingsId: string;
  /** 设置名称 */
  settingsName: string;
  /** 操作前的设置 */
  beforeSettings?: Partial<ContentSettings>;
  /** 操作后的设置 */
  afterSettings?: Partial<ContentSettings>;
  /** 操作时间 */
  timestamp: string;
  /** 操作结果 */
  result: 'success' | 'failed' | 'partial';
  /** 错误信息 */
  error?: string;
  /** 操作描述 */
  description?: string;
}

 