/**
 * API端点常量配置
 */

// 基础配置
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// 工作流相关端点
export const WORKFLOW_ENDPOINTS = {
  BASE: `${API_BASE_URL}/workflows`,
  CREATE: `${API_BASE_URL}/workflows`,
  UPDATE: (id: string) => `${API_BASE_URL}/workflows/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/workflows/${id}`,
  GET_ALL: `${API_BASE_URL}/workflows`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/workflows/${id}`,
  EXPORT: (id: string) => `${API_BASE_URL}/workflows/${id}/export`,
  IMPORT: `${API_BASE_URL}/workflows/import`,
} as const;

// 内容生成相关端点
export const GENERATION_ENDPOINTS = {
  BASE: `${API_BASE_URL}/generate`,
  START: `${API_BASE_URL}/generate`,
  STATUS: (id: string) => `${API_BASE_URL}/generate/${id}/status`,
  RESULT: (id: string) => `${API_BASE_URL}/generate/${id}`,
  CANCEL: (id: string) => `${API_BASE_URL}/generate/${id}/cancel`,
  HISTORY: `${API_BASE_URL}/generate/history`,
} as const;

// 文件上传相关端点
export const UPLOAD_ENDPOINTS = {
  CSV: `${API_BASE_URL}/upload/csv`,
  VALIDATE: `${API_BASE_URL}/upload/validate`,
  PROGRESS: (id: string) => `${API_BASE_URL}/upload/${id}/progress`,
} as const;

// 竞品内容相关端点
export const COMPETITOR_ENDPOINTS = {
  SEARCH: `${API_BASE_URL}/competitors/search`,
  CONTENT: (gameId: string) => `${API_BASE_URL}/competitors/${gameId}`,
  CACHE: `${API_BASE_URL}/competitors/cache`,
} as const;

// 外部API端点
export const EXTERNAL_APIS = {
  DEEPSEEK: {
    BASE: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
    CHAT: '/v1/chat/completions',
  },
  SEARCH: {
    GOOGLE: 'https://www.googleapis.com/customsearch/v1',
    BING: 'https://api.cognitive.microsoft.com/bing/v7.0/search',
  },
} as const; 