/**
 * 结果导出服务测试
 */

import { 
  resultExportService,
  ExportFormat,
  ExportConfig,
  BatchExportConfig 
} from '../resultExportService';
import { PreviewGenerationResult } from '@/types/ResultPreview.types';

// 模拟数据
const mockResult: PreviewGenerationResult = {
  id: 'test-1',
  gameId: 'game-001',
  gameName: '测试游戏',
  status: 'completed',
  createdAt: '2025-01-24T10:00:00Z',
  updatedAt: '2025-01-24T10:30:00Z',
  content: {
    rawContent: '这是一个测试游戏的内容描述',
    structuredContent: {
      title: '测试游戏',
      description: '游戏描述',
      features: ['特性1', '特性2'],
      requirements: {
        minimum: '最低配置',
        recommended: '推荐配置'
      }
    },
    metadata: {
      wordCount: 50,
      readability: 85,
      seoScore: 90,
      keywordDensity: {
        '游戏': 0.1,
        '测试': 0.08
      }
    }
  },
  qualityAnalysis: {
    overallScore: 85,
    scores: {
      readability: 90,
      seoOptimization: 80,
      contentQuality: 85,
      structureScore: 90,
      keywordUsage: 75
    },
    suggestions: ['建议1', '建议2'],
    issues: ['问题1'],
    strengths: ['优势1', '优势2']
  }
};

const mockResults: PreviewGenerationResult[] = [
  mockResult,
  {
    ...mockResult,
    id: 'test-2',
    gameId: 'game-002',
    gameName: '测试游戏2'
  }
];

describe('ResultExportService', () => {
  beforeEach(() => {
    // 清理之前的测试数据
    resultExportService.clearExportHistory();
    localStorage.clear();
  });

  describe('单个结果导出', () => {
    it('应该成功导出JSON格式', async () => {
      const config: ExportConfig = {
        format: ExportFormat.JSON,
        includeMetadata: true,
        includeQualityAnalysis: true,
        encoding: 'utf-8'
      };

      const result = await resultExportService.exportSingle(mockResult, config);

      expect(result.success).toBe(true);
      expect(result.fileName).toContain('.json');
      expect(result.metadata.format).toBe(ExportFormat.JSON);
      expect(result.metadata.totalRecords).toBe(1);
      expect(result.blob).toBeDefined();
    });

    it('应该成功导出CSV格式', async () => {
      const config: ExportConfig = {
        format: ExportFormat.CSV,
        includeMetadata: false,
        includeQualityAnalysis: false,
        encoding: 'utf-8'
      };

      const result = await resultExportService.exportSingle(mockResult, config);

      expect(result.success).toBe(true);
      expect(result.fileName).toContain('.csv');
      expect(result.metadata.format).toBe(ExportFormat.CSV);
    });

    it('应该处理无效数据', async () => {
      const config: ExportConfig = {
        format: ExportFormat.JSON,
        includeMetadata: true,
        includeQualityAnalysis: true
      };

      const invalidResult = { ...mockResult, content: null } as any;
      const result = await resultExportService.exportSingle(invalidResult, config);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('批量导出', () => {
    it('应该成功批量导出', async () => {
      const config: BatchExportConfig = {
        format: ExportFormat.JSON,
        includeMetadata: true,
        includeQualityAnalysis: true,
        batchSize: 10,
        includeIndex: true,
        separateFiles: false,
        encoding: 'utf-8'
      };

      const result = await resultExportService.exportBatch(mockResults, config);

      expect(result.success).toBe(true);
      expect(result.metadata.totalRecords).toBe(2);
      expect(result.fileName).toContain('batch');
    });

    it('应该处理分离文件选项', async () => {
      const config: BatchExportConfig = {
        format: ExportFormat.CSV,
        includeMetadata: true,
        includeQualityAnalysis: false,
        batchSize: 1,
        includeIndex: true,
        separateFiles: true,
        encoding: 'utf-8'
      };

      const result = await resultExportService.exportBatch(mockResults, config);

      expect(result.success).toBe(true);
      // 分离文件模式会产生多个文件
    });

    it('应该处理空数组', async () => {
      const config: BatchExportConfig = {
        format: ExportFormat.JSON,
        includeMetadata: true,
        includeQualityAnalysis: true,
        batchSize: 10,
        includeIndex: true,
        separateFiles: false
      };

      const result = await resultExportService.exportBatch([], config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('下载功能', () => {
    it('应该创建下载链接', () => {
      const blob = new Blob(['test data'], { type: 'application/json' });
      const downloadUrl = resultExportService.createDownloadUrl(blob);

      expect(downloadUrl).toContain('blob:');
      
      // 清理
      URL.revokeObjectURL(downloadUrl);
    });

    it('应该触发文件下载', () => {
      const mockExportResult = {
        success: true,
        fileName: 'test.json',
        blob: new Blob(['test'], { type: 'application/json' }),
        downloadUrl: 'blob:test',
        metadata: {
          exportTime: new Date().toISOString(),
          totalRecords: 1,
          fileSize: 4,
          format: ExportFormat.JSON
        }
      };

      // 模拟 DOM 环境
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        style: { display: '' }
      };
      
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      resultExportService.downloadFile(mockExportResult);

      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('导出历史', () => {
    it('应该记录导出历史', async () => {
      const config: ExportConfig = {
        format: ExportFormat.JSON,
        includeMetadata: true,
        includeQualityAnalysis: true
      };

      await resultExportService.exportSingle(mockResult, config);

      const history = resultExportService.getExportHistory();
      expect(history).toHaveLength(1);
      expect(history[0].metadata.format).toBe(ExportFormat.JSON);
    });

    it('应该生成导出统计', async () => {
      const config: ExportConfig = {
        format: ExportFormat.JSON,
        includeMetadata: true,
        includeQualityAnalysis: true
      };

      // 执行多次导出
      await resultExportService.exportSingle(mockResult, config);
      await resultExportService.exportSingle(mockResult, { ...config, format: ExportFormat.CSV });

      const stats = resultExportService.getExportStats();
      expect(stats.totalExports).toBe(2);
      expect(stats.successfulExports).toBe(2);
      expect(stats.exportsByFormat[ExportFormat.JSON]).toBe(1);
      expect(stats.exportsByFormat[ExportFormat.CSV]).toBe(1);
    });

    it('应该清空导出历史', async () => {
      const config: ExportConfig = {
        format: ExportFormat.JSON,
        includeMetadata: true,
        includeQualityAnalysis: true
      };

      await resultExportService.exportSingle(mockResult, config);
      expect(resultExportService.getExportHistory()).toHaveLength(1);

      resultExportService.clearExportHistory();
      expect(resultExportService.getExportHistory()).toHaveLength(0);
    });
  });

  describe('数据验证', () => {
    it('应该验证导出配置', () => {
      const validConfig: ExportConfig = {
        format: ExportFormat.JSON,
        includeMetadata: true,
        includeQualityAnalysis: true
      };

      const invalidConfig = {
        format: 'invalid-format',
        includeMetadata: true
      } as any;

      expect(() => resultExportService.validateConfig(validConfig)).not.toThrow();
      expect(() => resultExportService.validateConfig(invalidConfig)).toThrow();
    });

    it('应该验证结果数据', () => {
      const validResult = mockResult;
      const invalidResult = { ...mockResult, content: null } as any;

      expect(resultExportService.validateResult(validResult)).toBe(true);
      expect(resultExportService.validateResult(invalidResult)).toBe(false);
    });
  });

  describe('格式转换', () => {
    it('应该正确转换为JSON格式', () => {
      const json = resultExportService.convertToJson(mockResult, {
        includeMetadata: true,
        includeQualityAnalysis: true
      });

      const parsed = JSON.parse(json);
      expect(parsed.gameId).toBe(mockResult.gameId);
      expect(parsed.content).toBeDefined();
      expect(parsed.qualityAnalysis).toBeDefined();
    });

    it('应该正确转换为CSV格式', () => {
      const csv = resultExportService.convertToCsv([mockResult], {
        includeMetadata: true,
        includeQualityAnalysis: false
      });

      const lines = csv.split('\n');
      expect(lines[0]).toContain('gameId'); // 头部
      expect(lines[1]).toContain(mockResult.gameId); // 数据行
    });

    it('应该处理特殊字符', () => {
      const specialResult = {
        ...mockResult,
        gameName: '游戏名称,包含"特殊"字符'
      };

      const csv = resultExportService.convertToCsv([specialResult], {
        includeMetadata: false,
        includeQualityAnalysis: false
      });

      expect(csv).toContain('"游戏名称,包含""特殊""字符"');
    });
  });

  describe('压缩功能', () => {
    it('应该压缩大文件', async () => {
      const largeResults = Array(100).fill(mockResult).map((result, index) => ({
        ...result,
        id: `test-${index}`,
        gameId: `game-${index}`
      }));

      const config: BatchExportConfig = {
        format: ExportFormat.JSON,
        includeMetadata: true,
        includeQualityAnalysis: true,
        batchSize: 50,
        includeIndex: true,
        separateFiles: false,
        compression: true
      };

      const result = await resultExportService.exportBatch(largeResults, config);

      expect(result.success).toBe(true);
      expect(result.metadata.totalRecords).toBe(100);
    });
  });
});

// 模拟浏览器环境
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:test'),
    revokeObjectURL: jest.fn()
  }
});

Object.defineProperty(global, 'Blob', {
  value: class MockBlob {
    constructor(public content: any[], public options: any) {}
    
    get size() {
      return JSON.stringify(this.content).length;
    }
    
    get type() {
      return this.options.type || 'application/octet-stream';
    }
  }
}); 