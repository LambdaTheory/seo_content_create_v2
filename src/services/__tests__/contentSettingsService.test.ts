/**
 * 内容设置管理服务单元测试
 */

import { ContentSettingsService } from '../contentSettingsService';
import {
  ContentSettings,
  GenerationMode,
  ContentSettingsExportData
} from '@/types/ContentSettings.types';

describe('ContentSettingsService', () => {
  let service: ContentSettingsService;
  let mockSettings: ContentSettings;

  beforeEach(() => {
    service = new ContentSettingsService();
    
    // 清理localStorage
    localStorage.clear();
    
    // 模拟设置数据
    mockSettings = {
      id: 'test_settings_1',
      name: '测试设置',
      description: '测试用的内容设置',
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
      createdAt: '2025-01-29T10:00:00.000Z',
      updatedAt: '2025-01-29T10:00:00.000Z',
      isPreset: false,
      isDefault: false
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getAllSettings', () => {
    it('应该返回空数组当没有设置时', async () => {
      const settings = await service.getAllSettings();
      expect(settings).toEqual([]);
    });

    it('应该返回存储的设置', async () => {
      localStorage.setItem('content_settings', JSON.stringify([mockSettings]));
      
      const settings = await service.getAllSettings();
      expect(settings).toHaveLength(1);
      expect(settings[0]).toEqual(mockSettings);
    });

    it('应该在存储损坏时返回空数组', async () => {
      localStorage.setItem('content_settings', 'invalid json');
      
      const settings = await service.getAllSettings();
      expect(settings).toEqual([]);
    });
  });

  describe('getSettingsById', () => {
    beforeEach(async () => {
      localStorage.setItem('content_settings', JSON.stringify([mockSettings]));
    });

    it('应该返回正确的设置', async () => {
      const settings = await service.getSettingsById('test_settings_1');
      expect(settings).toEqual(mockSettings);
    });

    it('应该在设置不存在时返回null', async () => {
      const settings = await service.getSettingsById('nonexistent_id');
      expect(settings).toBeNull();
    });
  });

  describe('createSettings', () => {
    it('应该成功创建新设置', async () => {
      const settingsData = {
        name: '测试设置',
        description: '测试描述',
        wordCount: {
          total: { min: 800, max: 1500, target: 1200 },
          modules: {
            description: { min: 200, max: 400, target: 300 },
            features: { min: 150, max: 300, target: 200 }
          }
        },
        keywordDensity: {
          mainKeyword: { target: 2.5, min: 1.5, max: 4.0 },
          longTailKeywords: { target: 1.5, min: 1.0, max: 3.0 },
          naturalDistribution: true,
          useVariations: true,
          contextualRelevance: true
        },
        generationMode: GenerationMode.STANDARD,
        qualityParams: {
          targetAudience: 'all' as const,
          readabilityLevel: 'intermediate' as const,
          professionalTone: false,
          creativeFreedom: true,
          emotionalTone: 'friendly' as const,
          languageStyle: 'conversational' as const
        },
        seoParams: {
          titleOptimization: {
            includeMainKeyword: true,
            maxLength: 60,
            keywordPosition: 'beginning' as const
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
          qualityCheckStrictness: 'medium' as const
        },
        isPreset: false,
        isDefault: false
      };

      const result = await service.createSettings(settingsData);
      
      expect(result.name).toBe('测试设置');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('应该在验证失败时抛出错误', async () => {
      const invalidSettings = {
        name: '', // 空名称应该导致验证失败
        description: '测试',
        wordCount: mockSettings.wordCount,
        keywordDensity: mockSettings.keywordDensity,
        generationMode: GenerationMode.STANDARD,
        qualityParams: mockSettings.qualityParams,
        seoParams: mockSettings.seoParams,
        advanced: mockSettings.advanced,
        isPreset: false,
        isDefault: false
      };

      await expect(service.createSettings(invalidSettings)).rejects.toThrow('设置验证失败');
    });
  });

  describe('updateSettings', () => {
    beforeEach(async () => {
      localStorage.setItem('content_settings', JSON.stringify([mockSettings]));
    });

    it('应该成功更新设置', async () => {
      const updates = {
        name: '更新后的设置名称',
        description: '更新后的描述'
      };

      const result = await service.updateSettings('test_settings_1', updates);
      
      expect(result.name).toBe('更新后的设置名称');
      expect(result.description).toBe('更新后的描述');
      expect(result.id).toBe('test_settings_1');
      expect(result.updatedAt).not.toBe(mockSettings.updatedAt);
    });

    it('应该在设置不存在时抛出错误', async () => {
      await expect(service.updateSettings('nonexistent_id', { name: '新名称' }))
        .rejects.toThrow('设置不存在');
    });
  });

  describe('deleteSettings', () => {
    beforeEach(async () => {
      localStorage.setItem('content_settings', JSON.stringify([mockSettings]));
    });

    it('应该成功删除设置', async () => {
      const result = await service.deleteSettings('test_settings_1');
      expect(result).toBe(true);

      const settings = await service.getAllSettings();
      expect(settings).toHaveLength(0);
    });

    it('应该在设置不存在时返回false', async () => {
      const result = await service.deleteSettings('nonexistent_id');
      expect(result).toBe(false);
    });

    it('应该阻止删除默认设置', async () => {
      const defaultSettings = { ...mockSettings, isDefault: true };
      localStorage.setItem('content_settings', JSON.stringify([defaultSettings]));

      await expect(service.deleteSettings('test_settings_1'))
        .rejects.toThrow('不能删除默认设置');
    });
  });

  describe('getDefaultSettings', () => {
    it('应该创建默认设置当不存在时', async () => {
      const defaultSettings = await service.getDefaultSettings();
      
      expect(defaultSettings.name).toBe('默认设置');
      expect(defaultSettings.isDefault).toBe(true);
      expect(defaultSettings.id).toBeDefined();
    });

    it('应该返回现有的默认设置', async () => {
      const existingDefault = { ...mockSettings, isDefault: true, name: '现有默认设置' };
      localStorage.setItem('content_settings', JSON.stringify([existingDefault]));

      const defaultSettings = await service.getDefaultSettings();
      expect(defaultSettings.name).toBe('现有默认设置');
    });
  });

  describe('setAsDefault', () => {
    beforeEach(async () => {
      const settings1 = { ...mockSettings, id: 'settings1', isDefault: true };
      const settings2 = { ...mockSettings, id: 'settings2', isDefault: false };
      localStorage.setItem('content_settings', JSON.stringify([settings1, settings2]));
    });

    it('应该正确设置新的默认设置', async () => {
      const result = await service.setAsDefault('settings2');
      
      expect(result.id).toBe('settings2');
      expect(result.isDefault).toBe(true);

      const allSettings = await service.getAllSettings();
      const settings1 = allSettings.find(s => s.id === 'settings1');
      const settings2 = allSettings.find(s => s.id === 'settings2');
      
      expect(settings1?.isDefault).toBe(false);
      expect(settings2?.isDefault).toBe(true);
    });

    it('应该在设置不存在时抛出错误', async () => {
      await expect(service.setAsDefault('nonexistent_id'))
        .rejects.toThrow('设置不存在');
    });
  });

  describe('getAllPresets', () => {
    it('应该返回内置预设当没有预设时', async () => {
      const presets = await service.getAllPresets();
      
      expect(presets.length).toBeGreaterThan(0);
      expect(presets[0].isBuiltIn).toBe(true);
      expect(presets.some(p => p.name === 'SEO优化模式')).toBe(true);
      expect(presets.some(p => p.name === '平衡模式')).toBe(true);
      expect(presets.some(p => p.name === '创意模式')).toBe(true);
    });
  });

  describe('createFromPreset', () => {
    beforeEach(async () => {
      // 初始化预设
      await service.getAllPresets();
    });

    it('应该从预设成功创建设置', async () => {
      const result = await service.createFromPreset('preset_seo_strict', '我的SEO设置', '基于SEO预设的自定义设置');
      
      expect(result.name).toBe('我的SEO设置');
      expect(result.description).toBe('基于SEO预设的自定义设置');
      expect(result.isPreset).toBe(false);
      expect(result.isDefault).toBe(false);
      expect(result.generationMode).toBe(GenerationMode.STRICT);
    });

    it('应该在预设不存在时抛出错误', async () => {
      await expect(service.createFromPreset('nonexistent_preset', '测试'))
        .rejects.toThrow('预设模板不存在');
    });
  });

  describe('validateSettings', () => {
    it('应该验证有效设置', () => {
      const validation = service.validateSettings(mockSettings);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该检测空名称错误', () => {
      const invalidSettings = {
        id: 'test',
        name: '',
        wordCount: {
          total: { min: 800, max: 1500 },
          modules: {
            description: { min: 200, max: 400 },
            features: { min: 150, max: 300 }
          }
        },
        keywordDensity: {
          mainKeyword: { target: 2.5, min: 1.5, max: 4.0 },
          longTailKeywords: { target: 1.5, min: 1.0, max: 3.0 },
          naturalDistribution: true,
          useVariations: true,
          contextualRelevance: true
        },
        generationMode: GenerationMode.STANDARD,
        qualityParams: {
          targetAudience: 'all' as const,
          readabilityLevel: 'intermediate' as const,
          professionalTone: false,
          creativeFreedom: true,
          emotionalTone: 'friendly' as const,
          languageStyle: 'conversational' as const
        },
        seoParams: {
          titleOptimization: {
            includeMainKeyword: true,
            maxLength: 60,
            keywordPosition: 'beginning' as const
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
          qualityCheckStrictness: 'medium' as const
        },
        createdAt: '2025-01-29T10:00:00.000Z',
        updatedAt: '2025-01-29T10:00:00.000Z',
        isPreset: false,
        isDefault: false
      };
      
      const validation = service.validateSettings(invalidSettings);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('设置名称不能为空');
    });

    it('应该检测字数范围错误', () => {
      const invalidSettings = {
        ...mockSettings,
        wordCount: {
          ...mockSettings.wordCount,
          total: { min: 1500, max: 1000 } // min > max
        }
      };
      const validation = service.validateSettings(invalidSettings);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('总字数最小值不能大于等于最大值');
    });

    it('应该检测关键词密度范围错误', () => {
      const invalidSettings = {
        ...mockSettings,
        keywordDensity: {
          ...mockSettings.keywordDensity,
          mainKeyword: { target: 3.0, min: 4.0, max: 5.0 } // target < min
        }
      };
      const validation = service.validateSettings(invalidSettings);
      
      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('主关键词密度目标值超出范围');
    });

    it('应该生成SEO相关建议', () => {
      const settingsWithLongTitle = {
        ...mockSettings,
        seoParams: {
          ...mockSettings.seoParams,
          titleOptimization: {
            ...mockSettings.seoParams.titleOptimization,
            maxLength: 80 // 超过推荐长度
          }
        }
      };
      const validation = service.validateSettings(settingsWithLongTitle);
      
      expect(validation.suggestions).toContain('标题长度超过60字符可能影响搜索结果显示');
    });
  });

  describe('compareSettings', () => {
    it('应该正确比较两个设置', () => {
      const settings2 = {
        ...mockSettings,
        name: '不同的名称',
        wordCount: {
          ...mockSettings.wordCount,
          total: { min: 1000, max: 2000, target: 1500 }
        }
      };

      const comparison = service.compareSettings(mockSettings, settings2);
      
      expect(comparison.differences.length).toBeGreaterThan(0);
      expect(comparison.differences.some(d => d.field === 'name')).toBe(true);
      expect(comparison.differences.some(d => d.path.includes('wordCount.total'))).toBe(true);
      expect(comparison.similarity).toBeLessThan(100);
    });

    it('应该识别相同设置', () => {
      const comparison = service.compareSettings(mockSettings, mockSettings);
      
      expect(comparison.differences).toHaveLength(0);
      expect(comparison.similarity).toBe(100);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      const settings1 = { ...mockSettings, id: 'settings1', generationMode: GenerationMode.STRICT };
      const settings2 = { ...mockSettings, id: 'settings2', generationMode: GenerationMode.STANDARD };
      const settings3 = { ...mockSettings, id: 'settings3', generationMode: GenerationMode.STANDARD };
      
      localStorage.setItem('content_settings', JSON.stringify([settings1, settings2, settings3]));
      
      // 初始化预设
      await service.getAllPresets();
    });

    it('应该返回正确的统计信息', async () => {
      const stats = await service.getStats();
      
      expect(stats.totalConfigs).toBe(3);
      expect(stats.customCount).toBe(3); // 所有都不是预设
      expect(stats.mostUsedMode).toBe(GenerationMode.STANDARD); // 2个标准模式 vs 1个严格模式
      expect(stats.presetCount).toBeGreaterThan(0);
      expect(stats.averageWordCount.min).toBe(800);
      expect(stats.averageWordCount.max).toBe(1500);
      expect(stats.averageKeywordDensity.main).toBe(2.5);
    });
  });

  describe('exportSettings', () => {
    beforeEach(async () => {
      localStorage.setItem('content_settings', JSON.stringify([mockSettings]));
      await service.getAllPresets(); // 初始化预设
    });

    it('应该导出设置但不包含预设', async () => {
      const exportData = await service.exportSettings(false);
      
      expect(exportData.version).toBe('1.0.0');
      expect(exportData.settings).toHaveLength(1);
      expect(exportData.presets).toHaveLength(0);
      expect(exportData.exportedAt).toBeDefined();
    });

    it('应该导出设置和预设', async () => {
      const exportData = await service.exportSettings(true, true);
      
      expect(exportData.settings).toHaveLength(1);
      expect(exportData.presets.length).toBeGreaterThan(0);
      expect(exportData.metadata.includeBuiltInPresets).toBe(true);
    });

    it('应该导出设置和自定义预设但不包含内置预设', async () => {
      const exportData = await service.exportSettings(true, false);
      
      expect(exportData.presets.every(p => !p.isBuiltIn)).toBe(true);
    });
  });

  describe('importSettings', () => {
    it('应该成功导入新设置', async () => {
      const exportData: ContentSettingsExportData = {
        version: '1.0.0',
        exportedAt: '2025-01-29T10:00:00.000Z',
        settings: [mockSettings],
        presets: [],
        metadata: {
          includeBuiltInPresets: false
        }
      };

      const result = await service.importSettings(exportData);
      
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      const allSettings = await service.getAllSettings();
      expect(allSettings).toHaveLength(1);
    });

    it('应该跳过已存在的设置当不覆盖时', async () => {
      // 先创建一个设置
      localStorage.setItem('content_settings', JSON.stringify([mockSettings]));

      const exportData: ContentSettingsExportData = {
        version: '1.0.0',
        exportedAt: '2025-01-29T10:00:00.000Z',
        settings: [mockSettings],
        presets: [],
        metadata: {
          includeBuiltInPresets: false
        }
      };

      const result = await service.importSettings(exportData, { overwriteExisting: false, importPresets: false });
      
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('应该覆盖已存在的设置当启用覆盖时', async () => {
      // 先创建一个设置
      localStorage.setItem('content_settings', JSON.stringify([mockSettings]));

      const updatedSettings = { ...mockSettings, name: '更新后的名称' };
      const exportData: ContentSettingsExportData = {
        version: '1.0.0',
        exportedAt: '2025-01-29T10:00:00.000Z',
        settings: [updatedSettings],
        presets: [],
        metadata: {
          includeBuiltInPresets: false
        }
      };

      const result = await service.importSettings(exportData, { overwriteExisting: true, importPresets: false });
      
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);

      const allSettings = await service.getAllSettings();
      expect(allSettings[0].name).toBe('更新后的名称');
    });
  });

  describe('缓存功能', () => {
    it('应该使用缓存提高性能', async () => {
      localStorage.setItem('content_settings', JSON.stringify([mockSettings]));

      // 第一次调用
      const start1 = performance.now();
      await service.getAllSettings();
      const duration1 = performance.now() - start1;

      // 第二次调用应该使用缓存
      const start2 = performance.now();
      await service.getAllSettings();
      const duration2 = performance.now() - start2;

      // 缓存调用应该更快（虽然在测试环境可能差别不大）
      expect(duration2).toBeLessThanOrEqual(duration1);
    });

    it('应该在创建新设置后清除缓存', async () => {
      // 先填充缓存
      await service.getAllSettings();

      // 创建新设置
      await service.createSettings({
        name: '新设置',
        description: '测试缓存清除',
        wordCount: mockSettings.wordCount,
        keywordDensity: mockSettings.keywordDensity,
        generationMode: GenerationMode.STANDARD,
        qualityParams: mockSettings.qualityParams,
        seoParams: mockSettings.seoParams,
        advanced: mockSettings.advanced,
        isPreset: false,
        isDefault: false
      });

      // 缓存应该被清除，能够获取到新设置
      const allSettings = await service.getAllSettings();
      expect(allSettings.some(s => s.name === '新设置')).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理localStorage读取错误', async () => {
      // 模拟localStorage异常
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn().mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const settings = await service.getAllSettings();
      expect(settings).toEqual([]);

      // 恢复localStorage
      localStorage.getItem = originalGetItem;
    });

    it('应该处理无效JSON数据', async () => {
      localStorage.setItem('content_settings', 'invalid json');
      
      const settings = await service.getAllSettings();
      expect(settings).toEqual([]);
    });
  });
}); 