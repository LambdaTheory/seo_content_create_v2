/**
 * 数据排序筛选组件
 * 
 * 功能特性：
 * - 数据排序功能（升序、降序）
 * - 数据筛选功能（文本筛选、条件筛选）
 * - 多字段组合筛选
 * - 筛选条件管理
 * - 搜索功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GameData } from '@/types/GameData.types';
import { cn } from '@/utils/classNames';

/**
 * 排序方向
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * 排序配置
 */
export interface SortConfig {
  /** 排序字段 */
  field: keyof GameData;
  /** 排序方向 */
  direction: SortDirection;
}

/**
 * 筛选条件类型
 */
export type FilterType = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'empty' | 'notEmpty';

/**
 * 筛选条件
 */
export interface FilterCondition {
  /** 筛选字段 */
  field: keyof GameData;
  /** 筛选类型 */
  type: FilterType;
  /** 筛选值 */
  value: string;
  /** 是否区分大小写 */
  caseSensitive?: boolean;
}

/**
 * 筛选配置
 */
export interface FilterConfig {
  /** 筛选条件列表 */
  conditions: FilterCondition[];
  /** 逻辑操作符 */
  operator: 'and' | 'or';
  /** 搜索关键词 */
  searchKeyword?: string;
  /** 搜索字段 */
  searchFields?: (keyof GameData)[];
}

/**
 * 数据排序筛选组件属性
 */
export interface DataSortFilterProps {
  /** 原始数据 */
  data: GameData[];
  /** 表格列配置 */
  columns: Array<{
    key: string;
    title: string;
    sortable?: boolean;
    filterable?: boolean;
  }>;
  /** 排序配置 */
  sortConfig?: SortConfig;
  /** 筛选配置 */
  filterConfig?: FilterConfig;
  /** 数据更新回调 */
  onDataChange?: (filteredData: GameData[], sortConfig: SortConfig, filterConfig: FilterConfig) => void;
  /** 排序变化回调 */
  onSortChange?: (sortConfig: SortConfig) => void;
  /** 筛选变化回调 */
  onFilterChange?: (filterConfig: FilterConfig) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 数据排序筛选组件
 */
export const DataSortFilter: React.FC<DataSortFilterProps> = ({
  data,
  columns,
  sortConfig: initialSortConfig,
  filterConfig: initialFilterConfig,
  onDataChange,
  onSortChange,
  onFilterChange,
  className = ''
}) => {
  // 排序状态
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    initialSortConfig || { field: 'gameName', direction: null }
  );

  // 筛选状态
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(
    initialFilterConfig || {
      conditions: [],
      operator: 'and',
      searchKeyword: '',
      searchFields: ['gameName', 'mainKeyword']
    }
  );

  // 显示筛选条件编辑器
  const [showFilterEditor, setShowFilterEditor] = useState(false);

  // 新筛选条件状态
  const [newCondition, setNewCondition] = useState<Partial<FilterCondition>>({
    field: 'gameName',
    type: 'contains',
    value: '',
    caseSensitive: false
  });

  // 筛选类型选项
  const filterTypeOptions = [
    { value: 'contains', label: '包含' },
    { value: 'equals', label: '等于' },
    { value: 'startsWith', label: '开始于' },
    { value: 'endsWith', label: '结束于' },
    { value: 'empty', label: '为空' },
    { value: 'notEmpty', label: '不为空' }
  ];

  // 字段选项
  const fieldOptions = useMemo(() => {
    return columns
      .filter(col => col.filterable !== false)
      .map(col => ({
        value: col.key,
        label: col.title
      }));
  }, [columns]);

  // 数据排序
  const sortData = useCallback((data: GameData[], config: SortConfig): GameData[] => {
    if (!config.direction) return data;

    return [...data].sort((a, b) => {
      const aValue = a[config.field];
      const bValue = b[config.field];

      // 处理空值
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return config.direction === 'asc' ? -1 : 1;
      if (bValue == null) return config.direction === 'asc' ? 1 : -1;

      // 字符串比较
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return config.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // 数据筛选
  const filterData = useCallback((data: GameData[], config: FilterConfig): GameData[] => {
    let filteredData = data;

    // 搜索关键词筛选
    if (config.searchKeyword) {
      const keyword = config.searchKeyword.toLowerCase();
      filteredData = filteredData.filter(item => {
        return (config.searchFields || []).some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(keyword);
        });
      });
    }

    // 条件筛选
    if (config.conditions.length > 0) {
      filteredData = filteredData.filter(item => {
        const results = config.conditions.map(condition => {
          const value = item[condition.field];
          const compareValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
          const itemValue = condition.caseSensitive ? String(value || '') : String(value || '').toLowerCase();

          switch (condition.type) {
            case 'contains':
              return itemValue.includes(compareValue);
            case 'equals':
              return itemValue === compareValue;
            case 'startsWith':
              return itemValue.startsWith(compareValue);
            case 'endsWith':
              return itemValue.endsWith(compareValue);
            case 'empty':
              return !value || String(value).trim() === '';
            case 'notEmpty':
              return value && String(value).trim() !== '';
            default:
              return true;
          }
        });

        return config.operator === 'and' ? results.every(Boolean) : results.some(Boolean);
      });
    }

    return filteredData;
  }, []);

  // 应用排序和筛选
  const processedData = useMemo(() => {
    let result = filterData(data, filterConfig);
    result = sortData(result, sortConfig);
    return result;
  }, [data, sortConfig, filterConfig, sortData, filterData]);

  // 更新排序
  const handleSortChange = useCallback((field: keyof GameData) => {
    const newConfig: SortConfig = {
      field,
      direction: sortConfig.field === field 
        ? (sortConfig.direction === 'asc' ? 'desc' : sortConfig.direction === 'desc' ? null : 'asc')
        : 'asc'
    };

    setSortConfig(newConfig);
    onSortChange?.(newConfig);
    onDataChange?.(processedData, newConfig, filterConfig);
  }, [sortConfig, filterConfig, processedData, onSortChange, onDataChange]);

  // 更新搜索关键词
  const handleSearchChange = useCallback((keyword: string) => {
    const newConfig = {
      ...filterConfig,
      searchKeyword: keyword
    };

    setFilterConfig(newConfig);
    onFilterChange?.(newConfig);
  }, [filterConfig, onFilterChange]);

  // 添加筛选条件
  const addFilterCondition = useCallback(() => {
    if (!newCondition.field || !newCondition.type) return;

    const condition: FilterCondition = {
      field: newCondition.field as keyof GameData,
      type: newCondition.type,
      value: newCondition.value || '',
      caseSensitive: newCondition.caseSensitive || false
    };

    const newConfig = {
      ...filterConfig,
      conditions: [...filterConfig.conditions, condition]
    };

    setFilterConfig(newConfig);
    onFilterChange?.(newConfig);

    // 重置新条件
    setNewCondition({
      field: 'gameName',
      type: 'contains',
      value: '',
      caseSensitive: false
    });
  }, [newCondition, filterConfig, onFilterChange]);

  // 删除筛选条件
  const removeFilterCondition = useCallback((index: number) => {
    const newConfig = {
      ...filterConfig,
      conditions: filterConfig.conditions.filter((_, i) => i !== index)
    };

    setFilterConfig(newConfig);
    onFilterChange?.(newConfig);
  }, [filterConfig, onFilterChange]);

  // 清除所有筛选
  const clearAllFilters = useCallback(() => {
    const newConfig = {
      conditions: [],
      operator: 'and' as const,
      searchKeyword: '',
      searchFields: filterConfig.searchFields
    };

    setFilterConfig(newConfig);
    onFilterChange?.(newConfig);
  }, [filterConfig.searchFields, onFilterChange]);

  // 渲染排序图标
  const renderSortIcon = useCallback((field: keyof GameData) => {
    if (sortConfig.field !== field) {
      return <span className="text-gray-400">↕</span>;
    }

    switch (sortConfig.direction) {
      case 'asc':
        return <span className="text-blue-600">↑</span>;
      case 'desc':
        return <span className="text-blue-600">↓</span>;
      default:
        return <span className="text-gray-400">↕</span>;
    }
  }, [sortConfig]);

  // 触发数据变化
  React.useEffect(() => {
    onDataChange?.(processedData, sortConfig, filterConfig);
  }, [processedData, sortConfig, filterConfig, onDataChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 搜索和工具栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* 搜索框 */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="搜索游戏名称、关键词..."
              value={filterConfig.searchKeyword || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* 筛选按钮 */}
          <Button
            variant="outline"
            onClick={() => setShowFilterEditor(!showFilterEditor)}
            className={cn(
              filterConfig.conditions.length > 0 && 'border-blue-500 text-blue-600'
            )}
          >
            筛选 {filterConfig.conditions.length > 0 && `(${filterConfig.conditions.length})`}
          </Button>

          {/* 清除筛选 */}
          {(filterConfig.conditions.length > 0 || filterConfig.searchKeyword) && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="text-gray-500"
            >
              清除筛选
            </Button>
          )}
        </div>

        {/* 统计信息 */}
        <div className="text-sm text-gray-600">
          显示 {processedData.length} / {data.length} 条记录
        </div>
      </div>

      {/* 筛选条件编辑器 */}
      {showFilterEditor && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            {/* 现有筛选条件 */}
            {filterConfig.conditions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">筛选条件</h4>
                <div className="flex flex-wrap gap-2">
                  {filterConfig.conditions.map((condition, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <span>
                        {fieldOptions.find(f => f.value === condition.field)?.label} 
                        {' '}
                        {filterTypeOptions.find(t => t.value === condition.type)?.label}
                        {condition.type !== 'empty' && condition.type !== 'notEmpty' && ` "${condition.value}"`}
                      </span>
                      <button
                        onClick={() => removeFilterCondition(index)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 添加新筛选条件 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">添加筛选条件</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={newCondition.field || ''}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, field: e.target.value as keyof GameData }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fieldOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={newCondition.type || ''}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, type: e.target.value as FilterType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filterTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {newCondition.type !== 'empty' && newCondition.type !== 'notEmpty' && (
                  <Input
                    placeholder="筛选值"
                    value={newCondition.value || ''}
                    onChange={(e) => setNewCondition(prev => ({ ...prev, value: e.target.value }))}
                  />
                )}

                <Button
                  onClick={addFilterCondition}
                  disabled={!newCondition.field || !newCondition.type}
                >
                  添加
                </Button>
              </div>
            </div>

            {/* 逻辑操作符 */}
            {filterConfig.conditions.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">条件关系：</span>
                <select
                  value={filterConfig.operator}
                  onChange={(e) => setFilterConfig(prev => ({ ...prev, operator: e.target.value as 'and' | 'or' }))}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="and">且（AND）</option>
                  <option value="or">或（OR）</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 排序按钮 */}
      <div className="flex flex-wrap gap-2">
        {columns
          .filter(col => col.sortable !== false)
          .map(column => (
            <Button
              key={column.key}
              variant="outline"
              size="sm"
              onClick={() => handleSortChange(column.key as keyof GameData)}
              className={cn(
                'flex items-center gap-1',
                sortConfig.field === column.key && sortConfig.direction && 'border-blue-500 text-blue-600'
              )}
            >
              {column.title}
              {renderSortIcon(column.key as keyof GameData)}
            </Button>
          ))}
      </div>
    </div>
  );
};

export default DataSortFilter; 