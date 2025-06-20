/**
 * 工作流集成测试
 * 任务11.1.2：实现集成测试 - 完整工作流测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

// 模拟页面组件
import WorkflowPage from '@/app/workflow/page';
import UploadPage from '@/app/upload/page';
import GeneratePage from '@/app/generate/page';
import ResultsPage from '@/app/results/page';

// Mock API responses
const mockApiResponses = {
  uploadCSV: {
    success: true,
    data: {
      total: 10,
      valid: 8,
      invalid: 2,
      games: [
        { id: '1', name: 'Test Game 1', category: 'Action', platform: 'PC' },
        { id: '2', name: 'Test Game 2', category: 'RPG', platform: 'Mobile' },
      ]
    }
  },
  createWorkflow: {
    success: true,
    data: {
      id: 'workflow-123',
      name: 'Test Workflow',
      status: 'active'
    }
  },
  startGeneration: {
    success: true,
    data: {
      flowId: 'flow-456',
      status: 'running'
    }
  },
  getResults: {
    success: true,
    data: {
      results: [
        {
          id: 'result-1',
          gameId: '1',
          content: { title: 'Generated Content 1', body: 'Content body...' },
          status: 'completed'
        }
      ]
    }
  }
};

// Mock fetch
global.fetch = jest.fn();

describe('工作流集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('完整工作流程', () => {
    it('应该完成从CSV上传到内容生成的完整流程', async () => {
      const user = userEvent.setup();

      // 1. 创建工作流
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.createWorkflow
      });

      render(<WorkflowPage />);

      // 填写工作流名称
      const nameInput = screen.getByLabelText(/工作流名称/i);
      await user.type(nameInput, 'Integration Test Workflow');

      // 设置内容参数
      const wordCountInput = screen.getByLabelText(/字数/i);
      await user.clear(wordCountInput);
      await user.type(wordCountInput, '1000');

      // 创建工作流
      const createButton = screen.getByRole('button', { name: /创建工作流/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/工作流创建成功/i)).toBeInTheDocument();
      });

      // 2. 上传CSV数据
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.uploadCSV
      });

      render(<UploadPage />);

      // 模拟文件上传
      const fileInput = screen.getByLabelText(/选择CSV文件/i);
      const csvFile = new File(['name,category,platform\nTest Game,Action,PC'], 'games.csv', {
        type: 'text/csv'
      });

      await user.upload(fileInput, csvFile);

      // 点击上传按钮
      const uploadButton = screen.getByRole('button', { name: /上传/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/上传成功/i)).toBeInTheDocument();
        expect(screen.getByText(/8.*有效/i)).toBeInTheDocument();
        expect(screen.getByText(/2.*无效/i)).toBeInTheDocument();
      });

      // 3. 开始生成内容
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.startGeneration
      });

      render(<GeneratePage />);

      // 选择工作流
      const workflowSelect = screen.getByLabelText(/选择工作流/i);
      await user.selectOptions(workflowSelect, 'workflow-123');

      // 选择数据源
      const dataSourceSelect = screen.getByLabelText(/选择数据源/i);
      await user.selectOptions(dataSourceSelect, 'uploaded-csv');

      // 开始生成
      const generateButton = screen.getByRole('button', { name: /开始生成/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/生成已开始/i)).toBeInTheDocument();
      });

      // 4. 查看结果
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.getResults
      });

      render(<ResultsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Generated Content 1/i)).toBeInTheDocument();
      });

      // 验证完整流程
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('应该正确处理流程中的错误', async () => {
      const user = userEvent.setup();

      // Mock API错误
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      render(<WorkflowPage />);

      const nameInput = screen.getByLabelText(/工作流名称/i);
      await user.type(nameInput, 'Error Test Workflow');

      const createButton = screen.getByRole('button', { name: /创建工作流/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/创建失败/i)).toBeInTheDocument();
      });
    });
  });

  describe('数据流测试', () => {
    it('应该正确传递数据在不同步骤之间', async () => {
      const user = userEvent.setup();

      // 模拟创建工作流
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'workflow-data-test',
            name: 'Data Flow Test',
            contentSettings: {
              wordCount: { min: 800, max: 1200, target: 1000 },
              keywordDensity: { main: 2.5, secondary: 1.5 }
            }
          }
        })
      });

      render(<WorkflowPage />);

      // 创建包含特定设置的工作流
      const nameInput = screen.getByLabelText(/工作流名称/i);
      await user.type(nameInput, 'Data Flow Test');

      const wordCountInput = screen.getByLabelText(/目标字数/i);
      await user.clear(wordCountInput);
      await user.type(wordCountInput, '1000');

      const densityInput = screen.getByLabelText(/关键词密度/i);
      await user.clear(densityInput);
      await user.type(densityInput, '2.5');

      const createButton = screen.getByRole('button', { name: /创建工作流/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/workflows', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"wordCount":{"min":800,"max":1200,"target":1000}')
        }));
      });

      // 验证数据在生成页面中正确显示
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'workflow-data-test',
              name: 'Data Flow Test',
              contentSettings: {
                wordCount: { target: 1000 },
                keywordDensity: { main: 2.5 }
              }
            }
          ]
        })
      });

      render(<GeneratePage />);

      const workflowSelect = screen.getByLabelText(/选择工作流/i);
      await user.selectOptions(workflowSelect, 'workflow-data-test');

      // 验证设置正确显示
      expect(screen.getByText(/目标字数.*1000/i)).toBeInTheDocument();
      expect(screen.getByText(/关键词密度.*2.5/i)).toBeInTheDocument();
    });
  });

  describe('状态同步测试', () => {
    it('应该实时更新生成进度', async () => {
      const user = userEvent.setup();

      // Mock开始生成
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { flowId: 'progress-test-flow' }
        })
      });

      // Mock进度查询
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              flows: [{
                id: 'progress-test-flow',
                status: 'running',
                progress: 25,
                currentStage: '格式分析中'
              }]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              flows: [{
                id: 'progress-test-flow',
                status: 'running',
                progress: 50,
                currentStage: '内容生成中'
              }]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              flows: [{
                id: 'progress-test-flow',
                status: 'completed',
                progress: 100,
                currentStage: '已完成'
              }]
            }
          })
        });

      render(<GeneratePage />);

      // 开始生成
      const generateButton = screen.getByRole('button', { name: /开始生成/i });
      await user.click(generateButton);

      // 验证进度更新
      await waitFor(() => {
        expect(screen.getByText(/25%/)).toBeInTheDocument();
        expect(screen.getByText(/格式分析中/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/50%/)).toBeInTheDocument();
        expect(screen.getByText(/内容生成中/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/100%/)).toBeInTheDocument();
        expect(screen.getByText(/已完成/)).toBeInTheDocument();
      });
    });

    it('应该正确处理生成失败状态', async () => {
      const user = userEvent.setup();

      // Mock开始生成
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { flowId: 'error-test-flow' }
        })
      });

      // Mock错误状态
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            flows: [{
              id: 'error-test-flow',
              status: 'failed',
              progress: 30,
              errors: [
                {
                  stage: '内容生成',
                  message: 'API调用失败',
                  severity: 'error'
                }
              ]
            }]
          }
        })
      });

      render(<GeneratePage />);

      const generateButton = screen.getByRole('button', { name: /开始生成/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/生成失败/i)).toBeInTheDocument();
        expect(screen.getByText(/API调用失败/i)).toBeInTheDocument();
      });

      // 验证重试按钮可用
      const retryButton = screen.getByRole('button', { name: /重试/i });
      expect(retryButton).toBeEnabled();
    });
  });

  describe('用户交互测试', () => {
    it('应该支持流程暂停和恢复', async () => {
      const user = userEvent.setup();

      // Mock开始生成
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { flowId: 'pause-test-flow' }
        })
      });

      // Mock暂停
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Mock恢复
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<GeneratePage />);

      // 开始生成
      const generateButton = screen.getByRole('button', { name: /开始生成/i });
      await user.click(generateButton);

      // 暂停生成
      const pauseButton = screen.getByRole('button', { name: /暂停/i });
      await user.click(pauseButton);

      expect(fetch).toHaveBeenCalledWith('/api/generate/flow', expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"action":"pause"')
      }));

      // 恢复生成
      const resumeButton = screen.getByRole('button', { name: /继续/i });
      await user.click(resumeButton);

      expect(fetch).toHaveBeenCalledWith('/api/generate/flow', expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"action":"resume"')
      }));
    });

    it('应该支持键盘快捷键操作', async () => {
      const user = userEvent.setup();

      render(<GeneratePage />);

      // 测试Ctrl+Enter快捷键
      await user.keyboard('{Control>}{Enter}{/Control}');

      // 验证开始生成被触发（需要根据实际实现调整）
      expect(fetch).toHaveBeenCalledWith('/api/generate/flow', expect.objectContaining({
        method: 'POST'
      }));
    });
  });

  describe('数据验证测试', () => {
    it('应该验证上传数据的完整性', async () => {
      const user = userEvent.setup();

      // Mock验证响应
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            total: 5,
            valid: 3,
            invalid: 2,
            errors: [
              { row: 2, field: 'name', message: '名称不能为空' },
              { row: 4, field: 'category', message: '分类无效' }
            ]
          }
        })
      });

      render(<UploadPage />);

      // 上传包含错误的CSV
      const fileInput = screen.getByLabelText(/选择CSV文件/i);
      const invalidCSV = new File([
        'name,category,platform\n',
        ',Action,PC\n',
        'Valid Game,RPG,Mobile\n',
        'Another Game,InvalidCategory,Console'
      ].join(''), 'invalid.csv', { type: 'text/csv' });

      await user.upload(fileInput, invalidCSV);

      const uploadButton = screen.getByRole('button', { name: /上传/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/3.*有效/i)).toBeInTheDocument();
        expect(screen.getByText(/2.*无效/i)).toBeInTheDocument();
        expect(screen.getByText(/名称不能为空/i)).toBeInTheDocument();
        expect(screen.getByText(/分类无效/i)).toBeInTheDocument();
      });
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理大量数据', async () => {
      const user = userEvent.setup();
      const startTime = performance.now();

      // Mock大量数据响应
      const largeDataResponse = {
        success: true,
        data: {
          total: 1000,
          valid: 950,
          invalid: 50,
          games: Array.from({ length: 950 }, (_, i) => ({
            id: `game-${i}`,
            name: `Game ${i}`,
            category: 'Action',
            platform: 'PC'
          }))
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => largeDataResponse
      });

      render(<UploadPage />);

      // 模拟大文件上传
      const fileInput = screen.getByLabelText(/选择CSV文件/i);
      const largeCSV = new File(['large csv content'], 'large.csv', {
        type: 'text/csv'
      });

      await user.upload(fileInput, largeCSV);

      const uploadButton = screen.getByRole('button', { name: /上传/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/950.*有效/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 处理1000条记录应该在5秒内完成
      expect(duration).toBeLessThan(5000);
    });
  });
}); 