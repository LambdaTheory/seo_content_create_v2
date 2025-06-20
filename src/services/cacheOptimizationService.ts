/**
 * 缓存优化算法服务
 * 实现智能预热、热点数据检测、缓存建议等功能
 */

import { multiLevelCache, CacheStats } from './multiLevelCacheService';

export interface HotDataInfo {
  key: string;
  accessCount: number;
  lastAccess: number;
  averageInterval: number; // 平均访问间隔
  predictedNextAccess: number; // 预测下次访问时间
  hotScore: number; // 热度评分 0-100
}

export interface CacheRecommendation {
  type: 'preload' | 'extend_ttl' | 'promote_to_memory' | 'cleanup' | 'increase_capacity';
  target: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number; // 预期性能提升百分比
}

export interface CacheOptimizationReport {
  currentStats: CacheStats;
  hotData: HotDataInfo[];
  recommendations: CacheRecommendation[];
  overallHealth: number; // 整体健康评分 0-100
  performanceMetrics: {
    avgResponseTime: number;
    memoryEfficiency: number;
    hitRateOptimality: number;
  };
}

export interface PredictivePreloadConfig {
  /** 启用预测预加载 */
  enabled: boolean;
  /** 预测窗口时间(毫秒) */
  predictionWindow: number;
  /** 最小热度评分阈值 */
  minHotScore: number;
  /** 最大预加载项目数 */
  maxPreloadItems: number;
  /** 预加载回调函数 */
  preloadCallback?: (key: string) => Promise<any>;
}

/**
 * 缓存优化算法服务类
 */
export class CacheOptimizationService {
  private accessHistory = new Map<string, number[]>(); // 访问历史记录
  private performanceHistory: number[] = []; // 性能历史记录
  private config: PredictivePreloadConfig;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config?: Partial<PredictivePreloadConfig>) {
    this.config = {
      enabled: true,
      predictionWindow: 5 * 60 * 1000, // 5分钟
      minHotScore: 70,
      maxPreloadItems: 10,
      ...config
    };

    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * 记录缓存访问
   * @param key 缓存键
   * @param isHit 是否命中
   */
  recordAccess(key: string, isHit: boolean): void {
    const now = Date.now();
    
    // 记录访问历史
    if (!this.accessHistory.has(key)) {
      this.accessHistory.set(key, []);
    }
    
    const history = this.accessHistory.get(key)!;
    history.push(now);
    
    // 保持历史记录在合理范围内（最近100次访问）
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    // 记录性能指标
    this.recordPerformance(isHit ? 1 : 0);
  }

  /**
   * 分析热点数据
   * @returns 热点数据信息列表
   */
  analyzeHotData(): HotDataInfo[] {
    const hotDataList: HotDataInfo[] = [];
    const now = Date.now();
    const windowStart = now - this.config.predictionWindow;

    for (const [key, history] of this.accessHistory) {
      // 过滤时间窗口内的访问
      const recentAccesses = history.filter(time => time >= windowStart);
      
      if (recentAccesses.length < 2) continue; // 至少需要2次访问

      // 计算访问间隔
      const intervals: number[] = [];
      for (let i = 1; i < recentAccesses.length; i++) {
        intervals.push(recentAccesses[i] - recentAccesses[i - 1]);
      }

      const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const lastAccess = recentAccesses[recentAccesses.length - 1];
      const predictedNextAccess = lastAccess + averageInterval;
      
      // 计算热度评分
      const hotScore = this.calculateHotScore(recentAccesses, averageInterval, now);

      hotDataList.push({
        key,
        accessCount: recentAccesses.length,
        lastAccess,
        averageInterval,
        predictedNextAccess,
        hotScore
      });
    }

    // 按热度评分排序
    return hotDataList.sort((a, b) => b.hotScore - a.hotScore);
  }

  /**
   * 生成缓存优化建议
   * @returns 优化建议列表
   */
  async generateRecommendations(): Promise<CacheRecommendation[]> {
    const recommendations: CacheRecommendation[] = [];
    const stats = multiLevelCache.getStats();
    const hotData = this.analyzeHotData();

    // 1. 内存使用率建议
    const memoryUsageRate = stats.memory.size / stats.memory.maxSize;
    if (memoryUsageRate > 0.9) {
      recommendations.push({
        type: 'cleanup',
        target: 'memory',
        reason: '内存使用率过高（>90%），建议清理冷数据',
        priority: 'high',
        estimatedImpact: 15
      });
    } else if (memoryUsageRate > 0.8) {
      recommendations.push({
        type: 'cleanup',
        target: 'memory',
        reason: '内存使用率较高（>80%），建议适度清理',
        priority: 'medium',
        estimatedImpact: 8
      });
    }

    // 2. 命中率建议
    if (stats.total.hitRate < 0.6) {
      recommendations.push({
        type: 'increase_capacity',
        target: 'memory',
        reason: `缓存命中率较低（${(stats.total.hitRate * 100).toFixed(1)}%），建议增加内存缓存容量`,
        priority: 'high',
        estimatedImpact: 25
      });
    }

    // 3. 热点数据建议
    for (const item of hotData.slice(0, 5)) { // 前5个热点数据
      if (item.hotScore > this.config.minHotScore) {
        // 检查是否已在内存缓存中
        const inMemory = await this.isInMemoryCache(item.key);
        if (!inMemory) {
          recommendations.push({
            type: 'promote_to_memory',
            target: item.key,
            reason: `热点数据（热度: ${item.hotScore.toFixed(1)}），建议提升到内存缓存`,
            priority: 'high',
            estimatedImpact: Math.min(item.hotScore / 5, 20)
          });
        }

        // 预测即将访问的数据
        const timeToPredictedAccess = item.predictedNextAccess - Date.now();
        if (timeToPredictedAccess > 0 && timeToPredictedAccess < 60000) { // 1分钟内
          recommendations.push({
            type: 'preload',
            target: item.key,
            reason: `预测将在${Math.round(timeToPredictedAccess / 1000)}秒后访问，建议预加载`,
            priority: 'medium',
            estimatedImpact: 10
          });
        }
      }
    }

    // 4. TTL延长建议
    for (const item of hotData.slice(0, 3)) {
      if (item.accessCount > 10 && item.averageInterval < 60000) { // 高频访问
        recommendations.push({
          type: 'extend_ttl',
          target: item.key,
          reason: `高频访问数据（${item.accessCount}次/5分钟），建议延长TTL`,
          priority: 'medium',
          estimatedImpact: 5
        });
      }
    }

    // 按优先级和影响排序
    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedImpact - a.estimatedImpact;
    });
  }

  /**
   * 生成优化报告
   * @returns 完整的优化报告
   */
  async generateOptimizationReport(): Promise<CacheOptimizationReport> {
    const currentStats = multiLevelCache.getStats();
    const hotData = this.analyzeHotData();
    const recommendations = await this.generateRecommendations();
    
    const overallHealth = this.calculateOverallHealth(currentStats);
    const performanceMetrics = this.calculatePerformanceMetrics(currentStats);

    return {
      currentStats,
      hotData,
      recommendations,
      overallHealth,
      performanceMetrics
    };
  }

  /**
   * 执行预测性预加载
   */
  async executePredictivePreload(): Promise<void> {
    if (!this.config.enabled || !this.config.preloadCallback) return;

    const hotData = this.analyzeHotData();
    const now = Date.now();
    const candidatesForPreload: HotDataInfo[] = [];

    // 找到需要预加载的数据
    for (const item of hotData) {
      if (item.hotScore < this.config.minHotScore) break;
      
      const timeToPredictedAccess = item.predictedNextAccess - now;
      if (timeToPredictedAccess > 0 && timeToPredictedAccess < 60000) { // 1分钟内
        candidatesForPreload.push(item);
      }
    }

    // 限制预加载数量
    const itemsToPreload = candidatesForPreload.slice(0, this.config.maxPreloadItems);

    // 执行预加载
    for (const item of itemsToPreload) {
      try {
        const data = await this.config.preloadCallback(item.key);
        if (data) {
          await multiLevelCache.set(item.key, data);
        }
      } catch (error) {
        console.warn(`预加载失败: ${item.key}`, error);
      }
    }
  }

  /**
   * 自动优化缓存
   */
  async autoOptimize(): Promise<void> {
    const recommendations = await this.generateRecommendations();
    
    for (const recommendation of recommendations) {
      if (recommendation.priority === 'high') {
        try {
          await this.executeRecommendation(recommendation);
        } catch (error) {
          console.warn(`执行优化建议失败:`, recommendation, error);
        }
      }
    }
  }

  /**
   * 启动性能监控
   */
  startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(async () => {
      await this.executePredictivePreload();
      // 定期清理过期的访问历史
      this.cleanupAccessHistory();
    }, 30000); // 30秒间隔
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopMonitoring();
    this.accessHistory.clear();
    this.performanceHistory.length = 0;
  }

  // ============ 私有方法 ============

  /**
   * 计算热度评分
   */
  private calculateHotScore(accesses: number[], averageInterval: number, now: number): number {
    if (accesses.length === 0) return 0;

    const lastAccess = accesses[accesses.length - 1];
    const timeSinceLastAccess = now - lastAccess;
    
    // 基础分数：访问频率
    const frequencyScore = Math.min(accesses.length * 5, 50);
    
    // 时效性分数：最近访问的权重更高
    const recencyScore = Math.max(0, 30 - (timeSinceLastAccess / 60000) * 10); // 每分钟减10分
    
    // 规律性分数：访问间隔越规律分数越高
    const intervals = [];
    for (let i = 1; i < accesses.length; i++) {
      intervals.push(accesses[i] - accesses[i - 1]);
    }
    
    const variance = this.calculateVariance(intervals);
    const regularityScore = Math.max(0, 20 - (variance / averageInterval) * 10);
    
    return Math.min(100, frequencyScore + recencyScore + regularityScore);
  }

  /**
   * 计算方差
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  /**
   * 检查数据是否在内存缓存中
   */
  private async isInMemoryCache(key: string): Promise<boolean> {
    // 这里简化实现，实际应该检查内存缓存
    // 可以通过stats或者专门的API来判断
    const stats = multiLevelCache.getStats();
    return stats.memory.items > 0; // 简化判断
  }

  /**
   * 记录性能指标
   */
  private recordPerformance(hitScore: number): void {
    this.performanceHistory.push(hitScore);
    
    // 保持历史记录在合理范围内
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory.splice(0, this.performanceHistory.length - 1000);
    }
  }

  /**
   * 计算整体健康评分
   */
  private calculateOverallHealth(stats: CacheStats): number {
    let score = 0;
    
    // 命中率评分 (40%)
    score += stats.total.hitRate * 40;
    
    // 内存利用率评分 (30%)
    const memoryUsage = stats.memory.size / stats.memory.maxSize;
    const optimalUsage = 0.7; // 70%为最优使用率
    const usageScore = Math.max(0, 30 - Math.abs(memoryUsage - optimalUsage) * 100);
    score += usageScore;
    
    // 响应时间评分 (30%)
    const avgResponseTime = this.getAverageResponseTime();
    const responseScore = Math.max(0, 30 - avgResponseTime / 10);
    score += responseScore;
    
    return Math.min(100, score);
  }

  /**
   * 计算性能指标
   */
  private calculatePerformanceMetrics(stats: CacheStats) {
    return {
      avgResponseTime: this.getAverageResponseTime(),
      memoryEfficiency: (stats.memory.size / stats.memory.maxSize) * 100,
      hitRateOptimality: Math.min(100, stats.total.hitRate * 100 / 0.8) // 80%为最优命中率
    };
  }

  /**
   * 获取平均响应时间
   */
  private getAverageResponseTime(): number {
    // 简化实现，实际应该测量真实的响应时间
    return this.performanceHistory.length > 0 
      ? this.performanceHistory.reduce((sum, time) => sum + time, 0) / this.performanceHistory.length 
      : 0;
  }

  /**
   * 执行优化建议
   */
  private async executeRecommendation(recommendation: CacheRecommendation): Promise<void> {
    switch (recommendation.type) {
      case 'cleanup':
        await multiLevelCache.cleanup();
        break;
      case 'preload':
        if (this.config.preloadCallback) {
          const data = await this.config.preloadCallback(recommendation.target);
          if (data) {
            await multiLevelCache.set(recommendation.target, data);
          }
        }
        break;
      case 'promote_to_memory':
        // 这里需要与缓存服务集成，强制将数据提升到内存
        const data = await multiLevelCache.get(recommendation.target);
        if (data) {
          await multiLevelCache.set(recommendation.target, data);
        }
        break;
      case 'extend_ttl':
        // 延长TTL需要重新设置缓存
        const existingData = await multiLevelCache.get(recommendation.target);
        if (existingData) {
          await multiLevelCache.set(recommendation.target, existingData, 7200); // 2小时
        }
        break;
    }
  }

  /**
   * 清理过期的访问历史
   */
  private cleanupAccessHistory(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    for (const [key, history] of this.accessHistory) {
      const recentHistory = history.filter(time => now - time < maxAge);
      
      if (recentHistory.length === 0) {
        this.accessHistory.delete(key);
      } else {
        this.accessHistory.set(key, recentHistory);
      }
    }
  }
}

// 导出单例实例
export const cacheOptimizer = new CacheOptimizationService(); 