/**
 * 多级缓存服务测试
 */

import { MultiLevelCacheService, CacheConfig } from '../multiLevelCacheService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

// Mock全局对象
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock Blob
global.Blob = jest.fn().mockImplementation((chunks: any[]) => ({
  size: chunks.join('').length
})) as any;

describe('MultiLevelCacheService', () => {
  let cacheService: MultiLevelCacheService;
  const testConfig: Partial<CacheConfig> = {
    memoryMaxItems: 5,
    memoryMaxSize: 1, // 1MB
    localStorageMaxItems: 10,
    defaultTtl: 1, // 1秒
    evictionPolicy: 'LRU',
    cleanupInterval: 100 // 100ms
  };

  beforeEach(() => {
    // 清除localStorage mock
    localStorageMock.clear();
    jest.clearAllMocks();
    
    // 创建新的缓存服务实例
    cacheService = new MultiLevelCacheService(testConfig);
  });

  afterEach(() => {
    cacheService.destroy();
  });

  describe('基础缓存操作', () => {
    test('应该能够设置和获取缓存', async () => {
      const testData = { message: 'test data' };
      await cacheService.set('test-key', testData);
      
      const result = await cacheService.get('test-key');
      expect(result).toEqual(testData);
    });

    test('应该能够删除缓存', async () => {
      const testData = { message: 'test data' };
      await cacheService.set('test-key', testData);
      
      await cacheService.delete('test-key');
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    test('应该能够检查缓存是否存在', async () => {
      const testData = { message: 'test data' };
      await cacheService.set('test-key', testData);
      
      const exists = await cacheService.has('test-key');
      expect(exists).toBe(true);
      
      const notExists = await cacheService.has('non-existent-key');
      expect(notExists).toBe(false);
    });

    test('应该能够清空所有缓存', async () => {
      await cacheService.set('key1', 'data1');
      await cacheService.set('key2', 'data2');
      
      await cacheService.clear();
      
      const result1 = await cacheService.get('key1');
      const result2 = await cacheService.get('key2');
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('TTL和过期机制', () => {
    test('应该能够处理缓存过期', async () => {
      const testData = { message: 'test data' };
      await cacheService.set('test-key', testData, 0.1); // 0.1秒TTL
      
      // 立即获取应该成功
      let result = await cacheService.get('test-key');
      expect(result).toEqual(testData);
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 过期后应该返回null
      result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    test('应该能够使用自定义TTL', async () => {
      const testData = { message: 'test data' };
      await cacheService.set('test-key', testData, 3600); // 1小时
      
      const result = await cacheService.get('test-key');
      expect(result).toEqual(testData);
    });

    test('应该能够手动清理过期缓存', async () => {
      await cacheService.set('key1', 'data1', 0.1); // 0.1秒TTL
      await cacheService.set('key2', 'data2', 3600); // 1小时TTL
      
      // 等待key1过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 执行清理
      await cacheService.cleanup();
      
      // key1应该被清理，key2应该保留
      const result1 = await cacheService.get('key1');
      const result2 = await cacheService.get('key2');
      expect(result1).toBeNull();
      expect(result2).toBe('data2');
    });
  });

  describe('多级缓存策略', () => {
    test('应该优先从内存缓存获取数据', async () => {
      const testData = { message: 'test data' };
      await cacheService.set('test-key', testData);
      
      // 清除localStorage，模拟内存缓存优先级
      const spy = jest.spyOn(localStorageMock, 'getItem');
      
      const result = await cacheService.get('test-key');
      expect(result).toEqual(testData);
      
      // 不应该访问localStorage
      expect(spy).not.toHaveBeenCalled();
    });

    test('应该从本地存储缓存获取数据', async () => {
      const testData = { message: 'test data' };
      
      // 强制存储到本地存储
      await cacheService.set('test-key', testData, undefined, true);
      
      // 创建新的缓存服务实例（内存缓存为空）
      const newCacheService = new MultiLevelCacheService(testConfig);
      
      const result = await newCacheService.get('test-key');
      expect(result).toEqual(testData);
      
      newCacheService.destroy();
    });

    test('应该将热数据提升到内存缓存', async () => {
      const testData = { message: 'test data' };
      
      // 强制存储到本地存储
      await cacheService.set('test-key', testData, undefined, true);
      
      // 创建新的缓存服务实例
      const newCacheService = new MultiLevelCacheService(testConfig);
      
      // 多次访问以触发提升
      await newCacheService.get('test-key');
      await newCacheService.get('test-key');
      await newCacheService.get('test-key');
      
      // 验证数据已提升到内存缓存
      const stats = newCacheService.getStats();
      expect(stats.memory.items).toBeGreaterThan(0);
      
      newCacheService.destroy();
    });
  });

  describe('缓存容量管理', () => {
    test('应该在达到最大条目数时清理内存缓存', async () => {
      // 添加超过限制的缓存项
      for (let i = 0; i < 7; i++) {
        await cacheService.set(`key${i}`, `data${i}`);
        // 小延迟确保时间戳不同
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const stats = cacheService.getStats();
      expect(stats.memory.items).toBeLessThanOrEqual(testConfig.memoryMaxItems!);
    });

    test('应该根据不同的清理策略清理缓存', async () => {
      // 测试LRU策略
      const lruService = new MultiLevelCacheService({
        ...testConfig,
        evictionPolicy: 'LRU'
      });
      
      // 添加缓存项
      await lruService.set('key1', 'data1');
      await new Promise(resolve => setTimeout(resolve, 10));
      await lruService.set('key2', 'data2');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // 访问key1使其成为最近使用
      await lruService.get('key1');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // 添加更多项以触发清理
      for (let i = 3; i <= 7; i++) {
        await lruService.set(`key${i}`, `data${i}`);
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      // key1应该被保留（最近使用），key2可能被清理
      const result1 = await lruService.get('key1');
      expect(result1).toBe('data1');
      
      lruService.destroy();
    });

    test('应该在达到内存大小限制时清理缓存', async () => {
      // 创建大数据项
      const largeData = 'x'.repeat(500000); // 500KB
      
      // 添加多个大数据项
      await cacheService.set('large1', largeData);
      await cacheService.set('large2', largeData);
      await cacheService.set('large3', largeData);
      
      const stats = cacheService.getStats();
      expect(stats.memory.size).toBeLessThanOrEqual(stats.memory.maxSize);
    });
  });

  describe('本地存储缓存管理', () => {
    test('应该在达到本地存储限制时清理', async () => {
      // 添加超过本地存储限制的项
      for (let i = 0; i < 12; i++) {
        await cacheService.set(`ls-key${i}`, `data${i}`, undefined, true);
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const stats = cacheService.getStats();
      expect(stats.localStorage.items).toBeLessThanOrEqual(testConfig.localStorageMaxItems!);
    });

    test('应该处理损坏的本地存储数据', async () => {
      // 设置无效的JSON数据
      localStorageMock.setItem('cache_invalid', 'invalid json');
      
      // 获取应该不会抛出错误
      const result = await cacheService.get('invalid');
      expect(result).toBeNull();
      
      // 损坏的数据应该被删除
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cache_invalid');
    });
  });

  describe('统计功能', () => {
    test('应该正确跟踪缓存命中和丢失', async () => {
      const testData = { message: 'test data' };
      
      // 缓存丢失
      await cacheService.get('non-existent');
      
      // 设置缓存
      await cacheService.set('test-key', testData);
      
      // 缓存命中
      await cacheService.get('test-key');
      await cacheService.get('test-key');
      
      const stats = cacheService.getStats();
      expect(stats.total.hits).toBe(2);
      expect(stats.total.misses).toBe(1);
      expect(stats.total.hitRate).toBe(2/3);
    });

    test('应该正确计算内存使用统计', async () => {
      const testData = { message: 'test data' };
      await cacheService.set('test-key', testData);
      
      const stats = cacheService.getStats();
      expect(stats.memory.items).toBe(1);
      expect(stats.memory.size).toBeGreaterThan(0);
      expect(stats.memory.maxSize).toBe(testConfig.memoryMaxSize! * 1024 * 1024);
    });

    test('应该正确计算命中率', async () => {
      // 测试零访问的情况
      let stats = cacheService.getStats();
      expect(stats.total.hitRate).toBe(0);
      
      // 添加一些访问
      await cacheService.set('key1', 'data1');
      await cacheService.get('key1'); // 命中
      await cacheService.get('key2'); // 丢失
      
      stats = cacheService.getStats();
      expect(stats.total.hitRate).toBe(0.5);
    });
  });

  describe('大小计算', () => {
    test('应该正确计算数据大小', async () => {
      const smallData = 'small';
      const largeData = 'x'.repeat(1000);
      
      await cacheService.set('small', smallData);
      await cacheService.set('large', largeData);
      
      const stats = cacheService.getStats();
      expect(stats.memory.size).toBeGreaterThan(0);
    });

    test('应该拒绝过大的数据存入内存缓存', async () => {
      // 创建超过1MB的大数据
      const hugeData = 'x'.repeat(2 * 1024 * 1024); // 2MB
      
      await cacheService.set('huge', hugeData);
      
      const stats = cacheService.getStats();
      // 大数据应该不会进入内存缓存
      expect(stats.memory.items).toBe(0);
      
      // 但应该能从本地存储获取
      const result = await cacheService.get('huge');
      expect(result).toBe(hugeData);
    });
  });

  describe('自动清理', () => {
    test('应该自动清理过期缓存', async () => {
      // 创建会自动清理的缓存服务
      const autoCleanService = new MultiLevelCacheService({
        ...testConfig,
        cleanupInterval: 50 // 50ms
      });
      
      await autoCleanService.set('expire-key', 'data', 0.1); // 0.1秒TTL
      
      // 等待过期和自动清理
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const result = await autoCleanService.get('expire-key');
      expect(result).toBeNull();
      
      autoCleanService.destroy();
    }, 300);
  });

  describe('错误处理', () => {
    test('应该处理localStorage不可用的情况', async () => {
      // 模拟localStorage不可用
      const originalLocalStorage = (global as any).localStorage;
      delete (global as any).localStorage;
      
      const noLSService = new MultiLevelCacheService(testConfig);
      
      // 应该不会抛出错误
      await expect(noLSService.set('key', 'data')).resolves.not.toThrow();
      const result = await noLSService.get('key');
      expect(result).toBe('data'); // 应该从内存缓存获取
      
      // 恢复localStorage
      (global as any).localStorage = originalLocalStorage;
      noLSService.destroy();
    });

    test('应该处理localStorage设置失败', async () => {
      // 模拟localStorage.setItem抛出错误
      const setItemSpy = jest.spyOn(localStorageMock, 'setItem')
        .mockImplementation(() => {
          throw new Error('localStorage full');
        });
      
      // 不应该抛出错误
      await expect(cacheService.set('key', 'data')).resolves.not.toThrow();
      
      setItemSpy.mockRestore();
    });
  });

  describe('服务销毁', () => {
    test('应该正确销毁服务', () => {
      const service = new MultiLevelCacheService(testConfig);
      
      // 销毁服务
      service.destroy();
      
      // 内存缓存应该被清空
      const stats = service.getStats();
      expect(stats.memory.items).toBe(0);
    });
  });

  describe('边界条件', () => {
    test('应该处理空键名', async () => {
      await cacheService.set('', 'empty key data');
      const result = await cacheService.get('');
      expect(result).toBe('empty key data');
    });

    test('应该处理null和undefined数据', async () => {
      await cacheService.set('null-key', null);
      await cacheService.set('undefined-key', undefined);
      
      const nullResult = await cacheService.get('null-key');
      const undefinedResult = await cacheService.get('undefined-key');
      
      expect(nullResult).toBeNull();
      expect(undefinedResult).toBeUndefined();
    });

    test('应该处理复杂对象数据', async () => {
      const complexData = {
        array: [1, 2, 3],
        nested: { deep: { value: 'test' } },
        date: new Date().toISOString(),
        boolean: true,
        number: 42
      };
      
      await cacheService.set('complex', complexData);
      const result = await cacheService.get('complex');
      expect(result).toEqual(complexData);
    });

    test('应该处理零TTL', async () => {
      await cacheService.set('zero-ttl', 'data', 0);
      
      // 零TTL应该立即过期
      const result = await cacheService.get('zero-ttl');
      expect(result).toBeNull();
    });
  });
}); 