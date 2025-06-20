/**
 * 内容设置管理服务
 * 提供内容设置的CRUD操作、预设模板管理、验证和导入导出功能
 */

import {
  ContentSettings,
  PresetTemplate,
  GenerationMode,
  ContentSettingsValidation,
  ContentSettingsComparison,
  ContentSettingsStats,
  ContentSettingsExportData,
  ContentSettingsLog
} from '@/types/ContentSettings.types';

/**
 * 内容设置服务类
 */
export class ContentSettingsService {
  private static readonly STORAGE_KEYS = {
    SETTINGS: 'content_settings',
    PRESETS: 'content_presets',
    LOGS: 'content_settings_logs'
  };

  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  private cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * 获取所有内容设置
   */
  async getAllSettings(): Promise<ContentSettings[]> {
    const cacheKey = 'all_settings';
    const cached = this.getFromCache<ContentSettings[]>(cacheKey);
    if (cached) return cached;

    try {
      const stored = localStorage.getItem(ContentSettingsService.STORAGE_KEYS.SETTINGS);
      const settings: ContentSettings[] = stored ? JSON.parse(stored) : [];
      
      this.setCache(cacheKey, settings);
      return settings;
    } catch (error) {
      console.error('获取内容设置失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取设置
   */
  async getSettingsById(id: string): Promise<ContentSettings | null> {
    const cacheKey = `settings_${id}`;
    const cached = this.getFromCache<ContentSettings>(cacheKey);
    if (cached) return cached;

    try {
      const allSettings = await this.getAllSettings();
      const settings = allSettings.find(s => s.id === id) || null;
      
      if (settings) {
        this.setCache(cacheKey, settings);
      }
      return settings;
    } catch (error) {
      console.error(`获取设置失败 (ID: ${id}):`, error);
      return null;
    }
  }

  /**
   * 创建新的内容设置
   */
  async createSettings(settingsData: Omit<ContentSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentSettings> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();
      
      const newSettings: ContentSettings = {
        ...settingsData,
        id,
        createdAt: now,
        updatedAt: now
      };

      // 验证设置
      const validation = this.validateSettings(newSettings);
      if (!validation.isValid) {
        throw new Error(`设置验证失败: ${validation.errors.join(', ')}`);
      }

      const allSettings = await this.getAllSettings();
      allSettings.push(newSettings);
      
      await this.saveAllSettings(allSettings);
      await this.logAction('create', newSettings.id, newSettings.name, undefined, newSettings);
      
      this.clearCache();
      return newSettings;
    } catch (error) {
      console.error('创建内容设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新内容设置
   */
  async updateSettings(id: string, updates: Partial<ContentSettings>): Promise<ContentSettings> {
    try {
      const allSettings = await this.getAllSettings();
      const settingsIndex = allSettings.findIndex(s => s.id === id);
      
      if (settingsIndex === -1) {
        throw new Error(`设置不存在 (ID: ${id})`);
      }

      const currentSettings = allSettings[settingsIndex];
      const updatedSettings: ContentSettings = {
        ...currentSettings,
        ...updates,
        id, // 确保ID不被覆盖
        updatedAt: new Date().toISOString()
      };

      // 验证更新后的设置
      const validation = this.validateSettings(updatedSettings);
      if (!validation.isValid) {
        throw new Error(`设置验证失败: ${validation.errors.join(', ')}`);
      }

      allSettings[settingsIndex] = updatedSettings;
      await this.saveAllSettings(allSettings);
      await this.logAction('update', id, updatedSettings.name, currentSettings, updatedSettings);
      
      this.clearCache();
      return updatedSettings;
    } catch (error) {
      console.error(`更新内容设置失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除内容设置
   */
  async deleteSettings(id: string): Promise<boolean> {
    try {
      const allSettings = await this.getAllSettings();
      const settingsIndex = allSettings.findIndex(s => s.id === id);
      
      if (settingsIndex === -1) {
        return false;
      }

      const deletedSettings = allSettings[settingsIndex];
      
      // 检查是否为默认设置
      if (deletedSettings.isDefault) {
        throw new Error('不能删除默认设置');
      }

      allSettings.splice(settingsIndex, 1);
      await this.saveAllSettings(allSettings);
      await this.logAction('delete', id, deletedSettings.name, deletedSettings, undefined);
      
      this.clearCache();
      return true;
    } catch (error) {
      console.error(`删除内容设置失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取默认设置
   */
  async getDefaultSettings(): Promise<ContentSettings> {
    try {
      const allSettings = await this.getAllSettings();
      const defaultSettings = allSettings.find(s => s.isDefault);
      
      if (defaultSettings) {
        return defaultSettings;
      }

      // 如果没有默认设置，创建一个
      return await this.createDefaultSettings();
    } catch (error) {
      console.error('获取默认设置失败:', error);
      return await this.createDefaultSettings();
    }
  }

  /**
   * 设置为默认
   */
  async setAsDefault(id: string): Promise<ContentSettings> {
    try {
      const allSettings = await this.getAllSettings();
      
      // 清除现有默认设置
      allSettings.forEach(s => {
        if (s.isDefault) {
          s.isDefault = false;
        }
      });

      // 设置新的默认设置
      const targetIndex = allSettings.findIndex(s => s.id === id);
      if (targetIndex === -1) {
        throw new Error(`设置不存在 (ID: ${id})`);
      }

      allSettings[targetIndex].isDefault = true;
      allSettings[targetIndex].updatedAt = new Date().toISOString();
      
      await this.saveAllSettings(allSettings);
      this.clearCache();
      
      return allSettings[targetIndex];
    } catch (error) {
      console.error(`设置默认配置失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取所有预设模板
   */
  async getAllPresets(): Promise<PresetTemplate[]> {
    const cacheKey = 'all_presets';
    const cached = this.getFromCache<PresetTemplate[]>(cacheKey);
    if (cached) return cached;

    try {
      const stored = localStorage.getItem(ContentSettingsService.STORAGE_KEYS.PRESETS);
      const presets: PresetTemplate[] = stored ? JSON.parse(stored) : [];
      
      // 如果没有预设，创建内置预设
      if (presets.length === 0) {
        const builtInPresets = this.createBuiltInPresets();
        await this.saveAllPresets(builtInPresets);
        this.setCache(cacheKey, builtInPresets);
        return builtInPresets;
      }
      
      this.setCache(cacheKey, presets);
      return presets;
    } catch (error) {
      console.error('获取预设模板失败:', error);
      return this.createBuiltInPresets();
    }
  }

  /**
   * 从预设创建设置
   */
  async createFromPreset(presetId: string, name: string, description?: string): Promise<ContentSettings> {
    try {
      const presets = await this.getAllPresets();
      const preset = presets.find(p => p.id === presetId);
      
      if (!preset) {
        throw new Error(`预设模板不存在 (ID: ${presetId})`);
      }

      const settingsData: Omit<ContentSettings, 'id' | 'createdAt' | 'updatedAt'> = {
        ...preset.settings,
        name,
        description: description || preset.description,
        isPreset: false,
        isDefault: false
      };

      return await this.createSettings(settingsData);
    } catch (error) {
      console.error(`从预设创建设置失败 (预设ID: ${presetId}):`, error);
      throw error;
    }
  }

  /**
   * 验证内容设置
   */
  validateSettings(settings: ContentSettings): ContentSettingsValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // 基本字段验证
      if (!settings.name || settings.name.trim().length === 0) {
        errors.push('设置名称不能为空');
      }

      if (!settings.id || settings.id.trim().length === 0) {
        errors.push('设置ID不能为空');
      }

      // 字数设置验证
      if (settings.wordCount.total.min >= settings.wordCount.total.max) {
        errors.push('总字数最小值不能大于等于最大值');
      }

      if (settings.wordCount.total.target) {
        if (settings.wordCount.total.target < settings.wordCount.total.min || 
            settings.wordCount.total.target > settings.wordCount.total.max) {
          warnings.push('总字数目标值超出最小/最大值范围');
        }
      }

      // 关键词密度验证
      if (settings.keywordDensity.mainKeyword.min > settings.keywordDensity.mainKeyword.max) {
        errors.push('主关键词密度最小值不能大于最大值');
      }

      if (settings.keywordDensity.mainKeyword.target < settings.keywordDensity.mainKeyword.min ||
          settings.keywordDensity.mainKeyword.target > settings.keywordDensity.mainKeyword.max) {
        warnings.push('主关键词密度目标值超出范围');
      }

      if (settings.keywordDensity.mainKeyword.max > 8) {
        warnings.push('主关键词密度过高可能影响SEO效果');
      }

      // 高级设置验证
      if (settings.advanced.concurrency < 1 || settings.advanced.concurrency > 10) {
        warnings.push('并发数量建议在1-10之间');
      }

      if (settings.advanced.timeout < 30 || settings.advanced.timeout > 300) {
        warnings.push('超时时间建议在30-300秒之间');
      }

      // SEO参数验证
      if (settings.seoParams.titleOptimization.maxLength > 60) {
        suggestions.push('标题长度超过60字符可能影响搜索结果显示');
      }

      if (settings.seoParams.metaDescription?.maxLength && settings.seoParams.metaDescription.maxLength > 160) {
        suggestions.push('Meta描述长度超过160字符可能被截断');
      }

    } catch (error) {
      errors.push(`验证过程中发生错误: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * 比较两个设置
   */
  compareSettings(settings1: ContentSettings, settings2: ContentSettings): ContentSettingsComparison {
    const differences: ContentSettingsComparison['differences'] = [];
    
    const compare = (obj1: any, obj2: any, path: string = '') => {
      const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
      
      for (const key of keys) {
        const currentPath = path ? `${path}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        
        if (val1 === undefined && val2 !== undefined) {
          differences.push({
            field: key,
            path: currentPath,
            oldValue: val1,
            newValue: val2,
            type: 'added'
          });
        } else if (val1 !== undefined && val2 === undefined) {
          differences.push({
            field: key,
            path: currentPath,
            oldValue: val1,
            newValue: val2,
            type: 'removed'
          });
        } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
          compare(val1, val2, currentPath);
        } else if (val1 !== val2) {
          differences.push({
            field: key,
            path: currentPath,
            oldValue: val1,
            newValue: val2,
            type: 'modified'
          });
        }
      }
    };

    compare(settings1, settings2);
    
    // 计算相似度
    const totalFields = this.countFields(settings1);
    const changedFields = differences.length;
    const similarity = Math.max(0, Math.min(100, (totalFields - changedFields) / totalFields * 100));

    return {
      settings: [settings1, settings2],
      differences,
      similarity
    };
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<ContentSettingsStats> {
    try {
      const allSettings = await this.getAllSettings();
      const presets = await this.getAllPresets();
      
      const modeCount = new Map<GenerationMode, number>();
      let totalWordCountMin = 0;
      let totalWordCountMax = 0;
      let totalWordCountTarget = 0;
      let totalMainKeywordDensity = 0;
      let totalLongTailKeywordDensity = 0;

      allSettings.forEach(settings => {
        // 统计生成模式
        modeCount.set(settings.generationMode, (modeCount.get(settings.generationMode) || 0) + 1);
        
        // 统计字数设置
        totalWordCountMin += settings.wordCount.total.min;
        totalWordCountMax += settings.wordCount.total.max;
        if (settings.wordCount.total.target) {
          totalWordCountTarget += settings.wordCount.total.target;
        }
        
        // 统计关键词密度
        totalMainKeywordDensity += settings.keywordDensity.mainKeyword.target;
        totalLongTailKeywordDensity += settings.keywordDensity.longTailKeywords.target;
      });

      // 找到最常用的生成模式
      let mostUsedMode = GenerationMode.STANDARD;
      let maxCount = 0;
      modeCount.forEach((count, mode) => {
        if (count > maxCount) {
          maxCount = count;
          mostUsedMode = mode;
        }
      });

      const count = allSettings.length || 1;
      
      return {
        totalConfigs: allSettings.length,
        presetCount: presets.length,
        customCount: allSettings.filter(s => !s.isPreset).length,
        mostUsedMode,
        averageWordCount: {
          min: Math.round(totalWordCountMin / count),
          max: Math.round(totalWordCountMax / count),
          target: Math.round(totalWordCountTarget / count)
        },
        averageKeywordDensity: {
          main: parseFloat((totalMainKeywordDensity / count).toFixed(2)),
          longTail: parseFloat((totalLongTailKeywordDensity / count).toFixed(2))
        }
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 导出设置
   */
  async exportSettings(includePresets = false, includeBuiltInPresets = false): Promise<ContentSettingsExportData> {
    try {
      const allSettings = await this.getAllSettings();
      let presets: PresetTemplate[] = [];
      
      if (includePresets) {
        const allPresets = await this.getAllPresets();
        presets = includeBuiltInPresets ? allPresets : allPresets.filter(p => !p.isBuiltIn);
      }

      return {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings: allSettings,
        presets,
        metadata: {
          includeBuiltInPresets
        }
      };
    } catch (error) {
      console.error('导出设置失败:', error);
      throw error;
    }
  }

  /**
   * 导入设置
   */
  async importSettings(data: ContentSettingsExportData, options = { 
    overwriteExisting: false, 
    importPresets: true 
  }): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    try {
      const existingSettings = await this.getAllSettings();
      const existingIds = new Set(existingSettings.map(s => s.id));

      // 导入设置
      for (const settings of data.settings) {
        try {
          if (existingIds.has(settings.id)) {
            if (options.overwriteExisting) {
              await this.updateSettings(settings.id, settings);
              result.imported++;
            } else {
              result.skipped++;
            }
          } else {
            await this.createSettings(settings);
            result.imported++;
          }
        } catch (error) {
          result.errors.push(`导入设置失败 (${settings.name}): ${error}`);
        }
      }

      // 导入预设
      if (options.importPresets && data.presets) {
        const existingPresets = await this.getAllPresets();
        const presetIds = new Set(existingPresets.map(p => p.id));
        
        const newPresets = data.presets.filter(p => !presetIds.has(p.id));
        if (newPresets.length > 0) {
          const allPresets = [...existingPresets, ...newPresets];
          await this.saveAllPresets(allPresets);
        }
      }

      this.clearCache();
      return result;
    } catch (error) {
      console.error('导入设置失败:', error);
      throw error;
    }
  }

  // 私有方法

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 保存所有设置到存储
   */
  private async saveAllSettings(settings: ContentSettings[]): Promise<void> {
    localStorage.setItem(ContentSettingsService.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  /**
   * 保存所有预设到存储
   */
  private async saveAllPresets(presets: PresetTemplate[]): Promise<void> {
    localStorage.setItem(ContentSettingsService.STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  }

  /**
   * 记录操作日志
   */
  private async logAction(
    action: ContentSettingsLog['action'],
    settingsId: string,
    settingsName: string,
    beforeSettings?: Partial<ContentSettings>,
    afterSettings?: Partial<ContentSettings>
  ): Promise<void> {
    try {
      const logEntry: ContentSettingsLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        settingsId,
        settingsName,
        beforeSettings,
        afterSettings,
        timestamp: new Date().toISOString(),
        result: 'success'
      };

      const stored = localStorage.getItem(ContentSettingsService.STORAGE_KEYS.LOGS);
      const logs: ContentSettingsLog[] = stored ? JSON.parse(stored) : [];
      
      logs.push(logEntry);
      
      // 只保留最近100条日志
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem(ContentSettingsService.STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('记录操作日志失败:', error);
    }
  }

  /**
   * 创建默认设置
   */
  private async createDefaultSettings(): Promise<ContentSettings> {
    const defaultSettings: Omit<ContentSettings, 'id' | 'createdAt' | 'updatedAt'> = {
      name: '默认设置',
      description: '系统默认的内容生成设置',
      wordCount: {
        total: { min: 800, max: 1500, target: 1200 },
        modules: {
          description: { min: 200, max: 400, target: 300 },
          features: { min: 150, max: 300, target: 200 },
          gameplay: { min: 200, max: 400, target: 300 },
          review: { min: 100, max: 200, target: 150 },
          faq: { min: 150, max: 300, target: 200 }
        }
      },
      keywordDensity: {
        mainKeyword: { target: 2.5, min: 1.5, max: 4.0 },
        longTailKeywords: { target: 1.5, min: 1.0, max: 3.0 },
        relatedKeywords: { target: 1.0, min: 0.5, max: 2.0 },
        naturalDistribution: true,
        useVariations: true,
        contextualRelevance: true
      },
      generationMode: GenerationMode.STANDARD,
      qualityParams: {
        targetAudience: 'all',
        readabilityLevel: 'intermediate',
        professionalTone: false,
        creativeFreedom: true,
        emotionalTone: 'friendly',
        languageStyle: 'conversational'
      },
      seoParams: {
        titleOptimization: {
          includeMainKeyword: true,
          maxLength: 60,
          keywordPosition: 'beginning'
        },
        metaDescription: {
          includeMainKeyword: true,
          includeCTA: true,
          maxLength: 160
        },
        internalLinking: true,
        relatedGamesSuggestion: true,
        structuredDataGeneration: true
      },
      advanced: {
        concurrency: 3,
        retryAttempts: 3,
        timeout: 120,
        enableCaching: true,
        qualityCheckStrictness: 'medium'
      },
      isPreset: false,
      isDefault: true
    };

    return await this.createSettings(defaultSettings);
  }

  /**
   * 创建内置预设模板
   */
  private createBuiltInPresets(): PresetTemplate[] {
    const baseSettings = {
      advanced: {
        concurrency: 3,
        retryAttempts: 3,
        timeout: 120,
        enableCaching: true,
        qualityCheckStrictness: 'medium' as const
      },
      isPreset: false,
      isDefault: false
    };

    return [
      {
        id: 'preset_seo_strict',
        name: 'SEO优化模式',
        description: '严格SEO优化，适合竞争激烈的关键词',
        icon: '🎯',
        useCase: ['SEO优化', '关键词竞争', '搜索排名'],
        rating: 5,
        isBuiltIn: true,
        sortOrder: 1,
        settings: {
          ...baseSettings,
          description: 'SEO优化严格模式配置',
          wordCount: {
            total: { min: 1000, max: 2000, target: 1500 },
            modules: {
              description: { min: 300, max: 500, target: 400 },
              features: { min: 200, max: 400, target: 300 },
              gameplay: { min: 300, max: 500, target: 400 },
              review: { min: 100, max: 200, target: 150 },
              faq: { min: 100, max: 300, target: 200 }
            }
          },
          keywordDensity: {
            mainKeyword: { target: 3.5, min: 2.5, max: 5.0 },
            longTailKeywords: { target: 2.0, min: 1.5, max: 3.5 },
            relatedKeywords: { target: 1.5, min: 1.0, max: 2.5 },
            naturalDistribution: false,
            useVariations: true,
            contextualRelevance: true
          },
          generationMode: GenerationMode.STRICT,
          qualityParams: {
            targetAudience: 'all',
            readabilityLevel: 'intermediate',
            professionalTone: true,
            creativeFreedom: false,
            emotionalTone: 'professional',
            languageStyle: 'descriptive'
          },
          seoParams: {
            titleOptimization: {
              includeMainKeyword: true,
              maxLength: 55,
              keywordPosition: 'beginning'
            },
            metaDescription: {
              includeMainKeyword: true,
              includeCTA: true,
              maxLength: 155
            },
            internalLinking: true,
            relatedGamesSuggestion: true,
            structuredDataGeneration: true
          }
        }
      },
      {
        id: 'preset_balanced',
        name: '平衡模式',
        description: '平衡SEO效果和用户体验',
        icon: '⚖️',
        useCase: ['通用内容', '平衡优化', '用户体验'],
        rating: 4,
        isBuiltIn: true,
        sortOrder: 2,
        settings: {
          ...baseSettings,
          description: '平衡SEO和用户体验的标准配置',
          wordCount: {
            total: { min: 800, max: 1500, target: 1200 },
            modules: {
              description: { min: 200, max: 400, target: 300 },
              features: { min: 150, max: 300, target: 200 },
              gameplay: { min: 200, max: 400, target: 300 },
              review: { min: 100, max: 200, target: 150 },
              faq: { min: 150, max: 300, target: 200 }
            }
          },
          keywordDensity: {
            mainKeyword: { target: 2.5, min: 1.5, max: 4.0 },
            longTailKeywords: { target: 1.5, min: 1.0, max: 3.0 },
            relatedKeywords: { target: 1.0, min: 0.5, max: 2.0 },
            naturalDistribution: true,
            useVariations: true,
            contextualRelevance: true
          },
          generationMode: GenerationMode.STANDARD,
          qualityParams: {
            targetAudience: 'all',
            readabilityLevel: 'intermediate',
            professionalTone: false,
            creativeFreedom: true,
            emotionalTone: 'friendly',
            languageStyle: 'conversational'
          },
          seoParams: {
            titleOptimization: {
              includeMainKeyword: true,
              maxLength: 60,
              keywordPosition: 'beginning'
            },
            metaDescription: {
              includeMainKeyword: true,
              includeCTA: true,
              maxLength: 160
            },
            internalLinking: true,
            relatedGamesSuggestion: true,
            structuredDataGeneration: true
          }
        }
      },
      {
        id: 'preset_creative',
        name: '创意模式',
        description: '注重创意和自然度，降低SEO约束',
        icon: '🎨',
        useCase: ['创意内容', '品牌形象', '用户参与'],
        rating: 4,
        isBuiltIn: true,
        sortOrder: 3,
        settings: {
          ...baseSettings,
          description: '创意优先的内容生成配置',
          wordCount: {
            total: { min: 600, max: 1200, target: 900 },
            modules: {
              description: { min: 150, max: 300, target: 200 },
              features: { min: 100, max: 250, target: 150 },
              gameplay: { min: 150, max: 350, target: 250 },
              review: { min: 100, max: 200, target: 150 },
              faq: { min: 100, max: 200, target: 150 }
            }
          },
          keywordDensity: {
            mainKeyword: { target: 1.5, min: 1.0, max: 2.5 },
            longTailKeywords: { target: 1.0, min: 0.5, max: 2.0 },
            relatedKeywords: { target: 0.8, min: 0.3, max: 1.5 },
            naturalDistribution: true,
            useVariations: true,
            contextualRelevance: true
          },
          generationMode: GenerationMode.CREATIVE,
          qualityParams: {
            targetAudience: 'all',
            readabilityLevel: 'intermediate',
            professionalTone: false,
            creativeFreedom: true,
            emotionalTone: 'playful',
            languageStyle: 'conversational'
          },
          seoParams: {
            titleOptimization: {
              includeMainKeyword: true,
              maxLength: 65,
              keywordPosition: 'natural'
            },
            metaDescription: {
              includeMainKeyword: false,
              includeCTA: true,
              maxLength: 160
            },
            internalLinking: false,
            relatedGamesSuggestion: true,
            structuredDataGeneration: false
          }
        }
      },
      {
        id: 'preset_enterprise',
        name: '企业级模式',
        description: '适合大型企业的严格规范，注重一致性和品牌标准',
        icon: '🏢',
        useCase: ['企业网站', '产品文档', '官方发布'],
        rating: 5,
        isBuiltIn: true,
        sortOrder: 4,
        settings: {
          ...baseSettings,
          description: '企业级严格规范配置',
          wordCount: {
            total: { min: 1200, max: 2000, target: 1600 },
            modules: {
              description: { min: 400, max: 600, target: 500 },
              features: { min: 300, max: 500, target: 400 },
              gameplay: { min: 300, max: 500, target: 400 },
              review: { min: 200, max: 300, target: 250 },
              faq: { min: 200, max: 400, target: 300 }
            }
          },
          keywordDensity: {
            mainKeyword: { target: 2.8, min: 2.0, max: 4.0 },
            longTailKeywords: { target: 1.8, min: 1.2, max: 3.0 },
            relatedKeywords: { target: 1.2, min: 0.8, max: 2.0 },
            naturalDistribution: true,
            useVariations: true,
            contextualRelevance: true
          },
          generationMode: GenerationMode.STRICT,
          qualityParams: {
            targetAudience: 'adults',
            readabilityLevel: 'advanced',
            professionalTone: true,
            creativeFreedom: false,
            emotionalTone: 'professional',
            languageStyle: 'formal'
          },
          seoParams: {
            titleOptimization: {
              includeMainKeyword: true,
              maxLength: 50,
              keywordPosition: 'beginning'
            },
            metaDescription: {
              includeMainKeyword: true,
              includeCTA: false,
              maxLength: 150
            },
            internalLinking: true,
            relatedGamesSuggestion: false,
            structuredDataGeneration: true
          },
          advanced: {
            concurrency: 1,
            retryAttempts: 5,
            timeout: 180,
            enableCaching: true,
            qualityCheckStrictness: 'high'
          }
        }
      },
      {
        id: 'preset_casual_gaming',
        name: '休闲游戏模式',
        description: '专为休闲游戏内容优化，轻松愉快的语调',
        icon: '🎮',
        useCase: ['休闲游戏', '家庭娱乐', '社交游戏'],
        rating: 4,
        isBuiltIn: true,
        sortOrder: 5,
        settings: {
          ...baseSettings,
          description: '休闲游戏专用配置',
          wordCount: {
            total: { min: 500, max: 1000, target: 750 },
            modules: {
              description: { min: 100, max: 200, target: 150 },
              features: { min: 100, max: 200, target: 150 },
              gameplay: { min: 150, max: 300, target: 225 },
              review: { min: 75, max: 150, target: 112 },
              faq: { min: 75, max: 150, target: 113 }
            }
          },
          keywordDensity: {
            mainKeyword: { target: 1.8, min: 1.2, max: 2.5 },
            longTailKeywords: { target: 1.2, min: 0.8, max: 2.0 },
            relatedKeywords: { target: 0.8, min: 0.4, max: 1.5 },
            naturalDistribution: true,
            useVariations: true,
            contextualRelevance: true
          },
          generationMode: GenerationMode.CREATIVE,
          qualityParams: {
            targetAudience: 'casual',
            readabilityLevel: 'beginner',
            professionalTone: false,
            creativeFreedom: true,
            emotionalTone: 'excited',
            languageStyle: 'action-oriented'
          },
          seoParams: {
            titleOptimization: {
              includeMainKeyword: true,
              maxLength: 60,
              keywordPosition: 'middle'
            },
            metaDescription: {
              includeMainKeyword: true,
              includeCTA: true,
              maxLength: 155
            },
            internalLinking: false,
            relatedGamesSuggestion: true,
            structuredDataGeneration: false
          },
          advanced: {
            concurrency: 4,
            retryAttempts: 2,
            timeout: 60,
            enableCaching: true,
            qualityCheckStrictness: 'low'
          }
        }
      }
    ];
  }

  /**
   * 缓存操作
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ContentSettingsService.CACHE_TTL) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * 计算对象字段数量
   */
  private countFields(obj: any, count = 0): number {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        count++;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          count = this.countFields(obj[key], count);
        }
      }
    }
    return count;
  }

  /**
   * 根据ID获取预设模板
   */
  async getPresetById(id: string): Promise<PresetTemplate | null> {
    try {
      const allPresets = await this.getAllPresets();
      return allPresets.find(preset => preset.id === id) || null;
    } catch (error) {
      console.error('获取预设模板失败:', error);
      return null;
    }
  }

  /**
   * 创建自定义预设模板
   */
  async createCustomPreset(preset: Omit<PresetTemplate, 'id' | 'isBuiltIn' | 'sortOrder'>): Promise<PresetTemplate> {
    try {
      const customPresets = await this.getCustomPresets();
      
      const newPreset: PresetTemplate = {
        ...preset,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isBuiltIn: false,
        sortOrder: 1000 + customPresets.length // 自定义预设排在后面
      };

      customPresets.push(newPreset);
      await this.saveAllPresets(customPresets);

      await this.logAction('create', newPreset.id, newPreset.name, undefined, newPreset as any);
      
      this.clearCache();
      return newPreset;
    } catch (error) {
      console.error('创建自定义预设失败:', error);
      throw new Error(`创建自定义预设失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 更新自定义预设模板
   */
  async updateCustomPreset(id: string, updates: Partial<PresetTemplate>): Promise<PresetTemplate | null> {
    try {
      const customPresets = await this.getCustomPresets();
      const presetIndex = customPresets.findIndex(preset => preset.id === id);
      
      if (presetIndex === -1) {
        throw new Error('预设模板不存在或为内置模板，无法修改');
      }

      const oldPreset = { ...customPresets[presetIndex] };
      const updatedPreset = {
        ...customPresets[presetIndex],
        ...updates,
        id, // 确保ID不被修改
        isBuiltIn: false // 确保不能修改为内置模板
      };

      customPresets[presetIndex] = updatedPreset;
      await this.saveAllPresets(customPresets);

      await this.logAction('update', id, updatedPreset.name, oldPreset as any, updatedPreset as any);
      
      this.clearCache();
      return updatedPreset;
    } catch (error) {
      console.error('更新自定义预设失败:', error);
      throw new Error(`更新自定义预设失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除自定义预设模板
   */
  async deleteCustomPreset(id: string): Promise<boolean> {
    try {
      const customPresets = await this.getCustomPresets();
      const presetIndex = customPresets.findIndex(preset => preset.id === id);
      
      if (presetIndex === -1) {
        throw new Error('预设模板不存在，无法删除');
      }

      const deletedPreset = customPresets[presetIndex];
      
      // 确保不能删除内置预设
      if (deletedPreset.isBuiltIn) {
        throw new Error('不能删除内置预设模板');
      }

      customPresets.splice(presetIndex, 1);
      await this.saveAllPresets(customPresets);

      await this.logAction('delete', id, deletedPreset.name, deletedPreset as any, undefined);
      
      this.clearCache();
      return true;
    } catch (error) {
      console.error('删除自定义预设失败:', error);
      return false;
    }
  }

  /**
   * 应用预设模板到内容设置
   */
  async applyPreset(presetId: string, baseSettings?: Partial<ContentSettings>): Promise<ContentSettings> {
    try {
      const preset = await this.getPresetById(presetId);
      if (!preset) {
        throw new Error('预设模板不存在');
      }

      const now = new Date().toISOString();
      const appliedSettings: ContentSettings = {
        id: baseSettings?.id || this.generateId(),
        name: baseSettings?.name || `基于${preset.name}的设置`,
        description: baseSettings?.description || `应用了${preset.name}预设的内容设置`,
        ...preset.settings,
        createdAt: baseSettings?.createdAt || now,
        updatedAt: now,
        isPreset: false,
        isDefault: baseSettings?.isDefault || false
      };

      await this.logAction('apply', appliedSettings.id, appliedSettings.name, {}, appliedSettings);
      
      return appliedSettings;
    } catch (error) {
      console.error('应用预设模板失败:', error);
      throw new Error(`应用预设模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取自定义预设
   */
  private async getCustomPresets(): Promise<PresetTemplate[]> {
    try {
      const stored = localStorage.getItem(ContentSettingsService.STORAGE_KEYS.PRESETS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取自定义预设失败:', error);
      return [];
    }
  }

  /**
   * 获取预设统计信息
   */
  async getPresetStats(): Promise<{
    totalPresets: number;
    builtInCount: number;
    customCount: number;
    mostUsedPreset: string;
    presetUsageStats: { [presetId: string]: number };
  }> {
    try {
      const allPresets = await this.getAllPresets();
      const logs = this.getFromCache<ContentSettingsLog[]>('operation_logs') || [];
      
      // 统计预设使用次数
      const presetUsageStats: { [presetId: string]: number } = {};
      logs.filter(log => log.action === 'apply').forEach(log => {
        const presetId = log.settingsId;
        presetUsageStats[presetId] = (presetUsageStats[presetId] || 0) + 1;
      });

      // 找到最常用的预设
      const mostUsedPreset = Object.keys(presetUsageStats).reduce((a, b) => 
        (presetUsageStats[a] || 0) > (presetUsageStats[b] || 0) ? a : b, ''
      );

      return {
        totalPresets: allPresets.length,
        builtInCount: allPresets.filter(p => p.isBuiltIn).length,
        customCount: allPresets.filter(p => !p.isBuiltIn).length,
        mostUsedPreset,
        presetUsageStats
      };
    } catch (error) {
      console.error('获取预设统计信息失败:', error);
      return {
        totalPresets: 0,
        builtInCount: 0,
        customCount: 0,
        mostUsedPreset: '',
        presetUsageStats: {}
      };
    }
  }
}

// 导出服务实例
export const contentSettingsService = new ContentSettingsService();
export default contentSettingsService; 