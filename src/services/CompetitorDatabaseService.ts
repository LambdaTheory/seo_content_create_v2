import { 
  CompetitorWebsiteConfig, 
  SitemapData, 
  CompetitorGame, 
  ScrapingStatus 
} from '@/types/Competitor.types';

/**
 * 竞品数据库管理服务
 * 功能特性：
 * - 本地存储结构设计
 * - 游戏索引创建和管理
 * - 数据更新机制
 * - 过期数据清理
 * - 数据查询和检索
 */
export class CompetitorDatabaseService {
  private readonly STORAGE_KEYS = {
    WEBSITES: 'competitor_websites',
    SITEMAP_DATA: 'competitor_sitemaps',
    GAMES: 'competitor_games',
    GAME_INDEX: 'competitor_game_index',
    METADATA: 'competitor_metadata'
  };

  private readonly DEFAULT_EXPIRY_DAYS = 7; // 默认7天过期
  private readonly INDEX_VERSION = '1.0.0';

  /**
   * 初始化数据库
   */
  async initializeDatabase(): Promise<void> {
    try {
      console.log('🔧 初始化竞品数据库...');
      
      // 检查并创建基础存储结构
      await this.ensureStorageStructure();
      
      // 创建或更新索引
      await this.createIndexes();
      
      // 清理过期数据
      await this.cleanupExpiredData();
      
      console.log('✅ 竞品数据库初始化完成');
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 保存网站配置
   * @param websites - 网站配置列表
   */
  async saveWebsiteConfigs(websites: CompetitorWebsiteConfig[]): Promise<void> {
    try {
      const data = {
        websites,
        updatedAt: new Date().toISOString(),
        version: this.INDEX_VERSION
      };
      
      localStorage.setItem(this.STORAGE_KEYS.WEBSITES, JSON.stringify(data));
      console.log(`💾 已保存 ${websites.length} 个网站配置`);
    } catch (error) {
      console.error('❌ 保存网站配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取网站配置
   * @returns CompetitorWebsiteConfig[]
   */
  async getWebsiteConfigs(): Promise<CompetitorWebsiteConfig[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.WEBSITES);
      if (!stored) {
        return this.getDefaultWebsiteConfigs();
      }

      const data = JSON.parse(stored);
      return data.websites || this.getDefaultWebsiteConfigs();
    } catch (error) {
      console.warn('⚠️ 获取网站配置失败，使用默认配置:', error);
      return this.getDefaultWebsiteConfigs();
    }
  }

  /**
   * 保存Sitemap数据
   * @param sitemapData - Sitemap数据列表
   */
  async saveSitemapData(sitemapData: SitemapData[]): Promise<void> {
    try {
      const existingData = await this.getSitemapData();
      const dataMap = new Map(existingData.map(data => [data.websiteId, data]));
      
      // 更新或添加新数据
      sitemapData.forEach(data => {
        dataMap.set(data.websiteId, {
          ...data,
          lastFetched: new Date(data.lastFetched)
        });
      });

      const mergedData = {
        sitemaps: Array.from(dataMap.values()),
        updatedAt: new Date().toISOString(),
        totalUrls: Array.from(dataMap.values()).reduce((sum, data) => sum + data.totalUrls, 0)
      };

      localStorage.setItem(this.STORAGE_KEYS.SITEMAP_DATA, JSON.stringify(mergedData));
      console.log(`💾 已保存 ${sitemapData.length} 个网站的Sitemap数据`);
      
      // 更新游戏索引
      await this.updateGameIndexFromSitemaps(Array.from(dataMap.values()));
    } catch (error) {
      console.error('❌ 保存Sitemap数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取Sitemap数据
   * @returns SitemapData[]
   */
  async getSitemapData(): Promise<SitemapData[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SITEMAP_DATA);
      if (!stored) return [];

      const data = JSON.parse(stored);
      return (data.sitemaps || []).map((sitemap: any) => ({
        ...sitemap,
        lastFetched: new Date(sitemap.lastFetched)
      }));
    } catch (error) {
      console.warn('⚠️ 获取Sitemap数据失败:', error);
      return [];
    }
  }

  /**
   * 从Sitemap数据更新游戏索引
   * @param sitemapData - Sitemap数据列表
   */
  private async updateGameIndexFromSitemaps(sitemapData: SitemapData[]): Promise<void> {
    try {
      const existingGames = await this.getCompetitorGames();
      const gamesMap = new Map(existingGames.map(game => [game.url, game]));

      let newGamesCount = 0;
      let updatedGamesCount = 0;

      for (const sitemap of sitemapData) {
        if (sitemap.status !== ScrapingStatus.SUCCESS) continue;

        for (const url of sitemap.urls) {
          const gameId = this.generateGameId(url);
          const gameName = this.extractGameNameFromUrl(url);
          
          if (gamesMap.has(url)) {
            // 更新现有游戏
            const existingGame = gamesMap.get(url)!;
            gamesMap.set(url, {
              ...existingGame,
              updatedAt: new Date(),
              processed: false // 标记为需要重新处理
            });
            updatedGamesCount++;
          } else {
            // 添加新游戏
            const newGame: CompetitorGame = {
              id: gameId,
              websiteId: sitemap.websiteId,
              websiteName: sitemap.websiteName,
              title: gameName,
              url,
              tags: [],
              crawledAt: new Date(),
              updatedAt: new Date(),
              processed: false
            };
            gamesMap.set(url, newGame);
            newGamesCount++;
          }
        }
      }

      await this.saveCompetitorGames(Array.from(gamesMap.values()));
      console.log(`🔄 游戏索引更新完成: ${newGamesCount} 新增, ${updatedGamesCount} 更新`);
    } catch (error) {
      console.error('❌ 更新游戏索引失败:', error);
      throw error;
    }
  }

  /**
   * 保存竞品游戏数据
   * @param games - 游戏列表
   */
  async saveCompetitorGames(games: CompetitorGame[]): Promise<void> {
    try {
      const data = {
        games,
        updatedAt: new Date().toISOString(),
        totalGames: games.length,
        version: this.INDEX_VERSION
      };
      
      localStorage.setItem(this.STORAGE_KEYS.GAMES, JSON.stringify(data));
      
      // 同时更新索引
      await this.updateGameIndex(games);
      
      console.log(`💾 已保存 ${games.length} 个竞品游戏`);
    } catch (error) {
      console.error('❌ 保存竞品游戏失败:', error);
      throw error;
    }
  }

  /**
   * 获取竞品游戏数据
   * @returns CompetitorGame[]
   */
  async getCompetitorGames(): Promise<CompetitorGame[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.GAMES);
      if (!stored) return [];

      const data = JSON.parse(stored);
      return (data.games || []).map((game: any) => ({
        ...game,
        crawledAt: new Date(game.crawledAt),
        updatedAt: new Date(game.updatedAt)
      }));
    } catch (error) {
      console.warn('⚠️ 获取竞品游戏失败:', error);
      return [];
    }
  }

  /**
   * 按网站ID获取游戏
   * @param websiteId - 网站ID
   * @returns CompetitorGame[]
   */
  async getGamesByWebsite(websiteId: string): Promise<CompetitorGame[]> {
    const allGames = await this.getCompetitorGames();
    return allGames.filter(game => game.websiteId === websiteId);
  }

  /**
   * 搜索竞品游戏
   * @param query - 搜索查询
   * @param options - 搜索选项
   * @returns CompetitorGame[]
   */
  async searchGames(
    query: string, 
    options: {
      websiteId?: string;
      limit?: number;
      includeProcessed?: boolean;
    } = {}
  ): Promise<CompetitorGame[]> {
    try {
      const allGames = await this.getCompetitorGames();
      const normalizedQuery = query.toLowerCase().trim();
      
      let filtered = allGames.filter(game => {
        // 网站过滤
        if (options.websiteId && game.websiteId !== options.websiteId) {
          return false;
        }
        
        // 处理状态过滤
        if (options.includeProcessed === false && game.processed) {
          return false;
        }
        
        // 文本搜索
        if (normalizedQuery) {
          const titleMatch = game.title.toLowerCase().includes(normalizedQuery);
          const descMatch = game.description?.toLowerCase().includes(normalizedQuery);
          const tagMatch = game.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
          
          return titleMatch || descMatch || tagMatch;
        }
        
        return true;
      });

      // 按相关性和更新时间排序
      filtered.sort((a, b) => {
        // 优先显示未处理的
        if (a.processed !== b.processed) {
          return a.processed ? 1 : -1;
        }
        // 然后按更新时间
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      return options.limit ? filtered.slice(0, options.limit) : filtered;
    } catch (error) {
      console.error('❌ 搜索游戏失败:', error);
      return [];
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      const expiryDate = new Date(now.getTime() - this.DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      
      // 清理过期的Sitemap数据
      const sitemapData = await this.getSitemapData();
      const validSitemaps = sitemapData.filter(data => 
        new Date(data.lastFetched) > expiryDate
      );
      
      if (validSitemaps.length !== sitemapData.length) {
        await this.saveSitemapData(validSitemaps);
        console.log(`🧹 清理了 ${sitemapData.length - validSitemaps.length} 个过期Sitemap`);
      }

      // 清理过期的游戏数据
      const games = await this.getCompetitorGames();
      const validGames = games.filter(game => 
        new Date(game.updatedAt) > expiryDate
      );
      
      if (validGames.length !== games.length) {
        await this.saveCompetitorGames(validGames);
        console.log(`🧹 清理了 ${games.length - validGames.length} 个过期游戏`);
      }

      // 更新元数据
      await this.updateMetadata();
      
    } catch (error) {
      console.error('❌ 清理过期数据失败:', error);
    }
  }

  /**
   * 获取数据库统计信息
   */
  async getDatabaseStats(): Promise<{
    websites: number;
    sitemaps: number;
    games: number;
    totalUrls: number;
    lastUpdated: Date | null;
    dataSize: string;
  }> {
    try {
      const websites = await this.getWebsiteConfigs();
      const sitemaps = await this.getSitemapData();
      const games = await this.getCompetitorGames();
      
      const totalUrls = sitemaps.reduce((sum, data) => sum + data.totalUrls, 0);
      const lastUpdated = sitemaps.length > 0 
        ? new Date(Math.max(...sitemaps.map(s => s.lastFetched.getTime())))
        : null;
      
      // 计算数据大小
      const dataSize = this.calculateStorageSize();
      
      return {
        websites: websites.length,
        sitemaps: sitemaps.length,
        games: games.length,
        totalUrls,
        lastUpdated,
        dataSize
      };
    } catch (error) {
      console.error('❌ 获取数据库统计失败:', error);
      return {
        websites: 0,
        sitemaps: 0,
        games: 0,
        totalUrls: 0,
        lastUpdated: null,
        dataSize: '0 KB'
      };
    }
  }

  /**
   * 确保存储结构存在
   */
  private async ensureStorageStructure(): Promise<void> {
    // 检查各个存储键是否存在，不存在则初始化
    const keys = Object.values(this.STORAGE_KEYS);
    for (const key of keys) {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({}));
      }
    }
  }

  /**
   * 创建索引
   */
  private async createIndexes(): Promise<void> {
    try {
      const games = await this.getCompetitorGames();
      await this.updateGameIndex(games);
    } catch (error) {
      console.warn('⚠️ 创建索引失败:', error);
    }
  }

  /**
   * 更新游戏索引
   * @param games - 游戏列表
   */
  private async updateGameIndex(games: CompetitorGame[]): Promise<void> {
    try {
      // 按网站分组索引
      const websiteIndex = new Map<string, string[]>();
      // 按标题首字母索引
      const titleIndex = new Map<string, string[]>();
      // 按标签索引
      const tagIndex = new Map<string, string[]>();

      games.forEach(game => {
        // 网站索引
        if (!websiteIndex.has(game.websiteId)) {
          websiteIndex.set(game.websiteId, []);
        }
        websiteIndex.get(game.websiteId)!.push(game.id);

        // 标题索引
        const firstChar = game.title.charAt(0).toUpperCase();
        if (!titleIndex.has(firstChar)) {
          titleIndex.set(firstChar, []);
        }
        titleIndex.get(firstChar)!.push(game.id);

        // 标签索引
        game.tags.forEach(tag => {
          if (!tagIndex.has(tag)) {
            tagIndex.set(tag, []);
          }
          tagIndex.get(tag)!.push(game.id);
        });
      });

      const indexData = {
        websiteIndex: Object.fromEntries(websiteIndex),
        titleIndex: Object.fromEntries(titleIndex),
        tagIndex: Object.fromEntries(tagIndex),
        updatedAt: new Date().toISOString(),
        totalGames: games.length,
        version: this.INDEX_VERSION
      };

      localStorage.setItem(this.STORAGE_KEYS.GAME_INDEX, JSON.stringify(indexData));
    } catch (error) {
      console.error('❌ 更新游戏索引失败:', error);
    }
  }

  /**
   * 更新元数据
   */
  private async updateMetadata(): Promise<void> {
    try {
      const metadata = {
        lastCleanup: new Date().toISOString(),
        version: this.INDEX_VERSION,
        expiryDays: this.DEFAULT_EXPIRY_DAYS
      };
      
      localStorage.setItem(this.STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.warn('⚠️ 更新元数据失败:', error);
    }
  }

  /**
   * 计算存储大小
   */
  private calculateStorageSize(): string {
    try {
      let totalSize = 0;
      Object.values(this.STORAGE_KEYS).forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      });

      if (totalSize < 1024) {
        return `${totalSize} B`;
      } else if (totalSize < 1024 * 1024) {
        return `${(totalSize / 1024).toFixed(1)} KB`;
      } else {
        return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
      }
    } catch (error) {
      return '未知';
    }
  }

  /**
   * 从URL提取游戏名称
   * @param url - 游戏URL
   * @returns 游戏名称
   */
  private extractGameNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      
      // 去除文件扩展名
      const nameWithoutExt = lastPart.replace(/\.[^/.]+$/, '');
      
      // 转换为可读格式
      return nameWithoutExt
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
    } catch (error) {
      return 'Unknown Game';
    }
  }

  /**
   * 生成游戏ID
   * @param url - 游戏URL
   * @returns 游戏ID
   */
  private generateGameId(url: string): string {
    // 使用URL的hash作为ID，确保唯一性
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * 获取默认网站配置
   * @returns CompetitorWebsiteConfig[]
   */
  private getDefaultWebsiteConfigs(): CompetitorWebsiteConfig[] {
    return [
      {
        id: 'coolmathgames',
        name: 'Cool Math Games',
        baseUrl: 'https://www.coolmathgames.com',
        sitemapUrl: 'https://www.coolmathgames.com/sitemap.xml',
        enabled: true,
        scraping: {
          urlPattern: '/0-',
          maxPages: 5000,
          requestDelay: 2000
        }
      },
      {
        id: 'gamedistribution',
        name: 'Game Distribution',
        baseUrl: 'https://gamedistribution.com',
        sitemapUrl: 'https://gamedistribution.com/sitemap-games-1.xml',
        enabled: true,
        scraping: {
          urlPattern: '/games/',
          maxPages: 10000,
          requestDelay: 1500
        }
      },
      {
        id: 'twoplayergames',
        name: 'Two Player Games',
        baseUrl: 'https://www.twoplayergames.org',
        sitemapUrl: 'https://www.twoplayergames.org/sitemap-games.xml',
        enabled: true,
        scraping: {
          urlPattern: '/game/',
          maxPages: 3000,
          requestDelay: 2500
        }
      }
    ];
  }
}

// 导出单例实例
export const competitorDatabaseService = new CompetitorDatabaseService(); 