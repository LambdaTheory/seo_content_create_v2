/**
 * DataExporter组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataExporter } from './DataExporter';
import { DataExportService } from '@/services/dataExport';
import { GameData } from '@/types/GameData.types';

// Mock数据导出服务
jest.mock('@/services/dataExport');
const mockDataExportService = DataExportService as jest.Mocked<typeof DataExportService>;

// 模拟数据
const mockData: GameData[] = [
  {
    gameName: 'Test Game 1',
    mainKeyword: 'test game',
    longTailKeywords: 'online test game',
    videoLink: 'https://youtube.com/watch?v=123',
    internalLinks: 'https://example.com/game1',
    competitorPages: 'https://competitor.com/game1',
    iconUrl: 'https://example.com/icon1.jpg',
    realUrl: 'https://game.com/game1'
  }
];

// Mock回调函数
const mockCallbacks = {
  onExportComplete: jest.fn(),
  onExportStart: jest.fn()
};

describe('DataExporter组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认的mock返回值
    mockDataExportService.getDefaultFieldLabels.mockReturnValue({
      gameName: '游戏名称',
      mainKeyword: '主关键词',
      longTailKeywords: '长尾关键词',
      videoLink: '视频链接',
      internalLinks: '内部链接',
      competitorPages: '竞品页面',
      iconUrl: '图标地址',
      realUrl: '游戏地址'
    });

    mockDataExportService.validateConfig.mockReturnValue([]);
    
    mockDataExportService.exportData.mockResolvedValue({
      success: true,
      filename: 'test-export.csv',
      data: 'test,data',
      stats: {
        totalRows: 1,
        exportedRows: 1,
        exportedFields: 8,
        fileSize: 1024
      }
    });

    mockDataExportService.downloadFile.mockImplementation(() => {});
    
    mockDataExportService.formatFileSize.mockImplementation((bytes) => {
      return `${Math.round(bytes / 1024)} KB`;
    });
  });

  it('应该正确渲染导出按钮', () => {
    render(
      <DataExporter
        data={mockData}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('导出数据')).toBeInTheDocument();
  });

  it('应该支持自定义按钮文本', () => {
    render(
      <DataExporter
        data={mockData}
        buttonText="自定义导出"
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('自定义导出')).toBeInTheDocument();
  });

  it('应该在没有数据时禁用按钮', () => {
    render(
      <DataExporter
        data={[]}
        {...mockCallbacks}
      />
    );

    const button = screen.getByText('导出数据');
    expect(button).toBeDisabled();
  });

  it('应该打开导出配置对话框', async () => {
    const user = userEvent.setup();
    render(
      <DataExporter
        data={mockData}
        {...mockCallbacks}
      />
    );

    const button = screen.getByText('导出数据');
    await user.click(button);

    expect(screen.getByText('导出格式')).toBeInTheDocument();
    expect(screen.getByText(/选择字段/)).toBeInTheDocument();
  });

  it('应该执行导出操作', async () => {
    const user = userEvent.setup();
    render(
      <DataExporter
        data={mockData}
        {...mockCallbacks}
      />
    );

    await user.click(screen.getByText('导出数据'));
    
    const exportButton = screen.getByText('开始导出');
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockDataExportService.exportData).toHaveBeenCalled();
      expect(mockCallbacks.onExportStart).toHaveBeenCalled();
    });
  });
}); 