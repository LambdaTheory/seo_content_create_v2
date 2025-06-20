/**
 * 内容解析进度监控服务
 * 功能特性：
 * - 解析状态实时追踪
 * - 成功率统计分析
 * - 详细错误日志记录
 * - 性能指标监控
 * - 解析器性能对比
 */

import { ParseResult } from './WebContentParsingService';

/**
 * 解析状态枚举
 */
export enum ParseStatus {
  PENDING = 'pending',
  PARSING = 'parsing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 解析任务信息
 */
export interface ParseTask {
  /** 任务ID */
  id: string;
  /** 目标URL */
  url: string;
  /** 使用的解析器 */
  parser: string;
  /** 任务状态 */
  status: ParseStatus;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 解析时长 */
  duration?: number;
  /** 质量评分 */
  qualityScore?: number;
  /** 置信度 */
  confidence?: number;
  /** 错误信息 */
  error?: string;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 错误日志条目
 */
export interface ErrorLogEntry {
  /** 日志ID */
  id: string;
  /** 时间戳 */
  timestamp: Date;
  /** 错误级别 */
  level: 'warning' | 'error' | 'critical';
  /** 错误来源 */
  source: string;
  /** 目标URL */
  url: string;
  /** 错误代码 */
  errorCode?: string;
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 解析器名称 */
  parser: string;
  /** 重试次数 */
  retryCount?: number;
  /** 用户代理 */
  userAgent?: string;
  /** 额外数据 */
  extra?: Record<string, any>;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 平均解析时间 */
  avgParseTime: number;
  /** 最快解析时间 */
  minParseTime: number;
  /** 最慢解析时间 */
  maxParseTime: number;
  /** 总解析次数 */
  totalParses: number;
  /** 成功解析次数 */
  successCount: number;
  /** 失败解析次数 */
  failureCount: number;
  /** 成功率 */
  successRate: number;
  /** 平均质量评分 */
  avgQualityScore: number;
  /** 平均置信度 */
  avgConfidence: number;
  /** 每小时解析数 */
  parsesPerHour: number;
  /** 错误率分布 */
  errorDistribution: Record<string, number>;
}

/**
 * 解析器性能对比
 */
export interface ParserComparison {
  /** 解析器名称 */
  name: string;
  /** 支持的域名 */
  domains: string[];
  /** 解析次数 */
  parseCount: number;
  /** 成功率 */
  successRate: number;
  /** 平均解析时间 */
  avgParseTime: number;
  /** 平均质量评分 */
  avgQuality: number;
  /** 平均置信度 */
  avgConfidence: number;
  /** 主要错误类型 */
  topErrors: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * 监控配置
 */
export interface MonitorConfig {
  /** 是否启用详细日志 */
  enableDetailedLogging: boolean;
  /** 日志保留天数 */
  logRetentionDays: number;
  /** 性能指标刷新间隔(秒) */
  metricsUpdateInterval: number;
  /** 错误日志最大条数 */
  maxErrorLogEntries: number;
  /** 任务历史最大条数 */
  maxTaskHistory: number;
  /** 是否启用实时监控 */
  enableRealTimeMonitoring: boolean;
}

/**
 * 实时监控状态
 */
export interface RealTimeStatus {
  /** 当前活跃任务数 */
  activeTasks: number;
  /** 等待任务数 */
  pendingTasks: number;
  /** 今日解析总数 */
  todayParseCount: number;
  /** 今日成功率 */
  todaySuccessRate: number;
  /** 当前小时解析数 */
  currentHourParses: number;
  /** 最近错误数(1小时内) */
  recentErrors: number;
  /** 系统状态 */
  systemStatus: 'healthy' | 'warning' | 'error';
  /** 状态更新时间 */
  lastUpdateTime: Date;
}

/**
 * 内容解析进度监控服务
 */
export class ContentParsingMonitorService {
  private readonly DEFAULT_CONFIG: MonitorConfig = {
    enableDetailedLogging: true,
    logRetentionDays: 30,
    metricsUpdateInterval: 60, // 60秒
    maxErrorLogEntries: 10000,
    maxTaskHistory: 50000,
    enableRealTimeMonitoring: true
  };

  private config: MonitorConfig;
  private tasks = new Map<string, ParseTask>();
  private errorLogs: ErrorLogEntry[] = [];
  private metrics: PerformanceMetrics;
  private realTimeStatus: RealTimeStatus;
  private metricsUpdateTimer?: NodeJS.Timeout;

  constructor(config?: Partial<MonitorConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
    this.realTimeStatus = this.initializeRealTimeStatus();
    
    if (this.config.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring();
    }
  }

  /**
   * 开始解析任务
   */
  public startTask(url: string, parser: string, metadata?: Record<string, any>): string {
    const taskId = this.generateTaskId();
    const task: ParseTask = {
      id: taskId,
      url,
      parser,
      status: ParseStatus.PARSING,
      startTime: new Date(),
      metadata
    };

    this.tasks.set(taskId, task);
    this.updateRealTimeStatus();
    
    if (this.config.enableDetailedLogging) {
      this.logInfo(`开始解析任务: ${url} (解析器: ${parser})`, parser, url);
    }

    return taskId;
  }

  /**
   * 完成解析任务
   */
  public completeTask(taskId: string, result: ParseResult): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logWarning(`任务不存在: ${taskId}`, 'monitor', '');
      return;
    }

    task.endTime = new Date();
    task.duration = result.parseTime; // 使用解析结果中的parseTime而不是实际耗时
    task.status = result.success ? ParseStatus.SUCCESS : ParseStatus.FAILED;
    task.qualityScore = result.qualityScore;
    task.confidence = result.confidence;

    if (!result.success) {
      task.error = result.error;
      this.logError(
        `解析失败: ${result.error}`,
        task.parser,
        task.url,
        undefined,
        { taskId, parseTime: result.parseTime }
      );
    } else if (this.config.enableDetailedLogging) {
      this.logInfo(
        `解析成功: 质量评分=${result.qualityScore}, 置信度=${result.confidence}`,
        task.parser,
        task.url
      );
    }

    this.updateMetrics(task);
    this.updateRealTimeStatus();
    this.cleanupOldTasks();
  }

  /**
   * 取消解析任务
   */
  public cancelTask(taskId: string, reason?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = ParseStatus.CANCELLED;
    task.endTime = new Date();
    task.error = reason || '用户取消';

    this.logWarning(`任务被取消: ${reason || '用户取消'}`, task.parser, task.url);
    this.updateRealTimeStatus();
  }

  /**
   * 记录错误日志
   */
  public logError(
    message: string,
    parser: string,
    url: string,
    error?: Error,
    extra?: Record<string, any>
  ): void {
    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level: 'error',
      source: 'parsing',
      url,
      message,
      parser,
      stack: error?.stack,
      extra
    };

    this.errorLogs.unshift(logEntry);
    this.cleanupOldLogs();
  }

  /**
   * 记录警告日志
   */
  public logWarning(message: string, parser: string, url: string, extra?: Record<string, any>): void {
    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level: 'warning',
      source: 'parsing',
      url,
      message,
      parser,
      extra
    };

    this.errorLogs.unshift(logEntry);
    this.cleanupOldLogs();
  }

  /**
   * 记录信息日志
   */
  public logInfo(message: string, parser: string, url: string, extra?: Record<string, any>): void {
    if (!this.config.enableDetailedLogging) return;

    // 信息日志不存储，只用于调试
    console.log(`[INFO] ${new Date().toISOString()} [${parser}] ${message}`, { url, extra });
  }

  /**
   * 获取当前活跃任务
   */
  public getActiveTasks(): ParseTask[] {
    return Array.from(this.tasks.values()).filter(
      task => task.status === ParseStatus.PARSING || task.status === ParseStatus.PENDING
    );
  }

  /**
   * 获取任务历史
   */
  public getTaskHistory(limit: number = 100): ParseTask[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * 获取错误日志
   */
  public getErrorLogs(limit: number = 100): ErrorLogEntry[] {
    return this.errorLogs.slice(0, limit);
  }

  /**
   * 获取性能指标
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取实时状态
   */
  public getRealTimeStatus(): RealTimeStatus {
    return { ...this.realTimeStatus };
  }

  /**
   * 获取解析器性能对比
   */
  public getParserComparison(): ParserComparison[] {
    const parserStats = new Map<string, {
      tasks: ParseTask[];
      errors: ErrorLogEntry[];
    }>();

    // 收集解析器数据
    for (const task of this.tasks.values()) {
      if (!parserStats.has(task.parser)) {
        parserStats.set(task.parser, { tasks: [], errors: [] });
      }
      parserStats.get(task.parser)!.tasks.push(task);
    }

    for (const error of this.errorLogs) {
      if (parserStats.has(error.parser)) {
        parserStats.get(error.parser)!.errors.push(error);
      }
    }

    // 生成对比数据
    const comparisons: ParserComparison[] = [];
    for (const [parser, data] of parserStats.entries()) {
      const { tasks, errors } = data;
      const successTasks = tasks.filter(t => t.status === ParseStatus.SUCCESS);

      // 统计错误类型
      const errorCounts = new Map<string, number>();
      for (const error of errors) {
        const key = error.message.substring(0, 50); // 截取前50字符作为错误类型
        errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
      }

      const topErrors = Array.from(errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([error, count]) => ({
          error,
          count,
          percentage: (count / errors.length) * 100
        }));

      comparisons.push({
        name: parser,
        domains: [], // 这里可以从解析器配置获取
        parseCount: tasks.length,
        successRate: tasks.length > 0 ? (successTasks.length / tasks.length) * 100 : 0,
        avgParseTime: tasks.length > 0 
          ? tasks.filter(t => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0) / tasks.filter(t => t.duration).length
          : 0,
        avgQuality: successTasks.length > 0
          ? successTasks.reduce((sum, t) => sum + (t.qualityScore || 0), 0) / successTasks.length
          : 0,
        avgConfidence: successTasks.length > 0
          ? successTasks.reduce((sum, t) => sum + (t.confidence || 0), 0) / successTasks.length
          : 0,
        topErrors
      });
    }

    return comparisons.sort((a, b) => b.parseCount - a.parseCount);
  }

  /**
   * 清空所有数据
   */
  public clearAllData(): void {
    this.tasks.clear();
    this.errorLogs.length = 0;
    this.metrics = this.initializeMetrics();
    this.realTimeStatus = this.initializeRealTimeStatus();
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableRealTimeMonitoring !== undefined) {
      if (newConfig.enableRealTimeMonitoring) {
        this.startRealTimeMonitoring();
      } else {
        this.stopRealTimeMonitoring();
      }
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): MonitorConfig {
    return { ...this.config };
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.stopRealTimeMonitoring();
    this.tasks.clear();
    this.errorLogs.length = 0;
  }

  /**
   * 初始化性能指标
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      avgParseTime: 0,
      minParseTime: 0,
      maxParseTime: 0,
      totalParses: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      avgQualityScore: 0,
      avgConfidence: 0,
      parsesPerHour: 0,
      errorDistribution: {}
    };
  }

  /**
   * 初始化实时状态
   */
  private initializeRealTimeStatus(): RealTimeStatus {
    return {
      activeTasks: 0,
      pendingTasks: 0,
      todayParseCount: 0,
      todaySuccessRate: 0,
      currentHourParses: 0,
      recentErrors: 0,
      systemStatus: 'healthy',
      lastUpdateTime: new Date()
    };
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(task: ParseTask): void {
    this.metrics.totalParses++;
    
    if (task.status === ParseStatus.SUCCESS) {
      this.metrics.successCount++;
    } else if (task.status === ParseStatus.FAILED) {
      this.metrics.failureCount++;
    }

    this.metrics.successRate = (this.metrics.successCount / this.metrics.totalParses) * 100;

    if (task.duration) {
      if (this.metrics.minParseTime === 0 || task.duration < this.metrics.minParseTime) {
        this.metrics.minParseTime = task.duration;
      }
      if (task.duration > this.metrics.maxParseTime) {
        this.metrics.maxParseTime = task.duration;
      }

      // 重新计算平均解析时间
      const allDurations = Array.from(this.tasks.values())
        .filter(t => t.duration)
        .map(t => t.duration!);
      
      this.metrics.avgParseTime = allDurations.length > 0
        ? allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length
        : 0;
    }

    // 更新质量评分和置信度
    if (task.status === ParseStatus.SUCCESS && task.qualityScore !== undefined) {
      const successTasks = Array.from(this.tasks.values())
        .filter(t => t.status === ParseStatus.SUCCESS && t.qualityScore !== undefined);

      this.metrics.avgQualityScore = successTasks.length > 0
        ? successTasks.reduce((sum, t) => sum + (t.qualityScore || 0), 0) / successTasks.length
        : 0;

      this.metrics.avgConfidence = successTasks.length > 0
        ? successTasks.reduce((sum, t) => sum + (t.confidence || 0), 0) / successTasks.length
        : 0;
    }

    // 计算每小时解析数
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTasks = Array.from(this.tasks.values())
      .filter(t => t.startTime > oneHourAgo);
    this.metrics.parsesPerHour = recentTasks.length;
  }

  /**
   * 更新实时状态
   */
  private updateRealTimeStatus(): void {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 活跃任务
    const activeTasks = Array.from(this.tasks.values()).filter(
      t => t.status === ParseStatus.PARSING || t.status === ParseStatus.PENDING
    );
    this.realTimeStatus.activeTasks = activeTasks.filter(t => t.status === ParseStatus.PARSING).length;
    this.realTimeStatus.pendingTasks = activeTasks.filter(t => t.status === ParseStatus.PENDING).length;

    // 今日数据
    const todayTasks = Array.from(this.tasks.values()).filter(t => t.startTime >= todayStart);
    this.realTimeStatus.todayParseCount = todayTasks.length;
    const todaySuccess = todayTasks.filter(t => t.status === ParseStatus.SUCCESS).length;
    this.realTimeStatus.todaySuccessRate = todayTasks.length > 0 
      ? (todaySuccess / todayTasks.length) * 100 
      : 0;

    // 当前小时数据
    const hourTasks = Array.from(this.tasks.values()).filter(t => t.startTime >= hourStart);
    this.realTimeStatus.currentHourParses = hourTasks.length;

    // 最近错误
    const recentErrors = this.errorLogs.filter(e => e.timestamp >= oneHourAgo && e.level === 'error');
    this.realTimeStatus.recentErrors = recentErrors.length;

    // 系统状态评估
    const errorRate = todayTasks.length > 0 
      ? ((todayTasks.length - todaySuccess) / todayTasks.length) * 100 
      : 0;
    
    if (errorRate > 50 || this.realTimeStatus.recentErrors > 100) {
      this.realTimeStatus.systemStatus = 'error';
    } else if (errorRate > 20 || this.realTimeStatus.recentErrors > 50) {
      this.realTimeStatus.systemStatus = 'warning';
    } else {
      this.realTimeStatus.systemStatus = 'healthy';
    }

    this.realTimeStatus.lastUpdateTime = now;
  }

  /**
   * 启动实时监控
   */
  private startRealTimeMonitoring(): void {
    if (this.metricsUpdateTimer) {
      clearInterval(this.metricsUpdateTimer);
    }

    this.metricsUpdateTimer = setInterval(() => {
      this.updateRealTimeStatus();
    }, this.config.metricsUpdateInterval * 1000);
  }

  /**
   * 停止实时监控
   */
  private stopRealTimeMonitoring(): void {
    if (this.metricsUpdateTimer) {
      clearInterval(this.metricsUpdateTimer);
      this.metricsUpdateTimer = undefined;
    }
  }

  /**
   * 清理旧任务
   */
  private cleanupOldTasks(): void {
    if (this.tasks.size <= this.config.maxTaskHistory) return;

    const sortedTasks = Array.from(this.tasks.entries())
      .sort(([, a], [, b]) => b.startTime.getTime() - a.startTime.getTime());

    // 只保留最新的任务
    const tasksToKeep = sortedTasks.slice(0, this.config.maxTaskHistory);
    
    this.tasks.clear();
    for (const [id, task] of tasksToKeep) {
      this.tasks.set(id, task);
    }
  }

  /**
   * 清理旧日志
   */
  private cleanupOldLogs(): void {
    // 按数量限制
    if (this.errorLogs.length > this.config.maxErrorLogEntries) {
      this.errorLogs = this.errorLogs.slice(0, this.config.maxErrorLogEntries);
    }

    // 按时间限制
    const cutoffDate = new Date(Date.now() - this.config.logRetentionDays * 24 * 60 * 60 * 1000);
    this.errorLogs = this.errorLogs.filter(log => log.timestamp > cutoffDate);
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成日志ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 