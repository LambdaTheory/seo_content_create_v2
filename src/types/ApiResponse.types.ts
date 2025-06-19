/**
 * 基础API响应接口
 */
export interface ApiResponse<T = any> {
  /** 响应是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 错误代码 */
  code?: string;
  /** 响应消息 */
  message?: string;
  /** 响应时间戳 */
  timestamp: number;
}

/**
 * 分页数据接口
 */
export interface PaginatedData<T> {
  /** 数据列表 */
  items: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 搜索关键词 */
  search?: string;
}

/**
 * 错误响应详情
 */
export interface ErrorDetail {
  /** 错误字段 */
  field?: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code?: string;
}

/**
 * 验证错误响应
 */
export interface ValidationErrorResponse {
  /** 验证错误列表 */
  errors: ErrorDetail[];
  /** 总错误数 */
  errorCount: number;
}

/**
 * 上传进度响应
 */
export interface UploadProgressResponse {
  /** 已上传字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 进度百分比 */
  percentage: number;
  /** 上传速度（字节/秒） */
  speed?: number;
  /** 预计剩余时间（秒） */
  estimatedTime?: number;
}

/**
 * 批处理响应
 */
export interface BatchResponse<T> {
  /** 成功处理的项目 */
  successful: T[];
  /** 失败的项目及错误信息 */
  failed: Array<{
    item: any;
    error: string;
  }>;
  /** 总数量 */
  total: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
} 