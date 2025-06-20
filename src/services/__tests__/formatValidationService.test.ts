/**
 * 格式验证服务单元测试
 * 
 * 测试功能：
 * - 格式验证功能
 * - 格式修复功能
 * - 一致性检查功能
 * - 缓存机制
 * 
 * @author AI Assistant
 * @date 2025-01-29
 */

import { FormatValidationService } from '../formatValidationService';

// Mock DeepSeek API
jest.mock('../deepseekApi', () => ({
  DeepSeekApiService: jest.fn().mockImplementation(() => ({
    chat: jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: '```json\n{"name": "Test Game", "description": "Fixed content"}\n```'
        }
      }]
    })
  }))
}));

describe('FormatValidationService', () => {
  let service: FormatValidationService;

  beforeEach(() => {
    service = new FormatValidationService();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('validateFormat', () => {
    it('应该验证有效的JSON数据', async () => {
      const data = {
        name: 'Test Game',
        description: 'A test game'
      };
      
      const expectedFormat = {
        name: 'type:string',
        description: 'type:string'
      };

      const result = await service.validateFormat(data, expectedFormat);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    it('应该检测缺失的必填字段', async () => {
      const data = {
        name: 'Test Game'
        // 缺少 description 字段
      };
      
      const expectedFormat = {
        name: 'type:string required',
        description: 'type:string required'
      };

      const result = await service.validateFormat(data, expectedFormat);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('required');
      expect(result.errors[0].field).toBe('description');
      expect(result.score).toBeLessThan(100);
    });

    it('应该检测类型错误', async () => {
      const data = {
        name: 'Test Game',
        rating: 'high' // 应该是 number
      };
      
      const expectedFormat = {
        name: 'type:string',
        rating: 'type:number'
      };

      const result = await service.validateFormat(data, expectedFormat);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('type');
      expect(result.errors[0].field).toBe('$.rating');
      expect(result.errors[0].expected).toBe('number');
    });

    it('应该检测JSON语法错误', async () => {
      const invalidJson = '{"name": "Test", "invalid": }';
      
      const expectedFormat = {
        name: 'type:string'
      };

      const result = await service.validateFormat(invalidJson, expectedFormat);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax');
    });

    it('应该使用缓存提高性能', async () => {
      const data = { name: 'Test Game' };
      const expectedFormat = { name: 'type:string' };

      // 第一次调用
      const result1 = await service.validateFormat(data, expectedFormat);
      
      // 第二次调用应该使用缓存
      const result2 = await service.validateFormat(data, expectedFormat);

      expect(result1).toEqual(result2);
      
      const stats = service.getValidationStats();
      expect(stats.cacheSize).toBe(1);
    });
  });

  describe('repairFormat', () => {
    it('应该使用引导模式修复格式错误', async () => {
      const data = {
        name: 'Test Game'
        // 缺少 description 字段
      };
      
      const expectedFormat = {
        name: 'type:string required',
        description: 'type:string required'
      };

      const options = {
        mode: 'guided' as const,
        aggressiveness: 'moderate' as const,
        preserveContent: true,
        maxRetries: 3,
        fallbackToOriginal: true
      };

      const result = await service.repairFormat(data, expectedFormat, options);

      expect(result.success).toBe(true);
      expect(result.repairedData).toHaveProperty('name');
      expect(result.repairedData).toHaveProperty('description');
      expect(result.repairAttempts).toBeGreaterThan(0);
      expect(result.repairTime).toBeGreaterThan(0);
    });

    it('应该在手动模式下返回错误信息而不修复', async () => {
      const data = {
        name: 'Test Game'
      };
      
      const expectedFormat = {
        name: 'type:string required',
        description: 'type:string required'
      };

      const options = {
        mode: 'manual' as const,
        aggressiveness: 'moderate' as const,
        preserveContent: true,
        maxRetries: 3,
        fallbackToOriginal: true
      };

      const result = await service.repairFormat(data, expectedFormat, options);

      expect(result.success).toBe(false);
      expect(result.remainingErrors).toHaveLength(1);
      expect(result.appliedFixes).toHaveLength(0);
    });

    it('应该在达到最大重试次数后停止', async () => {
      const data = {
        invalidData: 'test'
      };
      
      const expectedFormat = {
        name: 'type:string required',
        description: 'type:string required'
      };

      const options = {
        mode: 'guided' as const,
        aggressiveness: 'moderate' as const,
        preserveContent: true,
        maxRetries: 1,
        fallbackToOriginal: true
      };

      const result = await service.repairFormat(data, expectedFormat, options);

      expect(result.repairAttempts).toBeLessThanOrEqual(1);
      expect(result.repairTime).toBeGreaterThan(0);
    });

    it('应该在配置回退时返回原始数据', async () => {
      const originalData = { name: 'Original' };
      
      const expectedFormat = {
        name: 'type:string required',
        description: 'type:string required'
      };

      const options = {
        mode: 'manual' as const,
        aggressiveness: 'moderate' as const,
        preserveContent: true,
        maxRetries: 1,
        fallbackToOriginal: true
      };

      const result = await service.repairFormat(originalData, expectedFormat, options);

      expect(result.originalData).toEqual(originalData);
      expect(result.repairedData).toEqual(originalData);
    });
  });

  describe('一致性检查', () => {
    it('应该通过基本一致性检查', async () => {
      const data = {
        games: [
          { name: 'Game 1', type: 'action' },
          { name: 'Game 2', type: 'puzzle' }
        ]
      };
      
      const expectedFormat = {
        games: ['type:array']
      };

      const result = await service.validateFormat(data, expectedFormat);

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.type === 'consistency')).toHaveLength(0);
    });
  });

  describe('缓存管理', () => {
    it('应该正确清理缓存', () => {
      const data = { name: 'Test' };
      const expectedFormat = { name: 'type:string' };

      // 添加一些缓存数据
      service.validateFormat(data, expectedFormat);
      
      let stats = service.getValidationStats();
      expect(stats.cacheSize).toBeGreaterThan(0);

      // 清理缓存
      service.clearCache();
      
      stats = service.getValidationStats();
      expect(stats.cacheSize).toBe(0);
    });

    it('应该提供准确的统计信息', () => {
      const stats = service.getValidationStats();

      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('repairAttempts');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
      expect(typeof stats.repairAttempts).toBe('number');
    });
  });

  describe('错误处理', () => {
    it('应该处理验证过程中的异常', async () => {
      // 模拟抛出异常的数据
      const circularData: any = {};
      circularData.self = circularData; // 创建循环引用
      
      const expectedFormat = { name: 'type:string' };

      const result = await service.validateFormat(circularData, expectedFormat);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax');
      expect(result.score).toBe(0);
    });

    it('应该处理修复过程中的异常', async () => {
      const data = { name: 'Test' };
      const expectedFormat = { name: 'type:string required' };

      // 模拟修复过程中的错误
      const options = {
        mode: 'guided' as const,
        aggressiveness: 'moderate' as const,
        preserveContent: true,
        maxRetries: 1,
        fallbackToOriginal: true
      };

      const result = await service.repairFormat(data, expectedFormat, options);

      // 即使出现错误，也应该返回有效的结果对象
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('repairedData');
      expect(result).toHaveProperty('originalData');
      expect(result).toHaveProperty('appliedFixes');
      expect(result).toHaveProperty('remainingErrors');
      expect(result).toHaveProperty('repairAttempts');
      expect(result).toHaveProperty('repairTime');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成验证', async () => {
      const largeData = {
        games: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Game ${i}`,
          description: `Description for game ${i}`,
          rating: Math.random() * 5
        }))
      };
      
      const expectedFormat = {
        games: [{
          id: 'type:number required',
          name: 'type:string required',
          description: 'type:string required',
          rating: 'type:number required'
        }]
      };

      const startTime = Date.now();
      const result = await service.validateFormat(largeData, expectedFormat);
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(1000); // 应该在1秒内完成
      expect(result.isValid).toBe(true);
    });

    it('应该有效利用缓存', async () => {
      const data = { name: 'Test Game' };
      const expectedFormat = { name: 'type:string' };

      // 第一次调用 - 应该比较慢
      const startTime1 = Date.now();
      await service.validateFormat(data, expectedFormat);
      const time1 = Date.now() - startTime1;

      // 第二次调用 - 应该更快（使用缓存）
      const startTime2 = Date.now();
      await service.validateFormat(data, expectedFormat);
      const time2 = Date.now() - startTime2;

      // 缓存的调用应该显著更快
      expect(time2).toBeLessThan(time1);
    });
  });
}); 