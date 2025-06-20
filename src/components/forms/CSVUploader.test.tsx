import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CSVUploader } from './CSVUploader';

// Mock CSV Service
jest.mock('@/services/csvService', () => ({
  CSVService: jest.fn().mockImplementation(() => ({
    validateFile: jest.fn().mockReturnValue({ valid: true, errors: [] }),
    getFileInfo: jest.fn().mockReturnValue({
      name: 'test.csv',
      size: 1024,
      type: 'text/csv',
      lastModified: Date.now(),
    }),
    parseCSV: jest.fn().mockResolvedValue({
      success: true,
      data: [{ name: 'Test Game', url: 'https://example.com' }],
      headers: ['name', 'url'],
      errors: [],
      warnings: [],
      meta: { delimiter: ',', linebreak: '\n' },
      fileInfo: { name: 'test.csv', size: 1024 }
    }),
  })),
}));

describe('CSVUploader', () => {
  const mockOnUploadSuccess = jest.fn();
  const mockOnUploadError = jest.fn();
  const mockOnProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该渲染上传区域', () => {
    render(<CSVUploader />);
    
    expect(screen.getByText('拖拽CSV文件到此处')).toBeInTheDocument();
    expect(screen.getByText('或点击选择CSV文件')).toBeInTheDocument();
  });

  it('应该显示文件大小限制', () => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    render(<CSVUploader maxSize={maxSize} />);
    
    expect(screen.getByText('支持CSV格式，最大10MB')).toBeInTheDocument();
  });

  it('应该处理文件选择', async () => {
    render(
      <CSVUploader 
        onUploadSuccess={mockOnUploadSuccess}
        onUploadError={mockOnUploadError}
      />
    );

    // 创建模拟文件
    const file = new File(['name,url\nTest Game,https://example.com'], 'test.csv', {
      type: 'text/csv',
    });

    // 获取文件输入元素
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    // 模拟文件选择
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // 等待文件处理完成
    await waitFor(() => {
      expect(mockOnUploadSuccess).toHaveBeenCalled();
    });
  });

  it('应该在禁用状态下不处理文件', () => {
    render(<CSVUploader disabled />);
    
    const uploadArea = screen.getByText('拖拽CSV文件到此处').closest('div');
    expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('应该显示进度指示器', async () => {
    render(
      <CSVUploader 
        onProgress={mockOnProgress}
        autoParser={true}
      />
    );

    const file = new File(['name,url\nTest Game,https://example.com'], 'test.csv', {
      type: 'text/csv',
    });

    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // 应该显示处理状态
    expect(screen.getByText('正在处理文件...')).toBeInTheDocument();
  });

  it('应该处理拖放文件', async () => {
    render(
      <CSVUploader 
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    const file = new File(['name,url\nTest Game,https://example.com'], 'test.csv', {
      type: 'text/csv',
    });

    const uploadArea = screen.getByText('拖拽CSV文件到此处').closest('div');

    // 模拟拖放
    fireEvent.dragOver(uploadArea!, {
      dataTransfer: {
        files: [file],
      },
    });

    fireEvent.drop(uploadArea!, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(mockOnUploadSuccess).toHaveBeenCalled();
    });
  });

  it('应该显示解析结果', async () => {
    render(
      <CSVUploader 
        showPreview={true}
        autoParser={true}
      />
    );

    const file = new File(['name,url\nTest Game,https://example.com'], 'test.csv', {
      type: 'text/csv',
    });

    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('解析结果')).toBeInTheDocument();
    });
  });

  it('应该处理验证错误', async () => {
    // Mock validation failure
    const mockValidateFile = jest.fn().mockReturnValue({
      valid: false,
      errors: ['文件格式不正确'],
    });

    jest.doMock('@/services/csvService', () => ({
      CSVService: jest.fn().mockImplementation(() => ({
        validateFile: mockValidateFile,
      })),
    }));

    render(
      <CSVUploader 
        onUploadError={mockOnUploadError}
      />
    );

    const file = new File(['invalid content'], 'test.txt', {
      type: 'text/plain',
    });

    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalled();
    });
  });

  it('应该支持自定义验证', async () => {
    const mockCustomValidation = jest.fn().mockResolvedValue(false);

    render(
      <CSVUploader 
        onFileValidation={mockCustomValidation}
        onUploadError={mockOnUploadError}
      />
    );

    const file = new File(['name,url\nTest Game,https://example.com'], 'test.csv', {
      type: 'text/csv',
    });

    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockCustomValidation).toHaveBeenCalledWith(file);
      expect(mockOnUploadError).toHaveBeenCalled();
    });
  });
}); 