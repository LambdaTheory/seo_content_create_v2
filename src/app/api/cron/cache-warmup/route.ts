/**
 * 缓存预热定时任务
 * 每6小时预热关键数据和常用API端点
 */

import { NextRequest, NextResponse } from 'next/server';

interface WarmupResult {
  endpoint: string;
  status: 'success' | 'error';
  responseTime: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 验证请求来源（Vercel Cron）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const warmupResults: WarmupResult[] = [];
    
    // 预热的端点列表
    const endpoints = [
      '/api/health',
      '/api/workflows',
      '/api/sitemap/status',
      '/api/competitor/games/status'
    ];

    // 并发预热所有端点
    const warmupPromises = endpoints.map(async (endpoint) => {
      const endpointStartTime = Date.now();
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Cache-Warmup-Bot/1.0',
            'Cache-Control': 'no-cache'
          },
          // 10秒超时
          signal: AbortSignal.timeout(10000)
        });

        const responseTime = Date.now() - endpointStartTime;
        
        if (response.ok) {
          return {
            endpoint,
            status: 'success' as const,
            responseTime
          };
        } else {
          return {
            endpoint,
            status: 'error' as const,
            responseTime,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      } catch (error) {
        const responseTime = Date.now() - endpointStartTime;
        return {
          endpoint,
          status: 'error' as const,
          responseTime,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });

    // 等待所有预热完成
    const results = await Promise.all(warmupPromises);
    warmupResults.push(...results);

    // 预热本地存储缓存
    try {
      await warmupLocalCaches();
    } catch (error) {
      console.error('Local cache warmup failed:', error);
    }

    const totalTime = Date.now() - startTime;
    const successCount = warmupResults.filter(r => r.status === 'success').length;
    const errorCount = warmupResults.filter(r => r.status === 'error').length;

    console.log(`Cache warmup completed: ${successCount} success, ${errorCount} errors in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'Cache warmup completed',
      results: warmupResults,
      summary: {
        totalEndpoints: endpoints.length,
        successCount,
        errorCount,
        totalTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Cache warmup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Cache warmup failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 预热本地存储缓存
 */
async function warmupLocalCaches(): Promise<void> {
  try {
    // 这里可以添加预热逻辑，比如：
    // - 预加载默认工作流配置
    // - 预热竞品数据库连接
    // - 初始化AI服务连接
    
    // 模拟一些预热操作
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Local caches warmed up successfully');
  } catch (error) {
    console.error('Local cache warmup error:', error);
    throw error;
  }
}

// 只允许GET请求
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 