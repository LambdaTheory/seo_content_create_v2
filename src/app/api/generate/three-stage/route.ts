/**
 * 三阶段流程API路由
 * 
 * 功能：
 * - 启动三阶段生成流程
 * - 查询流程状态和进度
 * - 管理流程执行
 * - 获取流程统计信息
 * 
 * @author AI Assistant
 * @date 2025-01-29
 */

import { NextRequest, NextResponse } from 'next/server';
import { threeStageOrchestrationService, ThreeStageConfiguration } from '@/services/threeStageOrchestrationService';

/**
 * 三阶段流程请求接口
 */
interface ThreeStageFlowRequest {
  gamesData: any[];
  targetFormat: any;
  configuration?: Partial<ThreeStageConfiguration>;
  enableProgressTracking?: boolean;
}

/**
 * POST /api/generate/three-stage
 * 启动三阶段生成流程
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // 解析请求体
    const body: ThreeStageFlowRequest = await request.json();
    
    // 验证必需参数
    if (!body.gamesData || !Array.isArray(body.gamesData) || body.gamesData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'gamesData is required and must be a non-empty array',
          code: 'INVALID_GAMES_DATA'
        },
        { status: 400 }
      );
    }

    if (!body.targetFormat) {
      return NextResponse.json(
        {
          success: false,
          error: 'targetFormat is required',
          code: 'INVALID_TARGET_FORMAT'
        },
        { status: 400 }
      );
    }

    // 验证游戏数据大小限制
    if (body.gamesData.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 100 games allowed per request',
          code: 'GAMES_LIMIT_EXCEEDED'
        },
        { status: 400 }
      );
    }

    console.log(`Starting three-stage flow for ${body.gamesData.length} games`);

    // 执行三阶段流程
    const result = await threeStageOrchestrationService.executeThreeStageFlow(
      body.gamesData,
      body.targetFormat,
      body.configuration || {}
    );

    const processingTime = Date.now() - startTime;

    if (result.success) {
      return NextResponse.json({
        success: true,
        sessionId: result.sessionId,
        result: {
          generatedContent: result.generatedContent,
          qualityMetrics: result.qualityMetrics,
          performanceMetrics: result.performanceMetrics,
          stages: result.stages
        },
        metadata: {
          totalGames: body.gamesData.length,
          successfulGames: result.generatedContent?.length || 0,
          processingTime,
          timestamp: new Date().toISOString(),
          apiVersion: '1.0'
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          sessionId: result.sessionId,
          error: result.errors?.[0] || 'Three-stage flow failed',
          code: 'FLOW_EXECUTION_FAILED',
          details: {
            stages: result.stages,
            errors: result.errors,
            warnings: result.warnings,
            processingTime
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Three-stage flow API error:', error);

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
 * GET /api/generate/three-stage
 * 获取服务状态和统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (sessionId) {
      // 查询特定会话状态
      const status = threeStageOrchestrationService.getOrchestrationStatus(sessionId);
      
      if (!status) {
        return NextResponse.json(
          {
            success: false,
            error: 'Session not found or expired',
            code: 'SESSION_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        sessionId,
        status: {
          overallStatus: status.overallStatus,
          currentStage: status.currentStage,
          overallProgress: status.overallProgress,
          totalGames: status.totalGames,
          processedGames: status.processedGames,
          failedGames: status.failedGames,
          stages: status.stages,
          startTime: status.startTime,
          estimatedCompletionTime: status.estimatedCompletionTime
        },
        metadata: {
          timestamp: new Date().toISOString(),
          apiVersion: '1.0'
        }
      });
    } else {
      // 获取服务整体统计信息
      const stats = threeStageOrchestrationService.getServiceStats();
      
      return NextResponse.json({
        success: true,
        service: 'three-stage-orchestration',
        status: 'active',
        stats,
        capabilities: {
          maxGamesPerRequest: 100,
          supportedStages: ['format-analysis', 'content-generation', 'format-correction'],
          features: [
            'progress-tracking',
            'quality-metrics',
            'performance-monitoring',
            'error-recovery',
            'caching'
          ]
        },
        metadata: {
          timestamp: new Date().toISOString(),
          apiVersion: '1.0'
        }
      });
    }

  } catch (error) {
    console.error('Three-stage status API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to get service status';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'STATUS_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/generate/three-stage
 * 取消流程执行
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionId parameter is required',
          code: 'MISSING_SESSION_ID'
        },
        { status: 400 }
      );
    }

    // 尝试取消流程
    const cancelled = threeStageOrchestrationService.cancelOrchestration(sessionId);

    if (cancelled) {
      return NextResponse.json({
        success: true,
        message: 'Orchestration cancelled successfully',
        sessionId,
        metadata: {
          timestamp: new Date().toISOString(),
          apiVersion: '1.0'
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found or already completed',
          code: 'SESSION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Three-stage cancellation API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel orchestration';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'CANCELLATION_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/generate/three-stage
 * 更新流程配置或添加监听器
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, action, configuration, listener } = body;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionId is required',
          code: 'MISSING_SESSION_ID'
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'add-listener':
        // 添加监听器逻辑
        // 注意：在实际实现中，这需要WebSocket或Server-Sent Events支持
        return NextResponse.json({
          success: true,
          message: 'Listener added (simulated)',
          sessionId,
          metadata: {
            timestamp: new Date().toISOString(),
            apiVersion: '1.0'
          }
        });

      case 'update-config':
        // 更新配置逻辑
        return NextResponse.json({
          success: true,
          message: 'Configuration updated (simulated)',
          sessionId,
          metadata: {
            timestamp: new Date().toISOString(),
            apiVersion: '1.0'
          }
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            code: 'UNKNOWN_ACTION'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Three-stage patch API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update orchestration';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'UPDATE_ERROR'
      },
      { status: 500 }
    );
  }
} 