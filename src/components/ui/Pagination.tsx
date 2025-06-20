/**
 * 分页组件
 * 
 * 功能特性：
 * - 页码导航
 * - 页面大小选择
 * - 快速跳转
 * - 统计信息显示
 * - 响应式设计
 */

import React, { useMemo, useCallback } from 'react';
import { Button } from './Button';
import { cn } from '@/utils/classNames';

/**
 * 分页组件属性
 */
export interface PaginationProps {
  /** 当前页码（从1开始） */
  current: number;
  /** 每页数据量 */
  pageSize: number;
  /** 总数据量 */
  total: number;
  /** 显示的页码按钮数量 */
  showSizeChanger?: boolean;
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
  /** 是否显示总数信息 */
  showTotal?: boolean;
  /** 可选的页面大小选项 */
  pageSizeOptions?: number[];
  /** 页码变化回调 */
  onChange?: (page: number, pageSize: number) => void;
  /** 页面大小变化回调 */
  onShowSizeChange?: (current: number, size: number) => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 分页组件
 */
export const Pagination: React.FC<PaginationProps> = ({
  current,
  pageSize,
  total,
  showSizeChanger = true,
  showQuickJumper = false,
  showTotal = true,
  pageSizeOptions = [10, 20, 50, 100],
  onChange,
  onShowSizeChange,
  className = '',
  disabled = false
}) => {
  // 计算总页数
  const totalPages = useMemo(() => {
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  // 计算显示的页码范围
  const pageRange = useMemo(() => {
    const delta = 2; // 当前页前后显示的页码数
    const range = [];
    
    // 开始页码
    const start = Math.max(1, current - delta);
    // 结束页码
    const end = Math.min(totalPages, current + delta);

    // 如果开始页码大于1，添加第一页和省略号
    if (start > 1) {
      range.push(1);
      if (start > 2) {
        range.push('...');
      }
    }

    // 添加中间页码
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // 如果结束页码小于总页数，添加省略号和最后一页
    if (end < totalPages) {
      if (end < totalPages - 1) {
        range.push('...');
      }
      range.push(totalPages);
    }

    return range;
  }, [current, totalPages]);

  // 计算当前显示的数据范围
  const dataRange = useMemo(() => {
    const start = (current - 1) * pageSize + 1;
    const end = Math.min(current * pageSize, total);
    return { start, end };
  }, [current, pageSize, total]);

  // 页码变化处理
  const handlePageChange = useCallback((page: number) => {
    if (page === current || page < 1 || page > totalPages || disabled) {
      return;
    }
    onChange?.(page, pageSize);
  }, [current, totalPages, pageSize, onChange, disabled]);

  // 页面大小变化处理
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    if (newPageSize === pageSize || disabled) {
      return;
    }
    
    // 计算新的页码，保持当前数据位置尽可能不变
    const newCurrent = Math.ceil(((current - 1) * pageSize + 1) / newPageSize);
    
    onShowSizeChange?.(newCurrent, newPageSize);
    onChange?.(newCurrent, newPageSize);
  }, [current, pageSize, onChange, onShowSizeChange, disabled]);

  // 快速跳转处理
  const handleQuickJump = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled) {
      const target = e.target as HTMLInputElement;
      const page = parseInt(target.value, 10);
      
      if (!isNaN(page)) {
        handlePageChange(Math.max(1, Math.min(page, totalPages)));
        target.value = '';
      }
    }
  }, [handlePageChange, totalPages, disabled]);

  // 如果总数为0或只有一页，不显示分页
  if (total === 0 || totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center justify-between gap-4 py-3 px-4 border-t border-gray-200',
      disabled && 'opacity-50 pointer-events-none',
      className
    )}>
      {/* 统计信息 */}
      {showTotal && (
        <div className="text-sm text-gray-600">
          显示第 {dataRange.start}-{dataRange.end} 条，共 {total} 条
        </div>
      )}

      {/* 分页控件 */}
      <div className="flex items-center gap-2">
        {/* 页面大小选择器 */}
        {showSizeChanger && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">每页</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">条</span>
          </div>
        )}

        {/* 上一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current - 1)}
          disabled={current <= 1 || disabled}
        >
          上一页
        </Button>

        {/* 页码按钮 */}
        <div className="flex items-center gap-1">
          {pageRange.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-gray-500"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === current;

            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                disabled={disabled}
                className={cn(
                  'px-3 py-1 text-sm border rounded transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* 下一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current + 1)}
          disabled={current >= totalPages || disabled}
        >
          下一页
        </Button>

        {/* 快速跳转 */}
        {showQuickJumper && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">跳至</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder="页码"
              onKeyPress={handleQuickJump}
              disabled={disabled}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">页</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination; 