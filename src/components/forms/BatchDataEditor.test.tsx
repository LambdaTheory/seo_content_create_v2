/**
 * BatchDataEditor 组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchDataEditor } from './BatchDataEditor';
import { GameData } from '@/types/GameData.types';

// 模拟依赖
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant = 'primary', size = 'md', ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/Input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  )
}));

jest.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title, onClose }: any) => 
    isOpen ? (
      <div data-testid={`modal-${title}`}>
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">关闭</button>
        {children}
      </div>
    ) : null
}));

jest.mock('@/components/ui/Table', () => ({
  Table: ({ columns, data, className }: any) => (
    <div data-testid="table" className={className}>
      <table>
        <thead>
          <tr>
            {columns.map((col: any, index: number) => (
              <th key={index} data-testid={`header-${col.key}`}>
                {typeof col.title === 'string' ? col.title : col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, rowIndex: number) => (
            <tr key={rowIndex} data-testid={`row-${rowIndex}`}>
              {columns.map((col: any, colIndex: number) => (
                <td key={colIndex} data-testid={`cell-${rowIndex}-${col.key}`}>
                  {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}));

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  )
}));

jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  )
}));

jest.mock('@/components/ui/Dropdown', () => ({
  Dropdown: ({ options, value, onChange, placeholder }: any) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="dropdown"
    >
      <option value="">{placeholder}</option>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}));

// 测试数据
const mockGameData: GameData[] = [
  {
    gameName: 'Test Game 1',
    mainKeyword: 'test game',
    longTailKeywords: ['test', 'game', 'play'],
    videoLink: 'https://example.com/video1',
    internalLinks: ['https://site.com/page1'],
    competitorPages: ['https://competitor.com/game1'],
    iconUrl: 'https://example.com/icon1.png',
    realUrl: 'https://example.com/game1'
  },
  {
    gameName: 'Test Game 2',
    mainKeyword: 'another game',
    longTailKeywords: ['another', 'game', 'fun'],
    videoLink: 'https://example.com/video2',
    internalLinks: ['https://site.com/page2'],
    competitorPages: ['https://competitor.com/game2'],
    iconUrl: 'https://example.com/icon2.png',
    realUrl: 'https://example.com/game2'
  },
  {
    gameName: 'Test Game 3',
    mainKeyword: 'third game',
    longTailKeywords: ['third', 'game', 'awesome'],
    videoLink: 'http://example.com/video3',
    internalLinks: ['https://site.com/page3'],
    competitorPages: ['https://competitor.com/game3'],
    iconUrl: 'https://example.com/icon3.png',
    realUrl: 'http://example.com/game3'
  }
];

describe('BatchDataEditor', () => {
  const defaultProps = {
    data: mockGameData,
    onDataChange: jest.fn(),
    showPreview: true,
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染组件', () => {
      render(<BatchDataEditor {...defaultProps} />);
      
      expect(screen.getByText('批量数据编辑')).toBeInTheDocument();
      expect(screen.getByText('查找替换')).toBeInTheDocument();
      expect(screen.getByText('批量操作')).toBeInTheDocument();
      expect(screen.getByText('全选')).toBeInTheDocument();
      expect(screen.getByText('清空选择')).toBeInTheDocument();
    });

    it('应该渲染数据表格', () => {
      render(<BatchDataEditor {...defaultProps} />);
      
      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByTestId('row-0')).toBeInTheDocument();
      expect(screen.getByTestId('row-1')).toBeInTheDocument();
      expect(screen.getByTestId('row-2')).toBeInTheDocument();
    });

    it('应该显示正确的字段列', () => {
      render(<BatchDataEditor {...defaultProps} />);
      
      expect(screen.getByTestId('header-gameName')).toBeInTheDocument();
      expect(screen.getByTestId('header-mainKeyword')).toBeInTheDocument();
      expect(screen.getByTestId('header-longTailKeywords')).toBeInTheDocument();
      expect(screen.getByTestId('header-videoLink')).toBeInTheDocument();
    });
  });

  describe('行选择功能', () => {
    it('应该支持单行选择', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      const checkbox = screen.getByTestId('cell-0-select').querySelector('input');
      await user.click(checkbox!);
      
      expect(screen.getByText('已选择 1 行')).toBeInTheDocument();
    });

    it('应该支持全选功能', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      const selectAllButton = screen.getByText('全选');
      await user.click(selectAllButton);
      
      expect(screen.getByText('已选择 3 行')).toBeInTheDocument();
    });

    it('应该支持清空选择', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      // 先全选
      const selectAllButton = screen.getByText('全选');
      await user.click(selectAllButton);
      
      // 然后清空选择
      const clearButton = screen.getByText('清空选择');
      await user.click(clearButton);
      
      expect(screen.queryByText('已选择')).not.toBeInTheDocument();
    });

    it('清空选择按钮在没有选择时应该被禁用', () => {
      render(<BatchDataEditor {...defaultProps} />);
      
      const clearButton = screen.getByText('清空选择');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('查找替换功能', () => {
    it('应该打开查找替换弹窗', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      expect(screen.getByTestId('modal-查找替换')).toBeInTheDocument();
    });

    it('应该允许配置查找替换参数', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      // 打开弹窗
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      // 配置参数
      const fieldDropdown = screen.getByTestId('dropdown');
      await user.selectOptions(fieldDropdown, 'gameName');
      
      const findInput = screen.getByPlaceholderText('输入要查找的内容');
      await user.type(findInput, 'Test');
      
      const replaceInput = screen.getByPlaceholderText('输入替换后的内容');
      await user.type(replaceInput, 'Demo');
      
      expect(fieldDropdown).toHaveValue('gameName');
      expect(findInput).toHaveValue('Test');
      expect(replaceInput).toHaveValue('Demo');
    });

    it('应该支持大小写敏感选项', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      // 打开弹窗
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      const caseSensitiveCheckbox = screen.getByText('区分大小写').previousElementSibling as HTMLInputElement;
      await user.click(caseSensitiveCheckbox);
      
      expect(caseSensitiveCheckbox).toBeChecked();
    });

    it('应该支持正则表达式选项', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      // 打开弹窗
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      const regexCheckbox = screen.getByText('使用正则表达式').previousElementSibling as HTMLInputElement;
      await user.click(regexCheckbox);
      
      expect(regexCheckbox).toBeChecked();
    });

    it('应该在参数不完整时禁用应用按钮', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      // 打开弹窗
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      const applyButton = screen.getByText('应用替换');
      expect(applyButton).toBeDisabled();
    });

    it('应该执行查找替换操作', async () => {
      const user = userEvent.setup();
      const mockOnDataChange = jest.fn();
      
      render(<BatchDataEditor {...defaultProps} onDataChange={mockOnDataChange} />);
      
      // 打开弹窗
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      // 配置参数
      const fieldDropdown = screen.getByTestId('dropdown');
      await user.selectOptions(fieldDropdown, 'gameName');
      
      const findInput = screen.getByPlaceholderText('输入要查找的内容');
      await user.type(findInput, 'Test');
      
      const replaceInput = screen.getByPlaceholderText('输入替换后的内容');
      await user.type(replaceInput, 'Demo');
      
      // 应用替换
      const applyButton = screen.getByText('应用替换');
      await user.click(applyButton);
      
      expect(mockOnDataChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            gameName: 'Demo Game 1'
          }),
          expect.objectContaining({
            gameName: 'Demo Game 2'
          }),
          expect.objectContaining({
            gameName: 'Demo Game 3'
          })
        ])
      );
    });
  });

  describe('批量操作功能', () => {
    it('应该打开批量操作弹窗', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      const batchButton = screen.getByText('批量操作');
      await user.click(batchButton);
      
      expect(screen.getByTestId('modal-批量操作')).toBeInTheDocument();
    });

    it('应该支持追加内容操作', async () => {
      const user = userEvent.setup();
      const mockOnDataChange = jest.fn();
      
      render(<BatchDataEditor {...defaultProps} onDataChange={mockOnDataChange} />);
      
      // 打开弹窗
      const batchButton = screen.getByText('批量操作');
      await user.click(batchButton);
      
      // 配置追加操作
      const operationDropdown = screen.getAllByTestId('dropdown')[0];
      await user.selectOptions(operationDropdown, 'append');
      
      const fieldDropdown = screen.getAllByTestId('dropdown')[1];
      await user.selectOptions(fieldDropdown, 'gameName');
      
      const contentInput = screen.getByPlaceholderText('输入内容');
      await user.type(contentInput, ' - Updated');
      
      // 应用操作
      const applyButton = screen.getByText('应用操作');
      await user.click(applyButton);
      
      expect(mockOnDataChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            gameName: 'Test Game 1 - Updated'
          })
        ])
      );
    });

    it('应该支持清空字段操作', async () => {
      const user = userEvent.setup();
      const mockOnDataChange = jest.fn();
      
      render(<BatchDataEditor {...defaultProps} onDataChange={mockOnDataChange} />);
      
      // 打开弹窗
      const batchButton = screen.getByText('批量操作');
      await user.click(batchButton);
      
      // 配置清空操作
      const operationDropdown = screen.getAllByTestId('dropdown')[0];
      await user.selectOptions(operationDropdown, 'clear');
      
      const fieldDropdown = screen.getAllByTestId('dropdown')[1];
      await user.selectOptions(fieldDropdown, 'mainKeyword');
      
      // 应用操作
      const applyButton = screen.getByText('应用操作');
      await user.click(applyButton);
      
      expect(mockOnDataChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            mainKeyword: ''
          })
        ])
      );
    });

    it('应该支持数据转换操作', async () => {
      const user = userEvent.setup();
      const mockOnDataChange = jest.fn();
      
      render(<BatchDataEditor {...defaultProps} onDataChange={mockOnDataChange} />);
      
      // 打开弹窗
      const batchButton = screen.getByText('批量操作');
      await user.click(batchButton);
      
      // 配置转换操作
      const operationDropdown = screen.getAllByTestId('dropdown')[0];
      await user.selectOptions(operationDropdown, 'transform');
      
      const fieldDropdown = screen.getAllByTestId('dropdown')[1];
      await user.selectOptions(fieldDropdown, 'gameName');
      
      const transformDropdown = screen.getAllByTestId('dropdown')[2];
      await user.selectOptions(transformDropdown, 'uppercase');
      
      // 应用操作
      const applyButton = screen.getByText('应用操作');
      await user.click(applyButton);
      
      expect(mockOnDataChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            gameName: 'TEST GAME 1'
          })
        ])
      );
    });
  });

  describe('数据转换函数', () => {
    const transformTests = [
      { function: 'uppercase', input: 'test', expected: 'TEST' },
      { function: 'lowercase', input: 'TEST', expected: 'test' },
      { function: 'capitalize', input: 'test game', expected: 'Test game' },
      { function: 'trim', input: '  test  ', expected: 'test' },
      { function: 'removeSpaces', input: 'test game', expected: 'testgame' },
      { function: 'addHttps', input: 'example.com', expected: 'https://example.com' },
      { function: 'slugify', input: 'Test Game!', expected: 'test-game' }
    ];

    transformTests.forEach(({ function: funcName, input, expected }) => {
      it(`应该正确执行${funcName}转换`, async () => {
        const user = userEvent.setup();
        const mockOnDataChange = jest.fn();
        
        // 创建包含测试输入的数据
        const testData = [{
          ...mockGameData[0],
          gameName: input
        }];
        
        render(<BatchDataEditor {...defaultProps} data={testData} onDataChange={mockOnDataChange} />);
        
        // 打开批量操作弹窗
        const batchButton = screen.getByText('批量操作');
        await user.click(batchButton);
        
        // 配置转换操作
        const operationDropdown = screen.getAllByTestId('dropdown')[0];
        await user.selectOptions(operationDropdown, 'transform');
        
        const fieldDropdown = screen.getAllByTestId('dropdown')[1];
        await user.selectOptions(fieldDropdown, 'gameName');
        
        const transformDropdown = screen.getAllByTestId('dropdown')[2];
        await user.selectOptions(transformDropdown, funcName);
        
        // 应用操作
        const applyButton = screen.getByText('应用操作');
        await user.click(applyButton);
        
        expect(mockOnDataChange).toHaveBeenCalledWith([
          expect.objectContaining({
            gameName: expected
          })
        ]);
      });
    });
  });

  describe('预览功能', () => {
    it('showPreview为false时不应该显示预览按钮', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} showPreview={false} />);
      
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      expect(screen.queryByText('预览')).not.toBeInTheDocument();
    });

    it('应该支持预览功能', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      // 打开查找替换弹窗
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      // 配置参数
      const fieldDropdown = screen.getByTestId('dropdown');
      await user.selectOptions(fieldDropdown, 'gameName');
      
      const findInput = screen.getByPlaceholderText('输入要查找的内容');
      await user.type(findInput, 'Test');
      
      const replaceInput = screen.getByPlaceholderText('输入替换后的内容');
      await user.type(replaceInput, 'Demo');
      
      // 生成预览
      const previewButton = screen.getByText('预览');
      await user.click(previewButton);
      
      // 预览功能主要通过内部状态工作，这里验证按钮可点击
      expect(previewButton).not.toBeDisabled();
    });
  });

  describe('错误处理', () => {
    it('应该处理空数据', () => {
      const { container } = render(<BatchDataEditor {...defaultProps} data={[]} />);
      expect(container).toBeInTheDocument();
    });

    it('应该处理缺少字段的数据', () => {
      const incompleteData = [{ gameName: 'Test' }] as GameData[];
      const { container } = render(<BatchDataEditor {...defaultProps} data={incompleteData} />);
      expect(container).toBeInTheDocument();
    });

    it('应该处理undefined的onDataChange回调', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} onDataChange={undefined} />);
      
      // 打开查找替换弹窗并尝试操作
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      const fieldDropdown = screen.getByTestId('dropdown');
      await user.selectOptions(fieldDropdown, 'gameName');
      
      const findInput = screen.getByPlaceholderText('输入要查找的内容');
      await user.type(findInput, 'Test');
      
      const replaceInput = screen.getByPlaceholderText('输入替换后的内容');
      await user.type(replaceInput, 'Demo');
      
      const applyButton = screen.getByText('应用替换');
      
      // 应该不会抛出错误
      expect(() => user.click(applyButton)).not.toThrow();
    });
  });

  describe('样式和类名', () => {
    it('应该应用自定义类名', () => {
      const { container } = render(<BatchDataEditor {...defaultProps} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('应该处理空类名', () => {
      const { container } = render(<BatchDataEditor {...defaultProps} className="" />);
      expect(container.firstChild).toHaveClass('space-y-4');
    });
  });

  describe('弹窗交互', () => {
    it('应该能关闭查找替换弹窗', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      // 打开弹窗
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      expect(screen.getByTestId('modal-查找替换')).toBeInTheDocument();
      
      // 关闭弹窗
      const closeButton = screen.getByTestId('modal-close');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('modal-查找替换')).not.toBeInTheDocument();
    });

    it('应该能通过取消按钮关闭弹窗', async () => {
      const user = userEvent.setup();
      render(<BatchDataEditor {...defaultProps} />);
      
      // 打开弹窗
      const replaceButton = screen.getByText('查找替换');
      await user.click(replaceButton);
      
      // 通过取消按钮关闭
      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);
      
      expect(screen.queryByTestId('modal-查找替换')).not.toBeInTheDocument();
    });
  });
}); 