/**
 * 多级缓存服务
 * 实现内存缓存 + 本地存储缓存的多级架构
 * 支持缓存命中优化、内存监控和过期策略
 */

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间(秒)
  accessCount: number;
  lastAccess: number;
  size: number; // 数据大小(字节)
}

export interface CacheConfig {
  /** 内存缓存最大条目数 */
  memoryMaxItems: number;
  /** 内存缓存最大大小(MB) */
  memoryMaxSize: number;
  /** 本地存储缓存最大条目数 */
  localStorageMaxItems: number;
  /** 默认TTL(秒) */
  defaultTtl: number;
  /** 清理策略 */
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO';
  /** 自动清理间隔(毫秒) */
  cleanupInterval: number;
}

export interface CacheStats {
  /** 内存缓存统计 */
  memory: {
    items: number;
    size: number;
    maxSize: number;
    hitRate: number;
    missRate: number;
  };
  /** 本地存储缓存统计 */
  localStorage: {
    items: number;
    hitRate: number;
    missRate: number;
  };
  /** 总体统计 */
  total: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

/**
 * 多级缓存服务类
 */
export class MultiLevelCacheService {
  private memoryCache = new Map<string, CacheItem>();
  private config: CacheConfig;
  private stats = {
    memory: { hits: 0, misses: 0 },
    localStorage: { hits: 0, misses: 0 },
    total: { hits: 0, misses: 0 }
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      memoryMaxItems: 1000,
      memoryMaxSize: 50, // 50MB
      localStorageMaxItems: 500,
      defaultTtl: 3600, // 1小时
      evictionPolicy: 'LRU',
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      ...config
    };

    this.startCleanupTimer();
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 生存时间(秒)，默认使用配置的defaultTtl
   * @param forceLocalStorage 强制存储到本地存储
   */
  async set<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    forceLocalStorage = false
  ): Promise<void> {
    const finalTtl = ttl !== undefined ? ttl : this.config.defaultTtl;
    
    // 如果TTL为0，不缓存数据（立即过期）
    if (finalTtl === 0) {
      return;
    }
    
    const now = Date.now();
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: finalTtl,
      accessCount: 0,
      lastAccess: now,
      size: this.calculateSize(data)
    };

    // 内存缓存优先级判断
    if (!forceLocalStorage && this.shouldCacheInMemory(cacheItem)) {
      await this.setMemoryCache(key, cacheItem);
    }

    // 本地存储缓存
    await this.setLocalStorageCache(key, cacheItem);
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. 先检查内存缓存
    const memoryItem = this.getMemoryCache<T>(key);
    if (memoryItem) {
      this.stats.memory.hits++;
      this.stats.total.hits++;
      return memoryItem.data;
    }
    this.stats.memory.misses++;

    // 2. 检查本地存储缓存
    const localStorageItem = await this.getLocalStorageCache<T>(key);
    if (localStorageItem) {
      this.stats.localStorage.hits++;
      this.stats.total.hits++;
      
      // 将热数据提升到内存缓存
      if (this.shouldPromoteToMemory(localStorageItem)) {
        await this.setMemoryCache(key, localStorageItem);
      }
      
      return localStorageItem.data;
    }
    this.stats.localStorage.misses++;
    this.stats.total.misses++;

    return null;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  async delete(key: string): Promise<void> {
    // 删除内存缓存
    this.memoryCache.delete(key);
    
    // 删除本地存储缓存
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`cache_${key}`);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    // 清空内存缓存
    this.memoryCache.clear();
    
    // 清空本地存储缓存
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    }
    
    // 重置统计
    this.resetStats();
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const memorySize = this.calculateMemorySize();
    const memoryMaxSize = this.config.memoryMaxSize * 1024 * 1024; // 转换为字节
    
    return {
      memory: {
        items: this.memoryCache.size,
        size: memorySize,
        maxSize: memoryMaxSize,
        hitRate: this.calculateHitRate(this.stats.memory),
        missRate: this.calculateMissRate(this.stats.memory)
      },
      localStorage: {
        items: this.getLocalStorageItemCount(),
        hitRate: this.calculateHitRate(this.stats.localStorage),
        missRate: this.calculateMissRate(this.stats.localStorage)
      },
      total: {
        hits: this.stats.total.hits,
        misses: this.stats.total.misses,
        hitRate: this.calculateHitRate(this.stats.total)
      }
    };
  }

  /**
   * 手动清理过期缓存
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    
    // 清理内存缓存
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item, now)) {
        this.memoryCache.delete(key);
      }
    }
    
    // 清理本地存储缓存
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
      for (const key of keys) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}') as CacheItem;
          if (this.isExpired(item, now)) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // 删除损坏的缓存项
          localStorage.removeItem(key);
        }
      }
    }
    
    // 如果内存使用超限，进行清理
    await this.evictIfNeeded();
  }

  /**
   * 销毁缓存服务
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.memoryCache.clear();
  }

  // ============ 私有方法 ============

  /**
   * 设置内存缓存
   */
  private async setMemoryCache<T>(key: string, item: CacheItem<T>): Promise<void> {
    // 检查是否需要清理
    await this.evictIfNeeded();
    
    this.memoryCache.set(key, item);
  }

  /**
   * 获取内存缓存
   */
  private getMemoryCache<T>(key: string): CacheItem<T> | null {
    const item = this.memoryCache.get(key) as CacheItem<T>;
    if (!item) return null;
    
    const now = Date.now();
    if (this.isExpired(item, now)) {
      this.memoryCache.delete(key);
      return null;
    }
    
    // 更新访问信息
    item.accessCount++;
    item.lastAccess = now;
    
    return item;
  }

  /**
   * 设置本地存储缓存
   */
  private async setLocalStorageCache<T>(key: string, item: CacheItem<T>): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    
    try {
      // 检查本地存储容量限制
      await this.evictLocalStorageIfNeeded();
      
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('本地存储缓存设置失败:', error);
    }
  }

  /**
   * 获取本地存储缓存
   */
  private async getLocalStorageCache<T>(key: string): Promise<CacheItem<T> | null> {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (!stored) return null;
      
      const item = JSON.parse(stored) as CacheItem<T>;
      const now = Date.now();
      
      if (this.isExpired(item, now)) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      // 更新访问信息并重新保存
      item.accessCount++;
      item.lastAccess = now;
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
      
      return item;
    } catch (error) {
      console.warn('本地存储缓存读取失败:', error);
      // 删除损坏的缓存项
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
  }

  /**
   * 判断是否应该缓存到内存
   */
  private shouldCacheInMemory<T>(item: CacheItem<T>): boolean {
    // 数据太大不适合内存缓存
    if (item.size > 1024 * 1024) { // 1MB
      return false;
    }
    
    // 检查内存缓存容量
    const currentSize = this.calculateMemorySize();
    const maxSize = this.config.memoryMaxSize * 1024 * 1024;
    
    return currentSize + item.size <= maxSize;
  }

  /**
   * 判断是否应该提升到内存缓存
   */
  private shouldPromoteToMemory<T>(item: CacheItem<T>): boolean {
    // 访问频率高的数据提升到内存
    return item.accessCount >= 2 && this.shouldCacheInMemory(item);
  }

  /**
   * 计算数据大小（字节）
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // 备用计算方法
      return JSON.stringify(data).length * 2; // 粗略估算
    }
  }

  /**
   * 计算内存缓存总大小
   */
  private calculateMemorySize(): number {
    let totalSize = 0;
    for (const item of this.memoryCache.values()) {
      totalSize += item.size;
    }
    return totalSize;
  }

  /**
   * 获取本地存储缓存条目数
   */
  private getLocalStorageItemCount(): number {
    if (typeof localStorage === 'undefined') return 0;
    return Object.keys(localStorage).filter(k => k.startsWith('cache_')).length;
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem, now: number): boolean {
    // TTL为0表示立即过期
    if (item.ttl === 0) {
      return true;
    }
    return now - item.timestamp > item.ttl * 1000;
  }

  /**
   * 计算命中率
   */
  private calculateHitRate(stats: { hits: number; misses: number }): number {
    const total = stats.hits + stats.misses;
    return total > 0 ? stats.hits / total : 0;
  }

  /**
   * 计算丢失率
   */
  private calculateMissRate(stats: { hits: number; misses: number }): number {
    return 1 - this.calculateHitRate(stats);
  }

  /**
   * 如果需要则清理内存缓存
   */
  private async evictIfNeeded(): Promise<void> {
    // 检查条目数限制
    if (this.memoryCache.size >= this.config.memoryMaxItems) {
      await this.evictMemoryItems(Math.floor(this.config.memoryMaxItems * 0.1)); // 清理10%
    }
    
    // 检查内存大小限制
    const currentSize = this.calculateMemorySize();
    const maxSize = this.config.memoryMaxSize * 1024 * 1024;
    
    if (currentSize > maxSize) {
      await this.evictMemoryBySize(maxSize * 0.9); // 清理到90%
    }
  }

  /**
   * 按条目数清理内存缓存
   */
  private async evictMemoryItems(count: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    
    // 根据清理策略排序
    entries.sort((a, b) => {
      switch (this.config.evictionPolicy) {
        case 'LRU': // 最近最少使用
          return a[1].lastAccess - b[1].lastAccess;
        case 'LFU': // 最少使用频率
          return a[1].accessCount - b[1].accessCount;
        case 'FIFO': // 先进先出
        default:
          return a[1].timestamp - b[1].timestamp;
      }
    });
    
    // 删除最旧的条目
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  /**
   * 按大小清理内存缓存
   */
  private async evictMemoryBySize(targetSize: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess); // LRU排序
    
    let currentSize = this.calculateMemorySize();
    for (const [key] of entries) {
      if (currentSize <= targetSize) break;
      
      const item = this.memoryCache.get(key);
      if (item) {
        currentSize -= item.size;
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * 如果需要则清理本地存储缓存
   */
  private async evictLocalStorageIfNeeded(): Promise<void> {
    const itemCount = this.getLocalStorageItemCount();
    if (itemCount >= this.config.localStorageMaxItems) {
      await this.evictLocalStorageItems(Math.floor(this.config.localStorageMaxItems * 0.1));
    }
  }

  /**
   * 清理本地存储缓存条目
   */
  private async evictLocalStorageItems(count: number): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    
    const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
    const items: Array<{ key: string; item: CacheItem }> = [];
    
    // 收集所有缓存项
    for (const key of keys) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}') as CacheItem;
        items.push({ key, item });
      } catch {
        // 删除损坏的条目
        localStorage.removeItem(key);
      }
    }
    
    // 排序并删除最旧的条目
    items.sort((a, b) => a.item.lastAccess - b.item.lastAccess);
    
    for (let i = 0; i < Math.min(count, items.length); i++) {
      localStorage.removeItem(items[i].key);
    }
  }

  /**
   * 重置统计信息
   */
  private resetStats(): void {
    this.stats = {
      memory: { hits: 0, misses: 0 },
      localStorage: { hits: 0, misses: 0 },
      total: { hits: 0, misses: 0 }
    };
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(console.error);
    }, this.config.cleanupInterval);
  }
}

// 导出单例实例
export const multiLevelCache = new MultiLevelCacheService(); 