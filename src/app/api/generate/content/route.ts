import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationService } from '@/services/contentGenerationService';
import { FormatAnalysisService } from '@/services/formatAnalysisService';
import { ContentGenerationRequest } from '@/types/DeepSeek.types';

/**
 * 内容生成API - 阶段二：内容生成引擎
 * 
 * 处理流程：
 * 1. 接收游戏数据、竞品内容、格式规则、内容设置
 * 2. 构建智能Prompt，集成格式约束
 * 3. 调用AI生成内容，控制上下文长度
 * 4. 返回生成结果和质量评估
 */

const contentGenerationService = new ContentGenerationService();
const formatAnalysisService = new FormatAnalysisService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = validateContentGenerationRequest(body);
    if (!validationResult.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationResult.errors 
        },
        { status: 400 }
      );
    }

    const contentRequest: ContentGenerationRequest = body;

    // 检查格式规则是否存在
    if (!contentRequest.formatRules || !contentRequest.formatRules.formatHash) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Format rules not found. Please run format analysis first.' 
        },
        { status: 400 }
      );
    }

    // 单个游戏内容生成
    if (contentRequest.gameData) {
      const result = await contentGenerationService.generateGameContent(contentRequest);
      
      return NextResponse.json({
        success: true,
        data: result,
        metadata: {
          stage: 'content_generation',
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Game data is required' 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Content generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'stats':
        // 获取生成统计信息
        const stats = contentGenerationService.getStats();
        return NextResponse.json({
          success: true,
          data: stats
        });

      case 'status':
        // 获取运行状态
        const status = contentGenerationService.getRunningStatus();
        return NextResponse.json({
          success: true,
          data: status
        });

      case 'config':
        // 获取当前配置
        const config = contentGenerationService.getConfig();
        return NextResponse.json({
          success: true,
          data: config
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action parameter' 
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Get request error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Config data is required' 
        },
        { status: 400 }
      );
    }

    // 更新配置
    contentGenerationService.updateConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Config update error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 批量内容生成API
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requests, enableProgress } = body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Requests array is required and cannot be empty' 
        },
        { status: 400 }
      );
    }

    // 验证每个请求
    for (let i = 0; i < requests.length; i++) {
      const validationResult = validateContentGenerationRequest(requests[i]);
      if (!validationResult.valid) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid request data at index ${i}`,
            details: validationResult.errors 
          },
          { status: 400 }
        );
      }
    }

    // 如果启用进度回调，可以考虑使用WebSocket或Server-Sent Events
    // 这里简化实现，直接返回批量结果
    const progressCallback = enableProgress ? 
      (progress: { completed: number; total: number; errors: number }) => {
        console.log(`Progress: ${progress.completed}/${progress.total}, Errors: ${progress.errors}`);
      } : undefined;

    const batchResult = await contentGenerationService.generateBatchContent(
      requests,
      progressCallback
    );

    return NextResponse.json({
      success: true,
      data: batchResult,
      metadata: {
        stage: 'batch_content_generation',
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });

  } catch (error) {
    console.error('Batch content generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 验证内容生成请求
 */
function validateContentGenerationRequest(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 基础数据验证
  if (!data) {
    errors.push('Request data is required');
    return { valid: false, errors };
  }

  // 游戏数据验证
  if (!data.gameData) {
    errors.push('gameData is required');
  } else {
    const gameData = data.gameData;
    
    if (!gameData.gameName || typeof gameData.gameName !== 'string') {
      errors.push('gameData.gameName is required and must be a string');
    }
    
    if (!gameData.mainKeyword || typeof gameData.mainKeyword !== 'string') {
      errors.push('gameData.mainKeyword is required and must be a string');
    }
    
    if (!gameData.realUrl || typeof gameData.realUrl !== 'string') {
      errors.push('gameData.realUrl is required and must be a string');
    }
  }

  // 格式规则验证
  if (!data.formatRules) {
    errors.push('formatRules is required');
  } else {
    const formatRules = data.formatRules;
    
    if (!formatRules.compactTemplate || typeof formatRules.compactTemplate !== 'string') {
      errors.push('formatRules.compactTemplate is required and must be a string');
    }
    
    if (!Array.isArray(formatRules.fieldConstraints)) {
      errors.push('formatRules.fieldConstraints must be an array');
    }
    
    if (!Array.isArray(formatRules.validationRules)) {
      errors.push('formatRules.validationRules must be an array');
    }
    
    if (!formatRules.formatHash || typeof formatRules.formatHash !== 'string') {
      errors.push('formatRules.formatHash is required and must be a string');
    }
  }

  // 内容设置验证
  if (!data.contentSettings) {
    errors.push('contentSettings is required');
  } else {
    const contentSettings = data.contentSettings;
    
    if (!contentSettings.wordCount || !contentSettings.wordCount.total) {
      errors.push('contentSettings.wordCount.total is required');
    }
    
    if (!contentSettings.keywordDensity) {
      errors.push('contentSettings.keywordDensity is required');
    }
    
    if (!['strict', 'standard', 'free'].includes(contentSettings.generationMode)) {
      errors.push('contentSettings.generationMode must be one of: strict, standard, free');
    }
  }

  // 工作流ID验证
  if (!data.workflowId || typeof data.workflowId !== 'string') {
    errors.push('workflowId is required and must be a string');
  }

  // 竞品内容验证（可选）
  if (data.competitorContent && !Array.isArray(data.competitorContent)) {
    errors.push('competitorContent must be an array if provided');
  }

  return { valid: errors.length === 0, errors };
} 