/**
 * DeepSeek API 服务
 * 实现与 DeepSeek V3 API 的完整集成
 */

import { EXTERNAL_APIS } from '@/constants/API_ENDPOINTS';

// DeepSeek API 配置接口
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

// API 请求接口
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

// API 错误接口
export interface DeepSeekError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

// 使用量统计接口
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

// 缓存项接口
interface CacheItem {
  key: string;
  response: ChatResponse;
  timestamp: number;
  ttl: number;
}

/**
 * DeepSeek API 服务类
 */
export class DeepSeekApiService {
  private config: DeepSeekConfig;
  private usage: UsageStats;
  private cache: Map<string, CacheItem>;
  private readonly cacheMaxSize = 1000;
  private readonly defaultTtl = 1000 * 60 * 60; // 1小时

  constructor(config?: Partial<DeepSeekConfig>) {
    this.config = {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: process.env.DEEPSEEK_API_URL || EXTERNAL_APIS.DEEPSEEK.BASE,
      model: 'deepseek-chat',
      maxTokens: 4000,
      temperature: 0.7,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.usage = this.initializeUsageStats();
    this.cache = new Map();

    // 验证 API Key
    if (!this.config.apiKey) {
      console.warn('DeepSeek API Key not found. Please set DEEPSEEK_API_KEY environment variable.');
    }
  }

  /**
   * 初始化使用量统计
   */
  private initializeUsageStats(): UsageStats {
    return {
      totalRequests: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      averageResponseTime: 0,
      errorRate: 0,
      dailyUsage: {},
      monthlyUsage: {},
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: ChatRequest): string {
    const keyData = {
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
    };
    
    // 在浏览器环境和 Node.js 环境中都能工作的 base64 编码
    if (typeof window !== 'undefined') {
      return btoa(JSON.stringify(keyData));
    } else {
      return Buffer.from(JSON.stringify(keyData)).toString('base64');
    }
  }

  /**
   * 检查缓存
   */
  private checkCache(key: string): ChatResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, response: ChatResponse, ttl?: number): void {
    // 如果缓存满了，删除最旧的项
    if (this.cache.size >= this.cacheMaxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      key,
      response,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });
  }

  /**
   * 更新使用量统计
   */
  private updateUsageStats(
    responseTime: number,
    usage?: ChatResponse['usage'],
    isError: boolean = false
  ): void {
    this.usage.totalRequests++;
    
    if (usage) {
      this.usage.totalTokens += usage.total_tokens;
      this.usage.promptTokens += usage.prompt_tokens;
      this.usage.completionTokens += usage.completion_tokens;
    }

    // 更新平均响应时间
    this.usage.averageResponseTime = 
      (this.usage.averageResponseTime * (this.usage.totalRequests - 1) + responseTime) / 
      this.usage.totalRequests;

    // 更新错误率
    if (isError) {
      this.usage.errorRate = 
        (this.usage.errorRate * (this.usage.totalRequests - 1) + 1) / 
        this.usage.totalRequests;
    } else {
      this.usage.errorRate = 
        (this.usage.errorRate * (this.usage.totalRequests - 1)) / 
        this.usage.totalRequests;
    }

    // 更新日期统计
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    
    this.usage.dailyUsage[today] = (this.usage.dailyUsage[today] || 0) + 1;
    this.usage.monthlyUsage[thisMonth] = (this.usage.monthlyUsage[thisMonth] || 0) + 1;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证 API 配置
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.apiKey) {
      errors.push('API Key is required');
    }

    if (!this.config.baseUrl) {
      errors.push('Base URL is required');
    }

    if (this.config.maxTokens <= 0) {
      errors.push('Max tokens must be greater than 0');
    }

    if (this.config.temperature < 0 || this.config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 发送聊天请求
   */
  public async chat(
    messages: ChatMessage[],
    options?: Partial<ChatRequest>
  ): Promise<ChatResponse> {
    const validation = this.validateConfig();
    if (!validation.valid) {
      throw new Error(`DeepSeek API configuration error: ${validation.errors.join(', ')}`);
    }

    const request: ChatRequest = {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      ...options,
    };

    // 检查缓存
    const cacheKey = this.generateCacheKey(request);
    const cached = this.checkCache(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    // 重试机制
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(request);
        const responseTime = Date.now() - startTime;
        
        // 更新统计
        this.updateUsageStats(responseTime, response.usage, false);
        
        // 缓存响应
        this.setCache(cacheKey, response);
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    // 更新错误统计
    const responseTime = Date.now() - startTime;
    this.updateUsageStats(responseTime, undefined, true);
    
    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * 实际发送 HTTP 请求
   */
  private async makeRequest(request: ChatRequest): Promise<ChatResponse> {
    const url = `${this.config.baseUrl}${EXTERNAL_APIS.DEEPSEEK.CHAT}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        try {
          const errorData: DeepSeekError = await response.json();
          throw new Error(`DeepSeek API Error: ${errorData.error.message}`);
        } catch (parseError) {
          throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText}`);
        }
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * 获取使用量统计
   */
  public getUsageStats(): UsageStats {
    return { ...this.usage };
  }

  /**
   * 重置使用量统计
   */
  public resetUsageStats(): void {
    this.usage = this.initializeUsageStats();
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      hitRate: this.usage.totalRequests > 0 ? 
        (this.usage.totalRequests - this.usage.totalRequests) / this.usage.totalRequests : 0,
    };
  }

  /**
   * 检查 API 连接
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Hello, this is a connection test.' }
      ], { max_tokens: 10 });

      return {
        success: true,
        message: 'Connection successful',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<DeepSeekConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): DeepSeekConfig {
    return { ...this.config };
  }
}

// 导出单例实例
export const deepseekApi = new DeepSeekApiService();

// 导出便捷函数
export const chatWithDeepSeek = (
  messages: ChatMessage[],
  options?: Partial<ChatRequest>
) => deepseekApi.chat(messages, options);

export default deepseekApi; 