# SEO内容自动生成工具 - API接口文档

## 概述

本文档描述了SEO内容自动生成工具的所有API接口，包括请求格式、响应格式、错误处理等详细信息。

### 基础信息

- **Base URL**: `https://your-domain.vercel.app/api`
- **API版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8
- **请求方法**: GET, POST, PUT, DELETE

### 认证方式

目前API无需认证，但建议在生产环境中实施适当的安全措施。

---

## 目录

1. [健康检查](#健康检查)
2. [工作流管理](#工作流管理)
3. [数据处理](#数据处理)
4. [内容生成](#内容生成)
5. [结果管理](#结果管理)
6. [系统管理](#系统管理)
7. [错误代码](#错误代码)

---

## 健康检查

### 系统健康状态

检查系统整体健康状态和各个服务的可用性。

**接口地址**: `GET /health`

**请求参数**: 无

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-30T10:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 12
    },
    "deepseek": {
      "status": "healthy",
      "responseTime": 234
    },
    "cache": {
      "status": "healthy",
      "responseTime": 5
    }
  },
  "metrics": {
    "memoryUsage": {
      "used": 245,
      "total": 512,
      "percentage": 47.8
    },
    "uptime": 86400,
    "requestCount": 1250
  }
}
```

**响应字段说明**:
- `status`: 整体健康状态 (healthy/degraded/unhealthy)
- `services`: 各个服务的状态和响应时间
- `metrics`: 系统性能指标

---

## 工作流管理

### 获取工作流列表

获取所有已创建的工作流配置。

**接口地址**: `GET /workflows`

**请求参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| search | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "workflow_123",
        "name": "动作游戏SEO内容",
        "description": "专为动作类游戏设计的SEO内容生成",
        "prompt": "请为动作游戏{{gameName}}生成...",
        "isDefault": false,
        "createdAt": "2025-01-20T10:00:00.000Z",
        "updatedAt": "2025-01-25T14:30:00.000Z",
        "usageCount": 15
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "pageSize": 20,
      "totalPages": 1
    }
  }
}
```

### 创建工作流

创建新的工作流配置。

**接口地址**: `POST /workflows`

**请求体**:
```json
{
  "name": "新工作流",
  "description": "工作流描述",
  "prompt": "生成提示模板",
  "isDefault": false
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "workflow_456",
    "name": "新工作流",
    "description": "工作流描述",
    "prompt": "生成提示模板",
    "isDefault": false,
    "createdAt": "2025-01-30T10:00:00.000Z"
  },
  "message": "工作流创建成功"
}
```

### 更新工作流

更新现有工作流配置。

**接口地址**: `PUT /workflows/{id}`

**路径参数**:
- `id`: 工作流ID

**请求体**:
```json
{
  "name": "更新后的工作流名称",
  "description": "更新后的描述",
  "prompt": "更新后的提示模板"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "workflow_123",
    "name": "更新后的工作流名称",
    "updatedAt": "2025-01-30T10:00:00.000Z"
  },
  "message": "工作流更新成功"
}
```

### 删除工作流

删除指定的工作流。

**接口地址**: `DELETE /workflows/{id}`

**路径参数**:
- `id`: 工作流ID

**响应示例**:
```json
{
  "success": true,
  "message": "工作流删除成功"
}
```

### 导出工作流

导出工作流配置为文件。

**接口地址**: `GET /workflows/export`

**请求参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| ids | string | 否 | 工作流ID列表，逗号分隔 |
| format | string | 否 | 导出格式 (json/yaml) |

**响应**: 文件下载

### 导入工作流

从文件导入工作流配置。

**接口地址**: `POST /workflows/import`

**请求体**: multipart/form-data
- `file`: 配置文件

**响应示例**:
```json
{
  "success": true,
  "data": {
    "imported": 3,
    "skipped": 1,
    "errors": []
  },
  "message": "导入完成"
}
```

---

## 数据处理

### 解析CSV文件

上传并解析CSV文件。

**接口地址**: `POST /data/parse-csv`

**请求体**: multipart/form-data
- `file`: CSV文件

**响应示例**:
```json
{
  "success": true,
  "data": {
    "columns": ["gameName", "category", "description"],
    "preview": [
      {
        "gameName": "Super Mario",
        "category": "Platform",
        "description": "经典平台游戏"
      }
    ],
    "total": 100,
    "validation": {
      "valid": 95,
      "invalid": 5,
      "errors": [
        {
          "row": 10,
          "field": "gameName",
          "message": "游戏名称不能为空"
        }
      ]
    }
  }
}
```

### 验证游戏数据

验证游戏数据的完整性和格式。

**接口地址**: `POST /data/validate`

**请求体**:
```json
{
  "data": [
    {
      "gameName": "Super Mario",
      "category": "Platform",
      "description": "经典平台游戏",
      "url": "https://example.com/mario"
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "valid": 1,
    "invalid": 0,
    "results": [
      {
        "index": 0,
        "valid": true,
        "errors": []
      }
    ]
  }
}
```

### 获取数据统计

获取当前数据的统计信息。

**接口地址**: `GET /data/stats`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalGames": 100,
    "categories": {
      "Platform": 25,
      "Action": 30,
      "Puzzle": 20,
      "Sports": 25
    },
    "dataQuality": {
      "complete": 90,
      "partial": 8,
      "invalid": 2
    },
    "lastUpdated": "2025-01-30T10:00:00.000Z"
  }
}
```

---

## 内容生成

### 开始生成内容

使用指定工作流开始生成内容。

**接口地址**: `POST /generate/start`

**请求体**:
```json
{
  "workflowId": "workflow_123",
  "gameIds": ["game_1", "game_2"],
  "settings": {
    "concurrency": 3,
    "timeout": 300,
    "wordCount": {
      "min": 800,
      "max": 1200
    },
    "keywordDensity": {
      "target": 2.5,
      "max": 3.5
    }
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "jobId": "job_789",
    "status": "started",
    "totalGames": 2,
    "estimatedTime": 180
  },
  "message": "内容生成已开始"
}
```

### 查询生成状态

查询内容生成的进度状态。

**接口地址**: `GET /generate/status/{jobId}`

**路径参数**:
- `jobId`: 生成任务ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "jobId": "job_789",
    "status": "running",
    "progress": {
      "completed": 1,
      "total": 2,
      "percentage": 50,
      "currentGame": "Super Mario"
    },
    "results": {
      "successful": 1,
      "failed": 0,
      "pending": 1
    },
    "estimatedTimeRemaining": 90,
    "startedAt": "2025-01-30T10:00:00.000Z"
  }
}
```

### 暂停/恢复生成

控制生成任务的执行状态。

**接口地址**: `POST /generate/control/{jobId}`

**路径参数**:
- `jobId`: 生成任务ID

**请求体**:
```json
{
  "action": "pause" // 或 "resume", "stop"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "jobId": "job_789",
    "status": "paused",
    "action": "pause"
  },
  "message": "任务已暂停"
}
```

### 获取生成结果

获取指定任务的生成结果。

**接口地址**: `GET /generate/results/{jobId}`

**路径参数**:
- `jobId`: 生成任务ID

**请求参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| status | string | 否 | 过滤状态 (success/failed/all) |
| format | string | 否 | 返回格式 (json/summary) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "jobId": "job_789",
    "results": [
      {
        "gameId": "game_1",
        "gameName": "Super Mario",
        "status": "success",
        "content": {
          "title": "Super Mario - 经典平台游戏",
          "description": "体验经典的平台跳跃游戏...",
          "features": ["多层关卡", "道具收集", "BOSS战斗"]
        },
        "metadata": {
          "wordCount": 856,
          "generationTime": 45,
          "tokensUsed": 1200
        },
        "quality": {
          "overallScore": 85,
          "seoScore": 88,
          "readabilityScore": 82
        },
        "generatedAt": "2025-01-30T10:01:00.000Z"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 1,
      "failed": 0,
      "averageQuality": 85,
      "totalTime": 90
    }
  }
}
```

---

## 结果管理

### 获取结果列表

获取所有生成结果的列表。

**接口地址**: `GET /results`

**请求参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| status | string | 否 | 状态过滤 |
| workflowId | string | 否 | 工作流过滤 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "result_123",
        "gameId": "game_1",
        "gameName": "Super Mario",
        "workflowId": "workflow_123",
        "status": "success",
        "quality": 85,
        "createdAt": "2025-01-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "pageSize": 20,
      "totalPages": 3
    }
  }
}
```

### 获取单个结果详情

获取指定结果的详细信息。

**接口地址**: `GET /results/{id}`

**路径参数**:
- `id`: 结果ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "result_123",
    "gameId": "game_1",
    "gameName": "Super Mario",
    "workflowId": "workflow_123",
    "status": "success",
    "content": {
      "title": "Super Mario - 经典平台游戏",
      "description": "详细的游戏描述...",
      "features": ["特色1", "特色2", "特色3"]
    },
    "rawContent": "原始生成内容...",
    "metadata": {
      "wordCount": 856,
      "generationTime": 45,
      "tokensUsed": 1200,
      "retryCount": 0
    },
    "quality": {
      "overallScore": 85,
      "seoScore": 88,
      "readabilityScore": 82,
      "keywordDensity": 2.3,
      "issues": [],
      "suggestions": ["建议1", "建议2"]
    },
    "createdAt": "2025-01-30T10:00:00.000Z",
    "updatedAt": "2025-01-30T10:01:00.000Z"
  }
}
```

### 删除结果

删除指定的生成结果。

**接口地址**: `DELETE /results/{id}`

**路径参数**:
- `id`: 结果ID

**响应示例**:
```json
{
  "success": true,
  "message": "结果删除成功"
}
```

### 批量删除结果

批量删除多个生成结果。

**接口地址**: `POST /results/batch-delete`

**请求体**:
```json
{
  "ids": ["result_123", "result_456", "result_789"]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "deleted": 3,
    "failed": 0
  },
  "message": "批量删除完成"
}
```

### 导出结果

导出生成结果为指定格式。

**接口地址**: `POST /results/export`

**请求体**:
```json
{
  "ids": ["result_123", "result_456"],
  "format": "json",
  "includeMetadata": true,
  "includeQuality": true
}
```

**响应**: 文件下载

### 重新生成

对指定结果重新生成内容。

**接口地址**: `POST /results/{id}/regenerate`

**路径参数**:
- `id`: 结果ID

**请求体**:
```json
{
  "workflowId": "workflow_123",
  "settings": {
    "wordCount": {
      "min": 800,
      "max": 1200
    }
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "jobId": "job_890",
    "resultId": "result_123"
  },
  "message": "重新生成已开始"
}
```

---

## 系统管理

### 清理缓存

清理系统缓存数据。

**接口地址**: `POST /system/clear-cache`

**请求体**:
```json
{
  "types": ["memory", "redis", "files"]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "cleared": {
      "memory": true,
      "redis": true,
      "files": true
    },
    "size": 1024000
  },
  "message": "缓存清理完成"
}
```

### 获取系统统计

获取系统使用统计信息。

**接口地址**: `GET /system/stats`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "usage": {
      "totalRequests": 10000,
      "totalGenerated": 5000,
      "successRate": 95.5,
      "averageResponseTime": 1200
    },
    "resources": {
      "memoryUsage": 67.8,
      "cpuUsage": 23.4,
      "diskUsage": 45.2
    },
    "period": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-30T23:59:59.000Z"
    }
  }
}
```

### 站点地图

生成网站站点地图。

**接口地址**: `GET /sitemap`

**响应**: XML格式的站点地图

### Robots.txt

获取网站robots.txt文件。

**接口地址**: `GET /robots`

**响应**: 文本格式的robots.txt

---

## 错误代码

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 参数验证失败 |
| 429 | 请求频率过高 |
| 500 | 服务器内部错误 |
| 502 | 网关错误 |
| 503 | 服务不可用 |

### 业务错误代码

| 错误代码 | 错误信息 | 说明 |
|----------|----------|------|
| 1001 | WORKFLOW_NOT_FOUND | 工作流不存在 |
| 1002 | WORKFLOW_NAME_DUPLICATE | 工作流名称重复 |
| 1003 | WORKFLOW_IN_USE | 工作流正在使用中 |
| 2001 | INVALID_CSV_FORMAT | CSV格式无效 |
| 2002 | MISSING_REQUIRED_FIELDS | 缺少必需字段 |
| 2003 | DATA_VALIDATION_FAILED | 数据验证失败 |
| 3001 | GENERATION_FAILED | 内容生成失败 |
| 3002 | GENERATION_TIMEOUT | 生成超时 |
| 3003 | API_QUOTA_EXCEEDED | API配额超出 |
| 4001 | RESULT_NOT_FOUND | 结果不存在 |
| 4002 | EXPORT_FAILED | 导出失败 |
| 5001 | SYSTEM_BUSY | 系统繁忙 |
| 5002 | MAINTENANCE_MODE | 维护模式 |

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "WORKFLOW_NOT_FOUND",
    "message": "指定的工作流不存在",
    "details": {
      "workflowId": "workflow_123",
      "timestamp": "2025-01-30T10:00:00.000Z"
    }
  }
}
```

---

## 接口调用示例

### JavaScript

```javascript
// 获取工作流列表
async function getWorkflows() {
  try {
    const response = await fetch('/api/workflows');
    const data = await response.json();
    console.log('工作流列表:', data);
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 开始生成内容
async function startGeneration(workflowId, gameIds) {
  try {
    const response = await fetch('/api/generate/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        gameIds,
        settings: {
          concurrency: 3,
          timeout: 300
        }
      })
    });
    const data = await response.json();
    console.log('生成开始:', data);
  } catch (error) {
    console.error('生成失败:', error);
  }
}
```

### cURL

```bash
# 获取工作流列表
curl -X GET "https://your-domain.vercel.app/api/workflows" \
  -H "Content-Type: application/json"

# 创建工作流
curl -X POST "https://your-domain.vercel.app/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新工作流",
    "description": "工作流描述",
    "prompt": "生成提示模板"
  }'

# 开始生成内容
curl -X POST "https://your-domain.vercel.app/api/generate/start" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "workflow_123",
    "gameIds": ["game_1", "game_2"],
    "settings": {
      "concurrency": 3,
      "timeout": 300
    }
  }'
```

---

## 更新历史

### v1.0.0 (2025-01-30)
- 初始API版本发布
- 包含工作流管理、数据处理、内容生成等核心功能
- 支持批量操作和导入导出

---

## 联系方式

如有疑问或建议，请联系：
- **技术支持**: api-support@seo-generator.com
- **文档反馈**: docs@seo-generator.com

---

© 2025 SEO内容自动生成工具. 保留所有权利. 