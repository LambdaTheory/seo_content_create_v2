/**
 * 格式分析 API 路由
 * 处理 JSON 格式分析请求
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatAnalysisService } from '@/services/formatAnalysisService';

export const runtime = 'nodejs';

interface FormatAnalysisRequest {
  jsonFormat: string;
  workflowId?: string;
  forceRefresh?: boolean;
}

interface BatchFormatAnalysisRequest {
  formats: Array<{
    id: string;
    jsonFormat: string;
  }>;
  forceRefresh?: boolean;
}

/**
 * POST 请求处理函数 - 单个格式分析
 */
export async function POST(request: NextRequest) {
  try {
    const body: FormatAnalysisRequest = await request.json();
    
    // 验证请求数据
    if (!body.jsonFormat || typeof body.jsonFormat !== 'string') {
      return NextResponse.json(
        { 
          error: 'JSON format is required and must be a string',
          code: 'INVALID_INPUT'
        },
        { status: 400 }
      );
    }

    // 验证 JSON 格式
    const validation = formatAnalysisService.validateJsonFormat(body.jsonFormat);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON format',
          message: validation.error,
          suggestions: validation.suggestions,
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // 如果需要强制刷新，清除相关缓存
    if (body.forceRefresh) {
      // 这里可以添加清除特定格式缓存的逻辑
      // formatAnalysisService.clearSpecificCache(formatHash);
    }

    // 执行格式分析
    const result = await formatAnalysisService.analyzeFormat(body.jsonFormat);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          formatAnalysis: result.result,
          metadata: result.metadata,
          workflowId: body.workflowId
        }
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Format analysis failed',
          message: result.error,
          metadata: result.metadata,
          code: 'ANALYSIS_FAILED'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Format Analysis API Error:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT 请求处理函数 - 批量格式分析
 */
export async function PUT(request: NextRequest) {
  try {
    const body: BatchFormatAnalysisRequest = await request.json();
    
    // 验证请求数据
    if (!body.formats || !Array.isArray(body.formats) || body.formats.length === 0) {
      return NextResponse.json(
        { 
          error: 'Formats array is required and cannot be empty',
          code: 'INVALID_INPUT'
        },
        { status: 400 }
      );
    }

    // 验证每个格式
    for (const format of body.formats) {
      if (!format.id || !format.jsonFormat) {
        return NextResponse.json(
          { 
            error: 'Each format must have id and jsonFormat',
            code: 'INVALID_FORMAT_ITEM'
          },
          { status: 400 }
        );
      }

      const validation = formatAnalysisService.validateJsonFormat(format.jsonFormat);
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: `Invalid JSON format for item ${format.id}`,
            message: validation.error,
            suggestions: validation.suggestions,
            code: 'INVALID_JSON'
          },
          { status: 400 }
        );
      }
    }

    // 执行批量分析
    const result = await formatAnalysisService.analyzeMultipleFormats(body.formats);

    return NextResponse.json({
      success: result.success,
      data: {
        results: result.results,
        metadata: result.metadata,
        summary: {
          total: body.formats.length,
          successful: result.results.filter(r => !r.error).length,
          failed: result.results.filter(r => r.error).length,
          cacheHits: result.metadata.cacheHits
        }
      }
    });

  } catch (error) {
    console.error('Batch Format Analysis API Error:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET 请求处理函数 - 获取分析统计和缓存信息
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = formatAnalysisService.getStats();
        return NextResponse.json({
          success: true,
          data: {
            stats,
            timestamp: Date.now()
          }
        });

      case 'cache':
        const cacheInfo = formatAnalysisService.getCacheInfo();
        return NextResponse.json({
          success: true,
          data: {
            cache: cacheInfo,
            timestamp: Date.now()
          }
        });

      case 'config':
        const config = formatAnalysisService.getConfig();
        return NextResponse.json({
          success: true,
          data: {
            config,
            timestamp: Date.now()
          }
        });

      default:
        // 返回综合信息
        const allStats = formatAnalysisService.getStats();
        const allCacheInfo = formatAnalysisService.getCacheInfo();
        const allConfig = formatAnalysisService.getConfig();

        return NextResponse.json({
          success: true,
          data: {
            stats: allStats,
            cache: allCacheInfo,
            config: allConfig,
            timestamp: Date.now()
          }
        });
    }

  } catch (error) {
    console.error('Format Analysis Status API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get format analysis status',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'STATUS_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE 请求处理函数 - 缓存管理
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'cache':
        formatAnalysisService.clearCache();
        return NextResponse.json({
          success: true,
          message: 'All cache cleared',
          timestamp: Date.now()
        });

      case 'expired':
        const cleaned = formatAnalysisService.cleanExpiredCache();
        return NextResponse.json({
          success: true,
          message: `Cleaned ${cleaned} expired cache items`,
          cleaned,
          timestamp: Date.now()
        });

      case 'stats':
        formatAnalysisService.resetStats();
        return NextResponse.json({
          success: true,
          message: 'Statistics reset',
          timestamp: Date.now()
        });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action parameter',
            message: 'Supported actions: cache, expired, stats',
            code: 'INVALID_ACTION'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Format Analysis Delete API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform delete operation',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'DELETE_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH 请求处理函数 - 更新配置
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证配置参数
    if (body.maxTokens && (typeof body.maxTokens !== 'number' || body.maxTokens <= 0)) {
      return NextResponse.json(
        { 
          error: 'maxTokens must be a positive number',
          code: 'INVALID_CONFIG'
        },
        { status: 400 }
      );
    }

    if (body.temperature && (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 2)) {
      return NextResponse.json(
        { 
          error: 'temperature must be a number between 0 and 2',
          code: 'INVALID_CONFIG'
        },
        { status: 400 }
      );
    }

    if (body.cacheTtl && (typeof body.cacheTtl !== 'number' || body.cacheTtl <= 0)) {
      return NextResponse.json(
        { 
          error: 'cacheTtl must be a positive number',
          code: 'INVALID_CONFIG'
        },
        { status: 400 }
      );
    }

    // 更新配置
    formatAnalysisService.updateConfig(body);
    const newConfig = formatAnalysisService.getConfig();

    return NextResponse.json({
      success: true,
      data: {
        config: newConfig,
        message: 'Configuration updated successfully'
      }
    });

  } catch (error) {
    console.error('Format Analysis Config Update API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'CONFIG_UPDATE_ERROR'
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 