/**
 * 统一的服务导出文件
 */

// 基础存储服务
export { localStorageService, LocalStorageService } from './localStorage';
export type { LocalStorageConfig, StorageItem, StorageResult } from './localStorage';

// Workflow存储服务
export { workflowStorage, WorkflowStorageService } from './workflowStorage';
export type { 
  WorkflowStorageResult, 
  WorkflowQueryOptions, 
  WorkflowStorageStats, 
  WorkflowBatchResult 
} from './workflowStorage';

// 游戏数据存储服务
export { gameDataStorage, GameDataStorageService } from './gameDataStorage';
export type { 
  GameDataStorageResult, 
  GameDataQueryOptions, 
  GameDataCacheStats 
} from './gameDataStorage';

// 生成结果存储服务
export { generationResultStorage, GenerationResultStorageService } from './generationResultStorage';
export type { 
  GenerationResultStorageResult, 
  GenerationResultQueryOptions, 
  GenerationResultStats 
} from './generationResultStorage';

/**
 * 数据迁移服务
 */
export class DataMigrationService {
  /**
   * 导出所有数据
   */
  public async exportAllData() {
    const data = {
      workflows: await workflowStorage.exportData(),
      gameData: await gameDataStorage.exportCache(),
      generationResults: await generationResultStorage.exportHistory(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    return data;
  }

  /**
   * 导入所有数据
   */
  public async importAllData(data: any) {
    const results = {
      workflows: { success: false, message: '' },
      gameData: { success: false, message: '' },
      generationResults: { success: false, message: '' },
    };

    // 导入工作流
    if (data.workflows?.data) {
      const result = workflowStorage.importData(data.workflows.data);
      results.workflows = {
        success: result.success,
        message: result.success 
          ? `成功导入 ${result.successCount} 个工作流` 
          : `导入失败: ${result.errors.join(', ')}`,
      };
    }

    // 导入游戏数据
    if (data.gameData?.data) {
      const result = gameDataStorage.importCache(data.gameData.data);
      results.gameData = {
        success: result.success,
        message: result.success 
          ? `成功导入 ${result.data?.successCount} 个游戏数据` 
          : `导入失败`,
      };
    }

    // 导入生成结果
    if (data.generationResults?.data) {
      const result = generationResultStorage.importHistory(data.generationResults.data);
      results.generationResults = {
        success: result.success,
        message: result.success 
          ? `成功导入 ${result.data?.successCount} 个生成结果` 
          : `导入失败`,
      };
    }

    return results;
  }

  /**
   * 清空所有数据
   */
  public async clearAllData() {
    const results = {
      workflows: workflowStorage.clear(),
      gameData: gameDataStorage.clear(),
      generationResults: generationResultStorage.clear(),
    };

    return results;
  }

  /**
   * 数据备份
   */
  public async createBackup(name?: string) {
    const backupName = name || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const data = await this.exportAllData();
    
    // 将备份存储到localStorage
    const backupResult = localStorageService.set(`backup_${backupName}`, data);
    
    return {
      success: backupResult.success,
      backupName,
      error: backupResult.error,
    };
  }

  /**
   * 恢复备份
   */
  public async restoreBackup(backupName: string) {
    const backupResult = localStorageService.get(`backup_${backupName}`);
    
    if (!backupResult.success) {
      return {
        success: false,
        error: '备份不存在或读取失败',
      };
    }

    const importResults = await this.importAllData(backupResult.data);
    
    return {
      success: Object.values(importResults).every(r => r.success),
      results: importResults,
    };
  }

  /**
   * 获取所有备份列表
   */
  public getBackupList() {
    const keys = localStorageService.getKeys();
    const backupKeys = keys.filter(key => key.startsWith('backup_'));
    
    return backupKeys.map(key => {
      const backupName = key.replace('backup_', '');
      const backup = localStorageService.get(key);
      
      return {
        name: backupName,
        createdAt: backup.data?.exportedAt || '',
        size: JSON.stringify(backup.data || {}).length,
      };
    });
  }

  /**
   * 删除备份
   */
  public deleteBackup(backupName: string) {
    return localStorageService.remove(`backup_${backupName}`);
  }
}

/**
 * 默认的数据迁移服务实例
 */
export const dataMigrationService = new DataMigrationService(); 