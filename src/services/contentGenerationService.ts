/**
 * 内容生成服务 - 三阶段AI生成架构之阶段二
 * 负责基于游戏数据、竞品内容和格式规则生成游戏内容
 */

import { deepseekApi } from './deepseekApi';
import { localStorageService } from './localStorage';
import type { 
  ContentGenerationRequest,
  FormatAnalysisResult,
  CompetitorContentSummary,
  ContentSettings,
  GenerationResult,
  ChatMessage 
} from '@/types/DeepSeek.types';
import { DeepSeekApiService } from './deepseekApi';
import { FormatAnalysisService } from './formatAnalysisService';
import { GameData } from '@/types/GameData.types';

// 定义内容生成结果类型
export interface ContentGenerationResult {
  gameId: string;
  content: any;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  quality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  metadata: {
    generatedAt: Date;
    formatRulesHash: string;
    contentSettings: ContentSettings;
    competitorContentUsed: number;
    retryCount: number;
    generationTime: number;
  };
}

/**
 * 内容生成配置
 */
interface ContentGenerationConfig {
  maxTokens: number;
  temperature: number;
  maxConcurrency: number; // 最大并发数
  retryAttempts: number;
  retryDelay: number;
  competitorContentMaxTokens: number; // 竞品内容最大tokens
}

/**
 * 生成统计信息
 */
interface GenerationStats {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTime: number;
  averageTokensUsed: number;
  concurrentGenerations: number;
  maxConcurrentReached: number;
  lastGenerationTime: number;
}

/**
 * 并发任务管理
 */
interface GenerationTask {
  id: string;
  gameData: ContentGenerationRequest['gameData'];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  result?: GenerationResult;
  error?: string;
  retryCount: number;
}

/**
 * 内容生成服务类
 */
export class ContentGenerationService {
  private config: ContentGenerationConfig;
  private stats: GenerationStats;
  private runningTasks: Map<string, GenerationTask>;
  private taskQueue: GenerationTask[];
  private deepSeekApi: DeepSeekApiService;
  private formatAnalysisService: FormatAnalysisService;

  // Token 限制配置
  private readonly TOKEN_LIMITS = {
    TOTAL_CONTEXT: 4000,          // 总上下文限制
    FORMAT_RULES: 500,            // 格式规则限制
    COMPETITOR_CONTENT: 800,      // 竞品内容限制
    GAME_DATA: 300,               // 游戏数据限制
    CONTENT_SETTINGS: 200,        // 内容设置限制
    PROMPT_TEMPLATE: 300,         // Prompt模板限制
    RESPONSE_BUFFER: 1900         // 生成内容空间
  };

  constructor(config?: Partial<ContentGenerationConfig>) {
    this.config = {
      maxTokens: 4000,
      temperature: 0.7,
      maxConcurrency: 3, // 最多同时处理3个游戏
      retryAttempts: 3,
      retryDelay: 1000,
      competitorContentMaxTokens: 800,
      ...config,
    };

    this.stats = this.initializeStats();
    this.runningTasks = new Map();
    this.taskQueue = [];
    this.deepSeekApi = new DeepSeekApiService();
    this.formatAnalysisService = new FormatAnalysisService();
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): GenerationStats {
    const saved = localStorageService.get('content_generation_stats');
    if (saved.success && saved.data && typeof saved.data === 'object') {
      return saved.data as GenerationStats;
    }

    return {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageGenerationTime: 0,
      averageTokensUsed: 0,
      concurrentGenerations: 0,
      maxConcurrentReached: 0,
      lastGenerationTime: 0,
    };
  }

  /**
   * 保存统计信息
   */
  private saveStats(): void {
    localStorageService.set('content_generation_stats', this.stats);
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 压缩竞品内容
   */
  private compressCompetitorContent(
    competitorContent: CompetitorContentSummary[]
  ): string {
    if (!competitorContent || competitorContent.length === 0) {
      return '无竞品参考内容';
    }

    // 按相关性排序，取前3个最相关的
    const sortedContent = competitorContent
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);

    let compressed = '竞品参考内容：\n';
    let totalTokens = 0;
    const maxTokensPerItem = Math.floor(this.config.competitorContentMaxTokens / sortedContent.length);

    for (const content of sortedContent) {
      let itemContent = `[${content.source}] ${content.title}\n`;
      
      // 压缩描述
      const description = content.description.length > 200 
        ? content.description.substring(0, 200) + '...'
        : content.description;
      
      itemContent += `描述: ${description}\n`;
      
      // 添加特色功能（如果有）
      if (content.features && content.features.length > 0) {
        const features = content.features.slice(0, 3).join(', ');
        itemContent += `特色: ${features}\n`;
      }
      
      itemContent += `相关度: ${content.relevanceScore.toFixed(2)}\n\n`;
      
      // 检查token限制
      const estimatedTokens = itemContent.length / 4; // 粗略估算
      if (totalTokens + estimatedTokens <= this.config.competitorContentMaxTokens) {
        compressed += itemContent;
        totalTokens += estimatedTokens;
      }
    }

    return compressed;
  }

  /**
   * 构建内容生成 Prompt
   */
  private buildGenerationPrompt(
    gameData: ContentGenerationRequest['gameData'],
    competitorContent: CompetitorContentSummary[],
    formatRules: FormatAnalysisResult,
    contentSettings: ContentSettings
  ): ChatMessage[] {
    // 压缩竞品内容
    const compressedCompetitorContent = this.compressCompetitorContent(competitorContent);

    const systemPrompt = `你是一个专业的游戏内容生成专家。你的任务是为游戏生成高质量、SEO友好的内容。

生成要求：
1. 严格遵循提供的JSON格式规则
2. 内容要符合SEO优化标准
3. 参考竞品内容，但确保原创性
4. 满足字数和关键词密度要求
5. 内容要自然流畅，避免关键词堆砌

格式约束（必须严格遵循）：
${formatRules.fieldConstraints.join('\n')}

验证规则：
${formatRules.validationRules.join('\n')}

内容设置：
- 总字数范围: ${contentSettings.wordCount.total.min}-${contentSettings.wordCount.total.max}字
- 主关键词密度: 目标${contentSettings.keywordDensity.mainKeyword.target}%，不超过${contentSettings.keywordDensity.mainKeyword.max}%
- 长尾关键词密度: 目标${contentSettings.keywordDensity.longTailKeywords.target}%，不超过${contentSettings.keywordDensity.longTailKeywords.max}%
- 生成模式: ${contentSettings.generationMode}
- 目标受众: ${contentSettings.qualityParams.targetAudience}
- 可读性级别: ${contentSettings.qualityParams.readabilityLevel}

重要提示：
- 输出必须是有效的JSON格式
- 字段名必须与格式要求完全一致
- 数值类型不要用引号包围
- 数组格式必须正确
- 嵌套对象结构要完整`;

    const userPrompt = `请为以下游戏生成内容：

游戏基本信息：
- 游戏名称: ${gameData.gameName}
- 主关键词: ${gameData.mainKeyword}
- 长尾关键词: ${gameData.longTailKeywords?.join(', ') || '无'}
- 游戏链接: ${gameData.realUrl}
- 图标链接: ${gameData.iconUrl || '无'}
- 视频链接: ${gameData.videoLink || '无'}
- 内链: ${gameData.internalLinks?.join(', ') || '无'}

${compressedCompetitorContent}

请严格按照格式约束生成JSON内容，确保：
1. 所有必填字段都包含
2. 字数控制在要求范围内
3. 关键词自然分布
4. 内容原创且有价值
5. JSON格式正确无误

生成的JSON内容：`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  /**
   * 解析生成结果
   */
  private parseGenerationResult(aiResponse: string, gameData: ContentGenerationRequest['gameData']): any {
    try {
      // 提取JSON部分
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('AI响应中未找到有效的JSON格式');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const result = JSON.parse(jsonStr);

      // 基本验证
      if (!result || typeof result !== 'object') {
        throw new Error('生成的内容不是有效的对象');
      }

      return result;

    } catch (error) {
      throw new Error(`解析生成结果失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 质量评估
   */
  private assessQuality(
    content: any, 
    gameData: ContentGenerationRequest['gameData'],
    contentSettings: ContentSettings
  ): number {
    let score = 100;
    
    try {
      // 基础结构检查
      if (!content || typeof content !== 'object') {
        score -= 50;
      }

      // 关键词密度检查（简化版）
      const contentStr = JSON.stringify(content).toLowerCase();
      const mainKeyword = gameData.mainKeyword.toLowerCase();
      const mainKeywordCount = (contentStr.match(new RegExp(mainKeyword, 'g')) || []).length;
      const totalWords = contentStr.split(/\s+/).length;
      
      if (totalWords > 0) {
        const mainKeywordDensity = (mainKeywordCount / totalWords) * 100;
        const targetDensity = contentSettings.keywordDensity.mainKeyword.target;
        const maxDensity = contentSettings.keywordDensity.mainKeyword.max;
        
        if (mainKeywordDensity < targetDensity * 0.5) {
          score -= 20; // 密度过低
        } else if (mainKeywordDensity > maxDensity) {
          score -= 30; // 密度过高
        }
      }

      // 字数检查
      const wordCount = contentStr.length;
      const minWords = contentSettings.wordCount.total.min;
      const maxWords = contentSettings.wordCount.total.max;
      
      if (wordCount < minWords * 0.8) {
        score -= 15; // 字数不足
      } else if (wordCount > maxWords * 1.2) {
        score -= 10; // 字数过多
      }

      // 确保分数在0-100范围内
      return Math.max(0, Math.min(100, score));

    } catch (error) {
      return 50; // 评估失败，返回中等分数
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(
    generationTime: number,
    tokensUsed: number,
    isSuccess: boolean
  ): void {
    this.stats.totalGenerations++;
    this.stats.lastGenerationTime = Date.now();
    
    if (isSuccess) {
      this.stats.successfulGenerations++;
      
      // 更新平均生成时间
      this.stats.averageGenerationTime = 
        (this.stats.averageGenerationTime * (this.stats.successfulGenerations - 1) + generationTime) / 
        this.stats.successfulGenerations;
      
      // 更新平均token使用量
      this.stats.averageTokensUsed = 
        (this.stats.averageTokensUsed * (this.stats.successfulGenerations - 1) + tokensUsed) / 
        this.stats.successfulGenerations;
    } else {
      this.stats.failedGenerations++;
    }
    
    // 更新并发统计
    this.stats.concurrentGenerations = this.runningTasks.size;
    this.stats.maxConcurrentReached = Math.max(
      this.stats.maxConcurrentReached, 
      this.stats.concurrentGenerations
    );
    
    this.saveStats();
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成单个游戏内容 - 任务 7.2.6 核心实现
   * 包含生成失败自动重试、生成进度追踪和状态管理
   */
  async generateGameContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    const gameId = this.generateGameId(request.gameData);
    let lastError: Error | null = null;

    // 生成进度追踪
    console.log(`开始生成游戏内容: ${request.gameData.gameName} (ID: ${gameId})`);

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`尝试生成 ${attempt}/${this.config.retryAttempts}: ${request.gameData.gameName}`);

        // 1. 构建智能Prompt
        const prompt = await this.buildIntelligentPrompt(request);
        
        // 2. 验证上下文长度
        const tokenCount = this.estimateTokenCount(prompt);
        if (tokenCount > this.TOKEN_LIMITS.TOTAL_CONTEXT) {
          throw new Error(`上下文过长: ${tokenCount} tokens, 限制: ${this.TOKEN_LIMITS.TOTAL_CONTEXT}`);
        }

        console.log(`Prompt准备完成，token数: ${tokenCount}`);

        // 3. 调用AI生成内容
        const response = await this.deepSeekApi.chat(prompt, {
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        });

        console.log(`AI响应完成，使用tokens: ${response.usage?.total_tokens || 0}`);
        
        // 4. 解析和验证响应
        const generatedContent = this.parseGeneratedContent(response.choices[0].message.content);

        // 5. 内容质量验证
        const validation = this.validateGeneratedContent(generatedContent, request.formatRules);

        // 6. 详细质量分析
        const wordAnalysis = this.analyzeWordCount(generatedContent, request.contentSettings);
        const keywordAnalysis = this.analyzeKeywordDensity(generatedContent, request.gameData, request.contentSettings);
        const qualityAnalysis = this.calculateQualityScore(generatedContent, request, wordAnalysis, keywordAnalysis);

        const generationTime = Date.now() - startTime;
        const tokensUsed = response.usage?.total_tokens || 0;

        // 7. 更新统计信息
        this.updateStats(generationTime, tokensUsed, true);

        console.log(`内容生成成功: ${request.gameData.gameName}, 质量评分: ${qualityAnalysis.overallScore.toFixed(2)}(${qualityAnalysis.grade})`);

        return {
          gameId,
          content: generatedContent,
          tokenUsage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: tokensUsed
          },
          quality: {
            score: qualityAnalysis.overallScore,
            issues: [...validation.issues, ...qualityAnalysis.recommendations],
            suggestions: qualityAnalysis.recommendations
          },
          metadata: {
            generatedAt: new Date(),
            formatRulesHash: request.formatRules.formatHash,
            contentSettings: request.contentSettings,
            competitorContentUsed: request.competitorContent?.length || 0,
            retryCount: attempt - 1,
            generationTime
          }
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        console.error(`生成尝试 ${attempt} 失败:`, lastError.message);

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // 指数退避
          console.log(`等待 ${delay}ms 后重试...`);
          await this.delay(delay);
        }
      }
    }

    // 所有重试都失败了
    const generationTime = Date.now() - startTime;
    this.updateStats(generationTime, 0, false);

    console.error(`内容生成彻底失败: ${request.gameData.gameName}, 错误: ${lastError?.message}`);
    throw new Error(`内容生成失败 (${this.config.retryAttempts}次重试后): ${lastError?.message || '未知错误'}`);
  }



  /**
   * 提取必填字段
   */
  private extractRequiredFields(formatRules: FormatAnalysisResult): string[] {
    return formatRules.fieldConstraints
      .filter(constraint => constraint.includes('必填'))
      .map(constraint => constraint.split(':')[0].trim());
  }

  /**
   * 检查嵌套字段是否存在
   */
  private hasNestedField(obj: any, fieldPath: string): boolean {
    const parts = fieldPath.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }
    
    return current !== undefined && current !== null;
  }

  /**
   * 任务 7.2.7 实现内容质量控制
   * 字数统计和验证
   */
  private analyzeWordCount(content: any, settings: ContentSettings): {
    totalWords: number;
    moduleWordCount: Record<string, number>;
    isWithinRange: boolean;
    recommendations: string[];
  } {
    const contentText = JSON.stringify(content);
    const totalWords = contentText.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').length; // 统计中英文字符
    
    const moduleWordCount: Record<string, number> = {};
    const recommendations: string[] = [];

    // 分析各模块字数
    if (typeof content === 'object' && content !== null) {
      for (const [key, value] of Object.entries(content)) {
        if (typeof value === 'string') {
          moduleWordCount[key] = value.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').length;
        }
      }
    }

    // 检查总字数范围
    const targetRange = settings.wordCount.total;
    const isWithinRange = totalWords >= targetRange.min && totalWords <= targetRange.max;

    if (totalWords < targetRange.min) {
      recommendations.push(`内容过短(${totalWords}字)，建议增加到${targetRange.min}-${targetRange.max}字`);
    } else if (totalWords > targetRange.max) {
      recommendations.push(`内容过长(${totalWords}字)，建议精简到${targetRange.min}-${targetRange.max}字`);
    }

    // 检查模块字数分配
    for (const [moduleName, moduleRange] of Object.entries(settings.wordCount.modules)) {
      const moduleWords = moduleWordCount[moduleName] || 0;
      if (moduleWords < moduleRange.min) {
        recommendations.push(`${moduleName}模块内容不足(${moduleWords}字)，建议增加到${moduleRange.min}字以上`);
      } else if (moduleWords > moduleRange.max) {
        recommendations.push(`${moduleName}模块内容过多(${moduleWords}字)，建议控制在${moduleRange.max}字以内`);
      }
    }

    return {
      totalWords,
      moduleWordCount,
      isWithinRange,
      recommendations
    };
  }

  /**
   * 关键词密度检测
   */
  private analyzeKeywordDensity(content: any, gameData: ContentGenerationRequest['gameData'], settings: ContentSettings): {
    mainKeywordDensity: number;
    longTailKeywordDensity: number;
    isOptimal: boolean;
    recommendations: string[];
  } {
    const contentText = JSON.stringify(content).toLowerCase();
    const totalLength = contentText.length;
    const recommendations: string[] = [];

    // 主关键词密度分析
    const mainKeyword = gameData.mainKeyword.toLowerCase();
    const mainKeywordMatches = (contentText.match(new RegExp(mainKeyword, 'g')) || []).length;
    const mainKeywordDensity = totalLength > 0 ? (mainKeywordMatches * mainKeyword.length / totalLength) * 100 : 0;

    // 长尾关键词密度分析
    let longTailKeywordMatches = 0;
    let longTailKeywordLength = 0;
    
    if (gameData.longTailKeywords && gameData.longTailKeywords.length > 0) {
      for (const keyword of gameData.longTailKeywords) {
        const keywordLower = keyword.toLowerCase();
        const matches = (contentText.match(new RegExp(keywordLower, 'g')) || []).length;
        longTailKeywordMatches += matches;
        longTailKeywordLength += matches * keywordLower.length;
      }
    }

    const longTailKeywordDensity = totalLength > 0 ? (longTailKeywordLength / totalLength) * 100 : 0;

    // 密度优化建议
    const mainTarget = settings.keywordDensity.mainKeyword.target;
    const mainMax = settings.keywordDensity.mainKeyword.max;
    const longTailTarget = settings.keywordDensity.longTailKeywords.target;
    const longTailMax = settings.keywordDensity.longTailKeywords.max;

    let isOptimal = true;

    if (mainKeywordDensity < mainTarget * 0.8) {
      recommendations.push(`主关键词"${gameData.mainKeyword}"密度偏低(${mainKeywordDensity.toFixed(2)}%)，建议增加到${mainTarget}%`);
      isOptimal = false;
    } else if (mainKeywordDensity > mainMax) {
      recommendations.push(`主关键词"${gameData.mainKeyword}"密度过高(${mainKeywordDensity.toFixed(2)}%)，建议降低到${mainMax}%以下`);
      isOptimal = false;
    }

    if (gameData.longTailKeywords && gameData.longTailKeywords.length > 0) {
      if (longTailKeywordDensity < longTailTarget * 0.8) {
        recommendations.push(`长尾关键词密度偏低(${longTailKeywordDensity.toFixed(2)}%)，建议增加到${longTailTarget}%`);
        isOptimal = false;
      } else if (longTailKeywordDensity > longTailMax) {
        recommendations.push(`长尾关键词密度过高(${longTailKeywordDensity.toFixed(2)}%)，建议降低到${longTailMax}%以下`);
        isOptimal = false;
      }
    }

    return {
      mainKeywordDensity,
      longTailKeywordDensity,
      isOptimal,
      recommendations
    };
  }

  /**
   * 内容质量评分系统 - 综合评估
   */
  private calculateQualityScore(
    content: any,
    request: ContentGenerationRequest,
    wordAnalysis: ReturnType<typeof this.analyzeWordCount>,
    keywordAnalysis: ReturnType<typeof this.analyzeKeywordDensity>
  ): {
    overallScore: number;
    scores: {
      structure: number;
      completeness: number;
      wordCount: number;
      keywordOptimization: number;
      originality: number;
    };
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    recommendations: string[];
  } {
    const scores = {
      structure: 0,
      completeness: 0,
      wordCount: 0,
      keywordOptimization: 0,
      originality: 0
    };

    const recommendations: string[] = [];

    // 1. 结构完整性评分 (25分)
    if (content && typeof content === 'object') {
      scores.structure = 25;
      try {
        JSON.stringify(content);
      } catch {
        scores.structure = 10;
        recommendations.push('JSON格式存在错误，需要修复');
      }
    } else {
      recommendations.push('内容结构不完整，需要生成有效的JSON对象');
    }

    // 2. 内容完整性评分 (25分)
    const requiredFields = this.extractRequiredFields(request.formatRules);
    const presentFields = requiredFields.filter(field => this.hasNestedField(content, field));
    scores.completeness = Math.round((presentFields.length / Math.max(1, requiredFields.length)) * 25);
    
    if (scores.completeness < 20) {
      recommendations.push(`缺少${requiredFields.length - presentFields.length}个必填字段`);
    }

    // 3. 字数控制评分 (20分)
    if (wordAnalysis.isWithinRange) {
      scores.wordCount = 20;
    } else {
      scores.wordCount = Math.max(5, 20 - Math.abs(wordAnalysis.totalWords - request.contentSettings.wordCount.total.min) / 100);
      recommendations.push(...wordAnalysis.recommendations);
    }

    // 4. 关键词优化评分 (20分)
    if (keywordAnalysis.isOptimal) {
      scores.keywordOptimization = 20;
    } else {
      scores.keywordOptimization = Math.max(5, 15);
      recommendations.push(...keywordAnalysis.recommendations);
    }

    // 5. 原创性评分 (10分) - 简化版本
    scores.originality = 8; // 假设大部分内容是原创的，实际可以通过更复杂算法检测

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    // 等级评定
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';
    else grade = 'F';

    return {
      overallScore,
      scores,
      grade,
      recommendations
    };
  }

  /**
   * 生成模式执行逻辑
   */
  private applyGenerationMode(request: ContentGenerationRequest): ContentGenerationRequest {
    const mode = request.contentSettings.generationMode;
    const modifiedRequest = { ...request };

    switch (mode) {
      case 'strict':
        // 严格模式：降低temperature，提高格式约束权重
        modifiedRequest.contentSettings = {
          ...request.contentSettings,
          qualityParams: {
            ...request.contentSettings.qualityParams,
            professionalTone: true,
            creativeFreedom: false
          }
        };
        break;

      case 'free':
        // 自由模式：提高temperature，允许更多创意
        modifiedRequest.contentSettings = {
          ...request.contentSettings,
          qualityParams: {
            ...request.contentSettings.qualityParams,
            creativeFreedom: true
          }
        };
        break;

      case 'standard':
      default:
        // 标准模式：保持默认设置
        break;
    }

    return modifiedRequest;
  }

  /**
   * 构建智能Prompt - 任务 7.2.5 核心实现
   * 集成压缩格式规则到Prompt，实现竞品内容智能摘要，动态上下文长度控制
   */
  private async buildIntelligentPrompt(request: ContentGenerationRequest): Promise<ChatMessage[]> {
    // Token 分配策略 - 动态调整
    const tokenAllocation = this.calculateDynamicTokenAllocation(request);

    // 1. 智能压缩各部分内容
    const gameDataSummary = this.summarizeGameData(request.gameData, tokenAllocation.gameData);
    const competitorSummary = this.summarizeCompetitorContent(
      request.competitorContent || [], 
      tokenAllocation.competitorContent
    );
    const contentSettingsSummary = this.summarizeContentSettings(
      request.contentSettings, 
      tokenAllocation.contentSettings
    );

    // 2. 构建系统Prompt（包含压缩的格式规则）
    const systemPrompt = this.buildSystemPrompt(request.formatRules);
    
    // 3. 构建用户Prompt - 参数化内容插入
    const userPrompt = this.buildUserPrompt(
      gameDataSummary,
      competitorSummary,
      contentSettingsSummary
    );

    // 4. 验证总体token长度 - 动态上下文长度控制
    const totalTokens = this.estimateTokenCount([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    if (totalTokens > this.TOKEN_LIMITS.TOTAL_CONTEXT) {
      console.warn(`Prompt过长 (${totalTokens} tokens), 开始智能压缩...`);
      // 递归压缩策略
      return this.compressPromptRecursively(request, tokenAllocation);
    }

    console.log(`Prompt构建完成: ${totalTokens} tokens, 预留生成空间: ${this.TOKEN_LIMITS.RESPONSE_BUFFER} tokens`);

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  /**
   * 动态Token分配计算
   * 根据实际内容长度和重要性动态调整token分配
   */
  private calculateDynamicTokenAllocation(request: ContentGenerationRequest): {
    gameData: number;
    competitorContent: number;
    formatRules: number;
    contentSettings: number;
    promptTemplate: number;
  } {
    const baseAllocation = {
      gameData: this.TOKEN_LIMITS.GAME_DATA,
      competitorContent: this.TOKEN_LIMITS.COMPETITOR_CONTENT,
      formatRules: this.TOKEN_LIMITS.FORMAT_RULES,
      contentSettings: this.TOKEN_LIMITS.CONTENT_SETTINGS,
      promptTemplate: this.TOKEN_LIMITS.PROMPT_TEMPLATE
    };

    // 如果没有竞品内容，将其token分配给其他部分
    if (!request.competitorContent || request.competitorContent.length === 0) {
      baseAllocation.gameData += Math.floor(baseAllocation.competitorContent * 0.4);
      baseAllocation.contentSettings += Math.floor(baseAllocation.competitorContent * 0.3);
      baseAllocation.promptTemplate += Math.floor(baseAllocation.competitorContent * 0.3);
      baseAllocation.competitorContent = 50; // 保留最小分配
    }

    // 根据生成模式调整分配
    if (request.contentSettings.generationMode === 'strict') {
      // 严格模式：更多token给格式规则
      baseAllocation.formatRules += 100;
      baseAllocation.promptTemplate -= 50;
      baseAllocation.contentSettings -= 50;
    } else if (request.contentSettings.generationMode === 'free') {
      // 自由模式：更多token给创意指导
      baseAllocation.promptTemplate += 100;
      baseAllocation.formatRules -= 50;
      baseAllocation.contentSettings -= 50;
    }

    return baseAllocation;
  }

  /**
   * 递归Prompt压缩策略
   * 当Prompt超长时，按优先级递归压缩
   */
  private async compressPromptRecursively(
    request: ContentGenerationRequest, 
    tokenAllocation: any, 
    compressionLevel: number = 1
  ): Promise<ChatMessage[]> {
    if (compressionLevel > 3) {
      throw new Error('Prompt压缩失败：已达到最大压缩级别');
    }

    // 按级别递减token分配
    const compressionFactor = 0.8 ** compressionLevel;
    const compressedAllocation = {
      gameData: Math.floor(tokenAllocation.gameData * compressionFactor),
      competitorContent: Math.floor(tokenAllocation.competitorContent * compressionFactor),
      formatRules: Math.floor(tokenAllocation.formatRules * compressionFactor),
      contentSettings: Math.floor(tokenAllocation.contentSettings * compressionFactor),
      promptTemplate: Math.floor(tokenAllocation.promptTemplate * compressionFactor)
    };

    const gameDataSummary = this.summarizeGameData(request.gameData, compressedAllocation.gameData);
    const competitorSummary = this.summarizeCompetitorContent(
      request.competitorContent || [], 
      compressedAllocation.competitorContent
    );
    const contentSettingsSummary = this.summarizeContentSettings(
      request.contentSettings, 
      compressedAllocation.contentSettings
    );

    const systemPrompt = this.buildSystemPrompt(request.formatRules, compressionLevel);
    const userPrompt = this.buildUserPrompt(
      gameDataSummary,
      competitorSummary,
      contentSettingsSummary,
      compressionLevel
    );

    const totalTokens = this.estimateTokenCount([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    if (totalTokens > this.TOKEN_LIMITS.TOTAL_CONTEXT) {
      console.warn(`压缩级别${compressionLevel}仍过长 (${totalTokens} tokens), 继续压缩...`);
      return this.compressPromptRecursively(request, tokenAllocation, compressionLevel + 1);
    }

    console.log(`Prompt压缩完成，级别${compressionLevel}: ${totalTokens} tokens`);
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  /**
   * 竞品内容智能摘要
   */
  private summarizeCompetitorContent(
    competitorContent: CompetitorContentSummary[], 
    maxTokens: number
  ): string {
    if (!competitorContent || competitorContent.length === 0) {
      return '无竞品内容参考';
    }

         // 按相关性评分排序，选择最优质的内容
     const sortedContent = competitorContent
       .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
       .slice(0, 3); // 最多选择3个最优质的

     let summary = '【竞品内容参考】\n';
     let currentTokens = this.estimateTokenCount(summary);

     for (const content of sortedContent) {
       const contentSummary = `
来源: ${content.source}
标题: ${content.title}
描述: ${this.truncateText(content.description, 150)}
特色: ${content.features?.slice(0, 3).join(', ') || '无'}
---`;

      const contentTokens = this.estimateTokenCount(contentSummary);
      
      if (currentTokens + contentTokens > maxTokens) {
        break; // 达到token限制，停止添加
      }

      summary += contentSummary;
      currentTokens += contentTokens;
    }

    return summary;
  }

  /**
   * 游戏数据摘要
   */
  private summarizeGameData(gameData: ContentGenerationRequest['gameData'], maxTokens: number): string {
    const summary = `【游戏基础信息】
游戏名称: ${gameData.gameName}
主关键词: ${gameData.mainKeyword}
长尾关键词: ${gameData.longTailKeywords?.join(', ') || '无'}
游戏链接: ${gameData.realUrl}
视频链接: ${gameData.videoLink || '无'}
图标链接: ${gameData.iconUrl || '无'}
内链推荐: ${gameData.internalLinks?.slice(0, 3).join(', ') || '无'}`;

    // 如果超过限制，截断描述
    if (this.estimateTokenCount(summary) > maxTokens) {
      return `【游戏基础信息】
游戏名称: ${gameData.gameName}
主关键词: ${gameData.mainKeyword}
游戏链接: ${gameData.realUrl}`;
    }

    return summary;
  }

  /**
   * 内容设置摘要
   */
  private summarizeContentSettings(contentSettings: ContentSettings, maxTokens: number): string {
    const summary = `【内容生成设置】
生成模式: ${this.getGenerationModeDesc(contentSettings.generationMode)}
总字数范围: ${contentSettings.wordCount.total.min}-${contentSettings.wordCount.total.max}字
主关键词密度: 目标${contentSettings.keywordDensity.mainKeyword.target}%，最大${contentSettings.keywordDensity.mainKeyword.max}%
长尾关键词密度: 目标${contentSettings.keywordDensity.longTailKeywords.target}%，最大${contentSettings.keywordDensity.longTailKeywords.max}%
目标受众: ${this.getTargetAudienceDesc(contentSettings.qualityParams.targetAudience)}
专业程度: ${this.getReadabilityLevelDesc(contentSettings.qualityParams.readabilityLevel)}`;

    return this.truncateToTokenLimit(summary, maxTokens);
  }

  /**
   * 构建系统Prompt
   */
  private buildSystemPrompt(formatRules: FormatAnalysisResult, compressionLevel: number = 0): string {
    const basePrompt = `你是一个专业的SEO内容生成专家，专门为游戏网站生成高质量、SEO友好的内容。

【核心职责】
- 基于提供的游戏信息和竞品参考，生成原创、有价值的游戏内容
- 严格遵循指定的JSON格式和字段约束
- 合理融入关键词，确保内容自然流畅
- 优化内容结构，提升SEO效果

【输出格式要求】
${this.buildFormatConstraints(formatRules)}

【重要提醒】
- 必须严格按照提供的JSON格式输出
- 字段名称和结构不可更改
- 数组格式必须保持一致
- 字符串字段使用双引号，数字字段不使用引号`;

    // 根据压缩级别调整内容详细程度
    if (compressionLevel === 0) {
      return basePrompt + `

【内容质量标准】
1. 原创性：内容必须原创，不可直接复制竞品内容
2. 价值性：提供有用信息，帮助用户了解游戏
3. SEO优化：自然融入关键词，避免关键词堆砌
4. 用户友好：语言流畅，结构清晰，易于阅读
5. 完整性：确保所有必填字段都有高质量内容`;
    } else {
      return basePrompt + `

【质量要求】
1. 原创内容，符合SEO标准
2. 严格按JSON格式输出
3. 自然融入关键词`;
    }
  }

  /**
   * 构建用户Prompt
   */
  private buildUserPrompt(
    gameDataSummary: string,
    competitorSummary: string,
    contentSettingsSummary: string,
    compressionLevel: number = 0
  ): string {
    const basePrompt = `请基于以下信息生成高质量的游戏内容：

${gameDataSummary}

${competitorSummary}

${contentSettingsSummary}`;

    // 根据压缩级别调整要求的详细程度
    if (compressionLevel === 0) {
      return basePrompt + `

【生成要求】
1. 严格按照系统消息中的JSON格式输出
2. 参考竞品内容但必须原创，不可直接复制
3. 合理分配各模块字数，确保内容丰富且平衡
4. 自然融入主关键词和长尾关键词
5. 语言风格要符合目标受众特点
6. 内容要有吸引力，能够激发用户兴趣

请生成符合要求的JSON格式内容：`;
    } else if (compressionLevel === 1) {
      return basePrompt + `

【要求】
1. 严格按JSON格式输出
2. 原创内容，参考竞品
3. 合理分配字数
4. 自然融入关键词

请生成JSON内容：`;
    } else {
      return basePrompt + `

【要求】严格按JSON格式输出，原创内容，融入关键词。

请生成JSON：`;
    }
  }

  /**
   * 构建格式约束说明
   */
  private buildFormatConstraints(formatRules: FormatAnalysisResult): string {
    let constraints = `【格式约束】
JSON模板: ${formatRules.compactTemplate}

字段约束:`;

    formatRules.fieldConstraints.forEach(constraint => {
      constraints += `\n- ${constraint}`;
    });

    constraints += '\n\n验证规则:';
    formatRules.validationRules.forEach(rule => {
      constraints += `\n- ${rule}`;
    });

    return constraints;
  }

  /**
   * 解析生成的内容
   */
  private parseGeneratedContent(content: string): any {
    try {
      // 尝试提取JSON内容
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }

      // 如果没有代码块，尝试直接解析
      return JSON.parse(content);
    } catch (error) {
      console.error('JSON解析失败:', error);
      throw new Error('生成的内容不是有效的JSON格式');
    }
  }

  /**
   * 验证生成内容
   */
  private validateGeneratedContent(content: any, formatRules: FormatAnalysisResult): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. 基础JSON格式检查
    if (typeof content !== 'object' || content === null) {
      issues.push('生成内容不是有效的JSON对象');
      score -= 50;
    }

    // 2. 必填字段检查
    if (formatRules.detailedRules?.schema) {
      Object.entries(formatRules.detailedRules.schema).forEach(([field, rules]: [string, any]) => {
        if (rules.required && !(field in content)) {
          issues.push(`缺少必填字段: ${field}`);
          score -= 10;
        }
      });
    }

    // 3. 内容质量评估
    const contentStr = JSON.stringify(content);
    if (contentStr.length < 500) {
      issues.push('内容过短，可能缺乏详细信息');
      score -= 15;
      suggestions.push('增加内容详细程度，提供更多有价值的信息');
    }

    // 4. 字段类型检查
    // (简化版本，实际可以更详细)
    for (const key in content) {
      if (typeof content[key] === 'string' && content[key].length === 0) {
        issues.push(`字段 ${key} 为空字符串`);
        score -= 5;
      }
    }

    // 确保分数不低于0
    score = Math.max(0, score);

    return { score, issues, suggestions };
  }

  /**
   * 生成游戏ID
   */
  private generateGameId(gameData: ContentGenerationRequest['gameData']): string {
    const timestamp = Date.now();
    const nameHash = this.simpleHash(gameData.gameName);
    return `game_${nameHash}_${timestamp}`;
  }

  /**
   * 估算Token数量
   */
  private estimateTokenCount(text: string | ChatMessage[]): number {
    if (Array.isArray(text)) {
      return text.reduce((total, msg) => total + this.estimateTokenCount(msg.content), 0);
    }
    
    // 简单估算：1 token ≈ 4 字符（英文）或 1.5 字符（中文）
    const englishChars = (text.match(/[a-zA-Z0-9\s]/g) || []).length;
    const chineseChars = text.length - englishChars;
    return Math.ceil(englishChars / 4 + chineseChars / 1.5);
  }

  /**
   * 截断文本到指定长度
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 截断文本到指定Token限制
   */
  private truncateToTokenLimit(text: string, maxTokens: number): string {
    let currentText = text;
    while (this.estimateTokenCount(currentText) > maxTokens && currentText.length > 0) {
      currentText = currentText.substring(0, currentText.length - 10);
    }
    return currentText.length < text.length ? currentText + '...' : currentText;
  }

  /**
   * 获取生成模式描述
   */
  private getGenerationModeDesc(mode: string): string {
    const modes: Record<string, string> = {
      'strict': '严格模式(严格遵循格式)',
      'standard': '标准模式(平衡质量和创意)',
      'free': '自由模式(更多创意表达)'
    };
    return modes[mode] || mode;
  }

  /**
   * 获取目标受众描述
   */
  private getTargetAudienceDesc(audience: string): string {
    const audiences: Record<string, string> = {
      'gamers': '游戏玩家',
      'general': '普通用户',
      'children': '儿童用户'
    };
    return audiences[audience] || audience;
  }

  /**
   * 获取阅读水平描述
   */
  private getReadabilityLevelDesc(level: string): string {
    const levels: Record<string, string> = {
      'beginner': '初级(简单易懂)',
      'intermediate': '中级(适中难度)',
      'advanced': '高级(专业术语)'
    };
    return levels[level] || level;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 批量并发生成
   */
  public async generateBatchContent(
    requests: ContentGenerationRequest[],
    progressCallback?: (progress: { 
      completed: number; 
      total: number; 
      errors: number;
      currentConcurrency: number;
      estimatedTimeRemaining: number;
    }) => void
  ): Promise<{
    success: boolean;
    results: Array<{ gameId?: string; result?: ContentGenerationResult; error?: string }>;
    metadata: {
      totalTime: number;
      totalTokensUsed: number;
      concurrencyStats: {
        maxConcurrent: number;
        averageConcurrency: number;
        taskDistribution: Record<string, number>;
      };
      performanceMetrics: {
        averageTaskTime: number;
        throughputPerMinute: number;
        successRate: number;
      };
    };
  }> {
    const startTime = Date.now();
    const totalTasks = requests.length;
    let totalTokensUsed = 0;
    let completed = 0;
    let errors = 0;
    
    const results: Array<{ gameId?: string; result?: ContentGenerationResult; error?: string }> = [];
    const activeTasks = new Map<string, { startTime: number; request: ContentGenerationRequest }>();
    const completedTasks: Array<{ duration: number; success: boolean }> = [];
    
    // 并发统计
    let maxConcurrent = 0;
    const concurrencyMeasurements: number[] = [];
    const taskDistribution: Record<string, number> = {};

    console.log(`开始批量生成 ${totalTasks} 个游戏内容，最大并发: ${this.config.maxConcurrency}`);

    /**
     * 处理单个任务 - 任务7.2.6 批量并行生成管理
     */
    const processTask = async (request: ContentGenerationRequest, taskId: string): Promise<void> => {
      const taskStartTime = Date.now();
      activeTasks.set(taskId, { startTime: taskStartTime, request });
      
      // 更新并发统计
      const currentConcurrency = activeTasks.size;
      maxConcurrent = Math.max(maxConcurrent, currentConcurrency);
      concurrencyMeasurements.push(currentConcurrency);
      
      // 任务分布统计
      const gameType = request.gameData.mainKeyword || 'unknown';
      taskDistribution[gameType] = (taskDistribution[gameType] || 0) + 1;

      try {
        console.log(`[${taskId}] 开始生成: ${request.gameData.gameName} (当前并发: ${currentConcurrency})`);
        
        const result = await this.generateGameContent(request);
        
        const duration = Date.now() - taskStartTime;
        completedTasks.push({ duration, success: true });
        totalTokensUsed += result.tokenUsage.totalTokens;
        
        results.push({
          gameId: result.gameId,
          result
        });

        console.log(`[${taskId}] 生成完成: ${request.gameData.gameName}, 耗时: ${duration}ms, 质量: ${result.quality.score.toFixed(1)}`);

      } catch (error) {
        const duration = Date.now() - taskStartTime;
        completedTasks.push({ duration, success: false });
        errors++;
        
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        results.push({
          gameId: request.gameData.gameName,
          error: errorMessage
        });

        console.error(`[${taskId}] 生成失败: ${request.gameData.gameName}, 错误: ${errorMessage}`);
      } finally {
        activeTasks.delete(taskId);
        completed++;
        
        // 计算预估剩余时间
        const avgTaskTime = completedTasks.length > 0 
          ? completedTasks.reduce((sum, task) => sum + task.duration, 0) / completedTasks.length
          : 30000; // 默认30秒
        
        const remaining = totalTasks - completed;
        const estimatedTimeRemaining = remaining > 0 
          ? (remaining * avgTaskTime) / Math.max(1, activeTasks.size)
          : 0;

        // 进度回调
        if (progressCallback) {
          progressCallback({
            completed,
            total: totalTasks,
            errors,
            currentConcurrency: activeTasks.size,
            estimatedTimeRemaining
          });
        }
      }
    };

    /**
     * 智能并发控制器 - 改进的并发管理
     */
    const semaphore = new Array(this.config.maxConcurrency).fill(Promise.resolve());
    const taskPromises: Promise<void>[] = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const taskId = `batch_${i + 1}_${Date.now()}`;

      // 等待可用的并发槽位
      const taskPromise = Promise.race(
        semaphore.map(async (slotPromise, slotIndex) => {
          await slotPromise;
          return slotIndex;
        })
      ).then(async (slotIndex) => {
        // 执行任务并更新槽位
        const taskExecution = processTask(request, taskId);
        semaphore[slotIndex] = taskExecution;
        await taskExecution;
      });

      taskPromises.push(taskPromise);
    }

    // 等待所有任务完成
    await Promise.all(taskPromises);

    const totalTime = Date.now() - startTime;
    const successfulTasks = completedTasks.filter(task => task.success);
    const successRate = totalTasks > 0 ? (successfulTasks.length / totalTasks) * 100 : 0;
    const averageTaskTime = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => sum + task.duration, 0) / completedTasks.length
      : 0;
    const throughputPerMinute = totalTime > 0 ? (completed * 60000) / totalTime : 0;
    const averageConcurrency = concurrencyMeasurements.length > 0
      ? concurrencyMeasurements.reduce((sum, val) => sum + val, 0) / concurrencyMeasurements.length
      : 0;

    console.log(`批量生成完成! 总耗时: ${totalTime}ms, 成功率: ${successRate.toFixed(1)}%, 平均并发: ${averageConcurrency.toFixed(1)}`);

    return {
      success: errors === 0,
      results,
      metadata: {
        totalTime,
        totalTokensUsed,
        concurrencyStats: {
          maxConcurrent,
          averageConcurrency,
          taskDistribution
        },
        performanceMetrics: {
          averageTaskTime,
          throughputPerMinute,
          successRate
        }
      }
    };
  }

  /**
   * 获取统计信息
   */
  public getStats(): GenerationStats {
    return { ...this.stats };
  }

  /**
   * 获取当前运行状态
   */
  public getRunningStatus(): {
    runningTasks: number;
    queuedTasks: number;
    totalCapacity: number;
    tasks: Array<{
      id: string;
      gameName: string;
      status: string;
      startTime?: number;
      duration?: number;
    }>;
  } {
    const tasks = Array.from(this.runningTasks.values()).map(task => ({
      id: task.id,
      gameName: task.gameData.gameName,
      status: task.status,
      startTime: task.startTime,
      duration: task.startTime && task.endTime ? 
        task.endTime - task.startTime : 
        (task.startTime ? Date.now() - task.startTime : undefined)
    }));

    return {
      runningTasks: this.runningTasks.size,
      queuedTasks: this.taskQueue.length,
      totalCapacity: this.config.maxConcurrency,
      tasks
    };
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
    this.stats = {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageGenerationTime: 0,
      averageTokensUsed: 0,
      concurrentGenerations: 0,
      maxConcurrentReached: 0,
      lastGenerationTime: 0,
    };
    this.saveStats();
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ContentGenerationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): ContentGenerationConfig {
    return { ...this.config };
  }
}

// 导出单例实例
export const contentGenerationService = new ContentGenerationService();

export default contentGenerationService; 