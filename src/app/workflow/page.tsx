/**
 * 工作流管理页面 - 工作流列表和管理界面
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { WorkflowForm, WorkflowFormData } from '@/components/forms/WorkflowForm';
import { Workflow, WorkflowStatus, StructuredDataType } from '@/types/Workflow.types';
import { WorkflowStorageService, WorkflowQueryOptions } from '@/services/workflowStorage';
import { cn } from '@/utils/classNames';

// 实例化工作流存储服务
const workflowStorage = new WorkflowStorageService();

/**
 * 工作流状态配置
 */
const STATUS_CONFIG = {
  active: { label: '激活', variant: 'success' as const, className: 'bg-green-100 text-green-800' },
  inactive: { label: '停用', variant: 'warning' as const, className: 'bg-yellow-100 text-yellow-800' },
  draft: { label: '草稿', variant: 'info' as const, className: 'bg-gray-100 text-gray-800' },
};

/**
 * 工作流管理页面组件
 */
export default function WorkflowPage() {
  // 状态管理
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 表单状态
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

  // Toast状态
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);

  /**
   * 显示Toast消息
   */
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  /**
   * 加载工作流数据
   */
  const loadWorkflows = () => {
    setLoading(true);
    
    const queryOptions: WorkflowQueryOptions = {
      sortBy,
      sortOrder,
      search: searchTerm || undefined,
      status: filterStatus === 'all' ? undefined : filterStatus as any,
    };

    const result = workflowStorage.getAll(queryOptions);
    
    if (result.success && result.data) {
      setWorkflows(result.data);
    } else {
      showToast(`加载工作流失败: ${result.error}`, 'error');
      setWorkflows([]);
    }
    
    setLoading(false);
  };

  // 初始加载和依赖变化时重新加载
  useEffect(() => {
    loadWorkflows();
  }, [searchTerm, filterStatus, sortBy, sortOrder]);

  /**
   * 处理创建工作流
   */
  const handleCreateWorkflow = async (formData: WorkflowFormData) => {
    setFormLoading(true);
    setFormError('');

    try {
      const result = workflowStorage.create({
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        gameDataFormat: formData.gameDataFormat,
        structuredDataTypes: formData.structuredDataTypes as StructuredDataType[],
        status: formData.status,
        isDefault: formData.isDefault,
      });

      if (result.success) {
        showToast('工作流创建成功', 'success');
        setShowCreateForm(false);
        loadWorkflows();
      } else {
        setFormError(result.error || '创建失败');
      }
    } catch (error) {
      setFormError('创建工作流时发生错误');
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * 处理编辑工作流
   */
  const handleEditWorkflow = async (formData: WorkflowFormData) => {
    if (!editingWorkflow) return;

    setFormLoading(true);
    setFormError('');

    try {
      const result = workflowStorage.update(editingWorkflow.id, {
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        gameDataFormat: formData.gameDataFormat,
        structuredDataTypes: formData.structuredDataTypes as StructuredDataType[],
        status: formData.status,
        isDefault: formData.isDefault,
      });

      if (result.success) {
        showToast('工作流更新成功', 'success');
        setShowEditForm(false);
        setEditingWorkflow(null);
        loadWorkflows();
      } else {
        setFormError(result.error || '更新失败');
      }
    } catch (error) {
      setFormError('更新工作流时发生错误');
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * 处理删除工作流
   */
  const handleDeleteWorkflow = () => {
    if (!deletingWorkflow) return;

    const result = workflowStorage.delete(deletingWorkflow.id);
    
    if (result.success) {
      showToast('工作流删除成功', 'success');
      loadWorkflows();
    } else {
      showToast(`删除失败: ${result.error}`, 'error');
    }

    setShowDeleteConfirm(false);
    setDeletingWorkflow(null);
  };

  /**
   * 处理复制工作流
   */
  const handleDuplicateWorkflow = (workflow: Workflow) => {
    const result = workflowStorage.duplicate(workflow.id);
    
    if (result.success) {
      showToast('工作流复制成功', 'success');
      loadWorkflows();
    } else {
      showToast(`复制失败: ${result.error}`, 'error');
    }
  };

  /**
   * 处理设置默认工作流
   */
  const handleSetDefault = (workflow: Workflow) => {
    const result = workflowStorage.setDefault(workflow.id);
    
    if (result.success) {
      showToast('默认工作流设置成功', 'success');
      loadWorkflows();
    } else {
      showToast(`设置失败: ${result.error}`, 'error');
    }
  };

  /**
   * 格式化时间
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 获取过滤后的工作流
   */
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = !searchTerm || 
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || workflow.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题栏 */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">工作流管理</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">创建和管理您的SEO内容生成工作流</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base w-full sm:w-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建工作流
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 搜索和筛选栏 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="搜索工作流名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 border-2 focus:border-blue-500 text-base"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 bg-white min-w-[120px]"
              >
                <option value="all">全部状态</option>
                <option value="active">激活</option>
                <option value="inactive">停用</option>
                <option value="draft">草稿</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 bg-white min-w-[120px]"
              >
                <option value="updatedAt-desc">最近更新</option>
                <option value="createdAt-desc">最近创建</option>
                <option value="name-asc">名称升序</option>
                <option value="name-desc">名称降序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 工作流列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-lg text-gray-600">加载中...</span>
            </div>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无工作流</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all' ? '没有符合条件的工作流' : '开始创建您的第一个工作流，快速生成高质量的SEO内容'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 font-semibold px-6 py-3"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                创建工作流
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 rounded-xl overflow-hidden bg-white"
              >
                <div className="p-6">
                  {/* 工作流标题和状态 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {workflow.name}
                        {workflow.isDefault && (
                          <Badge variant="success" className="ml-2 text-xs font-medium">
                            默认
                          </Badge>
                        )}
                      </h3>
                    </div>
                    <Badge 
                      variant={STATUS_CONFIG[workflow.status].variant}
                      className={cn("ml-2 flex-shrink-0 font-medium", STATUS_CONFIG[workflow.status].className)}
                    >
                      {STATUS_CONFIG[workflow.status].label}
                    </Badge>
                  </div>

                  {/* 工作流描述 */}
                  {workflow.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {workflow.description}
                    </p>
                  )}

                  {/* 结构化数据类型 */}
                  {workflow.structuredDataTypes && workflow.structuredDataTypes.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {workflow.structuredDataTypes.slice(0, 3).map((type) => (
                          <Badge key={type} variant="info" className="text-xs font-medium px-2 py-1">
                            {type}
                          </Badge>
                        ))}
                        {workflow.structuredDataTypes.length > 3 && (
                          <Badge variant="info" className="text-xs font-medium px-2 py-1">
                            +{workflow.structuredDataTypes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 时间信息 */}
                  <div className="text-xs text-gray-500 mb-5 space-y-1">
                    <div>创建：{formatDate(workflow.createdAt)}</div>
                    <div>更新：{formatDate(workflow.updatedAt)}</div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingWorkflow(workflow);
                        setShowEditForm(true);
                      }}
                      className="flex-1 min-w-0 border-2 font-medium"
                    >
                      编辑
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateWorkflow(workflow)}
                      className="px-3 font-medium"
                    >
                      复制
                    </Button>

                    {!workflow.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(workflow)}
                        className="px-3 font-medium"
                      >
                        设为默认
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setDeletingWorkflow(workflow);
                        setShowDeleteConfirm(true);
                      }}
                      className="px-3 font-medium"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 创建工作流表单 */}
      <WorkflowForm
        open={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setFormError('');
        }}
        onSubmit={handleCreateWorkflow}
        title="创建工作流"
        loading={formLoading}
        error={formError}
      />

      {/* 编辑工作流表单 */}
      <WorkflowForm
        open={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setEditingWorkflow(null);
          setFormError('');
        }}
        onSubmit={handleEditWorkflow}
        workflow={editingWorkflow || undefined}
        title="编辑工作流"
        loading={formLoading}
        error={formError}
      />

      {/* 删除确认对话框 */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingWorkflow(null);
        }}
        title="删除工作流"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            确定要删除工作流 "<strong>{deletingWorkflow?.name}</strong>" 吗？
          </p>
          <p className="text-sm text-gray-500 mb-6">
            此操作不可撤销，删除后数据将无法恢复。
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingWorkflow(null);
              }}
              className="font-medium"
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteWorkflow}
              className="font-medium"
            >
              确认删除
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast 通知 */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
} 