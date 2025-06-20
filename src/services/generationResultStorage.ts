/**
 * AI生成结果本地存储服务 - 提供生成结果的历史存储和管理
 */

import { GenerationResult } from '@/types/GenerationResult.types';
import { localStorageService, LOCAL_STORAGE_KEYS, StorageResult } from './localStorage';

/**
 * 生成结果存储操作结果
 */
export interface GenerationResultStorageResult<T = any> extends StorageResult<T> {
  resultId?: string;
}

/**
 * 生成结果查询选项
 */
export interface GenerationResultQueryOptions {
  workflowId?: string;
  status?: 'pending' | 'completed' | 'failed';
  type?: 'seo_content' | 'structured_data' | 'meta_tags';
  sortBy?: 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: string;
  dateRange?: {
    start?: number;
    end?: number;
  };
}

/**
 * 生成结果历史统计
 */
export interface GenerationResultStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byWorkflow: Record<string, number>;
  storageSize: number; // 字节
  oldestResult: number;
  newestResult: number;
  averageProcessingTime: number;
  successRate: number;
}

/**
 * 历史配置
 */
export interface HistoryConfig {
  maxEntries: number;
  maxAge: number; // 毫秒
  autoCleanup: boolean;
  compressionThreshold: number; // 字节
}

/**
 * 生成结果本地存储服务类
 */
export class GenerationResultStorageService {
  private storageKey = LOCAL_STORAGE_KEYS.GENERATION_RESULTS;
  private historyConfig: HistoryConfig = {
    maxEntries: 500,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    autoCleanup: true,
    compressionThreshold: 1024 * 1024, // 1MB
  };

  /**
   * 获取所有生成结果
   */
  private getAllResults(): StorageResult<Record<string, GenerationResult>> {
    const result = localStorageService.get<Record<string, GenerationResult>>(this.storageKey);
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
   * 保存所有生成结果
   */
  private saveAllResults(results: Record<string, GenerationResult>): StorageResult<Record<string, GenerationResult>> {
    return localStorageService.set(this.storageKey, results);
  }

  /**
   * 生成结果ID
   */
  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证生成结果数据
   */
  private validateResult(result: Partial<GenerationResult>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!result.workflowId || typeof result.workflowId !== 'string') {
      errors.push('工作流ID不能为空');
    }

    if (!result.prompt || typeof result.prompt !== 'string') {
      errors.push('生成提示不能为空');
    }

    if (!result.status || !['pending', 'completed', 'failed'].includes(result.status)) {
      errors.push('状态必须是 pending、completed 或 failed');
    }

    if (result.type && !['seo_content', 'structured_data', 'meta_tags'].includes(result.type)) {
      errors.push('类型必须是 seo_content、structured_data 或 meta_tags');
    }

    if (result.processingTime && (typeof result.processingTime !== 'number' || result.processingTime < 0)) {
      errors.push('处理时间必须是非负数');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 压缩大型结果数据
   */
  private compressResult(result: GenerationResult): GenerationResult {
    if (JSON.stringify(result).length < this.historyConfig.compressionThreshold) {
      return result;
    }

    // 简化大型数据，保留关键信息
    const compressed = { ...result };
    
    if (compressed.result && typeof compressed.result === 'object') {
      compressed.result = {
        ...compressed.result,
        content: compressed.result.content ? 
          `${compressed.result.content.substring(0, 1000)}...` : 
          compressed.result.content,
      };
    }

    // 添加压缩标记
    compressed.metadata = {
      ...compressed.metadata,
      compressed: true,
      originalSize: JSON.stringify(result).length,
    };

    return compressed;
  }

  /**
   * 清理过期历史
   */
  private cleanupExpiredHistory(): GenerationResultStorageResult<number> {
    try {
      if (!this.historyConfig.autoCleanup) {
        return { success: true, data: 0 };
      }

      const allResultsResult = this.getAllResults();
      if (!allResultsResult.success) {
        return {
          success: false,
          error: `获取历史数据失败: ${allResultsResult.error}`,
        };
      }

      const allResults = allResultsResult.data!;
      const now = Date.now();
      const maxAge = this.historyConfig.maxAge;
      let cleanedCount = 0;

      // 清理过期数据
      Object.keys(allResults).forEach(key => {
        const result = allResults[key];
        if (result.createdAt && (now - result.createdAt) > maxAge) {
          delete allResults[key];
          cleanedCount++;
        }
      });

      // 如果清理了数据，保存回去
      if (cleanedCount > 0) {
        const saveResult = this.saveAllResults(allResults);
        if (!saveResult.success) {
          return {
            success: false,
            error: `保存清理后的数据失败: ${saveResult.error}`,
          };
        }
      }

      return {
        success: true,
        data: cleanedCount,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: `清理历史失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 限制历史条目数量
   */
  private limitHistoryEntries(): GenerationResultStorageResult<number> {
    try {
      const allResultsResult = this.getAllResults();
      if (!allResultsResult.success) {
        return {
          success: false,
          error: `获取历史数据失败: ${allResultsResult.error}`,
        };
      }

      const allResults = allResultsResult.data!;
      const entries = Object.entries(allResults);
      
      if (entries.length <= this.historyConfig.maxEntries) {
        return { success: true, data: 0 };
      }

      // 按创建时间排序，保留最新的条目
      entries.sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
      
      const toKeep = entries.slice(0, this.historyConfig.maxEntries);
      const removedCount = entries.length - toKeep.length;
      
      const newResults: Record<string, GenerationResult> = {};
      toKeep.forEach(([key, value]) => {
        newResults[key] = value;
      });

      const saveResult = this.saveAllResults(newResults);
      if (!saveResult.success) {
        return {
          success: false,
          error: `保存限制后的数据失败: ${saveResult.error}`,
        };
      }

      return {
        success: true,
        data: removedCount,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: `限制历史条目失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 设置历史配置
   */
  public setHistoryConfig(config: Partial<HistoryConfig>): void {
    this.historyConfig = { ...this.historyConfig, ...config };
  }

  /**
   * 获取历史配置
   */
  public getHistoryConfig(): HistoryConfig {
    return { ...this.historyConfig };
  }

  /**
   * 保存生成结果
   */
  public save(resultData: Omit<GenerationResult, 'id' | 'createdAt' | 'updatedAt'>): GenerationResultStorageResult<GenerationResult> {
    try {
      // 验证数据
      const validation = this.validateResult(resultData);
      if (!validation.valid) {
        return {
          success: false,
          error: `数据验证失败: ${validation.errors.join(', ')}`,
        };
      }

      // 清理过期历史
      this.cleanupExpiredHistory();

      // 获取现有数据
      const allResultsResult = this.getAllResults();
      if (!allResultsResult.success) {
        return {
          success: false,
          error: `获取现有数据失败: ${allResultsResult.error}`,
        };
      }

      const allResults = allResultsResult.data!;

      // 创建新的生成结果
      const now = Date.now();
      const resultId = this.generateResultId();
      
      let newResult: GenerationResult = {
        id: resultId,
        workflowId: resultData.workflowId,
        prompt: resultData.prompt,
        gameData: resultData.gameData,
        result: resultData.result,
        status: resultData.status,
        type: resultData.type,
        error: resultData.error,
        processingTime: resultData.processingTime,
        tokensUsed: resultData.tokensUsed,
        metadata: resultData.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      // 压缩大型结果
      newResult = this.compressResult(newResult);

      // 保存数据
      allResults[resultId] = newResult;
      const saveResult = this.saveAllResults(allResults);

      if (!saveResult.success) {
        return {
          success: false,
          error: `保存失败: ${saveResult.error}`,
        };
      }

      // 限制历史条目数量
      this.limitHistoryEntries();

      return {
        success: true,
        data: newResult,
        resultId,
        timestamp: now,
      };
    } catch (error) {
      return {
        success: false,
        error: `保存失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 根据ID获取生成结果
   */
  public getById(id: string): GenerationResultStorageResult<GenerationResult> {
    try {
      const allResultsResult = this.getAllResults();
      if (!allResultsResult.success) {
        return {
          success: false,
          error: `获取数据失败: ${allResultsResult.error}`,
        };
      }

      const result = allResultsResult.data![id];
      if (!result) {
        return {
          success: false,
          error: '生成结果不存在',
        };
      }

      return {
        success: true,
        data: result,
        resultId: id,
        timestamp: allResultsResult.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: `获取失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取所有生成结果（支持查询和分页）
   */
  public getAll(options: GenerationResultQueryOptions = {}): GenerationResultStorageResult<GenerationResult[]> {
    try {
      // 清理过期历史
      this.cleanupExpiredHistory();

      const allResultsResult = this.getAllResults();
      if (!allResultsResult.success) {
        return {
          success: false,
          error: `获取数据失败: ${allResultsResult.error}`,
        };
      }

      let resultList = Object.values(allResultsResult.data!);

      // 应用筛选
      if (options.workflowId) {
        resultList = resultList.filter(result => result.workflowId === options.workflowId);
      }

      if (options.status) {
        resultList = resultList.filter(result => result.status === options.status);
      }

      if (options.type) {
        resultList = resultList.filter(result => result.type === options.type);
      }

      if (options.search) {
        const searchLower = options.search.toLowerCase();
        resultList = resultList.filter(result =>
          result.prompt.toLowerCase().includes(searchLower) ||
          result.error?.toLowerCase().includes(searchLower) ||
          JSON.stringify(result.result).toLowerCase().includes(searchLower)
        );
      }

      if (options.dateRange) {
        const { start, end } = options.dateRange;
        resultList = resultList.filter(result => {
          const createdAt = result.createdAt || 0;
          return (!start || createdAt >= start) && (!end || createdAt <= end);
        });
      }

      // 应用排序
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'desc';
      
      resultList.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'updatedAt':
            aValue = a.updatedAt || 0;
            bValue = b.updatedAt || 0;
            break;
          case 'createdAt':
          default:
            aValue = a.createdAt || 0;
            bValue = b.createdAt || 0;
            break;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      // 应用分页
      if (options.offset || options.limit) {
        const offset = options.offset || 0;
        const limit = options.limit || resultList.length;
        resultList = resultList.slice(offset, offset + limit);
      }

      return {
        success: true,
        data: resultList,
        timestamp: allResultsResult.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: `获取列表失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 更新生成结果
   */
  public update(id: string, updateData: Partial<Omit<GenerationResult, 'id' | 'createdAt'>>): GenerationResultStorageResult<GenerationResult> {
    try {
      const allResultsResult = this.getAllResults();
      if (!allResultsResult.success) {
        return {
          success: false,
          error: `获取数据失败: ${allResultsResult.error}`,
        };
      }

      const allResults = allResultsResult.data!;
      
      if (!allResults[id]) {
        return {
          success: false,
          error: '生成结果不存在',
        };
      }

      // 验证更新数据
      const validation = this.validateResult({ ...allResults[id], ...updateData });
      if (!validation.valid) {
        return {
          success: false,
          error: `数据验证失败: ${validation.errors.join(', ')}`,
        };
      }

      // 更新数据
      const updatedResult: GenerationResult = {
        ...allResults[id],
        ...updateData,
        updatedAt: Date.now(),
      };

      // 压缩大型结果
      allResults[id] = this.compressResult(updatedResult);
      
      const saveResult = this.saveAllResults(allResults);
      if (!saveResult.success) {
        return {
          success: false,
          error: `保存失败: ${saveResult.error}`,
        };
      }

      return {
        success: true,
        data: allResults[id],
        resultId: id,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: `更新失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 删除生成结果
   */
  public delete(id: string): GenerationResultStorageResult<void> {
    try {
      const allResultsResult = this.getAllResults();
      if (!allResultsResult.success) {
        return {
          success: false,
          error: `获取数据失败: ${allResultsResult.error}`,
        };
      }

      const allResults = allResultsResult.data!;
      
      if (!allResults[id]) {
        return {
          success: false,
          error: '生成结果不存在',
        };
      }

      delete allResults[id];
      
      const saveResult = this.saveAllResults(allResults);
      if (!saveResult.success) {
        return {
          success: false,
          error: `保存失败: ${saveResult.error}`,
        };
      }

      return {
        success: true,
        resultId: id,
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
   * 批量删除生成结果
   */
  public batchDelete(ids: string[]): GenerationResultStorageResult<{ 
    successCount: number; 
    failureCount: number; 
    errors: string[];
  }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
    };

    for (const id of ids) {
      const deleteResult = this.delete(id);
      if (deleteResult.success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.errors.push(`${id}: ${deleteResult.error}`);
      }
    }

    return {
      success: result.failureCount === 0,
      data: result,
      timestamp: Date.now(),
    };
  }

  /**
   * 清空所有历史
   */
  public clear(): GenerationResultStorageResult<void> {
    try {
      const saveResult = this.saveAllResults({});
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
   * 获取历史统计信息
   */
  public getStats(): GenerationResultStorageResult<GenerationResultStats> {
    try {
      const allResultsResult = this.getAllResults();
      if (!allResultsResult.success) {
        return {
          success: false,
          error: `获取数据失败: ${allResultsResult.error}`,
        };
      }

      const allResults = allResultsResult.data!;
      const resultList = Object.values(allResults);

      // 统计状态
      const byStatus: Record<string, number> = {};
      const byType: Record<string, number> = {};
      const byWorkflow: Record<string, number> = {};
      let oldestResult = Date.now();
      let newestResult = 0;
      let totalProcessingTime = 0;
      let successCount = 0;

      resultList.forEach(result => {
        // 状态统计
        byStatus[result.status] = (byStatus[result.status] || 0) + 1;

        // 类型统计
        const type = result.type || '未知';
        byType[type] = (byType[type] || 0) + 1;

        // 工作流统计
        byWorkflow[result.workflowId] = (byWorkflow[result.workflowId] || 0) + 1;

        // 时间统计
        if (result.createdAt && result.createdAt < oldestResult) {
          oldestResult = result.createdAt;
        }
        if (result.updatedAt && result.updatedAt > newestResult) {
          newestResult = result.updatedAt;
        }

        // 处理时间统计
        if (result.processingTime) {
          totalProcessingTime += result.processingTime;
        }

        // 成功率统计
        if (result.status === 'completed') {
          successCount++;
        }
      });

      const stats: GenerationResultStats = {
        total: resultList.length,
        byStatus,
        byType,
        byWorkflow,
        storageSize: JSON.stringify(allResults).length,
        oldestResult: resultList.length > 0 ? oldestResult : 0,
        newestResult,
        averageProcessingTime: resultList.length > 0 ? totalProcessingTime / resultList.length : 0,
        successRate: resultList.length > 0 ? (successCount / resultList.length) * 100 : 0,
      };

      return {
        success: true,
        data: stats,
        timestamp: allResultsResult.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: `获取统计信息失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 导出历史数据
   */
  public exportHistory(): GenerationResultStorageResult<GenerationResult[]> {
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
   * 导入历史数据
   */
  public importHistory(results: GenerationResult[]): GenerationResultStorageResult<{ 
    successCount: number; 
    failureCount: number; 
    errors: string[];
  }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
    };

    for (const generationResult of results) {
      const { id, createdAt, updatedAt, ...dataToSave } = generationResult;
      const saveResult = this.save(dataToSave);
      
      if (saveResult.success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.errors.push(`${generationResult.id}: ${saveResult.error}`);
      }
    }

    return {
      success: result.failureCount === 0,
      data: result,
      timestamp: Date.now(),
    };
  }
}

/**
 * 默认的生成结果存储服务实例
 */
export const generationResultStorage = new GenerationResultStorageService(); 