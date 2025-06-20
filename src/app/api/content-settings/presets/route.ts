/**
 * 内容设置预设管理API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContentSettingsService } from '@/services/contentSettingsService';
import { PresetTemplate, ContentSettings } from '@/types/ContentSettings.types';

const contentSettingsService = new ContentSettingsService();

/**
 * GET /api/content-settings/presets
 * 获取所有预设模板
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeBuiltIn = searchParams.get('includeBuiltIn') !== 'false';
    const includeCustom = searchParams.get('includeCustom') !== 'false';

    const allPresets = await contentSettingsService.getAllPresets();
    
    let filteredPresets = allPresets;
    if (!includeBuiltIn || !includeCustom) {
      filteredPresets = allPresets.filter(preset => {
        if (!includeBuiltIn && preset.isBuiltIn) return false;
        if (!includeCustom && !preset.isBuiltIn) return false;
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        presets: filteredPresets,
        stats: await contentSettingsService.getPresetStats()
      }
    });
  } catch (error) {
    console.error('获取预设列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取预设列表失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content-settings/presets
 * 创建自定义预设模板或应用预设
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, presetData, presetId, baseSettings } = body;

    if (action === 'create') {
      // 创建新的自定义预设
      if (!presetData) {
        return NextResponse.json(
          {
            success: false,
            error: '预设数据不能为空'
          },
          { status: 400 }
        );
      }

      const newPreset = await contentSettingsService.createCustomPreset(presetData);
      
      return NextResponse.json({
        success: true,
        data: {
          preset: newPreset,
          message: '自定义预设创建成功'
        }
      });
    } else if (action === 'apply') {
      // 应用预设到新的内容设置
      if (!presetId) {
        return NextResponse.json(
          {
            success: false,
            error: '预设ID不能为空'
          },
          { status: 400 }
        );
      }

      const appliedSettings = await contentSettingsService.applyPreset(presetId, baseSettings);
      
      return NextResponse.json({
        success: true,
        data: {
          settings: appliedSettings,
          message: '预设应用成功'
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '无效的操作类型'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('预设操作失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '预设操作失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/content-settings/presets
 * 更新自定义预设模板
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { presetId, updates } = body;

    if (!presetId) {
      return NextResponse.json(
        {
          success: false,
          error: '预设ID不能为空'
        },
        { status: 400 }
      );
    }

    if (!updates) {
      return NextResponse.json(
        {
          success: false,
          error: '更新数据不能为空'
        },
        { status: 400 }
      );
    }

    const updatedPreset = await contentSettingsService.updateCustomPreset(presetId, updates);
    
    if (!updatedPreset) {
      return NextResponse.json(
        {
          success: false,
          error: '预设不存在或为内置预设，无法修改'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        preset: updatedPreset,
        message: '预设更新成功'
      }
    });
  } catch (error) {
    console.error('更新预设失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新预设失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content-settings/presets
 * 删除自定义预设模板
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const presetId = searchParams.get('id');

    if (!presetId) {
      return NextResponse.json(
        {
          success: false,
          error: '预设ID不能为空'
        },
        { status: 400 }
      );
    }

    const deleted = await contentSettingsService.deleteCustomPreset(presetId);
    
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: '预设不存在或为内置预设，无法删除'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: '预设删除成功'
      }
    });
  } catch (error) {
    console.error('删除预设失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除预设失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 