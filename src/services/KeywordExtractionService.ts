/**
 * 关键词提取配置
 */
export interface KeywordExtractionConfig {
  /** 最大关键词数量 */
  maxKeywords: number;
  /** 最小关键词长度 */
  minKeywordLength: number;
  /** 最大关键词长度 */
  maxKeywordLength: number;
  /** 最小关键词频率 */
  minFrequency: number;
  /** 是否启用停用词过滤 */
  enableStopWordFilter: boolean;
  /** 是否启用游戏类型词典增强 */
  enableGameTypeDictionary: boolean;
  /** 权重计算策略 */
  weightingStrategy: 'frequency' | 'tfidf' | 'position' | 'hybrid';
  /** 是否区分大小写 */
  caseSensitive: boolean;
}

/**
 * 关键词结果
 */
export interface KeywordResult {
  /** 关键词 */
  keyword: string;
  /** 权重分数 (0-1) */
  weight: number;
  /** 频率 */
  frequency: number;
  /** 位置权重 */
  positionWeight: number;
  /** TF-IDF分数 */
  tfidfScore: number;
  /** 游戏类型相关性 */
  gameTypeRelevance: number;
  /** 来源字段 */
  sourceFields: string[];
}

/**
 * 关键词提取结果
 */
export interface ExtractionResult {
  /** 提取的关键词列表 */
  keywords: KeywordResult[];
  /** 核心关键词（权重最高的前N个） */
  coreKeywords: string[];
  /** 游戏类型关键词 */
  gameTypeKeywords: string[];
  /** 长尾关键词 */
  longTailKeywords: string[];
  /** 统计信息 */
  statistics: {
    totalWords: number;
    uniqueWords: number;
    avgKeywordLength: number;
    topFrequency: number;
  };
}

/**
 * 游戏关键词提取服务
 * 功能特性：
 * - 核心关键词识别
 * - 停用词过滤  
 * - 游戏类型词典增强
 * - 多种权重计算策略
 * - TF-IDF算法支持
 * - 位置权重计算
 * - 游戏相关性评分
 */
export class KeywordExtractionService {
  private readonly DEFAULT_CONFIG: KeywordExtractionConfig = {
    maxKeywords: 20,
    minKeywordLength: 2,
    maxKeywordLength: 20,
    minFrequency: 1,
    enableStopWordFilter: true,
    enableGameTypeDictionary: true,
    weightingStrategy: 'hybrid',
    caseSensitive: false
  };

  /** 游戏类型词典 */
  private readonly GAME_TYPE_DICTIONARY = new Map([
    // 游戏类型
    ['action', 3.0],
    ['adventure', 3.0],
    ['arcade', 3.0],
    ['puzzle', 3.0],
    ['strategy', 3.0],
    ['simulation', 3.0],
    ['racing', 3.0],
    ['platform', 3.0],
    ['shooting', 3.0],
    ['rpg', 3.0],
    ['role-playing', 3.0],
    ['sports', 3.0],
    ['fighting', 3.0],
    ['rhythm', 3.0],
    ['card', 3.0],
    ['board', 3.0],
    ['casino', 3.0],
    ['educational', 3.0],
    ['kids', 3.0],
    ['family', 3.0],

    // 游戏特征
    ['multiplayer', 2.5],
    ['single-player', 2.5],
    ['online', 2.5],
    ['offline', 2.5],
    ['co-op', 2.5],
    ['competitive', 2.5],
    ['casual', 2.5],
    ['hardcore', 2.5],
    ['retro', 2.5],
    ['classic', 2.5],
    ['modern', 2.5],
    ['indie', 2.5],

    // 游戏机制
    ['level', 2.0],
    ['boss', 2.0],
    ['upgrade', 2.0],
    ['unlock', 2.0],
    ['achievement', 2.0],
    ['leaderboard', 2.0],
    ['mission', 2.0],
    ['quest', 2.0],
    ['character', 2.0],
    ['weapon', 2.0],
    ['power-up', 2.0],
    ['score', 2.0],
    ['challenge', 2.0],

    // 游戏设备/平台
    ['mobile', 1.8],
    ['desktop', 1.8],
    ['browser', 1.8],
    ['html5', 1.8],
    ['flash', 1.8],
    ['unity', 1.8],
    ['webgl', 1.8],
    ['android', 1.8],
    ['ios', 1.8],
    ['pc', 1.8],
    ['console', 1.8],

    // 游戏品质描述
    ['fun', 1.5],
    ['addictive', 1.5],
    ['challenging', 1.5],
    ['exciting', 1.5],
    ['entertaining', 1.5],
    ['immersive', 1.5],
    ['engaging', 1.5],
    ['popular', 1.5],
    ['trending', 1.5],
    ['viral', 1.5],

    // 通用游戏词汇
    ['game', 1.2],
    ['games', 1.2],
    ['play', 1.2],
    ['player', 1.2],
    ['gaming', 1.2],
    ['gameplay', 1.2]
  ]);

  /** 停用词集合 */
  private readonly STOP_WORDS = new Set([
    // 英文停用词
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'you', 'your', 'this', 'that',
    'but', 'or', 'if', 'then', 'than', 'so', 'can', 'could', 'should',
    'would', 'have', 'had', 'do', 'does', 'did', 'get', 'got', 'go',
    'goes', 'went', 'come', 'came', 'see', 'saw', 'know', 'knew',
    'take', 'took', 'make', 'made', 'think', 'thought', 'say', 'said',
    'tell', 'told', 'give', 'gave', 'find', 'found', 'work', 'worked',
    'call', 'called', 'try', 'tried', 'ask', 'asked', 'need', 'needed',
    'feel', 'felt', 'become', 'became', 'leave', 'left', 'put', 'set',

    // 中文停用词  
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
    '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有',
    '看', '好', '自己', '这', '那', '什么', '出', '来', '时候', '可以', '还',
    '但是', '因为', '所以', '如果', '虽然', '然后', '而且', '或者',

    // 常见无意义词汇
    'more', 'most', 'much', 'many', 'some', 'any', 'all', 'every',
    'each', 'both', 'either', 'neither', 'other', 'another', 'such',
    'very', 'too', 'quite', 'rather', 'really', 'just', 'only', 'even',
    'also', 'still', 'yet', 'already', 'again', 'once', 'twice', 'never',
    'always', 'often', 'sometimes', 'usually', 'here', 'there', 'where',
    'when', 'how', 'why', 'what', 'who', 'which', 'whose', 'whom'
  ]);

  /** 位置权重映射 */
  private readonly POSITION_WEIGHTS = {
    title: 3.0,
    description: 2.0,
    tags: 2.5,
    content: 1.0,
    meta: 1.5
  };

  /**
   * 从游戏数据中提取关键词
   * @param gameData - 游戏数据对象
   * @param config - 提取配置
   * @returns ExtractionResult
   */
  public extractKeywords(
    gameData: Record<string, any>,
    config?: Partial<KeywordExtractionConfig>
  ): ExtractionResult {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    // 预处理文本数据
    const textData = this.preprocessGameData(gameData);
    
    // 分词和清理
    const tokens = this.tokenizeAndClean(textData, finalConfig);
    
    // 计算词频
    const termFrequencies = this.calculateTermFrequencies(tokens);
    
    // 计算TF-IDF分数
    const tfidfScores = this.calculateTFIDF(termFrequencies, tokens);
    
    // 计算位置权重
    const positionWeights = this.calculatePositionWeights(tokens);
    
    // 计算游戏类型相关性
    const gameTypeRelevance = this.calculateGameTypeRelevance(termFrequencies);
    
    // 综合评分
    const keywordResults = this.calculateFinalScores(
      termFrequencies,
      tfidfScores,
      positionWeights,
      gameTypeRelevance,
      finalConfig
    );
    
    // 筛选和排序
    const filteredKeywords = this.filterAndSortKeywords(keywordResults, finalConfig);
    
    // 分类关键词
    const categorizedKeywords = this.categorizeKeywords(filteredKeywords);
    
    // 生成统计信息
    const statistics = this.generateStatistics(tokens, filteredKeywords);
    
    return {
      keywords: filteredKeywords,
      coreKeywords: categorizedKeywords.core,
      gameTypeKeywords: categorizedKeywords.gameType,
      longTailKeywords: categorizedKeywords.longTail,
      statistics
    };
  }

  /**
   * 预处理游戏数据
   * @param gameData - 游戏数据
   * @returns 结构化文本数据
   */
  private preprocessGameData(gameData: Record<string, any>): Record<string, string> {
    const textData: Record<string, string> = {};
    
    // 常见的文本字段映射
    const fieldMappings = {
      title: ['title', 'name', 'gameName', 'game_name'],
      description: ['description', 'desc', 'summary', 'about'],
      tags: ['tags', 'categories', 'genres', 'keywords'],
      content: ['content', 'body', 'text', 'details'],
      meta: ['meta', 'metadata', 'seo']
    };
    
    for (const [category, fields] of Object.entries(fieldMappings)) {
      const values: string[] = [];
      
      for (const field of fields) {
        if (gameData[field]) {
          if (Array.isArray(gameData[field])) {
            values.push(...gameData[field].map(String));
          } else {
            values.push(String(gameData[field]));
          }
        }
      }
      
      if (values.length > 0) {
        textData[category] = values.join(' ');
      }
    }
    
    return textData;
  }

  /**
   * 分词和清理
   * @param textData - 文本数据
   * @param config - 配置
   * @returns 分词结果
   */
  private tokenizeAndClean(
    textData: Record<string, string>,
    config: KeywordExtractionConfig
  ): Record<string, string[]> {
    const tokens: Record<string, string[]> = {};
    
    for (const [field, text] of Object.entries(textData)) {
      // 分词
      const words = this.tokenize(text, config.caseSensitive);
      
      // 过滤
      const filteredWords = words.filter(word => {
        // 长度过滤
        if (word.length < config.minKeywordLength || word.length > config.maxKeywordLength) {
          return false;
        }
        
        // 停用词过滤
        if (config.enableStopWordFilter && this.STOP_WORDS.has(word.toLowerCase())) {
          return false;
        }
        
        // 数字过滤（纯数字）
        if (/^\d+$/.test(word)) {
          return false;
        }
        
        // 特殊字符过滤
        if (!/^[a-zA-Z0-9\u4e00-\u9fa5\-_]+$/.test(word)) {
          return false;
        }
        
        return true;
      });
      
      tokens[field] = filteredWords;
    }
    
    return tokens;
  }

  /**
   * 分词
   * @param text - 文本
   * @param caseSensitive - 是否区分大小写
   * @returns 词汇数组
   */
  private tokenize(text: string, caseSensitive: boolean): string[] {
    // 预处理
    let processedText = text
      .replace(/[^\w\s\u4e00-\u9fa5\-]/g, ' ') // 移除标点符号，保留中文
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
    
    if (!caseSensitive) {
      processedText = processedText.toLowerCase();
    }
    
    // 分词（简单空格分割，实际项目中可以使用更高级的分词库）
    const words = processedText.split(/\s+/).filter(word => word.length > 0);
    
    // 处理连字符词汇
    const expandedWords: string[] = [];
    for (const word of words) {
      if (word.includes('-') && word.length > 3) {
        // 添加原词
        expandedWords.push(word);
        // 添加分解后的词
        const parts = word.split('-').filter(part => part.length > 1);
        expandedWords.push(...parts);
      } else {
        expandedWords.push(word);
      }
    }
    
    return expandedWords;
  }

  /**
   * 计算词频
   * @param tokens - 分词结果
   * @returns 词频统计
   */
  private calculateTermFrequencies(tokens: Record<string, string[]>): Map<string, number> {
    const frequencies = new Map<string, number>();
    
    for (const words of Object.values(tokens)) {
      for (const word of words) {
        frequencies.set(word, (frequencies.get(word) || 0) + 1);
      }
    }
    
    return frequencies;
  }

  /**
   * 计算TF-IDF分数
   * @param frequencies - 词频
   * @param tokens - 分词结果
   * @returns TF-IDF分数
   */
  private calculateTFIDF(
    frequencies: Map<string, number>,
    tokens: Record<string, string[]>
  ): Map<string, number> {
    const tfidfScores = new Map<string, number>();
    const totalDocuments = Object.keys(tokens).length;
    
    for (const [term, tf] of frequencies.entries()) {
      // 计算文档频率（DF）
      let documentsContaining = 0;
      for (const words of Object.values(tokens)) {
        if (words.includes(term)) {
          documentsContaining++;
        }
      }
      
      // 计算IDF
      const idf = Math.log(totalDocuments / documentsContaining);
      
      // 计算TF-IDF
      const tfidf = tf * idf;
      tfidfScores.set(term, tfidf);
    }
    
    return tfidfScores;
  }

  /**
   * 计算位置权重
   * @param tokens - 分词结果
   * @returns 位置权重
   */
  private calculatePositionWeights(tokens: Record<string, string[]>): Map<string, number> {
    const positionWeights = new Map<string, number>();
    
    for (const [field, words] of Object.entries(tokens)) {
      const fieldWeight = this.POSITION_WEIGHTS[field as keyof typeof this.POSITION_WEIGHTS] || 1.0;
      
      for (const word of words) {
        const currentWeight = positionWeights.get(word) || 0;
        positionWeights.set(word, Math.max(currentWeight, fieldWeight));
      }
    }
    
    return positionWeights;
  }

  /**
   * 计算游戏类型相关性
   * @param frequencies - 词频
   * @returns 游戏类型相关性分数
   */
  private calculateGameTypeRelevance(frequencies: Map<string, number>): Map<string, number> {
    const relevanceScores = new Map<string, number>();
    
    for (const [term] of frequencies.entries()) {
      const termLower = term.toLowerCase();
      let relevance = 0;
      
      // 精确匹配
      if (this.GAME_TYPE_DICTIONARY.has(termLower)) {
        relevance = this.GAME_TYPE_DICTIONARY.get(termLower) || 0;
      } else {
        // 模糊匹配（包含关系）
        for (const [gameType, weight] of this.GAME_TYPE_DICTIONARY.entries()) {
          if (termLower.includes(gameType) || gameType.includes(termLower)) {
            relevance = Math.max(relevance, weight * 0.5); // 模糊匹配权重减半
          }
        }
      }
      
      relevanceScores.set(term, relevance);
    }
    
    return relevanceScores;
  }

  /**
   * 计算最终分数
   * @param frequencies - 词频
   * @param tfidfScores - TF-IDF分数
   * @param positionWeights - 位置权重
   * @param gameTypeRelevance - 游戏类型相关性
   * @param config - 配置
   * @returns 关键词结果
   */
  private calculateFinalScores(
    frequencies: Map<string, number>,
    tfidfScores: Map<string, number>,
    positionWeights: Map<string, number>,
    gameTypeRelevance: Map<string, number>,
    config: KeywordExtractionConfig
  ): KeywordResult[] {
    const results: KeywordResult[] = [];
    
    for (const [term, frequency] of frequencies.entries()) {
      const tfidf = tfidfScores.get(term) || 0;
      const positionWeight = positionWeights.get(term) || 1;
      const gameRelevance = gameTypeRelevance.get(term) || 0;
      
      // 根据策略计算权重
      let finalWeight = 0;
      switch (config.weightingStrategy) {
        case 'frequency':
          finalWeight = frequency;
          break;
        case 'tfidf':
          finalWeight = tfidf;
          break;
        case 'position':
          finalWeight = positionWeight;
          break;
        case 'hybrid':
        default:
          // 混合策略：TF-IDF(40%) + 位置权重(30%) + 游戏相关性(20%) + 频率(10%)
          finalWeight = (
            tfidf * 0.4 +
            positionWeight * 0.3 +
            gameRelevance * 0.2 +
            frequency * 0.1
          );
          break;
      }
      
      results.push({
        keyword: term,
        weight: finalWeight,
        frequency,
        positionWeight,
        tfidfScore: tfidf,
        gameTypeRelevance: gameRelevance,
        sourceFields: this.getSourceFields(term, frequencies)
      });
    }
    
    return results;
  }

  /**
   * 获取关键词来源字段
   * @param term - 关键词
   * @param frequencies - 词频（这里简化处理）
   * @returns 来源字段列表
   */
  private getSourceFields(term: string, frequencies: Map<string, number>): string[] {
    // 简化实现，实际中需要跟踪每个词的来源字段
    return ['content']; // 默认返回content字段
  }

  /**
   * 筛选和排序关键词
   * @param results - 关键词结果
   * @param config - 配置
   * @returns 筛选后的关键词
   */
  private filterAndSortKeywords(
    results: KeywordResult[],
    config: KeywordExtractionConfig
  ): KeywordResult[] {
    return results
      .filter(result => result.frequency >= config.minFrequency)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, config.maxKeywords);
  }

  /**
   * 分类关键词
   * @param keywords - 关键词列表
   * @returns 分类结果
   */
  private categorizeKeywords(keywords: KeywordResult[]): {
    core: string[];
    gameType: string[];
    longTail: string[];
  } {
    const core: string[] = [];
    const gameType: string[] = [];
    const longTail: string[] = [];
    
    for (const keyword of keywords) {
      // 核心关键词：权重最高的前5个
      if (core.length < 5) {
        core.push(keyword.keyword);
      }
      
      // 游戏类型关键词：游戏相关性大于1的
      if (keyword.gameTypeRelevance > 1) {
        gameType.push(keyword.keyword);
      }
      
      // 长尾关键词：长度大于10个字符或包含连字符的
      if (keyword.keyword.length > 10 || keyword.keyword.includes('-')) {
        longTail.push(keyword.keyword);
      }
    }
    
    return { core, gameType, longTail };
  }

  /**
   * 生成统计信息
   * @param tokens - 分词结果
   * @param keywords - 关键词结果
   * @returns 统计信息
   */
  private generateStatistics(
    tokens: Record<string, string[]>,
    keywords: KeywordResult[]
  ): ExtractionResult['statistics'] {
    const allWords = Object.values(tokens).flat();
    const uniqueWords = new Set(allWords);
    
    const avgKeywordLength = keywords.length > 0
      ? keywords.reduce((sum, k) => sum + k.keyword.length, 0) / keywords.length
      : 0;
    
    const topFrequency = keywords.length > 0
      ? Math.max(...keywords.map(k => k.frequency))
      : 0;
    
    return {
      totalWords: allWords.length,
      uniqueWords: uniqueWords.size,
      avgKeywordLength: Math.round(avgKeywordLength * 100) / 100,
      topFrequency
    };
  }

  /**
   * 批量提取关键词
   * @param gameDataList - 游戏数据列表
   * @param config - 配置
   * @returns 批量提取结果
   */
  public batchExtractKeywords(
    gameDataList: Record<string, any>[],
    config?: Partial<KeywordExtractionConfig>
  ): Map<number, ExtractionResult> {
    const results = new Map<number, ExtractionResult>();
    
    gameDataList.forEach((gameData, index) => {
      try {
        const result = this.extractKeywords(gameData, config);
        results.set(index, result);
      } catch (error) {
        console.error(`关键词提取失败，索引: ${index}`, error);
      }
    });
    
    return results;
  }

  /**
   * 获取默认配置
   * @returns 默认配置
   */
  public getDefaultConfig(): KeywordExtractionConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * 验证配置
   * @param config - 配置
   * @returns 是否有效
   */
  public validateConfig(config: Partial<KeywordExtractionConfig>): boolean {
    if (config.maxKeywords !== undefined && config.maxKeywords <= 0) {
      return false;
    }
    
    if (config.minKeywordLength !== undefined && config.minKeywordLength < 1) {
      return false;
    }
    
    if (config.maxKeywordLength !== undefined && config.maxKeywordLength < config.minKeywordLength!) {
      return false;
    }
    
    if (config.minFrequency !== undefined && config.minFrequency < 0) {
      return false;
    }
    
    return true;
  }

  /**
   * 获取游戏类型词典
   * @returns 游戏类型词典
   */
  public getGameTypeDictionary(): Map<string, number> {
    return new Map(this.GAME_TYPE_DICTIONARY);
  }

  /**
   * 获取停用词列表
   * @returns 停用词集合
   */
  public getStopWords(): Set<string> {
    return new Set(this.STOP_WORDS);
  }

  /**
   * 添加自定义游戏类型
   * @param gameType - 游戏类型
   * @param weight - 权重
   */
  public addCustomGameType(gameType: string, weight: number): void {
    this.GAME_TYPE_DICTIONARY.set(gameType.toLowerCase(), weight);
  }

  /**
   * 添加自定义停用词
   * @param stopWord - 停用词
   */
  public addCustomStopWord(stopWord: string): void {
    this.STOP_WORDS.add(stopWord.toLowerCase());
  }

  /**
   * 移除自定义游戏类型
   * @param gameType - 游戏类型
   */
  public removeCustomGameType(gameType: string): void {
    this.GAME_TYPE_DICTIONARY.delete(gameType.toLowerCase());
  }

  /**
   * 移除自定义停用词
   * @param stopWord - 停用词
   */
  public removeCustomStopWord(stopWord: string): void {
    this.STOP_WORDS.delete(stopWord.toLowerCase());
  }
} 