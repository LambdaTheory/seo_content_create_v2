/**
 * 性能优化工具
 * 任务11.2：性能优化 - 提升应用整体性能
 */

import React, { lazy, ComponentType } from 'react';
import type { GameData } from '@/types/GameData.types';
import type { GenerationResult } from '@/types/GenerationResult.types';

// ============ 组件懒加载优化 ============

/**
 * 懒加载组件工厂
 * 支持错误边界和加载状态
 */
export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: any) => {
    return (
      <React.Suspense fallback={<ComponentFallback fallback={fallback} />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
};

/**
 * 组件回退加载界面
 */
const ComponentFallback: React.FC<{ fallback?: ComponentType }> = ({ fallback: Fallback }) => {
  if (Fallback) {
    return <Fallback />;
  }
  
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2 text-gray-600">加载中...</span>
    </div>
  );
};

// 预定义的懒加载组件
export const LazyComponents = {
  // 工作流管理组件
  WorkflowForm: createLazyComponent(() => import('@/components/forms/WorkflowForm')),
  
  // CSV处理组件
  CSVUploader: createLazyComponent(() => import('@/components/forms/CSVUploader')),
  EditableTable: createLazyComponent(() => import('@/components/forms/EditableTable')),
  
  // 内容生成组件
  GenerationConfigPanel: createLazyComponent(() => import('@/components/settings/GenerationConfigPanel/GenerationConfigPanel')),
  ContentSettingsForm: createLazyComponent(() => import('@/components/settings/ContentSettingsForm/ContentSettingsForm')),
  
  // 结果预览组件
  ResultPreview: createLazyComponent(() => import('@/components/result-preview/ResultPreview')),
  QualityAnalysis: createLazyComponent(() => import('@/components/result-preview/QualityAnalysis')),
  
  // 竞品分析组件
  CompetitorOverview: createLazyComponent(() => import('@/components/competitor/CompetitorOverview')),
  
  // 结构化数据组件
  StructuredDataGenerator: createLazyComponent(() => import('@/components/structuredData/StructuredDataGenerator'))
};

// ============ 请求缓存优化 ============

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // 最大缓存条目数
  private defaultTTL = 5 * 60 * 1000; // 5分钟默认缓存时间

  /**
   * 生成缓存键
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }

  /**
   * 检查缓存是否有效
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }

    // 如果缓存仍然过大，删除最旧的条目
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - this.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * 获取缓存数据
   */
  get<T>(url: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * 设置缓存数据
   */
  set<T>(url: string, data: T, params?: Record<string, any>, ttl = this.defaultTTL): void {
    const key = this.generateKey(url, params);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    this.cleanup();
  }

  /**
   * 删除特定缓存
   */
  delete(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // 需要额外跟踪命中率
    };
  }
}

export const requestCache = new RequestCache();

/**
 * 缓存装饰器函数
 */
export const withCache = <T>(
  fetchFunction: (url: string, options?: RequestInit) => Promise<T>,
  ttl?: number
) => {
  return async (url: string, options?: RequestInit): Promise<T> => {
    const cacheKey = url;
    const params = options ? { method: options.method, body: options.body } : undefined;
    
    // 只缓存GET请求
    if (!options?.method || options.method === 'GET') {
      const cached = requestCache.get<T>(cacheKey, params);
      if (cached) {
        return cached;
      }
    }

    const result = await fetchFunction(url, options);
    
    // 只缓存成功的GET请求
    if (!options?.method || options.method === 'GET') {
      requestCache.set(cacheKey, result, params, ttl);
    }
    
    return result;
  };
};

// ============ 大数据处理优化 ============

/**
 * 数据分批处理器
 */
export class BatchProcessor<T, R> {
  private batchSize: number;
  private concurrency: number;
  private processingQueue: T[] = [];
  private isProcessing = false;

  constructor(batchSize = 50, concurrency = 3) {
    this.batchSize = batchSize;
    this.concurrency = concurrency;
  }

  /**
   * 添加数据到处理队列
   */
  add(items: T[]): void {
    this.processingQueue.push(...items);
  }

  /**
   * 处理队列中的数据
   */
  async process(
    processor: (batch: T[]) => Promise<R[]>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    if (this.isProcessing) {
      throw new Error('Processor is already running');
    }

    this.isProcessing = true;
    const results: R[] = [];
    const total = this.processingQueue.length;
    let processed = 0;

    try {
      // 将数据分成批次
      const batches: T[][] = [];
      for (let i = 0; i < this.processingQueue.length; i += this.batchSize) {
        batches.push(this.processingQueue.slice(i, i + this.batchSize));
      }

      // 并行处理批次
      const processBatch = async (batch: T[]): Promise<R[]> => {
        const batchResult = await processor(batch);
        processed += batch.length;
        onProgress?.(processed, total);
        return batchResult;
      };

      // 控制并发数
      for (let i = 0; i < batches.length; i += this.concurrency) {
        const concurrentBatches = batches.slice(i, i + this.concurrency);
        const batchPromises = concurrentBatches.map(processBatch);
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(batchResult => {
          results.push(...batchResult);
        });
      }

      return results;
    } finally {
      this.isProcessing = false;
      this.processingQueue = [];
    }
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      queueSize: this.processingQueue.length,
      isProcessing: this.isProcessing,
      batchSize: this.batchSize,
      concurrency: this.concurrency
    };
  }
}

// ============ 内存管理优化 ============

/**
 * 内存使用监控器
 */
export class MemoryMonitor {
  private memoryThreshold = 50 * 1024 * 1024; // 50MB
  private cleanupCallbacks: (() => void)[] = [];

  /**
   * 检查内存使用情况
   */
  checkMemoryUsage(): number {
    if ('memory' in performance) {
      // @ts-ignore - performance.memory exists in Chrome
      return performance.memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * 注册清理回调
   */
  onMemoryPressure(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * 执行内存清理
   */
  cleanup(): void {
    // 清理请求缓存
    const cacheSize = requestCache.getStats().size;
    if (cacheSize > 20) {
      requestCache.clear();
      console.log(`Cleared ${cacheSize} cache entries`);
    }

    // 执行注册的清理回调
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Memory cleanup callback failed:', error);
      }
    });

    // 强制垃圾回收（仅在开发环境）
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      // @ts-ignore - gc exists in development
      window.gc();
    }
  }

  /**
   * 启动内存监控
   */
  startMonitoring(interval = 10000): void {
    const monitor = () => {
      const memoryUsage = this.checkMemoryUsage();
      
      if (memoryUsage > this.memoryThreshold) {
        console.warn(`Memory usage high: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
        this.cleanup();
      }
    };

    setInterval(monitor, interval);
  }
}

export const memoryMonitor = new MemoryMonitor();

// ============ 代码分割优化 ============

/**
 * 路由级代码分割
 */
export const RouteComponents = {
  HomePage: lazy(() => import('@/app/page')),
  WorkflowPage: lazy(() => import('@/app/workflow/page')),
  UploadPage: lazy(() => import('@/app/upload/page')),
  GeneratePage: lazy(() => import('@/app/generate/page')),
  ResultsPage: lazy(() => import('@/app/results/page'))
};

// ============ 性能测量工具 ============

/**
 * 性能测量器
 */
export class PerformanceMeasurer {
  private measurements = new Map<string, number>();

  /**
   * 开始测量
   */
  start(name: string): void {
    this.measurements.set(name, performance.now());
  }

  /**
   * 结束测量并返回耗时
   */
  end(name: string): number {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      console.warn(`No measurement started for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.delete(name);
    
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * 测量异步函数执行时间
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    return {
      activeMeasurements: this.measurements.size,
      measurementNames: Array.from(this.measurements.keys())
    };
  }
}

export const performanceMeasurer = new PerformanceMeasurer();

// ============ 图片懒加载优化 ============

/**
 * 图片懒加载Hook
 */
export const useImageLazyLoading = () => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, []);

  return { imgRef, shouldLoad: isIntersecting };
};

// ============ 虚拟滚动优化 ============

/**
 * 虚拟滚动计算器
 */
export class VirtualScrollCalculator {
  private itemHeight: number;
  private containerHeight: number;
  private overscan: number;

  constructor(itemHeight: number, containerHeight: number, overscan = 5) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.overscan = overscan;
  }

  /**
   * 计算可见范围
   */
  calculateVisibleRange(scrollTop: number, totalItems: number) {
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(this.containerHeight / this.itemHeight),
      totalItems - 1
    );

    // 添加预渲染项目
    const start = Math.max(0, visibleStart - this.overscan);
    const end = Math.min(totalItems - 1, visibleEnd + this.overscan);

    return {
      start,
      end,
      visibleStart,
      visibleEnd
    };
  }

  /**
   * 计算项目位置
   */
  getItemOffset(index: number): number {
    return index * this.itemHeight;
  }

  /**
   * 计算总高度
   */
  getTotalHeight(totalItems: number): number {
    return totalItems * this.itemHeight;
  }
}

// ============ 导出性能优化配置 ============

export const PerformanceConfig = {
  // 组件懒加载配置
  lazyLoading: {
    enabled: true,
    preloadDelay: 1000, // 预加载延迟
    retryAttempts: 3
  },

  // 缓存配置
  cache: {
    maxSize: 100,
    defaultTTL: 5 * 60 * 1000, // 5分钟
    cleanupInterval: 60 * 1000 // 1分钟清理一次
  },

  // 批处理配置
  batchProcessing: {
    defaultBatchSize: 50,
    defaultConcurrency: 3,
    maxQueueSize: 1000
  },

  // 内存管理配置
  memory: {
    threshold: 50 * 1024 * 1024, // 50MB
    monitoringInterval: 10000, // 10秒
    autoCleanup: true
  },

  // 虚拟滚动配置
  virtualScroll: {
    itemHeight: 80,
    overscan: 5,
    enabled: true
  }
};

// 初始化性能监控
if (typeof window !== 'undefined') {
  memoryMonitor.startMonitoring(PerformanceConfig.memory.monitoringInterval);
} 