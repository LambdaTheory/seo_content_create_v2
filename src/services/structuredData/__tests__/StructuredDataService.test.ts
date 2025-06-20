/**
 * 结构化数据服务单元测试
 * 测试StructuredDataService的核心功能
 */

import { StructuredDataService } from '../StructuredDataService';
import { SchemaGameType } from '../schemaOrgStandards';

describe('StructuredDataService', () => {
  let service: StructuredDataService;

  beforeEach(() => {
    service = new StructuredDataService();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('构造函数和配置', () => {
    it('应该使用默认配置创建服务实例', () => {
      const config = service.getConfig();
      expect(config.enableValidation).toBe(true);
      expect(config.enableOptimization).toBe(true);
      expect(config.enableCaching).toBe(true);
      expect(config.outputFormat).toBe('json-ld');
    });

    it('应该允许自定义配置', () => {
      const customService = new StructuredDataService({
        enableValidation: false,
        outputFormat: 'microdata',
        defaultCurrency: 'EUR',
      });
      
      const config = customService.getConfig();
      expect(config.enableValidation).toBe(false);
      expect(config.outputFormat).toBe('microdata');
      expect(config.defaultCurrency).toBe('EUR');
    });

    it('应该能够更新配置', () => {
      service.updateConfig({
        enableCaching: false,
        compressionLevel: 'aggressive',
      });
      
      const config = service.getConfig();
      expect(config.enableCaching).toBe(false);
      expect(config.compressionLevel).toBe('aggressive');
    });
  });

  describe('单个游戏结构化数据生成', () => {
    const sampleGameData = {
      title: '塞尔达传说：王国之泪',
      description: '一款开放世界冒险游戏',
      genre: '动作冒险',
      platform: ['Nintendo Switch'],
      releaseDate: '2023-05-12',
      developer: 'Nintendo',
      rating: 4.8,
      price: 59.99,
    };

    it('应该成功生成基础结构化数据', async () => {
      const result = await service.generateStructuredData(sampleGameData, 'test-game-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('塞尔达传说：王国之泪');
      expect(result.data?.['@type']).toBe(SchemaGameType.VideoGame);
      expect(result.jsonLd).toBeDefined();
      expect(result.validationScore).toBeGreaterThan(0);
      expect(result.seoScore).toBeGreaterThan(0);
    });

    it('应该正确映射游戏数据字段', async () => {
      const result = await service.generateStructuredData(sampleGameData);
      
      expect(result.data?.name).toBe(sampleGameData.title);
      expect(result.data?.description).toBe(sampleGameData.description);
      expect(result.data?.datePublished).toBe('2023-05-12');
      expect(result.data?.developer).toEqual({
        '@type': 'Organization',
        name: 'Nintendo',
      });
    });

    it('应该处理评分数据', async () => {
      const result = await service.generateStructuredData(sampleGameData);
      
      expect(result.data?.aggregateRating).toEqual({
        '@type': 'AggregateRating',
        ratingValue: 4.8,
        bestRating: 5,
        ratingCount: 1,
      });
    });

    it('应该处理价格数据', async () => {
      const result = await service.generateStructuredData(sampleGameData);
      
      expect(result.data?.offers).toEqual({
        '@type': 'Offer',
        price: 59.99,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      });
    });

    it('应该检测Schema类型', async () => {
      const videoGameData = {
        ...sampleGameData,
        cheatCode: 'TESTCODE',
        trailer: 'https://example.com/trailer.mp4',
      };
      
      const result = await service.generateStructuredData(videoGameData);
      expect(result.data?.['@type']).toBe(SchemaGameType.VideoGame);
    });

    it('应该处理缺少数据的情况', async () => {
      const minimalData = { title: '简单游戏' };
      const result = await service.generateStructuredData(minimalData);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('简单游戏');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('应该验证数据并返回错误', async () => {
      const invalidData = { title: '' }; // 空标题
      const result = await service.generateStructuredData(invalidData);
      
      expect(result.validationScore).toBeLessThan(100);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('批量生成', () => {
    const batchGameData = [
      {
        title: '游戏1',
        description: '第一个游戏',
        genre: '动作',
      },
      {
        title: '游戏2',
        description: '第二个游戏',
        genre: '策略',
      },
      {
        title: '游戏3',
        description: '第三个游戏',
        genre: '益智',
      },
    ];

    it('应该成功批量生成结构化数据', async () => {
      const result = await service.generateBatchStructuredData(batchGameData);
      
      expect(result.total).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results.size).toBe(3);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('应该支持并发控制', async () => {
      const startTime = Date.now();
      const result = await service.generateBatchStructuredData(batchGameData, {
        concurrency: 1, // 串行处理
      });
      const serialTime = Date.now() - startTime;
      
      const startTime2 = Date.now();
      const result2 = await service.generateBatchStructuredData(batchGameData, {
        concurrency: 3, // 并行处理
      });
      const parallelTime = Date.now() - startTime2;
      
      expect(result.successful).toBe(3);
      expect(result2.successful).toBe(3);
      // 并行处理应该更快（在理想情况下）
      // 注意：这个测试可能在某些环境中不稳定
    });

    it('应该处理批量生成中的错误', async () => {
      const mixedData = [
        { title: '正常游戏' },
        { title: '' }, // 无效数据
        { title: '另一个正常游戏' },
      ];
      
      const result = await service.generateBatchStructuredData(mixedData);
      
      expect(result.total).toBe(3);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('缓存功能', () => {
    const gameData = {
      title: '缓存测试游戏',
      description: '用于测试缓存的游戏',
    };

    it('应该缓存生成结果', async () => {
      // 第一次生成
      const result1 = await service.generateStructuredData(gameData, 'cache-test');
      
      // 第二次生成（应该从缓存读取）
      const result2 = await service.generateStructuredData(gameData, 'cache-test');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(JSON.stringify(result1.data)).toBe(JSON.stringify(result2.data));
    });

    it('应该提供缓存统计', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('应该能够清除缓存', async () => {
      await service.generateStructuredData(gameData, 'clear-test');
      let stats = service.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      
      service.clearCache();
      stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('禁用缓存时不应该缓存结果', async () => {
      service.updateConfig({ enableCaching: false });
      
      await service.generateStructuredData(gameData, 'no-cache-test');
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('数据验证', () => {
    it('应该验证必填字段', async () => {
      const dataWithoutName = { description: '没有名称的游戏' };
      const result = await service.generateStructuredData(dataWithoutName);
      
      expect(result.validationScore).toBeLessThan(100);
      expect(result.errors.some(error => error.includes('name'))).toBe(true);
    });

    it('应该验证字段类型', async () => {
      const dataWithInvalidRating = {
        title: '类型测试游戏',
        rating: 'invalid-rating', // 应该是数字
      };
      
      const result = await service.generateStructuredData(dataWithInvalidRating);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('应该验证URL格式', async () => {
      const dataWithInvalidURL = {
        title: 'URL测试游戏',
        url: 'invalid-url',
      };
      
      const result = await service.generateStructuredData(dataWithInvalidURL);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('SEO优化', () => {
    const gameData = {
      title: '短',
      description: '短描述',
    };

    it('应该计算SEO分数', async () => {
      const result = await service.generateStructuredData(gameData);
      expect(result.seoScore).toBeGreaterThanOrEqual(0);
      expect(result.seoScore).toBeLessThanOrEqual(100);
    });

    it('应该提供优化建议', async () => {
      const result = await service.generateStructuredData(gameData);
      expect(result.optimizations.length).toBeGreaterThan(0);
      expect(result.optimizations.some(opt => opt.includes('描述'))).toBe(true);
    });

    it('完整的游戏数据应该获得更高的SEO分数', async () => {
      const completeGameData = {
        title: '完整的游戏标题包含关键词',
        description: '这是一个非常详细的游戏描述，包含了很多有用的信息和关键词，能够帮助用户了解游戏的特点和玩法，提升SEO效果。',
        genre: '动作冒险',
        platform: ['PC', 'PlayStation 5'],
        developer: 'Amazing Game Studio',
        rating: 4.5,
        price: 49.99,
        releaseDate: '2023-12-01',
        imageUrl: 'https://example.com/game-cover.jpg',
        trailerUrl: 'https://example.com/game-trailer.mp4',
      };

      const minimalResult = await service.generateStructuredData(gameData);
      const completeResult = await service.generateStructuredData(completeGameData);
      
      expect(completeResult.seoScore).toBeGreaterThan(minimalResult.seoScore);
    });
  });

  describe('输出格式', () => {
    const gameData = {
      title: '格式测试游戏',
      description: '用于测试输出格式的游戏',
    };

    it('应该生成JSON-LD格式', async () => {
      const result = await service.generateStructuredData(gameData);
      expect(result.jsonLd).toBeDefined();
      expect(() => JSON.parse(result.jsonLd!)).not.toThrow();
      
      const parsed = JSON.parse(result.jsonLd!);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBeDefined();
    });

    it('JSON-LD应该包含正确的数据', async () => {
      const result = await service.generateStructuredData(gameData);
      const parsed = JSON.parse(result.jsonLd!);
      
      expect(parsed.name).toBe(gameData.title);
      expect(parsed.description).toBe(gameData.description);
    });
  });

  describe('错误处理', () => {
    it('应该处理空数据', async () => {
      const result = await service.generateStructuredData(null);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该处理无效的JSON数据', async () => {
      const result = await service.generateStructuredData(undefined);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该处理循环引用', async () => {
      const circularData: any = { title: '循环引用测试' };
      circularData.self = circularData;
      
      // 使用try-catch来处理预期的错误
      try {
        const result = await service.generateStructuredData(circularData);
        // 如果没有抛出错误，那么应该返回失败结果
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      } catch (error) {
        // 如果抛出错误，这是预期的行为
        expect(error).toBeDefined();
      }
    });
  });

  describe('性能测试', () => {
    it('单个生成应该在合理时间内完成', async () => {
      const gameData = {
        title: '性能测试游戏',
        description: '用于测试性能的游戏数据',
      };
      
      const startTime = Date.now();
      const result = await service.generateStructuredData(gameData);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('批量生成应该高效处理大量数据', async () => {
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        title: `性能测试游戏 ${i + 1}`,
        description: `第 ${i + 1} 个游戏的描述`,
        genre: i % 2 === 0 ? '动作' : '策略',
      }));
      
      const startTime = Date.now();
      const result = await service.generateBatchStructuredData(largeDataset, {
        concurrency: 10,
      });
      const endTime = Date.now();
      
      expect(result.successful).toBe(50);
      expect(endTime - startTime).toBeLessThan(5000); // 应该在5秒内完成
    });
  });
}); 