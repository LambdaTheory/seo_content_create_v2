/**
 * Workflow本地存储服务 - 提供Workflow的完整CRUD操作
 */

import { Workflow } from '@/types/Workflow.types';
import { localStorageService, LOCAL_STORAGE_KEYS, StorageResult } from './localStorage';

/**
 * Workflow存储操作结果
 */
export interface WorkflowStorageResult<T = any> extends StorageResult<T> {
  workflowId?: string;
}

/**
 * Workflow查询选项
 */
export interface WorkflowQueryOptions {
  status?: 'active' | 'inactive' | 'draft';
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Workflow存储统计
 */
export interface WorkflowStorageStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  storageUsed: number; // 字节
  lastUpdated: number;
}

/**
 * Workflow批量操作结果
 */
export interface WorkflowBatchResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: Array<{
    workflowId: string;
    error: string;
  }>;
}

/**
 * Workflow本地存储服务类
 */
export class WorkflowStorageService {
  private storageKey = LOCAL_STORAGE_KEYS.WORKFLOWS;

  /**
   * 获取所有Workflow数据
   */
  private getAllWorkflows(): StorageResult<Record<string, Workflow>> {
    const result = localStorageService.get<Record<string, Workflow>>(this.storageKey);
    if (!result.success) {
      // 如果没有数据，返回空对象
      if (result.error === '数据不存在') {
        return {
          success: true,
          data: {},
          timestamp: Date.now(),
        };
      }
    }
    return result;
  }

  /**
   * 保存所有Workflow数据
   */
  private saveAllWorkflows(workflows: Record<string, Workflow>): StorageResult<Record<string, Workflow>> {
    return localStorageService.set(this.storageKey, workflows);
  }

  /**
   * 生成新的Workflow ID
   */
  private generateId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证Workflow数据
   */
  private validateWorkflow(workflow: Partial<Workflow>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow.name || typeof workflow.name !== 'string' || workflow.name.trim().length === 0) {
      errors.push('工作流名称不能为空');
    }

    if (workflow.name && workflow.name.length > 100) {
      errors.push('工作流名称不能超过100个字符');
    }

    if (workflow.description && workflow.description.length > 500) {
      errors.push('工作流描述不能超过500个字符');
    }

    if (!workflow.prompt || typeof workflow.prompt !== 'string' || workflow.prompt.trim().length === 0) {
      errors.push('Prompt模板不能为空');
    }

    if (workflow.gameDataFormat && typeof workflow.gameDataFormat !== 'string') {
      errors.push('游戏数据格式必须是字符串');
    }

    if (workflow.structuredDataTypes && !Array.isArray(workflow.structuredDataTypes)) {
      errors.push('结构化数据类型必须是数组');
    }

    if (workflow.status && !['active', 'inactive', 'draft'].includes(workflow.status)) {
      errors.push('状态必须是 active、inactive 或 draft');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 创建新的Workflow
   */
  public create(workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): WorkflowStorageResult<Workflow> {
    try {
      // 验证数据
      const validation = this.validateWorkflow(workflowData);
      if (!validation.valid) {
        return {
          success: false,
          error: `数据验证失败: ${validation.errors.join(', ')}`,
        };
      }

      // 获取现有数据
      const allWorkflowsResult = this.getAllWorkflows();
      if (!allWorkflowsResult.success) {
        return {
          success: false,
          error: `获取现有数据失败: ${allWorkflowsResult.error}`,
        };
      }

      const allWorkflows = allWorkflowsResult.data!;

      // 检查名称是否重复
      const existingNames = Object.values(allWorkflows).map(w => w.name.toLowerCase());
      if (existingNames.includes(workflowData.name.toLowerCase())) {
        return {
          success: false,
          error: '工作流名称已存在',
        };
      }

      // 创建新的Workflow
      const now = Date.now();
      const newWorkflow: Workflow = {
        id: this.generateId(),
        name: workflowData.name.trim(),
        description: workflowData.description?.trim() || '',
        prompt: workflowData.prompt.trim(),
        gameDataFormat: workflowData.gameDataFormat?.trim() || '',
        structuredDataTypes: workflowData.structuredDataTypes || [],
        status: workflowData.status || 'active',
        isDefault: workflowData.isDefault || false,
        createdAt: now,
        updatedAt: now,
      };

      // 如果设置为默认，取消其他默认工作流
      if (newWorkflow.isDefault) {
        Object.values(allWorkflows).forEach(workflow => {
          if (workflow.isDefault) {
            workflow.isDefault = false;
            workflow.updatedAt = now;
          }
        });
      }

      // 保存数据
      allWorkflows[newWorkflow.id] = newWorkflow;
      const saveResult = this.saveAllWorkflows(allWorkflows);

      if (!saveResult.success) {
        return {
          success: false,
          error: `保存失败: ${saveResult.error}`,
        };
      }

      return {
        success: true,
        data: newWorkflow,
        workflowId: newWorkflow.id,
        timestamp: now,
      };
    } catch (error) {
      return {
        success: false,
        error: `创建失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 根据ID获取Workflow
   */
  public getById(id: string): WorkflowStorageResult<Workflow> {
    try {
      if (!id || typeof id !== 'string') {
        return {
          success: false,
          error: '无效的工作流ID',
        };
      }

      const allWorkflowsResult = this.getAllWorkflows();
      if (!allWorkflowsResult.success) {
        return {
          success: false,
          error: `获取数据失败: ${allWorkflowsResult.error}`,
        };
      }

      const workflow = allWorkflowsResult.data![id];
      if (!workflow) {
        return {
          success: false,
          error: '工作流不存在',
        };
      }

      return {
        success: true,
        data: workflow,
        workflowId: id,
        timestamp: allWorkflowsResult.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: `获取失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取所有Workflow (支持查询选项)
   */
  public getAll(options: WorkflowQueryOptions = {}): WorkflowStorageResult<Workflow[]> {
    try {
      const allWorkflowsResult = this.getAllWorkflows();
      if (!allWorkflowsResult.success) {
        return {
          success: false,
          error: `获取数据失败: ${allWorkflowsResult.error}`,
        };
      }

      let workflows = Object.values(allWorkflowsResult.data!);

      // 状态筛选
      if (options.status) {
        workflows = workflows.filter(w => w.status === options.status);
      }

      // 搜索
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        workflows = workflows.filter(w => 
          w.name.toLowerCase().includes(searchLower) ||
          w.description.toLowerCase().includes(searchLower)
        );
      }

      // 排序
      if (options.sortBy) {
        workflows.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (options.sortBy) {
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case 'createdAt':
              aValue = a.createdAt;
              bValue = b.createdAt;
              break;
            case 'updatedAt':
              aValue = a.updatedAt;
              bValue = b.updatedAt;
              break;
            default:
              aValue = a.createdAt;
              bValue = b.createdAt;
          }

          if (options.sortOrder === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          }
        });
      }

      // 分页
      if (options.offset !== undefined || options.limit !== undefined) {
        const offset = options.offset || 0;
        const limit = options.limit || workflows.length;
        workflows = workflows.slice(offset, offset + limit);
      }

      return {
        success: true,
        data: workflows,
        timestamp: allWorkflowsResult.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: `获取列表失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 更新Workflow
   */
  public update(id: string, updateData: Partial<Omit<Workflow, 'id' | 'createdAt'>>): WorkflowStorageResult<Workflow> {
    try {
      if (!id || typeof id !== 'string') {
        return {
          success: false,
          error: '无效的工作流ID',
        };
      }

      // 验证更新数据
      const validation = this.validateWorkflow(updateData);
      if (!validation.valid) {
        return {
          success: false,
          error: `数据验证失败: ${validation.errors.join(', ')}`,
        };
      }

      // 获取现有数据
      const allWorkflowsResult = this.getAllWorkflows();
      if (!allWorkflowsResult.success) {
        return {
          success: false,
          error: `获取现有数据失败: ${allWorkflowsResult.error}`,
        };
      }

      const allWorkflows = allWorkflowsResult.data!;
      const existingWorkflow = allWorkflows[id];

      if (!existingWorkflow) {
        return {
          success: false,
          error: '工作流不存在',
        };
      }

      // 检查名称是否重复（排除自己）
      if (updateData.name) {
        const existingNames = Object.entries(allWorkflows)
          .filter(([workflowId]) => workflowId !== id)
          .map(([, workflow]) => workflow.name.toLowerCase());
        
        if (existingNames.includes(updateData.name.toLowerCase())) {
          return {
            success: false,
            error: '工作流名称已存在',
          };
        }
      }

      const now = Date.now();

      // 如果设置为默认，取消其他默认工作流
      if (updateData.isDefault) {
        Object.values(allWorkflows).forEach(workflow => {
          if (workflow.id !== id && workflow.isDefault) {
            workflow.isDefault = false;
            workflow.updatedAt = now;
          }
        });
      }

      // 更新工作流
      const updatedWorkflow: Workflow = {
        ...existingWorkflow,
        ...updateData,
        id, // 确保ID不被更改
        createdAt: existingWorkflow.createdAt, // 确保创建时间不被更改
        updatedAt: now,
      };

      // 清理数据
      if (updatedWorkflow.name) {
        updatedWorkflow.name = updatedWorkflow.name.trim();
      }
      if (updatedWorkflow.description) {
        updatedWorkflow.description = updatedWorkflow.description.trim();
      }
      if (updatedWorkflow.prompt) {
        updatedWorkflow.prompt = updatedWorkflow.prompt.trim();
      }
      if (updatedWorkflow.gameDataFormat) {
        updatedWorkflow.gameDataFormat = updatedWorkflow.gameDataFormat.trim();
      }

      // 保存数据
      allWorkflows[id] = updatedWorkflow;
      const saveResult = this.saveAllWorkflows(allWorkflows);

      if (!saveResult.success) {
        return {
          success: false,
          error: `保存失败: ${saveResult.error}`,
        };
      }

      return {
        success: true,
        data: updatedWorkflow,
        workflowId: id,
        timestamp: now,
      };
    } catch (error) {
      return {
        success: false,
        error: `更新失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 删除Workflow
   */
  public delete(id: string): WorkflowStorageResult<void> {
    try {
      if (!id || typeof id !== 'string') {
        return {
          success: false,
          error: '无效的工作流ID',
        };
      }

      // 获取现有数据
      const allWorkflowsResult = this.getAllWorkflows();
      if (!allWorkflowsResult.success) {
        return {
          success: false,
          error: `获取现有数据失败: ${allWorkflowsResult.error}`,
        };
      }

      const allWorkflows = allWorkflowsResult.data!;
      
      if (!allWorkflows[id]) {
        return {
          success: false,
          error: '工作流不存在',
        };
      }

      // 检查是否是默认工作流
      const workflowToDelete = allWorkflows[id];
      if (workflowToDelete.isDefault) {
        return {
          success: false,
          error: '不能删除默认工作流，请先设置其他工作流为默认',
        };
      }

      // 删除工作流
      delete allWorkflows[id];

      // 保存数据
      const saveResult = this.saveAllWorkflows(allWorkflows);
      if (!saveResult.success) {
        return {
          success: false,
          error: `保存失败: ${saveResult.error}`,
        };
      }

      return {
        success: true,
        workflowId: id,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: `删除失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 批量删除Workflow
   */
  public batchDelete(ids: string[]): WorkflowBatchResult {
    const result: WorkflowBatchResult = {
      success: true,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    for (const id of ids) {
      const deleteResult = this.delete(id);
      if (deleteResult.success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.errors.push({
          workflowId: id,
          error: deleteResult.error || '未知错误',
        });
      }
    }

    result.success = result.failureCount === 0;
    return result;
  }

  /**
   * 获取默认Workflow
   */
  public getDefault(): WorkflowStorageResult<Workflow> {
    try {
      const allWorkflowsResult = this.getAllWorkflows();
      if (!allWorkflowsResult.success) {
        return {
          success: false,
          error: `获取数据失败: ${allWorkflowsResult.error}`,
        };
      }

      const defaultWorkflow = Object.values(allWorkflowsResult.data!).find(w => w.isDefault);
      
      if (!defaultWorkflow) {
        return {
          success: false,
          error: '没有设置默认工作流',
        };
      }

      return {
        success: true,
        data: defaultWorkflow,
        workflowId: defaultWorkflow.id,
        timestamp: allWorkflowsResult.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: `获取默认工作流失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 设置默认Workflow
   */
  public setDefault(id: string): WorkflowStorageResult<Workflow> {
    return this.update(id, { isDefault: true });
  }

  /**
   * 复制Workflow
   */
  public duplicate(id: string, newName?: string): WorkflowStorageResult<Workflow> {
    try {
      // 获取原工作流
      const originalResult = this.getById(id);
      if (!originalResult.success) {
        return {
          success: false,
          error: `获取原工作流失败: ${originalResult.error}`,
        };
      }

      const original = originalResult.data!;
      
      // 生成新名称
      const finalName = newName || `${original.name} (副本)`;

      // 创建副本
      return this.create({
        name: finalName,
        description: original.description,
        prompt: original.prompt,
        gameDataFormat: original.gameDataFormat,
        structuredDataTypes: [...original.structuredDataTypes],
        status: 'draft', // 副本默认为草稿状态
        isDefault: false, // 副本不能是默认的
      });
    } catch (error) {
      return {
        success: false,
        error: `复制失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取存储统计信息
   */
  public getStats(): WorkflowStorageResult<WorkflowStorageStats> {
    try {
      const allWorkflowsResult = this.getAllWorkflows();
      if (!allWorkflowsResult.success) {
        return {
          success: false,
          error: `获取数据失败: ${allWorkflowsResult.error}`,
        };
      }

      const workflows = Object.values(allWorkflowsResult.data!);
      
      const stats: WorkflowStorageStats = {
        total: workflows.length,
        active: workflows.filter(w => w.status === 'active').length,
        inactive: workflows.filter(w => w.status === 'inactive').length,
        draft: workflows.filter(w => w.status === 'draft').length,
        storageUsed: JSON.stringify(allWorkflowsResult.data).length,
        lastUpdated: Math.max(...workflows.map(w => w.updatedAt), 0),
      };

      return {
        success: true,
        data: stats,
        timestamp: allWorkflowsResult.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: `获取统计信息失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 清空所有Workflow数据
   */
  public clear(): WorkflowStorageResult<void> {
    try {
      const saveResult = this.saveAllWorkflows({});
      if (!saveResult.success) {
        return {
          success: false,
          error: `清空失败: ${saveResult.error}`,
        };
      }

      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: `清空失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 导出所有Workflow数据
   */
  public exportData(): WorkflowStorageResult<Workflow[]> {
    const allResult = this.getAll();
    if (!allResult.success) {
      return allResult;
    }

    return {
      success: true,
      data: allResult.data!,
      timestamp: Date.now(),
    };
  }

  /**
   * 导入Workflow数据
   */
  public importData(workflows: Workflow[]): WorkflowBatchResult {
    const result: WorkflowBatchResult = {
      success: true,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    for (const workflow of workflows) {
      const { id, createdAt, updatedAt, ...workflowData } = workflow;
      const createResult = this.create(workflowData);
      
      if (createResult.success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.errors.push({
          workflowId: workflow.id || '未知ID',
          error: createResult.error || '未知错误',
        });
      }
    }

    result.success = result.failureCount === 0;
    return result;
  }
}

/**
 * 默认的Workflow存储服务实例
 */
export const workflowStorage = new WorkflowStorageService(); 