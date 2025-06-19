/**
 * CSV游戏数据接口定义
 */
export interface GameData {
  /** 游戏名称 */
  gameName: string;
  /** 主关键词 */
  mainKeyword: string;
  /** 长尾关键词，逗号分隔 */
  longTailKeywords?: string;
  /** 视频链接（YouTube等） */
  videoLink?: string;
  /** 站内内链，逗号分隔 */
  internalLinks?: string;
  /** 竞品页面，逗号分隔 */
  competitorPages?: string;
  /** 游戏图标地址 */
  iconUrl?: string;
  /** 游戏iframe地址 */
  realUrl: string;
}

/**
 * 游戏数据验证结果
 */
export interface GameDataValidation {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息 */
  errors: ValidationError[];
  /** 警告信息 */
  warnings: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 字段名 */
  field: keyof GameData;
  /** 错误消息 */
  message: string;
  /** 错误类型 */
  type: 'required' | 'format' | 'length' | 'url';
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 字段名 */
  field: keyof GameData;
  /** 警告消息 */
  message: string;
  /** 建议修复方式 */
  suggestion?: string;
}

/**
 * CSV上传结果
 */
export interface CSVUploadResult {
  /** 成功解析的数据 */
  data: GameData[];
  /** 总行数 */
  totalRows: number;
  /** 有效行数 */
  validRows: number;
  /** 无效行数 */
  invalidRows: number;
  /** 验证结果 */
  validations: GameDataValidation[];
  /** 解析错误 */
  parseErrors?: string[];
}

/**
 * 字段映射配置
 */
export interface FieldMapping {
  /** CSV文件中的字段名 */
  csvField: string;
  /** 对应的GameData字段名 */
  dataField: keyof GameData;
  /** 是否必填 */
  required: boolean;
}

/**
 * CSV解析配置
 */
export interface CSVParseConfig {
  /** 分隔符 */
  delimiter?: string;
  /** 是否有标题行 */
  header?: boolean;
  /** 编码格式 */
  encoding?: string;
  /** 字段映射 */
  fieldMapping?: FieldMapping[];
} 