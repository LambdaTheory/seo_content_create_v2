import { sitemapService } from './SitemapService';
import { competitorDatabaseService } from './CompetitorDatabaseService';
import { CompetitorWebsiteConfig, SitemapData, ScrapingStatus } from '@/types/Competitor.types';

/**
 * 更新任务状态
 */
export enum UpdateTaskStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 更新任务配置
 */
export interface UpdateTaskConfig {
  /** 更新间隔（小时） */
  intervalHours: number;
  /** 是否启用自动更新 */
  autoUpdate: boolean;
  /** 最大并发更新数 */
  maxConcurrent: number;
  /** 失败重试次数 */
  maxRetries: number;
  /** 只更新启用的网站 */
  onlyEnabledSites: boolean;
}

/**
 * 更新任务结果
 */
export interface UpdateTaskResult {
  /** 任务ID */
  taskId: string;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 任务状态 */
  status: UpdateTaskStatus;
  /** 处理的网站数 */
  totalSites: number;
  /** 成功的网站数 */
  successSites: number;
  /** 失败的网站数 */
  failedSites: number;
  /** 新增的URL数 */
  newUrls: number;
  /** 更新的URL数 */
  updatedUrls: number;
  /** 错误信息 */
  errors: string[];
  /** 持续时间（毫秒） */
  duration?: number;
}

/**
 * 网站更新结果
 */
export interface SiteUpdateResult {
  websiteId: string;
  websiteName: string;
  status: ScrapingStatus;
  newUrls: number;
  updatedUrls: number;
  error?: string;
  duration: number;
}

/**
 * Sitemap定时更新调度服务
 * 功能特性：
 * - 定时任务调度
 * - 增量更新逻辑
 * - 更新状态追踪
 * - 更新日志记录
 * - 并发控制
 * - 错误重试
 */
export class SitemapSchedulerService {
  private updateTimer: NodeJS.Timeout | null = null;
  private currentTask: UpdateTaskResult | null = null;
  private isUpdating = false;
  private taskHistory: UpdateTaskResult[] = [];
  
  private readonly STORAGE_KEYS = {
    TASK_CONFIG: 'sitemap_scheduler_config',
    TASK_HISTORY: 'sitemap_scheduler_history',
    LAST_UPDATE: 'sitemap_last_update'
  };

  private readonly DEFAULT_CONFIG: UpdateTaskConfig = {
    intervalHours: 24, // 每24小时更新一次
    autoUpdate: false, // 默认不自动更新
    maxConcurrent: 3, // 最多同时更新3个网站
    maxRetries: 2, // 失败时重试2次
    onlyEnabledSites: true // 只更新启用的网站
  };

  private readonly MAX_HISTORY_SIZE = 50; // 最多保存50条历史记录

  /**
   * 启动定时更新
   * @param config - 更新配置
   */
  async startScheduler(config?: Partial<UpdateTaskConfig>): Promise<void> {
    try {
      const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
      await this.saveConfig(finalConfig);

      if (this.updateTimer) {
        clearInterval(this.updateTimer);
      }

      if (finalConfig.autoUpdate) {
        const intervalMs = finalConfig.intervalHours * 60 * 60 * 1000;
        this.updateTimer = setInterval(() => {
          this.performScheduledUpdate();
        }, intervalMs);

        console.log(`🔄 定时更新已启动，间隔: ${finalConfig.intervalHours} 小时`);
        
        // 立即执行一次更新检查
        this.checkAndPerformUpdate();
      } else {
        console.log('⏸️ 自动更新已禁用');
      }
    } catch (error) {
      console.error('❌ 启动定时更新失败:', error);
      throw error;
    }
  }

  /**
   * 停止定时更新
   */
  async stopScheduler(): Promise<void> {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      console.log('⏹️ 定时更新已停止');
    }

    if (this.isUpdating && this.currentTask) {
      this.currentTask.status = UpdateTaskStatus.CANCELLED;
      this.currentTask.endTime = new Date();
      this.currentTask.duration = this.currentTask.endTime.getTime() - this.currentTask.startTime.getTime();
      
      await this.saveTaskToHistory(this.currentTask);
      this.currentTask = null;
      this.isUpdating = false;
      
      console.log('🛑 当前更新任务已取消');
    }
  }

  /**
   * 手动触发更新
   * @param force - 是否强制更新（忽略上次更新时间）
   * @returns UpdateTaskResult
   */
  async triggerManualUpdate(force = false): Promise<UpdateTaskResult> {
    try {
      if (this.isUpdating) {
        throw new Error('更新任务正在进行中，请稍后再试');
      }

      console.log('🚀 手动触发Sitemap更新...');
      return await this.performUpdate(force);
    } catch (error) {
      console.error('❌ 手动更新失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前任务状态
   * @returns UpdateTaskResult | null
   */
  getCurrentTask(): UpdateTaskResult | null {
    return this.currentTask;
  }

  /**
   * 获取任务历史
   * @param limit - 限制返回数量
   * @returns UpdateTaskResult[]
   */
  async getTaskHistory(limit = 10): Promise<UpdateTaskResult[]> {
    try {
      const history = await this.loadTaskHistory();
      return history
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit);
    } catch (error) {
      console.warn('⚠️ 获取任务历史失败:', error);
      return [];
    }
  }

  /**
   * 获取更新配置
   * @returns UpdateTaskConfig
   */
  async getConfig(): Promise<UpdateTaskConfig> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.TASK_CONFIG);
      if (stored) {
        return { ...this.DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
      return this.DEFAULT_CONFIG;
    } catch (error) {
      console.warn('⚠️ 获取配置失败，使用默认配置:', error);
      return this.DEFAULT_CONFIG;
    }
  }

  /**
   * 保存更新配置
   * @param config - 更新配置
   */
  async saveConfig(config: UpdateTaskConfig): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEYS.TASK_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('❌ 保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取最后更新时间
   * @returns Date | null
   */
  async getLastUpdateTime(): Promise<Date | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.LAST_UPDATE);
      return stored ? new Date(stored) : null;
    } catch (error) {
      console.warn('⚠️ 获取最后更新时间失败:', error);
      return null;
    }
  }

  /**
   * 检查是否需要更新
   * @returns boolean
   */
  async shouldUpdate(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config.autoUpdate) return false;

      const lastUpdate = await this.getLastUpdateTime();
      if (!lastUpdate) return true;

      const now = new Date();
      const hoursSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceLastUpdate >= config.intervalHours;
    } catch (error) {
      console.warn('⚠️ 检查更新状态失败:', error);
      return false;
    }
  }

  /**
   * 执行定时更新检查
   */
  private async checkAndPerformUpdate(): Promise<void> {
    try {
      if (await this.shouldUpdate()) {
        await this.performUpdate();
      }
    } catch (error) {
      console.error('❌ 定时更新检查失败:', error);
    }
  }

  /**
   * 执行定时更新
   */
  private async performScheduledUpdate(): Promise<void> {
    try {
      if (this.isUpdating) {
        console.log('⏳ 更新任务正在进行中，跳过此次定时更新');
        return;
      }

      await this.performUpdate();
    } catch (error) {
      console.error('❌ 定时更新失败:', error);
    }
  }

  /**
   * 执行更新
   * @param force - 是否强制更新
   * @returns UpdateTaskResult
   */
  private async performUpdate(force = false): Promise<UpdateTaskResult> {
    if (this.isUpdating) {
      throw new Error('更新任务已在进行中');
    }

    this.isUpdating = true;
    const taskId = this.generateTaskId();
    const startTime = new Date();
    
    this.currentTask = {
      taskId,
      startTime,
      status: UpdateTaskStatus.RUNNING,
      totalSites: 0,
      successSites: 0,
      failedSites: 0,
      newUrls: 0,
      updatedUrls: 0,
      errors: []
    };

    try {
      console.log(`🔄 开始更新任务 ${taskId}...`);

      // 获取网站配置
      const websites = await competitorDatabaseService.getWebsiteConfigs();
      const config = await this.getConfig();
      
      const sitesToUpdate = config.onlyEnabledSites 
        ? websites.filter(site => site.enabled)
        : websites;

      this.currentTask.totalSites = sitesToUpdate.length;

      if (sitesToUpdate.length === 0) {
        throw new Error('没有需要更新的网站');
      }

      // 批量更新网站
      const updateResults = await this.updateSitesInBatches(sitesToUpdate, config);
      
      // 统计结果
      this.currentTask.successSites = updateResults.filter(r => r.status === ScrapingStatus.SUCCESS).length;
      this.currentTask.failedSites = updateResults.filter(r => r.status === ScrapingStatus.FAILED).length;
      this.currentTask.newUrls = updateResults.reduce((sum, r) => sum + r.newUrls, 0);
      this.currentTask.updatedUrls = updateResults.reduce((sum, r) => sum + r.updatedUrls, 0);
      this.currentTask.errors = updateResults
        .filter(r => r.error)
        .map(r => `${r.websiteName}: ${r.error}`);

      // 更新状态
      this.currentTask.status = this.currentTask.failedSites > 0 
        ? UpdateTaskStatus.FAILED 
        : UpdateTaskStatus.COMPLETED;
      
      this.currentTask.endTime = new Date();
      this.currentTask.duration = this.currentTask.endTime.getTime() - startTime.getTime();

      // 保存最后更新时间
      await this.saveLastUpdateTime(this.currentTask.endTime);
      
      // 保存到历史记录
      await this.saveTaskToHistory(this.currentTask);

      console.log(`✅ 更新任务完成: ${this.currentTask.successSites}/${this.currentTask.totalSites} 成功, 新增 ${this.currentTask.newUrls} URL`);
      
      return { ...this.currentTask };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error(`❌ 更新任务失败:`, errorMessage);

      this.currentTask.status = UpdateTaskStatus.FAILED;
      this.currentTask.endTime = new Date();
      this.currentTask.duration = this.currentTask.endTime.getTime() - startTime.getTime();
      this.currentTask.errors.push(errorMessage);

      await this.saveTaskToHistory(this.currentTask);
      
      throw error;
    } finally {
      this.isUpdating = false;
      this.currentTask = null;
    }
  }

  /**
   * 分批更新网站
   * @param websites - 网站列表
   * @param config - 配置
   * @returns SiteUpdateResult[]
   */
  private async updateSitesInBatches(
    websites: CompetitorWebsiteConfig[], 
    config: UpdateTaskConfig
  ): Promise<SiteUpdateResult[]> {
    const results: SiteUpdateResult[] = [];
    const batchSize = config.maxConcurrent;
    
    for (let i = 0; i < websites.length; i += batchSize) {
      const batch = websites.slice(i, i + batchSize);
      const batchPromises = batch.map(website => this.updateSingleSite(website, config));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            websiteId: batch[index].id,
            websiteName: batch[index].name,
            status: ScrapingStatus.FAILED,
            newUrls: 0,
            updatedUrls: 0,
            error: result.reason?.message || '更新失败',
            duration: 0
          });
        }
      });

      // 批次间延迟，避免过度请求
      if (i + batchSize < websites.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * 更新单个网站
   * @param website - 网站配置
   * @param config - 更新配置
   * @returns SiteUpdateResult
   */
  private async updateSingleSite(
    website: CompetitorWebsiteConfig, 
    config: UpdateTaskConfig
  ): Promise<SiteUpdateResult> {
    const startTime = Date.now();
    let retries = 0;
    
    while (retries <= config.maxRetries) {
      try {
        console.log(`🔄 更新网站 ${website.name} (尝试 ${retries + 1}/${config.maxRetries + 1})`);
        
        // 获取旧数据
        const oldSitemapData = await competitorDatabaseService.getSitemapData();
        const oldData = oldSitemapData.find(data => data.websiteId === website.id);
        const oldUrls = new Set(oldData?.urls || []);
        
        // 抓取新数据
        const newSitemapData = await sitemapService.fetchSitemap(website);
        
        if (newSitemapData.status === ScrapingStatus.SUCCESS) {
          // 保存到数据库
          await competitorDatabaseService.saveSitemapData([newSitemapData]);
          
          // 计算差异
          const newUrls = new Set(newSitemapData.urls);
          const addedUrls = [...newUrls].filter(url => !oldUrls.has(url));
          const commonUrls = [...newUrls].filter(url => oldUrls.has(url));
          
          const duration = Date.now() - startTime;
          
          return {
            websiteId: website.id,
            websiteName: website.name,
            status: ScrapingStatus.SUCCESS,
            newUrls: addedUrls.length,
            updatedUrls: commonUrls.length,
            duration
          };
        } else {
          throw new Error(newSitemapData.errorMessage || '抓取失败');
        }
        
      } catch (error) {
        retries++;
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        
        if (retries <= config.maxRetries) {
          console.warn(`⚠️ 网站 ${website.name} 更新失败，将重试: ${errorMessage}`);
          await this.delay(2000 * retries); // 递增延迟
        } else {
          console.error(`❌ 网站 ${website.name} 更新最终失败: ${errorMessage}`);
          return {
            websiteId: website.id,
            websiteName: website.name,
            status: ScrapingStatus.FAILED,
            newUrls: 0,
            updatedUrls: 0,
            error: errorMessage,
            duration: Date.now() - startTime
          };
        }
      }
    }

    // 这里实际上不会执行到，但为了类型安全
    return {
      websiteId: website.id,
      websiteName: website.name,
      status: ScrapingStatus.FAILED,
      newUrls: 0,
      updatedUrls: 0,
      error: '重试次数超限',
      duration: Date.now() - startTime
    };
  }

  /**
   * 保存任务到历史记录
   * @param task - 任务结果
   */
  private async saveTaskToHistory(task: UpdateTaskResult): Promise<void> {
    try {
      const history = await this.loadTaskHistory();
      history.push(task);
      
      // 保持历史记录数量限制
      const trimmedHistory = history
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, this.MAX_HISTORY_SIZE);
      
      localStorage.setItem(this.STORAGE_KEYS.TASK_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.warn('⚠️ 保存任务历史失败:', error);
    }
  }

  /**
   * 加载任务历史
   * @returns UpdateTaskResult[]
   */
  private async loadTaskHistory(): Promise<UpdateTaskResult[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.TASK_HISTORY);
      if (stored) {
        return JSON.parse(stored).map((task: any) => ({
          ...task,
          startTime: new Date(task.startTime),
          endTime: task.endTime ? new Date(task.endTime) : undefined
        }));
      }
      return [];
    } catch (error) {
      console.warn('⚠️ 加载任务历史失败:', error);
      return [];
    }
  }

  /**
   * 保存最后更新时间
   * @param time - 更新时间
   */
  private async saveLastUpdateTime(time: Date): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEYS.LAST_UPDATE, time.toISOString());
    } catch (error) {
      console.warn('⚠️ 保存最后更新时间失败:', error);
    }
  }

  /**
   * 生成任务ID
   * @returns string
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * 延迟执行
   * @param ms - 延迟毫秒数
   * @returns Promise<void>
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const sitemapSchedulerService = new SitemapSchedulerService(); 