/**
 * 结果导出API接口
 * 处理导出请求，支持多种格式和批量导出
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  resultExportService, 
  ExportConfig, 
  BatchExportConfig,
  ExportResult 
} from '@/services/resultExportService';
import { PreviewGenerationResult } from '@/types/ResultPreview.types';

/**
 * POST /api/results/export
 * 导出结果数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      results, 
      config, 
      mode = 'single' 
    }: {
      results: PreviewGenerationResult[];
      config: ExportConfig | BatchExportConfig;
      mode: 'single' | 'batch';
    } = body;

    // 验证请求数据
    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid request: results is required and must be a non-empty array',
          code: 'INVALID_RESULTS'
        },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { 
          error: 'Invalid request: config is required',
          code: 'INVALID_CONFIG'
        },
        { status: 400 }
      );
    }

    let exportResult: ExportResult;

    // 根据模式执行导出
    if (mode === 'batch') {
      const batchConfig = config as BatchExportConfig;
      exportResult = await resultExportService.exportBatch(results, batchConfig);
    } else {
      if (results.length !== 1) {
        return NextResponse.json(
          { 
            error: 'Invalid request: single mode requires exactly one result',
            code: 'INVALID_SINGLE_MODE'
          },
          { status: 400 }
        );
      }
      
      const singleConfig = config as ExportConfig;
      exportResult = await resultExportService.exportSingle(results[0], singleConfig);
    }

    // 检查导出结果
    if (!exportResult.success) {
      return NextResponse.json(
        { 
          error: exportResult.error || 'Export failed',
          code: 'EXPORT_FAILED',
          details: exportResult
        },
        { status: 500 }
      );
    }

    // 返回成功结果
    return NextResponse.json({
      success: true,
      data: exportResult,
      message: `Successfully exported ${exportResult.metadata.totalRecords} records`
    });

  } catch (error) {
    console.error('Export API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during export',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/results/export/history
 * 获取导出历史
 */
export async function GET() {
  try {
    const history = resultExportService.getExportHistory();
    const stats = resultExportService.getExportStats();

    return NextResponse.json({
      success: true,
      data: {
        history,
        stats
      }
    });

  } catch (error) {
    console.error('Get export history error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get export history',
        code: 'HISTORY_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/results/export/history
 * 清空导出历史
 */
export async function DELETE() {
  try {
    resultExportService.clearExportHistory();

    return NextResponse.json({
      success: true,
      message: 'Export history cleared successfully'
    });

  } catch (error) {
    console.error('Clear export history error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to clear export history',
        code: 'CLEAR_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 