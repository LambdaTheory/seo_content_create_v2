/**
 * 批量数据编辑组件 - 支持多行数据同时编辑
 * 
 * 功能特性：
 * - 多行选择和批量编辑
 * - 批量查找替换
 * - 数据转换规则应用
 * - 撤销/重做操作
 * - 实时预览编辑效果
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { GameData } from '@/types/GameData.types';
import { cn } from '@/utils/classNames';

/**
 * 批量编辑操作类型
 */
type BatchOperation = 
  | 'replace' // 查找替换
  | 'append'  // 追加内容
  | 'prepend' // 前置内容
  | 'clear'   // 清空字段
  | 'transform'; // 数据转换

/**
 * 批量编辑规则
 */
interface BatchEditRule {
  /** 规则ID */
  id: string;
  /** 操作类型 */
  operation: BatchOperation;
  /** 目标字段 */
  targetField: keyof GameData;
  /** 查找内容（替换操作用） */
  findValue?: string;
  /** 替换内容 */
  replaceValue?: string;
  /** 新值（其他操作用） */
  newValue?: string;
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否使用正则表达式 */
  useRegex?: boolean;
  /** 转换函数名称 */
  transformFunction?: string;
}

/**
 * 编辑历史记录
 */
interface EditHistory {
  /** 历史ID */
  id: string;
  /** 操作描述 */
  description: string;
  /** 操作前数据 */
  beforeData: GameData[];
  /** 操作后数据 */
  afterData: GameData[];
  /** 操作时间 */
  timestamp: Date;
}

/**
 * 批量数据编辑组件属性
 */
export interface BatchDataEditorProps {
  /** 数据列表 */
  data: GameData[];
  /** 数据更新回调 */
  onDataChange?: (data: GameData[]) => void;
  /** 是否显示预览 */
  showPreview?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 编辑器状态
 */
interface EditorState {
  /** 选中的行索引 */
  selectedRows: Set<number>;
  /** 当前编辑规则 */
  currentRule: Partial<BatchEditRule>;
  /** 是否显示批量编辑弹窗 */
  showBatchModal: boolean;
  /** 是否显示查找替换弹窗 */
  showReplaceModal: boolean;
  /** 是否显示历史记录弹窗 */
  showHistoryModal: boolean;
  /** 编辑历史 */
  history: EditHistory[];
  /** 当前历史位置 */
  historyIndex: number;
  /** 预览数据 */
  previewData: GameData[] | null;
}

/**
 * 数据转换函数映射
 */
const TRANSFORM_FUNCTIONS: Record<string, (value: string) => string> = {
  uppercase: (value: string) => value.toUpperCase(),
  lowercase: (value: string) => value.toLowerCase(),
  capitalize: (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
  trim: (value: string) => value.trim(),
  removeSpaces: (value: string) => value.replace(/\s+/g, ''),
  urlEncode: (value: string) => encodeURIComponent(value),
  urlDecode: (value: string) => decodeURIComponent(value),
  addHttps: (value: string) => value.startsWith('http') ? value : `https://${value}`,
  removeHtml: (value: string) => value.replace(/<[^>]*>/g, ''),
  slugify: (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').trim('-')
};

/**
 * 批量数据编辑组件
 */
export const BatchDataEditor: React.FC<BatchDataEditorProps> = ({
  data,
  onDataChange,
  showPreview = true,
  className = ''
}) => {
  // 状态管理
  const [state, setState] = useState<EditorState>({
    selectedRows: new Set(),
    currentRule: {},
    showBatchModal: false,
    showReplaceModal: false,
    showHistoryModal: false,
    history: [],
    historyIndex: -1,
    previewData: null
  });

  // 表格引用
  const tableRef = useRef<HTMLDivElement>(null);

  // 可编辑字段列表
  const editableFields: Array<{ key: keyof GameData; label: string }> = [
    { key: 'gameName', label: '游戏名称' },
    { key: 'mainKeyword', label: '主关键词' },
    { key: 'longTailKeywords', label: '长尾关键词' },
    { key: 'videoLink', label: '视频链接' },
    { key: 'internalLinks', label: '站内链接' },
    { key: 'competitorPages', label: '竞品页面' },
    { key: 'iconUrl', label: '游戏图标' },
    { key: 'realUrl', label: '游戏链接' }
  ];

  // 操作类型选项
  const operationOptions = [
    { value: 'replace', label: '查找替换' },
    { value: 'append', label: '追加内容' },
    { value: 'prepend', label: '前置内容' },
    { value: 'clear', label: '清空字段' },
    { value: 'transform', label: '数据转换' }
  ];

  // 转换函数选项
  const transformOptions = Object.keys(TRANSFORM_FUNCTIONS).map(key => ({
    value: key,
    label: key
  }));

  // 执行批量操作
  const executeBatchOperation = useCallback((rule: BatchEditRule, targetData?: GameData[]) => {
    const workingData = targetData || data;
    const affectedRows = state.selectedRows.size > 0 
      ? Array.from(state.selectedRows) 
      : workingData.map((_, index) => index);

    const newData = workingData.map((row, index) => {
      if (!affectedRows.includes(index)) return row;

      const fieldValue = String(row[rule.targetField] || '');
      let newValue = fieldValue;

      switch (rule.operation) {
        case 'replace':
          if (rule.findValue && rule.replaceValue !== undefined) {
            if (rule.useRegex) {
              const flags = rule.caseSensitive ? 'g' : 'gi';
              const regex = new RegExp(rule.findValue, flags);
              newValue = fieldValue.replace(regex, rule.replaceValue);
            } else {
              const searchValue = rule.caseSensitive ? rule.findValue : rule.findValue.toLowerCase();
              const targetValue = rule.caseSensitive ? fieldValue : fieldValue.toLowerCase();
              if (targetValue.includes(searchValue)) {
                newValue = rule.caseSensitive 
                  ? fieldValue.split(rule.findValue).join(rule.replaceValue)
                  : fieldValue.replace(new RegExp(escapeRegExp(rule.findValue), 'gi'), rule.replaceValue);
              }
            }
          }
          break;

        case 'append':
          newValue = fieldValue + (rule.newValue || '');
          break;

        case 'prepend':
          newValue = (rule.newValue || '') + fieldValue;
          break;

        case 'clear':
          newValue = '';
          break;

        case 'transform':
          if (rule.transformFunction && TRANSFORM_FUNCTIONS[rule.transformFunction]) {
            newValue = TRANSFORM_FUNCTIONS[rule.transformFunction](fieldValue);
          }
          break;
      }

      return {
        ...row,
        [rule.targetField]: newValue
      };
    });

    return newData;
  }, [data, state.selectedRows]);

  // 转义正则表达式特殊字符
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // 应用批量编辑
  const applyBatchEdit = useCallback(() => {
    if (!state.currentRule.operation || !state.currentRule.targetField) return;

    const rule = state.currentRule as BatchEditRule;
    const newData = executeBatchOperation(rule);

    // 添加到历史记录
    const historyEntry: EditHistory = {
      id: Date.now().toString(),
      description: `${getOperationLabel(rule.operation)} ${getFieldLabel(rule.targetField)}`,
      beforeData: [...data],
      afterData: newData,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      history: [...prev.history.slice(0, prev.historyIndex + 1), historyEntry],
      historyIndex: prev.historyIndex + 1,
      showBatchModal: false,
      showReplaceModal: false,
      currentRule: {},
      previewData: null
    }));

    onDataChange?.(newData);
  }, [state.currentRule, data, onDataChange, executeBatchOperation]);

  // 生成预览数据
  const generatePreview = useCallback(() => {
    if (!state.currentRule.operation || !state.currentRule.targetField) {
      setState(prev => ({ ...prev, previewData: null }));
      return;
    }

    const rule = state.currentRule as BatchEditRule;
    const previewData = executeBatchOperation(rule);
    setState(prev => ({ ...prev, previewData }));
  }, [state.currentRule, executeBatchOperation]);

  // 撤销操作
  const undo = useCallback(() => {
    if (state.historyIndex < 0) return;

    const historyEntry = state.history[state.historyIndex];
    setState(prev => ({ ...prev, historyIndex: prev.historyIndex - 1 }));
    onDataChange?.(historyEntry.beforeData);
  }, [state.history, state.historyIndex, onDataChange]);

  // 重做操作
  const redo = useCallback(() => {
    if (state.historyIndex >= state.history.length - 1) return;

    const historyEntry = state.history[state.historyIndex + 1];
    setState(prev => ({ ...prev, historyIndex: prev.historyIndex + 1 }));
    onDataChange?.(historyEntry.afterData);
  }, [state.history, state.historyIndex, onDataChange]);

  // 清空选择
  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedRows: new Set() }));
  }, []);

  // 全选
  const selectAll = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      selectedRows: new Set(data.map((_, index) => index)) 
    }));
  }, [data]);

  // 获取操作标签
  const getOperationLabel = (operation: BatchOperation): string => {
    const labels = {
      replace: '查找替换',
      append: '追加内容',
      prepend: '前置内容',
      clear: '清空字段',
      transform: '数据转换'
    };
    return labels[operation];
  };

  // 获取字段标签
  const getFieldLabel = (field: keyof GameData): string => {
    const field_ = editableFields.find(f => f.key === field);
    return field_?.label || String(field);
  };

  // 表格列定义
  const tableColumns = useMemo(() => {
    return [
      {
        key: 'select',
        title: (
          <input
            type="checkbox"
            checked={state.selectedRows.size === data.length && data.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                selectAll();
              } else {
                clearSelection();
              }
            }}
            className="rounded border-gray-300"
          />
        ),
        width: 50,
        render: (value: any, record: GameData, index: number) => (
          <input
            type="checkbox"
            checked={state.selectedRows.has(index)}
            onChange={(e) => {
              const newSelected = new Set(state.selectedRows);
              if (e.target.checked) {
                newSelected.add(index);
              } else {
                newSelected.delete(index);
              }
              setState(prev => ({ ...prev, selectedRows: newSelected }));
            }}
            className="rounded border-gray-300"
          />
        )
      },
      {
        key: 'index',
        title: '行号',
        width: 60,
        render: (value: any, record: GameData, index: number) => (
          <span className="text-gray-500">{index + 1}</span>
        )
      },
      ...editableFields.map(field => ({
        key: field.key,
        title: field.label,
        render: (value: any, record: GameData, index: number) => {
          const displayValue = String(record[field.key] || '');
          const previewValue = state.previewData 
            ? String(state.previewData[index]?.[field.key] || '') 
            : null;
          
          const hasPreviewChange = previewValue !== null && previewValue !== displayValue;

          return (
            <div className="max-w-xs">
              <div className={cn(
                'truncate',
                hasPreviewChange && 'text-gray-400 line-through'
              )}>
                {displayValue || '-'}
              </div>
              {hasPreviewChange && (
                <div className="truncate text-blue-600 font-medium">
                  {previewValue}
                </div>
              )}
            </div>
          );
        }
      }))
    ];
  }, [data, state.selectedRows, state.previewData, editableFields]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 工具栏 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold">批量数据编辑</h3>
            {state.selectedRows.size > 0 && (
              <Badge variant="primary">
                已选择 {state.selectedRows.size} 行
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={state.historyIndex < 0}
            >
              撤销
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={state.historyIndex >= state.history.length - 1}
            >
              重做
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showHistoryModal: true }))}
            >
              历史记录
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, showReplaceModal: true }))}
          >
            查找替换
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, showBatchModal: true }))}
          >
            批量操作
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
          >
            全选
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            disabled={state.selectedRows.size === 0}
          >
            清空选择
          </Button>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card className="overflow-hidden">
        <div ref={tableRef} className="overflow-x-auto">
          <Table
            columns={tableColumns}
            data={data}
            className="min-w-full"
          />
        </div>
      </Card>

      {/* 查找替换弹窗 */}
      <Modal
        isOpen={state.showReplaceModal}
        onClose={() => setState(prev => ({ 
          ...prev, 
          showReplaceModal: false, 
          currentRule: {},
          previewData: null 
        }))}
        title="查找替换"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">目标字段</label>
            <Dropdown
              options={editableFields.map(field => ({ value: field.key, label: field.label }))}
              value={state.currentRule.targetField || ''}
              onChange={(value) => setState(prev => ({
                ...prev,
                currentRule: { ...prev.currentRule, targetField: value as keyof GameData, operation: 'replace' }
              }))}
              placeholder="选择字段"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">查找内容</label>
            <Input
              value={state.currentRule.findValue || ''}
              onChange={(e) => setState(prev => ({
                ...prev,
                currentRule: { ...prev.currentRule, findValue: e.target.value }
              }))}
              placeholder="输入要查找的内容"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">替换为</label>
            <Input
              value={state.currentRule.replaceValue || ''}
              onChange={(e) => setState(prev => ({
                ...prev,
                currentRule: { ...prev.currentRule, replaceValue: e.target.value }
              }))}
              placeholder="输入替换后的内容"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.currentRule.caseSensitive || false}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  currentRule: { ...prev.currentRule, caseSensitive: e.target.checked }
                }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">区分大小写</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.currentRule.useRegex || false}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  currentRule: { ...prev.currentRule, useRegex: e.target.checked }
                }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">使用正则表达式</span>
            </label>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            {showPreview && (
              <Button
                variant="outline"
                onClick={generatePreview}
                disabled={!state.currentRule.targetField || !state.currentRule.findValue}
              >
                预览
              </Button>
            )}
            <Button
              variant="primary"
              onClick={applyBatchEdit}
              disabled={!state.currentRule.targetField || !state.currentRule.findValue}
            >
              应用替换
            </Button>
            <Button
              variant="ghost"
              onClick={() => setState(prev => ({ 
                ...prev, 
                showReplaceModal: false, 
                currentRule: {},
                previewData: null 
              }))}
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>

      {/* 批量操作弹窗 */}
      <Modal
        isOpen={state.showBatchModal}
        onClose={() => setState(prev => ({ 
          ...prev, 
          showBatchModal: false, 
          currentRule: {},
          previewData: null 
        }))}
        title="批量操作"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">操作类型</label>
            <Dropdown
              options={operationOptions}
              value={state.currentRule.operation || ''}
              onChange={(value) => setState(prev => ({
                ...prev,
                currentRule: { ...prev.currentRule, operation: value as BatchOperation }
              }))}
              placeholder="选择操作类型"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">目标字段</label>
            <Dropdown
              options={editableFields.map(field => ({ value: field.key, label: field.label }))}
              value={state.currentRule.targetField || ''}
              onChange={(value) => setState(prev => ({
                ...prev,
                currentRule: { ...prev.currentRule, targetField: value as keyof GameData }
              }))}
              placeholder="选择字段"
            />
          </div>

          {state.currentRule.operation === 'transform' && (
            <div>
              <label className="block text-sm font-medium mb-1">转换函数</label>
              <Dropdown
                options={transformOptions}
                value={state.currentRule.transformFunction || ''}
                onChange={(value) => setState(prev => ({
                  ...prev,
                  currentRule: { ...prev.currentRule, transformFunction: value }
                }))}
                placeholder="选择转换函数"
              />
            </div>
          )}

          {(state.currentRule.operation === 'append' || 
            state.currentRule.operation === 'prepend') && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {state.currentRule.operation === 'append' ? '追加内容' : '前置内容'}
              </label>
              <Input
                value={state.currentRule.newValue || ''}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  currentRule: { ...prev.currentRule, newValue: e.target.value }
                }))}
                placeholder="输入内容"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t">
            {showPreview && (
              <Button
                variant="outline"
                onClick={generatePreview}
                disabled={!state.currentRule.operation || !state.currentRule.targetField}
              >
                预览
              </Button>
            )}
            <Button
              variant="primary"
              onClick={applyBatchEdit}
              disabled={!state.currentRule.operation || !state.currentRule.targetField}
            >
              应用操作
            </Button>
            <Button
              variant="ghost"
              onClick={() => setState(prev => ({ 
                ...prev, 
                showBatchModal: false, 
                currentRule: {},
                previewData: null 
              }))}
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>

      {/* 历史记录弹窗 */}
      <Modal
        isOpen={state.showHistoryModal}
        onClose={() => setState(prev => ({ ...prev, showHistoryModal: false }))}
        title="编辑历史"
        size="lg"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {state.history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无编辑历史</p>
          ) : (
            state.history.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer hover:bg-gray-50',
                  index === state.historyIndex ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                )}
                onClick={() => {
                  setState(prev => ({ ...prev, historyIndex: index }));
                  onDataChange?.(entry.afterData);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{entry.description}</span>
                  <span className="text-sm text-gray-500">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  影响 {entry.afterData.length} 行数据
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BatchDataEditor; 