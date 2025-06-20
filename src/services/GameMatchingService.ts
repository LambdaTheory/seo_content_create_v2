import { CompetitorGame } from '@/types/Competitor.types';

/**
 * 匹配结果
 */
export interface MatchResult {
  /** 匹配的竞品游戏 */
  game: CompetitorGame;
  /** 总相似度分数 (0-1) */
  similarity: number;
  /** 详细评分 */
  scores: {
    /** 编辑距离评分 */
    levenshtein: number;
    /** 余弦相似度评分 */
    cosine: number;
    /** Jaccard相似度评分 */
    jaccard: number;
    /** 归一化分数 */
    normalized: number;
  };
  /** 匹配的字段和权重 */
  matchedFields: {
    title: number;
    description?: number;
    tags?: number;
  };
}

/**
 * 匹配配置
 */
export interface MatchingConfig {
  /** 匹配阈值 (0-1) */
  threshold: number;
  /** 最大返回结果数 */
  maxResults: number;
  /** 字段权重 */
  weights: {
    title: number;
    description: number;
    tags: number;
  };
  /** 算法权重 */
  algorithmWeights: {
    levenshtein: number;
    cosine: number;
    jaccard: number;
  };
  /** 是否启用模糊匹配 */
  fuzzyMatch: boolean;
  /** 是否启用大小写敏感 */
  caseSensitive: boolean;
}

/**
 * 游戏匹配服务
 * 功能特性：
 * - 编辑距离算法(Levenshtein)
 * - 余弦相似度算法
 * - Jaccard相似度算法  
 * - 组合评分策略
 * - 多字段匹配
 * - 可配置权重
 */
export class GameMatchingService {
  private readonly DEFAULT_CONFIG: MatchingConfig = {
    threshold: 0.6,
    maxResults: 10,
    weights: {
      title: 0.6,      // 标题权重最高
      description: 0.3, // 描述次之
      tags: 0.1        // 标签权重最低
    },
    algorithmWeights: {
      levenshtein: 0.4, // 编辑距离
      cosine: 0.4,      // 余弦相似度
      jaccard: 0.2      // Jaccard相似度
    },
    fuzzyMatch: true,
    caseSensitive: false
  };

  /**
   * 匹配游戏
   * @param query - 查询游戏名称
   * @param candidates - 候选游戏列表
   * @param config - 匹配配置
   * @returns MatchResult[]
   */
  public matchGames(
    query: string,
    candidates: CompetitorGame[],
    config?: Partial<MatchingConfig>
  ): MatchResult[] {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    if (!query || !query.trim()) {
      return [];
    }

    const normalizedQuery = this.normalizeString(query, finalConfig.caseSensitive);
    const results: MatchResult[] = [];

    for (const game of candidates) {
      const matchResult = this.calculateGameSimilarity(normalizedQuery, game, finalConfig);
      
      if (matchResult.similarity >= finalConfig.threshold) {
        results.push(matchResult);
      }
    }

    // 按相似度降序排序
    results.sort((a, b) => b.similarity - a.similarity);

    // 返回指定数量的结果
    return results.slice(0, finalConfig.maxResults);
  }

  /**
   * 计算单个游戏的相似度
   * @param query - 标准化的查询字符串
   * @param game - 竞品游戏
   * @param config - 匹配配置
   * @returns MatchResult
   */
  private calculateGameSimilarity(
    query: string,
    game: CompetitorGame,
    config: MatchingConfig
  ): MatchResult {
    const normalizedTitle = this.normalizeString(game.title, config.caseSensitive);
    const normalizedDescription = game.description 
      ? this.normalizeString(game.description, config.caseSensitive) 
      : '';
    const normalizedTags = game.tags.map(tag => 
      this.normalizeString(tag, config.caseSensitive)
    );

    // 计算标题相似度
    const titleScores = this.calculateAllSimilarities(query, normalizedTitle);
    const titleSimilarity = this.combineSimilarityScores(titleScores, config.algorithmWeights);

    // 计算描述相似度
    let descriptionSimilarity = 0;
    if (normalizedDescription) {
      const descriptionScores = this.calculateAllSimilarities(query, normalizedDescription);
      descriptionSimilarity = this.combineSimilarityScores(descriptionScores, config.algorithmWeights);
    }

    // 计算标签相似度
    let tagsSimilarity = 0;
    if (normalizedTags.length > 0) {
      const tagScores = normalizedTags.map(tag => {
        const scores = this.calculateAllSimilarities(query, tag);
        return this.combineSimilarityScores(scores, config.algorithmWeights);
      });
      tagsSimilarity = Math.max(...tagScores); // 取最大匹配分数
    }

    // 综合评分
    const totalSimilarity = 
      titleSimilarity * config.weights.title +
      descriptionSimilarity * config.weights.description +
      tagsSimilarity * config.weights.tags;

    return {
      game,
      similarity: totalSimilarity,
      scores: titleScores,
      matchedFields: {
        title: titleSimilarity,
        description: normalizedDescription ? descriptionSimilarity : undefined,
        tags: normalizedTags.length > 0 ? tagsSimilarity : undefined
      }
    };
  }

  /**
   * 计算所有相似度算法的分数
   * @param str1 - 字符串1
   * @param str2 - 字符串2
   * @returns 各种算法的分数
   */
  private calculateAllSimilarities(str1: string, str2: string) {
    const levenshtein = this.calculateLevenshteinSimilarity(str1, str2);
    const cosine = this.calculateCosineSimilarity(str1, str2);
    const jaccard = this.calculateJaccardSimilarity(str1, str2);
    
    // 归一化分数（简单平均）
    const normalized = (levenshtein + cosine + jaccard) / 3;

    return {
      levenshtein,
      cosine,
      jaccard,
      normalized
    };
  }

  /**
   * 组合相似度分数
   * @param scores - 各算法分数
   * @param weights - 算法权重
   * @returns 加权平均分数
   */
  private combineSimilarityScores(
    scores: { levenshtein: number; cosine: number; jaccard: number },
    weights: { levenshtein: number; cosine: number; jaccard: number }
  ): number {
    return (
      scores.levenshtein * weights.levenshtein +
      scores.cosine * weights.cosine +
      scores.jaccard * weights.jaccard
    );
  }

  /**
   * 计算编辑距离相似度 (Levenshtein)
   * @param str1 - 字符串1
   * @param str2 - 字符串2
   * @returns 相似度分数 (0-1)
   */
  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    return 1 - distance / maxLength;
  }

  /**
   * 计算编辑距离
   * @param str1 - 字符串1
   * @param str2 - 字符串2
   * @returns 编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    // 初始化矩阵
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // 填充矩阵
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 替换
            matrix[i][j - 1] + 1,     // 插入
            matrix[i - 1][j] + 1      // 删除
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 计算余弦相似度
   * @param str1 - 字符串1
   * @param str2 - 字符串2
   * @returns 相似度分数 (0-1)
   */
  private calculateCosineSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const words1 = this.tokenize(str1);
    const words2 = this.tokenize(str2);

    if (words1.length === 0 || words2.length === 0) return 0;

    // 创建词汇表
    const vocabulary = new Set([...words1, ...words2]);
    
    // 计算词频向量
    const vector1 = this.createTfVector(words1, vocabulary);
    const vector2 = this.createTfVector(words2, vocabulary);

    // 计算余弦相似度
    const dotProduct = this.dotProduct(vector1, vector2);
    const magnitude1 = this.magnitude(vector1);
    const magnitude2 = this.magnitude(vector2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * 计算Jaccard相似度
   * @param str1 - 字符串1
   * @param str2 - 字符串2
   * @returns 相似度分数 (0-1)
   */
  private calculateJaccardSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 && str2.length === 0) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const set1 = new Set(this.tokenize(str1));
    const set2 = new Set(this.tokenize(str2));

    if (set1.size === 0 && set2.size === 0) return 1;

    // 计算交集
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    // 计算并集
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * 字符串标准化
   * @param str - 原始字符串
   * @param caseSensitive - 是否大小写敏感
   * @returns 标准化后的字符串
   */
  private normalizeString(str: string, caseSensitive: boolean): string {
    let normalized = str.trim();
    
    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }

    // 移除多余的空格
    normalized = normalized.replace(/\s+/g, ' ');
    
    return normalized;
  }

  /**
   * 分词
   * @param str - 字符串
   * @returns 词汇数组
   */
  private tokenize(str: string): string[] {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // 移除标点符号
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * 创建词频向量
   * @param words - 词汇数组
   * @param vocabulary - 词汇表
   * @returns 词频向量
   */
  private createTfVector(words: string[], vocabulary: Set<string>): number[] {
    const vector: number[] = [];
    const wordCount = new Map<string, number>();

    // 统计词频
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }

    // 创建向量
    for (const word of vocabulary) {
      vector.push(wordCount.get(word) || 0);
    }

    return vector;
  }

  /**
   * 计算向量点积
   * @param vector1 - 向量1
   * @param vector2 - 向量2
   * @returns 点积
   */
  private dotProduct(vector1: number[], vector2: number[]): number {
    let sum = 0;
    for (let i = 0; i < vector1.length; i++) {
      sum += vector1[i] * vector2[i];
    }
    return sum;
  }

  /**
   * 计算向量模长
   * @param vector - 向量
   * @returns 模长
   */
  private magnitude(vector: number[]): number {
    let sum = 0;
    for (const value of vector) {
      sum += value * value;
    }
    return Math.sqrt(sum);
  }

  /**
   * 批量匹配游戏
   * @param queries - 查询游戏名称列表
   * @param candidates - 候选游戏列表
   * @param config - 匹配配置
   * @returns Map<string, MatchResult[]>
   */
  public batchMatchGames(
    queries: string[],
    candidates: CompetitorGame[],
    config?: Partial<MatchingConfig>
  ): Map<string, MatchResult[]> {
    const results = new Map<string, MatchResult[]>();

    for (const query of queries) {
      const matches = this.matchGames(query, candidates, config);
      results.set(query, matches);
    }

    return results;
  }

  /**
   * 获取默认配置
   * @returns MatchingConfig
   */
  public getDefaultConfig(): MatchingConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * 验证配置
   * @param config - 配置对象
   * @returns 是否有效
   */
  public validateConfig(config: Partial<MatchingConfig>): boolean {
    try {
      if (config.threshold !== undefined) {
        if (config.threshold < 0 || config.threshold > 1) return false;
      }

      if (config.maxResults !== undefined) {
        if (config.maxResults < 1 || config.maxResults > 100) return false;
      }

      if (config.weights !== undefined) {
        const { title, description, tags } = config.weights;
        if (title < 0 || description < 0 || tags < 0) return false;
        if (Math.abs((title + description + tags) - 1) > 0.001) return false;
      }

      if (config.algorithmWeights !== undefined) {
        const { levenshtein, cosine, jaccard } = config.algorithmWeights;
        if (levenshtein < 0 || cosine < 0 || jaccard < 0) return false;
        if (Math.abs((levenshtein + cosine + jaccard) - 1) > 0.001) return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

// 导出单例实例
export const gameMatchingService = new GameMatchingService(); 