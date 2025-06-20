/**
 * 数据导入导出组件
 * 功能特性：
 * - 竞品数据导入导出
 * - 格式验证和转换
 * - 批量操作
 * - 进度监控
 */

import React, { useState, useCallback, useRef } from 'react';
import { CompetitorDatabaseService } from '../../services';

/**
 * 导入导出格式
 */
export type ExportFormat = 'json' | 'csv' | 'excel';

/**
 * 导入结果
 */
interface ImportResult {
  success: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: string[];
  warnings: string[];
  duplicates: number;
  newRecords: number;
  updatedRecords: number;
}

/**
 * 导出配置
 */
interface ExportConfig {
  format: ExportFormat;
  includeMetadata: boolean;
  filterCriteria: {
    sources: string[];
    qualityScoreMin: number;
    categories: string[];
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
  };
  fields: string[];
}

/**
 * 数据导入导出组件
 */
export const DataImportExport: React.FC = () => {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'json',
    includeMetadata: true,
    filterCriteria: {
      sources: [],
      qualityScoreMin: 0,
      categories: [],
      dateRange: {
        start: null,
        end: null
      }
    },
    fields: ['id', 'title', 'description', 'category', 'tags', 'source', 'originalUrl', 'qualityScore']
  });

  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const competitorServiceRef = useRef<CompetitorDatabaseService>();

  // 初始化服务
  const initializeService = useCallback(() => {
    if (!competitorServiceRef.current) {
      competitorServiceRef.current = new CompetitorDatabaseService();
    }
  }, []);

  /**
   * 加载可用的来源和分类
   */
  const loadMetadata = useCallback(async () => {
    try {
      initializeService();
      const games = await competitorServiceRef.current!.getAllGames();
      
      const sources = [...new Set(games.map(g => g.source).filter(Boolean))];
      const categories = [...new Set(games.map(g => g.category).filter(Boolean))];
      
      setAvailableSources(sources);
      setAvailableCategories(categories);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  }, [initializeService]);

  /**
   * 处理文件导入
   */
  const handleFileImport = useCallback(async (file: File) => {
    setIsImporting(true);
    setError(null);
    setImportProgress(0);

    try {
      initializeService();
      
      const fileContent = await readFileContent(file);
      let data: any[];

      // 根据文件类型解析
      if (file.name.endsWith('.json')) {
        data = JSON.parse(fileContent);
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(fileContent);
      } else {
        throw new Error('不支持的文件格式，请使用 JSON 或 CSV 文件');
      }

      // 验证数据格式
      const validationResult = validateImportData(data);
      if (!validationResult.valid) {
        throw new Error(`数据格式验证失败: ${validationResult.errors.join(', ')}`);
      }

      // 执行导入
      const result = await importGameData(data);
      setImportResult(result);

    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [initializeService]);

  /**
   * 读取文件内容
   */
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  };

  /**
   * 解析CSV文件
   */
  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV文件格式无效');

    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const rows = lines.slice(1);

    return rows.map(row => {
      const values = row.split(',').map(v => v.trim().replace(/['"]/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  /**
   * 验证导入数据
   */
  const validateImportData = (data: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('数据必须是数组格式');
      return { valid: false, errors };
    }

    if (data.length === 0) {
      errors.push('数据不能为空');
      return { valid: false, errors };
    }

    // 检查必需字段
    const requiredFields = ['title'];
    const firstRecord = data[0];
    
    for (const field of requiredFields) {
      if (!firstRecord.hasOwnProperty(field)) {
        errors.push(`缺少必需字段: ${field}`);
      }
    }

    // 检查数据类型
    data.forEach((record, index) => {
      if (index > 10) return; // 只检查前10条

      if (typeof record.title !== 'string' || !record.title.trim()) {
        errors.push(`第${index + 1}行: title字段必须是非空字符串`);
      }

      if (record.qualityScore && (typeof record.qualityScore !== 'number' || record.qualityScore < 0 || record.qualityScore > 100)) {
        errors.push(`第${index + 1}行: qualityScore必须是0-100之间的数字`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  /**
   * 导入游戏数据
   */
  const importGameData = async (data: any[]): Promise<ImportResult> => {
    const existingGames = await competitorServiceRef.current!.getAllGames();
    const existingTitles = new Set(existingGames.map(g => g.title));
    
    let validRecords = 0;
    let invalidRecords = 0;
    let duplicates = 0;
    let newRecords = 0;
    let updatedRecords = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      try {
        setImportProgress((i / data.length) * 100);
        
        const record = data[i];
        
        // 验证单条记录
        if (!record.title || typeof record.title !== 'string') {
          invalidRecords++;
          errors.push(`第${i + 1}行: 标题无效`);
          continue;
        }

        // 检查重复
        if (existingTitles.has(record.title)) {
          duplicates++;
          
          // 更新现有记录
          const existingGame = existingGames.find(g => g.title === record.title);
          if (existingGame) {
            const updatedGame = {
              ...existingGame,
              ...record,
              id: existingGame.id,
              lastUpdated: new Date().toISOString()
            };
            await competitorServiceRef.current!.updateGame(updatedGame);
            updatedRecords++;
          }
        } else {
          // 添加新记录
          const gameData = {
            id: `import_${Date.now()}_${i}`,
            title: record.title,
            description: record.description || '',
            category: record.category || 'unknown',
            tags: record.tags ? (Array.isArray(record.tags) ? record.tags : record.tags.split(',')) : [],
            source: record.source || 'imported',
            originalUrl: record.originalUrl || '',
            qualityScore: record.qualityScore || 50,
            lastUpdated: new Date().toISOString(),
            metadata: {
              imported: true,
              importTime: new Date().toISOString(),
              ...record.metadata
            }
          };

          await competitorServiceRef.current!.addGame(gameData);
          newRecords++;
          existingTitles.add(record.title);
        }

        validRecords++;

      } catch (err) {
        invalidRecords++;
        errors.push(`第${i + 1}行: ${err instanceof Error ? err.message : '处理失败'}`);
      }
    }

    return {
      success: validRecords > 0,
      totalRecords: data.length,
      validRecords,
      invalidRecords,
      errors,
      warnings,
      duplicates,
      newRecords,
      updatedRecords
    };
  };

  /**
   * 执行数据导出
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    setExportProgress(0);

    try {
      initializeService();
      
      // 获取所有游戏数据
      const allGames = await competitorServiceRef.current!.getAllGames();
      setExportProgress(20);

      // 应用过滤条件
      let filteredGames = allGames;

      // 来源过滤
      if (exportConfig.filterCriteria.sources.length > 0) {
        filteredGames = filteredGames.filter(game => 
          exportConfig.filterCriteria.sources.includes(game.source)
        );
      }

      // 质量评分过滤
      if (exportConfig.filterCriteria.qualityScoreMin > 0) {
        filteredGames = filteredGames.filter(game => 
          game.qualityScore >= exportConfig.filterCriteria.qualityScoreMin
        );
      }

      // 分类过滤
      if (exportConfig.filterCriteria.categories.length > 0) {
        filteredGames = filteredGames.filter(game => 
          exportConfig.filterCriteria.categories.includes(game.category)
        );
      }

      // 日期范围过滤
      if (exportConfig.filterCriteria.dateRange.start || exportConfig.filterCriteria.dateRange.end) {
        filteredGames = filteredGames.filter(game => {
          const gameDate = new Date(game.lastUpdated);
          const start = exportConfig.filterCriteria.dateRange.start;
          const end = exportConfig.filterCriteria.dateRange.end;
          
          if (start && gameDate < start) return false;
          if (end && gameDate > end) return false;
          return true;
        });
      }

      setExportProgress(50);

      // 字段选择
      const exportData = filteredGames.map(game => {
        const filtered: any = {};
        exportConfig.fields.forEach(field => {
          if (game.hasOwnProperty(field)) {
            filtered[field] = (game as any)[field];
          }
        });

        // 包含元数据
        if (exportConfig.includeMetadata && game.metadata) {
          filtered.metadata = game.metadata;
        }

        return filtered;
      });

      setExportProgress(80);

      // 生成文件并下载
      await downloadData(exportData, exportConfig.format);
      setExportProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportConfig, initializeService]);

  /**
   * 下载数据
   */
  const downloadData = async (data: any[], format: ExportFormat) => {
    let content: string;
    let filename: string;
    let mimeType: string;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `competitor-data-${timestamp}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        content = convertToCSV(data);
        filename = `competitor-data-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;

      case 'excel':
        // 简化的Excel导出(使用CSV格式，Excel可以打开)
        content = convertToCSV(data);
        filename = `competitor-data-${timestamp}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      default:
        throw new Error('不支持的导出格式');
    }

    // 创建下载链接
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * 转换为CSV格式
   */
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        let value = row[header];
        
        // 处理特殊值
        if (value === null || value === undefined) {
          value = '';
        } else if (Array.isArray(value)) {
          value = value.join(';');
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        } else {
          value = String(value);
        }

        // 转义CSV特殊字符
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  };

  /**
   * 清除导入结果
   */
  const clearImportResult = useCallback(() => {
    setImportResult(null);
    setError(null);
  }, []);

  // 组件挂载时加载元数据
  React.useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  return (
    <div className="space-y-6">
      {/* 数据导入 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">数据导入</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择文件
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileImport(file);
                }
              }}
              disabled={isImporting}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              支持 JSON 和 CSV 格式文件
            </p>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>导入进度</span>
                <span>{importProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 导入结果 */}
          {importResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">导入结果</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">总记录数:</span>
                  <p className="font-medium">{importResult.totalRecords}</p>
                </div>
                <div>
                  <span className="text-gray-600">有效记录:</span>
                  <p className="font-medium text-green-600">{importResult.validRecords}</p>
                </div>
                <div>
                  <span className="text-gray-600">新增记录:</span>
                  <p className="font-medium text-blue-600">{importResult.newRecords}</p>
                </div>
                <div>
                  <span className="text-gray-600">更新记录:</span>
                  <p className="font-medium text-yellow-600">{importResult.updatedRecords}</p>
                </div>
                <div>
                  <span className="text-gray-600">重复记录:</span>
                  <p className="font-medium text-orange-600">{importResult.duplicates}</p>
                </div>
                <div>
                  <span className="text-gray-600">无效记录:</span>
                  <p className="font-medium text-red-600">{importResult.invalidRecords}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">错误信息:</h4>
                  <div className="max-h-32 overflow-y-auto text-sm text-red-700">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <p key={index}>• {error}</p>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p>... 还有 {importResult.errors.length - 10} 个错误</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={clearImportResult}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  清除结果
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 数据导出 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">数据导出</h2>
        
        <div className="space-y-6">
          {/* 导出格式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              导出格式
            </label>
            <div className="flex space-x-4">
              {['json', 'csv', 'excel'].map((format) => (
                <label key={format} className="flex items-center">
                  <input
                    type="radio"
                    value={format}
                    checked={exportConfig.format === format}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      format: e.target.value as ExportFormat
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 uppercase">{format}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 过滤条件 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">过滤条件</h3>
            
            {/* 来源过滤 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                来源网站
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableSources.map(source => (
                  <label key={source} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportConfig.filterCriteria.sources.includes(source)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportConfig(prev => ({
                            ...prev,
                            filterCriteria: {
                              ...prev.filterCriteria,
                              sources: [...prev.filterCriteria.sources, source]
                            }
                          }));
                        } else {
                          setExportConfig(prev => ({
                            ...prev,
                            filterCriteria: {
                              ...prev.filterCriteria,
                              sources: prev.filterCriteria.sources.filter(s => s !== source)
                            }
                          }));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{source}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 质量评分过滤 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最低质量评分: {exportConfig.filterCriteria.qualityScoreMin}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={exportConfig.filterCriteria.qualityScoreMin}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  filterCriteria: {
                    ...prev.filterCriteria,
                    qualityScoreMin: parseInt(e.target.value)
                  }
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* 分类过滤 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                游戏分类
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableCategories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportConfig.filterCriteria.categories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportConfig(prev => ({
                            ...prev,
                            filterCriteria: {
                              ...prev.filterCriteria,
                              categories: [...prev.filterCriteria.categories, category]
                            }
                          }));
                        } else {
                          setExportConfig(prev => ({
                            ...prev,
                            filterCriteria: {
                              ...prev.filterCriteria,
                              categories: prev.filterCriteria.categories.filter(c => c !== category)
                            }
                          }));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 字段选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              导出字段
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['id', 'title', 'description', 'category', 'tags', 'source', 'originalUrl', 'qualityScore', 'lastUpdated'].map(field => (
                <label key={field} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.fields.includes(field)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExportConfig(prev => ({
                          ...prev,
                          fields: [...prev.fields, field]
                        }));
                      } else {
                        setExportConfig(prev => ({
                          ...prev,
                          fields: prev.fields.filter(f => f !== field)
                        }));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{field}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 其他选项 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportConfig.includeMetadata}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  includeMetadata: e.target.checked
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">包含元数据</span>
            </label>
          </div>

          {/* 导出进度 */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>导出进度</span>
                <span>{exportProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 导出按钮 */}
          <div className="flex space-x-4">
            <button
              onClick={handleExport}
              disabled={isExporting || exportConfig.fields.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  导出中...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  开始导出
                </>
              )}
            </button>

            <button
              onClick={loadMetadata}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              刷新数据
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">操作失败</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImportExport; 