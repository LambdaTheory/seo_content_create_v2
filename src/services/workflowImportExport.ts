/**
 * 工作流导入导出服务
 */

import { Workflow } from '@/types/Workflow.types';
import {
  WorkflowExportConfig,
  WorkflowExportData,
  BatchWorkflowExportConfig,
  WorkflowImportOptions,
  WorkflowImportResult,
  BatchWorkflowImportResult,
  WorkflowConfigValidationResult,
  WorkflowConflict,
  WorkflowConflictResolution,
  WORKFLOW_CONFIG_VERSION,
} from '@/types/WorkflowExport.types';
import { WorkflowStorageService } from './workflowStorage';

/**
 * 工作流导入导出服务类
 */
export class WorkflowImportExportService {
  private workflowStorage: WorkflowStorageService;
  private supportedVersions = ['1.0.0'];

  constructor() {
    this.workflowStorage = new WorkflowStorageService();
  }

  /**
   * 导出单个工作流
   */
  public exportWorkflow(
    workflowId: string,
    options: {
      includeMetadata?: boolean;
      description?: string;
      exportedBy?: string;
      source?: string;
    } = {}
  ): { success: boolean; data?: WorkflowExportConfig; error?: string } {
    try {
      // 获取工作流数据
      const result = this.workflowStorage.getById(workflowId);
      if (!result.success || !result.data) {
        return {
          success: false,
          error: `获取工作流失败: ${result.error}`,
        };
      }

      const workflow = result.data;

      // 构建导出数据
      const exportData: WorkflowExportData = {
        name: workflow.name,
        description: workflow.description,
        prompt: workflow.prompt,
        gameDataFormat: workflow.gameDataFormat,
        structuredDataTypes: workflow.structuredDataTypes,
        status: workflow.status,
        isDefault: workflow.isDefault,
      };

      // 添加元数据
      if (options.includeMetadata) {
        exportData.metadata = {
          originalCreatedAt: workflow.createdAt,
          originalUpdatedAt: workflow.updatedAt,
          originalId: workflow.id,
        };
      }

      // 构建导出配置
      const exportConfig: WorkflowExportConfig = {
        version: WORKFLOW_CONFIG_VERSION,
        exportedAt: Date.now(),
        exportedBy: options.exportedBy,
        source: options.source,
        description: options.description,
        workflow: exportData,
      };

      return {
        success: true,
        data: exportConfig,
      };
    } catch (error) {
      return {
        success: false,
        error: `导出工作流时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 批量导出工作流
   */
  public exportWorkflows(
    workflowIds: string[],
    options: {
      includeMetadata?: boolean;
      description?: string;
      exportedBy?: string;
      source?: string;
    } = {}
  ): { success: boolean; data?: BatchWorkflowExportConfig; error?: string } {
    try {
      const exportedWorkflows: WorkflowExportData[] = [];
      const errors: string[] = [];

      // 逐个导出工作流
      for (const workflowId of workflowIds) {
        const exportResult = this.exportWorkflow(workflowId, options);
        if (exportResult.success && exportResult.data) {
          exportedWorkflows.push(exportResult.data.workflow);
        } else {
          errors.push(`工作流 ${workflowId}: ${exportResult.error}`);
        }
      }

      if (exportedWorkflows.length === 0) {
        return {
          success: false,
          error: `没有成功导出任何工作流。错误: ${errors.join(', ')}`,
        };
      }

      // 构建批量导出配置
      const batchExportConfig: BatchWorkflowExportConfig = {
        version: WORKFLOW_CONFIG_VERSION,
        exportedAt: Date.now(),
        exportedBy: options.exportedBy,
        source: options.source,
        description: options.description,
        count: exportedWorkflows.length,
        workflows: exportedWorkflows,
      };

      return {
        success: true,
        data: batchExportConfig,
      };
    } catch (error) {
      return {
        success: false,
        error: `批量导出工作流时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 导出所有工作流
   */
  public exportAllWorkflows(
    options: {
      includeMetadata?: boolean;
      description?: string;
      exportedBy?: string;
      source?: string;
    } = {}
  ): { success: boolean; data?: BatchWorkflowExportConfig; error?: string } {
    try {
      // 获取所有工作流
      const allWorkflowsResult = this.workflowStorage.getAll();
      if (!allWorkflowsResult.success || !allWorkflowsResult.data) {
        return {
          success: false,
          error: `获取工作流列表失败: ${allWorkflowsResult.error}`,
        };
      }

      const workflowIds = allWorkflowsResult.data.map(w => w.id);
      return this.exportWorkflows(workflowIds, options);
    } catch (error) {
      return {
        success: false,
        error: `导出所有工作流时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 验证工作流配置文件
   */
  public validateWorkflowConfig(
    configData: any
  ): WorkflowConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 检查基本结构
      if (!configData || typeof configData !== 'object') {
        errors.push('配置文件格式无效：必须是JSON对象');
        return {
          valid: false,
          errors,
          warnings,
          supportedVersions: this.supportedVersions,
        };
      }

      // 检查版本
      if (!configData.version) {
        errors.push('缺少version字段');
      } else if (!this.supportedVersions.includes(configData.version)) {
        errors.push(`不支持的版本: ${configData.version}。支持的版本: ${this.supportedVersions.join(', ')}`);
      }

      // 检查导出时间
      if (!configData.exportedAt || typeof configData.exportedAt !== 'number') {
        warnings.push('缺少或无效的exportedAt字段');
      }

      // 检查工作流数据
      if (!configData.workflow && !configData.workflows) {
        errors.push('缺少workflow或workflows字段');
      } else {
        // 单个工作流验证
        if (configData.workflow) {
          const workflowErrors = this.validateWorkflowData(configData.workflow);
          errors.push(...workflowErrors);
        }

        // 批量工作流验证
        if (configData.workflows) {
          if (!Array.isArray(configData.workflows)) {
            errors.push('workflows字段必须是数组');
          } else {
            configData.workflows.forEach((workflow: any, index: number) => {
              const workflowErrors = this.validateWorkflowData(workflow);
              errors.push(...workflowErrors.map(err => `工作流${index + 1}: ${err}`));
            });
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        supportedVersions: this.supportedVersions,
        fileVersion: configData.version,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`验证过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`],
        warnings,
        supportedVersions: this.supportedVersions,
      };
    }
  }

  /**
   * 验证单个工作流数据
   */
  private validateWorkflowData(workflow: any): string[] {
    const errors: string[] = [];

    if (!workflow || typeof workflow !== 'object') {
      errors.push('工作流数据必须是对象');
      return errors;
    }

    // 必填字段验证
    if (!workflow.name || typeof workflow.name !== 'string') {
      errors.push('缺少或无效的name字段');
    }

    if (!workflow.prompt || typeof workflow.prompt !== 'string') {
      errors.push('缺少或无效的prompt字段');
    }

    if (!workflow.structuredDataTypes || !Array.isArray(workflow.structuredDataTypes)) {
      errors.push('缺少或无效的structuredDataTypes字段');
    }

    if (workflow.status && !['active', 'inactive', 'draft'].includes(workflow.status)) {
      errors.push(`无效的status值: ${workflow.status}`);
    }

    return errors;
  }

  /**
   * 检测导入冲突
   */
  public detectImportConflicts(
    configData: WorkflowExportConfig | BatchWorkflowExportConfig
  ): WorkflowConflict[] {
    const conflicts: WorkflowConflict[] = [];

    try {
      // 获取现有工作流
      const existingWorkflowsResult = this.workflowStorage.getAll();
      if (!existingWorkflowsResult.success || !existingWorkflowsResult.data) {
        return conflicts;
      }

      const existingWorkflows = existingWorkflowsResult.data;
      const existingNames = existingWorkflows.map(w => w.name.toLowerCase());

      // 检查工作流数据
      const workflowsToCheck: WorkflowExportData[] = [];
      if ('workflow' in configData) {
        workflowsToCheck.push(configData.workflow);
      } else if ('workflows' in configData) {
        workflowsToCheck.push(...configData.workflows);
      }

      // 检测冲突
      workflowsToCheck.forEach(importingWorkflow => {
        // 名称冲突
        const nameIndex = existingNames.indexOf(importingWorkflow.name.toLowerCase());
        if (nameIndex !== -1) {
          conflicts.push({
            type: 'name_duplicate',
            workflowName: importingWorkflow.name,
            existingWorkflow: existingWorkflows[nameIndex],
            importingWorkflow,
            suggestedResolution: 'rename',
          });
        }

        // 默认工作流冲突
        if (importingWorkflow.isDefault) {
          const existingDefault = existingWorkflows.find(w => w.isDefault);
          if (existingDefault) {
            conflicts.push({
              type: 'default_conflict',
              workflowName: importingWorkflow.name,
              existingWorkflow: existingDefault,
              importingWorkflow,
              suggestedResolution: 'overwrite',
            });
          }
        }
      });

      return conflicts;
    } catch (error) {
      console.error('检测导入冲突时发生错误:', error);
      return conflicts;
    }
  }

  /**
   * 导入单个工作流
   */
  public importWorkflow(
    configData: WorkflowExportConfig,
    options: WorkflowImportOptions = {}
  ): WorkflowImportResult {
    try {
      // 验证配置文件
      if (options.validateConfig !== false) {
        const validation = this.validateWorkflowConfig(configData);
        if (!validation.valid) {
          return {
            success: false,
            errors: validation.errors,
            warnings: validation.warnings,
            originalData: configData,
          };
        }
      }

      // 检测冲突
      const conflicts = this.detectImportConflicts(configData);
      const nameConflict = conflicts.find(c => c.type === 'name_duplicate');

      if (nameConflict && !options.overwriteExisting) {
        return {
          success: false,
          errors: [`工作流名称 "${nameConflict.workflowName}" 已存在`],
          originalData: configData,
        };
      }

      // 处理名称
      const workflowData = configData.workflow;
      let finalName = workflowData.name;
      
      if (options.namePrefix) {
        finalName = options.namePrefix + finalName;
      }
      if (options.nameSuffix) {
        finalName = finalName + options.nameSuffix;
      }

      // 如果有冲突且不覆盖，自动重命名
      if (nameConflict && !options.overwriteExisting) {
        let counter = 1;
        let newName = `${finalName}_副本${counter}`;
        while (this.workflowStorage.getAll().data?.some(w => w.name === newName)) {
          counter++;
          newName = `${finalName}_副本${counter}`;
        }
        finalName = newName;
      }

      // 创建工作流
      const createData = {
        name: finalName,
        description: workflowData.description,
        prompt: workflowData.prompt,
        gameDataFormat: workflowData.gameDataFormat,
        structuredDataTypes: workflowData.structuredDataTypes,
        status: options.importStatus || workflowData.status,
        isDefault: options.setAsDefault || workflowData.isDefault,
      };

      let result;
      if (nameConflict && options.overwriteExisting) {
        // 更新现有工作流
        result = this.workflowStorage.update(nameConflict.existingWorkflow.id, createData);
      } else {
        // 创建新工作流
        result = this.workflowStorage.create(createData);
      }

      if (result.success) {
        return {
          success: true,
          workflow: result.data,
          warnings: conflicts.length > 0 ? ['检测到冲突但已自动处理'] : undefined,
          originalData: configData,
        };
      } else {
        return {
          success: false,
          errors: [result.error || '导入失败'],
          originalData: configData,
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [`导入工作流时发生错误: ${error instanceof Error ? error.message : '未知错误'}`],
        originalData: configData,
      };
    }
  }

  /**
   * 批量导入工作流
   */
  public importWorkflows(
    configData: BatchWorkflowExportConfig,
    options: WorkflowImportOptions = {}
  ): BatchWorkflowImportResult {
    try {
      // 验证配置文件
      if (options.validateConfig !== false) {
        const validation = this.validateWorkflowConfig(configData);
        if (!validation.valid) {
          return {
            success: false,
            successCount: 0,
            failureCount: 0,
            results: [],
            errors: validation.errors,
            originalData: configData,
          };
        }
      }

      const results: WorkflowImportResult[] = [];
      let successCount = 0;
      let failureCount = 0;

      // 逐个导入工作流
      for (const workflowData of configData.workflows) {
        const singleConfig: WorkflowExportConfig = {
          version: configData.version,
          exportedAt: configData.exportedAt,
          exportedBy: configData.exportedBy,
          source: configData.source,
          description: configData.description,
          workflow: workflowData,
        };

        const importResult = this.importWorkflow(singleConfig, options);
        results.push(importResult);

        if (importResult.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      return {
        success: failureCount === 0,
        successCount,
        failureCount,
        results,
        originalData: configData,
      };
    } catch (error) {
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        results: [],
        errors: [`批量导入工作流时发生错误: ${error instanceof Error ? error.message : '未知错误'}`],
        originalData: configData,
      };
    }
  }

  /**
   * 解析配置文件内容
   */
  public parseConfigFile(
    fileContent: string
  ): { success: boolean; data?: WorkflowExportConfig | BatchWorkflowExportConfig; error?: string } {
    try {
      const configData = JSON.parse(fileContent);
      
      // 简单检查是否为有效配置
      if (!configData.version) {
        return {
          success: false,
          error: '无效的配置文件：缺少version字段',
        };
      }

      return {
        success: true,
        data: configData,
      };
    } catch (error) {
      return {
        success: false,
        error: `解析配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 生成配置文件内容
   */
  public generateConfigFileContent(
    configData: WorkflowExportConfig | BatchWorkflowExportConfig
  ): string {
    return JSON.stringify(configData, null, 2);
  }

  /**
   * 生成文件名
   */
  public generateFileName(
    configData: WorkflowExportConfig | BatchWorkflowExportConfig,
    extension: string = 'json'
  ): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    if ('workflow' in configData) {
      // 单个工作流
      const safeName = configData.workflow.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      return `workflow_${safeName}_${timestamp}.${extension}`;
    } else {
      // 批量工作流
      return `workflows_batch_${configData.count}_${timestamp}.${extension}`;
    }
  }
}

// 导出服务实例
export const workflowImportExportService = new WorkflowImportExportService(); 