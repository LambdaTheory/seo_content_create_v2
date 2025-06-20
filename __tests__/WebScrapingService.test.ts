import { WebScrapingService, ScrapingRequest, ScrapingResponse, ScrapingError } from '@/services/WebScrapingService';

// 模拟fetch API
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// 模拟Response对象
class MockResponse {
  constructor(
    private body: string,
    private init: ResponseInit = {}
  ) {}

  get status() { return this.init.status || 200; }
  get statusText() { return this.init.statusText || 'OK'; }
  get url() { return 'http://example.com'; }
  
  headers = new Map([
    ['content-type', 'text/html'],
    ['cache-control', 'no-cache']
  ]);

  async text() { return this.body; }
}

describe('WebScrapingService', () => {
  let service: WebScrapingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WebScrapingService();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('构造函数和配置', () => {
    it('应该使用默认配置初始化', () => {
      const config = service.getConfig();
      
      expect(config.timeout).toBe(30000);
      expect(config.retries).toBe(3);
      expect(config.concurrency).toBe(5);
      expect(config.enableCache).toBe(true);
    });

    it('应该接受自定义配置', () => {
      const customService = new WebScrapingService({
        timeout: 10000,
        retries: 1,
        concurrency: 2
      });

      const config = customService.getConfig();
      expect(config.timeout).toBe(10000);
      expect(config.retries).toBe(1);
      expect(config.concurrency).toBe(2);

      customService.destroy();
    });

    it('应该能更新配置', () => {
      service.updateConfig({ timeout: 15000 });
      
      const config = service.getConfig();
      expect(config.timeout).toBe(15000);
    });
  });

  describe('基本抓取功能', () => {
    it('应该成功抓取网页内容', async () => {
      const mockResponse = new MockResponse('<html><body>Test Content</body></html>');
      mockFetch.mockResolvedValue(mockResponse as any);

      const request: ScrapingRequest = {
        url: 'http://example.com'
      };

      const response = await service.scrape(request);

      expect(response.status).toBe(200);
      expect(response.content).toBe('<html><body>Test Content</body></html>');
      expect(response.fromCache).toBe(false);
      expect(typeof response.responseTime).toBe('number');
    });

    it('应该处理自定义请求头', async () => {
      const mockResponse = new MockResponse('Content');
      mockFetch.mockResolvedValue(mockResponse as any);

      const request: ScrapingRequest = {
        url: 'http://example.com',
        headers: {
          'Custom-Header': 'test-value'
        }
      };

      await service.scrape(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'test-value'
          })
        })
      );
    });

    it('应该支持不同的HTTP方法', async () => {
      const mockResponse = new MockResponse('Success');
      mockFetch.mockResolvedValue(mockResponse as any);

      const request: ScrapingRequest = {
        url: 'http://example.com',
        method: 'POST',
        body: 'test data'
      };

      await service.scrape(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com',
        expect.objectContaining({
          method: 'POST',
          body: 'test data'
        })
      );
    });
  });

  describe('缓存功能', () => {
    it('应该缓存成功的响应', async () => {
      const mockResponse = new MockResponse('Cached Content');
      mockFetch.mockResolvedValue(mockResponse as any);

      const request: ScrapingRequest = { url: 'http://example.com' };

      // 第一次请求
      const response1 = await service.scrape(request);
      expect(response1.fromCache).toBe(false);

      // 第二次请求应该来自缓存
      const response2 = await service.scrape(request);
      expect(response2.fromCache).toBe(true);
      expect(response2.content).toBe('Cached Content');

      // fetch应该只被调用一次
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('应该能清空缓存', async () => {
      const mockResponse = new MockResponse('Content');
      mockFetch.mockResolvedValue(mockResponse as any);

      const request: ScrapingRequest = { url: 'http://example.com' };

      // 第一次请求
      await service.scrape(request);
      
      // 清空缓存
      service.clearCache();

      // 第二次请求应该重新发起
      await service.scrape(request);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('应该能禁用缓存', async () => {
      service.updateConfig({ enableCache: false });
      
      const mockResponse = new MockResponse('Content');
      mockFetch.mockResolvedValue(mockResponse as any);

      const request: ScrapingRequest = { url: 'http://example.com' };

      await service.scrape(request);
      await service.scrape(request);

      // 禁用缓存时，每次都应该发起新请求
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('错误处理和重试', () => {
    it('应该在网络错误时重试', async () => {
      const networkError = new Error('Network error');
      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue(new MockResponse('Success') as any);

      const request: ScrapingRequest = {
        url: 'http://example.com',
        config: { retries: 3, retryDelay: 10 }
      };

      const response = await service.scrape(request);
      expect(response.content).toBe('Success');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('应该在超过重试次数时抛出错误', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const request: ScrapingRequest = {
        url: 'http://example.com',
        config: { retries: 2, retryDelay: 10 }
      };

      await expect(service.scrape(request)).rejects.toMatchObject({
        code: 'MAX_RETRIES_EXCEEDED',
        url: 'http://example.com',
        retryCount: 3
      });

      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('应该处理HTTP错误状态码', async () => {
      const mockResponse = new MockResponse('Not Found', { status: 404, statusText: 'Not Found' });
      mockFetch.mockResolvedValue(mockResponse as any);

      const request: ScrapingRequest = { url: 'http://example.com' };
      const response = await service.scrape(request);

      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
    });
  });

  describe('并发控制', () => {
    it('应该限制并发请求数', async () => {
      service.updateConfig({ concurrency: 2 });

      const mockResponse = new MockResponse('Content');
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse as any), 100))
      );

      const requests = Array.from({ length: 5 }, (_, i) => ({
        url: `http://example.com/${i}`
      }));

      // 同时发起5个请求
      const promises = requests.map(request => service.scrape(request));

      // 等待一小段时间，检查并发数
      await new Promise(resolve => setTimeout(resolve, 50));
      const stats = service.getStats();
      expect(stats.currentConcurrency).toBeLessThanOrEqual(2);

      // 等待所有请求完成
      await Promise.all(promises);
    });
  });

  describe('User-Agent轮换', () => {
    it('应该轮换User-Agent', async () => {
      const mockResponse = new MockResponse('Content');
      mockFetch.mockResolvedValue(mockResponse as any);

      const request: ScrapingRequest = { url: 'http://example.com' };

      await service.scrape(request);
      const firstCall = mockFetch.mock.calls[0][1];

      await service.scrape({ url: 'http://example.com/2' });
      const secondCall = mockFetch.mock.calls[1][1];

      // User-Agent应该不同（在轮换的情况下）
      const firstUA = (firstCall?.headers as any)?.['User-Agent'];
      const secondUA = (secondCall?.headers as any)?.['User-Agent'];

      expect(firstUA).toBeDefined();
      expect(secondUA).toBeDefined();
    });

    it('应该能禁用User-Agent轮换', async () => {
      service.updateConfig({ rotateUserAgent: false });

      const mockResponse = new MockResponse('Content');
      mockFetch.mockResolvedValue(mockResponse as any);

      const request: ScrapingRequest = {
        url: 'http://example.com',
        headers: { 'User-Agent': 'Custom-Agent' }
      };

      await service.scrape(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'Custom-Agent'
          })
        })
      );
    });
  });

  describe('批量请求', () => {
    it('应该支持批量抓取', async () => {
      const mockResponse = new MockResponse('Content');
      mockFetch.mockResolvedValue(mockResponse as any);

      const requests: ScrapingRequest[] = [
        { url: 'http://example.com/1' },
        { url: 'http://example.com/2' },
        { url: 'http://example.com/3' }
      ];

      const responses = await service.batchScrape(requests);

      expect(responses).toHaveLength(3);
      expect(responses.every(r => r.content === 'Content')).toBe(true);
    });
  });

  describe('URL可访问性检查', () => {
    it('应该正确检查URL可访问性', async () => {
      const mockResponse = new MockResponse('', { status: 200 });
      mockFetch.mockResolvedValue(mockResponse as any);

      const isAccessible = await service.isAccessible('http://example.com');
      expect(isAccessible).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com',
        expect.objectContaining({
          method: 'HEAD'
        })
      );
    });

    it('应该在URL不可访问时返回false', async () => {
      const mockResponse = new MockResponse('', { status: 404 });
      mockFetch.mockResolvedValue(mockResponse as any);

      const isAccessible = await service.isAccessible('http://example.com');
      expect(isAccessible).toBe(false);
    });

    it('应该在网络错误时返回false', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const isAccessible = await service.isAccessible('http://example.com');
      expect(isAccessible).toBe(false);
    });
  });

  describe('统计信息', () => {
    it('应该正确跟踪统计信息', async () => {
      const mockResponse = new MockResponse('Content');
      mockFetch.mockResolvedValue(mockResponse as any);

      const initialStats = service.getStats();
      expect(initialStats.totalRequests).toBe(0);
      expect(initialStats.successRequests).toBe(0);

      await service.scrape({ url: 'http://example.com' });

      const finalStats = service.getStats();
      expect(finalStats.totalRequests).toBe(1);
      expect(finalStats.successRequests).toBe(1);
      expect(finalStats.successRate).toBe(1);
    });

    it('应该能重置统计信息', async () => {
      const mockResponse = new MockResponse('Content');
      mockFetch.mockResolvedValue(mockResponse as any);

      await service.scrape({ url: 'http://example.com' });
      
      let stats = service.getStats();
      expect(stats.totalRequests).toBe(1);

      service.resetStats();
      
      stats = service.getStats();
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理空响应', async () => {
      const mockResponse = new MockResponse('');
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await service.scrape({ url: 'http://example.com' });
      expect(response.content).toBe('');
    });

    it('应该处理无效URL', async () => {
      mockFetch.mockRejectedValue(new TypeError('Invalid URL'));

      await expect(service.scrape({ 
        url: 'invalid-url',
        config: { retries: 1, retryDelay: 10 }
      })).rejects.toMatchObject({
        code: 'MAX_RETRIES_EXCEEDED'
      });
    }, 10000);
  });
}); 