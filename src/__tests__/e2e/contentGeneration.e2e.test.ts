/**
 * 内容生成端到端测试 - 简化版本
 * 任务11.1.3：进行端到端测试
 */

import { ContentGenerationOrchestrator } from '@/services/contentGenerationOrchestrator';
import { deepseekApi } from '@/services/deepseekApi';
import { GameDataStorageService } from '@/services/gameDataStorage';
import type { GenerationFlowConfiguration } from '@/services/contentGenerationOrchestrator';
import type { GameData } from '@/types/GameData.types';

// Mock外部依赖
jest.mock('@/services/deepseekApi', () => ({
  deepseekApi: {
    chat: jest.fn().mockResolvedValue({
      id: 'test-chat-1',
      object: 'chat.completion',
      created: Date.now(),
      model: 'deepseek-chat',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Test content generated' },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
    }),
    testConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connected' })
  },
  chatWithDeepSeek: jest.fn().mockResolvedValue({
    id: 'test-chat-1',
    object: 'chat.completion',
    created: Date.now(),
    model: 'deepseek-chat',
    choices: [{
      index: 0,
      message: { role: 'assistant', content: 'Test content generated' },
      finish_reason: 'stop'
    }],
    usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
  }),
  DeepSeekApiService: jest.fn().mockImplementation(() => ({
    chat: jest.fn().mockResolvedValue({
      id: 'test-chat-1',
      object: 'chat.completion',
      created: Date.now(),
      model: 'deepseek-chat',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Test content generated' },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
    }),
    testConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connected' })
  }))
}));

jest.mock('@/services/gameDataStorage', () => ({
  GameDataStorageService: {
    getGameById: jest.fn(),
    batchQuery: jest.fn(),
    saveGame: jest.fn(),
    updateGame: jest.fn(),
    deleteGame: jest.fn()
  }
}));

describe('内容生成端到端测试', () => {
  let orchestrator: ContentGenerationOrchestrator;
  
  const mockGameData: GameData[] = [
    {
      id: 'e2e-game-1',
      name: 'Adventure Quest',
      category: 'RPG',
      platform: 'PC',
      description: 'An epic fantasy adventure game',
      features: ['Story-driven', 'Character customization', 'Open world'],
      tags: ['fantasy', 'adventure', 'RPG'],
      rating: 8.5,
      releaseDate: '2023-01-15',
      developer: 'Epic Games Studio',
      publisher: 'Game Publisher Inc',
      genre: 'Role-Playing Game',
      ageRating: 'T',
      systemRequirements: {
        minimum: { os: 'Windows 10', cpu: 'Intel i5', ram: '8GB', storage: '50GB' },
        recommended: { os: 'Windows 11', cpu: 'Intel i7', ram: '16GB', storage: '100GB' }
      }
    }
  ];

  beforeEach(() => {
    orchestrator = new ContentGenerationOrchestrator();
    jest.clearAllMocks();
    
    // 设置mock实现
    (GameDataStorageService.getGameById as jest.Mock).mockImplementation((id: string) => {
      const game = mockGameData.find(g => g.id === id);
      return game ? Promise.resolve(game) : Promise.reject(new Error('Game not found'));
    });

    (GameDataStorageService.batchQuery as jest.Mock).mockImplementation((ids: string[]) => {
      const games = mockGameData.filter(g => g.id && ids.includes(g.id));
      return Promise.resolve(games);
    });
  });

  afterEach(() => {
    // 清理所有正在运行的流程
    const statuses = orchestrator.getAllFlowStatuses();
    statuses.forEach(status => {
      if (status.status === 'running') {
        orchestrator.cancelFlow(status.flowId);
      }
    });
  });

  describe('基本功能测试', () => {
    it('应该能够创建ContentGenerationOrchestrator实例', () => {
      expect(orchestrator).toBeInstanceOf(ContentGenerationOrchestrator);
    });

    it('应该能够获取队列状态', () => {
      const queueStatus = orchestrator.getQueueStatus();
      expect(queueStatus).toHaveProperty('total');
      expect(queueStatus).toHaveProperty('running');
      expect(queueStatus).toHaveProperty('queued');
      expect(queueStatus).toHaveProperty('completed');
      expect(queueStatus).toHaveProperty('failed');
      expect(queueStatus).toHaveProperty('queue');
    });

    it('应该能够启动生成流程', async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameDataIds: ['e2e-game-1'],
        enableStructuredData: false,
        outputFormat: 'json',
        qualityThreshold: 0.7,
        maxRetries: 1,
        concurrency: {
          maxConcurrentGames: 1,
          maxConcurrentStages: 1
        },
        timeout: {
          perGame: 30000,
          total: 60000
        },
        recovery: {
          enableAutoRecovery: false,
          saveCheckpoints: false,
          maxRecoveryAttempts: 1
        },
        notifications: {
          enableProgressUpdates: true,
          enableErrorAlerts: true,
          progressUpdateInterval: 1000
        }
      };

      const flowId = await orchestrator.startGenerationFlow(config);
      expect(typeof flowId).toBe('string');
      expect(flowId).toBeTruthy();

      // 检查流程状态
      const status = orchestrator.getFlowStatus(flowId);
      expect(status).toBeTruthy();
      expect(status?.flowId).toBe(flowId);
      expect(['pending', 'running', 'completed', 'failed']).toContain(status?.status);
    });

    it('应该能够取消流程', async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'cancel-test-workflow',
        gameDataIds: ['e2e-game-1'],
        enableStructuredData: false,
        outputFormat: 'json',
        qualityThreshold: 0.7,
        maxRetries: 1,
        concurrency: {
          maxConcurrentGames: 1,
          maxConcurrentStages: 1
        },
        timeout: {
          perGame: 30000,
          total: 60000
        },
        recovery: {
          enableAutoRecovery: false,
          saveCheckpoints: false,
          maxRecoveryAttempts: 1
        },
        notifications: {
          enableProgressUpdates: true,
          enableErrorAlerts: true,
          progressUpdateInterval: 1000
        }
      };

      const flowId = await orchestrator.startGenerationFlow(config);
      
      // 取消流程
      const cancelResult = orchestrator.cancelFlow(flowId);
      expect(cancelResult).toBe(true);
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status?.status).toBe('cancelled');
    });
  });

  describe('错误处理测试', () => {
    it('应该处理无效配置', async () => {
      const invalidConfig = {
        workflowId: '',
        gameDataIds: [],
        enableStructuredData: false,
        outputFormat: 'json',
        qualityThreshold: 0.7,
        maxRetries: 1,
        concurrency: {
          maxConcurrentGames: 1,
          maxConcurrentStages: 1
        },
        timeout: {
          perGame: 30000,
          total: 60000
        },
        recovery: {
          enableAutoRecovery: false,
          saveCheckpoints: false,
          maxRecoveryAttempts: 1
        },
        notifications: {
          enableProgressUpdates: true,
          enableErrorAlerts: true,
          progressUpdateInterval: 1000
        }
      } as GenerationFlowConfiguration;

      await expect(orchestrator.startGenerationFlow(invalidConfig))
        .rejects
        .toThrow();
    });
  });
}); 