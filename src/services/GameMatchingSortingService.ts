import { MatchResult, MatchingConfig } from './GameMatchingService';
import { CompetitorGame } from '@/types/Competitor.types';

/**
 * 排序维度配置
 */
export interface SortingDimension {
  /** 维度名称 */
  name: string;
  /** 权重 (0-1) */
  weight: number;
  /** 评分函数 */
  scoreFunction: (result: MatchResult) => number;
  /** 是否降序排列 */
  descending: boolean;
}

/**
 * 排序配置
 */
export interface SortingConfig {
  /** 排序维度列表 */
  dimensions: SortingDimension[];
  /** 是否启用去重 */
  enableDeduplication: boolean;
  /** 去重策略 */
  deduplicationStrategy: 'url' | 'title' | 'content' | 'similarity';
  /** 去重相似度阈值 */
  deduplicationThreshold: number;
  /** TOP-N结果数量 */
  topN: number;
  /** 最小相似度阈值 */
  minSimilarity: number;
  /** 质量评分权重 */
  qualityWeights: {
    /** 标题完整性 */
    titleCompleteness: number;
    /** 描述丰富度 */
    descriptionRichness: number;
    /** 标签数量 */
    tagCount: number;
    /** 数据新鲜度 */
    dateFreshness: number;
    /** 网站权威性 */
    siteAuthority: number;
  };
}

/**
 * 增强的匹配结果
 */
export interface EnhancedMatchResult extends MatchResult {
  /** 多维度评分 */
  dimensionScores: Map<string, number>;
  /** 综合排序分数 */
  finalScore: number;
  /** 质量评分 */
  qualityScore: number;
  /** 去重标识 */
  deduplicationKey: string;
  /** 排序原因 */
  sortingReasons: string[];
}

/**
 * 排序统计信息
 */
export interface SortingStats {
  /** 原始结果数量 */
  originalCount: number;
  /** 去重后数量 */
  afterDeduplicationCount: number;
  /** 最终结果数量 */
  finalCount: number;
  /** 平均相似度 */
  avgSimilarity: number;
  /** 平均质量分数 */
  avgQualityScore: number;
  /** 各维度权重分布 */
  dimensionWeights: Map<string, number>;
  /** 去重统计 */
  deduplicationStats: {
    duplicatesRemoved: number;
    duplicateGroups: number;
  };
}

/**
 * 游戏匹配结果排序服务
 * 功能特性：
 * - 多维度评分策略
 * - 可配置权重分配
 * - 智能结果去重
 * - TOP-N结果筛选
 * - 质量评分系统
 * - 排序原因追踪
 */
export class GameMatchingSortingService {
  private readonly DEFAULT_CONFIG: SortingConfig = {
    dimensions: [
      {
        name: 'similarity',
        weight: 0.4,
        scoreFunction: (result) => result.similarity,
        descending: true
      },
      {
        name: 'quality',
        weight: 0.3,
        scoreFunction: (result) => this.calculateQualityScore(result),
        descending: true
      },
      {
        name: 'completeness',
        weight: 0.2,
        scoreFunction: (result) => this.calculateCompletenessScore(result),
        descending: true
      },
      {
        name: 'freshness',
        weight: 0.1,
        scoreFunction: (result) => this.calculateFreshnessScore(result),
        descending: true
      }
    ],
    enableDeduplication: true,
    deduplicationStrategy: 'content',
    deduplicationThreshold: 0.9,
    topN: 10,
    minSimilarity: 0.3,
    qualityWeights: {
      titleCompleteness: 0.3,
      descriptionRichness: 0.3,
      tagCount: 0.2,
      dateFreshness: 0.1,
      siteAuthority: 0.1
    }
  };

  /** 网站权威性映射 */
  private readonly SITE_AUTHORITY_SCORES = new Map([
    ['coolmathgames.com', 0.9],
    ['gamedistribution.com', 0.8],
    ['twoplayergames.org', 0.7],
    ['y8.com', 0.6],
    ['friv.com', 0.5]
  ]);

  /**
   * 排序和筛选匹配结果
   * @param results - 原始匹配结果
   * @param config - 排序配置
   * @returns 处理后的结果和统计信息
   */
  public sortAndFilter(
    results: MatchResult[],
    config?: Partial<SortingConfig>
  ): { 
    results: EnhancedMatchResult[];
    stats: SortingStats;
  } {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const stats: SortingStats = {
      originalCount: results.length,
      afterDeduplicationCount: 0,
      finalCount: 0,
      avgSimilarity: 0,
      avgQualityScore: 0,
      dimensionWeights: new Map(),
      deduplicationStats: {
        duplicatesRemoved: 0,
        duplicateGroups: 0
      }
    };

    // 1. 过滤低质量结果
    const filteredResults = this.filterLowQualityResults(results, finalConfig);

    // 2. 增强结果信息
    const enhancedResults = this.enhanceResults(filteredResults, finalConfig);

    // 3. 去重处理
    const deduplicatedResults = finalConfig.enableDeduplication
      ? this.deduplicateResults(enhancedResults, finalConfig, stats)
      : enhancedResults;
    
    stats.afterDeduplicationCount = deduplicatedResults.length;

    // 4. 多维度评分
    const scoredResults = this.calculateMultiDimensionScores(deduplicatedResults, finalConfig);

    // 5. 综合排序
    const sortedResults = this.applySorting(scoredResults, finalConfig);

    // 6. TOP-N筛选
    const finalResults = this.applyTopNFiltering(sortedResults, finalConfig);
    
    stats.finalCount = finalResults.length;

    // 7. 生成统计信息
    this.generateStats(finalResults, finalConfig, stats);

    return { results: finalResults, stats };
  }

  /**
   * 过滤低质量结果
   * @param results - 原始结果
   * @param config - 配置
   * @returns 过滤后的结果
   */
  private filterLowQualityResults(
    results: MatchResult[],
    config: SortingConfig
  ): MatchResult[] {
    return results.filter(result => {
      // 相似度阈值过滤
      if (result.similarity < config.minSimilarity) {
        return false;
      }

      // 基本数据完整性检查
      if (!result.game.title || result.game.title.trim().length < 2) {
        return false;
      }

      // URL有效性检查
      if (!result.game.url || !this.isValidUrl(result.game.url)) {
        return false;
      }

      return true;
    });
  }

  /**
   * 增强结果信息
   * @param results - 过滤后的结果
   * @param config - 配置
   * @returns 增强后的结果
   */
  private enhanceResults(
    results: MatchResult[],
    config: SortingConfig
  ): EnhancedMatchResult[] {
    return results.map(result => {
      const enhanced: EnhancedMatchResult = {
        ...result,
        dimensionScores: new Map(),
        finalScore: 0,
        qualityScore: 0,
        deduplicationKey: this.generateDeduplicationKey(result, config.deduplicationStrategy),
        sortingReasons: []
      };

      return enhanced;
    });
  }

  /**
   * 去重处理
   * @param results - 增强后的结果
   * @param config - 配置
   * @param stats - 统计信息
   * @returns 去重后的结果
   */
  private deduplicateResults(
    results: EnhancedMatchResult[],
    config: SortingConfig,
    stats: SortingStats
  ): EnhancedMatchResult[] {
    const duplicateGroups = new Map<string, EnhancedMatchResult[]>();

    // 按去重键分组
    for (const result of results) {
      const key = result.deduplicationKey;
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(result);
    }

    // 从每组选择最佳结果
    const deduplicatedResults: EnhancedMatchResult[] = [];
    let duplicatesRemoved = 0;

    for (const [key, group] of duplicateGroups.entries()) {
      if (group.length === 1) {
        deduplicatedResults.push(group[0]);
      } else {
        // 选择相似度最高的
        const best = group.reduce((prev, current) => 
          current.similarity > prev.similarity ? current : prev
        );
        
        best.sortingReasons.push(`去重: 从${group.length}个类似结果中选择`);
        deduplicatedResults.push(best);
        duplicatesRemoved += group.length - 1;
      }
    }

    stats.deduplicationStats.duplicatesRemoved = duplicatesRemoved;
    stats.deduplicationStats.duplicateGroups = duplicateGroups.size;

    return deduplicatedResults;
  }

  /**
   * 计算多维度评分
   * @param results - 去重后的结果
   * @param config - 配置
   * @returns 评分后的结果
   */
  private calculateMultiDimensionScores(
    results: EnhancedMatchResult[],
    config: SortingConfig
  ): EnhancedMatchResult[] {
    return results.map(result => {
      let finalScore = 0;
      
      for (const dimension of config.dimensions) {
        const score = dimension.scoreFunction(result);
        result.dimensionScores.set(dimension.name, score);
        finalScore += score * dimension.weight;
        
        if (score > 0.8) {
          result.sortingReasons.push(`${dimension.name}维度得分高(${score.toFixed(2)})`);
        }
      }
      
      result.finalScore = finalScore;
      result.qualityScore = this.calculateQualityScore(result);
      
      return result;
    });
  }

  /**
   * 应用排序
   * @param results - 评分后的结果
   * @param config - 配置
   * @returns 排序后的结果
   */
  private applySorting(
    results: EnhancedMatchResult[],
    config: SortingConfig
  ): EnhancedMatchResult[] {
    return results.sort((a, b) => {
      // 主要按最终分数排序
      const scoreDiff = b.finalScore - a.finalScore;
      if (Math.abs(scoreDiff) > 0.01) {
        return scoreDiff;
      }

      // 分数相近时按相似度排序
      const similarityDiff = b.similarity - a.similarity;
      if (Math.abs(similarityDiff) > 0.01) {
        return similarityDiff;
      }

      // 最后按质量分数排序
      return b.qualityScore - a.qualityScore;
    });
  }

  /**
   * 应用TOP-N筛选
   * @param results - 排序后的结果
   * @param config - 配置
   * @returns 筛选后的结果
   */
  private applyTopNFiltering(
    results: EnhancedMatchResult[],
    config: SortingConfig
  ): EnhancedMatchResult[] {
    const topResults = results.slice(0, config.topN);
    
    // 为TOP-N结果添加排名原因
    topResults.forEach((result, index) => {
      result.sortingReasons.push(`排名第${index + 1}，综合得分${result.finalScore.toFixed(3)}`);
    });

    return topResults;
  }

  /**
   * 计算质量评分
   * @param result - 匹配结果
   * @returns 质量分数 (0-1)
   */
  private calculateQualityScore(result: MatchResult): number {
    const config = this.DEFAULT_CONFIG.qualityWeights;
    let qualityScore = 0;

    // 标题完整性
    const titleScore = this.calculateTitleCompleteness(result.game);
    qualityScore += titleScore * config.titleCompleteness;

    // 描述丰富度
    const descriptionScore = this.calculateDescriptionRichness(result.game);
    qualityScore += descriptionScore * config.descriptionRichness;

    // 标签数量
    const tagScore = this.calculateTagScore(result.game);
    qualityScore += tagScore * config.tagCount;

    // 数据新鲜度
    const freshnessScore = this.calculateFreshnessScore(result);
    qualityScore += freshnessScore * config.dateFreshness;

    // 网站权威性
    const authorityScore = this.calculateSiteAuthorityScore(result.game);
    qualityScore += authorityScore * config.siteAuthority;

    return Math.min(1, qualityScore);
  }

  /**
   * 计算完整性评分
   * @param result - 匹配结果
   * @returns 完整性分数 (0-1)
   */
  private calculateCompletenessScore(result: MatchResult): number {
    let completeness = 0;
    let totalFields = 0;

    // 必填字段
    if (result.game.title) {
      completeness += 0.3;
    }
    totalFields += 0.3;

    if (result.game.url) {
      completeness += 0.3;
    }
    totalFields += 0.3;

    // 可选字段
    if (result.game.description && result.game.description.length > 20) {
      completeness += 0.25;
    }
    totalFields += 0.25;

    if (result.game.tags && result.game.tags.length > 0) {
      completeness += 0.15;
    }
    totalFields += 0.15;

    return completeness / totalFields;
  }

  /**
   * 计算新鲜度评分
   * @param result - 匹配结果
   * @returns 新鲜度分数 (0-1)
   */
  private calculateFreshnessScore(result: MatchResult): number {
    if (!result.game.updatedAt) {
      return 0.5; // 默认分数
    }

    const now = new Date();
    const updateTime = new Date(result.game.updatedAt);
    const daysSinceUpdate = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60 * 24);

    // 7天内更新: 1.0分
    // 30天内更新: 0.8分
    // 90天内更新: 0.6分
    // 180天内更新: 0.4分
    // 更久: 0.2分
    if (daysSinceUpdate <= 7) return 1.0;
    if (daysSinceUpdate <= 30) return 0.8;
    if (daysSinceUpdate <= 90) return 0.6;
    if (daysSinceUpdate <= 180) return 0.4;
    return 0.2;
  }

  /**
   * 计算标题完整性
   * @param game - 游戏数据
   * @returns 标题完整性分数 (0-1)
   */
  private calculateTitleCompleteness(game: CompetitorGame): number {
    if (!game.title) return 0;

    const title = game.title.trim();
    
    // 长度评分
    let lengthScore = 0;
    if (title.length >= 5 && title.length <= 50) {
      lengthScore = 1.0;
    } else if (title.length > 50) {
      lengthScore = Math.max(0.5, 1 - (title.length - 50) / 100);
    } else {
      lengthScore = title.length / 5;
    }

    // 内容质量评分
    let qualityScore = 0.5; // 基础分
    
    // 包含游戏相关关键词
    const gameKeywords = ['game', 'play', 'online', 'free', 'fun'];
    const hasGameKeywords = gameKeywords.some(keyword => 
      title.toLowerCase().includes(keyword)
    );
    if (hasGameKeywords) qualityScore += 0.2;

    // 避免过多特殊字符
    const specialCharCount = (title.match(/[!@#$%^&*()]/g) || []).length;
    if (specialCharCount <= 2) qualityScore += 0.2;

    // 首字母大写
    if (/^[A-Z]/.test(title)) qualityScore += 0.1;

    return (lengthScore + Math.min(1, qualityScore)) / 2;
  }

  /**
   * 计算描述丰富度
   * @param game - 游戏数据
   * @returns 描述丰富度分数 (0-1)
   */
  private calculateDescriptionRichness(game: CompetitorGame): number {
    if (!game.description) return 0;

    const description = game.description.trim();
    if (description.length === 0) return 0;

    // 长度评分
    let lengthScore = 0;
    if (description.length >= 50 && description.length <= 500) {
      lengthScore = 1.0;
    } else if (description.length > 500) {
      lengthScore = Math.max(0.7, 1 - (description.length - 500) / 1000);
    } else {
      lengthScore = description.length / 50;
    }

    // 内容丰富度评分
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = description.split(/\s+/).filter(w => w.trim().length > 0);
    
    let richnessScore = 0;
    
    // 句子数量
    if (sentences.length >= 2) richnessScore += 0.3;
    else if (sentences.length === 1) richnessScore += 0.15;

    // 词汇数量
    if (words.length >= 20) richnessScore += 0.3;
    else if (words.length >= 10) richnessScore += 0.2;
    else if (words.length >= 5) richnessScore += 0.1;

    // 词汇多样性
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const diversity = uniqueWords.size / words.length;
    richnessScore += diversity * 0.4;

    return (lengthScore * 0.6 + Math.min(1, richnessScore) * 0.4);
  }

  /**
   * 计算标签评分
   * @param game - 游戏数据
   * @returns 标签评分 (0-1)
   */
  private calculateTagScore(game: CompetitorGame): number {
    if (!game.tags || game.tags.length === 0) return 0;

    // 标签数量评分
    const count = game.tags.length;
    let countScore = 0;
    if (count >= 3 && count <= 8) {
      countScore = 1.0;
    } else if (count > 8) {
      countScore = Math.max(0.6, 1 - (count - 8) / 10);
    } else {
      countScore = count / 3;
    }

    // 标签质量评分
    const validTags = game.tags.filter(tag => 
      tag.trim().length >= 2 && tag.trim().length <= 20
    );
    const qualityScore = validTags.length / game.tags.length;

    return (countScore * 0.7 + qualityScore * 0.3);
  }

  /**
   * 计算网站权威性评分
   * @param game - 游戏数据
   * @returns 权威性评分 (0-1)
   */
  private calculateSiteAuthorityScore(game: CompetitorGame): number {
    if (!game.url) return 0;

    try {
      const hostname = new URL(game.url).hostname.toLowerCase();
      
      // 移除www前缀
      const cleanHostname = hostname.replace(/^www\./, '');
      
      return this.SITE_AUTHORITY_SCORES.get(cleanHostname) || 0.3; // 默认分数
    } catch {
      return 0;
    }
  }

  /**
   * 生成去重键
   * @param result - 匹配结果
   * @param strategy - 去重策略
   * @returns 去重键
   */
  private generateDeduplicationKey(
    result: MatchResult,
    strategy: SortingConfig['deduplicationStrategy']
  ): string {
    switch (strategy) {
      case 'url':
        return result.game.url || '';
      case 'title':
        return result.game.title.toLowerCase().replace(/\s+/g, '');
      case 'content':
        const title = result.game.title.toLowerCase().replace(/\s+/g, '');
        const desc = (result.game.description || '').toLowerCase().slice(0, 50);
        return `${title}|${desc}`;
      case 'similarity':
        // 基于相似度范围分组
        const range = Math.floor(result.similarity * 10) / 10;
        return `${result.game.title.toLowerCase()}_${range}`;
      default:
        return result.game.id || result.game.url || '';
    }
  }

  /**
   * 验证URL有效性
   * @param url - URL字符串
   * @returns 是否有效
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 生成统计信息
   * @param results - 最终结果
   * @param config - 配置
   * @param stats - 统计信息对象
   */
  private generateStats(
    results: EnhancedMatchResult[],
    config: SortingConfig,
    stats: SortingStats
  ): void {
    if (results.length === 0) {
      stats.avgSimilarity = 0;
      stats.avgQualityScore = 0;
      return;
    }

    stats.avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    stats.avgQualityScore = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;

    // 记录维度权重
    for (const dimension of config.dimensions) {
      stats.dimensionWeights.set(dimension.name, dimension.weight);
    }
  }

  /**
   * 获取默认配置
   * @returns 默认配置
   */
  public getDefaultConfig(): SortingConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * 验证配置
   * @param config - 配置
   * @returns 是否有效
   */
  public validateConfig(config: Partial<SortingConfig>): boolean {
    try {
      if (config.dimensions) {
        const totalWeight = config.dimensions.reduce((sum, d) => sum + d.weight, 0);
        if (Math.abs(totalWeight - 1) > 0.01) return false;
      }

      if (config.topN !== undefined && config.topN < 1) return false;
      if (config.minSimilarity !== undefined && (config.minSimilarity < 0 || config.minSimilarity > 1)) return false;
      if (config.deduplicationThreshold !== undefined && (config.deduplicationThreshold < 0 || config.deduplicationThreshold > 1)) return false;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 批量排序
   * @param resultGroups - 多组匹配结果
   * @param config - 配置
   * @returns 批量排序结果
   */
  public batchSortAndFilter(
    resultGroups: Map<string, MatchResult[]>,
    config?: Partial<SortingConfig>
  ): Map<string, { results: EnhancedMatchResult[]; stats: SortingStats }> {
    const batchResults = new Map<string, { results: EnhancedMatchResult[]; stats: SortingStats }>();

    for (const [key, results] of resultGroups.entries()) {
      const sorted = this.sortAndFilter(results, config);
      batchResults.set(key, sorted);
    }

    return batchResults;
  }
} 