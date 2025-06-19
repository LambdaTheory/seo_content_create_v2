/**
 * 结构化数据类型枚举
 */
export type StructuredDataType = 'game' | 'video' | 'review' | 'breadcrumb' | 'faq';

/**
 * 工作流接口定义
 */
export interface Workflow {
  /** 工作流唯一标识 */
  id: string;
  /** 工作流名称 */
  name: string;
  /** 工作流描述 */
  description?: string;
  /** AI生成内容的Prompt模板 */
  promptTemplate: string;
  /** games.json参考格式 */
  gamesJsonFormat: string;
  /** 选择的结构化数据类型 */
  structuredDataTypes: StructuredDataType[];
  /** 创建时间 */
  createdAt: Date;
  /** 最后修改时间 */
  updatedAt: Date;
  /** 是否为默认工作流 */
  isDefault?: boolean;
}

/**
 * 创建工作流的输入数据
 */
export interface CreateWorkflowInput {
  name: string;
  description?: string;
  promptTemplate: string;
  gamesJsonFormat: string;
  structuredDataTypes: StructuredDataType[];
}

/**
 * 更新工作流的输入数据
 */
export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  promptTemplate?: string;
  gamesJsonFormat?: string;
  structuredDataTypes?: StructuredDataType[];
}

/**
 * 工作流导出格式
 */
export interface WorkflowExport {
  version: string;
  exportedAt: Date;
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>;
}

/**
 * 工作流导入结果
 */
export interface WorkflowImportResult {
  success: boolean;
  workflow?: Workflow;
  errors?: string[];
} 