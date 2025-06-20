/**
 * ContentParsingMonitorService测试文件
 */

import { 
  ContentParsingMonitorService, 
  ParseStatus, 
  ParseTask, 
  ErrorLogEntry, 
  PerformanceMetrics,
  RealTimeStatus,
  MonitorConfig
} from '../src/services/ContentParsingMonitorService';
import { ParseResult } from '../src/services/WebContentParsingService';

describe('ContentParsingMonitorService', () => {
  let service: ContentParsingMonitorService;

  beforeEach(() => {
    service = new ContentParsingMonitorService({
      enableRealTimeMonitoring: false
    });
  });

  afterEach(() => {
    service.destroy();
  });

  // 辅助函数：创建成功的解析结果
  const createSuccessResult = (overrides = {}): ParseResult => ({
    success: true,
    content: {
      title: 'Test Game',
      description: 'Test Description',
      features: [],
      tags: [],
      category: 'action'
    },
    parser: 'generic',
    parseTime: 1000,
    qualityScore: 80,
    confidence: 85,
    ...overrides
  });

  // 辅助函数：创建失败的解析结果
  const createFailureResult = (overrides = {}): ParseResult => ({
    success: false,
    error: '解析失败',
    parser: 'generic',
    parseTime: 500,
    qualityScore: 0,
    confidence: 0,
    ...overrides
  });

  describe('基本功能', () => {
    it('应该正确初始化服务', () => {
      expect(service).toBeDefined();
      expect(service.getActiveTasks()).toHaveLength(0);
      expect(service.getMetrics().totalParses).toBe(0);
    });

    it('应该能开始解析任务', () => {
      const taskId = service.startTask('https://example.com', 'generic');
      
      expect(taskId).toMatch(/^task_\d+_[a-z0-9]+$/);
      
      const activeTasks = service.getActiveTasks();
      expect(activeTasks).toHaveLength(1);
      expect(activeTasks[0].url).toBe('https://example.com');
      expect(activeTasks[0].parser).toBe('generic');
      expect(activeTasks[0].status).toBe(ParseStatus.PARSING);
    });

    it('应该能完成成功的解析任务', () => {
      const taskId = service.startTask('https://example.com', 'generic');
      const result = createSuccessResult({ 
        qualityScore: 85, 
        confidence: 90,
        parseTime: 1500
      });
      
      service.completeTask(taskId, result);
      
      const taskHistory = service.getTaskHistory();
      const completedTask = taskHistory.find(t => t.id === taskId);
      
      expect(completedTask).toBeDefined();
      expect(completedTask!.status).toBe(ParseStatus.SUCCESS);
      expect(completedTask!.qualityScore).toBe(85);
      expect(completedTask!.confidence).toBe(90);
    });

    it('应该能完成失败的解析任务', () => {
      const taskId = service.startTask('https://example.com', 'generic');
      const result = createFailureResult({ 
        error: '页面解析失败',
        parseTime: 800
      });
      
      service.completeTask(taskId, result);
      
      const taskHistory = service.getTaskHistory();
      const completedTask = taskHistory.find(t => t.id === taskId);
      
      expect(completedTask).toBeDefined();
      expect(completedTask!.status).toBe(ParseStatus.FAILED);
      expect(completedTask!.error).toBe('页面解析失败');
    });

    it('应该能取消解析任务', () => {
      const taskId = service.startTask('https://example.com', 'generic');
      
      service.cancelTask(taskId, '用户取消');
      
      const taskHistory = service.getTaskHistory();
      const cancelledTask = taskHistory.find(t => t.id === taskId);
      
      expect(cancelledTask).toBeDefined();
      expect(cancelledTask!.status).toBe(ParseStatus.CANCELLED);
      expect(cancelledTask!.error).toBe('用户取消');
    });

    it('应该处理不存在的任务ID', () => {
      const result = createSuccessResult();
      
      // 不应该抛出错误
      expect(() => service.completeTask('nonexistent', result)).not.toThrow();
      
      // 应该记录警告日志
      const errorLogs = service.getErrorLogs();
      expect(errorLogs.some(log => 
        log.level === 'warning' && log.message.includes('任务不存在')
      )).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该记录错误日志', () => {
      const error = new Error('测试错误');
      service.logError('解析失败', 'generic', 'https://example.com', error);
      
      const errorLogs = service.getErrorLogs();
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');
      expect(errorLogs[0].message).toBe('解析失败');
    });

    it('应该记录警告日志', () => {
      service.logWarning('解析警告', 'generic', 'https://example.com');
      
      const errorLogs = service.getErrorLogs();
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('warning');
      expect(errorLogs[0].message).toBe('解析警告');
    });
  });

  describe('性能统计', () => {
    it('应该正确计算成功率', () => {
      // 创建3个成功任务
      for (let i = 0; i < 3; i++) {
        const taskId = service.startTask(`https://example${i}.com`, 'generic');
        service.completeTask(taskId, createSuccessResult());
      }
      
      // 创建2个失败任务
      for (let i = 0; i < 2; i++) {
        const taskId = service.startTask(`https://fail${i}.com`, 'generic');
        service.completeTask(taskId, createFailureResult());
      }
      
      const metrics = service.getMetrics();
      expect(metrics.totalParses).toBe(5);
      expect(metrics.successCount).toBe(3);
      expect(metrics.failureCount).toBe(2);
      expect(metrics.successRate).toBe(60);
    });

    it('应该正确计算平均解析时间', () => {
      const durations = [1000, 2000, 3000];
      
      durations.forEach((duration, index) => {
        const taskId = service.startTask(`https://example${index}.com`, 'generic');
        service.completeTask(taskId, createSuccessResult({ parseTime: duration }));
      });
      
      const metrics = service.getMetrics();
      expect(metrics.avgParseTime).toBeCloseTo(2000, 0);
      expect(metrics.minParseTime).toBe(1000);
      expect(metrics.maxParseTime).toBe(3000);
    });

    it('应该正确计算质量评分和置信度', () => {
      const scores = [70, 80, 90];
      const confidences = [75, 85, 95];
      
      scores.forEach((score, index) => {
        const taskId = service.startTask(`https://example${index}.com`, 'generic');
        service.completeTask(taskId, createSuccessResult({ 
          qualityScore: score, 
          confidence: confidences[index] 
        }));
      });
      
      const metrics = service.getMetrics();
      expect(metrics.avgQualityScore).toBeCloseTo(80, 0);
      expect(metrics.avgConfidence).toBeCloseTo(85, 0);
    });
  });

  describe('解析器性能对比', () => {
    it('应该生成解析器性能对比', () => {
      const parsers = ['generic', 'coolmath', 'gamedistribution'];
      
      parsers.forEach((parser, index) => {
        // 为每个解析器创建2个成功任务和1个失败任务
        for (let i = 0; i < 2; i++) {
          const taskId = service.startTask(`https://${parser}${i}.com`, parser);
          service.completeTask(taskId, createSuccessResult({ 
            parser,
            parseTime: 1000 + index * 500,
            qualityScore: 70 + index * 10,
            confidence: 80 + index * 5
          }));
        }
        
        const taskId = service.startTask(`https://${parser}-fail.com`, parser);
        service.completeTask(taskId, createFailureResult({ 
          parser,
          error: `${parser}解析失败`
        }));
        
        // 记录错误日志
        service.logError(`${parser}解析错误`, parser, `https://${parser}-fail.com`);
      });
      
      const comparison = service.getParserComparison();
      expect(comparison).toHaveLength(3);
      
      // 每个解析器都有3个任务，成功率应该是66.67%
      comparison.forEach(comp => {
        expect(comp.parseCount).toBe(3);
        expect(comp.successRate).toBeCloseTo(66.67, 1);
      });
    });
  });

  describe('配置管理', () => {
    it('应该能更新配置', () => {
      const newConfig: Partial<MonitorConfig> = {
        enableDetailedLogging: false,
        maxErrorLogEntries: 5000
      };
      
      service.updateConfig(newConfig);
      const config = service.getConfig();
      
      expect(config.enableDetailedLogging).toBe(false);
      expect(config.maxErrorLogEntries).toBe(5000);
    });

    it('应该能切换实时监控', () => {
      service.updateConfig({ enableRealTimeMonitoring: true });
      expect(service.getConfig().enableRealTimeMonitoring).toBe(true);
      
      service.updateConfig({ enableRealTimeMonitoring: false });
      expect(service.getConfig().enableRealTimeMonitoring).toBe(false);
    });
  });

  describe('数据清理', () => {
    it('应该能清空所有数据', () => {
      const taskId = service.startTask('https://example.com', 'generic');
      service.completeTask(taskId, createSuccessResult());
      service.logError('测试错误', 'generic', 'https://example.com');
      
      // 验证数据存在
      expect(service.getTaskHistory()).toHaveLength(1);
      expect(service.getErrorLogs()).toHaveLength(1);
      expect(service.getMetrics().totalParses).toBe(1);
      
      // 清空数据
      service.clearAllData();
      
      // 验证数据已清空
      expect(service.getTaskHistory()).toHaveLength(0);
      expect(service.getErrorLogs()).toHaveLength(0);
      expect(service.getMetrics().totalParses).toBe(0);
    });

    it('应该清理过多的任务历史', () => {
      const customService = new ContentParsingMonitorService({
        maxTaskHistory: 2,
        enableRealTimeMonitoring: false
      });
      
      // 创建3个任务，应该只保留最新的2个
      for (let i = 0; i < 3; i++) {
        const taskId = customService.startTask(`https://example${i}.com`, 'generic');
        customService.completeTask(taskId, createSuccessResult());
      }
      
      const taskHistory = customService.getTaskHistory();
      expect(taskHistory.length).toBeLessThanOrEqual(2);
      
      customService.destroy();
    });
  });

  describe('实时状态', () => {
    it('应该正确跟踪活跃任务', () => {
      // 创建2个解析中的任务
      service.startTask('https://example1.com', 'generic');
      service.startTask('https://example2.com', 'generic');
      
      const status = service.getRealTimeStatus();
      expect(status.activeTasks).toBe(2);
      expect(status.pendingTasks).toBe(0);
    });

    it('应该正确评估系统状态', () => {
      const status = service.getRealTimeStatus();
      expect(status.systemStatus).toBe('healthy');
    });
  });

  describe('边界情况', () => {
    it('应该处理空URL和解析器', () => {
      expect(() => service.startTask('', '')).not.toThrow();
      
      const activeTasks = service.getActiveTasks();
      expect(activeTasks).toHaveLength(1);
      expect(activeTasks[0].url).toBe('');
      expect(activeTasks[0].parser).toBe('');
    });

    it('应该处理无效的任务完成', () => {
      const result = createSuccessResult();
      
      // 完成不存在的任务不应该抛出错误
      expect(() => service.completeTask('invalid-id', result)).not.toThrow();
    });

    it('任务ID应该符合预期格式', () => {
      const taskId = service.startTask('https://example.com', 'generic');
      expect(taskId).toMatch(/^task_\d{13}_[a-z0-9]{9}$/);
    });
  });
}); 