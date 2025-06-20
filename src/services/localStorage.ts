/**
 * 本地存储服务 - 提供类型安全的localStorage操作
 */

/**
 * 本地存储键名常量
 */
export const LOCAL_STORAGE_KEYS = {
  WORKFLOWS: 'seo_workflows',
  GAME_DATA: 'seo_game_data',
  GENERATION_RESULTS: 'seo_generation_results',
  USER_PREFERENCES: 'seo_user_preferences',
  APP_STATE: 'seo_app_state',
} as const;

/**
 * 本地存储配置
 */
export interface LocalStorageConfig {
  prefix: string;
  version: string;
  enableCompression: boolean;
  enableEncryption: boolean;
  maxSize: number; // 单位: KB
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: LocalStorageConfig = {
  prefix: 'seo_content_tool',
  version: '1.0.0',
  enableCompression: false,
  enableEncryption: false,
  maxSize: 5120, // 5MB
};

/**
 * 存储项接口
 */
export interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  version: string;
  checksum?: string;
}

/**
 * 存储操作结果
 */
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

/**
 * 本地存储服务类
 */
export class LocalStorageService {
  private config: LocalStorageConfig;
  private isAvailable: boolean;

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isAvailable = this.checkAvailability();
  }

  /**
   * 检查localStorage是否可用
   */
  private checkAvailability(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('localStorage不可用:', error);
      return false;
    }
  }

  /**
   * 生成完整的存储键名
   */
  private getFullKey(key: string): string {
    return `${this.config.prefix}_${key}`;
  }

  /**
   * 计算数据校验和
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  /**
   * 序列化数据
   */
  private serialize<T>(data: T): StorageItem<T> {
    const item: StorageItem<T> = {
      data,
      timestamp: Date.now(),
      version: this.config.version,
    };

    // 添加校验和
    if (this.config.enableEncryption) {
      item.checksum = this.calculateChecksum(data);
    }

    return item;
  }

  /**
   * 反序列化数据
   */
  private deserialize<T>(serialized: string): StorageResult<T> {
    try {
      const item: StorageItem<T> = JSON.parse(serialized);
      
      // 版本检查
      if (item.version !== this.config.version) {
        return {
          success: false,
          error: `版本不匹配: 期望 ${this.config.version}, 实际 ${item.version}`,
        };
      }

      // 校验和验证
      if (this.config.enableEncryption && item.checksum) {
        const expectedChecksum = this.calculateChecksum(item.data);
        if (item.checksum !== expectedChecksum) {
          return {
            success: false,
            error: '数据完整性校验失败',
          };
        }
      }

      return {
        success: true,
        data: item.data,
        timestamp: item.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: `反序列化失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取存储使用情况
   */
  public getStorageUsage(): {
    used: number;
    available: number;
    percentage: number;
  } {
    if (!this.isAvailable) {
      return { used: 0, available: 0, percentage: 0 };
    }

    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    const maxSize = this.config.maxSize * 1024; // 转换为字节
    const used = totalSize;
    const available = Math.max(0, maxSize - used);
    const percentage = (used / maxSize) * 100;

    return { used, available, percentage };
  }

  /**
   * 设置数据
   */
  public set<T>(key: string, data: T): StorageResult<T> {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'localStorage不可用',
      };
    }

    try {
      const fullKey = this.getFullKey(key);
      const serializedItem = this.serialize(data);
      const serializedString = JSON.stringify(serializedItem);

      // 检查存储空间
      const currentUsage = this.getStorageUsage();
      const requiredSpace = serializedString.length;
      
      if (currentUsage.available < requiredSpace) {
        return {
          success: false,
          error: `存储空间不足: 需要 ${requiredSpace} 字节, 可用 ${currentUsage.available} 字节`,
        };
      }

      localStorage.setItem(fullKey, serializedString);
      
      return {
        success: true,
        data,
        timestamp: serializedItem.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: `存储失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取数据
   */
  public get<T>(key: string): StorageResult<T> {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'localStorage不可用',
      };
    }

    try {
      const fullKey = this.getFullKey(key);
      const serializedString = localStorage.getItem(fullKey);
      
      if (serializedString === null) {
        return {
          success: false,
          error: '数据不存在',
        };
      }

      return this.deserialize<T>(serializedString);
    } catch (error) {
      return {
        success: false,
        error: `获取失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 删除数据
   */
  public remove(key: string): StorageResult<void> {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'localStorage不可用',
      };
    }

    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
      
      return {
        success: true,
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
   * 检查键是否存在
   */
  public has(key: string): boolean {
    if (!this.isAvailable) {
      return false;
    }

    const fullKey = this.getFullKey(key);
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * 获取所有键
   */
  public getKeys(): string[] {
    if (!this.isAvailable) {
      return [];
    }

    const prefix = `${this.config.prefix}_`;
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key.substring(prefix.length));
      }
    }
    
    return keys;
  }

  /**
   * 清空所有数据
   */
  public clear(): StorageResult<void> {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'localStorage不可用',
      };
    }

    try {
      const prefix = `${this.config.prefix}_`;
      const keysToRemove: string[] = [];
      
      // 收集需要删除的键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      // 删除所有匹配的键
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

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
   * 导出所有数据
   */
  public export(): StorageResult<Record<string, any>> {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'localStorage不可用',
      };
    }

    try {
      const data: Record<string, any> = {};
      const keys = this.getKeys();

      for (const key of keys) {
        const result = this.get(key);
        if (result.success) {
          data[key] = result.data;
        }
      }

      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: `导出失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 导入数据
   */
  public import(data: Record<string, any>): StorageResult<void> {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'localStorage不可用',
      };
    }

    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const [key, value] of Object.entries(data)) {
        const result = this.set(key, value);
        if (result.success) {
          successCount++;
        } else {
          errors.push(`${key}: ${result.error}`);
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: `部分导入失败 (成功: ${successCount}, 失败: ${errors.length}): ${errors.join(', ')}`,
        };
      }

      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: `导入失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

/**
 * 默认的本地存储服务实例
 */
export const localStorageService = new LocalStorageService(); 