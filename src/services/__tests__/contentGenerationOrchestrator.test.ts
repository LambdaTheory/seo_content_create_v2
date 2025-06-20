/**
 * ContentGenerationOrchestrator服务单元测试
 * 任务11.1.1：编写单元测试用例 - 核心服务测试
 */

import { ContentGenerationOrchestrator } from '../contentGenerationOrchestrator';
import type { 
  GenerationFlowConfiguration,
  FlowExecutionStatus 
} from '../contentGenerationOrchestrator';

// Mock dependencies
jest.mock('../deepseekApi', () => ({
  deepseekApiService: {
    analyzeFormat: jest.fn(),
    generateContent: jest.fn(),
    correctFormat: jest.fn()
  }
}));

jest.mock('../structuredData/StructuredDataService', () => ({
  StructuredDataService: {
    generateStructuredData: jest.fn()
  }
}));

jest.mock('../gameDataStorage', () => ({
  GameDataStorageService: {
    getGameById: jest.fn(),
    updateGameData: jest.fn(),
    batchQuery: jest.fn()
  }
}));

describe('ContentGenerationOrchestrator', () => {
  let orchestrator: ContentGenerationOrchestrator;
  
  beforeEach(() => {
    orchestrator = new ContentGenerationOrchestrator();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 清理任何运行中的流程
    orchestrator.cancelAllFlows();
  });

  describe('初始化', () => {
    it('应该正确初始化编排器', () => {
      expect(orchestrator).toBeInstanceOf(ContentGenerationOrchestrator);
      expect(orchestrator.getQueueStatus().activeFlows).toBe(0);
      expect(orchestrator.getQueueStatus().queuedFlows).toBe(0);
    });

    it('应该有正确的默认配置', () => {
      const status = orchestrator.getQueueStatus();
      expect(status.maxConcurrentFlows).toBe(3);
      expect(status.totalFlows).toBe(0);
    });
  });

  describe('流程启动', () => {
    const mockConfig: GenerationFlowConfiguration = {
      workflowId: 'test-workflow',
      gameIds: ['game1', 'game2'],
      contentSettings: {
        wordCount: { min: 800, max: 1200, target: 1000 },
        keywordDensity: { main: 2.5, secondary: 1.5 },
        tone: 'professional',
        format: 'article'
      },
      structuredDataTypes: ['GameStructuredData'],
      priority: 1,
      timeout: {
        perGame: 300000,
        total: 1800000
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000
      }
    };

    it('应该成功启动流程', async () => {
      const flowId = await orchestrator.startFlow(mockConfig);
      
      expect(flowId).toBeDefined();
      expect(typeof flowId).toBe('string');
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status).toBeDefined();
      expect(status!.status).toBe('pending');
    });

    it('应该正确设置流程配置', async () => {
      const flowId = await orchestrator.startFlow(mockConfig);
      const status = orchestrator.getFlowStatus(flowId);
      
      expect(status!.config).toEqual(mockConfig);
      expect(status!.gameIds).toEqual(mockConfig.gameIds);
    });

    it('应该正确处理优先级队列', async () => {
      const highPriorityConfig = { ...mockConfig, priority: 1 };
      const lowPriorityConfig = { ...mockConfig, priority: 5 };
      
      // 添加低优先级流程
      const lowFlowId = await orchestrator.startFlow(lowPriorityConfig);
      
      // 暂停以防止立即执行
      await orchestrator.pauseFlow(lowFlowId);
      
      // 添加高优先级流程
      const highFlowId = await orchestrator.startFlow(highPriorityConfig);
      
      const queueStatus = orchestrator.getQueueStatus();
      expect(queueStatus.queuedFlows).toBeGreaterThan(0);
    });

    it('应该正确处理并发限制', async () => {
      const configs = Array.from({ length: 5 }, (_, i) => ({
        ...mockConfig,
        gameIds: [`game${i}`]
      }));
      
      const flowIds = await Promise.all(
        configs.map(config => orchestrator.startFlow(config))
      );
      
      // 等待一小段时间让流程开始
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const queueStatus = orchestrator.getQueueStatus();
      expect(queueStatus.activeFlows).toBeLessThanOrEqual(3);
      expect(queueStatus.totalFlows).toBe(5);
    });
  });

  describe('流程控制', () => {
    let flowId: string;
    
    beforeEach(async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };
      
      flowId = await orchestrator.startFlow(config);
    });

    it('应该能够暂停流程', async () => {
      await orchestrator.pauseFlow(flowId);
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status!.status).toBe('paused');
    });

    it('应该能够恢复流程', async () => {
      await orchestrator.pauseFlow(flowId);
      await orchestrator.resumeFlow(flowId);
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status!.status).toBe('running');
    });

    it('应该能够取消流程', async () => {
      await orchestrator.cancelFlow(flowId);
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status!.status).toBe('cancelled');
    });

    it('应该正确处理无效的流程ID', async () => {
      const invalidId = 'invalid-flow-id';
      
      await expect(orchestrator.pauseFlow(invalidId)).rejects.toThrow();
      await expect(orchestrator.resumeFlow(invalidId)).rejects.toThrow();
      await expect(orchestrator.cancelFlow(invalidId)).rejects.toThrow();
    });
  });

  describe('事件处理', () => {
    it('应该正确发送进度更新事件', (done) => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      orchestrator.on('progress', (data) => {
        expect(data.flowId).toBeDefined();
        expect(data.progress).toBeGreaterThanOrEqual(0);
        expect(data.progress).toBeLessThanOrEqual(100);
        done();
      });

      orchestrator.startFlow(config);
    });

    it('应该正确发送完成事件', (done) => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      orchestrator.on('completed', (data) => {
        expect(data.flowId).toBeDefined();
        expect(data.results).toBeDefined();
        done();
      });

      orchestrator.startFlow(config);
    });

    it('应该正确发送错误事件', (done) => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['invalid-game'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      orchestrator.on('error', (data) => {
        expect(data.flowId).toBeDefined();
        expect(data.error).toBeDefined();
        done();
      });

      // Mock GameDataStorageService to throw error
      const { GameDataStorageService } = require('../gameDataStorage');
      GameDataStorageService.getGameById.mockRejectedValue(new Error('Game not found'));

      orchestrator.startFlow(config);
    });
  });

  describe('错误处理', () => {
    it('应该正确处理API错误', async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      // Mock API to throw error
      const { deepseekApiService } = require('../deepseekApi');
      deepseekApiService.analyzeFormat.mockRejectedValue(new Error('API Error'));

      const flowId = await orchestrator.startFlow(config);
      
      // 等待错误处理
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status!.status).toBe('failed');
      expect(status!.errors.length).toBeGreaterThan(0);
    });

    it('应该支持重试机制', async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1,
        retryConfig: {
          maxRetries: 2,
          retryDelay: 100
        }
      };

      const { deepseekApiService } = require('../deepseekApi');
      deepseekApiService.analyzeFormat
        .mockRejectedValueOnce(new Error('Temporary Error'))
        .mockRejectedValueOnce(new Error('Temporary Error'))
        .mockResolvedValue({ format: 'success' });

      const flowId = await orchestrator.startFlow(config);
      
      // 等待重试完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(deepseekApiService.analyzeFormat).toHaveBeenCalledTimes(3);
    });

    it('应该处理超时情况', async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1,
        timeout: {
          perGame: 100, // 100ms超时
          total: 1000
        }
      };

      // Mock API to take a long time
      const { deepseekApiService } = require('../deepseekApi');
      deepseekApiService.analyzeFormat.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 200))
      );

      const flowId = await orchestrator.startFlow(config);
      
      // 等待超时
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status!.status).toBe('failed');
    });
  });

  describe('状态查询', () => {
    it('应该正确返回流程状态', async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1', 'game2'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      const flowId = await orchestrator.startFlow(config);
      const status = orchestrator.getFlowStatus(flowId);
      
      expect(status).toBeDefined();
      expect(status!.flowId).toBe(flowId);
      expect(status!.config).toEqual(config);
      expect(status!.progress).toBeGreaterThanOrEqual(0);
    });

    it('应该正确返回队列状态', async () => {
      const queueStatus = orchestrator.getQueueStatus();
      
      expect(queueStatus).toHaveProperty('activeFlows');
      expect(queueStatus).toHaveProperty('queuedFlows');
      expect(queueStatus).toHaveProperty('maxConcurrentFlows');
      expect(queueStatus).toHaveProperty('totalFlows');
    });

    it('应该正确返回所有流程', async () => {
      const config1: GenerationFlowConfiguration = {
        workflowId: 'workflow1',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      const config2: GenerationFlowConfiguration = {
        workflowId: 'workflow2',
        gameIds: ['game2'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 2
      };

      await orchestrator.startFlow(config1);
      await orchestrator.startFlow(config2);

      const allFlows = orchestrator.getAllFlows();
      expect(allFlows.length).toBe(2);
    });
  });

  describe('检查点和恢复', () => {
    it('应该能够保存检查点', async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      const flowId = await orchestrator.startFlow(config);
      
      // 暂停流程以创建检查点
      await orchestrator.pauseFlow(flowId);
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status!.checkpoint).toBeDefined();
    });

    it('应该能够从检查点恢复', async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      const flowId = await orchestrator.startFlow(config);
      
      // 暂停和恢复
      await orchestrator.pauseFlow(flowId);
      await orchestrator.resumeFlow(flowId);
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status!.status).toBe('running');
    });
  });

  describe('内存和性能', () => {
    it('应该正确清理已完成的流程', async () => {
      const config: GenerationFlowConfiguration = {
        workflowId: 'test-workflow',
        gameIds: ['game1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      const flowId = await orchestrator.startFlow(config);
      
      // 取消流程
      await orchestrator.cancelFlow(flowId);
      
      // 清理
      orchestrator.cleanupCompletedFlows();
      
      const status = orchestrator.getFlowStatus(flowId);
      expect(status).toBeUndefined();
    });

    it('应该能够处理大量并发流程', async () => {
      const configs = Array.from({ length: 100 }, (_, i) => ({
        workflowId: `workflow-${i}`,
        gameIds: [`game${i}`],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'article'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: Math.floor(Math.random() * 10) + 1
      }));

      const startTime = performance.now();
      
      const flowIds = await Promise.all(
        configs.map(config => orchestrator.startFlow(config))
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(flowIds.length).toBe(100);
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
      
      // 清理
      await Promise.all(flowIds.map(id => orchestrator.cancelFlow(id)));
    });
  });
}); 