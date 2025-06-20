/**
 * 定时清理任务API
 * 任务12.1.5：配置备份策略 - 自动清理
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestCache } from '@/utils/performanceOptimizer';

export async function POST(request: NextRequest) {
  try {
    // 验证Cron请求
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    const cleanupResults = {
      timestamp: new Date().toISOString(),
      cache: await cleanupCache(),
      localStorage: await cleanupLocalStorage(),
      memory: await cleanupMemory(),
      logs: await cleanupLogs()
    };

    const duration = Date.now() - startTime;
    
    console.log('Cleanup completed:', {
      duration: `${duration}ms`,
      results: cleanupResults
    });

    return NextResponse.json({
      success: true,
      duration,
      results: cleanupResults
    });
  } catch (error) {
    console.error('Cleanup task failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed'
    }, { status: 500 });
  }
}

/**
 * 清理应用缓存
 */
async function cleanupCache() {
  try {
    const beforeSize = requestCache.getStats().size;
    
    // 清理过期缓存
    requestCache.clear();
    
    const afterSize = requestCache.getStats().size;
    const cleaned = beforeSize - afterSize;
    
    return {
      status: 'success',
      itemsCleaned: cleaned,
      beforeSize,
      afterSize
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Cache cleanup failed'
    };
  }
}

/**
 * 清理本地存储中的过期数据
 */
async function cleanupLocalStorage() {
  try {
    // 在服务器端，我们无法访问localStorage
    // 这个清理将由客户端定期执行
    if (typeof window === 'undefined') {
      return {
        status: 'skipped',
        reason: 'Server environment - localStorage not available'
      };
    }

    const keysToRemove: string[] = [];
    const now = Date.now();
    
    // 检查所有带有过期时间的存储项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // 检查是否是带过期时间的缓存项
      if (key.startsWith('cache_') || key.startsWith('temp_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.expiry && now > parsed.expiry) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // 如果解析失败，可能是损坏的数据，也删除
          keysToRemove.push(key);
        }
      }
    }
    
    // 删除过期项
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return {
      status: 'success',
      itemsCleaned: keysToRemove.length,
      keys: keysToRemove
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'LocalStorage cleanup failed'
    };
  }
}

/**
 * 内存清理
 */
async function cleanupMemory() {
  try {
    const beforeMemory = process.memoryUsage();
    
    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }
    
    const afterMemory = process.memoryUsage();
    
    return {
      status: 'success',
      before: {
        heapUsed: Math.round(beforeMemory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(beforeMemory.heapTotal / 1024 / 1024),
        external: Math.round(beforeMemory.external / 1024 / 1024)
      },
      after: {
        heapUsed: Math.round(afterMemory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(afterMemory.heapTotal / 1024 / 1024),
        external: Math.round(afterMemory.external / 1024 / 1024)
      },
      freed: Math.round((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024)
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Memory cleanup failed'
    };
  }
}

/**
 * 清理旧日志
 */
async function cleanupLogs() {
  try {
    // 在实际部署中，这里可以清理日志文件
    // 目前只是模拟清理过程
    const logRetentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - logRetentionDays);
    
    // 这里可以添加实际的日志清理逻辑
    // 例如：删除超过30天的日志文件
    
    return {
      status: 'success',
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: logRetentionDays,
      message: 'Log cleanup simulated (no actual files to clean in this environment)'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Log cleanup failed'
    };
  }
}

// 支持GET请求用于手动触发清理（仅在开发环境）
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Manual cleanup only available in development' },
      { status: 403 }
    );
  }
  
  return POST(request);
} 