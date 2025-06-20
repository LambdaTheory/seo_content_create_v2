/**
 * 通用网页内容抓取服务
 * 功能特性：
 * - HTTP客户端配置
 * - User-Agent轮换
 * - 请求频率控制
 * - 并发请求管理
 * - 错误重试机制
 * - 请求缓存
 * - 反爬虫规避
 */

/**
 * 抓取配置接口
 */
export interface ScrapingConfig {
  /** 请求超时时间（毫秒） */
  timeout: number;
  /** 重试次数 */
  retries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 请求间隔（毫秒） */
  requestInterval: number;
  /** 并发请求数限制 */
  concurrency: number;
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存TTL（秒） */
  cacheTTL: number;
  /** 是否轮换User-Agent */
  rotateUserAgent: boolean;
  /** 自定义请求头 */
  defaultHeaders: Record<string, string>;
  /** 代理配置 */
  proxy?: ProxyConfig;
}

/**
 * 代理配置接口
 */
export interface ProxyConfig {
  /** 代理协议 */
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  /** 代理主机 */
  host: string;
  /** 代理端口 */
  port: number;
  /** 认证用户名 */
  username?: string;
  /** 认证密码 */
  password?: string;
}

/**
 * 抓取请求参数
 */
export interface ScrapingRequest {
  /** 目标URL */
  url: string;
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体 */
  body?: string | FormData;
  /** 请求优先级 */
  priority?: number;
  /** 自定义配置 */
  config?: Partial<ScrapingConfig>;
  /** 请求元数据 */
  metadata?: Record<string, any>;
}

/**
 * 抓取响应结果
 */
export interface ScrapingResponse {
  /** HTTP状态码 */
  status: number;
  /** 响应状态文本 */
  statusText: string;
  /** 响应头 */
  headers: Record<string, string>;
  /** 响应内容 */
  content: string;
  /** 响应时间（毫秒） */
  responseTime: number;
  /** 最终请求URL（重定向后） */
  finalUrl: string;
  /** 是否来自缓存 */
  fromCache: boolean;
  /** 请求元数据 */
  metadata?: Record<string, any>;
}

/**
 * 抓取错误信息
 */
export interface ScrapingError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 原始错误 */
  originalError?: Error;
  /** 请求URL */
  url: string;
  /** 重试次数 */
  retryCount: number;
  /** 错误时间 */
  timestamp: Date;
}

/**
 * 请求统计信息
 */
export interface ScrapingStats {
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 缓存命中数 */
  cacheHits: number;
  /** 平均响应时间 */
  avgResponseTime: number;
  /** 请求成功率 */
  successRate: number;
  /** 当前并发数 */
  currentConcurrency: number;
  /** 队列等待数 */
  queueLength: number;
}

/**
 * 请求队列项
 */
interface QueueItem {
  request: ScrapingRequest;
  resolve: (response: ScrapingResponse) => void;
  reject: (error: ScrapingError) => void;
  retryCount: number;
  addedAt: Date;
}

/**
 * 缓存项
 */
interface CacheItem {
  response: ScrapingResponse;
  cachedAt: Date;
  expiresAt: Date;
}

/**
 * 通用网页内容抓取服务
 */
export class WebScrapingService {
  private readonly DEFAULT_CONFIG: ScrapingConfig = {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    requestInterval: 1000,
    concurrency: 5,
    enableCache: true,
    cacheTTL: 3600, // 1小时
    rotateUserAgent: true,
    defaultHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  };

  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
  ];

  private config: ScrapingConfig;
  private requestQueue: QueueItem[] = [];
  private activeRequests = new Set<string>();
  private responseCache = new Map<string, CacheItem>();
  private stats: ScrapingStats;
  private lastRequestTime = 0;
  private userAgentIndex = 0;

  constructor(config?: Partial<ScrapingConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.stats = this.initializeStats();
    this.startQueueProcessor();
  }

  /**
   * 发起抓取请求
   * @param request - 请求参数
   * @returns Promise<ScrapingResponse>
   */
  public async scrape(request: ScrapingRequest): Promise<ScrapingResponse> {
    return new Promise((resolve, reject) => {
      const queueItem: QueueItem = {
        request,
        resolve,
        reject,
        retryCount: 0,
        addedAt: new Date()
      };

      // 按优先级插入队列
      const priority = request.priority || 0;
      const insertIndex = this.requestQueue.findIndex(item => 
        (item.request.priority || 0) < priority
      );

      if (insertIndex === -1) {
        this.requestQueue.push(queueItem);
      } else {
        this.requestQueue.splice(insertIndex, 0, queueItem);
      }

      this.updateStats();
    });
  }

  /**
   * 批量抓取请求
   * @param requests - 请求列表
   * @returns Promise<ScrapingResponse[]>
   */
  public async batchScrape(requests: ScrapingRequest[]): Promise<ScrapingResponse[]> {
    const promises = requests.map(request => this.scrape(request));
    return Promise.all(promises);
  }

  /**
   * 检查URL是否可访问
   * @param url - 目标URL
   * @returns Promise<boolean>
   */
  public async isAccessible(url: string): Promise<boolean> {
    try {
      const response = await this.scrape({
        url,
        method: 'HEAD',
        config: { retries: 1, timeout: 10000 }
      });
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }

  /**
   * 获取统计信息
   * @returns 统计数据
   */
  public getStats(): ScrapingStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
    this.stats = this.initializeStats();
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * 更新配置
   * @param newConfig - 新配置
   */
  public updateConfig(newConfig: Partial<ScrapingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   * @returns 当前配置
   */
  public getConfig(): ScrapingConfig {
    return { ...this.config };
  }

  /**
   * 启动队列处理器
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 100); // 每100ms检查一次队列
  }

  /**
   * 处理请求队列
   */
  private processQueue(): void {
    if (this.requestQueue.length === 0) return;
    if (this.activeRequests.size >= this.config.concurrency) return;

    // 检查请求间隔
    const now = Date.now();
    if (now - this.lastRequestTime < this.config.requestInterval) {
      return;
    }

    const queueItem = this.requestQueue.shift();
    if (!queueItem) return;

    this.lastRequestTime = now;
    // 异步处理请求，不阻塞队列处理
    this.processRequest(queueItem).catch(() => {
      // 错误已在processRequest中处理，这里只是防止未捕获的Promise rejection
    });
  }

  /**
   * 处理单个请求
   * @param queueItem - 队列项
   */
  private async processRequest(queueItem: QueueItem): Promise<void> {
    const { request, resolve, reject } = queueItem;
    const requestId = this.generateRequestId(request);

    try {
      this.activeRequests.add(requestId);
      
      // 检查缓存
      if (this.config.enableCache) {
        const cachedResponse = this.getCachedResponse(request.url);
        if (cachedResponse) {
          this.stats.cacheHits++;
          this.updateStats();
          resolve(cachedResponse);
          return;
        }
      }

      // 执行请求
      const response = await this.executeRequest(request);
      
      // 缓存响应
      if (this.config.enableCache && response.status === 200) {
        this.cacheResponse(request.url, response);
      }

      this.stats.successRequests++;
      this.updateStats();
      resolve(response);

    } catch (error) {
      this.handleRequestError(queueItem, error as Error);
    } finally {
      this.activeRequests.delete(requestId);
      this.updateStats();
    }
  }

  /**
   * 执行HTTP请求
   * @param request - 请求参数
   * @returns Promise<ScrapingResponse>
   */
  private async executeRequest(request: ScrapingRequest): Promise<ScrapingResponse> {
    const mergedConfig = { ...this.config, ...request.config };
    const startTime = Date.now();

    // 准备请求头
    const headers = {
      ...this.config.defaultHeaders,
      ...request.headers
    };

    // 轮换User-Agent
    if (mergedConfig.rotateUserAgent) {
      headers['User-Agent'] = this.getNextUserAgent();
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout);

    try {
      const response = await fetch(request.url, {
        method: request.method || 'GET',
        headers,
        body: request.body,
        signal: controller.signal,
        // 不自动跟随重定向，手动处理
        redirect: 'manual'
      });

      clearTimeout(timeoutId);

      // 处理重定向
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          // 递归处理重定向
          return this.executeRequest({
            ...request,
            url: new URL(location, request.url).href
          });
        }
      }

      const content = await response.text();
      const responseTime = Date.now() - startTime;

      // 构造响应头对象
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        content,
        responseTime,
        finalUrl: response.url,
        fromCache: false,
        metadata: request.metadata
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时: ${mergedConfig.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * 处理请求错误
   * @param queueItem - 队列项
   * @param error - 错误对象
   */
  private handleRequestError(queueItem: QueueItem, error: Error): void {
    const { request, resolve, reject } = queueItem;
    const mergedConfig = { ...this.config, ...request.config };

    queueItem.retryCount++;

    if (queueItem.retryCount <= mergedConfig.retries) {
      // 延迟重试
      setTimeout(() => {
        this.requestQueue.unshift(queueItem);
      }, mergedConfig.retryDelay * queueItem.retryCount);
    } else {
      // 超过重试次数，返回错误
      this.stats.failedRequests++;
      this.updateStats();

      const scrapingError: ScrapingError = {
        code: 'MAX_RETRIES_EXCEEDED',
        message: `请求失败，已重试 ${mergedConfig.retries} 次: ${error.message}`,
        originalError: error,
        url: request.url,
        retryCount: queueItem.retryCount,
        timestamp: new Date()
      };

      reject(scrapingError);
    }
  }

  /**
   * 获取缓存的响应
   * @param url - 请求URL
   * @returns 缓存的响应或null
   */
  private getCachedResponse(url: string): ScrapingResponse | null {
    const cacheKey = this.generateCacheKey(url);
    const cacheItem = this.responseCache.get(cacheKey);

    if (cacheItem && cacheItem.expiresAt > new Date()) {
      return {
        ...cacheItem.response,
        fromCache: true
      };
    }

    // 清理过期缓存
    if (cacheItem) {
      this.responseCache.delete(cacheKey);
    }

    return null;
  }

  /**
   * 缓存响应
   * @param url - 请求URL
   * @param response - 响应对象
   */
  private cacheResponse(url: string, response: ScrapingResponse): void {
    const cacheKey = this.generateCacheKey(url);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.cacheTTL * 1000);

    this.responseCache.set(cacheKey, {
      response: { ...response },
      cachedAt: now,
      expiresAt
    });

    // 定期清理过期缓存
    this.cleanupExpiredCache();
  }

  /**
   * 获取下一个User-Agent
   * @returns User-Agent字符串
   */
  private getNextUserAgent(): string {
    const userAgent = this.USER_AGENTS[this.userAgentIndex];
    this.userAgentIndex = (this.userAgentIndex + 1) % this.USER_AGENTS.length;
    return userAgent;
  }

  /**
   * 生成请求ID
   * @param request - 请求参数
   * @returns 请求ID
   */
  private generateRequestId(request: ScrapingRequest): string {
    return `${request.method || 'GET'}_${request.url}_${Date.now()}`;
  }

  /**
   * 生成缓存键
   * @param url - 请求URL
   * @returns 缓存键
   */
  private generateCacheKey(url: string): string {
    return `cache_${btoa(url)}`;
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = new Date();
    for (const [key, item] of this.responseCache.entries()) {
      if (item.expiresAt <= now) {
        this.responseCache.delete(key);
      }
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalRequests = this.stats.successRequests + this.stats.failedRequests;
    this.stats.successRate = this.stats.totalRequests > 0 
      ? this.stats.successRequests / this.stats.totalRequests 
      : 0;
    this.stats.currentConcurrency = this.activeRequests.size;
    this.stats.queueLength = this.requestQueue.length;

    // 计算平均响应时间需要额外的统计数据
    // 这里简化处理，实际实现中应该维护响应时间历史
  }

  /**
   * 初始化统计信息
   * @returns 初始统计数据
   */
  private initializeStats(): ScrapingStats {
    return {
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      avgResponseTime: 0,
      successRate: 0,
      currentConcurrency: 0,
      queueLength: 0
    };
  }

  /**
   * 销毁服务，清理资源
   */
  public destroy(): void {
    this.requestQueue = [];
    this.activeRequests.clear();
    this.responseCache.clear();
  }
} 