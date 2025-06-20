/**
 * CSV上传组件类型定义
 */

import { CSVParseResult, CSVUploadProgress, CSVParseConfig } from '@/types/CSV.types';

/**
 * CSV上传组件属性接口
 */
export interface CSVUploaderProps {
  /** 上传成功回调 */
  onUploadSuccess?: (result: CSVParseResult) => void;
  /** 上传错误回调 */
  onUploadError?: (error: Error) => void;
  /** 进度回调 */
  onProgress?: (progress: CSVUploadProgress) => void;
  /** 文件验证回调 */
  onFileValidation?: (file: File) => Promise<boolean> | boolean;
  /** 解析配置 */
  parseConfig?: Partial<CSVParseConfig>;
  /** 最大文件大小 (bytes) */
  maxSize?: number;
  /** 是否显示解析预览 */
  showPreview?: boolean;
  /** 是否自动开始解析 */
  autoParser?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * CSV上传状态接口
 */
export interface CSVUploadState {
  /** 当前上传的文件 */
  file: File | null;
  /** 文件信息 */
  fileInfo: any | null;
  /** 解析结果 */
  parseResult: CSVParseResult | null;
  /** 上传进度 */
  progress: CSVUploadProgress | null;
  /** 是否正在处理 */
  isProcessing: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否显示预览模态框 */
  showPreviewModal: boolean;
}

/**
 * CSV预览模态框属性
 */
export interface CSVPreviewModalProps {
  parseResult: CSVParseResult;
  onClose: () => void;
} 