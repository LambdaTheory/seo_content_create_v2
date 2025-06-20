/**
 * 结构化数据模板管理组件
 * 提供模板的创建、编辑、删除和预览功能
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  StructuredDataTemplate,
  FieldConfig,
  StructuredDataMode,
} from '@/types/StructuredData.types';
import { SchemaGameType, ApplicationCategory } from '@/services/structuredData/schemaOrgStandards';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Settings,
  Tag,
  Code,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Database,
} from 'lucide-react';

/**
 * 模板管理器属性
 */
export interface TemplateManagerProps {
  onTemplateSelect?: (template: StructuredDataTemplate) => void;
  className?: string;
}

/**
 * 字段编辑器属性
 */
interface FieldEditorProps {
  field: FieldConfig;
  onChange: (field: FieldConfig) => void;
  onRemove: () => void;
}

/**
 * 字段编辑器组件
 */
const FieldEditor: React.FC<FieldEditorProps> = ({ field, onChange, onRemove }) => {
  const updateField = useCallback((updates: Partial<FieldConfig>) => {
    onChange({ ...field, ...updates });
  }, [field, onChange]);

  return (
    <Card className="p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">字段配置</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 基本信息 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            字段名称 *
          </label>
          <Input
            value={field.name}
            onChange={(e) => updateField({ name: e.target.value })}
            placeholder="字段名称"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            显示标签 *
          </label>
          <Input
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="显示标签"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            字段类型 *
          </label>
          <Select
            value={field.type}
            onValueChange={(value) => updateField({ type: value as any })}
          >
            <option value="string">字符串</option>
            <option value="number">数字</option>
            <option value="boolean">布尔值</option>
            <option value="array">数组</option>
            <option value="object">对象</option>
            <option value="date">日期</option>
            <option value="url">URL</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schema属性 *
          </label>
          <Input
            value={field.schemaProperty}
            onChange={(e) => updateField({ schemaProperty: e.target.value })}
            placeholder="Schema.org属性名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SEO权重 (0-10)
          </label>
          <Input
            type="number"
            min="0"
            max="10"
            value={field.seoWeight}
            onChange={(e) => updateField({ seoWeight: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            是否必填
          </label>
          <Switch
            checked={field.required}
            onCheckedChange={(checked) => updateField({ required: checked })}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          字段描述
        </label>
        <Textarea
          value={field.description}
          onChange={(e) => updateField({ description: e.target.value })}
          placeholder="字段用途和说明"
          rows={2}
        />
      </div>

      {/* 映射配置 */}
      {field.mapping && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">数据映射</h5>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                源字段
              </label>
              <Input
                value={field.mapping.sourceField}
                onChange={(e) => updateField({
                  mapping: { ...field.mapping!, sourceField: e.target.value }
                })}
                placeholder="源数据字段名"
                size="sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                转换函数
              </label>
              <Input
                value={field.mapping.transformer || ''}
                onChange={(e) => updateField({
                  mapping: { ...field.mapping!, transformer: e.target.value }
                })}
                placeholder="转换函数名"
                size="sm"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

/**
 * 模板管理器组件
 */
export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onTemplateSelect,
  className = '',
}) => {
  // 状态管理
  const [templates, setTemplates] = useState<StructuredDataTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<StructuredDataTemplate | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<StructuredDataTemplate>>({});

  // 初始化
  useEffect(() => {
    loadTemplates();
  }, []);

  /**
   * 加载模板列表
   */
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/structured-data/templates');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 创建新模板
   */
  const handleCreateTemplate = useCallback(() => {
    setEditingTemplate({
      name: '',
      description: '',
      schemaType: SchemaGameType.VideoGame,
      mode: StructuredDataMode.CUSTOM,
      fields: [],
      config: {},
      tags: [],
      category: '自定义',
    });
    setIsCreateMode(true);
    setIsEditMode(true);
  }, []);

  /**
   * 编辑模板
   */
  const handleEditTemplate = useCallback((template: StructuredDataTemplate) => {
    if (template.isBuiltIn) {
      alert('内置模板不能编辑，但可以复制后修改');
      return;
    }
    setEditingTemplate(template);
    setIsEditMode(true);
    setIsCreateMode(false);
  }, []);

  /**
   * 复制模板
   */
  const handleCopyTemplate = useCallback((template: StructuredDataTemplate) => {
    setEditingTemplate({
      ...template,
      id: undefined,
      name: `${template.name} (副本)`,
      isBuiltIn: false,
      usage: { count: 0, lastUsed: new Date().toISOString() },
    });
    setIsCreateMode(true);
    setIsEditMode(true);
  }, []);

  /**
   * 删除模板
   */
  const handleDeleteTemplate = useCallback(async (template: StructuredDataTemplate) => {
    if (template.isBuiltIn) {
      alert('内置模板不能删除');
      return;
    }

    if (!confirm(`确定要删除模板 "${template.name}" 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/structured-data/templates?id=${template.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await loadTemplates();
        alert('模板删除成功');
      } else {
        alert('删除失败: ' + result.error?.message);
      }
    } catch (error) {
      console.error('Delete template error:', error);
      alert('删除失败');
    }
  }, [loadTemplates]);

  /**
   * 保存模板
   */
  const handleSaveTemplate = useCallback(async () => {
    if (!editingTemplate.name || !editingTemplate.fields || editingTemplate.fields.length === 0) {
      alert('请填写模板名称和至少一个字段');
      return;
    }

    try {
      const url = isCreateMode 
        ? '/api/structured-data/templates'
        : `/api/structured-data/templates?id=${editingTemplate.id}`;
      
      const method = isCreateMode ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTemplate),
      });

      const result = await response.json();
      if (result.success) {
        await loadTemplates();
        setIsEditMode(false);
        setIsCreateMode(false);
        setEditingTemplate({});
        alert(isCreateMode ? '模板创建成功' : '模板更新成功');
      } else {
        alert('保存失败: ' + result.error?.message);
      }
    } catch (error) {
      console.error('Save template error:', error);
      alert('保存失败');
    }
  }, [editingTemplate, isCreateMode, loadTemplates]);

  /**
   * 添加新字段
   */
  const handleAddField = useCallback(() => {
    const newField: FieldConfig = {
      name: '',
      label: '',
      type: 'string',
      required: false,
      schemaProperty: '',
      seoWeight: 5,
      description: '',
    };

    setEditingTemplate(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }));
  }, []);

  /**
   * 更新字段
   */
  const handleUpdateField = useCallback((index: number, field: FieldConfig) => {
    setEditingTemplate(prev => ({
      ...prev,
      fields: prev.fields?.map((f, i) => i === index ? field : f) || [],
    }));
  }, []);

  /**
   * 删除字段
   */
  const handleRemoveField = useCallback((index: number) => {
    setEditingTemplate(prev => ({
      ...prev,
      fields: prev.fields?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  /**
   * 预览模板
   */
  const handlePreviewTemplate = useCallback((template: StructuredDataTemplate) => {
    setSelectedTemplate(template);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">加载模板中...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">模板管理</h2>
          <p className="text-gray-600 mt-1">
            管理结构化数据生成模板，创建自定义字段配置
          </p>
        </div>
        <Button
          onClick={handleCreateTemplate}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新建模板
        </Button>
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              </div>
              {template.isBuiltIn && (
                <Badge variant="secondary" className="text-xs">
                  内置
                </Badge>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Schema类型:</span>
                <Badge variant="outline">{template.schemaType}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">字段数量:</span>
                <span className="font-medium">{template.fields.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">使用次数:</span>
                <span className="font-medium">{template.usage.count}</span>
              </div>
            </div>

            {/* 标签 */}
            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreviewTemplate(template)}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                预览
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyTemplate(template)}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                复制
              </Button>
              {!template.isBuiltIn && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    删除
                  </Button>
                </>
              )}
              {onTemplateSelect && (
                <Button
                  size="sm"
                  onClick={() => onTemplateSelect(template)}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  选择
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 编辑模板模态框 */}
      <Modal
        isOpen={isEditMode}
        onClose={() => {
          setIsEditMode(false);
          setIsCreateMode(false);
          setEditingTemplate({});
        }}
        title={isCreateMode ? '创建新模板' : '编辑模板'}
        className="max-w-6xl"
      >
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模板名称 *
              </label>
              <Input
                value={editingTemplate.name || ''}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入模板名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schema类型 *
              </label>
              <Select
                value={editingTemplate.schemaType || SchemaGameType.VideoGame}
                onValueChange={(value) => setEditingTemplate(prev => ({ 
                  ...prev, 
                  schemaType: value as SchemaGameType 
                }))}
              >
                <option value={SchemaGameType.VideoGame}>VideoGame</option>
                <option value={SchemaGameType.Game}>Game</option>
                <option value={SchemaGameType.SoftwareApplication}>SoftwareApplication</option>
                <option value={SchemaGameType.VideoGameSeries}>VideoGameSeries</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模板描述
            </label>
            <Textarea
              value={editingTemplate.description || ''}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="描述模板的用途和特点"
              rows={3}
            />
          </div>

          {/* 字段配置 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">字段配置</h3>
              <Button
                onClick={handleAddField}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                添加字段
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(editingTemplate.fields || []).map((field, index) => (
                <FieldEditor
                  key={index}
                  field={field}
                  onChange={(updatedField) => handleUpdateField(index, updatedField)}
                  onRemove={() => handleRemoveField(index)}
                />
              ))}
              
              {(!editingTemplate.fields || editingTemplate.fields.length === 0) && (
                <Card className="p-8 text-center text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>暂无字段配置</p>
                  <p className="text-sm mt-1">点击"添加字段"开始创建</p>
                </Card>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditMode(false);
                setIsCreateMode(false);
                setEditingTemplate({});
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!editingTemplate.name || !editingTemplate.fields?.length}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isCreateMode ? '创建模板' : '保存更改'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 预览模板模态框 */}
      <Modal
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title="模板预览"
        className="max-w-4xl"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            {/* 模板信息 */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-600">模板名称:</span>
                <p className="font-medium">{selectedTemplate.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Schema类型:</span>
                <p className="font-medium">{selectedTemplate.schemaType}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">生成模式:</span>
                <p className="font-medium">{selectedTemplate.mode}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">字段数量:</span>
                <p className="font-medium">{selectedTemplate.fields.length}</p>
              </div>
            </div>

            {/* 字段列表 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">字段配置</h3>
              <div className="space-y-3">
                {selectedTemplate.fields.map((field, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{field.label}</h4>
                      <div className="flex items-center gap-2">
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">必填</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{field.type}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          权重: {field.seoWeight}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Schema属性: <code className="bg-gray-100 px-1 rounded">{field.schemaProperty}</code>
                    </p>
                    {field.description && (
                      <p className="text-sm text-gray-600">{field.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleCopyTemplate(selectedTemplate)}
              >
                复制模板
              </Button>
              {onTemplateSelect && (
                <Button
                  onClick={() => {
                    onTemplateSelect(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                >
                  选择此模板
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}; 