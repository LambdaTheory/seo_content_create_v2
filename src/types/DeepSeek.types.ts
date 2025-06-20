/**
 * DeepSeek API 相关类型定义
 */

// 基础 DeepSeek API 类型定义（避免循环导入）
export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DeepSeekError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  averageResponseTime: number;
  errorRate: number;
  dailyUsage: Record<string, number>;
  monthlyUsage: Record<string, number>;
}

// 扩展的内容生成相关类型
export interface ContentGenerationRequest {
  gameData: {
    gameName: string;
    mainKeyword: string;
    longTailKeywords?: string[];
    videoLink?: string;
    internalLinks?: string[];
    realUrl: string;
    iconUrl?: string;
  };
  competitorContent?: CompetitorContentSummary[];
  formatRules: FormatAnalysisResult;
  contentSettings: ContentSettings;
  workflowId: string;
}

export interface CompetitorContentSummary {
  source: string;
  title: string;
  description: string;
  features?: string[];
  relevanceScore: number;
}

export interface FormatAnalysisResult {
  compactTemplate: string;
  fieldConstraints: string[];
  validationRules: string[];
  formatHash: string;
  detailedRules?: DetailedFormatRules;
}

export interface DetailedFormatRules {
  schema: Record<string, FieldConstraint>;
  structureRules: string[];
  outputTemplate: any;
}

export interface FieldConstraint {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  arrayItemType?: string;
  nestedFields?: Record<string, FieldConstraint>;
  constraints?: {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    allowedValues?: any[];
  };
  examples: any[];
}

export interface ContentSettings {
  wordCount: {
    total: { min: number; max: number };
    modules: Record<string, { min: number; max: number }>;
  };
  keywordDensity: {
    mainKeyword: { target: number; max: number };
    longTailKeywords: { target: number; max: number };
    naturalDistribution: boolean;
  };
  generationMode: 'strict' | 'standard' | 'free';
  qualityParams: {
    readabilityLevel: 'beginner' | 'intermediate' | 'advanced';
    professionalTone: boolean;
    targetAudience: 'gamers' | 'general' | 'children';
    creativeFreedom: boolean;
  };
}

// AI 生成结果类型
export interface GenerationResult {
  success: boolean;
  content?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  qualityScore?: number;
  formatValidation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  metadata?: {
    generationTime: number;
    stage: 'format_analysis' | 'content_generation' | 'format_validation';
    retryCount: number;
    cacheHit: boolean;
  };
}

// 三阶段生成流程状态
export interface ThreeStageProgress {
  currentStage: 1 | 2 | 3;
  stages: {
    formatAnalysis: StageStatus;
    contentGeneration: StageStatus;
    formatValidation: StageStatus;
  };
  overall: {
    progress: number; // 0-100
    startTime: number;
    estimatedCompletion?: number;
  };
}

export interface StageStatus {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  startTime?: number;
  endTime?: number;
  error?: string;
  result?: any;
  tokensUsed?: number;
  cacheHit?: boolean;
}

// API 监控和统计类型
export interface ApiMonitoringData {
  requestId: string;
  timestamp: number;
  endpoint: string;
  method: string;
  requestSize: number;
  responseSize: number;
  responseTime: number;
  status: number;
  success: boolean;
  error?: string;
  tokensUsed?: number;
  cacheHit?: boolean;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  cacheHitRate: number;
  tokensPerSecond: number;
  requestsPerMinute: number;
  dailyUsage: Record<string, number>;
  hourlyUsage: Record<string, number>;
}

// 配置和设置类型
export interface DeepSeekServiceConfig {
  api: DeepSeekConfig;
  cache: {
    enabled: boolean;
    maxSize: number;
    defaultTtl: number;
    cleanupInterval: number;
  };
  monitoring: {
    enabled: boolean;
    retentionDays: number;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      dailyTokenLimit: number;
    };
  };
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    tokensPerMinute: number;
    burstLimit: number;
  };
}

// 错误类型扩展
export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  context?: {
    requestId?: string;
    stage?: string;
    retryCount?: number;
  };
}

export type ApiErrorType = 
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_REQUEST'
  | 'QUOTA_EXCEEDED'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

// 事件类型定义
export interface ApiEvent {
  type: 'request_start' | 'request_end' | 'error' | 'cache_hit' | 'rate_limit';
  timestamp: number;
  data: any;
}

// Hook 和回调函数类型
export type RequestInterceptor = (request: ChatRequest) => ChatRequest | Promise<ChatRequest>;
export type ResponseInterceptor = (response: ChatResponse) => ChatResponse | Promise<ChatResponse>;
export type ErrorHandler = (error: ServiceError) => void | Promise<void>;
export type ProgressCallback = (progress: ThreeStageProgress) => void;

// 实用类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; 