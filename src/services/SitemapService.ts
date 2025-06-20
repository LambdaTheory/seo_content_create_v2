import { CompetitorWebsiteConfig, SitemapData, ScrapingStatus } from '@/types/Competitor.types';

/**
 * Sitemap抓取和解析服务
 * 功能特性：
 * - HTTP请求服务
 * - XML解析功能
 * - 网络异常处理
 * - 请求重试机制
 * - 数据验证和清洗
 */
export class SitemapService {
  private readonly defaultTimeout = 30000; // 30秒超时
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1秒重试间隔

  /**
   * 抓取网站的sitemap.xml
   * @param config - 竞品网站配置
   * @returns Promise<SitemapData>
   */
  async fetchSitemap(config: CompetitorWebsiteConfig): Promise<SitemapData> {
    const startTime = Date.now();
    
    try {
      console.log(`开始抓取 ${config.name} 的sitemap: ${config.sitemapUrl}`);
      
      const response = await this.performRequest(config.sitemapUrl);
      const xmlContent = await response.text();
      
      if (!xmlContent || xmlContent.trim().length === 0) {
        throw new Error('Sitemap内容为空');
      }

      const urls = await this.parseSitemapXml(xmlContent, config);
      
      const result: SitemapData = {
        websiteId: config.id,
        websiteName: config.name,
        sitemapUrl: config.sitemapUrl,
        urls,
        lastFetched: new Date(),
        status: ScrapingStatus.SUCCESS,
        fetchDuration: Date.now() - startTime,
        totalUrls: urls.length,
        errorMessage: undefined
      };

      console.log(`✅ ${config.name} sitemap抓取成功: ${urls.length} 个URL`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error(`❌ ${config.name} sitemap抓取失败:`, errorMessage);
      
      return {
        websiteId: config.id,
        websiteName: config.name,
        sitemapUrl: config.sitemapUrl,
        urls: [],
        lastFetched: new Date(),
        status: ScrapingStatus.FAILED,
        fetchDuration: Date.now() - startTime,
        totalUrls: 0,
        errorMessage
      };
    }
  }

  /**
   * 执行HTTP请求，带重试机制
   * @param url - 请求URL
   * @returns Promise<Response>
   */
  private async performRequest(url: string): Promise<Response> {
    let lastError: Error = new Error('未知错误');
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`尝试请求 (${attempt}/${this.maxRetries}): ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log(`✅ 请求成功: ${url}`);
        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ 请求失败 (${attempt}/${this.maxRetries}):`, lastError.message);
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt); // 递增延迟
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 解析sitemap XML内容
   * @param xmlContent - XML字符串
   * @param config - 网站配置
   * @returns Promise<string[]>
   */
  private async parseSitemapXml(xmlContent: string, config: CompetitorWebsiteConfig): Promise<string[]> {
    try {
      // 使用浏览器内置的DOMParser解析XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // 检查解析错误
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error(`XML解析错误: ${parseError.textContent}`);
      }

      // 处理两种常见的sitemap格式
      const urls: string[] = [];
      
      // 标准sitemap格式：<urlset><url><loc>...</loc></url></urlset>
      const urlElements = xmlDoc.querySelectorAll('url > loc');
      urlElements.forEach(locElement => {
        const url = locElement.textContent?.trim();
        if (url && this.isValidGameUrl(url, config)) {
          urls.push(url);
        }
      });

      // Sitemap index格式：<sitemapindex><sitemap><loc>...</loc></sitemap></sitemapindex>
      if (urls.length === 0) {
        const sitemapElements = xmlDoc.querySelectorAll('sitemap > loc');
        for (const locElement of sitemapElements) {
          const sitemapUrl = locElement.textContent?.trim();
          if (sitemapUrl) {
            try {
              const subSitemapUrls = await this.fetchSubSitemap(sitemapUrl, config);
              urls.push(...subSitemapUrls);
            } catch (error) {
              console.warn(`⚠️ 抓取子sitemap失败: ${sitemapUrl}`, error);
            }
          }
        }
      }

      return this.filterAndSortUrls(urls, config);

    } catch (error) {
      throw new Error(`XML解析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 抓取子sitemap
   * @param sitemapUrl - 子sitemap URL
   * @param config - 网站配置
   * @returns Promise<string[]>
   */
  private async fetchSubSitemap(sitemapUrl: string, config: CompetitorWebsiteConfig): Promise<string[]> {
    const response = await this.performRequest(sitemapUrl);
    const xmlContent = await response.text();
    return await this.parseSitemapXml(xmlContent, config);
  }

  /**
   * 验证URL是否为有效的游戏页面
   * @param url - 待验证的URL
   * @param config - 网站配置
   * @returns boolean
   */
  private isValidGameUrl(url: string, config: CompetitorWebsiteConfig): boolean {
    try {
      const urlObj = new URL(url);
      
      // 检查域名是否匹配
      if (urlObj.hostname !== new URL(config.baseUrl).hostname) {
        return false;
      }

      // 根据网站配置的URL模式进行过滤
      const urlPattern = config.scraping?.urlPattern;
      if (urlPattern) {
        const regex = new RegExp(urlPattern);
        return regex.test(url);
      }

      // 默认过滤规则：排除非游戏页面
      const excludePatterns = [
        '/sitemap',
        '/rss',
        '/feed',
        '/api/',
        '/admin/',
        '/search',
        '/category',
        '/tag/',
        '/page/',
        '/blog/',
        '/news/',
        '.xml',
        '.json',
        '.css',
        '.js',
        '.png',
        '.jpg',
        '.gif',
        '.ico'
      ];

      const path = urlObj.pathname.toLowerCase();
      return !excludePatterns.some(pattern => path.includes(pattern));

    } catch (error) {
      console.warn(`⚠️ URL验证失败: ${url}`, error);
      return false;
    }
  }

  /**
   * 过滤和排序URL列表
   * @param urls - URL列表
   * @param config - 网站配置
   * @returns string[]
   */
  private filterAndSortUrls(urls: string[], config: CompetitorWebsiteConfig): string[] {
    // 去重
    const uniqueUrls = Array.from(new Set(urls));
    
    // 根据配置限制数量
    const maxUrls = config.scraping?.maxPages || 10000;
    
    // 排序：优先选择路径较短、看起来像游戏页面的URL
    const sortedUrls = uniqueUrls.sort((a, b) => {
      // 优先级1：路径长度（越短越好）
      const pathLengthDiff = new URL(a).pathname.length - new URL(b).pathname.length;
      if (pathLengthDiff !== 0) return pathLengthDiff;
      
      // 优先级2：字母序
      return a.localeCompare(b);
    });

    return sortedUrls.slice(0, maxUrls);
  }

  /**
   * 获取随机User-Agent
   * @returns string
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * 延迟执行
   * @param ms - 延迟毫秒数
   * @returns Promise<void>
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 批量抓取多个网站的sitemap
   * @param configs - 网站配置列表
   * @returns Promise<SitemapData[]>
   */
  async fetchMultipleSitemaps(configs: CompetitorWebsiteConfig[]): Promise<SitemapData[]> {
    console.log(`开始批量抓取 ${configs.length} 个网站的sitemap...`);
    
    const results = await Promise.allSettled(
      configs.map(config => this.fetchSitemap(config))
    );

    const sitemapData = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`网站 ${configs[index].name} 抓取失败:`, result.reason);
        return {
          websiteId: configs[index].id,
          websiteName: configs[index].name,
          sitemapUrl: configs[index].sitemapUrl,
          urls: [],
          lastFetched: new Date(),
          status: ScrapingStatus.FAILED,
          fetchDuration: 0,
          totalUrls: 0,
          errorMessage: result.reason?.message || '抓取失败'
        } as SitemapData;
      }
    });

    const successCount = sitemapData.filter(data => data.status === ScrapingStatus.SUCCESS).length;
    const totalUrls = sitemapData.reduce((sum, data) => sum + data.totalUrls, 0);
    
    console.log(`✅ 批量抓取完成: ${successCount}/${configs.length} 成功, 共 ${totalUrls} 个URL`);
    
    return sitemapData;
  }
}

// 导出单例实例
export const sitemapService = new SitemapService(); 