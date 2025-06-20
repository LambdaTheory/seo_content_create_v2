import { ContentGenerationService } from '../contentGenerationService';
import { ContentGenerationRequest, ContentSettings, FormatAnalysisResult } from '@/types/DeepSeek.types';

// Mock deepseekApi
jest.mock('../deepseekApi', () => ({
  DeepSeekApiService: jest.fn().mockImplementation(() => ({
    chat: jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            gameName: 'Test Game',
            description: 'This is a test game description',
            features: ['Feature 1', 'Feature 2'],
            category: 'Action'
          })
        }
      }],
      usage: {
        prompt_tokens: 500,
        completion_tokens: 300,
        total_tokens: 800
      }
    })
  }))
}));

// Mock formatAnalysisService
jest.mock('../formatAnalysisService', () => ({
  FormatAnalysisService: jest.fn().mockImplementation(() => ({}))
}));

describe('ContentGenerationService - 智能Prompt构建系统', () => {
  let service: ContentGenerationService;
  let mockRequest: ContentGenerationRequest;

  beforeEach(() => {
    service = new ContentGenerationService();

    const mockFormatRules: FormatAnalysisResult = {
      compactTemplate: '{"gameName":"str","description":"str","features":["str"],"category":"str"}',
      fieldConstraints: [
        'gameName: 必填字符串, max:100',
        'description: 必填字符串, max:500',
        'features: 必填字符串数组',
        'category: 必填字符串'
      ],
      validationRules: [
        '严格遵循字段类型',
        '必填字段必须包含',
        '数组格式保持一致'
      ],
      formatHash: 'test_hash_123',
      detailedRules: {
        schema: {
          gameName: { type: 'string', required: true, examples: [] },
          description: { type: 'string', required: true, examples: [] },
          features: { type: 'array', required: true, arrayItemType: 'string', examples: [] },
          category: { type: 'string', required: true, examples: [] }
        },
        structureRules: ['JSON格式', '字段完整'],
        outputTemplate: {}
      }
    };

    const mockContentSettings: ContentSettings = {
      wordCount: {
        total: { min: 800, max: 1200 },
        modules: {
          description: { min: 200, max: 300 },
          features: { min: 100, max: 200 }
        }
      },
      keywordDensity: {
        mainKeyword: { target: 2.5, max: 3.5 },
        longTailKeywords: { target: 1.5, max: 2.5 },
        naturalDistribution: true
      },
      generationMode: 'standard',
      qualityParams: {
        readabilityLevel: 'intermediate',
        professionalTone: true,
        targetAudience: 'gamers',
        creativeFreedom: true
      }
    };

    mockRequest = {
      gameData: {
        gameName: 'Aventador Vice Crime City',
        mainKeyword: 'car games unblocked',
        longTailKeywords: ['unblocked car games', 'free car games'],
        realUrl: 'https://example.com/game.html',
        videoLink: 'https://youtube.com/watch?v=123',
        iconUrl: 'https://example.com/icon.jpg',
        internalLinks: ['https://example.com/link1', 'https://example.com/link2']
      },
      competitorContent: [
        {
          source: 'CoolMathGames',
          title: 'Racing Game',
          description: 'An exciting racing game with amazing graphics',
          features: ['3D Graphics', 'Multiple Cars', 'Racing Tracks'],
          relevanceScore: 0.95
        }
      ],
      formatRules: mockFormatRules,
      contentSettings: mockContentSettings,
      workflowId: 'test-workflow-123'
    };
  });

  describe('智能Prompt构建', () => {
    it('应该成功生成内容', async () => {
      const result = await service.generateGameContent(mockRequest);

      expect(result).toBeDefined();
      expect(result.gameId).toBeTruthy();
      expect(result.content).toBeDefined();
      expect(result.tokenUsage).toBeDefined();
      expect(result.quality).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('应该包含正确的内容结构', async () => {
      const result = await service.generateGameContent(mockRequest);

      expect(result.content.gameName).toBe('Test Game');
      expect(result.content.description).toBeTruthy();
      expect(Array.isArray(result.content.features)).toBe(true);
      expect(result.content.category).toBeTruthy();
    });

    it('应该追踪Token使用量', async () => {
      const result = await service.generateGameContent(mockRequest);

      expect(result.tokenUsage.promptTokens).toBe(500);
      expect(result.tokenUsage.completionTokens).toBe(300);
      expect(result.tokenUsage.totalTokens).toBe(800);
    });

    it('应该提供质量评估', async () => {
      const result = await service.generateGameContent(mockRequest);

      expect(typeof result.quality.score).toBe('number');
      expect(result.quality.score).toBeGreaterThanOrEqual(0);
      expect(result.quality.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.quality.issues)).toBe(true);
      expect(Array.isArray(result.quality.suggestions)).toBe(true);
    });

    it('应该处理缺失的竞品内容', async () => {
      const requestWithoutCompetitor = {
        ...mockRequest,
        competitorContent: undefined
      };

      const result = await service.generateGameContent(requestWithoutCompetitor);

      expect(result).toBeDefined();
      expect(result.metadata.competitorContentUsed).toBe(0);
    });
  });

  describe('Token控制', () => {
    it('应该在上下文超限时抛出错误', async () => {
      // 模拟超长内容
      const longRequest = {
        ...mockRequest,
        competitorContent: Array(20).fill({
          source: 'TestSite',
          title: 'Very long title '.repeat(100),
          description: 'Very long description '.repeat(200),
          features: Array(50).fill('Very long feature description'),
          relevanceScore: 0.9
        })
      };

      await expect(service.generateGameContent(longRequest)).rejects.toThrow('上下文过长');
    });
  });

  describe('工具函数', () => {
    it('应该正确估算Token数量', () => {
      const englishText = 'Hello world test';
      const chineseText = '你好世界测试';

      const englishTokens = (service as any).estimateTokenCount(englishText);
      const chineseTokens = (service as any).estimateTokenCount(chineseText);

      expect(typeof englishTokens).toBe('number');
      expect(typeof chineseTokens).toBe('number');
      expect(englishTokens).toBeGreaterThan(0);
      expect(chineseTokens).toBeGreaterThan(0);
    });

    it('应该正确截断文本', () => {
      const longText = 'This is a very long text that should be truncated';
      
      const truncated = (service as any).truncateText(longText, 20);
      
      expect(truncated.length).toBeLessThanOrEqual(20);
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('应该生成唯一的游戏ID', () => {
      const gameData = { gameName: 'Test Game' };
      
      const id1 = (service as any).generateGameId(gameData);
      const id2 = (service as any).generateGameId(gameData);
      
      expect(id1).not.toBe(id2);
      expect(id1).toContain('game_');
      expect(id2).toContain('game_');
    });
  });

  describe('错误处理', () => {
    it('应该优雅处理AI API错误', async () => {
      const mockChat = jest.fn().mockRejectedValue(new Error('API Error'));
      (service as any).deepSeekApi.chat = mockChat;

      await expect(service.generateGameContent(mockRequest)).rejects.toThrow('内容生成失败: API Error');
    });

    it('应该处理网络超时', async () => {
      const mockChat = jest.fn().mockRejectedValue(new Error('Request timeout'));
      (service as any).deepSeekApi.chat = mockChat;

      await expect(service.generateGameContent(mockRequest)).rejects.toThrow('内容生成失败: Request timeout');
    });
  });

  describe('配置管理', () => {
    it('应该允许配置更新', () => {
      const newConfig = {
        maxTokens: 5000,
        temperature: 0.8,
        maxConcurrency: 5
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();

      expect(config.maxTokens).toBe(5000);
      expect(config.temperature).toBe(0.8);
      expect(config.maxConcurrency).toBe(5);
    });

    it('应该返回当前统计信息', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalGenerations).toBe('number');
      expect(typeof stats.successfulGenerations).toBe('number');
      expect(typeof stats.failedGenerations).toBe('number');
    });

    it('应该返回运行状态', () => {
      const status = service.getRunningStatus();

      expect(status).toBeDefined();
      expect(typeof status.runningTasks).toBe('number');
      expect(typeof status.queuedTasks).toBe('number');
      expect(typeof status.totalCapacity).toBe('number');
      expect(Array.isArray(status.tasks)).toBe(true);
    });
  });
}); 