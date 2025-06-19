import { GameData } from './GameData.types';
import { StructuredDataType } from './Workflow.types';

/**
 * 生成状态枚举
 */
export type GenerationStatus = 'pending' | 'processing' | 'success' | 'error' | 'cancelled';

/**
 * 生成结果接口
 */
export interface GenerationResult {
  /** 生成结果唯一标识 */
  id: string;
  /** 工作流ID */
  workflowId: string;
  /** 工作流名称 */
  workflowName: string;
  /** 输入的游戏数据 */
  gameData: GameData[];
  /** 生成的内容数据 */
  generatedContent: GeneratedGameContent[];
  /** 结构化数据 */
  structuredData?: StructuredData[];
  /** 生成状态 */
  status: GenerationStatus;
  /** 错误信息 */
  errorMessage?: string;
  /** 进度信息 */
  progress: GenerationProgress;
  /** 创建时间 */
  createdAt: Date;
  /** 完成时间 */
  completedAt?: Date;
}

/**
 * 单个游戏生成内容
 */
export interface GeneratedGameContent {
  /** 游戏名称 */
  gameName: string;
  /** 游戏简介 */
  gameDescription: string;
  /** 玩法操作 */
  gameplayInstructions: string;
  /** 游戏特色 */
  gameFeatures: string[];
  /** 玩家真实好评 */
  playerReviews: string[];
  /** 视频内容描述 */
  videoDescription?: string;
  /** 生成状态 */
  status: GenerationStatus;
  /** 错误信息 */
  error?: string;
}

/**
 * 结构化数据
 */
export interface StructuredData {
  /** 数据类型 */
  type: StructuredDataType;
  /** 游戏名称 */
  gameName: string;
  /** 结构化数据内容 */
  data: Record<string, any>;
  /** 验证状态 */
  isValid: boolean;
  /** 验证错误 */
  validationErrors?: string[];
}

/**
 * 生成进度信息
 */
export interface GenerationProgress {
  /** 总游戏数 */
  totalGames: number;
  /** 已完成游戏数 */
  completedGames: number;
  /** 当前处理的游戏 */
  currentGame?: string;
  /** 进度百分比 */
  percentage: number;
  /** 预计剩余时间（秒） */
  estimatedTimeRemaining?: number;
}

/**
 * 竞品内容
 */
export interface CompetitorContent {
  /** 来源URL */
  sourceUrl: string;
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 提取时间 */
  extractedAt: Date;
  /** 质量评分 */
  qualityScore?: number;
}

/**
 * 生成配置
 */
export interface GenerationConfig {
  /** 工作流ID */
  workflowId: string;
  /** 游戏数据 */
  gameData: GameData[];
  /** 结构化数据类型 */
  structuredDataTypes: StructuredDataType[];
  /** 是否搜索竞品内容 */
  enableCompetitorSearch: boolean;
  /** 并发数量 */
  concurrency?: number;
}

/**
 * 导出格式类型
 */
export type ExportFormat = 'json' | 'csv' | 'xlsx';

/**
 * 导出结果
 */
export interface ExportResult {
  /** 文件名 */
  filename: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 导出格式 */
  format: ExportFormat;
  /** 导出时间 */
  exportedAt: Date;
  /** 下载URL */
  downloadUrl?: string;
} 