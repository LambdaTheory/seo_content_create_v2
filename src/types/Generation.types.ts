/**
 * 生成流程相关类型定义
 */

import { 
  Workflow, 
  WorkflowStep, 
  WorkflowExecutionContext 
} from './Workflow.types';
import { 
  ContentSettings, 
  ContentGenerationConfig 
} from './ContentSettings.types';
import { 
  PreviewGenerationResult 
} from './ResultPreview.types';

// 生成状态枚举
export enum GenerationStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  PROCESSING_DATA = 'processing_data',
  GENERATING_CONTENT = 'generating_content',
  GENERATING_STRUCTURED_DATA = 'generating_structured_data',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// 生成阶段枚举
export enum GenerationPhase {
  DATA_PREPARATION = 'data_preparation',
  CONTENT_GENERATION = 'content_generation',
  STRUCTURED_DATA_GENERATION = 'structured_data_generation',
  QUALITY_ANALYSIS = 'quality_analysis',
  FINALIZATION = 'finalization'
}

// 单个游戏生成状态
export interface GameGenerationState {
  gameId: string;
  gameName: string;
  status: GenerationStatus;
  phase: GenerationPhase;
  progress: number; // 0-100
  currentStep?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
  result?: PreviewGenerationResult;
  retryCount: number;
  maxRetries: number;
}

// 整体生成状态
export interface OrchestrationState {
  status: GenerationStatus;
  totalGames: number;
  completedGames: number;
  failedGames: number;
  currentPhase: GenerationPhase;
  overallProgress: number; // 0-100
  startTime?: number;
  endTime?: number;
  estimatedTimeRemaining?: number;
  gameStates: Map<string, GameGenerationState>;
  statistics: GenerationStatistics;
}

// 生成统计信息
export interface GenerationStatistics {
  totalProcessingTime: number;
  averageTimePerGame: number;
  successRate: number;
  errorRate: number;
  throughput: number; // games per minute
  phaseTimings?: Record<GenerationPhase, number>;
  errorBreakdown?: Record<string, number>;
  performanceMetrics?: {
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
  };
}

// 重试策略配置
export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors?: string[];
  circuitBreakerConfig?: {
    failureThreshold: number;
    resetTimeout: number;
  };
}

// 生成选项配置
export interface GenerationOptions {
  batchSize: number;
  maxConcurrency: number;
  retryPolicy: RetryPolicy;
  enableStructuredData: boolean;
  enableQualityAnalysis: boolean;
  pauseOnError: boolean;
  saveProgressInterval: number; // milliseconds
  enableRealtimeUpdates: boolean;
  outputFormat?: 'json' | 'csv' | 'xlsx';
  compressionEnabled?: boolean;
  cachingStrategy?: 'none' | 'memory' | 'disk';
}

// 生成配置接口
export interface GenerationOrchestrationConfig {
  workflow: Workflow;
  contentSettings: ContentSettings;
  gameData: any[];
  options: GenerationOptions;
  metadata?: {
    projectName?: string;
    description?: string;
    tags?: string[];
    createdBy?: string;
    version?: string;
  };
}

// 生成事件接口
export interface OrchestrationEvents {
  'state-changed': (state: OrchestrationState) => void;
  'game-started': (gameState: GameGenerationState) => void;
  'game-progress': (gameState: GameGenerationState) => void;
  'game-completed': (gameState: GameGenerationState) => void;
  'game-failed': (gameState: GameGenerationState) => void;
  'phase-changed': (phase: GenerationPhase, previousPhase?: GenerationPhase) => void;
  'batch-started': (batchIndex: number, totalBatches: number) => void;
  'batch-completed': (batchIndex: number, totalBatches: number) => void;
  'error': (error: Error, context?: any) => void;
  'warning': (message: string, context?: any) => void;
  'pause-requested': () => void;
  'resume-requested': () => void;
  'stop-requested': () => void;
  'progress-saved': (timestamp: number) => void;
}

// 进度快照接口
export interface ProgressSnapshot {
  state: OrchestrationState;
  config: GenerationOrchestrationConfig;
  timestamp: number;
  version: string;
  checksum?: string;
}

// 性能监控接口
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage: {
    used: number;
    total: number;
    peak: number;
  };
  cpuUsage: {
    average: number;
    peak: number;
  };
  networkStats: {
    requests: number;
    totalBytes: number;
    averageLatency: number;
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

// 质量评估结果
export interface QualityAssessment {
  overallScore: number; // 0-100
  dimensions: {
    contentQuality: number;
    seoOptimization: number;
    readability: number;
    completeness: number;
    consistency: number;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    gameId?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: string[];
  benchmarkComparison?: {
    industryAverage: number;
    percentile: number;
  };
}

// 导出配置
export interface ExportConfiguration {
  format: 'json' | 'csv' | 'xlsx' | 'xml';
  includeMetadata: boolean;
  includeStatistics: boolean;
  includeQualityAnalysis: boolean;
  compression: boolean;
  encryption?: {
    enabled: boolean;
    algorithm: string;
    key?: string;
  };
  customFields?: string[];
  filterCriteria?: {
    status?: GenerationStatus[];
    minQualityScore?: number;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

// 实时更新配置
export interface RealtimeConfig {
  enabled: boolean;
  updateInterval: number; // milliseconds
  websocketUrl?: string;
  authToken?: string;
  channels: string[];
  compression: boolean;
  heartbeatInterval: number;
}

// 错误处理配置
export interface ErrorHandlingConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableErrorReporting: boolean;
  errorReportingUrl?: string;
  maxErrorsPerGame: number;
  errorCooldownPeriod: number; // milliseconds
  fallbackStrategies: {
    contentGeneration?: 'skip' | 'retry' | 'manual';
    structuredData?: 'skip' | 'retry' | 'minimal';
    qualityAnalysis?: 'skip' | 'basic';
  };
} 