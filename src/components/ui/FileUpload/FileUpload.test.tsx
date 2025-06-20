import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload, DragDropArea, FileList, FilePreview, useFileUpload } from './FileUpload';
import { FileItem } from './FileUpload.types';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Helper function to create mock files
const createMockFile = (name: string, size: number, type: string = 'text/plain'): File => {
  const file = new File(['content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUpload Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFileUpload Hook', () => {
    const TestComponent: React.FC<{ hookProps?: any }> = ({ hookProps = {} }) => {
      const fileUpload = useFileUpload(hookProps);
      
      return (
        <div>
          <div data-testid="files-count">{fileUpload.files.length}</div>
          <div data-testid="drag-active">{fileUpload.isDragActive.toString()}</div>
          <div data-testid="drag-over">{fileUpload.isDragOver.toString()}</div>
          <button 
            onClick={() => fileUpload.addFiles([createMockFile('test.txt', 1000)])}
            data-testid="add-file"
          >
            Add File
          </button>
          <button 
            onClick={() => fileUpload.removeFile(0)}
            data-testid="remove-file"
          >
            Remove File
          </button>
          <button 
            onClick={() => fileUpload.clearFiles()}
            data-testid="clear-files"
          >
            Clear Files
          </button>
        </div>
      );
    };

    it('should initialize with empty state', () => {
      render(<TestComponent />);
      
      expect(screen.getByTestId('files-count')).toHaveTextContent('0');
      expect(screen.getByTestId('drag-active')).toHaveTextContent('false');
      expect(screen.getByTestId('drag-over')).toHaveTextContent('false');
    });

    it('should add files correctly', async () => {
      render(<TestComponent />);
      
      fireEvent.click(screen.getByTestId('add-file'));
      
      await waitFor(() => {
        expect(screen.getByTestId('files-count')).toHaveTextContent('1');
      });
    });

    it('should remove files correctly', async () => {
      render(<TestComponent />);
      
      // Add file first
      fireEvent.click(screen.getByTestId('add-file'));
      await waitFor(() => {
        expect(screen.getByTestId('files-count')).toHaveTextContent('1');
      });

      // Remove file
      fireEvent.click(screen.getByTestId('remove-file'));
      await waitFor(() => {
        expect(screen.getByTestId('files-count')).toHaveTextContent('0');
      });
    });

    it('should clear all files', async () => {
      render(<TestComponent />);
      
      // Add file first
      fireEvent.click(screen.getByTestId('add-file'));
      await waitFor(() => {
        expect(screen.getByTestId('files-count')).toHaveTextContent('1');
      });

      // Clear files
      fireEvent.click(screen.getByTestId('clear-files'));
      await waitFor(() => {
        expect(screen.getByTestId('files-count')).toHaveTextContent('0');
      });
    });

    it('should respect maxFiles limit', async () => {
      render(<TestComponent hookProps={{ maxFiles: 1 }} />);
      
      // Try to add multiple files
      fireEvent.click(screen.getByTestId('add-file'));
      fireEvent.click(screen.getByTestId('add-file'));
      
      await waitFor(() => {
        expect(screen.getByTestId('files-count')).toHaveTextContent('1');
      });
    });

    it('should validate file size', () => {
      const onUpload = jest.fn();
      const TestWithValidation: React.FC = () => {
        const fileUpload = useFileUpload({ maxSize: 500, onUpload });
        
        return (
          <div>
            <div data-testid="files-count">{fileUpload.files.length}</div>
            <button 
              onClick={() => fileUpload.addFiles([createMockFile('large.txt', 1000)])}
              data-testid="add-large-file"
            >
              Add Large File
            </button>
          </div>
        );
      };

      render(<TestWithValidation />);
      
      fireEvent.click(screen.getByTestId('add-large-file'));
      
      // Should not add the file due to size limit
      expect(screen.getByTestId('files-count')).toHaveTextContent('0');
      expect(onUpload).not.toHaveBeenCalled();
    });
  });

  describe('DragDropArea Component', () => {
    const defaultProps = {
      isDragActive: false,
      isDragOver: false,
      onClick: jest.fn(),
      onDragEnter: jest.fn(),
      onDragLeave: jest.fn(),
      onDragOver: jest.fn(),
      onDrop: jest.fn()
    };

    it('should render with default text', () => {
      render(<DragDropArea {...defaultProps} />);
      
      expect(screen.getByText('拖拽文件到此处')).toBeInTheDocument();
      expect(screen.getByText('或点击选择文件')).toBeInTheDocument();
      expect(screen.getByText('支持单个或批量上传')).toBeInTheDocument();
    });

    it('should render with custom text', () => {
      render(
        <DragDropArea 
          {...defaultProps}
          dragText="自定义拖拽文本"
          clickText="自定义点击文本"
          hintText="自定义提示文本"
        />
      );
      
      expect(screen.getByText('自定义拖拽文本')).toBeInTheDocument();
      expect(screen.getByText('自定义点击文本')).toBeInTheDocument();
      expect(screen.getByText('自定义提示文本')).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      
      render(<DragDropArea {...defaultProps} onClick={onClick} />);
      
      await user.click(screen.getByText('拖拽文件到此处').closest('div')!);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle drag events', () => {
      const onDragEnter = jest.fn();
      const onDragLeave = jest.fn();
      const onDragOver = jest.fn();
      const onDrop = jest.fn();
      
      render(
        <DragDropArea 
          {...defaultProps}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />
      );
      
      const dragArea = screen.getByText('拖拽文件到此处').closest('div')!;
      
      fireEvent.dragEnter(dragArea);
      expect(onDragEnter).toHaveBeenCalledTimes(1);
      
      fireEvent.dragLeave(dragArea);
      expect(onDragLeave).toHaveBeenCalledTimes(1);
      
      fireEvent.dragOver(dragArea);
      expect(onDragOver).toHaveBeenCalledTimes(1);
      
      fireEvent.drop(dragArea);
      expect(onDrop).toHaveBeenCalledTimes(1);
    });

    it('should show active states', () => {
      const { rerender } = render(<DragDropArea {...defaultProps} />);
      
      // Test drag active state
      rerender(<DragDropArea {...defaultProps} isDragActive={true} />);
      expect(screen.getByText('拖拽文件到此处').closest('div')).toHaveClass('border-primary-300');
      
      // Test drag over state
      rerender(<DragDropArea {...defaultProps} isDragOver={true} />);
      expect(screen.getByText('拖拽文件到此处').closest('div')).toHaveClass('border-primary-400');
    });

    it('should be disabled', () => {
      const onClick = jest.fn();
      
      render(<DragDropArea {...defaultProps} disabled={true} onClick={onClick} />);
      
      const dragArea = screen.getByText('拖拽文件到此处').closest('div')!;
      
      expect(dragArea).toHaveClass('cursor-not-allowed');
      
      fireEvent.click(dragArea);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should render custom children', () => {
      render(
        <DragDropArea {...defaultProps}>
          <div>Custom content</div>
        </DragDropArea>
      );
      
      expect(screen.getByText('Custom content')).toBeInTheDocument();
      expect(screen.queryByText('拖拽文件到此处')).not.toBeInTheDocument();
    });
  });

  describe('FilePreview Component', () => {
    const mockFileItem: FileItem = {
      file: createMockFile('test.txt', 1000),
      id: 'test-id',
      status: 'pending',
      progress: 0
    };

    const defaultProps = {
      file: mockFileItem,
      index: 0,
      onRemove: jest.fn(),
      onPreview: jest.fn(),
      onRetry: jest.fn()
    };

    it('should render file information', () => {
      render(<FilePreview {...defaultProps} />);
      
      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(screen.getByText('1000 Bytes')).toBeInTheDocument();
    });

    it('should format file size correctly', () => {
      const largeFile: FileItem = {
        ...mockFileItem,
        file: createMockFile('large.txt', 1024 * 1024 * 2.5) // 2.5MB
      };
      
      render(<FilePreview {...defaultProps} file={largeFile} />);
      
      expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    });

    it('should show upload progress', () => {
      const uploadingFile: FileItem = {
        ...mockFileItem,
        status: 'uploading',
        progress: 50
      };
      
      render(<FilePreview {...defaultProps} file={uploadingFile} />);
      
      expect(screen.getByText('上传中...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      
      const progressBar = document.querySelector('.bg-blue-500');
      expect(progressBar).toHaveStyle('width: 50%');
    });

    it('should show success status', () => {
      const successFile: FileItem = {
        ...mockFileItem,
        status: 'success',
        progress: 100
      };
      
      render(<FilePreview {...defaultProps} file={successFile} />);
      
      expect(screen.getByText('上传成功')).toBeInTheDocument();
    });

    it('should show error status with retry button', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();
      const errorFile: FileItem = {
        ...mockFileItem,
        status: 'error',
        error: '上传失败'
      };
      
      render(<FilePreview {...defaultProps} file={errorFile} onRetry={onRetry} />);
      
      expect(screen.getByText('上传失败')).toBeInTheDocument();
      
      const retryButton = screen.getByText('重试上传');
      expect(retryButton).toBeInTheDocument();
      
      await user.click(retryButton);
      expect(onRetry).toHaveBeenCalledWith(mockFileItem.file, 0);
    });

    it('should handle remove button click', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      
      render(<FilePreview {...defaultProps} onRemove={onRemove} />);
      
      const removeButton = screen.getByRole('button');
      await user.click(removeButton);
      
      expect(onRemove).toHaveBeenCalledWith(mockFileItem.file, 0);
    });

    it('should show image preview', () => {
      const imageFile: FileItem = {
        ...mockFileItem,
        file: createMockFile('image.jpg', 1000, 'image/jpeg'),
        preview: 'mocked-url'
      };
      
      render(<FilePreview {...defaultProps} file={imageFile} />);
      
      const image = screen.getByRole('img', { name: 'image.jpg' });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'mocked-url');
    });

    it('should handle preview click', async () => {
      const user = userEvent.setup();
      const onPreview = jest.fn();
      const imageFile: FileItem = {
        ...mockFileItem,
        file: createMockFile('image.jpg', 1000, 'image/jpeg'),
        preview: 'mocked-url'
      };
      
      render(<FilePreview {...defaultProps} file={imageFile} onPreview={onPreview} />);
      
      const image = screen.getByRole('img', { name: 'image.jpg' });
      await user.click(image);
      
      expect(onPreview).toHaveBeenCalledWith(imageFile.file, 0);
    });
  });

  describe('FileList Component', () => {
    const mockFiles: FileItem[] = [
      {
        file: createMockFile('file1.txt', 1000),
        id: 'id1',
        status: 'pending',
        progress: 0
      },
      {
        file: createMockFile('file2.txt', 2000),
        id: 'id2',
        status: 'success',
        progress: 100
      }
    ];

    const defaultProps = {
      files: mockFiles,
      onRemove: jest.fn(),
      onPreview: jest.fn(),
      onRetry: jest.fn()
    };

    it('should render file list', () => {
      render(<FileList {...defaultProps} />);
      
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
    });

    it('should render nothing when no files', () => {
      const { container } = render(<FileList {...defaultProps} files={[]} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should pass props to FilePreview components', () => {
      const onRemove = jest.fn();
      
      render(<FileList {...defaultProps} onRemove={onRemove} />);
      
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
    });
  });

  describe('FileUpload Component', () => {
    const defaultProps = {
      onUpload: jest.fn(),
      onRemove: jest.fn(),
      onPreview: jest.fn()
    };

    it('should render drag drop area', () => {
      render(<FileUpload {...defaultProps} />);
      
      expect(screen.getByText('拖拽文件到此处')).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(
        <FileUpload 
          {...defaultProps}
          dragText="自定义拖拽文本"
          accept=".txt"
          multiple={true}
          maxSize={1000}
        />
      );
      
      expect(screen.getByText('自定义拖拽文本')).toBeInTheDocument();
    });

    it('should render custom drag area', () => {
      const renderDragArea = () => <div>Custom Drag Area</div>;
      
      render(<FileUpload {...defaultProps} renderDragArea={renderDragArea} />);
      
      expect(screen.getByText('Custom Drag Area')).toBeInTheDocument();
      expect(screen.queryByText('拖拽文件到此处')).not.toBeInTheDocument();
    });

    it('should render custom file list', () => {
      const renderFileList = () => <div>Custom File List</div>;
      
      render(<FileUpload {...defaultProps} renderFileList={renderFileList} />);
      
      expect(screen.getByText('Custom File List')).toBeInTheDocument();
    });

    it('should be disabled', () => {
      render(<FileUpload {...defaultProps} disabled={true} />);
      
      const dragArea = screen.getByText('拖拽文件到此处').closest('div')!;
      expect(dragArea).toHaveClass('cursor-not-allowed');
    });

    it('should handle file input change', () => {
      const onUpload = jest.fn();
      
      render(<FileUpload {...defaultProps} onUpload={onUpload} />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      
      const file = createMockFile('test.txt', 1000);
      const files = [file];
      
      Object.defineProperty(fileInput, 'files', {
        value: files,
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      expect(onUpload).toHaveBeenCalledWith([file]);
    });

    it('should apply custom class names', () => {
      const { container } = render(
        <FileUpload 
          {...defaultProps}
          className="custom-upload"
          dragAreaClassName="custom-drag"
          fileListClassName="custom-list"
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-upload');
    });
  });
}); 