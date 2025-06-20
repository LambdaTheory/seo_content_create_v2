import { SitemapService } from '../SitemapService';
import { CompetitorWebsiteConfig, ScrapingStatus } from '@/types/Competitor.types';

// Mock fetch API
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock DOMParser
global.DOMParser = jest.fn().mockImplementation(() => ({
  parseFromString: jest.fn()
}));

describe('SitemapService', () => {
  let sitemapService: SitemapService;
  let mockConfig: CompetitorWebsiteConfig;

  beforeEach(() => {
    sitemapService = new SitemapService();
    mockConfig = {
      id: 'test-website',
      name: 'Test Website',
      baseUrl: 'https://example.com',
      sitemapUrl: 'https://example.com/sitemap.xml',
      enabled: true,
      scraping: {
        maxPages: 100,
        requestDelay: 1000,
        urlPattern: '/games/'
      }
    };

    // 清理所有mock
    jest.clearAllMocks();
    // 清理控制台日志
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchSitemap', () => {
    it('应该成功抓取并解析sitemap', async () => {
      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/games/game1</loc>
          </url>
          <url>
            <loc>https://example.com/games/game2</loc>
          </url>
        </urlset>`;

      const mockDoc = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue([
          { textContent: 'https://example.com/games/game1' },
          { textContent: 'https://example.com/games/game2' }
        ])
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockXml)
      } as any);

      (global.DOMParser as jest.Mock).mockReturnValue({
        parseFromString: jest.fn().mockReturnValue(mockDoc)
      });

      const result = await sitemapService.fetchSitemap(mockConfig);

      expect(result.status).toBe(ScrapingStatus.SUCCESS);
      expect(result.websiteId).toBe('test-website');
      expect(result.totalUrls).toBe(2);
      expect(result.urls).toHaveLength(2);
      expect(result.urls).toContain('https://example.com/games/game1');
      expect(result.urls).toContain('https://example.com/games/game2');
      expect(result.errorMessage).toBeUndefined();
    });

    it('应该处理HTTP错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as any);

      const result = await sitemapService.fetchSitemap(mockConfig);

      expect(result.status).toBe(ScrapingStatus.FAILED);
      expect(result.totalUrls).toBe(0);
      expect(result.urls).toHaveLength(0);
      expect(result.errorMessage).toBeTruthy();
    });

    it('应该处理网络超时', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AbortError')), 100)
        )
      );

      const result = await sitemapService.fetchSitemap(mockConfig);

      expect(result.status).toBe(ScrapingStatus.FAILED);
      expect(result.errorMessage).toBeTruthy();
    });

    it('应该处理空的sitemap内容', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('')
      } as any);

      const result = await sitemapService.fetchSitemap(mockConfig);

      expect(result.status).toBe(ScrapingStatus.FAILED);
      expect(result.errorMessage).toContain('Sitemap内容为空');
    });

    it('应该处理XML解析错误', async () => {
      const mockXml = 'invalid xml content';

      const mockDoc = {
        querySelector: jest.fn().mockReturnValue({
          textContent: 'XML parsing error'
        }),
        querySelectorAll: jest.fn().mockReturnValue([])
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockXml)
      } as any);

      (global.DOMParser as jest.Mock).mockReturnValue({
        parseFromString: jest.fn().mockReturnValue(mockDoc)
      });

      const result = await sitemapService.fetchSitemap(mockConfig);

      expect(result.status).toBe(ScrapingStatus.FAILED);
      expect(result.errorMessage).toContain('XML解析错误');
    });

    it('应该过滤无效的游戏URL', async () => {
      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/games/game1</loc>
          </url>
          <url>
            <loc>https://example.com/sitemap.xml</loc>
          </url>
          <url>
            <loc>https://example.com/api/data</loc>
          </url>
          <url>
            <loc>https://other-domain.com/games/game2</loc>
          </url>
        </urlset>`;

      const mockDoc = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue([
          { textContent: 'https://example.com/games/game1' },
          { textContent: 'https://example.com/sitemap.xml' },
          { textContent: 'https://example.com/api/data' },
          { textContent: 'https://other-domain.com/games/game2' }
        ])
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockXml)
      } as any);

      (global.DOMParser as jest.Mock).mockReturnValue({
        parseFromString: jest.fn().mockReturnValue(mockDoc)
      });

      const result = await sitemapService.fetchSitemap(mockConfig);

      expect(result.status).toBe(ScrapingStatus.SUCCESS);
      expect(result.totalUrls).toBe(1);
      expect(result.urls).toEqual(['https://example.com/games/game1']);
    });

    it('应该处理sitemap index格式', async () => {
      const mockIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap>
            <loc>https://example.com/sitemap-games.xml</loc>
          </sitemap>
        </sitemapindex>`;

      const mockGamesXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/games/game1</loc>
          </url>
        </urlset>`;

      const mockIndexDoc = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn()
          .mockReturnValueOnce([]) // 第一次调用 url > loc 返回空
          .mockReturnValueOnce([{ textContent: 'https://example.com/sitemap-games.xml' }]) // 第二次调用 sitemap > loc
      };

      const mockGamesDoc = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue([
          { textContent: 'https://example.com/games/game1' }
        ])
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(mockIndexXml)
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(mockGamesXml)
        } as any);

      (global.DOMParser as jest.Mock)
        .mockReturnValueOnce({
          parseFromString: jest.fn().mockReturnValue(mockIndexDoc)
        })
        .mockReturnValueOnce({
          parseFromString: jest.fn().mockReturnValue(mockGamesDoc)
        });

      const result = await sitemapService.fetchSitemap(mockConfig);

      expect(result.status).toBe(ScrapingStatus.SUCCESS);
      expect(result.totalUrls).toBe(1);
      expect(result.urls).toContain('https://example.com/games/game1');
    });
  });

  describe('重试机制', () => {
    it('应该在请求失败时自动重试', async () => {
      // 前两次请求失败，第三次成功
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(`<?xml version="1.0" encoding="UTF-8"?>
            <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
              <url><loc>https://example.com/games/game1</loc></url>
            </urlset>`)
        } as any);

      const mockDoc = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue([
          { textContent: 'https://example.com/games/game1' }
        ])
      };

      (global.DOMParser as jest.Mock).mockReturnValue({
        parseFromString: jest.fn().mockReturnValue(mockDoc)
      });

      const result = await sitemapService.fetchSitemap(mockConfig);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(ScrapingStatus.SUCCESS);
    });

    it('应该在达到最大重试次数后失败', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      const result = await sitemapService.fetchSitemap(mockConfig);

      expect(mockFetch).toHaveBeenCalledTimes(3); // 最大重试次数
      expect(result.status).toBe(ScrapingStatus.FAILED);
      expect(result.errorMessage).toContain('Persistent network error');
    });
  });

  describe('fetchMultipleSitemaps', () => {
    it('应该批量抓取多个网站的sitemap', async () => {
      const configs = [
        { ...mockConfig, id: 'site1', name: 'Site 1' },
        { ...mockConfig, id: 'site2', name: 'Site 2' }
      ];

      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/games/game1</loc></url>
        </urlset>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockXml)
      } as any);

      const mockDoc = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue([
          { textContent: 'https://example.com/games/game1' }
        ])
      };

      (global.DOMParser as jest.Mock).mockReturnValue({
        parseFromString: jest.fn().mockReturnValue(mockDoc)
      });

      const results = await sitemapService.fetchMultipleSitemaps(configs);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe(ScrapingStatus.SUCCESS);
      expect(results[1].status).toBe(ScrapingStatus.SUCCESS);
      expect(results[0].websiteId).toBe('site1');
      expect(results[1].websiteId).toBe('site2');
    });

    it('应该处理部分网站抓取失败的情况', async () => {
      const configs = [
        { ...mockConfig, id: 'site1', name: 'Site 1' },
        { ...mockConfig, id: 'site2', name: 'Site 2', sitemapUrl: 'https://invalid-url.com/sitemap.xml' }
      ];

      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/games/game1</loc></url>
        </urlset>`;

      // 第一个网站成功，第二个网站失败
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(mockXml)
        } as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error')); // 为重试机制添加更多失败

      const mockDoc = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue([
          { textContent: 'https://example.com/games/game1' }
        ])
      };

      (global.DOMParser as jest.Mock).mockReturnValue({
        parseFromString: jest.fn().mockReturnValue(mockDoc)
      });

      const results = await sitemapService.fetchMultipleSitemaps(configs);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe(ScrapingStatus.SUCCESS);
      expect(results[1].status).toBe(ScrapingStatus.FAILED);
    });
  });

  describe('URL验证', () => {
    it('应该根据URL模式过滤URL', async () => {
      const configWithPattern = {
        ...mockConfig,
        scraping: {
          urlPattern: '/play/',
          maxPages: 100
        }
      };

      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/play/game1</loc></url>
          <url><loc>https://example.com/games/game2</loc></url>
          <url><loc>https://example.com/play/game3</loc></url>
        </urlset>`;

      const mockDoc = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue([
          { textContent: 'https://example.com/play/game1' },
          { textContent: 'https://example.com/games/game2' },
          { textContent: 'https://example.com/play/game3' }
        ])
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockXml)
      } as any);

      (global.DOMParser as jest.Mock).mockReturnValue({
        parseFromString: jest.fn().mockReturnValue(mockDoc)
      });

      const result = await sitemapService.fetchSitemap(configWithPattern);

      expect(result.status).toBe(ScrapingStatus.SUCCESS);
      expect(result.totalUrls).toBe(2);
      expect(result.urls).toEqual([
        'https://example.com/play/game1',
        'https://example.com/play/game3'
      ]);
    });

    it('应该限制最大URL数量', async () => {
      const configWithLimit = {
        ...mockConfig,
        scraping: {
          maxPages: 2
        }
      };

      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/games/game1</loc></url>
          <url><loc>https://example.com/games/game2</loc></url>
          <url><loc>https://example.com/games/game3</loc></url>
        </urlset>`;

      const mockDoc = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue([
          { textContent: 'https://example.com/games/game1' },
          { textContent: 'https://example.com/games/game2' },
          { textContent: 'https://example.com/games/game3' }
        ])
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockXml)
      } as any);

      (global.DOMParser as jest.Mock).mockReturnValue({
        parseFromString: jest.fn().mockReturnValue(mockDoc)
      });

      const result = await sitemapService.fetchSitemap(configWithLimit);

      expect(result.status).toBe(ScrapingStatus.SUCCESS);
      expect(result.totalUrls).toBe(2);
      expect(result.urls).toHaveLength(2);
    });
  });
}); 