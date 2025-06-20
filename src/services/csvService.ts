/**
 * CSV处理服务 - 集成Papa Parse，实现CSV上传、解析、验证和数据处理
 */

import Papa from 'papaparse';
import { GameData } from '@/types/GameData.types';
import {
  CSVParseConfig,
  CSVFileInfo,
  CSVParseResult,
  CSVParseError,
  CSVFieldMapping,
  CSVValidationRule,
  CSVValidationResult,
  CSVValidationError,
  CSVValidationStats,
  CSVUploadProgress,
  CSVUploadStatus,
  CSVProcessConfig,
  CSVCleaningOptions,
  CSVLargeFileOptions,
  CSVExportConfig,
  CSVTemplate,
} from '@/types/CSV.types';

/**
 * CSV处理服务类
 */
export class CSVService {
  private maxFileSize = 50 * 1024 * 1024; // 50MB
  private allowedExtensions = ['.csv', '.txt'];
  private allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
  
  // 默认字段映射配置
  private defaultFieldMappings: CSVFieldMapping[] = [
    {
      csvColumn: 'name',
      targetField: 'name',
      required: true,
      type: 'string',
    },
    {
      csvColumn: 'url',
      targetField: 'url', 
      required: true,
      type: 'url',
      validate: this.validateUrl,
    },
    {
      csvColumn: 'category',
      targetField: 'category',
      required: false,
      type: 'string',
    },
    {
      csvColumn: 'platform',
      targetField: 'platform',
      required: false,
      type: 'string',
    },
    {
      csvColumn: 'description',
      targetField: 'description',
      required: false,
      type: 'string',
    },
    {
      csvColumn: 'imageUrl',
      targetField: 'imageUrl',
      required: false,
      type: 'url',
      validate: this.validateUrl,
    },
  ];

  /**
   * 验证文件格式和大小
   */
  public validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查文件扩展名
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      errors.push(`不支持的文件格式: ${extension}。支持的格式: ${this.allowedExtensions.join(', ')}`);
    }

    // 检查MIME类型
    if (!this.allowedMimeTypes.includes(file.type)) {
      errors.push(`不支持的文件类型: ${file.type}`);
    }

    // 检查文件大小
    if (file.size > this.maxFileSize) {
      const maxSizeMB = this.maxFileSize / (1024 * 1024);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      errors.push(`文件过大: ${fileSizeMB}MB。最大支持: ${maxSizeMB}MB`);
    }

    // 检查文件是否为空
    if (file.size === 0) {
      errors.push('文件为空');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取文件信息
   */
  public getFileInfo(file: File): CSVFileInfo {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
  }

  /**
   * 检测文件编码(简单实现)
   */
  public async detectEncoding(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer.slice(0, 1024)); // 读取前1KB
        
        // 简单的编码检测
        let hasHighBytes = false;
        for (let i = 0; i < bytes.length; i++) {
          if (bytes[i] > 127) {
            hasHighBytes = true;
            break;
          }
        }
        
        // UTF-8 BOM检测
        if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
          resolve('utf-8-bom');
        } else if (hasHighBytes) {
          resolve('utf-8');
        } else {
          resolve('ascii');
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 自动检测CSV分隔符
   */
  public detectDelimiter(sample: string): string {
    const delimiters = [',', ';', '\t', '|'];
    const lines = sample.split('\n').slice(0, 5); // 检查前5行
    
    let bestDelimiter = ',';
    let maxConsistency = 0;
    
    for (const delimiter of delimiters) {
      const columnCounts = lines.map(line => 
        line.split(delimiter).length
      ).filter(count => count > 1);
      
      if (columnCounts.length > 0) {
        // 计算一致性 - 相同列数的行数比例
        const mostCommonCount = columnCounts
          .sort((a, b) => 
            columnCounts.filter(v => v === b).length - 
            columnCounts.filter(v => v === a).length
          )[0];
        
        const consistency = columnCounts.filter(count => count === mostCommonCount).length / columnCounts.length;
        
        if (consistency > maxConsistency) {
          maxConsistency = consistency;
          bestDelimiter = delimiter;
        }
      }
    }
    
    return bestDelimiter;
  }

  /**
   * 解析CSV文件
   */
  public async parseCSV(
    file: File,
    config: Partial<CSVParseConfig> = {},
    onProgress?: (progress: CSVUploadProgress) => void
  ): Promise<CSVParseResult> {
    const startTime = Date.now();
    const fileInfo = this.getFileInfo(file);
    
    // 更新进度
    onProgress?.({
      status: 'parsing',
      progress: 0,
      message: '开始解析CSV文件...',
    });

    try {
      // 检测编码
      const encoding = await this.detectEncoding(file);
      fileInfo.encoding = encoding;

      // 读取文件样本来检测分隔符
      const sampleSize = Math.min(file.size, 1024 * 10); // 10KB样本
      const sampleBlob = file.slice(0, sampleSize);
      const sampleText = await this.readFileAsText(sampleBlob);
      
      // 自动检测分隔符
      const detectedDelimiter = this.detectDelimiter(sampleText);
      
      // 合并配置
      const parseConfig: Papa.ParseConfig = {
        header: config.header ?? true,
        skipEmptyLines: config.skipEmptyLines ?? true,
        delimiter: config.delimiter || detectedDelimiter,
        dynamicTyping: config.dynamicTyping ?? false,
        encoding: encoding,
        preview: config.preview || 0,
        step: (results: Papa.ParseStepResult<any>, parser: Papa.Parser) => {
          if (onProgress) {
            const progress = Math.min((parser.streamer._input.length / file.size) * 100, 99);
            onProgress({
              status: 'parsing',
              progress,
              message: `正在解析... ${Math.round(progress)}%`,
              processedRows: results.meta.cursor,
            });
          }
        },
        complete: (results: Papa.ParseResult<any>) => {
          onProgress?.({
            status: 'completed',
            progress: 100,
            message: '解析完成',
            processedRows: results.data.length,
            totalRows: results.data.length,
          });
        },
        error: (error: Papa.ParseError) => {
          onProgress?.({
            status: 'error',
            progress: 0,
            message: `解析错误: ${error.message}`,
          });
        },
      };

      return new Promise((resolve) => {
        Papa.parse(file, {
          ...parseConfig,
          complete: (results: Papa.ParseResult<any>) => {
            const parseTime = Date.now() - startTime;
            
            // 处理解析结果
            const csvResult: CSVParseResult = {
              success: results.errors.length === 0,
              data: results.data,
              headers: results.meta.fields || [],
              errors: this.transformPapaParseErrors(results.errors),
              warnings: [],
              meta: {
                ...results.meta,
                parseTime,
                detectedEncoding: encoding,
              },
              fileInfo: {
                ...fileInfo,
                lineCount: results.data.length,
                columnCount: results.meta.fields?.length || 0,
              },
            };

            // 添加数据质量警告
            csvResult.warnings = this.analyzeDataQuality(results.data, csvResult.headers);

            resolve(csvResult);
          },
        });
      });
    } catch (error) {
      return {
        success: false,
        data: [],
        headers: [],
        errors: [{
          type: 'format',
          message: `解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
        }],
        warnings: [],
        meta: {
          linebreak: '',
          delimiter: '',
          truncated: false,
          cursor: 0,
          parseTime: Date.now() - startTime,
        },
        fileInfo,
      };
    }
  }

  /**
   * 转换Papa Parse错误格式
   */
  private transformPapaParseErrors(errors: Papa.ParseError[]): CSVParseError[] {
    return errors.map(error => ({
      type: this.mapErrorType(error.type),
      message: error.message,
      row: error.row,
      suggestion: this.generateErrorSuggestion(error),
    }));
  }

  /**
   * 映射错误类型
   */
  private mapErrorType(papaErrorType: string): CSVParseError['type'] {
    const errorTypeMap: Record<string, CSVParseError['type']> = {
      'Delimiter': 'delimiter',
      'Quote': 'format',
      'InvalidQuotes': 'format',
      'FieldMismatch': 'data',
    };
    return errorTypeMap[papaErrorType] || 'format';
  }

  /**
   * 生成错误修复建议
   */
  private generateErrorSuggestion(error: Papa.ParseError): string {
    switch (error.type) {
      case 'Delimiter':
        return '尝试使用不同的分隔符，如逗号、分号或制表符';
      case 'Quote':
        return '检查引号是否正确配对';
      case 'FieldMismatch':
        return '确保每行的字段数量一致';
      default:
        return '检查数据格式是否正确';
    }
  }

  /**
   * 分析数据质量
   */
  private analyzeDataQuality(data: any[], headers: string[]): string[] {
    const warnings: string[] = [];
    
    if (data.length === 0) {
      warnings.push('文件中没有数据行');
      return warnings;
    }

    // 检查空值比例
    for (const header of headers) {
      const emptyCount = data.filter(row => !row[header] || row[header].toString().trim() === '').length;
      const emptyRatio = emptyCount / data.length;
      
      if (emptyRatio > 0.5) {
        warnings.push(`字段 "${header}" 有 ${Math.round(emptyRatio * 100)}% 的值为空`);
      }
    }

    // 检查重复行
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    if (uniqueRows.size < data.length) {
      warnings.push(`检测到 ${data.length - uniqueRows.size} 行重复数据`);
    }

    return warnings;
  }

  /**
   * 验证CSV数据
   */
  public validateCSVData(
    data: any[],
    fieldMappings: CSVFieldMapping[] = this.defaultFieldMappings,
    validationRules: CSVValidationRule[] = []
  ): CSVValidationResult {
    const errors: CSVValidationError[] = [];
    const warnings: string[] = [];
    const validData: GameData[] = [];
    
    // 初始化统计信息
    const stats: CSVValidationStats = {
      totalRows: data.length,
      validRows: 0,
      errorRows: 0,
      warningRows: 0,
      fieldStats: {},
    };

    // 初始化字段统计
    fieldMappings.forEach(mapping => {
      stats.fieldStats[mapping.targetField] = {
        filled: 0,
        empty: 0,
        errors: 0,
      };
    });

    // 验证每一行数据
    data.forEach((row, index) => {
      const rowErrors: CSVValidationError[] = [];
      const gameData: Partial<GameData> = {};
      
      // 应用字段映射和验证
      fieldMappings.forEach(mapping => {
        const value = row[mapping.csvColumn];
        const fieldStats = stats.fieldStats[mapping.targetField];
        
        // 统计空值
        if (!value || value.toString().trim() === '') {
          fieldStats.empty++;
          
          if (mapping.required) {
            rowErrors.push({
              row: index + 1,
              field: mapping.targetField,
              value,
              type: 'required',
              message: `必填字段 "${mapping.targetField}" 不能为空`,
              suggestion: '请提供有效值',
            });
            fieldStats.errors++;
          } else if (mapping.defaultValue !== undefined) {
            gameData[mapping.targetField] = mapping.defaultValue;
            fieldStats.filled++;
          }
          return;
        }

        fieldStats.filled++;

        // 应用转换函数
        let transformedValue = value;
        if (mapping.transform) {
          try {
            transformedValue = mapping.transform(value);
          } catch (error) {
            rowErrors.push({
              row: index + 1,
              field: mapping.targetField,
              value,
              type: 'transform',
              message: `字段转换失败: ${error instanceof Error ? error.message : '未知错误'}`,
              suggestion: '检查数据格式是否正确',
            });
            fieldStats.errors++;
            return;
          }
        }

        // 应用验证函数
        if (mapping.validate) {
          const validationResult = mapping.validate(transformedValue);
          if (validationResult !== true) {
            const errorMessage = typeof validationResult === 'string' ? validationResult : `字段 "${mapping.targetField}" 验证失败`;
            rowErrors.push({
              row: index + 1,
              field: mapping.targetField,
              value: transformedValue,
              type: 'validation',
              message: errorMessage,
              suggestion: this.getValidationSuggestion(mapping.type),
            });
            fieldStats.errors++;
            return;
          }
        }

        // 类型转换和验证
        const typeValidationResult = this.validateFieldType(transformedValue, mapping.type);
        if (!typeValidationResult.valid) {
          rowErrors.push({
            row: index + 1,
            field: mapping.targetField,
            value: transformedValue,
            type: 'type',
            message: typeValidationResult.error || `字段类型错误，期望 ${mapping.type}`,
            suggestion: this.getValidationSuggestion(mapping.type),
          });
          fieldStats.errors++;
          return;
        }

        gameData[mapping.targetField] = typeValidationResult.value;
      });

      // 应用自定义验证规则
      validationRules.forEach(rule => {
        const fieldValue = gameData[rule.field as keyof GameData];
        let isValid = true;
        let errorMessage = rule.message;

        if (rule.validator) {
          const result = rule.validator(fieldValue, gameData);
          if (result !== true) {
            isValid = false;
            errorMessage = typeof result === 'string' ? result : rule.message;
          }
        } else {
          isValid = this.applyValidationRule(fieldValue, rule);
        }

        if (!isValid) {
          rowErrors.push({
            row: index + 1,
            field: rule.field,
            value: fieldValue,
            type: rule.type,
            message: errorMessage,
            suggestion: this.getRuleSuggestion(rule.type),
          });
        }
      });

      // 统计结果
      if (rowErrors.length > 0) {
        stats.errorRows++;
        errors.push(...rowErrors);
      } else {
        stats.validRows++;
        validData.push(gameData as GameData);
      }
    });

    return {
      valid: errors.length === 0,
      data: validData,
      errors,
      warnings,
      stats,
    };
  }

  /**
   * 字段类型验证和转换
   */
  private validateFieldType(value: any, type: CSVFieldMapping['type']): { valid: boolean; value?: any; error?: string } {
    const strValue = value?.toString().trim();
    
    switch (type) {
      case 'string':
        return { valid: true, value: strValue };
        
      case 'number':
        const numValue = Number(strValue);
        if (isNaN(numValue)) {
          return { valid: false, error: '不是有效的数字' };
        }
        return { valid: true, value: numValue };
        
      case 'boolean':
        const lowerValue = strValue.toLowerCase();
        if (['true', '1', 'yes', '是', '真'].includes(lowerValue)) {
          return { valid: true, value: true };
        } else if (['false', '0', 'no', '否', '假'].includes(lowerValue)) {
          return { valid: true, value: false };
        }
        return { valid: false, error: '不是有效的布尔值' };
        
      case 'date':
        const dateValue = new Date(strValue);
        if (isNaN(dateValue.getTime())) {
          return { valid: false, error: '不是有效的日期格式' };
        }
        return { valid: true, value: dateValue };
        
      case 'url':
        try {
          new URL(strValue);
          return { valid: true, value: strValue };
        } catch {
          return { valid: false, error: '不是有效的URL格式' };
        }
        
      case 'array':
        try {
          const arrayValue = JSON.parse(strValue);
          if (!Array.isArray(arrayValue)) {
            return { valid: false, error: '不是有效的数组格式' };
          }
          return { valid: true, value: arrayValue };
        } catch {
          // 尝试用逗号分割
          const arrayValue = strValue.split(',').map(item => item.trim());
          return { valid: true, value: arrayValue };
        }
        
      default:
        return { valid: true, value: strValue };
    }
  }

  /**
   * URL验证函数
   */
  private validateUrl = (value: any): boolean | string => {
    if (!value) return true; // 可选字段
    
    try {
      const url = new URL(value.toString());
      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'URL必须使用http或https协议';
      }
      return true;
    } catch {
      return '不是有效的URL格式';
    }
  };

  /**
   * 应用验证规则
   */
  private applyValidationRule(value: any, rule: CSVValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value !== null && value !== undefined && value.toString().trim() !== '';
        
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
        
      case 'number':
        return !isNaN(Number(value));
        
      case 'length':
        const length = value?.toString().length || 0;
        if (rule.params?.min && length < rule.params.min) return false;
        if (rule.params?.max && length > rule.params.max) return false;
        return true;
        
      case 'pattern':
        if (!rule.params?.pattern) return true;
        const regex = new RegExp(rule.params.pattern);
        return regex.test(value);
        
      default:
        return true;
    }
  }

  /**
   * 获取验证建议
   */
  private getValidationSuggestion(type: CSVFieldMapping['type']): string {
    const suggestions = {
      string: '请提供文本值',
      number: '请提供有效的数字',
      boolean: '请使用 true/false、1/0 或 是/否',
      date: '请使用标准日期格式，如 YYYY-MM-DD',
      url: '请提供完整的URL，如 https://example.com',
      array: '请使用JSON数组格式或逗号分隔的值',
    };
    return suggestions[type] || '请提供有效值';
  }

  /**
   * 获取规则建议
   */
  private getRuleSuggestion(type: CSVValidationRule['type']): string {
    const suggestions = {
      required: '此字段为必填项',
      url: '请提供有效的URL地址',
      email: '请提供有效的邮箱地址',
      number: '请提供有效的数字',
      date: '请提供有效的日期',
      length: '字符长度不符合要求',
      pattern: '格式不符合要求',
      custom: '自定义验证失败',
    };
    return suggestions[type] || '验证失败';
  }

  /**
   * 读取文件为文本
   */
  private readFileAsText(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * 数据清洗
   */
  public cleanData(data: any[], options: CSVCleaningOptions = {}): any[] {
    let cleanedData = [...data];

    // 去除前后空格
    if (options.trimWhitespace !== false) {
      cleanedData = cleanedData.map(row => {
        const cleanedRow: any = {};
        Object.keys(row).forEach(key => {
          cleanedRow[key] = typeof row[key] === 'string' ? row[key].trim() : row[key];
        });
        return cleanedRow;
      });
    }

    // 移除空行
    if (options.removeEmptyRows !== false) {
      cleanedData = cleanedData.filter(row => {
        return Object.values(row).some(value => 
          value !== null && value !== undefined && value.toString().trim() !== ''
        );
      });
    }

    // 移除重复行
    if (options.removeDuplicates) {
      const seen = new Set();
      cleanedData = cleanedData.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    // 标准化URL格式
    if (options.normalizeUrls) {
      cleanedData = cleanedData.map(row => {
        const cleanedRow = { ...row };
        Object.keys(row).forEach(key => {
          if (key.toLowerCase().includes('url') && row[key]) {
            try {
              const url = new URL(row[key]);
              cleanedRow[key] = url.href;
            } catch {
              // 保持原值
            }
          }
        });
        return cleanedRow;
      });
    }

    return cleanedData;
  }

  /**
   * 导出CSV数据
   */
  public exportCSV(data: any[], config: CSVExportConfig = {}): string {
    const parseConfig: Papa.UnparseConfig = {
      delimiter: config.delimiter || ',',
      header: config.header !== false,
      newline: config.linebreak || '\n',
      quoteChar: '"',
      quotes: config.quoteAll || false,
      fields: config.fields,
    };

    return Papa.unparse(data, parseConfig);
  }

  /**
   * 下载CSV文件
   */
  public downloadCSV(data: any[], config: CSVExportConfig = {}): void {
    const csvContent = this.exportCSV(data, config);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = config.filename || `export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * 获取CSV模板
   */
  public getCSVTemplate(): CSVTemplate {
    return {
      id: 'default_game_template',
      name: '默认游戏数据模板',
      description: '标准的游戏数据CSV模板',
      fieldMappings: this.defaultFieldMappings,
      validationRules: [
        {
          field: 'name',
          type: 'required',
          message: '游戏名称不能为空',
        },
        {
          field: 'url',
          type: 'required',
          message: '游戏链接不能为空',
        },
        {
          field: 'url',
          type: 'url',
          message: '游戏链接格式不正确',
        },
      ],
      sampleData: [
        {
          name: '示例游戏1',
          url: 'https://example.com/game1',
          category: '动作游戏',
          platform: 'PC',
          description: '这是一个示例游戏描述',
          imageUrl: 'https://example.com/image1.jpg',
        },
        {
          name: '示例游戏2',
          url: 'https://example.com/game2',
          category: '策略游戏',
          platform: '手机',
          description: '这是另一个示例游戏描述',
          imageUrl: 'https://example.com/image2.jpg',
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSystem: true,
    };
  }

  /**
   * 生成CSV模板文件
   */
  public generateTemplateCSV(): void {
    const template = this.getCSVTemplate();
    this.downloadCSV(template.sampleData, {
      filename: 'game_data_template.csv',
      header: true,
    });
  }
}

// 导出服务实例
export const csvService = new CSVService(); 