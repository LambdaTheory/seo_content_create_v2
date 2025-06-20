/**
 * 游戏数据存储服务
 * 
 * 功能特性：
 * - 游戏数据本地缓存管理
 * - 快速查询和索引
 * - 数据导入导出
 * - 性能优化和内存管理
 * 
 * @author AI Assistant
 * @date 2025-01-29
 */

import { localStorageService } from './localStorage';
import type { GameData } from '@/types/GameData.types';

/**
 * 游戏数据存储结果接口
 */
export interface GameDataStorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 游戏数据查询选项
 */
export interface GameDataQueryOptions {
  searchTerm?: string;
  category?: string;
  platform?: string;
  minRating?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'rating' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 游戏数据缓存统计
 */
export interface GameDataCacheStats {
  totalGames: number;
  categoriesCount: number;
  platformsCount: number;
  averageRating: number;
  cacheSize: number; // bytes
  lastUpdated: number;
  hitRate: number;
}

/**
 * 游戏数据存储服务类
 */
export class GameDataStorageService {
  private readonly storageKey = 'game_data_cache';
  private readonly indexKey = 'game_data_index';
  private readonly statsKey = 'game_data_stats';
  
  private cache: Map<string, GameData> = new Map();
  private index: {
    nameIndex: Map<string, string[]>;
    categoryIndex: Map<string, string[]>;
    platformIndex: Map<string, string[]>;
  } = {
    nameIndex: new Map(),
    categoryIndex: new Map(),
    platformIndex: new Map()
  };
  
  private stats: GameDataCacheStats = {
    totalGames: 0,
    categoriesCount: 0,
    platformsCount: 0,
    averageRating: 0,
    cacheSize: 0,
    lastUpdated: Date.now(),
    hitRate: 0
  };
  
  private hitCount = 0;
  private requestCount = 0;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 保存游戏数据
   */
  saveGameData(gameData: GameData): GameDataStorageResult<GameData> {
    try {
      const id = gameData.id || this.generateGameId(gameData);
      const dataWithId = { ...gameData, id };
      
      this.cache.set(id, dataWithId);
      this.updateIndex(id, dataWithId);
      this.updateStats();
      this.saveToStorage();
      
      return {
        success: true,
        data: dataWithId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save game data'
      };
    }
  }

  /**
   * 批量保存游戏数据
   */
  saveGameDataBatch(gamesData: GameData[]): GameDataStorageResult<{
    successCount: number;
    errorCount: number;
    errors: string[];
  }> {
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as string[]
    };

    for (const gameData of gamesData) {
      const result = this.saveGameData(gameData);
      if (result.success) {
        results.successCount++;
      } else {
        results.errorCount++;
        results.errors.push(result.error || 'Unknown error');
      }
    }

    return {
      success: results.errorCount === 0,
      data: results
    };
  }

  /**
   * 获取游戏数据
   */
  getGameData(id: string): GameDataStorageResult<GameData> {
    this.requestCount++;
    
    try {
      const gameData = this.cache.get(id);
      
      if (gameData) {
        this.hitCount++;
        this.updateHitRate();
        
        return {
          success: true,
          data: gameData
        };
      }
      
      return {
        success: false,
        error: 'Game data not found'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get game data'
      };
    }
  }

  /**
   * 获取多个游戏数据
   */
  getGameDataBatch(ids: string[]): GameDataStorageResult<GameData[]> {
    try {
      const results: GameData[] = [];
      const notFound: string[] = [];
      
      for (const id of ids) {
        const result = this.getGameData(id);
        if (result.success && result.data) {
          results.push(result.data);
        } else {
          notFound.push(id);
        }
      }
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get game data batch'
      };
    }
  }

  /**
   * 查询游戏数据
   */
  queryGameData(options: GameDataQueryOptions = {}): GameDataStorageResult<{
    data: GameData[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let results: GameData[] = Array.from(this.cache.values());
      
      // 应用搜索条件
      if (options.searchTerm) {
        const searchLower = options.searchTerm.toLowerCase();
        results = results.filter(game => 
          game.name?.toLowerCase().includes(searchLower) ||
          game.description?.toLowerCase().includes(searchLower) ||
          game.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      if (options.category) {
        results = results.filter(game => 
          game.category?.toLowerCase() === options.category?.toLowerCase()
        );
      }
      
      if (options.platform) {
        results = results.filter(game => 
          game.platforms?.includes(options.platform!)
        );
      }
      
      if (options.minRating !== undefined) {
        results = results.filter(game => 
          (game.rating || 0) >= options.minRating!
        );
      }
      
      // 排序
      if (options.sortBy) {
        results.sort((a, b) => {
          const aValue = this.getSortValue(a, options.sortBy!);
          const bValue = this.getSortValue(b, options.sortBy!);
          
          if (options.sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1;
          }
          return aValue > bValue ? 1 : -1;
        });
      }
      
      const total = results.length;
      
      // 分页
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      const paginatedResults = results.slice(offset, offset + limit);
      const hasMore = offset + limit < total;
      
      return {
        success: true,
        data: {
          data: paginatedResults,
          total,
          hasMore
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query game data'
      };
    }
  }

  /**
   * 删除游戏数据
   */
  deleteGameData(id: string): GameDataStorageResult<boolean> {
    try {
      const existed = this.cache.has(id);
      
      if (existed) {
        const gameData = this.cache.get(id);
        this.cache.delete(id);
        
        if (gameData) {
          this.removeFromIndex(id, gameData);
        }
        
        this.updateStats();
        this.saveToStorage();
      }
      
      return {
        success: true,
        data: existed
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete game data'
      };
    }
  }

  /**
   * 清空缓存
   */
  clear(): GameDataStorageResult<boolean> {
    try {
      this.cache.clear();
      this.index = {
        nameIndex: new Map(),
        categoryIndex: new Map(),
        platformIndex: new Map()
      };
      this.updateStats();
      this.saveToStorage();
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache'
      };
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): GameDataStorageResult<GameDataCacheStats> {
    return {
      success: true,
      data: { ...this.stats }
    };
  }

  /**
   * 导出缓存数据
   */
  exportCache(): GameDataStorageResult<{
    data: GameData[];
    index: any;
    stats: GameDataCacheStats;
    exportedAt: string;
  }> {
    try {
      return {
        success: true,
        data: {
          data: Array.from(this.cache.values()),
          index: {
            nameIndex: Object.fromEntries(this.index.nameIndex),
            categoryIndex: Object.fromEntries(this.index.categoryIndex),
            platformIndex: Object.fromEntries(this.index.platformIndex)
          },
          stats: this.stats,
          exportedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export cache'
      };
    }
  }

  /**
   * 导入缓存数据
   */
  importCache(importData: {
    data: GameData[];
    index?: any;
    stats?: GameDataCacheStats;
  }): GameDataStorageResult<{ successCount: number; errorCount: number }> {
    try {
      this.clear();
      
      const result = this.saveGameDataBatch(importData.data);
      
      if (importData.stats) {
        this.stats = { ...importData.stats, lastUpdated: Date.now() };
      }
      
      this.saveToStorage();
      
      return {
        success: result.success,
        data: {
          successCount: result.data?.successCount || 0,
          errorCount: result.data?.errorCount || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import cache'
      };
    }
  }

  /**
   * 私有方法：生成游戏ID
   */
  private generateGameId(gameData: GameData): string {
    const name = gameData.name || 'unknown';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `game_${name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}_${random}`;
  }

  /**
   * 私有方法：更新索引
   */
  private updateIndex(id: string, gameData: GameData): void {
    // 名称索引
    if (gameData.name) {
      const nameKey = gameData.name.toLowerCase();
      if (!this.index.nameIndex.has(nameKey)) {
        this.index.nameIndex.set(nameKey, []);
      }
      const nameIds = this.index.nameIndex.get(nameKey)!;
      if (!nameIds.includes(id)) {
        nameIds.push(id);
      }
    }
    
    // 分类索引
    if (gameData.category) {
      const categoryKey = gameData.category.toLowerCase();
      if (!this.index.categoryIndex.has(categoryKey)) {
        this.index.categoryIndex.set(categoryKey, []);
      }
      const categoryIds = this.index.categoryIndex.get(categoryKey)!;
      if (!categoryIds.includes(id)) {
        categoryIds.push(id);
      }
    }
    
    // 平台索引
    if (gameData.platforms) {
      for (const platform of gameData.platforms) {
        const platformKey = platform.toLowerCase();
        if (!this.index.platformIndex.has(platformKey)) {
          this.index.platformIndex.set(platformKey, []);
        }
        const platformIds = this.index.platformIndex.get(platformKey)!;
        if (!platformIds.includes(id)) {
          platformIds.push(id);
        }
      }
    }
  }

  /**
   * 私有方法：从索引中移除
   */
  private removeFromIndex(id: string, gameData: GameData): void {
    if (gameData.name) {
      const nameKey = gameData.name.toLowerCase();
      const nameIds = this.index.nameIndex.get(nameKey);
      if (nameIds) {
        const index = nameIds.indexOf(id);
        if (index > -1) {
          nameIds.splice(index, 1);
        }
        if (nameIds.length === 0) {
          this.index.nameIndex.delete(nameKey);
        }
      }
    }
    
    if (gameData.category) {
      const categoryKey = gameData.category.toLowerCase();
      const categoryIds = this.index.categoryIndex.get(categoryKey);
      if (categoryIds) {
        const index = categoryIds.indexOf(id);
        if (index > -1) {
          categoryIds.splice(index, 1);
        }
        if (categoryIds.length === 0) {
          this.index.categoryIndex.delete(categoryKey);
        }
      }
    }
    
    if (gameData.platforms) {
      for (const platform of gameData.platforms) {
        const platformKey = platform.toLowerCase();
        const platformIds = this.index.platformIndex.get(platformKey);
        if (platformIds) {
          const index = platformIds.indexOf(id);
          if (index > -1) {
            platformIds.splice(index, 1);
          }
          if (platformIds.length === 0) {
            this.index.platformIndex.delete(platformKey);
          }
        }
      }
    }
  }

  /**
   * 私有方法：更新统计信息
   */
  private updateStats(): void {
    this.stats.totalGames = this.cache.size;
    this.stats.categoriesCount = this.index.categoryIndex.size;
    this.stats.platformsCount = this.index.platformIndex.size;
    this.stats.lastUpdated = Date.now();
    
    // 计算平均评分
    const games = Array.from(this.cache.values());
    const totalRating = games.reduce((sum, game) => sum + (game.rating || 0), 0);
    this.stats.averageRating = games.length > 0 ? totalRating / games.length : 0;
    
    // 计算缓存大小
    const cacheData = {
      cache: Object.fromEntries(this.cache),
      index: this.index
    };
    this.stats.cacheSize = JSON.stringify(cacheData).length;
  }

  /**
   * 私有方法：更新命中率
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.requestCount > 0 ? this.hitCount / this.requestCount : 0;
  }

  /**
   * 私有方法：获取排序值
   */
  private getSortValue(game: GameData, sortBy: string): any {
    switch (sortBy) {
      case 'name':
        return game.name || '';
      case 'rating':
        return game.rating || 0;
      case 'createdAt':
        return game.createdAt || 0;
      case 'updatedAt':
        return game.updatedAt || 0;
      default:
        return '';
    }
  }

  /**
   * 私有方法：从存储加载数据
   */
  private loadFromStorage(): void {
    try {
      // 加载缓存数据
      const cacheResult = localStorageService.get(this.storageKey);
      if (cacheResult.success && cacheResult.data) {
        this.cache = new Map(Object.entries(cacheResult.data));
      }
      
      // 加载索引数据
      const indexResult = localStorageService.get(this.indexKey);
      if (indexResult.success && indexResult.data) {
        this.index = {
          nameIndex: new Map(Object.entries(indexResult.data.nameIndex || {})),
          categoryIndex: new Map(Object.entries(indexResult.data.categoryIndex || {})),
          platformIndex: new Map(Object.entries(indexResult.data.platformIndex || {}))
        };
      }
      
      // 加载统计数据
      const statsResult = localStorageService.get(this.statsKey);
      if (statsResult.success && statsResult.data) {
        this.stats = { ...this.stats, ...statsResult.data };
      }
      
      this.updateStats();
    } catch (error) {
      console.error('Failed to load game data from storage:', error);
      this.cache.clear();
      this.index = {
        nameIndex: new Map(),
        categoryIndex: new Map(),
        platformIndex: new Map()
      };
    }
  }

  /**
   * 私有方法：保存数据到存储
   */
  private saveToStorage(): void {
    try {
      // 保存缓存数据
      localStorageService.set(this.storageKey, Object.fromEntries(this.cache));
      
      // 保存索引数据
      localStorageService.set(this.indexKey, {
        nameIndex: Object.fromEntries(this.index.nameIndex),
        categoryIndex: Object.fromEntries(this.index.categoryIndex),
        platformIndex: Object.fromEntries(this.index.platformIndex)
      });
      
      // 保存统计数据
      localStorageService.set(this.statsKey, this.stats);
    } catch (error) {
      console.error('Failed to save game data to storage:', error);
    }
  }
}

/**
 * 默认的游戏数据存储服务实例
 */
export const gameDataStorage = new GameDataStorageService();