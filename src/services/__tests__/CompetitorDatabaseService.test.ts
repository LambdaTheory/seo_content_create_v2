import { CompetitorDatabaseService } from '../CompetitorDatabaseService';
import { CompetitorWebsiteConfig, SitemapData, CompetitorGame, ScrapingStatus } from '@/types/Competitor.types';

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
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CompetitorDatabaseService', () => {
  let service: CompetitorDatabaseService;
  let mockWebsiteConfigs: CompetitorWebsiteConfig[];
  let mockSitemapData: SitemapData[];
  let mockGames: CompetitorGame[];

  beforeEach(() => {
    service = new CompetitorDatabaseService();
    localStorageMock.clear();

    // Mock数据
    mockWebsiteConfigs = [
      {
        id: 'test-site-1',
        name: 'Test Site 1',
        baseUrl: 'https://test1.com',
        sitemapUrl: 'https://test1.com/sitemap.xml',
        enabled: true,
        scraping: {
          urlPattern: '/games/',
          maxPages: 100
        }
      },
      {
        id: 'test-site-2',
        name: 'Test Site 2',
        baseUrl: 'https://test2.com',
        sitemapUrl: 'https://test2.com/sitemap.xml',
        enabled: true
      }
    ];

    mockSitemapData = [
      {
        websiteId: 'test-site-1',
        websiteName: 'Test Site 1',
        sitemapUrl: 'https://test1.com/sitemap.xml',
        urls: [
          'https://test1.com/games/game1',
          'https://test1.com/games/game2'
        ],
        lastFetched: new Date('2025-01-24'),
        status: ScrapingStatus.SUCCESS,
        fetchDuration: 1000,
        totalUrls: 2
      }
    ];

    mockGames = [
      {
        id: 'game1',
        websiteId: 'test-site-1',
        websiteName: 'Test Site 1',
        title: 'Test Game 1',
        url: 'https://test1.com/games/game1',
        tags: ['action', 'adventure'],
        crawledAt: new Date('2025-01-24'),
        updatedAt: new Date('2025-01-24'),
        processed: false
      },
      {
        id: 'game2',
        websiteId: 'test-site-1',
        websiteName: 'Test Site 1',
        title: 'Test Game 2',
        url: 'https://test1.com/games/game2',
        tags: ['puzzle'],
        crawledAt: new Date('2025-01-24'),
        updatedAt: new Date('2025-01-24'),
        processed: true
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

  describe('初始化', () => {
    it('应该成功初始化数据库', async () => {
      await expect(service.initializeDatabase()).resolves.not.toThrow();
    });

    it('应该创建必要的存储结构', async () => {
      await service.initializeDatabase();
      
      // 检查存储键是否存在
      expect(localStorage.getItem('competitor_websites')).not.toBeNull();
      expect(localStorage.getItem('competitor_sitemaps')).not.toBeNull();
      expect(localStorage.getItem('competitor_games')).not.toBeNull();
      expect(localStorage.getItem('competitor_game_index')).not.toBeNull();
      expect(localStorage.getItem('competitor_metadata')).not.toBeNull();
    });
  });

  describe('网站配置管理', () => {
    it('应该保存和获取网站配置', async () => {
      await service.saveWebsiteConfigs(mockWebsiteConfigs);
      const configs = await service.getWebsiteConfigs();
      
      expect(configs).toHaveLength(2);
      expect(configs[0].id).toBe('test-site-1');
      expect(configs[0].name).toBe('Test Site 1');
    });

    it('应该在没有配置时返回默认配置', async () => {
      const configs = await service.getWebsiteConfigs();
      
      expect(configs).toHaveLength(3); // 默认有3个网站
      expect(configs.some(c => c.id === 'coolmathgames')).toBe(true);
      expect(configs.some(c => c.id === 'gamedistribution')).toBe(true);
      expect(configs.some(c => c.id === 'twoplayergames')).toBe(true);
    });

    it('应该处理损坏的配置数据', async () => {
      localStorage.setItem('competitor_websites', 'invalid json');
      
      const configs = await service.getWebsiteConfigs();
      expect(configs).toHaveLength(3); // 应该返回默认配置
    });
  });

  describe('Sitemap数据管理', () => {
    it('应该保存和获取Sitemap数据', async () => {
      await service.saveSitemapData(mockSitemapData);
      const data = await service.getSitemapData();
      
      expect(data).toHaveLength(1);
      expect(data[0].websiteId).toBe('test-site-1');
      expect(data[0].totalUrls).toBe(2);
      expect(data[0].lastFetched).toBeInstanceOf(Date);
    });

    it('应该合并新的Sitemap数据', async () => {
      // 先保存一些数据
      await service.saveSitemapData(mockSitemapData);
      
      // 添加新数据
      const newData: SitemapData = {
        websiteId: 'test-site-2',
        websiteName: 'Test Site 2',
        sitemapUrl: 'https://test2.com/sitemap.xml',
        urls: ['https://test2.com/games/game3'],
        lastFetched: new Date('2025-01-25'),
        status: ScrapingStatus.SUCCESS,
        fetchDuration: 800,
        totalUrls: 1
      };
      
      await service.saveSitemapData([newData]);
      const allData = await service.getSitemapData();
      
      expect(allData).toHaveLength(2);
      expect(allData.some(d => d.websiteId === 'test-site-2')).toBe(true);
    });

    it('应该在没有数据时返回空数组', async () => {
      const data = await service.getSitemapData();
      expect(data).toEqual([]);
    });
  });

  describe('游戏数据管理', () => {
    it('应该保存和获取游戏数据', async () => {
      await service.saveCompetitorGames(mockGames);
      const games = await service.getCompetitorGames();
      
      expect(games).toHaveLength(2);
      expect(games[0].title).toBe('Test Game 1');
      expect(games[0].crawledAt).toBeInstanceOf(Date);
      expect(games[0].updatedAt).toBeInstanceOf(Date);
    });

    it('应该按网站ID获取游戏', async () => {
      await service.saveCompetitorGames(mockGames);
      const games = await service.getGamesByWebsite('test-site-1');
      
      expect(games).toHaveLength(2);
      expect(games.every(g => g.websiteId === 'test-site-1')).toBe(true);
    });

    it('应该搜索游戏', async () => {
      await service.saveCompetitorGames(mockGames);
      
      // 按标题搜索
      const titleResults = await service.searchGames('Test Game 1');
      expect(titleResults).toHaveLength(1);
      expect(titleResults[0].title).toBe('Test Game 1');
      
      // 按标签搜索
      const tagResults = await service.searchGames('puzzle');
      expect(tagResults).toHaveLength(1);
      expect(tagResults[0].title).toBe('Test Game 2');
      
      // 搜索未处理的游戏
      const unprocessedResults = await service.searchGames('', { 
        includeProcessed: false 
      });
      expect(unprocessedResults).toHaveLength(1);
      expect(unprocessedResults[0].processed).toBe(false);
    });

    it('应该按网站ID过滤搜索结果', async () => {
      await service.saveCompetitorGames(mockGames);
      
      const results = await service.searchGames('', { 
        websiteId: 'test-site-1',
        limit: 10
      });
      
      expect(results).toHaveLength(2);
      expect(results.every(g => g.websiteId === 'test-site-1')).toBe(true);
    });

    it('应该限制搜索结果数量', async () => {
      await service.saveCompetitorGames(mockGames);
      
      const results = await service.searchGames('', { limit: 1 });
      expect(results).toHaveLength(1);
    });
  });

  describe('游戏索引从Sitemap更新', () => {
    it('应该从Sitemap数据创建游戏索引', async () => {
      await service.saveSitemapData(mockSitemapData);
      
      // 检查游戏是否被创建
      const games = await service.getCompetitorGames();
      expect(games.length).toBeGreaterThan(0);
      
      // 检查游戏属性
      const game1 = games.find(g => g.url === 'https://test1.com/games/game1');
      expect(game1).toBeDefined();
      expect(game1?.websiteId).toBe('test-site-1');
      expect(game1?.processed).toBe(false);
    });

    it('应该更新现有游戏而不是重复创建', async () => {
      // 先创建一些游戏
      await service.saveCompetitorGames([mockGames[0]]);
      
      // 然后从Sitemap更新
      await service.saveSitemapData(mockSitemapData);
      
      const games = await service.getCompetitorGames();
      const game1Instances = games.filter(g => g.url === 'https://test1.com/games/game1');
      
      // 应该只有一个实例，而不是重复
      expect(game1Instances).toHaveLength(1);
    });
  });

  describe('数据清理', () => {
    it('应该清理过期的Sitemap数据', async () => {
      // 创建过期数据
      const oldData: SitemapData = {
        ...mockSitemapData[0],
        lastFetched: new Date('2020-01-01') // 很久之前的数据
      };
      
      await service.saveSitemapData([oldData]);
      await service.cleanupExpiredData();
      
      const remainingData = await service.getSitemapData();
      expect(remainingData).toHaveLength(0);
    });

    it('应该清理过期的游戏数据', async () => {
      // 创建过期游戏
      const oldGame: CompetitorGame = {
        ...mockGames[0],
        updatedAt: new Date('2020-01-01')
      };
      
      await service.saveCompetitorGames([oldGame]);
      await service.cleanupExpiredData();
      
      const remainingGames = await service.getCompetitorGames();
      expect(remainingGames).toHaveLength(0);
    });

    it('应该保留最新的数据', async () => {
      const recentData: SitemapData = {
        ...mockSitemapData[0],
        lastFetched: new Date() // 当前时间
      };
      
      await service.saveSitemapData([recentData]);
      await service.cleanupExpiredData();
      
      const remainingData = await service.getSitemapData();
      expect(remainingData).toHaveLength(1);
    });
  });

  describe('数据库统计', () => {
    it('应该返回正确的统计信息', async () => {
      await service.saveWebsiteConfigs(mockWebsiteConfigs);
      await service.saveSitemapData(mockSitemapData);
      await service.saveCompetitorGames(mockGames);
      
      const stats = await service.getDatabaseStats();
      
      expect(stats.websites).toBe(2);
      expect(stats.sitemaps).toBe(1);
      expect(stats.games).toBe(2);
      expect(stats.totalUrls).toBe(2);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
      expect(stats.dataSize).toMatch(/\d+(\.\d+)?\s*(B|KB|MB)$/);
    });

    it('应该处理空数据库的统计', async () => {
      const stats = await service.getDatabaseStats();
      
      expect(stats.websites).toBe(3); // 默认配置
      expect(stats.sitemaps).toBe(0);
      expect(stats.games).toBe(0);
      expect(stats.totalUrls).toBe(0);
      expect(stats.lastUpdated).toBeNull();
    });
  });

  describe('错误处理', () => {
    it('应该处理localStorage错误', async () => {
      // Mock localStorage抛出错误
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await expect(service.saveWebsiteConfigs(mockWebsiteConfigs))
        .rejects.toThrow('Storage quota exceeded');
      
      // 恢复localStorage
      localStorage.setItem = originalSetItem;
    });

    it('应该处理JSON解析错误', async () => {
      localStorage.setItem('competitor_games', 'invalid json');
      
      const games = await service.getCompetitorGames();
      expect(games).toEqual([]);
    });

    it('应该处理搜索中的错误', async () => {
      // Mock getCompetitorGames抛出错误
      jest.spyOn(service, 'getCompetitorGames').mockRejectedValue(new Error('Database error'));
      
      const results = await service.searchGames('test');
      expect(results).toEqual([]);
    });
  });

  describe('工具方法', () => {
    it('应该正确提取游戏名称', async () => {
      const testUrls = [
        'https://example.com/games/super-mario-bros',
        'https://example.com/play/tetris_classic.html',
        'https://example.com/arcade/pac-man'
      ];
      
      const mockSitemaps: SitemapData[] = testUrls.map((url, index) => ({
        websiteId: `site-${index}`,
        websiteName: `Site ${index}`,
        sitemapUrl: `https://site${index}.com/sitemap.xml`,
        urls: [url],
        lastFetched: new Date(),
        status: ScrapingStatus.SUCCESS,
        fetchDuration: 1000,
        totalUrls: 1
      }));
      
      await service.saveSitemapData(mockSitemaps);
      const games = await service.getCompetitorGames();
      
      expect(games.some(g => g.title === 'Super Mario Bros')).toBe(true);
      expect(games.some(g => g.title === 'Tetris Classic')).toBe(true);
      expect(games.some(g => g.title === 'Pac Man')).toBe(true);
    });

    it('应该生成唯一的游戏ID', async () => {
      await service.saveSitemapData(mockSitemapData);
      const games = await service.getCompetitorGames();
      
      const ids = games.map(g => g.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length); // 所有ID都应该是唯一的
    });
  });
}); 