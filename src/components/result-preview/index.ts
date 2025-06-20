/**
 * 结果预览组件索引文件
 */

export { ResultPreview } from './ResultPreview';
export { QualityAnalysis } from './QualityAnalysis';
export { ResultsList } from './ResultsList';
export { ExportDialog } from './ExportDialog';
export { ExportHistory } from './ExportHistory';
export { ResultPreviewManager } from './ResultPreviewManager';

// 导出相关类型
export type {
  PreviewGenerationResult,
  PreviewConfig,
  SearchResult,
  SearchMatch,
  FoldingState,
  ContentQualityAnalysis,
  EditOperation,
  EditHistory
} from '@/types/ResultPreview.types';

// 导出服务
export { resultExportService } from '@/services/resultExportService';
export type {
  ExportFormat,
  ExportConfig,
  ExportResult,
  BatchExportConfig,
  ExportStats
} from '@/services/resultExportService'; 