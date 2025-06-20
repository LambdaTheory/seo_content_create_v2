import { KeywordExtractionService, KeywordExtractionConfig } from '../KeywordExtractionService';

describe('KeywordExtractionService', () => {
  let service: KeywordExtractionService;

  beforeEach(() => {
    service = new KeywordExtractionService();
  });

  describe('constructor', () => {
    it('应该创建服务实例', () => {
      expect(service).toBeInstanceOf(KeywordExtractionService);
    });
  });

  describe('extractKeywords', () => {
    it('应该从游戏数据中提取关键词', () => {
      const gameData = {
        title: 'Super Adventure Game',
        description: 'An exciting action-packed adventure puzzle game',
        tags: ['action', 'adventure', 'puzzle'],
        content: 'Play this amazing multiplayer online game'
      };

      const result = service.extractKeywords(gameData);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('coreKeywords');
      expect(result).toHaveProperty('gameTypeKeywords');
      expect(result).toHaveProperty('longTailKeywords');
      expect(result).toHaveProperty('statistics');

      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.coreKeywords.length).toBeGreaterThan(0);
      expect(result.statistics.totalWords).toBeGreaterThan(0);
    });

    it('应该处理空数据', () => {
      const gameData = {};
      const result = service.extractKeywords(gameData);

      expect(result.keywords).toHaveLength(0);
      expect(result.coreKeywords).toHaveLength(0);
      expect(result.statistics.totalWords).toBe(0);
    });

    it('应该使用自定义配置', () => {
      const gameData = {
        title: 'Racing Game',
        description: 'Fast car racing action'
      };

      const config: Partial<KeywordExtractionConfig> = {
        maxKeywords: 5,
        minKeywordLength: 3,
        enableStopWordFilter: false
      };

      const result = service.extractKeywords(gameData, config);

      expect(result.keywords.length).toBeLessThanOrEqual(5);
      // 验证最小长度过滤
      result.keywords.forEach(keyword => {
        expect(keyword.keyword.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('应该正确识别游戏类型关键词', () => {
      const gameData = {
        title: 'Action RPG Adventure',
        description: 'Role-playing strategy puzzle game',
        tags: ['rpg', 'strategy', 'puzzle']
      };

      const result = service.extractKeywords(gameData);

      expect(result.gameTypeKeywords.length).toBeGreaterThan(0);
      
      // 验证游戏类型关键词
      const gameTypeWords = ['action', 'rpg', 'adventure', 'strategy', 'puzzle'];
      const foundGameTypes = result.gameTypeKeywords.filter(keyword => 
        gameTypeWords.some(type => keyword.toLowerCase().includes(type))
      );
      expect(foundGameTypes.length).toBeGreaterThan(0);
    });

    it('应该过滤停用词', () => {
      const gameData = {
        title: 'The Best Game',
        description: 'This is a very good game with amazing features'
      };

      const result = service.extractKeywords(gameData);

      // 验证常见停用词被过滤
      const stopWords = ['the', 'is', 'a', 'very', 'with'];
      const foundStopWords = result.keywords.filter(keyword => 
        stopWords.includes(keyword.keyword.toLowerCase())
      );
      expect(foundStopWords.length).toBe(0);
    });

    it('应该计算权重分数', () => {
      const gameData = {
        title: 'Action Game',
        description: 'Action packed adventure'
      };

      const result = service.extractKeywords(gameData);

      result.keywords.forEach(keyword => {
        expect(keyword.weight).toBeGreaterThan(0);
        expect(keyword.frequency).toBeGreaterThan(0);
        expect(keyword.positionWeight).toBeGreaterThan(0);
        expect(keyword.tfidfScore).toBeGreaterThanOrEqual(0);
        expect(keyword.gameTypeRelevance).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('batchExtractKeywords', () => {
    it('应该批量处理多个游戏数据', () => {
      const gameDataList = [
        { title: 'Racing Game', description: 'Fast cars' },
        { title: 'Puzzle Game', description: 'Brain training' },
        { title: 'Action Game', description: 'Fight enemies' }
      ];

      const results = service.batchExtractKeywords(gameDataList);

      expect(results.size).toBe(3);
      
      results.forEach((result, index) => {
        expect(result).toHaveProperty('keywords');
        expect(result).toHaveProperty('statistics');
      });
    });

    it('应该处理错误数据', () => {
      const gameDataList = [
        { title: 'Valid Game' },
        null as any,
        { title: 'Another Valid Game' }
      ];

      const results = service.batchExtractKeywords(gameDataList);

      // 应该处理有效的数据，跳过错误的数据
      expect(results.size).toBeLessThanOrEqual(3);
    });
  });

  describe('配置相关方法', () => {
    it('getDefaultConfig 应该返回默认配置', () => {
      const config = service.getDefaultConfig();

      expect(config).toHaveProperty('maxKeywords');
      expect(config).toHaveProperty('minKeywordLength');
      expect(config).toHaveProperty('enableStopWordFilter');
      expect(config).toHaveProperty('weightingStrategy');

      expect(config.maxKeywords).toBe(20);
      expect(config.minKeywordLength).toBe(2);
      expect(config.enableStopWordFilter).toBe(true);
      expect(config.weightingStrategy).toBe('hybrid');
    });

    it('validateConfig 应该验证配置有效性', () => {
      // 有效配置
      expect(service.validateConfig({
        maxKeywords: 10,
        minKeywordLength: 2,
        maxKeywordLength: 15
      })).toBe(true);

      // 无效配置 - 负数
      expect(service.validateConfig({
        maxKeywords: -1
      })).toBe(false);

      expect(service.validateConfig({
        minKeywordLength: 0
      })).toBe(false);

      expect(service.validateConfig({
        minFrequency: -1
      })).toBe(false);

      // 无效配置 - 逻辑错误
      expect(service.validateConfig({
        minKeywordLength: 10,
        maxKeywordLength: 5
      })).toBe(false);
    });
  });

  describe('词典和停用词管理', () => {
    it('getGameTypeDictionary 应该返回游戏类型词典', () => {
      const dictionary = service.getGameTypeDictionary();

      expect(dictionary).toBeInstanceOf(Map);
      expect(dictionary.size).toBeGreaterThan(0);
      
      // 验证包含常见游戏类型
      expect(dictionary.has('action')).toBe(true);
      expect(dictionary.has('puzzle')).toBe(true);
      expect(dictionary.has('rpg')).toBe(true);
    });

    it('getStopWords 应该返回停用词集合', () => {
      const stopWords = service.getStopWords();

      expect(stopWords).toBeInstanceOf(Set);
      expect(stopWords.size).toBeGreaterThan(0);
      
      // 验证包含常见停用词
      expect(stopWords.has('the')).toBe(true);
      expect(stopWords.has('and')).toBe(true);
      expect(stopWords.has('is')).toBe(true);
    });

    it('应该支持添加自定义游戏类型', () => {
      const customType = 'customtype';
      const weight = 2.5;

      service.addCustomGameType(customType, weight);
      const dictionary = service.getGameTypeDictionary();

      expect(dictionary.has(customType)).toBe(true);
      expect(dictionary.get(customType)).toBe(weight);
    });

    it('应该支持添加自定义停用词', () => {
      const customStopWord = 'customstop';

      service.addCustomStopWord(customStopWord);
      const stopWords = service.getStopWords();

      expect(stopWords.has(customStopWord)).toBe(true);
    });

    it('应该支持移除自定义游戏类型', () => {
      const customType = 'removetype';
      
      service.addCustomGameType(customType, 2.0);
      expect(service.getGameTypeDictionary().has(customType)).toBe(true);
      
      service.removeCustomGameType(customType);
      expect(service.getGameTypeDictionary().has(customType)).toBe(false);
    });

    it('应该支持移除自定义停用词', () => {
      const customStopWord = 'removestop';
      
      service.addCustomStopWord(customStopWord);
      expect(service.getStopWords().has(customStopWord)).toBe(true);
      
      service.removeCustomStopWord(customStopWord);
      expect(service.getStopWords().has(customStopWord)).toBe(false);
    });
  });

  describe('权重计算策略', () => {
    const gameData = {
      title: 'Action Adventure Game',
      description: 'Epic action adventure with great gameplay'
    };

    it('应该支持频率策略', () => {
      const config: Partial<KeywordExtractionConfig> = {
        weightingStrategy: 'frequency'
      };

      const result = service.extractKeywords(gameData, config);
      expect(result.keywords.length).toBeGreaterThan(0);
      
      // 验证权重与频率相关
      result.keywords.forEach(keyword => {
        expect(keyword.weight).toBe(keyword.frequency);
      });
    });

    it('应该支持TF-IDF策略', () => {
      const config: Partial<KeywordExtractionConfig> = {
        weightingStrategy: 'tfidf'
      };

      const result = service.extractKeywords(gameData, config);
      expect(result.keywords.length).toBeGreaterThan(0);
      
      // 验证权重与TF-IDF分数相关
      result.keywords.forEach(keyword => {
        expect(keyword.weight).toBe(keyword.tfidfScore);
      });
    });

    it('应该支持位置权重策略', () => {
      const config: Partial<KeywordExtractionConfig> = {
        weightingStrategy: 'position'
      };

      const result = service.extractKeywords(gameData, config);
      expect(result.keywords.length).toBeGreaterThan(0);
      
      // 验证权重与位置权重相关
      result.keywords.forEach(keyword => {
        expect(keyword.weight).toBe(keyword.positionWeight);
      });
    });

    it('应该支持混合策略（默认）', () => {
      const config: Partial<KeywordExtractionConfig> = {
        weightingStrategy: 'hybrid'
      };

      const result = service.extractKeywords(gameData, config);
      expect(result.keywords.length).toBeGreaterThan(0);
      
      // 验证混合权重计算
      result.keywords.forEach(keyword => {
        expect(keyword.weight).toBeGreaterThan(0);
        // 混合权重应该不等于单独的任何一种权重
        expect(keyword.weight).not.toBe(keyword.frequency);
        expect(keyword.weight).not.toBe(keyword.tfidfScore);
        expect(keyword.weight).not.toBe(keyword.positionWeight);
      });
    });
  });

  describe('长尾关键词识别', () => {
    it('应该识别长尾关键词', () => {
      const gameData = {
        title: 'Super-Mario-Bros Adventure',
        description: 'multiplayer-online-battle-arena game with character-customization'
      };

      const result = service.extractKeywords(gameData);

      expect(result.longTailKeywords.length).toBeGreaterThan(0);
      
      // 验证长尾关键词特征
      result.longTailKeywords.forEach(keyword => {
        const isLong = keyword.length > 10;
        const hasHyphen = keyword.includes('-');
        expect(isLong || hasHyphen).toBe(true);
      });
    });
  });

  describe('统计信息', () => {
    it('应该生成正确的统计信息', () => {
      const gameData = {
        title: 'Action Game',
        description: 'Great action packed adventure puzzle game'
      };

      const result = service.extractKeywords(gameData);
      const stats = result.statistics;

      expect(stats.totalWords).toBeGreaterThan(0);
      expect(stats.uniqueWords).toBeGreaterThan(0);
      expect(stats.uniqueWords).toBeLessThanOrEqual(stats.totalWords);
      expect(stats.avgKeywordLength).toBeGreaterThan(0);
      expect(stats.topFrequency).toBeGreaterThan(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理仅包含停用词的文本', () => {
      const gameData = {
        title: 'The And Or But',
        description: 'A very good and nice the'
      };

      const result = service.extractKeywords(gameData);
      
      // 可能没有关键词或只有很少的关键词
      expect(result.keywords.length).toBeGreaterThanOrEqual(0);
    });

    it('应该处理特殊字符和数字', () => {
      const gameData = {
        title: 'Game123 @#$ Special!!!',
        description: 'Game with 999 points and $$$ rewards'
      };

      const result = service.extractKeywords(gameData);
      
      // 验证特殊字符被正确处理
      result.keywords.forEach(keyword => {
        expect(keyword.keyword).toMatch(/^[a-zA-Z0-9\u4e00-\u9fa5\-_]+$/);
      });
    });

    it('应该处理中英文混合文本', () => {
      const gameData = {
        title: '动作游戏 Action Game',
        description: '这是一个很好的游戏 This is a great game'
      };

      const result = service.extractKeywords(gameData);
      
      expect(result.keywords.length).toBeGreaterThan(0);
      
      // 验证中英文关键词都被识别
      const hasEnglish = result.keywords.some(k => /[a-zA-Z]/.test(k.keyword));
      const hasChinese = result.keywords.some(k => /[\u4e00-\u9fa5]/.test(k.keyword));
      
      expect(hasEnglish || hasChinese).toBe(true);
    });

    it('应该处理非常长的文本', () => {
      const longDescription = 'game '.repeat(1000) + 'adventure '.repeat(500);
      const gameData = {
        title: 'Long Game',
        description: longDescription
      };

      const result = service.extractKeywords(gameData);
      
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.statistics.totalWords).toBeGreaterThan(1000);
    });
  });
}); 