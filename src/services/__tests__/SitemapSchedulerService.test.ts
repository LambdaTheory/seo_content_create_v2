import { SitemapSchedulerService, UpdateTaskStatus } from '../SitemapSchedulerService';
import { sitemapService } from '../SitemapService';
import { competitorDatabaseService } from '../CompetitorDatabaseService';
import { ScrapingStatus } from '@/types/Competitor.types';

// Mock dependencies
jest.mock('../SitemapService', () => ({
  sitemapService: {
    fetchSitemap: jest.fn()
  }
}));

jest.mock('../CompetitorDatabaseService', () => ({
  competitorDatabaseService: {
    getWebsiteConfigs: jest.fn(),
    getSitemapData: jest.fn(),
    saveSitemapData: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock timers
jest.useFakeTimers();

describe('SitemapSchedulerService', () => {
  let service: SitemapSchedulerService;
  let mockSitemapService: jest.Mocked<typeof sitemapService>;
  let mockDatabaseService: jest.Mocked<typeof competitorDatabaseService>;

  beforeEach(() => {
    service = new SitemapSchedulerService();
    mockSitemapService = sitemapService as jest.Mocked<typeof sitemapService>;
    mockDatabaseService = competitorDatabaseService as jest.Mocked<typeof competitorDatabaseService>;
    
    localStorageMock.clear();
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Setup default mocks
    mockDatabaseService.getWebsiteConfigs.mockResolvedValue([
      {
        id: 'test-site',
        name: 'Test Site',
        baseUrl: 'https://test.com',
        sitemapUrl: 'https://test.com/sitemap.xml',
        enabled: true
      }
    ]);

    mockDatabaseService.getSitemapData.mockResolvedValue([]);
    mockDatabaseService.saveSitemapData.mockResolvedValue();

    mockSitemapService.fetchSitemap.mockResolvedValue({
      websiteId: 'test-site',
      websiteName: 'Test Site',
      sitemapUrl: 'https://test.com/sitemap.xml',
      urls: ['https://test.com/game1', 'https://test.com/game2'],
      lastFetched: new Date(),
      status: ScrapingStatus.SUCCESS,
      fetchDuration: 1000,
      totalUrls: 2
    });
  });

  afterEach(async () => {
    await service.stopScheduler();
    jest.restoreAllMocks();
  });

  describe('配置管理', () => {
    it('应该保存和获取配置', async () => {
      const config = {
        intervalHours: 12,
        autoUpdate: true,
        maxConcurrent: 5,
        maxRetries: 3,
        onlyEnabledSites: false
      };

      await service.saveConfig(config);
      const savedConfig = await service.getConfig();

      expect(savedConfig).toEqual(config);
    });

    it('应该在没有配置时返回默认配置', async () => {
      const config = await service.getConfig();

      expect(config).toEqual({
        intervalHours: 24,
        autoUpdate: false,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      });
    });

    it('应该处理损坏的配置数据', async () => {
      localStorage.setItem('sitemap_scheduler_config', 'invalid json');
      
      const config = await service.getConfig();
      
      expect(config.intervalHours).toBe(24); // 应该返回默认值
    });
  });

  describe('定时更新', () => {
    it('应该启动定时更新', async () => {
      const config = {
        intervalHours: 1,
        autoUpdate: true,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      };

      await service.startScheduler(config);

      // 检查定时器是否设置
      expect(jest.getTimerCount()).toBe(1);
    });

    it('应该在禁用自动更新时不设置定时器', async () => {
      const config = {
        intervalHours: 1,
        autoUpdate: false,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      };

      await service.startScheduler(config);

      expect(jest.getTimerCount()).toBe(0);
    });

    it('应该停止定时更新', async () => {
      await service.startScheduler({
        intervalHours: 1,
        autoUpdate: true,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      });

      await service.stopScheduler();

      expect(jest.getTimerCount()).toBe(0);
    });

    it('应该在定时器触发时执行更新', async () => {
      // 设置需要更新的条件
      localStorage.setItem('sitemap_last_update', 
        new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25小时前
      );

      await service.startScheduler({
        intervalHours: 1,
        autoUpdate: true,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      });

      // 触发定时器
      jest.advanceTimersByTime(60 * 60 * 1000); // 1小时

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSitemapService.fetchSitemap).toHaveBeenCalled();
    });
  });

  describe('手动更新', () => {
    it('应该成功执行手动更新', async () => {
      const result = await service.triggerManualUpdate();

      expect(result.status).toBe(UpdateTaskStatus.COMPLETED);
      expect(result.totalSites).toBe(1);
      expect(result.successSites).toBe(1);
      expect(result.failedSites).toBe(0);
      expect(result.newUrls).toBe(2);
      expect(mockSitemapService.fetchSitemap).toHaveBeenCalledTimes(1);
    });

    it('应该处理更新失败', async () => {
      mockSitemapService.fetchSitemap.mockResolvedValueOnce({
        websiteId: 'test-site',
        websiteName: 'Test Site',
        sitemapUrl: 'https://test.com/sitemap.xml',
        urls: [],
        lastFetched: new Date(),
        status: ScrapingStatus.FAILED,
        fetchDuration: 1000,
        totalUrls: 0,
        errorMessage: 'Network error'
      });

      const result = await service.triggerManualUpdate();

      expect(result.status).toBe(UpdateTaskStatus.FAILED);
      expect(result.failedSites).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Network error');
    });

    it('应该阻止并发更新', async () => {
      // 让第一次更新挂起
      let resolveFirstUpdate: () => void;
      const firstUpdatePromise = new Promise<void>(resolve => {
        resolveFirstUpdate = resolve;
      });
      
      mockSitemapService.fetchSitemap.mockImplementationOnce(() => {
        return firstUpdatePromise.then(() => ({
          websiteId: 'test-site',
          websiteName: 'Test Site',
          sitemapUrl: 'https://test.com/sitemap.xml',
          urls: ['https://test.com/game1'],
          lastFetched: new Date(),
          status: ScrapingStatus.SUCCESS,
          fetchDuration: 1000,
          totalUrls: 1
        }));
      });

      // 启动第一次更新
      const firstUpdate = service.triggerManualUpdate();
      
      // 尝试第二次更新（应该失败）
      await expect(service.triggerManualUpdate()).rejects.toThrow('更新任务正在进行中');

      // 完成第一次更新
      resolveFirstUpdate!();
      await firstUpdate;
    });

    it('应该处理没有启用网站的情况', async () => {
      mockDatabaseService.getWebsiteConfigs.mockResolvedValueOnce([
        {
          id: 'disabled-site',
          name: 'Disabled Site',
          baseUrl: 'https://disabled.com',
          sitemapUrl: 'https://disabled.com/sitemap.xml',
          enabled: false
        }
      ]);

      await expect(service.triggerManualUpdate()).rejects.toThrow('没有需要更新的网站');
    });
  });

  describe('增量更新逻辑', () => {
    it('应该正确计算新增和更新的URL', async () => {
      // 设置旧数据
      mockDatabaseService.getSitemapData.mockResolvedValueOnce([
        {
          websiteId: 'test-site',
          websiteName: 'Test Site',
          sitemapUrl: 'https://test.com/sitemap.xml',
          urls: ['https://test.com/game1', 'https://test.com/old-game'],
          lastFetched: new Date(),
          status: ScrapingStatus.SUCCESS,
          fetchDuration: 1000,
          totalUrls: 2
        }
      ]);

      // 设置新数据（包含新URL和保留的URL）
      mockSitemapService.fetchSitemap.mockResolvedValueOnce({
        websiteId: 'test-site',
        websiteName: 'Test Site',
        sitemapUrl: 'https://test.com/sitemap.xml',
        urls: ['https://test.com/game1', 'https://test.com/new-game'], // game1保留，old-game删除，new-game新增
        lastFetched: new Date(),
        status: ScrapingStatus.SUCCESS,
        fetchDuration: 1000,
        totalUrls: 2
      });

      const result = await service.triggerManualUpdate();

      expect(result.newUrls).toBe(1); // new-game
      expect(result.updatedUrls).toBe(1); // game1
    });
  });

  describe('重试机制', () => {
    it('应该在失败时重试', async () => {
      // 前两次失败，第三次成功
      mockSitemapService.fetchSitemap
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          websiteId: 'test-site',
          websiteName: 'Test Site',
          sitemapUrl: 'https://test.com/sitemap.xml',
          urls: ['https://test.com/game1'],
          lastFetched: new Date(),
          status: ScrapingStatus.SUCCESS,
          fetchDuration: 1000,
          totalUrls: 1
        });

      const result = await service.triggerManualUpdate();

      expect(mockSitemapService.fetchSitemap).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(UpdateTaskStatus.COMPLETED);
    });

    it('应该在达到最大重试次数后失败', async () => {
      mockSitemapService.fetchSitemap.mockRejectedValue(new Error('Persistent error'));

      const result = await service.triggerManualUpdate();

      expect(mockSitemapService.fetchSitemap).toHaveBeenCalledTimes(3); // 1次初始 + 2次重试
      expect(result.status).toBe(UpdateTaskStatus.FAILED);
      expect(result.errors[0]).toContain('Persistent error');
    });
  });

  describe('任务历史', () => {
    it('应该保存任务历史', async () => {
      await service.triggerManualUpdate();
      
      const history = await service.getTaskHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0].status).toBe(UpdateTaskStatus.COMPLETED);
      expect(history[0].totalSites).toBe(1);
    });

    it('应该限制历史记录数量', async () => {
      // 执行多次更新
      for (let i = 0; i < 55; i++) { // 超过MAX_HISTORY_SIZE(50)
        await service.triggerManualUpdate();
      }
      
      const history = await service.getTaskHistory(100); // 请求更多，但应该被限制
      
      expect(history.length).toBeLessThanOrEqual(50);
    });

    it('应该按时间倒序返回历史', async () => {
      // 执行多次更新
      await service.triggerManualUpdate();
      await new Promise(resolve => setTimeout(resolve, 10)); // 确保时间差异
      await service.triggerManualUpdate();
      
      const history = await service.getTaskHistory();
      
      expect(history).toHaveLength(2);
      expect(new Date(history[0].startTime).getTime())
        .toBeGreaterThan(new Date(history[1].startTime).getTime());
    });
  });

  describe('更新时间检查', () => {
    it('应该在没有上次更新时间时需要更新', async () => {
      await service.saveConfig({
        intervalHours: 24,
        autoUpdate: true,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      });

      const shouldUpdate = await service.shouldUpdate();
      expect(shouldUpdate).toBe(true);
    });

    it('应该在超过更新间隔时需要更新', async () => {
      await service.saveConfig({
        intervalHours: 1,
        autoUpdate: true,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      });

      // 设置上次更新时间为2小时前
      const lastUpdate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      localStorage.setItem('sitemap_last_update', lastUpdate.toISOString());

      const shouldUpdate = await service.shouldUpdate();
      expect(shouldUpdate).toBe(true);
    });

    it('应该在未超过更新间隔时不需要更新', async () => {
      await service.saveConfig({
        intervalHours: 24,
        autoUpdate: true,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      });

      // 设置上次更新时间为1小时前
      const lastUpdate = new Date(Date.now() - 1 * 60 * 60 * 1000);
      localStorage.setItem('sitemap_last_update', lastUpdate.toISOString());

      const shouldUpdate = await service.shouldUpdate();
      expect(shouldUpdate).toBe(false);
    });

    it('应该在禁用自动更新时不需要更新', async () => {
      await service.saveConfig({
        intervalHours: 1,
        autoUpdate: false,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      });

      const shouldUpdate = await service.shouldUpdate();
      expect(shouldUpdate).toBe(false);
    });
  });

  describe('当前任务状态', () => {
    it('应该在没有运行任务时返回null', () => {
      const currentTask = service.getCurrentTask();
      expect(currentTask).toBeNull();
    });

    it('应该在任务运行时返回当前任务', async () => {
      // 让更新挂起
      let resolveUpdate: () => void;
      const updatePromise = new Promise<void>(resolve => {
        resolveUpdate = resolve;
      });
      
      mockSitemapService.fetchSitemap.mockImplementationOnce(() => {
        return updatePromise.then(() => ({
          websiteId: 'test-site',
          websiteName: 'Test Site',
          sitemapUrl: 'https://test.com/sitemap.xml',
          urls: ['https://test.com/game1'],
          lastFetched: new Date(),
          status: ScrapingStatus.SUCCESS,
          fetchDuration: 1000,
          totalUrls: 1
        }));
      });

      // 启动更新
      const updatePromiseResult = service.triggerManualUpdate();
      
      // 检查当前任务
      const currentTask = service.getCurrentTask();
      expect(currentTask).not.toBeNull();
      expect(currentTask?.status).toBe(UpdateTaskStatus.RUNNING);

      // 完成更新
      resolveUpdate!();
      await updatePromiseResult;
      
      // 任务完成后应该清空
      expect(service.getCurrentTask()).toBeNull();
    });
  });

  describe('并发控制', () => {
    it('应该按配置的并发数更新网站', async () => {
      mockDatabaseService.getWebsiteConfigs.mockResolvedValueOnce([
        {
          id: 'site1',
          name: 'Site 1',
          baseUrl: 'https://site1.com',
          sitemapUrl: 'https://site1.com/sitemap.xml',
          enabled: true
        },
        {
          id: 'site2',
          name: 'Site 2',
          baseUrl: 'https://site2.com',
          sitemapUrl: 'https://site2.com/sitemap.xml',
          enabled: true
        },
        {
          id: 'site3',
          name: 'Site 3',
          baseUrl: 'https://site3.com',
          sitemapUrl: 'https://site3.com/sitemap.xml',
          enabled: true
        }
      ]);

      await service.saveConfig({
        intervalHours: 24,
        autoUpdate: false,
        maxConcurrent: 2, // 最大并发2
        maxRetries: 0,
        onlyEnabledSites: true
      });

      mockSitemapService.fetchSitemap.mockResolvedValue({
        websiteId: 'test',
        websiteName: 'Test',
        sitemapUrl: 'https://test.com/sitemap.xml',
        urls: ['https://test.com/game1'],
        lastFetched: new Date(),
        status: ScrapingStatus.SUCCESS,
        fetchDuration: 1000,
        totalUrls: 1
      });

      const result = await service.triggerManualUpdate();

      expect(result.totalSites).toBe(3);
      expect(mockSitemapService.fetchSitemap).toHaveBeenCalledTimes(3);
    });
  });

  describe('错误处理', () => {
    it('应该处理数据库错误', async () => {
      mockDatabaseService.getWebsiteConfigs.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.triggerManualUpdate()).rejects.toThrow('Database error');
    });

    it('应该处理localStorage错误', async () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(service.saveConfig({
        intervalHours: 24,
        autoUpdate: false,
        maxConcurrent: 3,
        maxRetries: 2,
        onlyEnabledSites: true
      })).rejects.toThrow('Storage quota exceeded');

      localStorage.setItem = originalSetItem;
    });
  });
}); 