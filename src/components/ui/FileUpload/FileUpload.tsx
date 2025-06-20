import React, { useCallback, useRef, useState, useId } from 'react';
import { 
  FileUploadProps, 
  FileItem, 
  DragDropAreaProps, 
  FileListProps, 
  FilePreviewProps, 
  UseFileUploadReturn 
} from './FileUpload.types';
import { cn } from '@/utils/classNames';

/**
 * 文件上传Hook
 * @param props 上传配置选项
 * @returns 文件上传相关状态和方法
 */
export const useFileUpload = (props: Partial<FileUploadProps> = {}): UseFileUploadReturn => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 5,
    multiple = false,
    accept = '*',
    onUpload,
    onProgress,
    onSuccess,
    onError,
    customUpload
  } = props;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证文件
  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `文件大小不能超过 ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }

    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const fileType = file.type;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return type === fileExtension;
        } else if (type.includes('/*')) {
          return fileType.startsWith(type.replace('/*', ''));
        } else {
          return type === fileType;
        }
      });

      if (!isAccepted) {
        return `不支持的文件类型，仅支持：${accept}`;
      }
    }

    return null;
  };

  // 添加文件
  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: FileItem[] = [];
    
    newFiles.forEach(file => {
      // 检查文件数量限制
      if (files.length + validFiles.length >= maxFiles) {
        return;
      }

      // 检查是否已存在
      const exists = files.some(f => f.file.name === file.name && f.file.size === file.size);
      if (exists) {
        return;
      }

      // 验证文件
      const error = validateFile(file);
      
      const fileItem: FileItem = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };

      validFiles.push(fileItem);
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      onUpload?.(validFiles.map(f => f.file));
    }
  }, [files, maxFiles, maxSize, accept, onUpload]);

  // 删除文件
  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];
      
      // 清理预览URL
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  // 清空文件
  const clearFiles = useCallback(() => {
    files.forEach(fileItem => {
      if (fileItem.preview) {
        URL.revokeObjectURL(fileItem.preview);
      }
    });
    setFiles([]);
  }, [files]);

  // 上传单个文件
  const uploadFile = useCallback(async (index: number) => {
    const fileItem = files[index];
    if (!fileItem || fileItem.status === 'uploading') return;

    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading', progress: 0 } : f
    ));

    try {
      if (customUpload) {
        const response = await customUpload(fileItem.file);
        
        setFiles(prev => prev.map((f, i) => 
          i === index ? { 
            ...f, 
            status: 'success', 
            progress: 100, 
            response 
          } : f
        ));

        onSuccess?.(response, fileItem.file);
      } else {
        // 模拟上传进度
        const simulateProgress = () => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              
              setFiles(prev => prev.map((f, i) => 
                i === index ? { 
                  ...f, 
                  status: 'success', 
                  progress: 100,
                  response: { url: 'mock-url' }
                } : f
              ));

              onSuccess?.({ url: 'mock-url' }, fileItem.file);
            } else {
              setFiles(prev => prev.map((f, i) => 
                i === index ? { ...f, progress } : f
              ));
              onProgress?.(progress, fileItem.file);
            }
          }, 200);
        };

        simulateProgress();
      }
    } catch (error) {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : '上传失败'
        } : f
      ));

      onError?.(error instanceof Error ? error : new Error('上传失败'), fileItem.file);
    }
  }, [files, customUpload, onProgress, onSuccess, onError]);

  // 上传所有文件
  const uploadAll = useCallback(() => {
    files.forEach((_, index) => {
      if (files[index].status === 'pending' || files[index].status === 'error') {
        uploadFile(index);
      }
    });
  }, [files, uploadFile]);

  // 重试上传
  const retryUpload = useCallback((index: number) => {
    uploadFile(index);
  }, [uploadFile]);

  // 处理文件选择
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const fileArray = Array.from(selectedFiles);
    if (!multiple && fileArray.length > 1) {
      addFiles([fileArray[0]]);
    } else {
      addFiles(fileArray);
    }
  }, [multiple, addFiles]);

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragActive(false);
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  // 获取输入框属性
  const getInputProps = useCallback((): React.InputHTMLAttributes<HTMLInputElement> => ({
    type: 'file',
    ref: fileInputRef,
    accept,
    multiple,
    onChange: (e) => handleFileSelect(e.target.files),
    style: { display: 'none' }
  }), [accept, multiple, handleFileSelect]);

  // 获取拖拽区域属性
  const getRootProps = useCallback((): React.HTMLAttributes<HTMLDivElement> => ({
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onClick: () => fileInputRef.current?.click()
  }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return {
    files,
    isDragActive,
    isDragOver,
    addFiles,
    removeFile,
    clearFiles,
    uploadFile,
    uploadAll,
    retryUpload,
    getInputProps,
    getRootProps
  };
};

/**
 * 拖拽上传区域组件
 */
export const DragDropArea: React.FC<DragDropAreaProps> = ({
  isDragActive,
  isDragOver,
  disabled = false,
  dragText = '拖拽文件到此处',
  clickText = '或点击选择文件',
  hintText = '支持单个或批量上传',
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  className,
  children
}) => {
  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer',
        {
          'border-primary-400 bg-primary-50 text-primary-600': isDragOver && !disabled,
          'border-primary-300 bg-primary-25': isDragActive && !disabled,
          'border-gray-300 text-gray-500 hover:border-gray-400': !isDragActive && !disabled,
          'border-gray-200 text-gray-400 cursor-not-allowed': disabled,
        },
        className
      )}
      onClick={disabled ? undefined : onClick}
      onDragEnter={disabled ? undefined : onDragEnter}
      onDragLeave={disabled ? undefined : onDragLeave}
      onDragOver={disabled ? undefined : onDragOver}
      onDrop={disabled ? undefined : onDrop}
    >
      {children || (
        <div className="space-y-2">
          <div className="flex justify-center">
            <svg
              className={cn(
                'w-12 h-12',
                isDragOver ? 'text-primary-500' : 'text-gray-400'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div className="text-lg font-medium">{dragText}</div>
          <div className="text-sm">{clickText}</div>
          <div className="text-xs text-gray-400">{hintText}</div>
        </div>
      )}
    </div>
  );
};

/**
 * 文件预览组件
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  index,
  onRemove,
  onPreview,
  onRetry,
  className
}) => {
  const { file: fileObj, status, progress, error, preview } = file;

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'uploading':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('border rounded-lg p-4', getStatusColor(), className)}>
      <div className="flex items-start space-x-3">
        {/* 文件图标或预览 */}
        <div className="flex-shrink-0">
          {preview ? (
            <img
              src={preview}
              alt={fileObj.name}
              className="w-12 h-12 object-cover rounded cursor-pointer"
              onClick={() => onPreview?.(fileObj, index)}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {fileObj.name}
            </p>
            <button
              onClick={() => onRemove(fileObj, index)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {formatFileSize(fileObj.size)}
          </p>

          {/* 进度条 */}
          {status === 'uploading' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>上传中...</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 状态信息 */}
          {status === 'success' && (
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              上传成功
            </p>
          )}

          {status === 'error' && (
            <div className="mt-1">
              <p className="text-xs text-red-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
              {onRetry && (
                <button
                  onClick={() => onRetry(fileObj, index)}
                  className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                >
                  重试上传
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 文件列表组件
 */
export const FileList: React.FC<FileListProps> = ({
  files,
  onRemove,
  onPreview,
  onRetry,
  className
}) => {
  if (files.length === 0) return null;

  return (
    <div className={cn('mt-4 space-y-2', className)}>
      {files.map((file, index) => (
        <FilePreview
          key={file.id}
          file={file}
          index={index}
          onRemove={onRemove}
          onPreview={onPreview}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
};

/**
 * 文件上传组件
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled = false,
  dragText,
  clickText,
  hintText,
  onUpload,
  onRemove,
  onPreview,
  onProgress,
  onSuccess,
  onError,
  customUpload,
  renderFileList,
  renderDragArea,
  className,
  dragAreaClassName,
  fileListClassName
}) => {
  const fileUpload = useFileUpload({
    accept,
    multiple,
    maxSize,
    maxFiles,
    onUpload,
    onProgress,
    onSuccess,
    onError,
    customUpload
  });

  const {
    files,
    isDragActive,
    isDragOver,
    removeFile,
    retryUpload,
    getInputProps,
    getRootProps
  } = fileUpload;

  const inputId = useId();

  const handleRemove = (file: File, index: number) => {
    removeFile(index);
    onRemove?.(file, index);
  };

  const handlePreview = (file: File, index: number) => {
    onPreview?.(file, index);
  };

  const handleRetry = (file: File, index: number) => {
    retryUpload(index);
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 隐藏的文件输入 */}
      <input {...getInputProps()} id={inputId} />

      {/* 拖拽上传区域 */}
      <div {...getRootProps()} className={dragAreaClassName}>
        {renderDragArea ? (
          renderDragArea()
        ) : (
          <DragDropArea
            isDragActive={isDragActive}
            isDragOver={isDragOver}
            disabled={disabled}
            dragText={dragText}
            clickText={clickText}
            hintText={hintText}
            onClick={() => {}}
            onDragEnter={() => {}}
            onDragLeave={() => {}}
            onDragOver={() => {}}
            onDrop={() => {}}
          />
        )}
      </div>

      {/* 文件列表 */}
      {renderFileList ? (
        renderFileList(files)
      ) : (
        <FileList
          files={files}
          onRemove={handleRemove}
          onPreview={handlePreview}
          onRetry={handleRetry}
          className={fileListClassName}
        />
      )}
    </div>
  );
};

export default FileUpload;
 