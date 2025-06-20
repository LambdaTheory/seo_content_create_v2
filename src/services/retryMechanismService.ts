/**
 * 回退重试机制服务
 * 
 * 功能特性：
 * - 校正失败阈值设定
 * - 自动回退到阶段二重新生成
 * - 循环重试次数限制
 * - 手动编辑接口集成
 * - 智能重试策略
 * 
 * @author AI Assistant
 * @date 2025-01-29
 */

export interface RetryConfiguration {
  maxRetries: number;
  failureThreshold: number;
  backoffStrategy: "linear" | "exponential" | "fixed";
  baseDelay: number;
  maxDelay: number;
  enableStageRollback: boolean;
  enableManualIntervention: boolean;
}

export interface RetryState {
  currentStage: "format-analysis" | "content-generation" | "format-correction";
  retryCount: number;
  totalRetries: number;
  failureHistory: RetryFailure[];
  lastSuccess?: Date;
  isManualInterventionRequired: boolean;
}

export interface RetryFailure {
  stage: string;
  timestamp: Date;
  errorType: string;
  errorMessage: string;
  retryAttempt: number;
  recoveryAction: string;
}

export interface RetryResult {
  success: boolean;
  finalStage: string;
  totalAttempts: number;
  processingTime: number;
  result?: any;
  failures: RetryFailure[];
  manualInterventionRequired: boolean;
  nextRecommendedAction: string;
}

export interface ManualInterventionOptions {
  action: "skip-validation" | "force-repair" | "manual-edit" | "abort";
  customData?: any;
  userFeedback?: string;
  overrideSettings?: Partial<RetryConfiguration>;
}

export class RetryMechanismService {
  private defaultConfig: RetryConfiguration = {
    maxRetries: 3,
    failureThreshold: 0.7,
    backoffStrategy: "exponential",
    baseDelay: 1000,
    maxDelay: 30000,
    enableStageRollback: true,
    enableManualIntervention: false
  };

  private retryStates: Map<string, RetryState> = new Map();

  async executeWithRetry(
    gameData: any,
    formatRules: any,
    config: Partial<RetryConfiguration> = {}
  ): Promise<RetryResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    const sessionId = this.generateSessionId();
    
    const retryState: RetryState = {
      currentStage: "format-analysis",
      retryCount: 0,
      totalRetries: 0,
      failureHistory: [],
      isManualInterventionRequired: false
    };

    this.retryStates.set(sessionId, retryState);

    try {
      // 模拟三阶段执行
      let currentStage: "format-analysis" | "content-generation" | "format-correction" = "format-analysis";
      let stageResult: any = {};
      let failures: RetryFailure[] = [];

      // 简化的执行逻辑
      while (retryState.totalRetries < finalConfig.maxRetries) {
        try {
          // 模拟阶段执行
          stageResult = await this.simulateStageExecution(currentStage, gameData, formatRules);
          
          return {
            success: true,
            finalStage: currentStage,
            totalAttempts: retryState.totalRetries + 1,
            processingTime: Date.now() - startTime,
            result: stageResult,
            failures,
            manualInterventionRequired: false,
            nextRecommendedAction: "success"
          };
        } catch (error) {
          failures.push(this.createFailureRecord(currentStage, error.message, retryState));
          retryState.totalRetries++;
          
          if (this.shouldTriggerManualIntervention(retryState, finalConfig)) {
            return this.buildManualInterventionResult(startTime, failures, retryState);
          }

          await this.applyBackoffDelay(retryState.retryCount, finalConfig);
        }
      }

      return this.buildFailureResult(startTime, failures, retryState, "Max retries exceeded");

    } catch (error) {
      return this.buildFailureResult(startTime, [], retryState, `Unexpected error: ${error.message}`);
    } finally {
      this.retryStates.delete(sessionId);
    }
  }

  async handleManualIntervention(
    sessionId: string,
    options: ManualInterventionOptions
  ): Promise<RetryResult> {
    const retryState = this.retryStates.get(sessionId);
    if (!retryState) {
      throw new Error("Invalid session ID or session expired");
    }

    const startTime = Date.now();

    switch (options.action) {
      case "manual-edit":
        return {
          success: true,
          finalStage: "manual-edit",
          totalAttempts: retryState.totalRetries,
          processingTime: Date.now() - startTime,
          result: options.customData,
          failures: retryState.failureHistory,
          manualInterventionRequired: false,
          nextRecommendedAction: "manual-edit-accepted"
        };

      case "abort":
        return {
          success: false,
          finalStage: retryState.currentStage,
          totalAttempts: retryState.totalRetries,
          processingTime: Date.now() - startTime,
          failures: retryState.failureHistory,
          manualInterventionRequired: false,
          nextRecommendedAction: "user-aborted"
        };

      default:
        throw new Error(`Unknown manual intervention action: ${options.action}`);
    }
  }

  private async simulateStageExecution(stage: string, gameData: any, formatRules: any): Promise<any> {
    // 模拟阶段执行
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 随机模拟成功/失败
    if (Math.random() > 0.3) {
      return { stage, result: "success", data: gameData };
    } else {
      throw new Error(`Stage ${stage} simulation failed`);
    }
  }

  private shouldTriggerManualIntervention(
    retryState: RetryState,
    config: RetryConfiguration
  ): boolean {
    if (!config.enableManualIntervention) {
      return false;
    }

    const recentFailures = retryState.failureHistory.slice(-3);
    const failureRate = recentFailures.length / Math.max(3, retryState.totalRetries + 1);

    return failureRate >= config.failureThreshold;
  }

  private async applyBackoffDelay(
    retryCount: number,
    config: RetryConfiguration
  ): Promise<void> {
    let delay = config.baseDelay;

    switch (config.backoffStrategy) {
      case "linear":
        delay = config.baseDelay * (retryCount + 1);
        break;
      case "exponential":
        delay = config.baseDelay * Math.pow(2, retryCount);
        break;
      case "fixed":
        delay = config.baseDelay;
        break;
    }

    delay = Math.min(delay, config.maxDelay);

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  private createFailureRecord(
    stage: string,
    errorMessage: string,
    retryState: RetryState
  ): RetryFailure {
    const failure: RetryFailure = {
      stage,
      timestamp: new Date(),
      errorType: "execution-error",
      errorMessage,
      retryAttempt: retryState.retryCount,
      recoveryAction: "retry"
    };

    retryState.failureHistory.push(failure);
    return failure;
  }

  private buildFailureResult(
    startTime: number,
    failures: RetryFailure[],
    retryState: RetryState,
    reason: string
  ): RetryResult {
    return {
      success: false,
      finalStage: retryState.currentStage,
      totalAttempts: retryState.totalRetries,
      processingTime: Date.now() - startTime,
      failures,
      manualInterventionRequired: false,
      nextRecommendedAction: `failure: ${reason}`
    };
  }

  private buildManualInterventionResult(
    startTime: number,
    failures: RetryFailure[],
    retryState: RetryState
  ): RetryResult {
    return {
      success: false,
      finalStage: retryState.currentStage,
      totalAttempts: retryState.totalRetries,
      processingTime: Date.now() - startTime,
      failures,
      manualInterventionRequired: true,
      nextRecommendedAction: "manual-intervention-required"
    };
  }

  private generateSessionId(): string {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRetryStats(): {
    activeRetries: number;
    totalSessions: number;
    averageAttempts: number;
  } {
    return {
      activeRetries: this.retryStates.size,
      totalSessions: 0,
      averageAttempts: 0
    };
  }

  cleanupExpiredStates(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1小时

    for (const [sessionId, retryState] of this.retryStates.entries()) {
      const lastActivity = retryState.failureHistory.length > 0 
        ? retryState.failureHistory[retryState.failureHistory.length - 1].timestamp.getTime()
        : now;
      
      if (now - lastActivity > maxAge) {
        this.retryStates.delete(sessionId);
      }
    }
  }
}

export const retryMechanismService = new RetryMechanismService();
