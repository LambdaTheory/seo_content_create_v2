/**
 * 内容生成流程编排 API
 * 
 * 提供流程启动、状态查询、控制等功能
 * 
 * @author AI Assistant
 * @date 2025-01-29
 */

import { NextRequest, NextResponse } from 'next/server';
import { contentGenerationOrchestrator } from '@/services/contentGenerationOrchestrator';

/**
 * POST: 启动内容生成流程
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, gameDataIds, enableStructuredData, outputFormat, qualityThreshold } = body;

    // 验证必需参数
    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'workflowId is required' },
        { status: 400 }
      );
    }

    if (!gameDataIds || !Array.isArray(gameDataIds) || gameDataIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'gameDataIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // 构建配置
    const configuration = {
      workflowId,
      gameDataIds,
      enableStructuredData: enableStructuredData ?? true,
      outputFormat: outputFormat ?? 'json',
      qualityThreshold: qualityThreshold ?? 0.7,
      maxRetries: 3,
      concurrency: {
        maxConcurrentGames: 5,
        maxConcurrentStages: 2
      },
      timeout: {
        perGame: 120000,  // 2分钟
        total: 1800000    // 30分钟
      },
      recovery: {
        enableAutoRecovery: true,
        saveCheckpoints: true,
        maxRecoveryAttempts: 3
      },
      notifications: {
        enableProgressUpdates: true,
        enableErrorAlerts: true,
        progressUpdateInterval: 1000
      }
    };

    // 启动流程
    const flowId = await contentGenerationOrchestrator.startGenerationFlow(configuration);

    return NextResponse.json({
      success: true,
      data: {
        flowId,
        message: 'Generation flow started successfully',
        configuration
      }
    });

  } catch (error) {
    console.error('Flow start API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to start generation flow';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'FLOW_START_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET: 查询流程状态或队列状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('flowId');
    const action = searchParams.get('action');

    if (action === 'queue') {
      // 获取队列状态
      const queueStatus = contentGenerationOrchestrator.getQueueStatus();
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'queue_status',
          ...queueStatus,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (action === 'all') {
      // 获取所有流程状态
      const allStatuses = contentGenerationOrchestrator.getAllFlowStatuses();
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'all_flows',
          flows: allStatuses,
          count: allStatuses.length,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (flowId) {
      // 获取特定流程状态
      const flowStatus = contentGenerationOrchestrator.getFlowStatus(flowId);
      
      if (!flowStatus) {
        return NextResponse.json(
          { success: false, error: 'Flow not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          type: 'flow_status',
          ...flowStatus,
          timestamp: new Date().toISOString()
        }
      });
    }

    // 默认返回服务状态
    const queueStatus = contentGenerationOrchestrator.getQueueStatus();
    const allStatuses = contentGenerationOrchestrator.getAllFlowStatuses();

    return NextResponse.json({
      success: true,
      data: {
        type: 'service_status',
        service: 'content-generation-orchestrator',
        status: 'active',
        summary: {
          totalFlows: allStatuses.length,
          activeFlows: allStatuses.filter(f => f.status === 'running').length,
          queuedFlows: queueStatus.queued,
          completedFlows: queueStatus.completed,
          failedFlows: queueStatus.failed
        },
        capabilities: [
          'flow-orchestration',
          'progress-tracking',
          'queue-management',
          'error-recovery',
          'checkpoint-save'
        ],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Flow status API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to get flow status';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'FLOW_STATUS_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: 控制流程（暂停、恢复、取消等）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { flowId, action } = body;

    if (!flowId) {
      return NextResponse.json(
        { success: false, error: 'flowId is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required' },
        { status: 400 }
      );
    }

    let result = false;
    let message = '';

    switch (action) {
      case 'pause':
        result = contentGenerationOrchestrator.pauseFlow(flowId);
        message = result ? 'Flow paused successfully' : 'Failed to pause flow or flow not running';
        break;

      case 'resume':
        result = contentGenerationOrchestrator.resumeFlow(flowId);
        message = result ? 'Flow resumed successfully' : 'Failed to resume flow or flow not paused';
        break;

      case 'cancel':
        result = contentGenerationOrchestrator.cancelFlow(flowId);
        message = result ? 'Flow cancelled successfully' : 'Failed to cancel flow or flow not active';
        break;

      case 'recover':
        result = await contentGenerationOrchestrator.recoverFlow(flowId);
        message = result ? 'Flow recovery started successfully' : 'Failed to recover flow';
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result,
      data: {
        flowId,
        action,
        result,
        message,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Flow control API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to control flow';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'FLOW_CONTROL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 删除流程（从队列和活动流程中移除）
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('flowId');

    if (!flowId) {
      return NextResponse.json(
        { success: false, error: 'flowId is required' },
        { status: 400 }
      );
    }

    // 先尝试取消流程
    const cancelled = contentGenerationOrchestrator.cancelFlow(flowId);

    return NextResponse.json({
      success: cancelled,
      data: {
        flowId,
        action: 'delete',
        result: cancelled,
        message: cancelled ? 'Flow deleted successfully' : 'Failed to delete flow or flow not found',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Flow delete API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete flow';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'FLOW_DELETE_ERROR'
      },
      { status: 500 }
    );
  }
} 