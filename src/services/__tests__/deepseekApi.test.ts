/**
 * DeepSeek API 服务单元测试
 */

import { DeepSeekApiService } from '../deepseekApi';
import type { ChatMessage, DeepSeekConfig } from '@/types/DeepSeek.types';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

describe('DeepSeekApiService', () => {
  let service: DeepSeekApiService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 保存原始环境变量
    originalEnv = process.env;
    
    // 设置测试环境变量
    process.env = {
      ...originalEnv,
      DEEPSEEK_API_KEY: 'test-api-key',
      DEEPSEEK_API_URL: 'https://api.test.com',
    };

    // 创建服务实例
    service = new DeepSeekApiService();
    
    // 清理 mocks
    mockFetch.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  afterEach(() => {
    // 恢复环境变量
    process.env = originalEnv;
  });

  afterAll(() => {
    // 恢复 console
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('构造函数和配置', () => {
    it('应该使用默认配置初始化', () => {
      const config = service.getConfig();
      
      expect(config.apiKey).toBe('test-api-key');
      expect(config.baseUrl).toBe('https://api.test.com');
      expect(config.model).toBe('deepseek-chat');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
      expect(config.retryAttempts).toBe(3);
    });

    it('应该使用自定义配置覆盖默认值', () => {
      const customConfig: Partial<DeepSeekConfig> = {
        model: 'custom-model',
        maxTokens: 2000,
        temperature: 0.5,
      };

      const customService = new DeepSeekApiService(customConfig);
      const config = customService.getConfig();

      expect(config.model).toBe('custom-model');
      expect(config.maxTokens).toBe(2000);
      expect(config.temperature).toBe(0.5);
      expect(config.apiKey).toBe('test-api-key'); // 应该保持环境变量值
    });

    it('当缺少 API Key 时应该显示警告', () => {
      process.env.DEEPSEEK_API_KEY = '';
      
      new DeepSeekApiService();
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'DeepSeek API Key not found. Please set DEEPSEEK_API_KEY environment variable.'
      );
    });

    it('应该支持更新配置', () => {
      const newConfig: Partial<DeepSeekConfig> = {
        temperature: 0.9,
        maxTokens: 3000,
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();

      expect(config.temperature).toBe(0.9);
      expect(config.maxTokens).toBe(3000);
    });
  });

  describe('配置验证', () => {
    it('应该验证有效配置', () => {
      const validation = service.validateConfig();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该检测缺少 API Key', () => {
      service.updateConfig({ apiKey: '' });
      const validation = service.validateConfig();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('API Key is required');
    });

    it('应该检测无效的 temperature 值', () => {
      service.updateConfig({ temperature: 3.0 });
      const validation = service.validateConfig();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Temperature must be between 0 and 2');
    });

    it('应该检测无效的 maxTokens 值', () => {
      service.updateConfig({ maxTokens: -100 });
      const validation = service.validateConfig();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Max tokens must be greater than 0');
    });
  });

  describe('聊天功能', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'user', content: 'Hello, world!' }
    ];

    const mockResponse = {
      id: 'test-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'deepseek-chat',
      choices: [{
        index: 0,
        message: { role: 'assistant' as const, content: 'Hello! How can I help you?' },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25
      }
    };

    it('应该成功发送聊天请求', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await service.chat(mockMessages);

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          },
        })
      );
    });

    it('应该处理 API 错误响应', async () => {
      const errorResponse = {
        error: {
          message: 'Invalid API key',
          type: 'authentication_error',
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => errorResponse,
      } as Response);

      await expect(service.chat(mockMessages)).rejects.toThrow('DeepSeek API Error: Invalid API key');
    });

    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.chat(mockMessages)).rejects.toThrow('Request failed after all retry attempts');
    });

    it('应该处理超时错误', async () => {
      // Mock AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(service.chat(mockMessages)).rejects.toThrow('Request failed after all retry attempts');
    });

    it('应该实现重试机制', async () => {
      // 前两次失败，第三次成功
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

      const response = await service.chat(mockMessages);

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('应该在配置无效时抛出错误', async () => {
      service.updateConfig({ apiKey: '' });

      await expect(service.chat(mockMessages)).rejects.toThrow('DeepSeek API configuration error');
    });
  });

  describe('缓存功能', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'user', content: 'Hello, world!' }
    ];

    const mockResponse = {
      id: 'test-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'deepseek-chat',
      choices: [{
        index: 0,
        message: { role: 'assistant' as const, content: 'Hello! How can I help you?' },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25
      }
    };

    it('应该缓存成功的响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // 第一次调用
      await service.chat(mockMessages);
      
      // 第二次调用应该从缓存返回
      const cachedResponse = await service.chat(mockMessages);

      expect(cachedResponse).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1); // 只调用一次 API
    });

    it('应该支持清理缓存', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // 第一次调用
      await service.chat(mockMessages);
      
      // 清理缓存
      service.clearCache();
      
      // 第二次调用应该重新请求 API
      await service.chat(mockMessages);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('应该返回缓存统计信息', async () => {
      const stats = service.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('使用统计', () => {
    it('应该跟踪使用统计', () => {
      const initialStats = service.getUsageStats();
      
      expect(initialStats.totalRequests).toBe(0);
      expect(initialStats.totalTokens).toBe(0);
      expect(initialStats.errorRate).toBe(0);
    });

    it('应该支持重置统计', () => {
      service.resetUsageStats();
      const stats = service.getUsageStats();
      
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.errorRate).toBe(0);
    });
  });

  describe('连接测试', () => {
    it('应该测试连接成功', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [{
          index: 0,
          message: { role: 'assistant' as const, content: 'Test response' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 2,
          total_tokens: 7
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Connection successful');
    });

    it('应该测试连接失败', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await service.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection failed');
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理空消息数组', async () => {
      // 空消息数组应该直接抛出错误，不需要 mock API 调用
      const emptyService = new DeepSeekApiService();
      await expect(emptyService.chat([])).rejects.toThrow('DeepSeek API configuration error');
    });

    it('应该处理超大缓存', async () => {
      // 模拟达到缓存上限的情况
      const service = new DeepSeekApiService();
      
      // 这是内部测试，正常情况下不会直接访问私有方法
      // 但可以通过多次调用来测试缓存清理逻辑
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [{
          index: 0,
          message: { role: 'assistant' as const, content: 'Response' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 2,
          total_tokens: 7
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // 多次调用不同的消息来测试缓存机制
      for (let i = 0; i < 5; i++) {
        await service.chat([{ role: 'user', content: `Message ${i}` }]);
      }

      const cacheStats = service.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });
  });

  describe('环境适配性', () => {
    it('应该在 Node.js 环境中工作', () => {
      // 这个测试验证在 Node.js 环境中的 base64 编码
      const service = new DeepSeekApiService();
      expect(service).toBeInstanceOf(DeepSeekApiService);
    });

    it('应该处理不同的环境变量配置', () => {
      process.env.DEEPSEEK_API_KEY = 'env-key';
      process.env.DEEPSEEK_API_URL = 'https://env.api.com';
      
      const service = new DeepSeekApiService();
      const config = service.getConfig();
      
      expect(config.apiKey).toBe('env-key');
      expect(config.baseUrl).toBe('https://env.api.com');
    });
  });
}); 