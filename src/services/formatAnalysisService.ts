/**
 * 格式分析服务 - 三阶段AI生成架构之阶段一
 * 负责分析用户提供的 games.json 格式，生成压缩规则和缓存结果
 */

import { deepseekApi } from './deepseekApi';
import { localStorageService } from './localStorage';
import type { 
  FormatAnalysisResult, 
  DetailedFormatRules, 
  FieldConstraint,
  ChatMessage 
} from '@/types/DeepSeek.types';

/**
 * 格式分析配置
 */
interface FormatAnalysisConfig {
  maxTokens: number;
  temperature: number;
  cacheEnabled: boolean;
  cacheTtl: number; // 毫秒
}

/**
 * 格式缓存项
 */
interface FormatCacheItem {
  formatHash: string;
  result: FormatAnalysisResult;
  timestamp: number;
  ttl: number;
}

/**
 * 分析统计信息
 */
interface AnalysisStats {
  totalAnalyses: number;
  cacheHits: number;
  averageAnalysisTime: number;
  errors: number;
  lastAnalysisTime: number;
}

/**
 * 格式分析服务类
 */
export class FormatAnalysisService {
  private config: FormatAnalysisConfig;
  private cache: Map<string, FormatCacheItem>;
  private stats: AnalysisStats;

  constructor(config?: Partial<FormatAnalysisConfig>) {
    this.config = {
      maxTokens: 2000,
      temperature: 0.1, // 低温度确保输出稳定
      cacheEnabled: true,
      cacheTtl: 24 * 60 * 60 * 1000, // 24小时
      ...config,
    };

    this.cache = new Map();
    this.stats = this.initializeStats();
    
    // 从本地存储恢复缓存
    this.loadCacheFromStorage();
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): AnalysisStats {
    const saved = localStorageService.get('format_analysis_stats');
    if (saved.success && saved.data && typeof saved.data === 'object') {
      return saved.data as AnalysisStats;
    }

    return {
      totalAnalyses: 0,
      cacheHits: 0,
      averageAnalysisTime: 0,
      errors: 0,
      lastAnalysisTime: 0,
    };
  }

  /**
   * 从本地存储加载缓存
   */
  private loadCacheFromStorage(): void {
    if (!this.config.cacheEnabled) return;

    const saved = localStorageService.get('format_analysis_cache');
    if (saved.success && Array.isArray(saved.data)) {
      const now = Date.now();
      
      saved.data.forEach((item: FormatCacheItem) => {
        // 检查是否过期
        if (now - item.timestamp < item.ttl) {
          this.cache.set(item.formatHash, item);
        }
      });
    }
  }

  /**
   * 保存缓存到本地存储
   */
  private saveCacheToStorage(): void {
    if (!this.config.cacheEnabled) return;

    const cacheArray = Array.from(this.cache.values());
    localStorageService.set('format_analysis_cache', cacheArray);
  }

  /**
   * 保存统计信息
   */
  private saveStats(): void {
    localStorageService.set('format_analysis_stats', this.stats);
  }

  /**
   * 生成格式指纹
   */
  private generateFormatHash(jsonFormat: string): string {
    // 简单的哈希算法，用于缓存键
    let hash = 0;
    for (let i = 0; i < jsonFormat.length; i++) {
      const char = jsonFormat.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 检查缓存
   */
  private checkCache(formatHash: string): FormatAnalysisResult | null {
    if (!this.config.cacheEnabled) return null;

    const cached = this.cache.get(formatHash);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(formatHash);
      this.saveCacheToStorage();
      return null;
    }

    this.stats.cacheHits++;
    this.saveStats();
    return cached.result;
  }

  /**
   * 设置缓存
   */
  private setCache(formatHash: string, result: FormatAnalysisResult): void {
    if (!this.config.cacheEnabled) return;

    const cacheItem: FormatCacheItem = {
      formatHash,
      result,
      timestamp: Date.now(),
      ttl: this.config.cacheTtl,
    };

    this.cache.set(formatHash, cacheItem);
    this.saveCacheToStorage();
  }

  /**
   * 构建分析 Prompt
   */
  private buildAnalysisPrompt(jsonFormat: string): ChatMessage[] {
    const systemPrompt = `你是一个JSON格式分析专家。你的任务是深度分析用户提供的JSON格式示例，并生成精简的格式约束规则。

分析要求：
1. 深度分析JSON结构，识别所有字段的类型、层级关系、必填性
2. 生成压缩的格式规则，控制在500 tokens以内
3. 提取最关键的约束条件和验证规则
4. 生成简化的JSON模板

输出格式要求：
返回严格的JSON格式，包含以下字段：
{
  "compactTemplate": "压缩的JSON模板字符串",
  "fieldConstraints": ["字段约束规则数组"],
  "validationRules": ["验证规则数组"],
  "formatHash": "格式指纹(由你生成)",
  "detailedRules": {
    "schema": {字段详细规则},
    "structureRules": ["结构规则数组"],
    "outputTemplate": 完整模板对象
  }
}

注意：
- compactTemplate 要尽可能简化，用简短的类型标识符
- fieldConstraints 要精准描述每个字段的约束
- validationRules 要包含核心验证逻辑
- 所有文本都要简洁明了，避免冗余`;

    const userPrompt = `请分析以下JSON格式，生成压缩规则：

\`\`\`json
${jsonFormat}
\`\`\`

请按照要求的JSON格式返回分析结果。`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  /**
   * 解析AI分析结果
   */
  private parseAnalysisResult(aiResponse: string): FormatAnalysisResult {
    try {
      // 提取JSON部分
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('AI响应中未找到有效的JSON格式');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const result = JSON.parse(jsonStr);

      // 验证必要字段
      if (!result.compactTemplate || !result.fieldConstraints || !result.validationRules) {
        throw new Error('AI返回的结果缺少必要字段');
      }

      return {
        compactTemplate: result.compactTemplate,
        fieldConstraints: Array.isArray(result.fieldConstraints) ? result.fieldConstraints : [],
        validationRules: Array.isArray(result.validationRules) ? result.validationRules : [],
        formatHash: result.formatHash || this.generateFormatHash(jsonStr),
        detailedRules: result.detailedRules || this.generateDefaultDetailedRules(result)
      };

    } catch (error) {
      throw new Error(`解析AI分析结果失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 生成默认的详细规则（作为后备）
   */
  private generateDefaultDetailedRules(basicResult: any): DetailedFormatRules {
    return {
      schema: {},
      structureRules: basicResult.validationRules || [],
      outputTemplate: {}
    };
  }

  /**
   * 更新统计信息
   */
  private updateStats(analysisTime: number, isError: boolean = false): void {
    this.stats.totalAnalyses++;
    this.stats.lastAnalysisTime = Date.now();
    
    if (isError) {
      this.stats.errors++;
    } else {
      // 更新平均分析时间
      this.stats.averageAnalysisTime = 
        (this.stats.averageAnalysisTime * (this.stats.totalAnalyses - 1) + analysisTime) / 
        this.stats.totalAnalyses;
    }
    
    this.saveStats();
  }

  /**
   * 主要的格式分析方法
   */
  public async analyzeFormat(jsonFormat: string): Promise<{
    success: boolean;
    result?: FormatAnalysisResult;
    error?: string;
    metadata: {
      cacheHit: boolean;
      analysisTime: number;
      tokensUsed?: number;
    };
  }> {
    const startTime = Date.now();
    let cacheHit = false;
    
    try {
      // 生成格式指纹
      const formatHash = this.generateFormatHash(jsonFormat);
      
      // 检查缓存
      const cachedResult = this.checkCache(formatHash);
      if (cachedResult) {
        const analysisTime = Date.now() - startTime;
        return {
          success: true,
          result: cachedResult,
          metadata: {
            cacheHit: true,
            analysisTime
          }
        };
      }

      // 构建分析Prompt
      const messages = this.buildAnalysisPrompt(jsonFormat);
      
      // 调用AI进行分析
      const aiResponse = await deepseekApi.chat(messages, {
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      // 解析AI响应
      const result = this.parseAnalysisResult(aiResponse.choices[0].message.content);
      result.formatHash = formatHash; // 确保使用正确的哈希值
      
      // 缓存结果
      this.setCache(formatHash, result);
      
      const analysisTime = Date.now() - startTime;
      this.updateStats(analysisTime, false);

      return {
        success: true,
        result,
        metadata: {
          cacheHit: false,
          analysisTime,
          tokensUsed: aiResponse.usage?.total_tokens
        }
      };

    } catch (error) {
      const analysisTime = Date.now() - startTime;
      this.updateStats(analysisTime, true);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        metadata: {
          cacheHit,
          analysisTime
        }
      };
    }
  }

  /**
   * 批量分析多个格式
   */
  public async analyzeMultipleFormats(formats: { id: string; jsonFormat: string }[]): Promise<{
    success: boolean;
    results: { id: string; result?: FormatAnalysisResult; error?: string }[];
    metadata: {
      totalTime: number;
      cacheHits: number;
      totalTokensUsed: number;
    };
  }> {
    const startTime = Date.now();
    let cacheHits = 0;
    let totalTokensUsed = 0;
    const results: { id: string; result?: FormatAnalysisResult; error?: string }[] = [];

    for (const format of formats) {
      try {
        const analysis = await this.analyzeFormat(format.jsonFormat);
        
        if (analysis.success) {
          results.push({
            id: format.id,
            result: analysis.result
          });
          
          if (analysis.metadata.cacheHit) {
            cacheHits++;
          }
          
          if (analysis.metadata.tokensUsed) {
            totalTokensUsed += analysis.metadata.tokensUsed;
          }
        } else {
          results.push({
            id: format.id,
            error: analysis.error
          });
        }
      } catch (error) {
        results.push({
          id: format.id,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return {
      success: results.every(r => !r.error),
      results,
      metadata: {
        totalTime: Date.now() - startTime,
        cacheHits,
        totalTokensUsed
      }
    };
  }

  /**
   * 获取统计信息
   */
  public getStats(): AnalysisStats {
    return { ...this.stats };
  }

  /**
   * 获取缓存信息
   */
  public getCacheInfo(): {
    size: number;
    items: Array<{
      hash: string;
      timestamp: number;
      ttl: number;
      expired: boolean;
    }>;
  } {
    const now = Date.now();
    const items = Array.from(this.cache.entries()).map(([hash, item]) => ({
      hash,
      timestamp: item.timestamp,
      ttl: item.ttl,
      expired: now - item.timestamp > item.ttl
    }));

    return {
      size: this.cache.size,
      items
    };
  }

  /**
   * 清理过期缓存
   */
  public cleanExpiredCache(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [hash, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(hash);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveCacheToStorage();
    }

    return cleaned;
  }

  /**
   * 清空所有缓存
   */
  public clearCache(): void {
    this.cache.clear();
    this.saveCacheToStorage();
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
    this.stats = {
      totalAnalyses: 0,
      cacheHits: 0,
      averageAnalysisTime: 0,
      errors: 0,
      lastAnalysisTime: 0,
    };
    this.saveStats();
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<FormatAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): FormatAnalysisConfig {
    return { ...this.config };
  }

  /**
   * 验证JSON格式是否有效
   */
  public validateJsonFormat(jsonFormat: string): {
    valid: boolean;
    error?: string;
    suggestions?: string[];
  } {
    try {
      JSON.parse(jsonFormat);
      
      // 检查是否为空对象
      const parsed = JSON.parse(jsonFormat);
      if (typeof parsed !== 'object' || parsed === null) {
        return {
          valid: false,
          error: 'JSON格式必须是一个对象',
          suggestions: ['确保JSON是一个有效的对象格式', '检查是否有缺失的花括号']
        };
      }

      // 检查是否有内容
      if (Object.keys(parsed).length === 0) {
        return {
          valid: false,
          error: 'JSON对象不能为空',
          suggestions: ['添加至少一个字段', '提供有意义的示例数据']
        };
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: `JSON格式错误: ${error instanceof Error ? error.message : '未知错误'}`,
        suggestions: [
          '检查JSON语法是否正确',
          '确保所有字符串都用双引号包围',
          '检查是否有多余的逗号',
          '验证嵌套结构是否正确'
        ]
      };
    }
  }
}

// 导出单例实例
export const formatAnalysisService = new FormatAnalysisService();

export default formatAnalysisService; 