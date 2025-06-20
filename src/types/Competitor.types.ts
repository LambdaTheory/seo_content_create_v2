/**
 * 竞品网站配置相关类型定义
 */

/**
 * 竞品网站配置
 */
export interface CompetitorWebsite {
  /** 网站ID */
  id: string;
  /** 网站名称 */
  name: string;
  /** 网站域名 */
  domain: string;
  /** 网站基础URL */
  baseUrl: string;
  /** Sitemap URL */
  sitemapUrl: string;
  /** 网站描述 */
  description?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 网站配置 */
  config: WebsiteConfig;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 最后抓取时间 */
  lastCrawledAt?: Date;
  /** 抓取状态 */
  crawlStatus: CrawlStatus;
  /** 游戏数量统计 */
  gameCount: number;
  /** 网站标签 */
  tags?: string[];
}

/**
 * 网站配置
 */
export interface WebsiteConfig {
  /** 抓取配置 */
  crawl: CrawlConfig;
  /** 解析配置 */
  parsing: ParsingConfig;
  /** 请求配置 */
  request: RequestConfig;
  /** 内容提取配置 */
  extraction: ExtractionConfig;
}

/**
 * 抓取配置
 */
export interface CrawlConfig {
  /** 抓取频率（小时） */
  frequency: number;
  /** 最大并发数 */
  maxConcurrent: number;
  /** 请求间隔（毫秒） */
  requestDelay: number;
  /** 超时时间（毫秒） */
  timeout: number;
  /** 是否启用自动重试 */
  enableRetry: boolean;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试间隔（毫秒） */
  retryDelay: number;
}

/**
 * 解析配置
 */
export interface ParsingConfig {
  /** 内容选择器配置 */
  selectors: ContentSelectors;
  /** 是否启用智能解析 */
  enableSmartParsing: boolean;
  /** 内容过滤规则 */
  filterRules: FilterRule[];
  /** 字段映射规则 */
  fieldMapping: FieldMapping;
}

/**
 * 请求配置
 */
export interface RequestConfig {
  /** User-Agent列表 */
  userAgents: string[];
  /** 请求头配置 */
  headers: Record<string, string>;
  /** 代理配置 */
  proxy?: ProxyConfig;
  /** Cookie设置 */
  cookies?: Record<string, string>;
  /** 是否启用JavaScript */
  enableJavaScript?: boolean;
}

/**
 * 内容提取配置
 */
export interface ExtractionConfig {
  /** 游戏标题提取规则 */
  titleRules: ExtractionRule[];
  /** 游戏描述提取规则 */
  descriptionRules: ExtractionRule[];
  /** 游戏链接提取规则 */
  linkRules: ExtractionRule[];
  /** 游戏图片提取规则 */
  imageRules: ExtractionRule[];
  /** 游戏标签提取规则 */
  tagRules: ExtractionRule[];
  /** 内容清洗规则 */
  cleanupRules: CleanupRule[];
}

/**
 * 内容选择器配置
 */
export interface ContentSelectors {
  /** 游戏列表选择器 */
  gameList: string;
  /** 游戏项选择器 */
  gameItem: string;
  /** 游戏标题选择器 */
  gameTitle: string;
  /** 游戏链接选择器 */
  gameLink: string;
  /** 游戏描述选择器 */
  gameDescription?: string;
  /** 游戏图片选择器 */
  gameImage?: string;
  /** 游戏标签选择器 */
  gameTags?: string;
  /** 分页选择器 */
  pagination?: string;
  /** 下一页选择器 */
  nextPage?: string;
}

/**
 * 过滤规则
 */
export interface FilterRule {
  /** 规则名称 */
  name: string;
  /** 规则类型 */
  type: FilterType;
  /** 规则条件 */
  condition: string;
  /** 是否启用 */
  enabled: boolean;
  /** 规则描述 */
  description?: string;
}

/**
 * 字段映射
 */
export interface FieldMapping {
  /** 标题字段映射 */
  title: string;
  /** 描述字段映射 */
  description: string;
  /** 链接字段映射 */
  url: string;
  /** 图片字段映射 */
  image?: string;
  /** 标签字段映射 */
  tags?: string;
  /** 自定义字段映射 */
  custom?: Record<string, string>;
}

/**
 * 提取规则
 */
export interface ExtractionRule {
  /** 规则名称 */
  name: string;
  /** 选择器 */
  selector: string;
  /** 属性名（如href, src, text等） */
  attribute?: string;
  /** 正则表达式 */
  regex?: string;
  /** 替换规则 */
  replace?: ReplaceRule;
  /** 是否必填 */
  required: boolean;
  /** 默认值 */
  defaultValue?: string;
  /** 验证规则 */
  validation?: ValidationRule;
}

/**
 * 清洗规则
 */
export interface CleanupRule {
  /** 规则名称 */
  name: string;
  /** 规则类型 */
  type: CleanupType;
  /** 目标字段 */
  field: string;
  /** 规则配置 */
  config: any;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 替换规则
 */
export interface ReplaceRule {
  /** 查找模式（正则表达式） */
  pattern: string;
  /** 替换内容 */
  replacement: string;
  /** 替换标志 */
  flags?: string;
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 正则表达式验证 */
  pattern?: string;
  /** 是否必须是URL */
  isUrl?: boolean;
  /** 是否必须是图片URL */
  isImage?: boolean;
}

/**
 * 代理配置
 */
export interface ProxyConfig {
  /** 代理类型 */
  type: 'http' | 'https' | 'socks4' | 'socks5';
  /** 代理主机 */
  host: string;
  /** 代理端口 */
  port: number;
  /** 用户名 */
  username?: string;
  /** 密码 */
  password?: string;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 抓取状态
 */
export type CrawlStatus = 
  | 'idle'        // 空闲
  | 'crawling'    // 抓取中
  | 'success'     // 成功
  | 'failed'      // 失败
  | 'paused'      // 暂停
  | 'disabled';   // 禁用

/**
 * 过滤规则类型
 */
export type FilterType = 
  | 'include'     // 包含
  | 'exclude'     // 排除
  | 'regex'       // 正则表达式
  | 'length'      // 长度限制
  | 'contains';   // 包含特定内容

/**
 * 清洗规则类型
 */
export type CleanupType = 
  | 'removeHtml'     // 移除HTML标签
  | 'trimSpaces'     // 去除多余空格
  | 'removeSpecialChars' // 移除特殊字符
  | 'toLowerCase'    // 转为小写
  | 'capitalizeFirst' // 首字母大写
  | 'removeUrls'     // 移除URL
  | 'limitLength'    // 限制长度
  | 'replaceText';   // 替换文本

/**
 * 竞品游戏数据
 */
export interface CompetitorGame {
  /** 游戏ID */
  id: string;
  /** 来源网站ID */
  websiteId: string;
  /** 来源网站名称 */
  websiteName: string;
  /** 游戏标题 */
  title: string;
  /** 游戏描述 */
  description?: string;
  /** 游戏URL */
  url: string;
  /** 游戏图片URL */
  imageUrl?: string;
  /** 游戏标签 */
  tags: string[];
  /** 游戏分类 */
  category?: string;
  /** 游戏评分 */
  rating?: number;
  /** 游戏人气 */
  popularity?: number;
  /** 原始数据 */
  rawData?: Record<string, any>;
  /** 抓取时间 */
  crawledAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 内容质量分数 */
  qualityScore?: number;
  /** 是否已处理 */
  processed: boolean;
}

/**
 * 抓取结果
 */
export interface CrawlResult {
  /** 网站ID */
  websiteId: string;
  /** 抓取开始时间 */
  startTime: Date;
  /** 抓取结束时间 */
  endTime?: Date;
  /** 抓取状态 */
  status: CrawlStatus;
  /** 成功抓取的游戏数量 */
  successCount: number;
  /** 失败抓取的游戏数量 */
  failureCount: number;
  /** 总页面数 */
  totalPages?: number;
  /** 已处理页面数 */
  processedPages?: number;
  /** 错误信息 */
  errors: CrawlError[];
  /** 统计信息 */
  stats: CrawlStats;
}

/**
 * 抓取错误
 */
export interface CrawlError {
  /** 错误类型 */
  type: 'network' | 'parsing' | 'validation' | 'timeout' | 'rate_limit' | 'unknown';
  /** 错误消息 */
  message: string;
  /** 错误URL */
  url?: string;
  /** 错误时间 */
  timestamp: Date;
  /** 错误详情 */
  details?: any;
  /** 重试次数 */
  retryCount?: number;
}

/**
 * 抓取统计
 */
export interface CrawlStats {
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 平均响应时间（毫秒） */
  avgResponseTime: number;
  /** 总抓取时间（毫秒） */
  totalDuration: number;
  /** 每秒请求数 */
  requestsPerSecond: number;
  /** 数据量（字节） */
  dataSize: number;
}

/**
 * 网站匹配配置
 */
export interface MatchingConfig {
  /** 相似度阈值 */
  similarityThreshold: number;
  /** 匹配算法类型 */
  algorithm: MatchingAlgorithm[];
  /** 权重配置 */
  weights: MatchingWeights;
  /** 最大匹配数量 */
  maxMatches: number;
  /** 是否启用模糊匹配 */
  enableFuzzyMatch: boolean;
}

/**
 * 匹配算法类型
 */
export type MatchingAlgorithm = 
  | 'levenshtein'   // 编辑距离
  | 'cosine'        // 余弦相似度
  | 'jaccard'       // Jaccard相似度
  | 'soundex'       // 语音相似度
  | 'metaphone';    // Metaphone算法

/**
 * 匹配权重配置
 */
export interface MatchingWeights {
  /** 标题权重 */
  title: number;
  /** 描述权重 */
  description: number;
  /** 标签权重 */
  tags: number;
  /** 分类权重 */
  category: number;
  /** URL权重 */
  url: number;
}

export default CompetitorWebsite; 