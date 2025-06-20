import { ReactNode } from 'react';

export interface FileUploadProps {
  /** 接受的文件类型 */
  accept?: string;
  /** 是否支持多文件选择 */
  multiple?: boolean;
  /** 最大文件大小（字节） */
  maxSize?: number;
  /** 最大文件数量 */
  maxFiles?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 拖拽区域文本 */
  dragText?: string;
  /** 点击上传文本 */
  clickText?: string;
  /** 提示文本 */
  hintText?: string;
  /** 文件上传回调 */
  onUpload?: (files: File[]) => void;
  /** 文件删除回调 */
  onRemove?: (file: File, index: number) => void;
  /** 文件预览回调 */
  onPreview?: (file: File, index: number) => void;
  /** 上传进度回调 */
  onProgress?: (progress: number, file: File) => void;
  /** 上传成功回调 */
  onSuccess?: (response: any, file: File) => void;
  /** 上传失败回调 */
  onError?: (error: Error, file: File) => void;
  /** 自定义上传方法 */
  customUpload?: (file: File) => Promise<any>;
  /** 自定义文件列表渲染 */
  renderFileList?: (files: FileItem[]) => ReactNode;
  /** 自定义拖拽区域渲染 */
  renderDragArea?: () => ReactNode;
  /** 样式类名 */
  className?: string;
  /** 拖拽区域类名 */
  dragAreaClassName?: string;
  /** 文件列表类名 */
  fileListClassName?: string;
}

export interface FileItem {
  /** 文件对象 */
  file: File;
  /** 文件ID */
  id: string;
  /** 上传状态 */
  status: 'pending' | 'uploading' | 'success' | 'error';
  /** 上传进度 */
  progress: number;
  /** 错误信息 */
  error?: string;
  /** 预览URL */
  preview?: string;
  /** 服务器响应 */
  response?: any;
}

export interface DragDropAreaProps {
  /** 是否激活拖拽状态 */
  isDragActive: boolean;
  /** 是否拖拽悬停 */
  isDragOver: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 拖拽文本 */
  dragText?: string;
  /** 点击文本 */
  clickText?: string;
  /** 提示文本 */
  hintText?: string;
  /** 点击回调 */
  onClick: () => void;
  /** 拖拽进入回调 */
  onDragEnter: (e: React.DragEvent) => void;
  /** 拖拽离开回调 */
  onDragLeave: (e: React.DragEvent) => void;
  /** 拖拽悬停回调 */
  onDragOver: (e: React.DragEvent) => void;
  /** 拖拽放下回调 */
  onDrop: (e: React.DragEvent) => void;
  /** 自定义类名 */
  className?: string;
  /** 子组件 */
  children?: ReactNode;
}

export interface FileListProps {
  /** 文件列表 */
  files: FileItem[];
  /** 删除文件回调 */
  onRemove: (file: File, index: number) => void;
  /** 预览文件回调 */
  onPreview?: (file: File, index: number) => void;
  /** 重试上传回调 */
  onRetry?: (file: File, index: number) => void;
  /** 自定义类名 */
  className?: string;
}

export interface FilePreviewProps {
  /** 文件项 */
  file: FileItem;
  /** 文件索引 */
  index: number;
  /** 删除回调 */
  onRemove: (file: File, index: number) => void;
  /** 预览回调 */
  onPreview?: (file: File, index: number) => void;
  /** 重试回调 */
  onRetry?: (file: File, index: number) => void;
  /** 自定义类名 */
  className?: string;
}

export interface UploadOptions {
  /** 上传URL */
  action?: string;
  /** 请求方法 */
  method?: 'POST' | 'PUT';
  /** 请求头 */
  headers?: Record<string, string>;
  /** 额外数据 */
  data?: Record<string, any>;
  /** 文件字段名 */
  name?: string;
  /** 是否携带cookie */
  withCredentials?: boolean;
}

export interface UseFileUploadReturn {
  /** 文件列表 */
  files: FileItem[];
  /** 是否拖拽激活 */
  isDragActive: boolean;
  /** 是否拖拽悬停 */
  isDragOver: boolean;
  /** 添加文件 */
  addFiles: (newFiles: File[]) => void;
  /** 删除文件 */
  removeFile: (index: number) => void;
  /** 清空文件 */
  clearFiles: () => void;
  /** 上传文件 */
  uploadFile: (index: number) => void;
  /** 上传所有文件 */
  uploadAll: () => void;
  /** 重试上传 */
  retryUpload: (index: number) => void;
  /** 获取输入框属性 */
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  /** 获取拖拽区域属性 */
  getRootProps: () => React.HTMLAttributes<HTMLDivElement>;
} 