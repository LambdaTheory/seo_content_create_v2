import React, { useState, useCallback, useMemo } from 'react';
import { 
  PreviewGenerationResult, 
  PreviewConfig, 
  SearchResult, 
  FoldingState,
  SearchMatch
} from '@/types/ResultPreview.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './ResultPreview.module.css';

interface ResultPreviewProps {
  result: PreviewGenerationResult;
  config?: Partial<PreviewConfig>;
  onEdit?: (resultId: string, newContent: any) => void;
  onExport?: (resultId: string) => void;
  className?: string;
}

const DEFAULT_CONFIG: PreviewConfig = {
  showLineNumbers: true,
  enableSyntaxHighlight: true,
  enableCodeFolding: true,
  enableSearch: true,
  indentSize: 2,
  tabSize: 2,
  wrapLines: false,
  theme: 'light',
  searchConfig: {
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    highlightMatches: true
  }
};

export const ResultPreview: React.FC<ResultPreviewProps> = ({
  result,
  config: userConfig,
  onEdit,
  onExport,
  className
}) => {
  const [config, setConfig] = useState<PreviewConfig>({
    ...DEFAULT_CONFIG,
    ...userConfig
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [foldingState, setFoldingState] = useState<FoldingState>({
    foldedRanges: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // 格式化JSON内容
  const formattedContent = useMemo(() => {
    try {
      const content = result.content.rawContent;
      return JSON.stringify(content, null, config.indentSize);
    } catch (error) {
      console.error('Failed to format content:', error);
      return 'Invalid JSON content';
    }
  }, [result.content.rawContent, config.indentSize]);

  // 将内容分行处理
  const lines = useMemo(() => {
    return formattedContent.split('\n');
  }, [formattedContent]);

  // 搜索功能
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResult(null);
      return;
    }

    const matches: SearchMatch[] = [];
    const flags = config.searchConfig.caseSensitive ? 'g' : 'gi';
    
    let searchRegex: RegExp;
    try {
      if (config.searchConfig.useRegex) {
        searchRegex = new RegExp(query, flags);
      } else {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = config.searchConfig.wholeWord 
          ? `\\b${escapedQuery}\\b` 
          : escapedQuery;
        searchRegex = new RegExp(pattern, flags);
      }
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      return;
    }

    lines.forEach((line, lineIndex) => {
      let match: RegExpExecArray | null;
      searchRegex.lastIndex = 0; // Reset regex state
      
      while ((match = searchRegex.exec(line)) !== null) {
        matches.push({
          line: lineIndex + 1,
          column: match.index + 1,
          length: match[0].length,
          text: match[0],
          context: line
        });
        
        // Prevent infinite loop for zero-length matches
        if (match.index === searchRegex.lastIndex) {
          searchRegex.lastIndex++;
        }
      }
    });

    setSearchResult({
      query,
      matches,
      totalMatches: matches.length,
      currentMatchIndex: 0
    });
  }, [lines, config.searchConfig]);

  // 处理搜索输入
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    performSearch(value);
  }, [performSearch]);

  // 语法高亮处理
  const highlightSyntax = useCallback((line: string, lineNumber: number) => {
    if (!config.enableSyntaxHighlight) {
      return line;
    }

    // 简单的JSON语法高亮
    let highlightedLine = line
      // 字符串高亮
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="json-string">"$1"</span>')
      // 数字高亮
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      // 布尔值高亮
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      // null高亮
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
      // 括号高亮
      .replace(/([{}[\]])/g, '<span class="json-bracket">$1</span>');

    // 搜索结果高亮
    if (searchResult && config.searchConfig.highlightMatches) {
      const lineMatches = searchResult.matches.filter((match: SearchMatch) => match.line === lineNumber);
      lineMatches.forEach((match: SearchMatch) => {
        const beforeHighlight = highlightedLine.substring(0, match.column - 1);
        const highlighted = `<span class="search-highlight">${match.text}</span>`;
        const afterHighlight = highlightedLine.substring(match.column - 1 + match.length);
        highlightedLine = beforeHighlight + highlighted + afterHighlight;
      });
    }

    return highlightedLine;
  }, [config.enableSyntaxHighlight, searchResult, config.searchConfig.highlightMatches]);

  // 折叠功能
  const toggleFold = useCallback((startLine: number, endLine: number) => {
    setFoldingState((prev: FoldingState) => {
      const existingRange = prev.foldedRanges.find(
        (range) => range.startLine === startLine && range.endLine === endLine
      );

      if (existingRange) {
        // 切换现有范围的折叠状态
        return {
          ...prev,
          foldedRanges: prev.foldedRanges.map((range) =>
            range.startLine === startLine && range.endLine === endLine
              ? { ...range, collapsed: !range.collapsed }
              : range
          )
        };
      } else {
        // 添加新的折叠范围
        return {
          ...prev,
          foldedRanges: [
            ...prev.foldedRanges,
            { startLine, endLine, collapsed: true }
          ]
        };
      }
    });
  }, []);

  // 检查行是否被折叠
  const isLineFolded = useCallback((lineNumber: number) => {
    return foldingState.foldedRanges.some(
      range => range.collapsed && lineNumber > range.startLine && lineNumber <= range.endLine
    );
  }, [foldingState.foldedRanges]);

  // 获取折叠按钮
  const getFoldButton = useCallback((line: string, lineNumber: number) => {
    if (!config.enableCodeFolding) return null;

    const trimmedLine = line.trim();
    
    // 检测可折叠的JSON结构
    if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[')) {
      // 查找对应的结束行
      let depth = 0;
      let endLine = lineNumber;
      
      for (let i = lineNumber - 1; i < lines.length; i++) {
        const currentLine = lines[i];
        const openBrackets = (currentLine.match(/[{[]/g) || []).length;
        const closeBrackets = (currentLine.match(/[}\]]/g) || []).length;
        depth += openBrackets - closeBrackets;
        
        if (depth === 0 && i > lineNumber - 1) {
          endLine = i + 1;
          break;
        }
      }

      if (endLine > lineNumber) {
        const range = foldingState.foldedRanges.find(
          r => r.startLine === lineNumber && r.endLine === endLine
        );
        const isCollapsed = range?.collapsed || false;

        return (
          <button
            className={styles.foldButton}
            onClick={() => toggleFold(lineNumber, endLine)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        );
      }
    }

    return null;
  }, [config.enableCodeFolding, lines, foldingState.foldedRanges, toggleFold]);

  // 编辑功能
  const handleStartEdit = useCallback(() => {
    setEditContent(formattedContent);
    setIsEditing(true);
  }, [formattedContent]);

  const handleSaveEdit = useCallback(() => {
    try {
      const parsedContent = JSON.parse(editContent);
      onEdit?.(result.id, parsedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Invalid JSON content:', error);
      // 这里可以显示错误提示
    }
  }, [editContent, onEdit, result.id]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent('');
  }, []);

  // 导航到搜索结果
  const navigateToMatch = useCallback((direction: 'next' | 'prev') => {
    if (!searchResult || searchResult.matches.length === 0) return;

    setSearchResult((prev: SearchResult | null) => {
      if (!prev) return null;

      let newIndex = prev.currentMatchIndex;
      if (direction === 'next') {
        newIndex = (prev.currentMatchIndex + 1) % prev.matches.length;
      } else {
        newIndex = prev.currentMatchIndex === 0 
          ? prev.matches.length - 1 
          : prev.currentMatchIndex - 1;
      }

      return {
        ...prev,
        currentMatchIndex: newIndex
      };
    });
  }, [searchResult]);

  // 复制内容
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formattedContent);
      // 这里可以显示复制成功提示
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  }, [formattedContent]);

  return (
    <div className={`${styles.resultPreview} ${className || ''}`}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        {/* 搜索功能 */}
        {config.enableSearch && (
          <div className={styles.searchControls}>
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search in content..."
              className={styles.searchInput}
            />
            {searchResult && (
              <div className={styles.searchResults}>
                <span className={styles.matchCount}>
                  {searchResult.totalMatches > 0 
                    ? `${searchResult.currentMatchIndex + 1} of ${searchResult.totalMatches}`
                    : 'No matches'
                  }
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToMatch('prev')}
                  disabled={!searchResult.matches.length}
                >
                  ▲
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToMatch('next')}
                  disabled={!searchResult.matches.length}
                >
                  ▼
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            📋 Copy
          </Button>
          
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={isEditing ? handleSaveEdit : handleStartEdit}
              title={isEditing ? 'Save changes' : 'Edit content'}
            >
              {isEditing ? '💾 Save' : '✏️ Edit'}
            </Button>
          )}
          
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              title="Cancel editing"
            >
              ❌ Cancel
            </Button>
          )}
          
          {onExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExport(result.id)}
              title="Export result"
            >
              📥 Export
            </Button>
          )}
        </div>
      </div>

      {/* 内容显示区域 */}
      <div className={styles.contentArea}>
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className={styles.editTextarea}
            spellCheck={false}
          />
        ) : (
          <div className={styles.codeDisplay}>
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              
              // 检查是否被折叠
              if (isLineFolded(lineNumber)) {
                return null;
              }

              const foldButton = getFoldButton(line, lineNumber);
              const highlightedLine = highlightSyntax(line, lineNumber);

              return (
                <div key={lineNumber} className={styles.codeLine}>
                  {config.showLineNumbers && (
                    <span className={styles.lineNumber}>{lineNumber}</span>
                  )}
                  
                  {foldButton && (
                    <span className={styles.foldButtonContainer}>
                      {foldButton}
                    </span>
                  )}
                  
                  <span
                    className={styles.lineContent}
                    dangerouslySetInnerHTML={{ __html: highlightedLine }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className={styles.statusBar}>
        <span className={styles.info}>
          Lines: {lines.length} | 
          Characters: {formattedContent.length} |
          Status: {result.status}
        </span>
        
        {result.metadata.generationTime && (
          <span className={styles.timing}>
            Generated in {result.metadata.generationTime}ms
          </span>
        )}
      </div>
    </div>
  );
};

export default ResultPreview; 