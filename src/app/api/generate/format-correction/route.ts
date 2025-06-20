/**
 * 格式校正API路由
 * 
 * 功能：
 * - 格式验证接口
 * - 格式修复接口
 * - 一致性检查接口
 * 
 * @author AI Assistant
 * @date 2025-01-29
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatValidationService } from '@/services/formatValidationService';

/**
 * 格式验证请求接口
 */
interface FormatValidationRequest {
  data: any;
  expectedFormat: any;
  operation: 'validate' | 'repair' | 'consistency-check';
  repairOptions?: {
    mode?: 'auto' | 'guided' | 'manual';
    aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
    preserveContent?: boolean;
    maxRetries?: number;
    fallbackToOriginal?: boolean;
  };
}

/**
 * POST /api/generate/format-correction
 * 格式校正主接口
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // 解析请求体
    const body: FormatValidationRequest = await request.json();
    
    // 验证请求参数
    if (!body.data || !body.expectedFormat || !body.operation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: data, expectedFormat, operation',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }

    let result: any;

    // 根据操作类型处理请求
    switch (body.operation) {
      case 'validate':
        result = await formatValidationService.validateFormat(
          body.data,
          body.expectedFormat
        );
        break;

      case 'repair':
        result = await formatValidationService.repairFormat(
          body.data,
          body.expectedFormat,
          body.repairOptions || {
            mode: 'auto',
            aggressiveness: 'moderate',
            preserveContent: true,
            maxRetries: 3,
            fallbackToOriginal: true
          }
        );
        break;

      case 'consistency-check':
        // 仅执行一致性检查
        const validationResult = await formatValidationService.validateFormat(
          body.data,
          body.expectedFormat
        );
        result = {
          consistent: validationResult.isValid,
          inconsistencies: validationResult.errors.filter(e => e.type === 'consistency'),
          overallScore: validationResult.score,
          recommendations: validationResult.suggestions.map(s => s.description)
        };
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported operation: ${body.operation}`,
            code: 'UNSUPPORTED_OPERATION'
          },
          { status: 400 }
        );
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      operation: body.operation,
      result,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    });

  } catch (error) {
    console.error('Format correction API error:', error);

    // 错误分类和处理
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'JSON_PARSE_ERROR'
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate/format-correction
 * 获取格式校正服务状态和统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const stats = formatValidationService.getValidationStats();
    
    return NextResponse.json({
      success: true,
      status: 'active',
      stats,
      capabilities: {
        operations: ['validate', 'repair', 'consistency-check'],
        repairModes: ['auto', 'guided', 'manual'],
        supportedFormats: ['JSON']
      },
      metadata: {
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    });

  } catch (error) {
    console.error('Format correction status API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get service status',
        code: 'STATUS_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/generate/format-correction
 * 清理格式校正服务缓存
 */
export async function DELETE(request: NextRequest) {
  try {
    // 获取清理前的统计信息
    const statsBefore = formatValidationService.getValidationStats();
    
    // 清理缓存
    formatValidationService.clearCache();
    
    // 获取清理后的统计信息
    const statsAfter = formatValidationService.getValidationStats();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      statsBefore,
      statsAfter,
      metadata: {
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    });

  } catch (error) {
    console.error('Format correction cache clear API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to clear cache',
        code: 'CACHE_CLEAR_ERROR'
      },
      { status: 500 }
    );
  }
} 