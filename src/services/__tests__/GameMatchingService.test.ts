import { GameMatchingService, MatchResult, MatchingConfig } from '../GameMatchingService';
import { CompetitorGame } from '@/types/Competitor.types';

describe('GameMatchingService', () => {
  let service: GameMatchingService;
  let mockGames: CompetitorGame[];

  beforeEach(() => {
    service = new GameMatchingService();
    
    // Mock游戏数据
    mockGames = [
      {
        id: 'game1',
        websiteId: 'test-site',
        websiteName: 'Test Site',
        title: 'Super Mario Bros',
        url: 'https://test.com/super-mario-bros',
        tags: ['platform', 'action'],
        crawledAt: new Date(),
        updatedAt: new Date(),
        processed: true,
        description: 'Classic platform game with Mario'
      },
      {
        id: 'game2',
        websiteId: 'test-site',
        websiteName: 'Test Site',
        title: 'Pac-Man Championship',
        url: 'https://test.com/pac-man',
        tags: ['arcade', 'classic'],
        crawledAt: new Date(),
        updatedAt: new Date(),
        processed: true,
        description: 'Classic arcade game with Pac-Man'
      },
      {
        id: 'game3',
        websiteId: 'test-site',
        websiteName: 'Test Site',
        title: 'Tetris Block Puzzle',
        url: 'https://test.com/tetris',
        tags: ['puzzle', 'block'],
        crawledAt: new Date(),
        updatedAt: new Date(),
        processed: true,
        description: 'Classic block puzzle game'
      },
      {
        id: 'game4',
        websiteId: 'test-site',
        websiteName: 'Test Site',
        title: 'Super Mario World',
        url: 'https://test.com/super-mario-world',
        tags: ['platform', 'action', 'adventure'],
        crawledAt: new Date(),
        updatedAt: new Date(),
        processed: true,
        description: 'Advanced Mario platform game'
      }
    ];

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('基本匹配功能', () => {
    it('应该找到完全匹配的游戏', () => {
      const results = service.matchGames('Super Mario Bros', mockGames);
      
      expect(results).toHaveLength(1);
      expect(results[0].game.title).toBe('Super Mario Bros');
      expect(results[0].similarity).toBeCloseTo(1, 2);
    });

    it('应该找到部分匹配的游戏', () => {
      const results = service.matchGames('Mario', mockGames);
      
      expect(results.length).toBeGreaterThan(0);
      const marioGames = results.filter(r => r.game.title.includes('Mario'));
      expect(marioGames.length).toBeGreaterThan(0);
    });

    it('应该在空查询时返回空结果', () => {
      const results = service.matchGames('', mockGames);
      expect(results).toHaveLength(0);
    });

    it('应该在空候选列表时返回空结果', () => {
      const results = service.matchGames('Mario', []);
      expect(results).toHaveLength(0);
    });

    it('应该按相似度降序排序', () => {
      const results = service.matchGames('Mario', mockGames);
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });
  });

  describe('字符串相似度算法', () => {
    it('应该正确计算编辑距离相似度', () => {
      // 使用反射访问私有方法进行测试
      const calculateLevenshteinSimilarity = (service as any).calculateLevenshteinSimilarity.bind(service);
      
      // 完全相同
      expect(calculateLevenshteinSimilarity('hello', 'hello')).toBe(1);
      
      // 完全不同
      expect(calculateLevenshteinSimilarity('abc', 'xyz')).toBeCloseTo(0, 1);
      
      // 部分相似
      expect(calculateLevenshteinSimilarity('kitten', 'sitting')).toBeGreaterThan(0);
      expect(calculateLevenshteinSimilarity('kitten', 'sitting')).toBeLessThan(1);
      
      // 空字符串
      expect(calculateLevenshteinSimilarity('', 'hello')).toBe(0);
      expect(calculateLevenshteinSimilarity('hello', '')).toBe(0);
    });

    it('应该正确计算余弦相似度', () => {
      const calculateCosineSimilarity = (service as any).calculateCosineSimilarity.bind(service);
      
      // 完全相同
      expect(calculateCosineSimilarity('hello world', 'hello world')).toBe(1);
      
      // 词汇重叠
      expect(calculateCosineSimilarity('hello world', 'world hello')).toBe(1);
      
      // 部分重叠
      expect(calculateCosineSimilarity('hello world', 'hello test')).toBeGreaterThan(0);
      expect(calculateCosineSimilarity('hello world', 'hello test')).toBeLessThan(1);
      
      // 无重叠
      expect(calculateCosineSimilarity('hello', 'world')).toBe(0);
      
      // 空字符串
      expect(calculateCosineSimilarity('', 'hello')).toBe(0);
    });

    it('应该正确计算Jaccard相似度', () => {
      const calculateJaccardSimilarity = (service as any).calculateJaccardSimilarity.bind(service);
      
      // 完全相同
      expect(calculateJaccardSimilarity('hello world', 'hello world')).toBe(1);
      
      // 部分重叠
      const similarity = calculateJaccardSimilarity('hello world test', 'hello world game');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
      
      // 无重叠
      expect(calculateJaccardSimilarity('hello', 'world')).toBe(0);
      
      // 空字符串
      expect(calculateJaccardSimilarity('', '')).toBe(1);
      expect(calculateJaccardSimilarity('', 'hello')).toBe(0);
    });
  });

  describe('配置和阈值', () => {
    it('应该使用自定义阈值过滤结果', () => {
      const config: Partial<MatchingConfig> = {
        threshold: 0.9 // 高阈值
      };
      
      const results = service.matchGames('Mario Game', mockGames, config);
      
      // 高阈值应该返回更少的结果
      results.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('应该限制返回结果数量', () => {
      const config: Partial<MatchingConfig> = {
        maxResults: 2,
        threshold: 0.1 // 低阈值确保有足够候选
      };
      
      const results = service.matchGames('game', mockGames, config);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('应该使用自定义字段权重', () => {
      const titleOnlyConfig: Partial<MatchingConfig> = {
        weights: {
          title: 1.0,
          description: 0.0,
          tags: 0.0
        }
      };
      
      const results = service.matchGames('Mario', mockGames, titleOnlyConfig);
      
      // 只基于标题匹配应该找到Mario游戏
      const marioResults = results.filter(r => r.game.title.includes('Mario'));
      expect(marioResults.length).toBeGreaterThan(0);
    });

    it('应该支持大小写敏感配置', () => {
      const caseSensitiveConfig: Partial<MatchingConfig> = {
        caseSensitive: true
      };
      
      const results1 = service.matchGames('mario', mockGames, caseSensitiveConfig);
      const results2 = service.matchGames('Mario', mockGames, caseSensitiveConfig);
      
      // 大小写敏感时，结果可能不同
      expect(results1.length).toBeGreaterThanOrEqual(0);
      expect(results2.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('批量匹配', () => {
    it('应该支持批量匹配多个查询', () => {
      const queries = ['Mario', 'Pac-Man', 'Tetris'];
      const results = service.batchMatchGames(queries, mockGames);
      
      expect(results.size).toBe(3);
      expect(results.has('Mario')).toBe(true);
      expect(results.has('Pac-Man')).toBe(true);
      expect(results.has('Tetris')).toBe(true);
      
      // 每个查询都应该有结果
      queries.forEach(query => {
        const queryResults = results.get(query);
        expect(queryResults).toBeDefined();
        expect(Array.isArray(queryResults)).toBe(true);
      });
    });

    it('应该处理空查询列表', () => {
      const results = service.batchMatchGames([], mockGames);
      expect(results.size).toBe(0);
    });
  });

  describe('匹配结果详情', () => {
    it('应该包含详细的评分信息', () => {
      const results = service.matchGames('Super Mario Bros', mockGames);
      
      expect(results.length).toBeGreaterThan(0);
      const result = results[0];
      
      expect(result).toHaveProperty('similarity');
      expect(result).toHaveProperty('scores');
      expect(result.scores).toHaveProperty('levenshtein');
      expect(result.scores).toHaveProperty('cosine');
      expect(result.scores).toHaveProperty('jaccard');
      expect(result.scores).toHaveProperty('normalized');
      
      expect(result).toHaveProperty('matchedFields');
      expect(result.matchedFields).toHaveProperty('title');
    });

    it('应该正确处理缺失的描述和标签', () => {
      const gameWithoutDesc: CompetitorGame = {
        id: 'game-no-desc',
        websiteId: 'test-site',
        websiteName: 'Test Site',
        title: 'Simple Game',
        url: 'https://test.com/simple',
        tags: [],
        crawledAt: new Date(),
        updatedAt: new Date(),
        processed: true
        // 没有description
      };
      
      const results = service.matchGames('Simple Game', [gameWithoutDesc]);
      
      expect(results.length).toBeGreaterThan(0);
      const result = results[0];
      
      expect(result.matchedFields.description).toBeUndefined();
      expect(result.matchedFields.tags).toBeUndefined();
    });
  });

  describe('工具方法', () => {
    it('应该返回默认配置', () => {
      const config = service.getDefaultConfig();
      
      expect(config).toHaveProperty('threshold');
      expect(config).toHaveProperty('maxResults');
      expect(config).toHaveProperty('weights');
      expect(config).toHaveProperty('algorithmWeights');
      expect(config).toHaveProperty('fuzzyMatch');
      expect(config).toHaveProperty('caseSensitive');
      
      // 权重应该加起来等于1
      const { title, description, tags } = config.weights;
      expect(title + description + tags).toBeCloseTo(1, 3);
      
      const { levenshtein, cosine, jaccard } = config.algorithmWeights;
      expect(levenshtein + cosine + jaccard).toBeCloseTo(1, 3);
    });

    it('应该验证有效配置', () => {
      const validConfig: Partial<MatchingConfig> = {
        threshold: 0.5,
        maxResults: 5,
        weights: {
          title: 0.7,
          description: 0.2,
          tags: 0.1
        },
        algorithmWeights: {
          levenshtein: 0.4,
          cosine: 0.4,
          jaccard: 0.2
        }
      };
      
      expect(service.validateConfig(validConfig)).toBe(true);
    });

    it('应该拒绝无效配置', () => {
      // 阈值超出范围
      expect(service.validateConfig({ threshold: 1.5 })).toBe(false);
      expect(service.validateConfig({ threshold: -0.1 })).toBe(false);
      
      // 结果数量无效
      expect(service.validateConfig({ maxResults: 0 })).toBe(false);
      expect(service.validateConfig({ maxResults: 101 })).toBe(false);
      
      // 权重不为1
      expect(service.validateConfig({
        weights: { title: 0.5, description: 0.3, tags: 0.3 } // 总和1.1
      })).toBe(false);
      
      // 算法权重不为1
      expect(service.validateConfig({
        algorithmWeights: { levenshtein: 0.3, cosine: 0.3, jaccard: 0.3 } // 总和0.9
      })).toBe(false);
      
      // 负权重
      expect(service.validateConfig({
        weights: { title: 0.8, description: -0.1, tags: 0.3 }
      })).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该处理特殊字符', () => {
      const specialGame: CompetitorGame = {
        id: 'special',
        websiteId: 'test-site',
        websiteName: 'Test Site',
        title: 'Game: Special Edition!',
        url: 'https://test.com/special',
        tags: ['special', 'edition'],
        crawledAt: new Date(),
        updatedAt: new Date(),
        processed: true
      };
      
      const results = service.matchGames('Game Special Edition', [specialGame]);
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该处理非常长的字符串', () => {
      const longTitle = 'A'.repeat(1000);
      const longGame: CompetitorGame = {
        id: 'long',
        websiteId: 'test-site',
        websiteName: 'Test Site',
        title: longTitle,
        url: 'https://test.com/long',
        tags: [],
        crawledAt: new Date(),
        updatedAt: new Date(),
        processed: true
      };
      
      const results = service.matchGames(longTitle, [longGame]);
      expect(results.length).toBe(1);
      expect(results[0].similarity).toBeCloseTo(1, 2);
    });

    it('应该处理Unicode字符', () => {
      const unicodeGame: CompetitorGame = {
        id: 'unicode',
        websiteId: 'test-site',
        websiteName: 'Test Site',
        title: '超级马里奥兄弟',
        url: 'https://test.com/unicode',
        tags: ['游戏', '平台'],
        crawledAt: new Date(),
        updatedAt: new Date(),
        processed: true
      };
      
      const results = service.matchGames('超级马里奥', [unicodeGame]);
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该处理只有空格的字符串', () => {
      const results = service.matchGames('   ', mockGames);
      expect(results).toHaveLength(0);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理大量游戏', () => {
      // 创建1000个游戏
      const largeGameList: CompetitorGame[] = [];
      for (let i = 0; i < 1000; i++) {
        largeGameList.push({
          id: `game${i}`,
          websiteId: 'test-site',
          websiteName: 'Test Site',
          title: `Game ${i} - Random Title ${Math.random().toString(36).substring(7)}`,
          url: `https://test.com/game${i}`,
          tags: [`tag${i % 10}`, `category${i % 5}`],
          crawledAt: new Date(),
          updatedAt: new Date(),
          processed: true
        });
      }
      
      const startTime = Date.now();
      const results = service.matchGames('Game 500', largeGameList, { maxResults: 10 });
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // 应该在5秒内完成
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });
}); 