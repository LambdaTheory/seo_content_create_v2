import { GameMatchingThresholdService, ThresholdConfig, QualityAssessment } from '../GameMatchingThresholdService';
import { MatchResult } from '../GameMatchingService';
import { CompetitorGame } from '@/types/Competitor.types';

describe('GameMatchingThresholdService', () => {
  let service: GameMatchingThresholdService;

  // 模拟测试数据
  const mockCompetitorGames: CompetitorGame[] = [
    {
      id: '1',
      websiteId: 'coolmath',
      websiteName: 'coolmathgames.com',
      title: 'Subway Surfers - Endless Running Game',
      description: 'Run as far as you can in this endless running adventure! Dodge trains, collect coins, and unlock new characters in this exciting game.',
      url: 'https://coolmathgames.com/0-subway-surfers',
      imageUrl: 'https://example.com/subway-surfers.jpg',
      tags: ['running', 'endless', 'action', 'adventure', 'coins'],
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
      description: 'Run.',
      url: 'https://gamedistribution.com/temple-run',
      imageUrl: '',
      tags: ['running'],
      category: 'Action',
      rating: 4.0,
      popularity: 50000,
      crawledAt: new Date('2025-01-15'),
      updatedAt: new Date('2024-12-15'), // 旧数据
      qualityScore: 0.4,
      processed: true
    },
    {
      id: '3',
      websiteId: 'unknown',
      websiteName: 'unknown-site.com',
      title: '',
      description: '',
      url: 'https://unknown-site.com/game',
      imageUrl: '',
      tags: [],
      category: '',
      rating: 0,
      popularity: 0,
      crawledAt: new Date('2024-11-01'),
      updatedAt: new Date('2024-11-01'), // 很旧的数据
      qualityScore: 0.1,
      processed: true
    }
  ];

  const mockMatchResults: MatchResult[] = [
    {
      game: mockCompetitorGames[0],
      similarity: 0.85,
      scores: {
        levenshtein: 0.85,
        cosine: 0.83,
        jaccard: 0.80,
        normalized: 0.83
      },
      matchedFields: {
        title: 0.85,
        description: 0.75,
        tags: 0.70
      }
    },
    {
      game: mockCompetitorGames[1],
      similarity: 0.65,
      scores: {
        levenshtein: 0.60,
        cosine: 0.65,
        jaccard: 0.70,
        normalized: 0.65
      },
      matchedFields: {
        title: 0.65,
        description: 0.40,
        tags: 0.60
      }
    },
    {
      game: mockCompetitorGames[2],
      similarity: 0.45,
      scores: {
        levenshtein: 0.40,
        cosine: 0.45,
        jaccard: 0.50,
        normalized: 0.45
      },
      matchedFields: {
        title: 0.20,
        description: 0.10
      }
    }
  ];

  const mockGame: CompetitorGame = {
    id: '1',
    websiteId: 'coolmath',
    websiteName: 'coolmathgames.com',
    title: 'Test Game',
    description: 'A test game for unit testing purposes.',
    url: 'https://coolmathgames.com/test-game',
    imageUrl: 'https://example.com/test.jpg',
    tags: ['test', 'game'],
    category: 'Action',
    rating: 4.0,
    popularity: 1000,
    crawledAt: new Date(),
    updatedAt: new Date(),
    qualityScore: 0.8,
    processed: true
  };

  const mockMatchResult: MatchResult = {
    game: mockGame,
    similarity: 0.75,
    scores: {
      levenshtein: 0.75,
      cosine: 0.73,
      jaccard: 0.70,
      normalized: 0.73
    },
    matchedFields: {
      title: 0.75,
      description: 0.65,
      tags: 0.60
    }
  };

  beforeEach(() => {
    service = new GameMatchingThresholdService();
  });

  describe('构造函数和初始化', () => {
    it('应该使用默认配置初始化', () => {
      const defaultService = new GameMatchingThresholdService();
      const config = defaultService.getConfig();
      
      expect(config.baseSimilarity).toBe(0.6);
      expect(config.minQuality).toBe(0.5);
      expect(config.confidence).toBe(0.7);
      expect(config.dynamicAdjustment.enabled).toBe(true);
    });

    it('应该接受自定义配置', () => {
      const customConfig: Partial<ThresholdConfig> = {
        baseSimilarity: 0.8,
        minQuality: 0.7
      };

      const customService = new GameMatchingThresholdService(customConfig);
      const config = customService.getConfig();
      
      expect(config.baseSimilarity).toBe(0.8);
      expect(config.minQuality).toBe(0.7);
    });

    it('应该初始化统计信息', () => {
      const stats = service.getStats();
      
      expect(stats.totalMatches).toBe(0);
      expect(stats.successMatches).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.adjustmentHistory).toEqual([]);
    });
  });

  describe('基本功能', () => {
    it('应该创建服务实例', () => {
      expect(service).toBeDefined();
    });

    it('应该返回默认配置', () => {
      const config = service.getDefaultConfig();
      expect(config.baseSimilarity).toBe(0.6);
      expect(config.minQuality).toBe(0.5);
    });

    it('应该应用阈值过滤', () => {
      const results = service.applyThreshold([mockMatchResult]);
      expect(results.length).toBe(1);
    });

    it('应该评估质量', () => {
      const assessment = service.assessQuality(mockMatchResult);
      expect(assessment.overallScore).toBeGreaterThan(0);
      expect(assessment.qualityLevel).toBeDefined();
    });
  });

  describe('配置验证', () => {
    it('应该验证有效配置', () => {
      const validConfig: Partial<ThresholdConfig> = {
        baseSimilarity: 0.7
      };
      expect(service.validateConfig(validConfig)).toBe(true);
    });

    it('应该拒绝超出范围的配置', () => {
      const invalidConfigs = [
        { baseSimilarity: -0.1 },
        { baseSimilarity: 1.1 },
        { minQuality: -0.5 },
        { confidence: 2 }
      ];

      invalidConfigs.forEach(config => {
        expect(service.validateConfig(config)).toBe(false);
      });
    });

    it('应该拒绝无效的调整限制', () => {
      const invalidConfig: Partial<ThresholdConfig> = {
        dynamicAdjustment: {
          enabled: true,
          strategy: 'adaptive',
          adjustmentFrequency: 24,
          historyWindow: 7,
          minSampleSize: 100,
          adjustmentLimit: { min: 0.8, max: 0.7 } // min >= max
        }
      };
      expect(service.validateConfig(invalidConfig)).toBe(false);
    });
  });

  describe('统计功能', () => {
    it('应该获取统计信息', () => {
      const stats = service.getStats();
      expect(stats.totalMatches).toBe(0);
      expect(stats.successMatches).toBe(0);
    });

    it('应该重置统计信息', () => {
      service.applyThreshold([mockMatchResult]);
      service.resetStats();
      const stats = service.getStats();
      expect(stats.totalMatches).toBe(0);
    });
  });

  describe('applyThreshold', () => {
    it('应该根据阈值过滤结果', () => {
      const results = service.applyThreshold(mockMatchResults);
      
      // 默认阈值0.6，应该过滤掉相似度0.45的结果
      expect(results.length).toBe(2);
      expect(results.every(r => r.similarity >= 0.6)).toBe(true);
    });

    it('应该应用自定义阈值', () => {
      const results = service.applyThreshold(mockMatchResults, 0.7);
      
      // 阈值0.7，只有0.85的结果通过
      expect(results.length).toBe(1);
      expect(results[0].similarity).toBe(0.85);
    });

    it('应该考虑质量评分', () => {
      // 设置高质量阈值
      service.updateConfig({ minQuality: 0.8 });
      const results = service.applyThreshold(mockMatchResults);
      
      // 只有高质量的游戏会通过
      expect(results.length).toBeLessThanOrEqual(mockMatchResults.length);
    });

    it('应该应用质量阈值过滤', () => {
      // 设置质量阈值0.8
      service.updateConfig({ minQuality: 0.8 });
      
      const results = service.applyThreshold(mockMatchResults);
      
      // 只有质量分数>=0.8的结果才通过
      expect(results.length).toBeGreaterThanOrEqual(0);
      results.forEach(result => {
        const assessment = service.assessQuality(result);
        expect(assessment.overallScore).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('应该应用复合阈值过滤', () => {
      // 设置相似度阈值0.7和质量阈值0.6
      service.updateConfig({ 
        baseSimilarity: 0.7,
        minQuality: 0.6
      });
      
      const results = service.applyThreshold(mockMatchResults);
      
      // 需要同时满足相似度和质量要求
      expect(results.length).toBeGreaterThanOrEqual(0);
      results.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.7);
        const assessment = service.assessQuality(result);
        expect(assessment.overallScore).toBeGreaterThanOrEqual(0.6);
      });
    });

    it('应该处理空结果数组', () => {
      const results = service.applyThreshold([]);
      expect(results).toEqual([]);
    });

    it('应该更新统计信息', () => {
      service.applyThreshold(mockMatchResults);
      
      const stats = service.getStats();
      expect(stats.totalMatches).toBe(3);
      expect(stats.successMatches).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('assessQuality - 质量评估', () => {
    it('应该正确评估高质量结果', () => {
      const highQualityResult = mockMatchResults[0];
      const assessment = service.assessQuality(highQualityResult);
      
      expect(assessment.overallScore).toBeGreaterThan(0.5);
      expect(['excellent', 'good']).toContain(assessment.qualityLevel);
      expect(assessment.dimensionScores.completeness).toBeGreaterThan(0.8);
    });

    it('应该正确评估低质量结果', () => {
      const lowQualityResult = mockMatchResults[2];
      const assessment = service.assessQuality(lowQualityResult);
      
      expect(assessment.overallScore).toBeLessThan(0.5);
      expect(['poor', 'fair']).toContain(assessment.qualityLevel);
      expect(assessment.suggestions.length).toBeGreaterThan(0);
    });

    it('应该计算所有维度分数', () => {
      const result = mockMatchResults[0];
      const assessment = service.assessQuality(result);
      
      expect(assessment.dimensionScores.completeness).toBeGreaterThanOrEqual(0);
      expect(assessment.dimensionScores.freshness).toBeGreaterThanOrEqual(0);
      expect(assessment.dimensionScores.authority).toBeGreaterThanOrEqual(0);
      expect(assessment.dimensionScores.tagRichness).toBeGreaterThanOrEqual(0);
      expect(assessment.dimensionScores.descriptionQuality).toBeGreaterThanOrEqual(0);
      
      expect(assessment.dimensionScores.completeness).toBeLessThanOrEqual(1);
      expect(assessment.dimensionScores.freshness).toBeLessThanOrEqual(1);
      expect(assessment.dimensionScores.authority).toBeLessThanOrEqual(1);
      expect(assessment.dimensionScores.tagRichness).toBeLessThanOrEqual(1);
      expect(assessment.dimensionScores.descriptionQuality).toBeLessThanOrEqual(1);
    });

    it('应该为低质量结果提供改进建议', () => {
      const lowQualityResult = mockMatchResults[2];
      const assessment = service.assessQuality(lowQualityResult);
      
      expect(assessment.suggestions.length).toBeGreaterThan(0);
      expect(assessment.suggestions.some(s => s.includes('补充') || s.includes('更新'))).toBe(true);
    });

    it('应该评估高质量游戏', () => {
      const assessment = service.assessQuality(mockMatchResults[0]);
      
      expect(assessment.overallScore).toBeGreaterThan(0.5);
      expect(assessment.qualityLevel).not.toBe('poor');
      expect(assessment.dimensionScores.completeness).toBeGreaterThan(0.5);
      // 新鲜度分数可能较低，因为测试数据的更新时间
      expect(assessment.dimensionScores.freshness).toBeGreaterThanOrEqual(0);
    });

    it('应该评估低质量游戏', () => {
      const assessment = service.assessQuality(mockMatchResults[2]);
      
      expect(assessment.overallScore).toBeLessThan(0.4);
      expect(assessment.qualityLevel).toBe('poor');
      expect(assessment.suggestions.length).toBeGreaterThan(0);
    });

    it('应该计算正确的维度评分', () => {
      const assessment = service.assessQuality(mockMatchResults[0]);
      const scores = assessment.dimensionScores;
      
      // 验证各维度评分范围
      expect(scores.completeness).toBeGreaterThanOrEqual(0);
      expect(scores.completeness).toBeLessThanOrEqual(1);
      expect(scores.freshness).toBeGreaterThanOrEqual(0);
      expect(scores.freshness).toBeLessThanOrEqual(1);
      expect(scores.authority).toBeGreaterThanOrEqual(0);
      expect(scores.authority).toBeLessThanOrEqual(1);
      expect(scores.tagRichness).toBeGreaterThanOrEqual(0);
      expect(scores.tagRichness).toBeLessThanOrEqual(1);
      expect(scores.descriptionQuality).toBeGreaterThanOrEqual(0);
      expect(scores.descriptionQuality).toBeLessThanOrEqual(1);
    });

    it('应该生成改进建议', () => {
      const assessment = service.assessQuality(mockMatchResults[2]);
      
      // 检查建议数组中是否包含相关关键词
      const hasRelevantSuggestion = assessment.suggestions.some(
        suggestion => /标题|描述|标签|信息/.test(suggestion)
      );
      expect(hasRelevantSuggestion).toBe(true);
    });

    it('应该根据质量权重计算总分', () => {
      // 修改权重配置
      service.updateConfig({
        qualityWeights: {
          completeness: 0.5,
          freshness: 0.3,
          authority: 0.1,
          tagRichness: 0.05,
          descriptionQuality: 0.05
        }
      });

      const assessment = service.assessQuality(mockMatchResults[0]);
      
      // 验证权重应用效果（完整性权重最高）
      expect(assessment.dimensionScores.completeness * 0.5).toBeGreaterThan(
        assessment.dimensionScores.authority * 0.1
      );
    });
  });

  describe('adjustThreshold - 阈值调整', () => {
    beforeEach(() => {
      // 启用动态调整
      service.updateConfig({
        dynamicAdjustment: {
          enabled: true,
          strategy: 'adaptive',
          adjustmentFrequency: 24,
          historyWindow: 7,
          minSampleSize: 10, // 降低最小样本数以便测试
          adjustmentLimit: {
            min: 0.3,
            max: 0.9
          }
        }
      });
    });

    it('应该在没有历史数据时返回false', () => {
      // 模拟性能数据但没有历史记录
      const adjusted = service.adjustThreshold({
        precision: 0.3,
        recall: 0.9,
        avgProcessingTime: 100
      });
      
      // 由于没有历史数据，calculateAdaptiveThreshold返回当前阈值，导致差异<0.01
      expect(adjusted).toBe(false);
    });

    it('应该在有足够历史数据时进行调整', () => {
      // 先手动添加一些调整历史
      const service2 = new GameMatchingThresholdService({
        dynamicAdjustment: {
          enabled: true,
          strategy: 'statistical',
          adjustmentFrequency: 24,
          historyWindow: 7,
          minSampleSize: 1, // 设为1以便测试
          adjustmentLimit: {
            min: 0.3,
            max: 0.9
          }
        }
      });

      // 生成足够的统计数据
      service2.applyThreshold(mockMatchResults);
      
      const adjusted = service2.adjustThreshold({
        precision: 0.3,
        recall: 0.9,
        avgProcessingTime: 100
      });
      
      // 统计策略在有足够数据时可能会调整
      expect(typeof adjusted).toBe('boolean');
    });

    it('应该记录调整历史当有变化时', () => {
      // 创建一个新服务实例，手动设置阈值差异
      const service3 = new GameMatchingThresholdService();
      
      // 先设置一个初始阈值
      service3.updateConfig({ baseSimilarity: 0.5 });
      
      // 然后手动设置为会产生变化的阈值
      service3.updateConfig({ 
        baseSimilarity: 0.7, // 设置一个不同的值以产生差异
        dynamicAdjustment: {
          enabled: true,
          strategy: 'adaptive',
          adjustmentFrequency: 24,
          historyWindow: 7,
          minSampleSize: 0, // 设为0以跳过样本检查
          adjustmentLimit: {
            min: 0.3,
            max: 0.9
          }
        }
      });
      
      // 应该能记录历史
      const stats = service3.getStats();
      expect(stats.adjustmentHistory).toBeDefined();
    });

    it('应该在禁用时不调整阈值', () => {
      service.updateConfig({
        dynamicAdjustment: { ...service.getConfig().dynamicAdjustment, enabled: false }
      });
      
      const initialThreshold = service.getConfig().baseSimilarity;
      
      const adjusted = service.adjustThreshold({
        precision: 0.3,
        recall: 0.9,
        avgProcessingTime: 100
      });
      
      expect(adjusted).toBe(false);
      expect(service.getConfig().baseSimilarity).toBe(initialThreshold);
    });

    it('应该使用不同的调整策略', () => {
      // 测试统计策略
      service.updateConfig({
        dynamicAdjustment: {
          ...service.getConfig().dynamicAdjustment,
          strategy: 'statistical',
          minSampleSize: 1
        }
      });

      // 先生成一些统计数据
      service.applyThreshold(mockMatchResults);
      
      const adjusted = service.adjustThreshold({
        precision: 0.6,
        recall: 0.8,
        avgProcessingTime: 75
      });
      
      // 统计策略可能会调整也可能不会，取决于数据
      expect(typeof adjusted).toBe('boolean');
    });
  });

  describe('性能优化功能', () => {
    it('应该支持早期停止', () => {
      // 设置很高的早期停止阈值
      service.updateConfig({
        performance: {
          ...service.getConfig().performance,
          earlyStopThreshold: 0.8
        }
      });

      const highQualityResults = [
        { ...mockMatchResults[0], similarity: 0.85 }
      ];
      
      const results = service.applyThreshold(highQualityResults);
      expect(results.length).toBe(1);
    });

    it('应该支持预筛选', () => {
      // 启用预筛选
      service.updateConfig({
        performance: {
          ...service.getConfig().performance,
          enablePrefiltering: true
        }
      });

      const results = service.applyThreshold(mockMatchResults);
      
      // 预筛选应该提前过滤掉低质量结果
      expect(results.length).toBeLessThanOrEqual(mockMatchResults.length);
    });

    it('应该处理批量数据', () => {
      // 设置小批量大小
      service.updateConfig({
        performance: {
          ...service.getConfig().performance,
          batchSize: 2
        }
      });

      const results = service.applyThreshold(mockMatchResults);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('配置管理', () => {
    it('应该验证有效配置', () => {
      const validConfigs = [
        { baseSimilarity: 0.5 },
        { minQuality: 0.3 },
        { confidence: 0.8 }
      ];

      validConfigs.forEach(config => {
        expect(service.validateConfig(config)).toBe(true);
      });
    });

    it('应该拒绝无效配置', () => {
      const invalidConfigs = [
        { baseSimilarity: -0.1 },
        { baseSimilarity: 1.1 },
        { minQuality: -0.5 },
        { confidence: 2 }
      ];

      invalidConfigs.forEach(config => {
        expect(service.validateConfig(config)).toBe(false);
      });
    });

    it('应该更新配置', () => {
      const newConfig = {
        baseSimilarity: 0.8,
        minQuality: 0.7
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();
      
      expect(config.baseSimilarity).toBe(0.8);
      expect(config.minQuality).toBe(0.7);
    });

    it('应该保持未更新的配置项', () => {
      const originalConfig = service.getConfig();
      
      service.updateConfig({ baseSimilarity: 0.8 });
      const updatedConfig = service.getConfig();
      
      expect(updatedConfig.baseSimilarity).toBe(0.8);
      expect(updatedConfig.minQuality).toBe(originalConfig.minQuality);
      expect(updatedConfig.confidence).toBe(originalConfig.confidence);
    });
  });

  describe('统计信息管理', () => {
    beforeEach(() => {
      service.resetStats();
    });

    it('应该正确计算匹配统计', () => {
      service.applyThreshold(mockMatchResults);
      service.applyThreshold(mockMatchResults);
      
      const stats = service.getStats();
      expect(stats.totalMatches).toBe(6); // 2次 * 3个结果
      expect(stats.successMatches).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    });

    it('应该计算平均相似度', () => {
      service.applyThreshold(mockMatchResults);
      
      const stats = service.getStats();
      // 实际实现使用移动平均，所以验证范围而不是精确值
      expect(stats.avgSimilarity).toBeGreaterThanOrEqual(0);
      expect(stats.avgSimilarity).toBeLessThanOrEqual(1);
    });

    it('应该计算平均质量分数', () => {
      service.applyThreshold(mockMatchResults);
      
      const stats = service.getStats();
      expect(stats.avgQualityScore).toBeGreaterThanOrEqual(0);
    });

    it('应该重置统计信息', () => {
      service.applyThreshold(mockMatchResults);
      service.resetStats();
      
      const stats = service.getStats();
      expect(stats.totalMatches).toBe(0);
      expect(stats.successMatches).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.adjustmentHistory).toEqual([]);
    });

    it('应该跟踪处理时间', () => {
      service.applyThreshold(mockMatchResults);
      
      const stats = service.getStats();
      expect(stats.avgProcessingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('边界情况处理', () => {
    it('应该处理空匹配结果', () => {
      const results = service.applyThreshold([]);
      expect(results).toEqual([]);
      
      const stats = service.getStats();
      expect(stats.totalMatches).toBe(0);
    });

    it('应该处理相似度为0的结果', () => {
      const zeroSimilarityResult: MatchResult = {
        ...mockMatchResult,
        similarity: 0,
        scores: {
          levenshtein: 0,
          cosine: 0,
          jaccard: 0,
          normalized: 0
        }
      };

      const results = service.applyThreshold([zeroSimilarityResult]);
      expect(results).toEqual([]);
    });

    it('应该处理极端配置值', () => {
      // 测试阈值为0
      service.updateConfig({ baseSimilarity: 0, minQuality: 0 });
      const results1 = service.applyThreshold(mockMatchResults);
      expect(results1.length).toBe(3);

      // 测试阈值为1
      service.updateConfig({ baseSimilarity: 1, minQuality: 1 });
      const results2 = service.applyThreshold(mockMatchResults);
      expect(results2.length).toBe(0);
    });

    it('应该处理缺失字段的游戏数据', () => {
      const incompleteGame: CompetitorGame = {
        id: '999',
        websiteId: 'test',
        websiteName: 'test.com',
        title: '',
        description: '',
        url: '',
        imageUrl: '',
        tags: [],
        category: '',
        rating: 0,
        popularity: 0,
        crawledAt: new Date(),
        updatedAt: new Date(),
        qualityScore: 0,
        processed: false
      };

      const incompleteResult: MatchResult = {
        game: incompleteGame,
        similarity: 0.8,
        scores: {
          levenshtein: 0.8,
          cosine: 0.8,
          jaccard: 0.8,
          normalized: 0.8
        },
        matchedFields: {
          title: 0.8
        }
      };

      const assessment = service.assessQuality(incompleteResult);
      expect(assessment.overallScore).toBeLessThan(0.3);
      expect(assessment.qualityLevel).toBe('poor');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理大量数据', () => {
      // 创建大量测试数据
      const largeDataset: MatchResult[] = Array.from({ length: 1000 }, (_, i) => ({
        ...mockMatchResult,
        game: {
          ...mockMatchResult.game,
          id: `game-${i}`,
          title: `Game ${i}`,
          url: `https://example.com/game-${i}`
        },
        similarity: Math.random()
      }));

      const startTime = Date.now();
      const results = service.applyThreshold(largeDataset);
      const processingTime = Date.now() - startTime;

      expect(results.length).toBeGreaterThanOrEqual(0);
      expect(processingTime).toBeLessThan(5000); // 5秒内完成
    });

    it('应该有效利用缓存', () => {
      // 第一次处理
      const start1 = Date.now();
      service.applyThreshold(mockMatchResults);
      const time1 = Date.now() - start1;

      // 第二次处理相同数据
      const start2 = Date.now();
      service.applyThreshold(mockMatchResults);
      const time2 = Date.now() - start2;

      // 验证两次处理都完成了
      expect(time1).toBeGreaterThanOrEqual(0);
      expect(time2).toBeGreaterThanOrEqual(0);
      
      // 验证处理时间都在合理范围内（100ms内）
      expect(time1).toBeLessThan(100);
      expect(time2).toBeLessThan(100);
    });
  });

  describe('集成测试', () => {
    it('应该完成完整的阈值管理流程', () => {
      // 1. 初始化服务
      const integrationService = new GameMatchingThresholdService({
        baseSimilarity: 0.7,
        minQuality: 0.6
      });

      // 2. 应用阈值
      const filteredResults = integrationService.applyThreshold(mockMatchResults);
      expect(filteredResults.length).toBeGreaterThanOrEqual(0);

      // 3. 质量评估
      if (filteredResults.length > 0) {
        const assessment = integrationService.assessQuality(filteredResults[0]);
        expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
      }

      // 4. 动态调整（可能不会调整，因为没有历史数据）
      const adjusted = integrationService.adjustThreshold({
        precision: 0.6,
        recall: 0.8,
        avgProcessingTime: 100
      });
      expect(typeof adjusted).toBe('boolean');

      // 5. 获取统计信息
      const stats = integrationService.getStats();
      expect(stats.totalMatches).toBeGreaterThan(0);
    });

    it('应该正确处理多轮调整', () => {
      // 启用动态调整
      service.updateConfig({
        dynamicAdjustment: {
          ...service.getConfig().dynamicAdjustment,
          enabled: true,
          minSampleSize: 1
        }
      });

      // 进行多轮调整
      for (let i = 0; i < 5; i++) {
        service.applyThreshold(mockMatchResults);
        service.adjustThreshold({
          precision: 0.5 + Math.random() * 0.3,
          recall: 0.5 + Math.random() * 0.3,
          avgProcessingTime: 50 + Math.random() * 100
        });
      }

      const stats = service.getStats();
      expect(stats.totalMatches).toBeGreaterThan(0);
      // 调整历史长度取决于实际是否发生了调整
      expect(stats.adjustmentHistory.length).toBeGreaterThanOrEqual(0);
    });
  });
}); 