/**
 * DeepSeek 聊天 API 路由
 * 处理与 DeepSeek API 的聊天请求
 */

import { NextRequest, NextResponse } from 'next/server';
import { deepseekApi } from '@/services/deepseekApi';
import type { ChatMessage } from '@/types/DeepSeek.types';

export const runtime = 'nodejs';

interface ChatApiRequest {
  messages: ChatMessage[];
  options?: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

/**
 * POST 请求处理函数
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: ChatApiRequest = await request.json();
    
    // 验证请求数据
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // 验证消息格式
    for (const message of body.messages) {
      if (!message.role || !message.content) {
        return NextResponse.json(
          { error: 'Each message must have role and content' },
          { status: 400 }
        );
      }
      
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        return NextResponse.json(
          { error: 'Message role must be system, user, or assistant' },
          { status: 400 }
        );
      }
    }

    // 调用 DeepSeek API
    const response = await deepseekApi.chat(body.messages, body.options);

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: response,
      usage: response.usage,
    });

  } catch (error) {
    console.error('DeepSeek API Error:', error);

    // 处理不同类型的错误
    if (error instanceof Error) {
      if (error.message.includes('API Key')) {
        return NextResponse.json(
          { 
            error: 'API authentication failed',
            message: 'Invalid or missing API key',
            code: 'AUTH_ERROR'
          },
          { status: 401 }
        );
      }

      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            message: 'The request took too long to complete',
            code: 'TIMEOUT'
          },
          { status: 408 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT'
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: 'API request failed',
          message: error.message,
          code: 'API_ERROR'
        },
        { status: 500 }
      );
    }

    // 未知错误
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET 请求处理函数 - 获取 API 状态和统计信息
 */
export async function GET() {
  try {
    // 获取使用统计
    const usage = deepseekApi.getUsageStats();
    const config = deepseekApi.getConfig();
    const cacheStats = deepseekApi.getCacheStats();

    // 测试连接
    const connectionTest = await deepseekApi.testConnection();

    return NextResponse.json({
      success: true,
      data: {
        status: connectionTest.success ? 'connected' : 'disconnected',
        message: connectionTest.message,
        usage,
        cache: cacheStats,
        config: {
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
          // 不返回敏感信息如 API Key
        },
      },
    });

  } catch (error) {
    console.error('API Status Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get API status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 请求处理函数 - CORS 支持
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 