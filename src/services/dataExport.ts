/**
 * 数据导出服务
 * 
 * 功能特性：
 * - 支持CSV格式导出
 * - 支持JSON格式导出
 * - 支持Excel格式导出
 * - 支持自定义字段导出
 * - 支持数据格式化
 * - 支持文件下载
 */

import Papa from 'papaparse';
import { GameData } from '@/types/GameData.types';

/**
 * 导出格式
 */
export type ExportFormat = 'csv' | 'json' | 'excel';

/**
 * 导出配置
 */
export interface ExportConfig {
  /** 导出格式 */
  format: ExportFormat;
  /** 文件名 */
  filename?: string;
  /** 包含的字段 */
  fields?: (keyof GameData)[];
  /** 字段标题映射 */
  fieldLabels?: Record<keyof GameData, string>;
  /** 是否包含标题行（仅CSV和Excel） */
  includeHeaders?: boolean;
  /** 是否格式化JSON（仅JSON） */
  prettifyJson?: boolean;
  /** CSV分隔符 */
  csvDelimiter?: string;
  /** 字符编码 */
  encoding?: string;
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean;
  /** 文件数据 */
  data?: string | Blob;
  /** 文件名 */
  filename: string;
  /** 错误信息 */
  error?: string;
  /** 导出统计 */
  stats?: {
    totalRows: number;
    exportedRows: number;
    exportedFields: number;
    fileSize: number;
  };
}

/**
 * 数据导出服务类
 */
export class DataExportService {
  /**
   * 导出数据
   */
  static async exportData(
    data: GameData[],
    config: ExportConfig
  ): Promise<ExportResult> {
    try {
      const {
        format,
        filename = this.generateFilename(format),
        fields,
        fieldLabels = {} as Record<keyof GameData, string>,
        includeHeaders = true,
        prettifyJson = true,
        csvDelimiter = ',',
        encoding = 'utf-8'
      } = config;

      // 处理字段选择
      const selectedFields = fields || this.getAllFields();
      const processedData = this.processData(data, selectedFields, fieldLabels);

      let exportData: string | Blob;
      let mimeType: string;

      switch (format) {
        case 'csv':
          exportData = this.exportToCSV(processedData, {
            delimiter: csvDelimiter,
            includeHeaders,
            fieldLabels
          });
          mimeType = 'text/csv;charset=utf-8;';
          break;

        case 'json':
          exportData = this.exportToJSON(processedData, prettifyJson);
          mimeType = 'application/json;charset=utf-8;';
          break;

        case 'excel':
          exportData = await this.exportToExcel(processedData, {
            includeHeaders,
            fieldLabels
          });
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }

      // 计算统计信息
      const stats = {
        totalRows: data.length,
        exportedRows: processedData.length,
        exportedFields: selectedFields.length,
        fileSize: typeof exportData === 'string' ? new Blob([exportData]).size : exportData.size
      };

      return {
        success: true,
        data: exportData,
        filename,
        stats
      };

    } catch (error) {
      return {
        success: false,
        filename: config.filename || this.generateFilename(config.format),
        error: error instanceof Error ? error.message : '导出失败'
      };
    }
  }

  /**
   * 下载导出的文件
   */
  static downloadFile(result: ExportResult): void {
    if (!result.success || !result.data) {
      throw new Error(result.error || '导出数据不可用');
    }

    const data = result.data;
    let blob: Blob;

    if (typeof data === 'string') {
      blob = new Blob([data], { type: 'text/plain;charset=utf-8;' });
    } else {
      blob = data;
    }

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL
    URL.revokeObjectURL(url);
  }

  /**
   * 导出为CSV格式
   */
  private static exportToCSV(
    data: any[],
    options: {
      delimiter: string;
      includeHeaders: boolean;
      fieldLabels: Record<string, string>;
    }
  ): string {
    const { delimiter, includeHeaders, fieldLabels } = options;

    if (data.length === 0) {
      return '';
    }

    // 获取字段名
    const fields = Object.keys(data[0]);
    
    // 准备CSV数据
    const csvData = [...data];
    
    // 添加标题行
    if (includeHeaders) {
      const headers = fields.reduce((acc, field) => {
        acc[field] = fieldLabels[field] || field;
        return acc;
      }, {} as Record<string, string>);
      
      csvData.unshift(headers);
    }

    // 使用Papa Parse生成CSV
    return Papa.unparse(csvData, {
      delimiter,
      header: false, // 我们手动处理标题
      skipEmptyLines: true,
      quotes: true
    });
  }

  /**
   * 导出为JSON格式
   */
  private static exportToJSON(data: any[], prettify: boolean = true): string {
    if (prettify) {
      return JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data);
  }

  /**
   * 导出为Excel格式
   */
  private static async exportToExcel(
    data: any[],
    options: {
      includeHeaders: boolean;
      fieldLabels: Record<string, string>;
    }
  ): Promise<Blob> {
    // 这里使用一个简单的实现，实际项目中可以使用 xlsx 库
    // 为了避免增加依赖，这里转换为CSV再创建文件
    const csvData = this.exportToCSV(data, {
      delimiter: ',',
      includeHeaders: options.includeHeaders,
      fieldLabels: options.fieldLabels
    });

    // 创建Excel兼容的CSV
    const excelCSV = '\uFEFF' + csvData; // 添加BOM以支持中文
    
    return new Blob([excelCSV], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });
  }

  /**
   * 处理数据
   */
  private static processData(
    data: GameData[],
    fields: (keyof GameData)[],
    fieldLabels: Record<keyof GameData, string>
  ): any[] {
    return data.map(item => {
      const processedItem: any = {};
      
      fields.forEach(field => {
        let value = item[field];
        
        // 数据格式化
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'string') {
          value = value.trim();
        }
        
        processedItem[field] = value;
      });
      
      return processedItem;
    });
  }

  /**
   * 获取所有字段
   */
  private static getAllFields(): (keyof GameData)[] {
    return [
      'gameName',
      'mainKeyword',
      'longTailKeywords',
      'videoLink',
      'internalLinks',
      'competitorPages',
      'iconUrl',
      'realUrl'
    ];
  }

  /**
   * 生成文件名
   */
  private static generateFilename(format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const extensions = {
      csv: 'csv',
      json: 'json',
      excel: 'xlsx'
    };
    
    return `game-data-${timestamp}.${extensions[format]}`;
  }

  /**
   * 获取默认字段标题
   */
  static getDefaultFieldLabels(): Record<keyof GameData, string> {
    return {
      gameName: '游戏名称',
      mainKeyword: '主关键词',
      longTailKeywords: '长尾关键词',
      videoLink: '视频链接',
      internalLinks: '内部链接',
      competitorPages: '竞品页面',
      iconUrl: '图标地址',
      realUrl: '游戏地址'
    };
  }

  /**
   * 验证导出配置
   */
  static validateConfig(config: ExportConfig): string[] {
    const errors: string[] = [];

    if (!config.format) {
      errors.push('导出格式不能为空');
    }

    if (config.format && !['csv', 'json', 'excel'].includes(config.format)) {
      errors.push('不支持的导出格式');
    }

    if (config.fields && config.fields.length === 0) {
      errors.push('至少需要选择一个字段');
    }

    if (config.filename && !/^[^<>:"/\\|?*]+$/.test(config.filename)) {
      errors.push('文件名包含非法字符');
    }

    return errors;
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default DataExportService; 