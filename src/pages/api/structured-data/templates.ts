/**
 * 结构化数据模板管理API端点
 * 处理模板的CRUD操作
 */

import { NextApiRequest, NextApiResponse } from 'next';
import {
  StructuredDataTemplate,
  StructuredDataApiResponse,
  StructuredDataMode,
  FieldConfig,
} from '@/types/StructuredData.types';
import { SchemaGameType, ApplicationCategory } from '@/services/structuredData/schemaOrgStandards';

// 内置模板数据
const builtInTemplates: StructuredDataTemplate[] = [
  {
    id: 'videogame-basic',
    name: '基础电子游戏模板',
    description: '包含电子游戏的基本Schema.org字段，适合大多数游戏',
    schemaType: SchemaGameType.VideoGame,
    mode: StructuredDataMode.BASIC,
    fields: [
      {
        name: 'name',
        label: '游戏名称',
        type: 'string',
        required: true,
        schemaProperty: 'name',
        seoWeight: 10,
        description: '游戏的正式名称',
        examples: ['塞尔达传说：王国之泪', 'Cyberpunk 2077'],
        validation: {
          minLength: 1,
          maxLength: 200,
        },
        mapping: {
          sourceField: 'title',
        },
      },
      {
        name: 'description',
        label: '游戏描述',
        type: 'string',
        required: false,
        schemaProperty: 'description',
        seoWeight: 9,
        description: '游戏的详细描述，用于SEO优化',
        examples: ['一款开放世界冒险游戏...'],
        validation: {
          maxLength: 5000,
        },
        mapping: {
          sourceField: 'description',
        },
      },
      {
        name: 'genre',
        label: '游戏类型',
        type: 'string',
        required: false,
        schemaProperty: 'genre',
        seoWeight: 8,
        description: '游戏的风格/类型',
        examples: ['动作冒险', '角色扮演', '策略'],
        mapping: {
          sourceField: 'genre',
          transformer: 'mapGenres',
        },
      },
      {
        name: 'gamePlatform',
        label: '游戏平台',
        type: 'array',
        required: false,
        schemaProperty: 'gamePlatform',
        seoWeight: 7,
        description: '支持的游戏平台',
        examples: ['PC', 'PlayStation 5', 'Xbox Series X'],
        mapping: {
          sourceField: 'platform',
          transformer: 'mapPlatforms',
        },
      },
      {
        name: 'datePublished',
        label: '发布日期',
        type: 'date',
        required: false,
        schemaProperty: 'datePublished',
        seoWeight: 6,
        description: '游戏的发布日期',
        examples: ['2023-05-12'],
        mapping: {
          sourceField: 'releaseDate',
          transformer: 'formatDate',
        },
      },
      {
        name: 'developer',
        label: '开发商',
        type: 'object',
        required: false,
        schemaProperty: 'developer',
        seoWeight: 5,
        description: '游戏开发商信息',
        examples: ['Nintendo', 'CD Projekt Red'],
        mapping: {
          sourceField: 'developer',
          transformer: 'createOrganization',
        },
      },
      {
        name: 'aggregateRating',
        label: '用户评分',
        type: 'object',
        required: false,
        schemaProperty: 'aggregateRating',
        seoWeight: 8,
        description: '用户评分信息',
        mapping: {
          sourceField: 'rating',
          transformer: 'createAggregateRating',
        },
      },
      {
        name: 'offers',
        label: '价格信息',
        type: 'object',
        required: false,
        schemaProperty: 'offers',
        seoWeight: 6,
        description: '游戏价格和购买信息',
        mapping: {
          sourceField: 'price',
          transformer: 'createOffer',
        },
      },
    ],
    config: {
      enableValidation: true,
      enableOptimization: true,
      outputFormat: 'json-ld',
      compressionLevel: 'minimal',
    },
    isBuiltIn: true,
    version: '1.0.0',
    createdAt: '2025-01-20T00:00:00.000Z',
    updatedAt: '2025-01-20T00:00:00.000Z',
    usage: {
      count: 0,
      lastUsed: '2025-01-20T00:00:00.000Z',
    },
    tags: ['基础', '电子游戏', '常用'],
    category: '游戏',
  },
  {
    id: 'videogame-comprehensive',
    name: '全面电子游戏模板',
    description: '包含电子游戏的所有可用Schema.org字段，用于完整的SEO优化',
    schemaType: SchemaGameType.VideoGame,
    mode: StructuredDataMode.COMPREHENSIVE,
    fields: [
      // 包含基础模板的所有字段，加上更多字段
      ...getBasicVideoGameFields(),
      {
        name: 'trailer',
        label: '游戏预告片',
        type: 'object',
        required: false,
        schemaProperty: 'trailer',
        seoWeight: 7,
        description: '游戏预告片视频',
        mapping: {
          sourceField: 'trailerUrl',
          transformer: 'createVideoObject',
        },
      },
      {
        name: 'screenshot',
        label: '游戏截图',
        type: 'array',
        required: false,
        schemaProperty: 'screenshot',
        seoWeight: 6,
        description: '游戏截图图片',
        mapping: {
          sourceField: 'screenshots',
          transformer: 'createImageObjects',
        },
      },
      {
        name: 'contentRating',
        label: '内容评级',
        type: 'string',
        required: false,
        schemaProperty: 'contentRating',
        seoWeight: 5,
        description: '游戏内容评级(ESRB/PEGI等)',
        examples: ['Teen', 'Mature 17+', 'PEGI 12'],
      },
      {
        name: 'applicationCategory',
        label: '应用类别',
        type: 'string',
        required: false,
        schemaProperty: 'applicationCategory',
        defaultValue: ApplicationCategory.GameApplication,
        seoWeight: 4,
        description: '应用程序类别',
      },
    ],
    config: {
      enableValidation: true,
      enableOptimization: true,
      includeReviews: true,
      includeOffers: true,
      includeMedia: true,
      includeDevInfo: true,
      outputFormat: 'json-ld',
      compressionLevel: 'none',
      prioritizeKeywords: true,
      enhanceDescriptions: true,
    },
    isBuiltIn: true,
    version: '1.0.0',
    createdAt: '2025-01-20T00:00:00.000Z',
    updatedAt: '2025-01-20T00:00:00.000Z',
    usage: {
      count: 0,
      lastUsed: '2025-01-20T00:00:00.000Z',
    },
    tags: ['全面', '电子游戏', 'SEO优化'],
    category: '游戏',
  },
  {
    id: 'game-simple',
    name: '简单游戏模板',
    description: '用于桌游、棋牌等传统游戏的基础模板',
    schemaType: SchemaGameType.Game,
    mode: StructuredDataMode.BASIC,
    fields: [
      {
        name: 'name',
        label: '游戏名称',
        type: 'string',
        required: true,
        schemaProperty: 'name',
        seoWeight: 10,
        description: '游戏的正式名称',
        validation: {
          minLength: 1,
          maxLength: 200,
        },
      },
      {
        name: 'description',
        label: '游戏描述',
        type: 'string',
        required: false,
        schemaProperty: 'description',
        seoWeight: 9,
        description: '游戏规则和玩法描述',
      },
      {
        name: 'numberOfPlayers',
        label: '玩家数量',
        type: 'object',
        required: false,
        schemaProperty: 'numberOfPlayers',
        seoWeight: 7,
        description: '支持的玩家数量范围',
      },
      {
        name: 'genre',
        label: '游戏类型',
        type: 'string',
        required: false,
        schemaProperty: 'genre',
        seoWeight: 8,
        description: '游戏的风格/类型',
      },
    ],
    config: {
      enableValidation: true,
      enableOptimization: false,
      outputFormat: 'json-ld',
      compressionLevel: 'minimal',
    },
    isBuiltIn: true,
    version: '1.0.0',
    createdAt: '2025-01-20T00:00:00.000Z',
    updatedAt: '2025-01-20T00:00:00.000Z',
    usage: {
      count: 0,
      lastUsed: '2025-01-20T00:00:00.000Z',
    },
    tags: ['简单', '传统游戏', '桌游'],
    category: '游戏',
  },
];

// 自定义模板存储 (在实际应用中应该使用数据库)
let customTemplates: StructuredDataTemplate[] = [];

/**
 * 获取基础视频游戏字段配置
 */
function getBasicVideoGameFields(): FieldConfig[] {
  return builtInTemplates.find(t => t.id === 'videogame-basic')?.fields || [];
}

/**
 * 处理模板管理请求
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StructuredDataApiResponse>
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetTemplates(req, res, requestId, startTime);
      case 'POST':
        return await handleCreateTemplate(req, res, requestId, startTime);
      case 'PUT':
        return await handleUpdateTemplate(req, res, requestId, startTime);
      case 'DELETE':
        return await handleDeleteTemplate(req, res, requestId, startTime);
      default:
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Method not allowed',
          },
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            version: '1.0.0',
          },
        });
    }
  } catch (error) {
    console.error('Template management error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
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
 * 获取模板列表
 */
async function handleGetTemplates(
  req: NextApiRequest,
  res: NextApiResponse<StructuredDataApiResponse>,
  requestId: string,
  startTime: number
) {
  const { category, schemaType, includeBuiltIn = 'true', includeCustom = 'true' } = req.query;

  let templates: StructuredDataTemplate[] = [];

  // 包含内置模板
  if (includeBuiltIn === 'true') {
    templates = [...templates, ...builtInTemplates];
  }

  // 包含自定义模板
  if (includeCustom === 'true') {
    templates = [...templates, ...customTemplates];
  }

  // 按类别筛选
  if (category && typeof category === 'string') {
    templates = templates.filter(t => t.category === category);
  }

  // 按Schema类型筛选
  if (schemaType && typeof schemaType === 'string') {
    templates = templates.filter(t => t.schemaType === schemaType);
  }

  // 按使用次数排序
  templates.sort((a, b) => b.usage.count - a.usage.count);

  return res.status(200).json({
    success: true,
    data: templates,
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      version: '1.0.0',
    },
  });
}

/**
 * 创建新模板
 */
async function handleCreateTemplate(
  req: NextApiRequest,
  res: NextApiResponse<StructuredDataApiResponse>,
  requestId: string,
  startTime: number
) {
  const templateData = req.body;

  // 验证必要字段
  if (!templateData.name || !templateData.schemaType || !templateData.fields) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TEMPLATE_DATA',
        message: 'Template name, schemaType, and fields are required',
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  // 检查名称是否已存在
  const existingTemplate = [...builtInTemplates, ...customTemplates]
    .find(t => t.name === templateData.name);
  
  if (existingTemplate) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'TEMPLATE_NAME_EXISTS',
        message: 'A template with this name already exists',
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  // 创建新模板
  const newTemplate: StructuredDataTemplate = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: templateData.name,
    description: templateData.description || '',
    schemaType: templateData.schemaType,
    mode: templateData.mode || StructuredDataMode.CUSTOM,
    fields: templateData.fields,
    config: templateData.config || {},
    isBuiltIn: false,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usage: {
      count: 0,
      lastUsed: new Date().toISOString(),
    },
    tags: templateData.tags || [],
    category: templateData.category || '自定义',
  };

  customTemplates.push(newTemplate);

  return res.status(201).json({
    success: true,
    data: newTemplate,
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      version: '1.0.0',
    },
  });
}

/**
 * 更新模板
 */
async function handleUpdateTemplate(
  req: NextApiRequest,
  res: NextApiResponse<StructuredDataApiResponse>,
  requestId: string,
  startTime: number
) {
  const { id } = req.query;
  const updateData = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_TEMPLATE_ID',
        message: 'Template ID is required',
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  // 查找模板
  const templateIndex = customTemplates.findIndex(t => t.id === id);
  
  if (templateIndex === -1) {
    // 检查是否为内置模板
    const isBuiltIn = builtInTemplates.some(t => t.id === id);
    if (isBuiltIn) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CANNOT_UPDATE_BUILTIN',
          message: 'Built-in templates cannot be updated',
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          version: '1.0.0',
        },
      });
    }

    return res.status(404).json({
      success: false,
      error: {
        code: 'TEMPLATE_NOT_FOUND',
        message: 'Template not found',
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  // 更新模板
  const updatedTemplate = {
    ...customTemplates[templateIndex],
    ...updateData,
    id: customTemplates[templateIndex].id, // 保持ID不变
    isBuiltIn: false, // 确保不是内置模板
    updatedAt: new Date().toISOString(),
  };

  customTemplates[templateIndex] = updatedTemplate;

  return res.status(200).json({
    success: true,
    data: updatedTemplate,
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      version: '1.0.0',
    },
  });
}

/**
 * 删除模板
 */
async function handleDeleteTemplate(
  req: NextApiRequest,
  res: NextApiResponse<StructuredDataApiResponse>,
  requestId: string,
  startTime: number
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_TEMPLATE_ID',
        message: 'Template ID is required',
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  // 检查是否为内置模板
  const isBuiltIn = builtInTemplates.some(t => t.id === id);
  if (isBuiltIn) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CANNOT_DELETE_BUILTIN',
        message: 'Built-in templates cannot be deleted',
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  // 查找并删除自定义模板
  const templateIndex = customTemplates.findIndex(t => t.id === id);
  
  if (templateIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'TEMPLATE_NOT_FOUND',
        message: 'Template not found',
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
    });
  }

  const deletedTemplate = customTemplates.splice(templateIndex, 1)[0];

  return res.status(200).json({
    success: true,
    data: { message: 'Template deleted successfully', deletedTemplate },
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      version: '1.0.0',
    },
  });
} 