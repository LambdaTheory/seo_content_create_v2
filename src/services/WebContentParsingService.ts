/**
 * 网站特定内容解析服务
 * 功能特性：
 * - 多网站解析规则支持
 * - 通用HTML解析器
 * - 内容提取和清洗
 * - 可扩展的解析器架构
 * - 解析结果统一格式化
 */

import { ScrapingResponse } from './WebScrapingService';
import { CoolMathGamesParser } from './parsers/CoolMathGamesParser';
import { GameDistributionParser } from './parsers/GameDistributionParser';
import { TwoPlayerGamesParser } from './parsers/TwoPlayerGamesParser';
import { GenericHtmlParser } from './parsers/GenericHtmlParser';

/**
 * 解析配置接口
 */
export interface ParseConfig {
  /** 是否启用文本清理 */
  enableTextCleaning: boolean;
  /** 是否启用HTML过滤 */
  enableHtmlFiltering: boolean;
  /** 文本长度限制 */
  maxTextLength: number;
  /** 是否提取链接 */
  extractLinks: boolean;
  /** 是否提取图片 */
  extractImages: boolean;
  /** 自定义选择器 */
  customSelectors?: Record<string, string>;
}

/**
 * 解析的游戏内容
 */
export interface ParsedGameContent {
  /** 游戏标题 */
  title: string;
  /** 游戏描述 */
  description: string;
  /** 玩法说明 */
  instructions?: string;
  /** 特色功能 */
  features?: string[];
  /** 游戏标签 */
  tags?: string[];
  /** 游戏分类 */
  category?: string;
  /** 缩略图URL */
  thumbnail?: string;
  /** 游戏链接 */
  gameUrl?: string;
  /** 评分 */
  rating?: number;
  /** 玩家数量 */
  playerCount?: string;
  /** 发布日期 */
  publishDate?: string;
  /** 开发者 */
  developer?: string;
  /** 额外链接 */
  links?: Array<{
    type: string;
    url: string;
    text: string;
  }>;
  /** 额外图片 */
  images?: Array<{
    type: string;
    url: string;
    alt: string;
  }>;
  /** 原始数据 */
  raw?: Record<string, any>;
}

/**
 * 解析结果
 */
export interface ParseResult {
  /** 是否解析成功 */
  success: boolean;
  /** 解析的内容 */
  content?: ParsedGameContent;
  /** 错误信息 */
  error?: string;
  /** 使用的解析器 */
  parser: string;
  /** 解析时间 */
  parseTime: number;
  /** 内容质量评分 */
  qualityScore: number;
  /** 置信度 */
  confidence: number;
}

/**
 * 网站解析器接口
 */
export interface WebsiteParser {
  /** 解析器名称 */
  name: string;
  /** 支持的域名 */
  domains: string[];
  /** 解析内容 */
  parse(html: string, url: string, config: ParseConfig): ParseResult;
  /** 检查是否支持该URL */
  canParse(url: string): boolean;
}

/**
 * 解析统计信息
 */
export interface ParsingStats {
  /** 总解析次数 */
  totalParses: number;
  /** 成功解析次数 */
  successfulParses: number;
  /** 失败解析次数 */
  failedParses: number;
  /** 平均解析时间 */
  averageParseTime: number;
  /** 平均质量评分 */
  averageQualityScore: number;
  /** 各解析器使用统计 */
  parserUsage: Record<string, number>;
  /** 成功率 */
  successRate: number;
}

/**
 * 网站内容解析服务
 */
export class WebContentParsingService {
  private readonly DEFAULT_CONFIG: ParseConfig = {
    enableTextCleaning: true,
    enableHtmlFiltering: true,
    maxTextLength: 10000,
    extractLinks: false,
    extractImages: false
  };

  private parsers: WebsiteParser[] = [];
  private genericParser: GenericHtmlParser;
  private stats: ParsingStats;

  constructor(config?: Partial<ParseConfig>) {
    this.genericParser = new GenericHtmlParser();
    this.stats = this.initializeStats();
    this.initializeParsers();
  }

  /**
   * 初始化解析器
   */
  private initializeParsers(): void {
    this.parsers = [
      new CoolMathGamesParser(),
      new GameDistributionParser(),
      new TwoPlayerGamesParser()
    ];
  }

  /**
   * 解析网站内容
   */
  public parseContent(response: ScrapingResponse, config?: Partial<ParseConfig>): ParseResult {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const parser = this.findParser(response.finalUrl);
    
    const result = parser.parse(response.content, response.finalUrl, mergedConfig);
    
    // 更新统计信息
    this.updateStats(result);
    
    return result;
  }

  /**
   * 批量解析内容
   */
  public batchParseContent(responses: ScrapingResponse[], config?: Partial<ParseConfig>): ParseResult[] {
    return responses.map(response => this.parseContent(response, config));
  }

  /**
   * 查找合适的解析器
   */
  public findParser(url: string): WebsiteParser {
    // 首先尝试专用解析器
    for (const parser of this.parsers) {
      if (parser.canParse(url)) {
        return parser;
      }
    }
    
    // 如果没有找到专用解析器，使用通用解析器
    return this.genericParser;
  }

  /**
   * 注册新的解析器
   */
  public registerParser(parser: WebsiteParser): void {
    // 检查是否已存在相同名称的解析器
    const existingIndex = this.parsers.findIndex(p => p.name === parser.name);
    if (existingIndex >= 0) {
      this.parsers[existingIndex] = parser;
    } else {
      this.parsers.push(parser);
    }
  }

  /**
   * 获取支持的网站列表
   */
  public getSupportedWebsites(): Array<{name: string, domains: string[]}> {
    const websites = this.parsers.map(parser => ({
      name: parser.name,
      domains: parser.domains
    }));

    // 添加通用解析器
    websites.push({
      name: this.genericParser.name,
      domains: ['*']
    });

    return websites;
  }

  /**
   * 测试解析器
   */
  public testParser(url: string, html: string, config?: Partial<ParseConfig>): ParseResult {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const parser = this.findParser(url);
    return parser.parse(html, url, mergedConfig);
  }

  /**
   * 获取统计信息
   */
  public getStats(): ParsingStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
    this.stats = this.initializeStats();
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ParseConfig>): void {
    Object.assign(this.DEFAULT_CONFIG, newConfig);
  }

  /**
   * 获取当前配置
   */
  public getConfig(): ParseConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * 更新统计信息
   */
  private updateStats(result: ParseResult): void {
    this.stats.totalParses++;
    
    if (result.success) {
      this.stats.successfulParses++;
      this.stats.averageQualityScore = 
        (this.stats.averageQualityScore * (this.stats.successfulParses - 1) + result.qualityScore) / 
        this.stats.successfulParses;
    } else {
      this.stats.failedParses++;
    }

    // 更新平均解析时间
    this.stats.averageParseTime = 
      (this.stats.averageParseTime * (this.stats.totalParses - 1) + result.parseTime) / 
      this.stats.totalParses;

    // 更新解析器使用统计
    if (!this.stats.parserUsage[result.parser]) {
      this.stats.parserUsage[result.parser] = 0;
    }
    this.stats.parserUsage[result.parser]++;

    // 更新成功率
    this.stats.successRate = this.stats.successfulParses / this.stats.totalParses;
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): ParsingStats {
    return {
      totalParses: 0,
      successfulParses: 0,
      failedParses: 0,
      averageParseTime: 0,
      averageQualityScore: 0,
      parserUsage: {},
      successRate: 0
    };
  }
} 