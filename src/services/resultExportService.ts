/**
 * 结果导出服务
 * 负责将生成结果导出为不同格式的文件
 */

import { PreviewGenerationResult } from '@/types/ResultPreview.types';

// 导出格式枚举
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  XLSX = 'xlsx',
  TXT = 'txt'
}

// 导出配置接口
export interface ExportConfig {
  format: ExportFormat;
  includeMetadata: boolean;
  includeQualityAnalysis: boolean;
  customFields?: string[];
  compression?: boolean;
  encoding?: 'utf-8' | 'utf-16' | 'ascii';
}

// 导出结果接口
export interface ExportResult {
  success: boolean;
  fileName: string;
  filePath?: string;
  blob?: Blob;
  downloadUrl?: string;
  error?: string;
  metadata: {
    exportTime: string;
    totalRecords: number;
    fileSize: number;
    format: ExportFormat;
  };
}

// 批量导出配置
export interface BatchExportConfig extends ExportConfig {
  batchSize: number;
  includeIndex: boolean;
  separateFiles: boolean;
  zipOutput: boolean;
}

// 导出统计信息
export interface ExportStats {
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  averageFileSize: number;
  totalProcessingTime: number;
  exportsByFormat: Record<ExportFormat, number>;
}

/**
 * 结果导出服务类
 */
export class ResultExportService {
  private exportHistory: ExportResult[] = [];
  private readonly maxHistorySize = 100;

  /**
   * 导出单个结果
   */
  async exportSingle(
    result: PreviewGenerationResult,
    config: ExportConfig
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      const fileName = this.generateFileName(result.gameName, config.format);
      
      let blob: Blob;
      
      switch (config.format) {
        case ExportFormat.JSON:
          blob = await this.exportAsJSON(result, config);
          break;
          
        case ExportFormat.CSV:
          blob = await this.exportAsCSV([result], config);
          break;
          
        case ExportFormat.TXT:
          blob = await this.exportAsText(result, config);
          break;
          
        default:
          throw new Error(`Unsupported export format: ${config.format}`);
      }

      const exportResult: ExportResult = {
        success: true,
        fileName,
        blob,
        downloadUrl: URL.createObjectURL(blob),
        metadata: {
          exportTime: new Date().toISOString(),
          totalRecords: 1,
          fileSize: blob.size,
          format: config.format
        }
      };

      this.addToHistory(exportResult);
      return exportResult;
      
    } catch (error) {
      const exportResult: ExportResult = {
        success: false,
        fileName: this.generateFileName(result.gameName, config.format),
        error: error.message,
        metadata: {
          exportTime: new Date().toISOString(),
          totalRecords: 0,
          fileSize: 0,
          format: config.format
        }
      };
      
      this.addToHistory(exportResult);
      return exportResult;
    }
  }

  /**
   * 批量导出结果
   */
  async exportBatch(
    results: PreviewGenerationResult[],
    config: BatchExportConfig
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      if (config.separateFiles) {
        return await this.exportSeparateFiles(results, config);
      } else {
        return await this.exportSingleFile(results, config);
      }
      
    } catch (error) {
      return {
        success: false,
        fileName: `batch_export_${Date.now()}.${config.format}`,
        error: error.message,
        metadata: {
          exportTime: new Date().toISOString(),
          totalRecords: 0,
          fileSize: 0,
          format: config.format
        }
      };
    }
  }

  /**
   * 导出为JSON格式
   */
  private async exportAsJSON(
    result: PreviewGenerationResult,
    config: ExportConfig
  ): Promise<Blob> {
    const exportData: any = {
      gameId: result.gameId,
      gameName: result.gameName,
      content: result.content.rawContent
    };

    if (config.includeMetadata) {
      exportData.metadata = result.metadata;
    }

    if (config.includeQualityAnalysis && result.qualityAnalysis) {
      exportData.qualityAnalysis = result.qualityAnalysis;
    }

    if (config.customFields && config.customFields.length > 0) {
      exportData.customFields = {};
      config.customFields.forEach(field => {
        if (result.content.rawContent[field] !== undefined) {
          exportData.customFields[field] = result.content.rawContent[field];
        }
      });
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { 
      type: 'application/json',
      encoding: config.encoding || 'utf-8'
    });
  }

  /**
   * 导出为CSV格式
   */
  private async exportAsCSV(
    results: PreviewGenerationResult[],
    config: ExportConfig
  ): Promise<Blob> {
    const headers = this.generateCSVHeaders(results[0], config);
    const rows = results.map(result => this.generateCSVRow(result, config));
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return new Blob([csvContent], { 
      type: 'text/csv',
      encoding: config.encoding || 'utf-8'
    });
  }

  /**
   * 导出为文本格式
   */
  private async exportAsText(
    result: PreviewGenerationResult,
    config: ExportConfig
  ): Promise<Blob> {
    let textContent = `游戏名称: ${result.gameName}\n`;
    textContent += `游戏ID: ${result.gameId}\n`;
    textContent += `生成时间: ${result.createdAt}\n\n`;
    
    textContent += '=== 生成内容 ===\n';
    textContent += JSON.stringify(result.content.rawContent, null, 2);
    
    if (config.includeMetadata) {
      textContent += '\n\n=== 元数据 ===\n';
      textContent += JSON.stringify(result.metadata, null, 2);
    }
    
    if (config.includeQualityAnalysis && result.qualityAnalysis) {
      textContent += '\n\n=== 质量分析 ===\n';
      textContent += JSON.stringify(result.qualityAnalysis, null, 2);
    }

    return new Blob([textContent], { 
      type: 'text/plain',
      encoding: config.encoding || 'utf-8'
    });
  }

  /**
   * 批量导出为单个文件
   */
  private async exportSingleFile(
    results: PreviewGenerationResult[],
    config: BatchExportConfig
  ): Promise<ExportResult> {
    const fileName = `batch_export_${Date.now()}.${config.format}`;
    let blob: Blob;

    switch (config.format) {
      case ExportFormat.JSON:
        const exportData = results.map(result => {
          const data: any = {
            gameId: result.gameId,
            gameName: result.gameName,
            content: result.content.rawContent
          };
          
          if (config.includeMetadata) {
            data.metadata = result.metadata;
          }
          
          if (config.includeQualityAnalysis && result.qualityAnalysis) {
            data.qualityAnalysis = result.qualityAnalysis;
          }
          
          return data;
        });
        
        blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        break;

      case ExportFormat.CSV:
        blob = await this.exportAsCSV(results, config);
        break;

      default:
        throw new Error(`Batch export not supported for format: ${config.format}`);
    }

    return {
      success: true,
      fileName,
      blob,
      downloadUrl: URL.createObjectURL(blob),
      metadata: {
        exportTime: new Date().toISOString(),
        totalRecords: results.length,
        fileSize: blob.size,
        format: config.format
      }
    };
  }

  /**
   * 批量导出为多个文件
   */
  private async exportSeparateFiles(
    results: PreviewGenerationResult[],
    config: BatchExportConfig
  ): Promise<ExportResult> {
    // 为简化实现，这里直接返回压缩包的概念
    // 实际实现可能需要JSZip库
    const fileName = `batch_export_${Date.now()}.zip`;
    
    // 模拟创建压缩包
    const zipContent = JSON.stringify({
      files: results.map(result => ({
        fileName: this.generateFileName(result.gameName, config.format),
        content: result.content.rawContent
      })),
      metadata: {
        totalFiles: results.length,
        exportTime: new Date().toISOString()
      }
    }, null, 2);

    const blob = new Blob([zipContent], { type: 'application/zip' });

    return {
      success: true,
      fileName,
      blob,
      downloadUrl: URL.createObjectURL(blob),
      metadata: {
        exportTime: new Date().toISOString(),
        totalRecords: results.length,
        fileSize: blob.size,
        format: config.format
      }
    };
  }

  /**
   * 生成CSV表头
   */
  private generateCSVHeaders(
    result: PreviewGenerationResult,
    config: ExportConfig
  ): string[] {
    const headers = ['gameId', 'gameName', 'status', 'createdAt'];
    
    // 添加内容字段
    const contentKeys = Object.keys(result.content.rawContent);
    headers.push(...contentKeys.map(key => `content_${key}`));
    
    if (config.includeMetadata) {
      headers.push('generationMode', 'totalTokens', 'generationTime');
    }
    
    if (config.includeQualityAnalysis && result.qualityAnalysis) {
      headers.push('overallScore', 'wordCount', 'seoScore');
    }
    
    return headers;
  }

  /**
   * 生成CSV行数据
   */
  private generateCSVRow(
    result: PreviewGenerationResult,
    config: ExportConfig
  ): string[] {
    const row = [
      result.gameId,
      `"${result.gameName}"`,
      result.status,
      result.createdAt
    ];
    
    // 添加内容数据
    const contentKeys = Object.keys(result.content.rawContent);
    contentKeys.forEach(key => {
      const value = result.content.rawContent[key];
      row.push(`"${String(value).replace(/"/g, '""')}"`);
    });
    
    if (config.includeMetadata) {
      row.push(
        result.metadata.generationMode,
        String(result.metadata.totalTokens),
        String(result.metadata.generationTime)
      );
    }
    
    if (config.includeQualityAnalysis && result.qualityAnalysis) {
      row.push(
        String(result.qualityAnalysis.overallScore),
        String(result.qualityAnalysis.wordCount.total),
        String(result.qualityAnalysis.seoScore.overall)
      );
    }
    
    return row;
  }

  /**
   * 生成文件名
   */
  private generateFileName(gameName: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedName = gameName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    return `${sanitizedName}_${timestamp}.${format}`;
  }

  /**
   * 添加到导出历史
   */
  private addToHistory(exportResult: ExportResult): void {
    this.exportHistory.unshift(exportResult);
    
    if (this.exportHistory.length > this.maxHistorySize) {
      this.exportHistory.pop();
    }
  }

  /**
   * 获取导出历史
   */
  getExportHistory(): ExportResult[] {
    return [...this.exportHistory];
  }

  /**
   * 清理导出历史
   */
  clearExportHistory(): void {
    this.exportHistory = [];
  }

  /**
   * 获取导出统计信息
   */
  getExportStats(): ExportStats {
    const total = this.exportHistory.length;
    const successful = this.exportHistory.filter(e => e.success).length;
    const failed = total - successful;
    
    const totalSize = this.exportHistory.reduce((sum, e) => sum + e.metadata.fileSize, 0);
    const averageSize = total > 0 ? totalSize / total : 0;
    
    const formatCounts: Record<ExportFormat, number> = {
      [ExportFormat.JSON]: 0,
      [ExportFormat.CSV]: 0,
      [ExportFormat.XLSX]: 0,
      [ExportFormat.TXT]: 0
    };
    
    this.exportHistory.forEach(e => {
      formatCounts[e.metadata.format]++;
    });

    return {
      totalExports: total,
      successfulExports: successful,
      failedExports: failed,
      averageFileSize: averageSize,
      totalProcessingTime: 0, // 可以在未来添加处理时间统计
      exportsByFormat: formatCounts
    };
  }

  /**
   * 下载文件
   */
  downloadFile(exportResult: ExportResult): void {
    if (!exportResult.downloadUrl) {
      throw new Error('No download URL available');
    }

    const link = document.createElement('a');
    link.href = exportResult.downloadUrl;
    link.download = exportResult.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * 清理下载URL
   */
  cleanupDownloadUrl(exportResult: ExportResult): void {
    if (exportResult.downloadUrl) {
      URL.revokeObjectURL(exportResult.downloadUrl);
      exportResult.downloadUrl = undefined;
    }
  }
}

// 创建服务实例
export const resultExportService = new ResultExportService(); 