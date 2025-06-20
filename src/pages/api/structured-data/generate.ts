/**
 * 结构化数据生成API端点
 * 处理单个游戏和批量游戏的结构化数据生成请求
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { StructuredDataService } from '@/services/structuredData/StructuredDataService';
import {
  StructuredDataGenerationRequest,
  BatchStructuredDataRequest,
  StructuredDataApiResponse,
} from '@/types/StructuredData.types';
import { SchemaGameType } from '@/services/structuredData/schemaOrgStandards';

// 创建结构化数据服务实例
const structuredDataService = new StructuredDataService({
  enableValidation: true,
  enableOptimization: true,
  enableCaching: true,
  includeReviews: true,
  includeOffers: true,
  includeMedia: true,
  includeDevInfo: true,
  outputFormat: 'json-ld',
  compressionLevel: 'minimal',
  prioritizeKeywords: true,
  enhanceDescriptions: true,
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
});

/**
 * 处理结构化数据生成请求
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StructuredDataApiResponse>
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    // 只允许POST请求
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed',
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          version: '1.0.0',
        },
      });
    }

    const body = req.body;

    // 验证请求体
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Request body is required and must be a valid JSON object',
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          version: '1.0.0',
        },
      });
    }

    // 检查是否为批量请求
    if (body.gamesData && Array.isArray(body.gamesData)) {
      return await handleBatchGeneration(req, res, body as BatchStructuredDataRequest, requestId, startTime);
    } else {
      return await handleSingleGeneration(req, res, body as StructuredDataGenerationRequest, requestId, startTime);
    }

  } catch (error) {
    console.error('Structured data generation error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }
}

/**
 * 处理单个游戏的结构化数据生成
 */
async function handleSingleGeneration(
  req: NextApiRequest,
  res: NextApiResponse<StructuredDataApiResponse>,
  requestData: StructuredDataGenerationRequest,
  requestId: string,
  startTime: number
) {
  // 验证必要参数
  if (!requestData.gameData) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_GAME_DATA',
        message: 'gameData is required',
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  try {
    // 更新服务配置
    if (requestData.config) {
      structuredDataService.updateConfig(requestData.config);
    }

    // 生成结构化数据
    const result = await structuredDataService.generateStructuredData(
      requestData.gameData,
      requestData.gameId,
      requestData.schemaType
    );

    const processingTime = Date.now() - startTime;

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime,
          version: '1.0.0',
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to generate structured data',
          details: {
            errors: result.errors,
            warnings: result.warnings,
          },
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime,
          version: '1.0.0',
        },
      });
    }

  } catch (error) {
    console.error('Single generation error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Generation failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }
}

/**
 * 处理批量游戏的结构化数据生成
 */
async function handleBatchGeneration(
  req: NextApiRequest,
  res: NextApiResponse<StructuredDataApiResponse>,
  requestData: BatchStructuredDataRequest,
  requestId: string,
  startTime: number
) {
  // 验证必要参数
  if (!requestData.gamesData || !Array.isArray(requestData.gamesData) || requestData.gamesData.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_GAMES_DATA',
        message: 'gamesData must be a non-empty array',
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  // 限制批量大小
  const maxBatchSize = 100;
  if (requestData.gamesData.length > maxBatchSize) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BATCH_SIZE_EXCEEDED',
        message: `Batch size cannot exceed ${maxBatchSize} items`,
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  try {
    // 更新服务配置
    if (requestData.config) {
      structuredDataService.updateConfig(requestData.config);
    }

    // 批量生成结构化数据
    const result = await structuredDataService.generateBatchStructuredData(
      requestData.gamesData,
      {
        concurrency: requestData.options?.concurrency || 5,
        onProgress: requestData.options?.onProgress,
      }
    );

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: result,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime,
        version: '1.0.0',
      },
    });

  } catch (error) {
    console.error('Batch generation error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Batch generation failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }
} 