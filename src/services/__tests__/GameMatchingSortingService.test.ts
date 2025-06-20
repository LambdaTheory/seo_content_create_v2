import { GameMatchingSortingService, SortingConfig, EnhancedMatchResult } from '../GameMatchingSortingService';
import { MatchResult } from '../GameMatchingService';
import { CompetitorGame } from '@/types/Competitor.types';

describe('GameMatchingSortingService', () => {
  let service: GameMatchingSortingService;

  // 模拟测试数据
  const mockCompetitorGames: CompetitorGame[] = [
    {
      id: '1',
      websiteId: 'coolmath',
      websiteName: 'coolmathgames.com',
      title: 'Subway Surfers - Endless Running Game',
      description: 'Run as far as you can in this endless running adventure! Dodge trains, collect coins, and unlock new characters.',
      url: 'https://coolmathgames.com/0-subway-surfers',
      imageUrl: 'https://example.com/subway-surfers.jpg',
      tags: ['running', 'endless', 'action', 'adventure'],
      category: 'Action',
      rating: 4.5,
      popularity: 100000,
      crawledAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-20'),
      qualityScore: 0.9,
      processed: true
    },
    {
      id: '2',
      websiteId: 'gamedist',
      websiteName: 'gamedistribution.com',
      title: 'Temple Run',
      description: 'An endless runner game.',
      url: 'https://gamedistribution.com/temple-run',
      imageUrl: '',
      tags: ['running'],
      category: 'Action',
      rating: 4.0,
      popularity: 50000,
      crawledAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
      qualityScore: 0.7,
      processed: true
    },
    {
      id: '3',
      websiteId: 'twoplayer',
      websiteName: 'twoplayergames.org',
      title: 'Subway Surfers Mobile Edition',
      description: 'Mobile version of the popular endless running game.',
      url: 'https://twoplayergames.org/subway-surfers-mobile',
      imageUrl: 'https://example.com/subway-mobile.jpg',
      tags: ['running', 'mobile'],
      category: 'Action',
      rating: 3.5,
      popularity: 30000,
      crawledAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
      qualityScore: 0.6,
      processed: true
    }
  ];

  const mockMatchResults: MatchResult[] = [
    {
      game: mockCompetitorGames[0],
      similarity: 0.95,
      scores: {
        levenshtein: 0.95,
        cosine: 0.93,
        jaccard: 0.90,
        normalized: 0.93
      },
      matchedFields: {
        title: 0.95,
        description: 0.85,
        tags: 0.80
      }
    },
    {
      game: mockCompetitorGames[1],
      similarity: 0.75,
      scores: {
        levenshtein: 0.70,
        cosine: 0.75,
        jaccard: 0.80,
        normalized: 0.75
      },
      matchedFields: {
        title: 0.75,
        description: 0.60,
        tags: 0.70
      }
    },
    {
      game: mockCompetitorGames[2],
      similarity: 0.88,
      scores: {
        levenshtein: 0.85,
        cosine: 0.90,
        jaccard: 0.88,
        normalized: 0.88
      },
      matchedFields: {
        title: 0.88,
        description: 0.80,
        tags: 0.85
      }
    }
  ];

  beforeEach(() => {
    service = new GameMatchingSortingService();
  });

  describe('sortAndFilter', () => {
    it('应该正确排序和筛选匹配结果', () => {
      const result = service.sortAndFilter(mockMatchResults);

      expect(result.results).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.length).toBeLessThanOrEqual(mockMatchResults.length);
    });

    it('应该按最终分数降序排列结果', () => {
      const result = service.sortAndFilter(mockMatchResults);
      
      for (let i = 0; i < result.results.length - 1; i++) {
        expect(result.results[i].finalScore).toBeGreaterThanOrEqual(
          result.results[i + 1].finalScore
        );
      }
    });

    it('应该过滤低质量结果', () => {
      const lowQualityResults = mockMatchResults.map(r => ({
        ...r,
        similarity: 0.1 // 低相似度
      }));

      const result = service.sortAndFilter(lowQualityResults);
      expect(result.results.length).toBe(0);
    });

    it('应该应用TOP-N限制', () => {
      const config: Partial<SortingConfig> = {
        topN: 2
      };

      const result = service.sortAndFilter(mockMatchResults, config);
      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    it('应该正确计算统计信息', () => {
      const result = service.sortAndFilter(mockMatchResults);

      expect(result.stats.originalCount).toBe(mockMatchResults.length);
      expect(result.stats.finalCount).toBe(result.results.length);
      expect(result.stats.avgSimilarity).toBeGreaterThan(0);
      expect(result.stats.avgQualityScore).toBeGreaterThan(0);
    });
  });

  describe('去重功能', () => {
    const duplicateResults = [
      ...mockMatchResults,
      {
        ...mockMatchResults[0],
        id: '4',
        game: {
          ...mockMatchResults[0].game,
          id: '4',
          url: 'https://different.com/subway-surfers'
        }
      }
    ];

    it('应该正确去重结果', () => {
      const config: Partial<SortingConfig> = {
        enableDeduplication: true,
        deduplicationStrategy: 'title'
      };

      const result = service.sortAndFilter(duplicateResults, config);
      expect(result.stats.deduplicationStats.duplicatesRemoved).toBeGreaterThan(0);
    });

    it('应该支持不同的去重策略', () => {
      const strategies: Array<SortingConfig['deduplicationStrategy']> = ['url', 'title', 'content', 'similarity'];

      strategies.forEach(strategy => {
        const config: Partial<SortingConfig> = {
          enableDeduplication: true,
          deduplicationStrategy: strategy
        };

        const result = service.sortAndFilter(duplicateResults, config);
        expect(result.results.length).toBeLessThanOrEqualTo(duplicateResults.length);
      });
    });

    it('应该在禁用去重时保留所有结果', () => {
      const config: Partial<SortingConfig> = {
        enableDeduplication: false
      };

      const result = service.sortAndFilter(duplicateResults, config);
      expect(result.stats.deduplicationStats.duplicatesRemoved).toBe(0);
    });
  });

  describe('质量评分', () => {
    it('应该正确计算质量分数', () => {
      const result = service.sortAndFilter(mockMatchResults);
      
      result.results.forEach(r => {
        expect(r.qualityScore).toBeGreaterThanOrEqual(0);
        expect(r.qualityScore).toBeLessThanOrEqualTo(1);
      });
    });

    it('应该优先排序高质量结果', () => {
      const highQualityGame = {
        ...mockCompetitorGames[0],
        description: 'This is a very detailed and comprehensive description of an amazing game with lots of features and excellent gameplay mechanics that provide hours of entertainment.',
        tags: ['action', 'adventure', 'running', 'endless', 'coins', 'characters']
      };

      const highQualityResult = {
        ...mockMatchResults[0],
        game: highQualityGame,
        similarity: 0.8 // 较低相似度但高质量
      };

      const testResults = [mockMatchResults[1], highQualityResult]; // 低质量高相似度 vs 高质量低相似度
      const result = service.sortAndFilter(testResults);

      // 高质量结果应该排在前面（考虑综合评分）
      expect(result.results[0].game.id).toBe(highQualityGame.id);
    });
  });

  describe('多维度评分', () => {
    it('应该计算所有维度的分数', () => {
      const result = service.sortAndFilter(mockMatchResults);
      
      result.results.forEach(r => {
        expect(r.dimensionScores.size).toBeGreaterThan(0);
        expect(r.dimensionScores.has('similarity')).toBe(true);
        expect(r.dimensionScores.has('quality')).toBe(true);
        expect(r.dimensionScores.has('completeness')).toBe(true);
        expect(r.dimensionScores.has('freshness')).toBe(true);
      });
    });

    it('应该正确应用权重配置', () => {
      const config: Partial<SortingConfig> = {
        dimensions: [
          {
            name: 'similarity',
            weight: 1.0,
            scoreFunction: (result) => result.similarity,
            descending: true
          }
        ]
      };

      const result = service.sortAndFilter(mockMatchResults, config);
      
      // 只使用相似度排序时，应该按相似度排列
      expect(result.results[0].similarity).toBeGreaterThanOrEqual(
        result.results[result.results.length - 1].similarity
      );
    });
  });

  describe('配置验证', () => {
    it('应该验证有效的配置', () => {
      const validConfig: Partial<SortingConfig> = {
        topN: 10,
        minSimilarity: 0.3,
        enableDeduplication: true
      };

      expect(service.validateConfig(validConfig)).toBe(true);
    });

    it('应该拒绝无效的配置', () => {
      const invalidConfigs = [
        { topN: -1 },
        { minSimilarity: 1.5 },
        { deduplicationThreshold: -0.1 }
      ];

      invalidConfigs.forEach(config => {
        expect(service.validateConfig(config)).toBe(false);
      });
    });
  });

  describe('批量处理', () => {
    it('应该正确处理批量结果', () => {
      const resultGroups = new Map([
        ['group1', mockMatchResults.slice(0, 2)],
        ['group2', mockMatchResults.slice(1, 3)]
      ]);

      const result = service.batchSortAndFilter(resultGroups);

      expect(result.size).toBe(2);
      expect(result.has('group1')).toBe(true);
      expect(result.has('group2')).toBe(true);
      
      result.forEach((value, key) => {
        expect(value.results).toBeDefined();
        expect(value.stats).toBeDefined();
      });
    });

    it('应该为每个组生成独立的统计信息', () => {
      const resultGroups = new Map([
        ['group1', mockMatchResults.slice(0, 1)],
        ['group2', mockMatchResults.slice(0, 2)]
      ]);

      const result = service.batchSortAndFilter(resultGroups);

      const group1Stats = result.get('group1')!.stats;
      const group2Stats = result.get('group2')!.stats;

      expect(group1Stats.originalCount).toBe(1);
      expect(group2Stats.originalCount).toBe(2);
    });
  });

  describe('边界情况', () => {
    it('应该处理空结果数组', () => {
      const result = service.sortAndFilter([]);
      
      expect(result.results).toEqual([]);
      expect(result.stats.originalCount).toBe(0);
      expect(result.stats.finalCount).toBe(0);
    });

    it('应该处理单个结果', () => {
      const singleResult = [mockMatchResults[0]];
      const result = service.sortAndFilter(singleResult);
      
      expect(result.results.length).toBe(1);
      expect(result.stats.originalCount).toBe(1);
    });

    it('应该处理缺失数据的游戏', () => {
      const incompleteGame: CompetitorGame = {
        id: 'incomplete',
        name: 'Test Game',
        url: 'https://example.com/test',
        sitemap: 'example.com',
        title: '',
        description: '',
        category: '',
        tags: [],
        lastUpdated: new Date(),
        image: '',
        rating: 0,
        playCount: 0
      };

      const incompleteResult: MatchResult = {
        id: 'incomplete',
        queryGame: 'Test',
        game: incompleteGame,
        similarity: 0.5,
        matchType: 'similar',
        confidence: 0.5,
        reasons: [],
        metadata: {}
      };

      const result = service.sortAndFilter([incompleteResult]);
      expect(result.results.length).toBeGreaterThanOrEqualTo(0);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理大量结果', () => {
      // 生成大量测试数据
      const largeResults: MatchResult[] = [];
      for (let i = 0; i < 1000; i++) {
        largeResults.push({
          ...mockMatchResults[0],
          id: `large_${i}`,
          similarity: Math.random()
        });
      }

      const startTime = Date.now();
      const result = service.sortAndFilter(largeResults);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe('网站权威性评分', () => {
    it('应该正确识别知名网站', () => {
      const coolMathResult = mockMatchResults.find(r => 
        r.game.url.includes('coolmathgames.com')
      )!;
      
      const result = service.sortAndFilter([coolMathResult]);
      
      // coolmathgames.com 应该获得高权威性评分
      expect(result.results[0].qualityScore).toBeGreaterThan(0.5);
    });

    it('应该为未知网站给出适当评分', () => {
      const unknownSiteGame = {
        ...mockCompetitorGames[0],
        url: 'https://unknown-site.com/game'
      };

      const unknownResult = {
        ...mockMatchResults[0],
        game: unknownSiteGame
      };

      const result = service.sortAndFilter([unknownResult]);
      expect(result.results[0].qualityScore).toBeGreaterThanOrEqualTo(0);
    });
  });

  describe('排序原因追踪', () => {
    it('应该提供排序原因', () => {
      const result = service.sortAndFilter(mockMatchResults);
      
      result.results.forEach(r => {
        expect(r.sortingReasons).toBeDefined();
        expect(Array.isArray(r.sortingReasons)).toBe(true);
      });
    });

    it('应该包含相关的排序原因', () => {
      const result = service.sortAndFilter(mockMatchResults);
      
      const topResult = result.results[0];
      expect(topResult.sortingReasons.length).toBeGreaterThan(0);
      
      // 应该包含一些有意义的原因
      const reasons = topResult.sortingReasons.join(' ');
      expect(reasons.length).toBeGreaterThan(0);
    });
  });

  describe('默认配置', () => {
    it('应该返回有效的默认配置', () => {
      const defaultConfig = service.getDefaultConfig();
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.dimensions.length).toBeGreaterThan(0);
      expect(defaultConfig.topN).toBeGreaterThan(0);
      expect(defaultConfig.minSimilarity).toBeGreaterThanOrEqual(0);
      expect(defaultConfig.minSimilarity).toBeLessThanOrEqualTo(1);
    });

    it('应该验证默认配置', () => {
      const defaultConfig = service.getDefaultConfig();
      expect(service.validateConfig(defaultConfig)).toBe(true);
    });
  });

  describe('数据完整性', () => {
    it('应该为每个结果生成去重标识', () => {
      const result = service.sortAndFilter(mockMatchResults);
      
      result.results.forEach(r => {
        expect(r.deduplicationKey).toBeDefined();
        expect(typeof r.deduplicationKey).toBe('string');
        expect(r.deduplicationKey.length).toBeGreaterThan(0);
      });
    });

    it('应该为每个结果计算维度分数', () => {
      const result = service.sortAndFilter(mockMatchResults);
      
      result.results.forEach(r => {
        expect(r.dimensionScores).toBeDefined();
        expect(r.dimensionScores.size).toBeGreaterThan(0);
        
        // 每个维度分数应该在合理范围内
        r.dimensionScores.forEach((score, dimension) => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqualTo(1);
        });
      });
    });

    it('应该计算合理的最终分数', () => {
      const result = service.sortAndFilter(mockMatchResults);
      
      result.results.forEach(r => {
        expect(r.finalScore).toBeGreaterThanOrEqual(0);
        expect(r.finalScore).toBeLessThanOrEqualTo(1);
      });
    });
  });
}); 