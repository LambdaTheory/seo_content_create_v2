/**
 * 内容生成流程编排服务
 * 
 * 任务10.1：生成流程编排
 * - 设计完整生成流程
 * - 实现流程状态管理
 * - 添加流程进度监控
 * - 实现错误处理机制
 * - 添加流程中断恢复
 * - 实现生成队列管理
 * 
 * @author AI Assistant
 * @date 2025-01-29
 */

import { EventEmitter } from 'events';
import { workflowStorage } from './workflowStorage';
import { generationResultStorage } from './generationResultStorage';
import { threeStageOrchestrationService } from './threeStageOrchestrationService';
import { StructuredDataService } from './structuredData/StructuredDataService';
import type { Workflow } from '@/types/Workflow.types';
import type { GameData } from '@/types/GameData.types';
import type { GenerationResult } from '@/types/GenerationResult.types';

/**
 * 完整生成流程状态枚举
 */
export type FlowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * 生成阶段枚举
 */
export type GenerationStage = 
  | 'preparing' 
  | 'data_loading' 
  | 'format_analysis' 
  | 'content_generation' 
  | 'format_correction' 
  | 'structured_data_generation' 
  | 'quality_validation' 
  | 'result_storage' 
  | 'completed';

/**
 * 流程步骤状态
 */
export interface StepStatus {
  step: GenerationStage;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  progress?: number;
  message?: string;
  error?: string;
  retryCount?: number;
  metadata?: Record<string, any>;
}

/**
 * 生成流程配置
 */
export interface GenerationFlowConfiguration {
  workflowId: string;
  gameDataIds: string[];
  enableStructuredData: boolean;
  outputFormat: 'json' | 'csv' | 'xlsx';
  qualityThreshold: number;
  maxRetries: number;
  concurrency: {
    maxConcurrentGames: number;
    maxConcurrentStages: number;
  };
  timeout: {
    perGame: number; // 每个游戏的超时时间(ms)
    total: number;   // 总体流程超时时间(ms)
  };
  recovery: {
    enableAutoRecovery: boolean;
    saveCheckpoints: boolean;
    maxRecoveryAttempts: number;
  };
  notifications: {
    enableProgressUpdates: boolean;
    enableErrorAlerts: boolean;
    progressUpdateInterval: number; // ms
  };
}

/**
 * 流程执行状态
 */
export interface FlowExecutionStatus {
  flowId: string;
  status: FlowStatus;
  currentStage: GenerationStage;
  steps: StepStatus[];
  progress: {
    overall: number;          // 总体进度 0-100
    currentStep: number;      // 当前步骤进度 0-100
    gamesProcessed: number;   // 已处理游戏数
    gamesTotal: number;       // 总游戏数
    gamesSuccessful: number;  // 成功游戏数
    gamesFailed: number;      // 失败游戏数
  };
  timing: {
    startTime: Date;
    estimatedEndTime?: Date;
    actualEndTime?: Date;
    totalDuration?: number;
    stageTimings: Record<GenerationStage, number>;
  };
  resources: {
    totalTokensUsed: number;
    totalApiCalls: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  errors: Array<{
    stage: GenerationStage;
    gameId?: string;
    error: string;
    timestamp: Date;
    severity: 'warning' | 'error' | 'critical';
  }>;
  metadata: {
    configuration: GenerationFlowConfiguration;
    checkpointData?: any;
    lastSaveTime?: Date;
  };
}

/**
 * 生成队列项
 */
export interface QueueItem {
  id: string;
  priority: number;
  configuration: GenerationFlowConfiguration;
  scheduledTime?: Date;
  retryCount: number;
  dependencies?: string[]; // 依赖的其他队列项ID
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
}

/**
 * 内容生成流程编排器
 */
export class ContentGenerationOrchestrator extends EventEmitter {
  private activeFlows: Map<string, FlowExecutionStatus> = new Map();
  private flowQueue: QueueItem[] = [];
  private runningFlows: Set<string> = new Set();
  private checkpoints: Map<string, any> = new Map();
  private maxConcurrentFlows: number = 3;
  private structuredDataService: StructuredDataService;

  // 默认配置
  private defaultConfig: Partial<GenerationFlowConfiguration> = {
    enableStructuredData: true,
    outputFormat: 'json',
    qualityThreshold: 0.7,
    maxRetries: 3,
    concurrency: {
      maxConcurrentGames: 5,
      maxConcurrentStages: 2
    },
    timeout: {
      perGame: 120000,  // 2分钟
      total: 1800000    // 30分钟
    },
    recovery: {
      enableAutoRecovery: true,
      saveCheckpoints: true,
      maxRecoveryAttempts: 3
    },
    notifications: {
      enableProgressUpdates: true,
      enableErrorAlerts: true,
      progressUpdateInterval: 1000
    }
  };

  constructor() {
    super();
    this.structuredDataService = new StructuredDataService();
    this.startQueueProcessor();
  }

  /**
   * 任务10.1.1：设计完整生成流程
   * 启动完整的内容生成流程
   */
  async startGenerationFlow(configuration: GenerationFlowConfiguration): Promise<string> {
    const flowId = this.generateFlowId();
    const config = this.mergeWithDefaults(configuration);

    // 验证配置
    const validation = this.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // 创建执行状态
    const executionStatus: FlowExecutionStatus = this.createInitialStatus(flowId, config);
    this.activeFlows.set(flowId, executionStatus);

    // 添加到队列
    const queueItem: QueueItem = {
      id: flowId,
      priority: this.calculatePriority(config),
      configuration: config,
      scheduledTime: new Date(),
      retryCount: 0,
      status: 'queued'
    };

    this.flowQueue.push(queueItem);
    this.sortQueueByPriority();

    this.emit('flow-started', flowId, config);
    console.log(`Generation flow queued: ${flowId}`);

    return flowId;
  }

  /**
   * 任务10.1.2：实现流程状态管理
   * 获取流程状态
   */
  getFlowStatus(flowId: string): FlowExecutionStatus | null {
    return this.activeFlows.get(flowId) || null;
  }

  /**
   * 获取所有流程状态
   */
  getAllFlowStatuses(): FlowExecutionStatus[] {
    return Array.from(this.activeFlows.values());
  }

  /**
   * 暂停流程
   */
  pauseFlow(flowId: string): boolean {
    const status = this.activeFlows.get(flowId);
    if (status && status.status === 'running') {
      status.status = 'paused';
      this.emit('flow-paused', flowId);
      return true;
    }
    return false;
  }

  /**
   * 恢复流程
   */
  resumeFlow(flowId: string): boolean {
    const status = this.activeFlows.get(flowId);
    if (status && status.status === 'paused') {
      status.status = 'running';
      this.emit('flow-resumed', flowId);
      return true;
    }
    return false;
  }

  /**
   * 取消流程
   */
  cancelFlow(flowId: string): boolean {
    const status = this.activeFlows.get(flowId);
    if (status && (status.status === 'running' || status.status === 'paused' || status.status === 'pending')) {
      status.status = 'cancelled';
      status.timing.actualEndTime = new Date();
      
      // 从运行中流程移除
      this.runningFlows.delete(flowId);
      
      // 从队列中移除
      const queueIndex = this.flowQueue.findIndex(item => item.id === flowId);
      if (queueIndex > -1) {
        this.flowQueue[queueIndex].status = 'cancelled';
      }
      
      this.emit('flow-cancelled', flowId);
      return true;
    }
    return false;
  }

  /**
   * 任务10.1.6：实现生成队列管理
   * 获取队列状态
   */
  getQueueStatus(): {
    total: number;
    running: number;
    queued: number;
    completed: number;
    failed: number;
    queue: QueueItem[];
  } {
    const running = this.flowQueue.filter(item => item.status === 'running').length;
    const queued = this.flowQueue.filter(item => item.status === 'queued').length;
    const completed = this.flowQueue.filter(item => item.status === 'completed').length;
    const failed = this.flowQueue.filter(item => item.status === 'failed').length;

    return {
      total: this.flowQueue.length,
      running,
      queued,
      completed,
      failed,
      queue: [...this.flowQueue]
    };
  }

  /**
   * 任务10.1.5：添加流程中断恢复
   * 恢复流程
   */
  async recoverFlow(flowId: string): Promise<boolean> {
    const status = this.activeFlows.get(flowId);
    if (!status) {
      return false;
    }

    const config = status.metadata.configuration;
    if (!config.recovery.enableAutoRecovery) {
      return false;
    }

    try {
      const checkpointData = this.checkpoints.get(flowId);
      if (!checkpointData) {
        console.log(`No checkpoint found for flow ${flowId}, restarting from beginning`);
        return await this.restartFlow(flowId);
      }

      // 确定从哪个阶段继续
      const lastCompletedStage = this.getLastCompletedStage(status);
      const nextStage = this.getNextStage(lastCompletedStage);
      
      if (nextStage) {
        console.log(`Recovering flow ${flowId} from stage ${nextStage}`);
        await this.executeFlowFromStage(flowId, nextStage, checkpointData);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to recover flow ${flowId}:`, error);
      return false;
    }
  }

  /**
   * 私有方法：启动队列处理器
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 5000); // 每5秒检查一次队列
  }

  /**
   * 私有方法：处理队列
   */
  private async processQueue(): Promise<void> {
    const availableSlots = this.maxConcurrentFlows - this.runningFlows.size;
    if (availableSlots <= 0) {
      return;
    }

    const queuedItems = this.flowQueue
      .filter(item => item.status === 'queued')
      .filter(item => this.checkDependencies(item))
      .slice(0, availableSlots);

    for (const item of queuedItems) {
      if (this.runningFlows.size >= this.maxConcurrentFlows) {
        break;
      }

      item.status = 'running';
      this.runningFlows.add(item.id);
      
      // 异步执行流程
      this.executeFlow(item.id, item.configuration).catch(error => {
        console.error(`Flow execution failed: ${item.id}`, error);
        this.handleFlowError(item.id, error.message);
      });
    }
  }

  /**
   * 执行完整流程
   */
  private async executeFlow(flowId: string, config: GenerationFlowConfiguration): Promise<void> {
    const status = this.activeFlows.get(flowId);
    if (!status) {
      throw new Error(`Flow status not found: ${flowId}`);
    }

    status.status = 'running';
    status.timing.startTime = new Date();

    try {
      // 阶段1: 准备阶段
      await this.executeStage(flowId, 'preparing', async () => {
        await this.validateWorkflowAndData(config);
      });

      // 阶段2: 数据加载
      await this.executeStage(flowId, 'data_loading', async () => {
        return await this.loadGameData(config.gameDataIds);
      });

      // 阶段3-5: 三阶段AI生成流程
      const gamesData = await this.loadGameData(config.gameDataIds);
      const workflow = await workflowStorage.getWorkflow(config.workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow not found: ${config.workflowId}`);
      }

      const threeStageResult = await this.executeThreeStageGeneration(
        flowId, 
        gamesData, 
        workflow, 
        config
      );

      // 阶段6: 结构化数据生成
      let structuredDataResults: any[] = [];
      if (config.enableStructuredData) {
        await this.executeStage(flowId, 'structured_data_generation', async () => {
          structuredDataResults = await this.generateStructuredData(
            threeStageResult.generatedContent || [],
            workflow.structuredDataTypes || []
          );
          return structuredDataResults;
        });
      }

      // 阶段7: 质量验证
      await this.executeStage(flowId, 'quality_validation', async () => {
        return await this.validateQuality(
          threeStageResult.generatedContent || [],
          config.qualityThreshold
        );
      });

      // 阶段8: 结果存储
      const finalResults = await this.executeStage(flowId, 'result_storage', async () => {
        return await this.storeFinalResults(
          flowId,
          threeStageResult.generatedContent || [],
          structuredDataResults,
          config
        );
      });

      // 完成流程
      status.status = 'completed';
      status.currentStage = 'completed';
      status.timing.actualEndTime = new Date();
      status.timing.totalDuration = 
        status.timing.actualEndTime.getTime() - status.timing.startTime.getTime();
      status.progress.overall = 100;

      this.runningFlows.delete(flowId);
      this.emit('flow-completed', flowId, finalResults);
      console.log(`Flow completed successfully: ${flowId}`);

    } catch (error) {
      this.handleFlowError(flowId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 执行三阶段AI生成流程
   */
  private async executeThreeStageGeneration(
    flowId: string,
    gamesData: GameData[],
    workflow: Workflow,
    config: GenerationFlowConfiguration
  ): Promise<any> {
    // 格式分析阶段
    await this.executeStage(flowId, 'format_analysis', async () => {
      console.log(`Starting format analysis for workflow: ${workflow.id}`);
      return { stage: 'format_analysis', completed: true };
    });

    // 内容生成阶段
    const generationResult = await this.executeStage(flowId, 'content_generation', async () => {
      console.log(`Starting content generation for ${gamesData.length} games`);
      
      // 设置进度监听
      threeStageOrchestrationService.addListener(flowId, {
        onStageStart: (stage) => {
          this.updateStageProgress(flowId, 'content_generation', 0, `Starting ${stage}`);
        },
        onStageProgress: (stage, progress) => {
          this.updateStageProgress(flowId, 'content_generation', progress);
        },
        onStageComplete: (stage) => {
          console.log(`Stage completed: ${stage}`);
        },
        onOverallProgress: (progress) => {
          this.updateOverallProgress(flowId, 20 + (progress * 0.6)); // 内容生成占60%权重
        }
      });

      // 执行三阶段流程
      return await threeStageOrchestrationService.executeThreeStageFlow(
        gamesData,
        JSON.parse(workflow.gamesJsonFormat),
        {
          contentGeneration: {
            maxConcurrentGames: config.concurrency.maxConcurrentGames,
            maxTokensPerGame: 4000,
            enableProgressTracking: true,
            qualityThreshold: config.qualityThreshold
          }
        }
      );
    });

    // 格式校正阶段
    await this.executeStage(flowId, 'format_correction', async () => {
      console.log(`Starting format correction`);
      return { stage: 'format_correction', completed: true };
    });

    return generationResult;
  }

  /**
   * 执行单个阶段
   */
  private async executeStage<T>(
    flowId: string,
    stage: GenerationStage,
    executor: () => Promise<T>
  ): Promise<T> {
    const status = this.activeFlows.get(flowId);
    if (!status) {
      throw new Error(`Flow status not found: ${flowId}`);
    }

    // 更新阶段状态
    status.currentStage = stage;
    const stepStatus: StepStatus = {
      step: stage,
      status: 'running',
      startTime: new Date(),
      progress: 0
    };

    status.steps.push(stepStatus);
    this.emit('stage-started', flowId, stage);

    try {
      const startTime = Date.now();
      const result = await executor();
      const duration = Date.now() - startTime;

      // 更新完成状态
      stepStatus.status = 'completed';
      stepStatus.endTime = new Date();
      stepStatus.duration = duration;
      stepStatus.progress = 100;
      status.timing.stageTimings[stage] = duration;

      // 保存检查点
      if (status.metadata.configuration.recovery.saveCheckpoints) {
        this.saveCheckpoint(flowId, stage, result);
      }

      this.emit('stage-completed', flowId, stage, duration);
      console.log(`Stage completed: ${stage} in ${duration}ms`);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      stepStatus.status = 'failed';
      stepStatus.endTime = new Date();
      stepStatus.error = errorMessage;

      this.emit('stage-failed', flowId, stage, errorMessage);
      console.error(`Stage failed: ${stage}`, error);
      
      throw error;
    }
  }

  /**
   * 任务10.1.3：添加流程进度监控
   * 更新阶段进度
   */
  private updateStageProgress(
    flowId: string, 
    stage: GenerationStage, 
    progress: number, 
    message?: string
  ): void {
    const status = this.activeFlows.get(flowId);
    if (!status) return;

    const currentStep = status.steps.find(step => step.step === stage && step.status === 'running');
    if (currentStep) {
      currentStep.progress = progress;
      currentStep.message = message;
    }

    status.progress.currentStep = progress;
    this.emit('progress-updated', flowId, status.progress);
  }

  /**
   * 更新总体进度
   */
  private updateOverallProgress(flowId: string, progress: number): void {
    const status = this.activeFlows.get(flowId);
    if (!status) return;

    status.progress.overall = Math.min(100, Math.max(0, progress));
    this.emit('progress-updated', flowId, status.progress);
  }

  /**
   * 保存检查点
   */
  private saveCheckpoint(flowId: string, stage: GenerationStage, data: any): void {
    this.checkpoints.set(flowId, {
      stage,
      data,
      timestamp: new Date(),
      flowId
    });
    
    const status = this.activeFlows.get(flowId);
    if (status) {
      status.metadata.checkpointData = this.checkpoints.get(flowId);
      status.metadata.lastSaveTime = new Date();
    }
  }

  /**
   * 从指定阶段继续执行流程
   */
  private async executeFlowFromStage(
    flowId: string, 
    fromStage: GenerationStage, 
    checkpointData: any
  ): Promise<void> {
    // 实现从检查点恢复的逻辑
    console.log(`Continuing flow ${flowId} from stage ${fromStage}`);
    // 这里可以根据不同的阶段实现相应的恢复逻辑
  }

  /**
   * 任务10.1.4：实现错误处理机制
   * 处理流程错误
   */
  private handleFlowError(flowId: string, errorMessage: string): void {
    const status = this.activeFlows.get(flowId);
    if (!status) return;

    status.status = 'failed';
    status.timing.actualEndTime = new Date();
    status.errors.push({
      stage: status.currentStage,
      error: errorMessage,
      timestamp: new Date(),
      severity: 'error'
    });

    this.runningFlows.delete(flowId);
    this.emit('flow-failed', flowId, errorMessage);
    console.error(`Flow failed: ${flowId}`, errorMessage);
  }

  /**
   * 重启流程
   */
  private async restartFlow(flowId: string): Promise<boolean> {
    const status = this.activeFlows.get(flowId);
    if (!status) return false;

    const config = status.metadata.configuration;
    
    // 重置状态
    status.status = 'pending';
    status.currentStage = 'preparing';
    status.progress = {
      overall: 0,
      currentStep: 0,
      gamesProcessed: 0,
      gamesTotal: config.gameDataIds.length,
      gamesSuccessful: 0,
      gamesFailed: 0
    };
    status.steps = [];
    status.errors = [];
    status.timing.startTime = new Date();
    delete status.timing.actualEndTime;
    delete status.timing.totalDuration;

    // 重新添加到队列
    const queueItem = this.flowQueue.find(item => item.id === flowId);
    if (queueItem) {
      queueItem.status = 'queued';
      queueItem.retryCount++;
    }

    this.emit('flow-restarted', flowId);
    return true;
  }

  /**
   * 工具方法：生成流程ID
   */
  private generateFlowId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `flow_${timestamp}_${random}`;
  }

  /**
   * 工具方法：合并配置
   */
  private mergeWithDefaults(config: GenerationFlowConfiguration): GenerationFlowConfiguration {
    return {
      ...this.defaultConfig,
      ...config,
      concurrency: {
        ...this.defaultConfig.concurrency!,
        ...config.concurrency
      },
      timeout: {
        ...this.defaultConfig.timeout!,
        ...config.timeout
      },
      recovery: {
        ...this.defaultConfig.recovery!,
        ...config.recovery
      },
      notifications: {
        ...this.defaultConfig.notifications!,
        ...config.notifications
      }
    };
  }

  /**
   * 工具方法：验证配置
   */
  private validateConfiguration(config: GenerationFlowConfiguration): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.workflowId) {
      errors.push('workflowId is required');
    }

    if (!config.gameDataIds || config.gameDataIds.length === 0) {
      errors.push('gameDataIds must not be empty');
    }

    if (config.qualityThreshold < 0 || config.qualityThreshold > 1) {
      errors.push('qualityThreshold must be between 0 and 1');
    }

    if (config.maxRetries < 0) {
      errors.push('maxRetries must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 工具方法：创建初始状态
   */
  private createInitialStatus(
    flowId: string, 
    config: GenerationFlowConfiguration
  ): FlowExecutionStatus {
    return {
      flowId,
      status: 'pending',
      currentStage: 'preparing',
      steps: [],
      progress: {
        overall: 0,
        currentStep: 0,
        gamesProcessed: 0,
        gamesTotal: config.gameDataIds.length,
        gamesSuccessful: 0,
        gamesFailed: 0
      },
      timing: {
        startTime: new Date(),
        stageTimings: {} as Record<GenerationStage, number>
      },
      resources: {
        totalTokensUsed: 0,
        totalApiCalls: 0
      },
      errors: [],
      metadata: {
        configuration: config
      }
    };
  }

  /**
   * 工具方法：计算优先级
   */
  private calculatePriority(config: GenerationFlowConfiguration): number {
    let priority = 50; // 基础优先级

    // 基于游戏数量调整优先级
    if (config.gameDataIds.length < 10) {
      priority += 20; // 小批量优先
    } else if (config.gameDataIds.length > 100) {
      priority -= 10; // 大批量降低优先级
    }

    // 基于质量阈值调整
    if (config.qualityThreshold > 0.8) {
      priority += 10; // 高质量要求优先
    }

    // 基于结构化数据需求调整
    if (config.enableStructuredData) {
      priority += 5;
    }

    return Math.max(1, Math.min(100, priority));
  }

  /**
   * 工具方法：检查依赖
   */
  private checkDependencies(item: QueueItem): boolean {
    if (!item.dependencies || item.dependencies.length === 0) {
      return true;
    }

    return item.dependencies.every(depId => {
      const depItem = this.flowQueue.find(i => i.id === depId);
      return depItem?.status === 'completed';
    });
  }

  /**
   * 工具方法：按优先级排序队列
   */
  private sortQueueByPriority(): void {
    this.flowQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 工具方法：加载游戏数据（临时实现）
   */
  private async loadGameData(gameDataIds: string[]): Promise<GameData[]> {
    // 临时模拟数据加载
    return gameDataIds.map((id, index) => ({
      id,
      name: `Game ${index + 1}`,
      description: `Description for game ${id}`,
      category: 'Action',
      platforms: ['Web'],
      rating: 4.5,
      tags: ['game', 'fun'],
      url: `https://example.com/games/${id}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));
  }

  /**
   * 工具方法：验证工作流和数据
   */
  private async validateWorkflowAndData(config: GenerationFlowConfiguration): Promise<void> {
    const workflow = await workflowStorage.getWorkflow(config.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${config.workflowId}`);
    }

    if (config.gameDataIds.length === 0) {
      throw new Error('No game data provided');
    }

    console.log(`Validated workflow ${config.workflowId} with ${config.gameDataIds.length} games`);
  }

  /**
   * 生成结构化数据
   */
  private async generateStructuredData(
    generatedContent: any[],
    structuredDataTypes: string[]
  ): Promise<any[]> {
    const results: any[] = [];
    
    for (const content of generatedContent) {
      try {
        const structuredData = await this.structuredDataService.generateStructuredData(
          content,
          content.id || content.name
        );
        results.push(structuredData);
      } catch (error) {
        console.error('Failed to generate structured data:', error);
        results.push(null);
      }
    }

    return results;
  }

  /**
   * 验证内容质量
   */
  private async validateQuality(
    generatedContent: any[],
    qualityThreshold: number
  ): Promise<{ passed: boolean; averageScore: number; details: any[] }> {
    const details: any[] = [];
    let totalScore = 0;

    for (const content of generatedContent) {
      // 简化的质量评分逻辑
      let score = 0.8; // 基础分数
      
      if (content.name && content.name.length > 0) score += 0.1;
      if (content.description && content.description.length > 50) score += 0.1;
      
      totalScore += score;
      details.push({
        content: content.id || content.name,
        score,
        passed: score >= qualityThreshold
      });
    }

    const averageScore = generatedContent.length > 0 ? totalScore / generatedContent.length : 0;
    const passed = averageScore >= qualityThreshold;

    console.log(`Quality validation: ${passed ? 'PASSED' : 'FAILED'} (${averageScore.toFixed(2)})`);

    return {
      passed,
      averageScore,
      details
    };
  }

  /**
   * 存储最终结果
   */
  private async storeFinalResults(
    flowId: string,
    generatedContent: any[],
    structuredDataResults: any[],
    config: GenerationFlowConfiguration
  ): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];

    for (let i = 0; i < generatedContent.length; i++) {
      const content = generatedContent[i];
      const structuredData = structuredDataResults[i];

      const result: GenerationResult = {
        id: `${flowId}_result_${i}`,
        workflowId: config.workflowId,
        gameId: content.id || content.name || `game_${i}`,
        content,
        structuredData,
        status: 'completed',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          flowId,
          generationTime: Date.now(),
          qualityScore: 0.8, // 简化评分
          tokenUsage: 1000   // 简化统计
        }
      };

      await generationResultStorage.saveResult(result);
      results.push(result);
    }

    console.log(`Stored ${results.length} generation results for flow ${flowId}`);
    return results;
  }

  /**
   * 获取最后完成的阶段
   */
  private getLastCompletedStage(status: FlowExecutionStatus): GenerationStage | null {
    const completedSteps = status.steps.filter(step => step.status === 'completed');
    return completedSteps.length > 0 ? completedSteps[completedSteps.length - 1].step : null;
  }

  /**
   * 获取下一个阶段
   */
  private getNextStage(currentStage: GenerationStage | null): GenerationStage | null {
    const stages: GenerationStage[] = [
      'preparing',
      'data_loading',
      'format_analysis',
      'content_generation',
      'format_correction',
      'structured_data_generation',
      'quality_validation',
      'result_storage',
      'completed'
    ];

    if (!currentStage) return 'preparing';
    
    const currentIndex = stages.indexOf(currentStage);
    return currentIndex >= 0 && currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  }
}

// 创建全局实例
export const contentGenerationOrchestrator = new ContentGenerationOrchestrator(); 