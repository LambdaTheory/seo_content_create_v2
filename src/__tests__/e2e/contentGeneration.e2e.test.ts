/**
 * 内容生成端到端测试
 * 任务11.1.3：进行端到端测试 - 真实环境测试
 */

import { ContentGenerationOrchestrator } from '@/services/contentGenerationOrchestrator';
import { deepseekApiService } from '@/services/deepseekApi';
import { GameDataStorageService } from '@/services/gameDataStorage';
import type { GenerationFlowConfiguration } from '@/services/contentGenerationOrchestrator';
import type { GameData } from '@/types/GameData.types';

// Mock external dependencies for isolated testing
jest.mock('@/services/deepseekApi');
jest.mock('@/services/gameDataStorage');

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
    },
    {
      id: 'e2e-game-2',
      name: 'Space Shooter',
      category: 'Action',
      platform: 'Mobile',
      description: 'Fast-paced space combat game',
      features: ['Real-time combat', 'Multiplayer', 'Customizable ships'],
      tags: ['space', 'shooter', 'action'],
      rating: 7.8,
      releaseDate: '2023-06-20',
      developer: 'Mobile Games Studio',
      publisher: 'Mobile Publisher',
      genre: 'Action Shooter',
      ageRating: 'E10+',
      systemRequirements: {
        minimum: { os: 'iOS 14', cpu: 'A12', ram: '3GB', storage: '2GB' },
        recommended: { os: 'iOS 16', cpu: 'A15', ram: '6GB', storage: '4GB' }
      }
    }
  ];

  beforeEach(() => {
    orchestrator = new ContentGenerationOrchestrator();
    jest.clearAllMocks();
    
    // Setup mock implementations
    (GameDataStorageService.getGameById as jest.Mock).mockImplementation((id: string) => {
      const game = mockGameData.find(g => g.id === id);
      return game ? Promise.resolve(game) : Promise.reject(new Error('Game not found'));
    });

    (GameDataStorageService.batchQuery as jest.Mock).mockImplementation((ids: string[]) => {
      const games = mockGameData.filter(g => ids.includes(g.id));
      return Promise.resolve(games);
    });
  });

  afterEach(() => {
    orchestrator.cancelAllFlows();
  });

  describe('完整内容生成流程', () => {
    it('应该成功完成RPG游戏的内容生成', async () => {
      // Mock API responses for RPG game
      (deepseekApiService.analyzeFormat as jest.Mock).mockResolvedValue({
        format: {
          type: 'game-review',
          structure: ['introduction', 'gameplay', 'graphics', 'story', 'conclusion'],
          tone: 'professional',
          targetAudience: 'gaming enthusiasts'
        },
        keywords: ['RPG', 'adventure', 'fantasy', 'character development'],
        recommendations: ['Focus on story elements', 'Highlight customization features']
      });

      (deepseekApiService.generateContent as jest.Mock).mockResolvedValue({
        title: 'Adventure Quest: A Comprehensive Review',
        content: `
          # Adventure Quest: A Comprehensive Review

          ## Introduction
          Adventure Quest stands as a remarkable entry in the RPG genre, offering players an immersive fantasy experience that combines traditional role-playing elements with modern game design.

          ## Gameplay
          The game features an extensive character customization system that allows players to create unique heroes. The open-world design encourages exploration and discovery, with numerous side quests and hidden treasures.

          ## Story
          Set in a rich fantasy universe, Adventure Quest delivers a compelling narrative that spans multiple kingdoms and realms. The story-driven approach ensures that every quest feels meaningful and contributes to the overall experience.

          ## Graphics and Audio
          The visual presentation is stunning, with detailed environments and smooth character animations. The orchestral soundtrack perfectly complements the epic fantasy atmosphere.

          ## Conclusion
          Adventure Quest successfully combines classic RPG elements with innovative gameplay mechanics, making it a must-play for genre enthusiasts. Rating: 8.5/10
        `,
        metadata: {
          wordCount: 1025,
          keywordDensity: {
            'RPG': 2.3,
            'adventure': 2.1,
            'fantasy': 1.8,
            'character': 1.5
          },
          readabilityScore: 85,
          seoScore: 92
        }
      });

      (deepseekApiService.correctFormat as jest.Mock).mockResolvedValue({
        content: `
          # Adventure Quest: A Comprehensive Review

          ## Introduction
          Adventure Quest stands as a remarkable entry in the RPG genre, offering players an immersive fantasy experience that combines traditional role-playing elements with modern game design.

          ## Gameplay Features
          The game features an extensive character customization system that allows players to create unique heroes. The open-world design encourages exploration and discovery, with numerous side quests and hidden treasures.

          ## Story and Narrative
          Set in a rich fantasy universe, Adventure Quest delivers a compelling narrative that spans multiple kingdoms and realms. The story-driven approach ensures that every quest feels meaningful and contributes to the overall experience.

          ## Graphics and Audio
          The visual presentation is stunning, with detailed environments and smooth character animations. The orchestral soundtrack perfectly complements the epic fantasy atmosphere.

          ## Final Verdict
          Adventure Quest successfully combines classic RPG elements with innovative gameplay mechanics, making it a must-play for genre enthusiasts. 

          **Rating: 8.5/10**
          **Recommended for:** RPG fans, fantasy enthusiasts, story-driven game lovers
        `,
        corrections: [
          'Improved heading structure for better SEO',
          'Enhanced conclusion section',
          'Added recommendation tags',
          'Optimized keyword distribution'
        ],
        qualityMetrics: {
          wordCount: 1050,
          keywordDensity: {
            'RPG': 2.5,
            'adventure': 2.2,
            'fantasy': 1.9,
            'character': 1.6
          },
          readabilityScore: 88,
          seoScore: 95
        }
      });

      const config: GenerationFlowConfiguration = {
        workflowId: 'e2e-rpg-workflow',
        gameIds: ['e2e-game-1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'review'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, 30000); // 30 second timeout

        let progressCount = 0;
        let completedSuccessfully = false;

        orchestrator.on('progress', (data) => {
          progressCount++;
          expect(data.flowId).toBeDefined();
          expect(data.progress).toBeGreaterThanOrEqual(0);
          expect(data.progress).toBeLessThanOrEqual(100);
          console.log(`Progress: ${data.progress}% - ${data.currentStage || 'Unknown stage'}`);
        });

        orchestrator.on('completed', (data) => {
          try {
            clearTimeout(timeout);
            completedSuccessfully = true;

            expect(data.flowId).toBeDefined();
            expect(data.results).toBeDefined();
            expect(data.results.length).toBe(1);

            const result = data.results[0];
            expect(result.gameId).toBe('e2e-game-1');
            expect(result.status).toBe('completed');
            expect(result.content).toBeDefined();
            expect(result.content.title).toContain('Adventure Quest');
            expect(result.content.body).toContain('RPG');
            expect(result.qualityMetrics.seoScore).toBeGreaterThan(90);

            expect(progressCount).toBeGreaterThan(0);
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        orchestrator.on('error', (data) => {
          clearTimeout(timeout);
          reject(new Error(`Flow failed: ${data.error.message}`));
        });

        orchestrator.startFlow(config).then((flowId) => {
          expect(flowId).toBeDefined();
        }).catch(reject);
      });
    }, 35000);

    it('应该成功处理多游戏并行生成', async () => {
      // Mock API responses for multiple games
      (deepseekApiService.analyzeFormat as jest.Mock)
        .mockResolvedValueOnce({
          format: { type: 'rpg-review', structure: ['intro', 'gameplay', 'story', 'conclusion'] },
          keywords: ['RPG', 'adventure', 'fantasy']
        })
        .mockResolvedValueOnce({
          format: { type: 'action-review', structure: ['intro', 'gameplay', 'graphics', 'conclusion'] },
          keywords: ['action', 'shooter', 'space']
        });

      (deepseekApiService.generateContent as jest.Mock)
        .mockResolvedValueOnce({
          title: 'Adventure Quest Review',
          content: 'RPG game content...',
          metadata: { wordCount: 1000, keywordDensity: { 'RPG': 2.5 } }
        })
        .mockResolvedValueOnce({
          title: 'Space Shooter Review',
          content: 'Action game content...',
          metadata: { wordCount: 950, keywordDensity: { 'action': 2.8 } }
        });

      (deepseekApiService.correctFormat as jest.Mock)
        .mockResolvedValueOnce({
          content: 'Corrected RPG content...',
          qualityMetrics: { seoScore: 95 }
        })
        .mockResolvedValueOnce({
          content: 'Corrected action content...',
          qualityMetrics: { seoScore: 93 }
        });

      const config: GenerationFlowConfiguration = {
        workflowId: 'e2e-multi-workflow',
        gameIds: ['e2e-game-1', 'e2e-game-2'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'review'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Multi-game test timeout'));
        }, 45000); // 45 second timeout for multiple games

        orchestrator.on('completed', (data) => {
          try {
            clearTimeout(timeout);

            expect(data.results).toBeDefined();
            expect(data.results.length).toBe(2);

            const rpgResult = data.results.find(r => r.gameId === 'e2e-game-1');
            const actionResult = data.results.find(r => r.gameId === 'e2e-game-2');

            expect(rpgResult).toBeDefined();
            expect(actionResult).toBeDefined();
            expect(rpgResult!.status).toBe('completed');
            expect(actionResult!.status).toBe('completed');

            resolve();
          } catch (error) {
            reject(error);
          }
        });

        orchestrator.on('error', (data) => {
          clearTimeout(timeout);
          reject(new Error(`Multi-game flow failed: ${data.error.message}`));
        });

        orchestrator.startFlow(config).catch(reject);
      });
    }, 50000);
  });

  describe('错误恢复测试', () => {
    it('应该从API错误中恢复并重试', async () => {
      let apiCallCount = 0;

      (deepseekApiService.analyzeFormat as jest.Mock).mockImplementation(() => {
        apiCallCount++;
        if (apiCallCount <= 2) {
          return Promise.reject(new Error('Temporary API error'));
        }
        return Promise.resolve({
          format: { type: 'review', structure: ['intro', 'content', 'conclusion'] },
          keywords: ['game', 'review']
        });
      });

      (deepseekApiService.generateContent as jest.Mock).mockResolvedValue({
        title: 'Test Game Review',
        content: 'Game review content...',
        metadata: { wordCount: 800 }
      });

      (deepseekApiService.correctFormat as jest.Mock).mockResolvedValue({
        content: 'Corrected content...',
        qualityMetrics: { seoScore: 85 }
      });

      const config: GenerationFlowConfiguration = {
        workflowId: 'e2e-retry-workflow',
        gameIds: ['e2e-game-1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'review'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1,
        retryConfig: {
          maxRetries: 3,
          retryDelay: 100
        }
      };

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Retry test timeout'));
        }, 20000);

        orchestrator.on('completed', (data) => {
          try {
            clearTimeout(timeout);
            expect(apiCallCount).toBe(3); // Should have retried twice
            expect(data.results[0].status).toBe('completed');
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        orchestrator.on('error', (data) => {
          clearTimeout(timeout);
          reject(new Error(`Retry test failed: ${data.error.message}`));
        });

        orchestrator.startFlow(config).catch(reject);
      });
    }, 25000);

    it('应该正确处理超时情况', async () => {
      (deepseekApiService.analyzeFormat as jest.Mock).mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              format: { type: 'review' },
              keywords: ['game']
            });
          }, 2000); // 2 second delay
        });
      });

      const config: GenerationFlowConfiguration = {
        workflowId: 'e2e-timeout-workflow',
        gameIds: ['e2e-game-1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'review'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1,
        timeout: {
          perGame: 1000, // 1 second timeout
          total: 5000
        }
      };

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout test did not complete in time'));
        }, 10000);

        orchestrator.on('error', (data) => {
          try {
            clearTimeout(timeout);
            expect(data.error.message).toContain('timeout');
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        orchestrator.on('completed', () => {
          clearTimeout(timeout);
          reject(new Error('Flow should have timed out but completed instead'));
        });

        orchestrator.startFlow(config).catch(reject);
      });
    }, 15000);
  });

  describe('流程控制测试', () => {
    it('应该支持暂停和恢复流程', async () => {
      let pauseExecuted = false;
      let resumeExecuted = false;

      (deepseekApiService.analyzeFormat as jest.Mock).mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              format: { type: 'review' },
              keywords: ['game']
            });
          }, 500);
        });
      });

      (deepseekApiService.generateContent as jest.Mock).mockResolvedValue({
        title: 'Test Content',
        content: 'Content...',
        metadata: { wordCount: 800 }
      });

      (deepseekApiService.correctFormat as jest.Mock).mockResolvedValue({
        content: 'Corrected content...',
        qualityMetrics: { seoScore: 85 }
      });

      const config: GenerationFlowConfiguration = {
        workflowId: 'e2e-pause-workflow',
        gameIds: ['e2e-game-1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'review'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Pause/Resume test timeout'));
        }, 20000);

        orchestrator.on('progress', async (data) => {
          if (!pauseExecuted && data.progress > 0 && data.progress < 50) {
            pauseExecuted = true;
            try {
              await orchestrator.pauseFlow(data.flowId);
              const status = orchestrator.getFlowStatus(data.flowId);
              expect(status!.status).toBe('paused');
              
              // Resume after a short delay
              setTimeout(async () => {
                resumeExecuted = true;
                await orchestrator.resumeFlow(data.flowId);
                const resumedStatus = orchestrator.getFlowStatus(data.flowId);
                expect(resumedStatus!.status).toBe('running');
              }, 1000);
            } catch (error) {
              clearTimeout(timeout);
              reject(error);
            }
          }
        });

        orchestrator.on('completed', () => {
          try {
            clearTimeout(timeout);
            expect(pauseExecuted).toBe(true);
            expect(resumeExecuted).toBe(true);
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        orchestrator.on('error', (data) => {
          clearTimeout(timeout);
          reject(new Error(`Pause/Resume test failed: ${data.error.message}`));
        });

        orchestrator.startFlow(config).catch(reject);
      });
    }, 25000);
  });

  describe('数据完整性测试', () => {
    it('应该保持数据在整个流程中的一致性', async () => {
      const originalGameData = mockGameData[0];
      let capturedGameData: GameData | null = null;

      (deepseekApiService.analyzeFormat as jest.Mock).mockImplementation((gameData: GameData) => {
        capturedGameData = gameData;
        return Promise.resolve({
          format: { type: 'review' },
          keywords: [gameData.name, gameData.category]
        });
      });

      (deepseekApiService.generateContent as jest.Mock).mockResolvedValue({
        title: `${originalGameData.name} Review`,
        content: `Review of ${originalGameData.name}...`,
        metadata: { wordCount: 800 }
      });

      (deepseekApiService.correctFormat as jest.Mock).mockResolvedValue({
        content: `Corrected review of ${originalGameData.name}...`,
        qualityMetrics: { seoScore: 90 }
      });

      const config: GenerationFlowConfiguration = {
        workflowId: 'e2e-data-integrity-workflow',
        gameIds: ['e2e-game-1'],
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'review'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Data integrity test timeout'));
        }, 15000);

        orchestrator.on('completed', (data) => {
          try {
            clearTimeout(timeout);

            // Verify game data was passed correctly
            expect(capturedGameData).not.toBeNull();
            expect(capturedGameData!.id).toBe(originalGameData.id);
            expect(capturedGameData!.name).toBe(originalGameData.name);
            expect(capturedGameData!.category).toBe(originalGameData.category);

            // Verify result contains correct references
            const result = data.results[0];
            expect(result.gameId).toBe(originalGameData.id);
            expect(result.content.title).toContain(originalGameData.name);

            resolve();
          } catch (error) {
            reject(error);
          }
        });

        orchestrator.on('error', (data) => {
          clearTimeout(timeout);
          reject(new Error(`Data integrity test failed: ${data.error.message}`));
        });

        orchestrator.startFlow(config).catch(reject);
      });
    }, 20000);
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理大量游戏', async () => {
      const startTime = Date.now();
      const gameCount = 5;
      const gameIds = Array.from({ length: gameCount }, (_, i) => `performance-game-${i}`);

      // Mock large dataset
      (GameDataStorageService.batchQuery as jest.Mock).mockImplementation((ids: string[]) => {
        return Promise.resolve(ids.map(id => ({
          ...mockGameData[0],
          id,
          name: `Performance Game ${id.split('-')[2]}`
        })));
      });

      // Mock fast API responses
      (deepseekApiService.analyzeFormat as jest.Mock).mockResolvedValue({
        format: { type: 'review' },
        keywords: ['game', 'performance']
      });

      (deepseekApiService.generateContent as jest.Mock).mockResolvedValue({
        title: 'Performance Test Game Review',
        content: 'Performance test content...',
        metadata: { wordCount: 800 }
      });

      (deepseekApiService.correctFormat as jest.Mock).mockResolvedValue({
        content: 'Corrected performance test content...',
        qualityMetrics: { seoScore: 85 }
      });

      const config: GenerationFlowConfiguration = {
        workflowId: 'e2e-performance-workflow',
        gameIds,
        contentSettings: {
          wordCount: { min: 800, max: 1200, target: 1000 },
          keywordDensity: { main: 2.5, secondary: 1.5 },
          tone: 'professional',
          format: 'review'
        },
        structuredDataTypes: ['GameStructuredData'],
        priority: 1
      };

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Performance test timeout'));
        }, 30000);

        orchestrator.on('completed', (data) => {
          try {
            clearTimeout(timeout);
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(data.results.length).toBe(gameCount);
            expect(duration).toBeLessThan(20000); // Should complete within 20 seconds

            console.log(`Processed ${gameCount} games in ${duration}ms`);
            console.log(`Average time per game: ${duration / gameCount}ms`);
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        orchestrator.on('error', (data) => {
          clearTimeout(timeout);
          reject(new Error(`Performance test failed: ${data.error.message}`));
        });

        orchestrator.startFlow(config).catch(reject);
      });
    }, 35000);
  });
}); 