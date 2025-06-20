/**
 * 工作流表单组件 - 用于创建和编辑工作流
 */

import React, { useState, useEffect } from 'react';
import { Workflow } from '@/types/Workflow.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/classNames';

/**
 * 工作流表单属性
 */
export interface WorkflowFormProps {
  /** 是否显示表单 */
  open: boolean;
  /** 关闭表单回调 */
  onClose: () => void;
  /** 提交表单回调 */
  onSubmit: (data: WorkflowFormData) => void | Promise<void>;
  /** 编辑的工作流数据 */
  workflow?: Workflow;
  /** 表单标题 */
  title?: string;
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 工作流表单数据
 */
export interface WorkflowFormData {
  name: string;
  description: string;
  prompt: string;
  gameDataFormat: string;
  structuredDataTypes: string[];
  status: 'active' | 'inactive' | 'draft';
  isDefault: boolean;
}

/**
 * 结构化数据类型选项
 */
const STRUCTURED_DATA_TYPES = [
  { value: 'videoGame', label: 'VideoGame (游戏信息)' },
  { value: 'videoObject', label: 'VideoObject (视频内容)' },
  { value: 'review', label: 'Review (用户评价)' },
  { value: 'breadcrumbList', label: 'BreadcrumbList (面包屑导航)' },
  { value: 'faqPage', label: 'FAQPage (常见问题)' },
  { value: 'article', label: 'Article (文章内容)' },
  { value: 'organization', label: 'Organization (组织信息)' },
  { value: 'website', label: 'WebSite (网站信息)' },
];

/**
 * 默认的Prompt模板
 */
const DEFAULT_PROMPT_TEMPLATE = `你是一个专业的SEO内容生成专家。请根据以下游戏数据生成高质量的SEO内容：

游戏数据：
{gameData}

请生成以下内容：
1. SEO标题 (50-60字符)
2. Meta描述 (150-160字符)  
3. H1标题
4. 内容摘要 (100-200字)
5. 关键词列表 (5-8个)

要求：
- 内容必须原创且有价值
- 自然融入关键词，避免堆砌
- 符合搜索引擎优化最佳实践
- 语言流畅，用户友好

输出格式为JSON：
{
  "title": "SEO标题",
  "metaDescription": "Meta描述",
  "h1": "H1标题", 
  "summary": "内容摘要",
  "keywords": ["关键词1", "关键词2", "..."]
}`;

/**
 * 默认的游戏数据格式
 */
const DEFAULT_GAME_DATA_FORMAT = `{
  "name": "游戏名称",
  "category": "游戏分类",
  "platform": "游戏平台",
  "description": "游戏描述",
  "url": "游戏链接",
  "imageUrl": "游戏图片",
  "metadata": {
    "developer": "开发商",
    "publisher": "发行商",
    "releaseDate": "发布日期",
    "tags": ["标签1", "标签2"]
  }
}`;

/**
 * 工作流表单组件
 */
export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  open,
  onClose,
  onSubmit,
  workflow,
  title,
  loading = false,
  error,
}) => {
  // 表单状态
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    prompt: DEFAULT_PROMPT_TEMPLATE,
    gameDataFormat: DEFAULT_GAME_DATA_FORMAT,
    structuredDataTypes: ['videoGame'],
    status: 'active',
    isDefault: false,
  });

  // 表单验证错误
  const [errors, setErrors] = useState<Partial<Record<keyof WorkflowFormData, string>>>({});

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      if (workflow) {
        // 编辑模式 - 填充现有数据
        setFormData({
          name: workflow.name,
          description: workflow.description || '',
          prompt: workflow.prompt,
          gameDataFormat: workflow.gameDataFormat || DEFAULT_GAME_DATA_FORMAT,
          structuredDataTypes: workflow.structuredDataTypes || ['videoGame'],
          status: workflow.status,
          isDefault: workflow.isDefault || false,
        });
      } else {
        // 创建模式 - 重置为默认值
        setFormData({
          name: '',
          description: '',
          prompt: DEFAULT_PROMPT_TEMPLATE,
          gameDataFormat: DEFAULT_GAME_DATA_FORMAT,
          structuredDataTypes: ['videoGame'],
          status: 'active',
          isDefault: false,
        });
      }
      setErrors({});
    }
  }, [open, workflow]);

  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WorkflowFormData, string>> = {};

    // 验证工作流名称
    if (!formData.name.trim()) {
      newErrors.name = '工作流名称不能为空';
    } else if (formData.name.length > 100) {
      newErrors.name = '工作流名称不能超过100个字符';
    }

    // 验证描述
    if (formData.description && formData.description.length > 500) {
      newErrors.description = '工作流描述不能超过500个字符';
    }

    // 验证Prompt模板
    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt模板不能为空';
    }

    // 验证游戏数据格式
    if (formData.gameDataFormat) {
      try {
        JSON.parse(formData.gameDataFormat);
      } catch {
        newErrors.gameDataFormat = '游戏数据格式必须是有效的JSON';
      }
    }

    // 验证结构化数据类型
    if (formData.structuredDataTypes.length === 0) {
      newErrors.structuredDataTypes = '至少选择一个结构化数据类型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // 错误处理由父组件负责
    }
  };

  /**
   * 处理输入变化
   */
  const handleInputChange = (field: keyof WorkflowFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * 处理结构化数据类型变化
   */
  const handleStructuredDataTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      handleInputChange('structuredDataTypes', [...formData.structuredDataTypes, type]);
    } else {
      handleInputChange('structuredDataTypes', formData.structuredDataTypes.filter(t => t !== type));
    }
  };

  const modalTitle = title || (workflow ? '编辑工作流' : '创建工作流');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* 错误信息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
            
            {/* 工作流名称 */}
            <Input
              label="工作流名称"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="请输入工作流名称"
              required
            />

            {/* 工作流描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工作流描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="请输入工作流描述（可选）"
                rows={3}
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                  'focus:ring-primary-500 focus:border-primary-500',
                  'placeholder-gray-400',
                  errors.description && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* 状态和默认选项 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="active">激活</option>
                  <option value="inactive">未激活</option>
                  <option value="draft">草稿</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                  设为默认工作流
                </label>
              </div>
            </div>
          </div>

          {/* Prompt模板 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Prompt模板</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt模板 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder="请输入Prompt模板"
                rows={8}
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm',
                  'focus:ring-primary-500 focus:border-primary-500',
                  'placeholder-gray-400',
                  errors.prompt && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
              />
              {errors.prompt && (
                <p className="mt-1 text-sm text-red-600">{errors.prompt}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                使用 {'{gameData}'} 作为游戏数据占位符
              </p>
            </div>
          </div>

          {/* 游戏数据格式 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">游戏数据格式</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JSON格式示例
              </label>
              <textarea
                value={formData.gameDataFormat}
                onChange={(e) => handleInputChange('gameDataFormat', e.target.value)}
                placeholder="请输入游戏数据的JSON格式"
                rows={6}
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm',
                  'focus:ring-primary-500 focus:border-primary-500',
                  'placeholder-gray-400',
                  errors.gameDataFormat && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
              />
              {errors.gameDataFormat && (
                <p className="mt-1 text-sm text-red-600">{errors.gameDataFormat}</p>
              )}
            </div>
          </div>

          {/* 结构化数据类型 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">结构化数据类型</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {STRUCTURED_DATA_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`type-${type.value}`}
                    checked={formData.structuredDataTypes.includes(type.value)}
                    onChange={(e) => handleStructuredDataTypeChange(type.value, e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label 
                    htmlFor={`type-${type.value}`} 
                    className="text-sm font-medium text-gray-700"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
            {errors.structuredDataTypes && (
              <p className="mt-1 text-sm text-red-600">{errors.structuredDataTypes}</p>
            )}
          </div>

          {/* 表单操作按钮 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {workflow ? '更新工作流' : '创建工作流'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default WorkflowForm; 