import { MatchResult } from './GameMatchingService';
import { CompetitorGame } from '@/types/Competitor.types';

/**
 * 阈值配置类型
 */
export interface ThresholdConfig {
  /** 基础相似度阈值 */
  baseSimilarity: number;
  /** 质量评分最低阈值 */
  minQuality: number;
  /** 置信度阈值 */
  confidence: number;
  /** 动态调整配置 */
  dynamicAdjustment: DynamicAdjustmentConfig;
  /** 质量评估权重 */
  qualityWeights: QualityWeights;
  /** 性能优化配置 */
  performance: PerformanceConfig;
}

/**
 * 动态阈值调整配置
 */
export interface DynamicAdjustmentConfig {
  /** 是否启用动态调整 */
  enabled: boolean;
  /** 调整策略 */
  strategy: 'adaptive' | 'statistical' | 'ml_based' | 'manual';
  /** 调整频率（小时） */
  adjustmentFrequency: number;
  /** 历史数据窗口（天） */
  historyWindow: number;
  /** 最小样本数量 */
  minSampleSize: number;
  /** 调整幅度限制 */
  adjustmentLimit: {
    min: number;
    max: number;
  };
}

/**
 * 质量权重配置
 */
export interface QualityWeights {
  /** 内容完整性权重 */
  completeness: number;
  /** 数据新鲜度权重 */
  freshness: number;
  /** 网站权威性权重 */
  authority: number;
  /** 标签丰富度权重 */
  tagRichness: number;
  /** 描述质量权重 */
  descriptionQuality: number;
}

/**
 * 性能优化配置
 */
export interface PerformanceConfig {
  /** 早期停止阈值 */
  earlyStopThreshold: number;
  /** 批量处理大小 */
  batchSize: number;
  /** 缓存TTL（秒） */
  cacheTTL: number;
  /** 并发限制 */
  concurrencyLimit: number;
  /** 是否启用预筛选 */
  enablePrefiltering: boolean;
}

/**
 * 匹配质量评估结果
 */
export interface QualityAssessment {
  /** 总体质量分数 */
  overallScore: number;
  /** 维度评分 */
  dimensionScores: {
    completeness: number;
    freshness: number;
    authority: number;
    tagRichness: number;
    descriptionQuality: number;
  };
  /** 质量等级 */
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  /** 改进建议 */
  suggestions: string[];
}

/**
 * 阈值调整历史
 */
export interface ThresholdAdjustmentHistory {
  /** 调整时间 */
  timestamp: Date;
  /** 调整前阈值 */
  oldThreshold: number;
  /** 调整后阈值 */
  newThreshold: number;
  /** 调整原因 */
  reason: string;
  /** 调整策略 */
  strategy: string;
  /** 样本数据量 */
  sampleSize: number;
  /** 性能指标 */
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    avgProcessingTime: number;
  };
}

/**
 * 统计数据
 */
export interface ThresholdStats {
  /** 当前阈值 */
  currentThreshold: number;
  /** 匹配总数 */
  totalMatches: number;
  /** 成功匹配数 */
  successMatches: number;
  /** 匹配成功率 */
  successRate: number;
  /** 平均相似度 */
  avgSimilarity: number;
  /** 平均质量分数 */
  avgQualityScore: number;
  /** 平均处理时间（毫秒） */
  avgProcessingTime: number;
  /** 调整历史 */
  adjustmentHistory: ThresholdAdjustmentHistory[];
}

/**
 * 游戏匹配阈值配置服务
 * 功能特性：
 * - 可配置匹配阈值
 * - 动态阈值调整
 * - 匹配质量评估
 * - 性能优化策略
 * - 统计分析
 * - 自适应学习
 */
export class GameMatchingThresholdService {
  private readonly DEFAULT_CONFIG: ThresholdConfig = {
    baseSimilarity: 0.6,
    minQuality: 0.5,
    confidence: 0.7,
    dynamicAdjustment: {
      enabled: true,
      strategy: 'adaptive',
      adjustmentFrequency: 24, // 24小时
      historyWindow: 7, // 7天
      minSampleSize: 100,
      adjustmentLimit: {
        min: 0.3,
        max: 0.9
      }
    },
    qualityWeights: {
      completeness: 0.3,
      freshness: 0.2,
      authority: 0.2,
      tagRichness: 0.15,
      descriptionQuality: 0.15
    },
    performance: {
      earlyStopThreshold: 0.95,
      batchSize: 50,
      cacheTTL: 3600, // 1小时
      concurrencyLimit: 10,
      enablePrefiltering: true
    }
  };

  private config: ThresholdConfig;
  private stats: ThresholdStats;
  private adjustmentHistory: ThresholdAdjustmentHistory[] = [];

  constructor(config?: Partial<ThresholdConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.stats = this.initializeStats();
  }

  /**
   * 应用阈值过滤
   * @param results - 匹配结果列表
   * @param customThreshold - 自定义阈值
   * @returns 过滤后的结果
   */
  public applyThreshold(
    results: MatchResult[],
    customThreshold?: number
  ): MatchResult[] {
    const threshold = customThreshold ?? this.config.baseSimilarity;
    const startTime = Date.now();

    // 早期停止优化
    if (this.config.performance.enablePrefiltering) {
      const prefiltered = this.applyPrefiltering(results);
      const filtered = prefiltered.filter(result => {
        const qualityAssessment = this.assessQuality(result);
        return result.similarity >= threshold && 
               qualityAssessment.overallScore >= this.config.minQuality;
      });

      this.updateStats(results, filtered, Date.now() - startTime);
      return filtered;
    }

    // 标准过滤
    const filtered = results.filter(result => {
      const qualityAssessment = this.assessQuality(result);
      return result.similarity >= threshold && 
             qualityAssessment.overallScore >= this.config.minQuality;
    });

    this.updateStats(results, filtered, Date.now() - startTime);
    return filtered;
  }

  /**
   * 评估匹配质量
   * @param result - 匹配结果
   * @returns 质量评估结果
   */
  public assessQuality(result: MatchResult): QualityAssessment {
    const weights = this.config.qualityWeights;
    const game = result.game;

    // 计算各维度分数
    const completeness = this.calculateCompleteness(game);
    const freshness = this.calculateFreshness(game);
    const authority = this.calculateAuthority(game);
    const tagRichness = this.calculateTagRichness(game);
    const descriptionQuality = this.calculateDescriptionQuality(game);

    // 计算总体分数
    const overallScore = 
      completeness * weights.completeness +
      freshness * weights.freshness +
      authority * weights.authority +
      tagRichness * weights.tagRichness +
      descriptionQuality * weights.descriptionQuality;

    // 确定质量等级
    let qualityLevel: QualityAssessment['qualityLevel'];
    if (overallScore >= 0.8) {
      qualityLevel = 'excellent';
    } else if (overallScore >= 0.6) {
      qualityLevel = 'good';
    } else if (overallScore >= 0.4) {
      qualityLevel = 'fair';
    } else {
      qualityLevel = 'poor';
    }

    // 生成改进建议
    const suggestions = this.generateSuggestions({
      completeness,
      freshness,
      authority,
      tagRichness,
      descriptionQuality
    });

    return {
      overallScore,
      dimensionScores: {
        completeness,
        freshness,
        authority,
        tagRichness,
        descriptionQuality
      },
      qualityLevel,
      suggestions
    };
  }

  /**
   * 动态调整阈值
   * @param performanceData - 性能数据
   * @returns 是否进行了调整
   */
  public adjustThreshold(performanceData?: {
    precision: number;
    recall: number;
    avgProcessingTime: number;
  }): boolean {
    if (!this.config.dynamicAdjustment.enabled) {
      return false;
    }

    const strategy = this.config.dynamicAdjustment.strategy;
    let newThreshold = this.config.baseSimilarity;
    let adjustmentReason = '';

    switch (strategy) {
      case 'adaptive':
        newThreshold = this.calculateAdaptiveThreshold();
        adjustmentReason = '基于历史性能的自适应调整';
        break;
      
      case 'statistical':
        newThreshold = this.calculateStatisticalThreshold();
        adjustmentReason = '基于统计分析的调整';
        break;
      
      case 'ml_based':
        newThreshold = this.calculateMLBasedThreshold();
        adjustmentReason = '基于机器学习的调整';
        break;
      
      default:
        return false;
    }

    // 应用调整限制
    const limits = this.config.dynamicAdjustment.adjustmentLimit;
    newThreshold = Math.max(limits.min, Math.min(limits.max, newThreshold));

    // 检查是否需要调整
    const thresholdDiff = Math.abs(newThreshold - this.config.baseSimilarity);
    if (thresholdDiff < 0.01) {
      return false; // 变化太小，不进行调整
    }

    // 记录调整历史
    const adjustmentRecord: ThresholdAdjustmentHistory = {
      timestamp: new Date(),
      oldThreshold: this.config.baseSimilarity,
      newThreshold,
      reason: adjustmentReason,
      strategy,
      sampleSize: this.stats.totalMatches,
      metrics: {
        precision: performanceData?.precision ?? 0,
        recall: performanceData?.recall ?? 0,
        f1Score: this.calculateF1Score(
          performanceData?.precision ?? 0, 
          performanceData?.recall ?? 0
        ),
        avgProcessingTime: performanceData?.avgProcessingTime ?? this.stats.avgProcessingTime
      }
    };

    this.adjustmentHistory.push(adjustmentRecord);
    this.config.baseSimilarity = newThreshold;

    return true;
  }

  /**
   * 预筛选优化
   * @param results - 原始结果
   * @returns 预筛选后的结果
   */
  private applyPrefiltering(results: MatchResult[]): MatchResult[] {
    // 快速排序并取TOP候选
    const sorted = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.config.performance.batchSize * 2);

    // 早期停止：如果找到高质量匹配，可以提前结束
    const excellentMatches = sorted.filter(r => 
      r.similarity >= this.config.performance.earlyStopThreshold
    );

    if (excellentMatches.length > 0) {
      return excellentMatches.slice(0, 10); // 返回前10个优质匹配
    }

    return sorted;
  }

  /**
   * 计算完整性分数
   * @param game - 游戏数据
   * @returns 完整性分数 (0-1)
   */
  private calculateCompleteness(game: CompetitorGame): number {
    let score = 0;
    let totalFields = 0;

    const fields = [
      game.title,
      game.description,
      game.url,
      game.imageUrl,
      game.category
    ];

    fields.forEach(field => {
      totalFields++;
      if (field && field.trim().length > 0) {
        score++;
      }
    });

    // 标签完整性
    totalFields++;
    if (game.tags && game.tags.length > 0) {
      score++;
    }

    return score / totalFields;
  }

  /**
   * 计算新鲜度分数
   * @param game - 游戏数据
   * @returns 新鲜度分数 (0-1)
   */
  private calculateFreshness(game: CompetitorGame): number {
    const now = new Date();
    const updatedAt = new Date(game.updatedAt);
    const daysDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    // 30天内更新：1.0，30-90天：线性递减到0.5，90天以上：0.3
    if (daysDiff <= 30) {
      return 1.0;
    } else if (daysDiff <= 90) {
      return 1.0 - (daysDiff - 30) / 60 * 0.5;
    } else {
      return 0.3;
    }
  }

  /**
   * 计算权威性分数
   * @param game - 游戏数据
   * @returns 权威性分数 (0-1)
   */
  private calculateAuthority(game: CompetitorGame): number {
    const authorityScores = new Map([
      ['coolmathgames.com', 0.9],
      ['gamedistribution.com', 0.8],
      ['twoplayergames.org', 0.7],
      ['y8.com', 0.6],
      ['friv.com', 0.5]
    ]);

    const domain = this.extractDomain(game.url);
    return authorityScores.get(domain) || 0.4; // 默认评分
  }

  /**
   * 计算标签丰富度分数
   * @param game - 游戏数据
   * @returns 标签丰富度分数 (0-1)
   */
  private calculateTagRichness(game: CompetitorGame): number {
    const tagCount = game.tags?.length || 0;
    
    if (tagCount === 0) return 0;
    if (tagCount >= 5) return 1.0;
    
    return tagCount / 5; // 线性映射到0-1
  }

  /**
   * 计算描述质量分数
   * @param game - 游戏数据
   * @returns 描述质量分数 (0-1)
   */
  private calculateDescriptionQuality(game: CompetitorGame): number {
    if (!game.description || game.description.trim().length === 0) {
      return 0;
    }

    const description = game.description.trim();
    const length = description.length;
    const wordCount = description.split(/\s+/).length;

    // 长度评分：50-200字符最佳
    let lengthScore = 0;
    if (length >= 50 && length <= 200) {
      lengthScore = 1.0;
    } else if (length < 50) {
      lengthScore = length / 50;
    } else {
      lengthScore = Math.max(0.5, 1 - (length - 200) / 300);
    }

    // 词汇丰富度：8-30词最佳
    let wordScore = 0;
    if (wordCount >= 8 && wordCount <= 30) {
      wordScore = 1.0;
    } else if (wordCount < 8) {
      wordScore = wordCount / 8;
    } else {
      wordScore = Math.max(0.5, 1 - (wordCount - 30) / 20);
    }

    // 内容质量：检查是否包含游戏相关关键词
    const gameKeywords = ['game', 'play', 'player', 'level', 'score', 'challenge', 'fun', 'adventure'];
    const hasGameKeywords = gameKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );
    const keywordScore = hasGameKeywords ? 1.0 : 0.7;

    return (lengthScore + wordScore + keywordScore) / 3;
  }

  /**
   * 生成改进建议
   * @param scores - 各维度分数
   * @returns 改进建议列表
   */
  private generateSuggestions(scores: QualityAssessment['dimensionScores']): string[] {
    const suggestions: string[] = [];

    if (scores.completeness < 0.7) {
      suggestions.push('补充缺失的游戏信息（描述、图片、标签等）');
    }

    if (scores.freshness < 0.6) {
      suggestions.push('更新游戏数据，确保信息时效性');
    }

    if (scores.authority < 0.6) {
      suggestions.push('考虑从权威性更高的网站获取数据');
    }

    if (scores.tagRichness < 0.5) {
      suggestions.push('增加更多相关标签，提升标签丰富度');
    }

    if (scores.descriptionQuality < 0.6) {
      suggestions.push('改善游戏描述的质量和详细程度');
    }

    return suggestions;
  }

  /**
   * 计算自适应阈值
   * @returns 新的阈值
   */
  private calculateAdaptiveThreshold(): number {
    const recentHistory = this.adjustmentHistory.slice(-10);
    if (recentHistory.length === 0) {
      return this.config.baseSimilarity;
    }

    // 基于最近的F1分数趋势调整
    const avgF1 = recentHistory.reduce((sum, h) => sum + h.metrics.f1Score, 0) / recentHistory.length;
    
    if (avgF1 < 0.6) {
      // F1分数低，降低阈值提高召回率
      return this.config.baseSimilarity - 0.05;
    } else if (avgF1 > 0.8) {
      // F1分数高，可以提高阈值提升精确度
      return this.config.baseSimilarity + 0.03;
    }

    return this.config.baseSimilarity;
  }

  /**
   * 计算统计阈值
   * @returns 新的阈值
   */
  private calculateStatisticalThreshold(): number {
    if (this.stats.totalMatches < this.config.dynamicAdjustment.minSampleSize) {
      return this.config.baseSimilarity;
    }

    // 基于平均相似度和标准差计算最优阈值
    const mean = this.stats.avgSimilarity;
    const successRate = this.stats.successRate;

    // 如果成功率过低，降低阈值
    if (successRate < 0.5) {
      return Math.max(0.3, mean - 0.1);
    }
    
    // 如果成功率过高，可能阈值过低，适当提高
    if (successRate > 0.9) {
      return Math.min(0.9, mean + 0.05);
    }

    return mean;
  }

  /**
   * 计算基于机器学习的阈值
   * @returns 新的阈值
   */
  private calculateMLBasedThreshold(): number {
    // 简化的ML方法：基于历史性能预测最优阈值
    // 实际实现中可以集成更复杂的ML模型
    
    const history = this.adjustmentHistory;
    if (history.length < 5) {
      return this.config.baseSimilarity;
    }

    // 找到F1分数最高的阈值
    const bestPerformance = history.reduce((best, current) => 
      current.metrics.f1Score > best.metrics.f1Score ? current : best
    );

    // 在最佳阈值基础上进行微调
    const optimalThreshold = bestPerformance.newThreshold;
    const currentF1 = this.calculateCurrentF1Score();
    
    if (currentF1 < bestPerformance.metrics.f1Score * 0.9) {
      // 当前性能下降，向最优阈值调整
      return (optimalThreshold + this.config.baseSimilarity) / 2;
    }

    return this.config.baseSimilarity;
  }

  /**
   * 提取域名
   * @param url - URL
   * @returns 域名
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * 计算F1分数
   * @param precision - 精确率
   * @param recall - 召回率
   * @returns F1分数
   */
  private calculateF1Score(precision: number, recall: number): number {
    if (precision + recall === 0) return 0;
    return 2 * (precision * recall) / (precision + recall);
  }

  /**
   * 计算当前F1分数
   * @returns F1分数
   */
  private calculateCurrentF1Score(): number {
    // 简化计算，实际中需要基于验证数据集
    const precision = this.stats.successMatches / Math.max(this.stats.totalMatches, 1);
    const recall = 0.8; // 假定的召回率
    return this.calculateF1Score(precision, recall);
  }

  /**
   * 更新统计信息
   * @param originalResults - 原始结果
   * @param filteredResults - 过滤后结果
   * @param processingTime - 处理时间
   */
  private updateStats(
    originalResults: MatchResult[],
    filteredResults: MatchResult[],
    processingTime: number
  ): void {
    this.stats.totalMatches += originalResults.length;
    this.stats.successMatches += filteredResults.length;
    this.stats.successRate = this.stats.successMatches / this.stats.totalMatches;

    if (filteredResults.length > 0) {
      const avgSim = filteredResults.reduce((sum, r) => sum + r.similarity, 0) / filteredResults.length;
      this.stats.avgSimilarity = (this.stats.avgSimilarity + avgSim) / 2;

      const avgQuality = filteredResults.reduce((sum, r) => {
        const quality = this.assessQuality(r);
        return sum + quality.overallScore;
      }, 0) / filteredResults.length;
      this.stats.avgQualityScore = (this.stats.avgQualityScore + avgQuality) / 2;
    }

    this.stats.avgProcessingTime = (this.stats.avgProcessingTime + processingTime) / 2;
    this.stats.currentThreshold = this.config.baseSimilarity;
    this.stats.adjustmentHistory = this.adjustmentHistory.slice(-50); // 保留最近50条记录
  }

  /**
   * 初始化统计信息
   * @returns 初始统计数据
   */
  private initializeStats(): ThresholdStats {
    return {
      currentThreshold: this.config.baseSimilarity,
      totalMatches: 0,
      successMatches: 0,
      successRate: 0,
      avgSimilarity: 0,
      avgQualityScore: 0,
      avgProcessingTime: 0,
      adjustmentHistory: []
    };
  }

  /**
   * 获取当前配置
   * @returns 阈值配置
   */
  public getConfig(): ThresholdConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   * @param newConfig - 新的配置
   */
  public updateConfig(newConfig: Partial<ThresholdConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取统计信息
   * @returns 统计数据
   */
  public getStats(): ThresholdStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
    this.stats = this.initializeStats();
    this.adjustmentHistory = [];
  }

  /**
   * 验证配置
   * @param config - 配置对象
   * @returns 是否有效
   */
  public validateConfig(config: Partial<ThresholdConfig>): boolean {
    if (config.baseSimilarity !== undefined) {
      if (config.baseSimilarity < 0 || config.baseSimilarity > 1) {
        return false;
      }
    }

    if (config.minQuality !== undefined) {
      if (config.minQuality < 0 || config.minQuality > 1) {
        return false;
      }
    }

    if (config.confidence !== undefined) {
      if (config.confidence < 0 || config.confidence > 1) {
        return false;
      }
    }

    if (config.dynamicAdjustment?.adjustmentLimit) {
      const limits = config.dynamicAdjustment.adjustmentLimit;
      if (limits.min < 0 || limits.max > 1 || limits.min >= limits.max) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取默认配置
   * @returns 默认配置
   */
  public getDefaultConfig(): ThresholdConfig {
    return { ...this.DEFAULT_CONFIG };
  }
} 