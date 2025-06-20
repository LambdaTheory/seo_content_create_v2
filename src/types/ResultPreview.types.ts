/**
 * 结果预览相关类型定义
 */

// 预览配置
export interface PreviewConfig {
  // 显示选项
  showLineNumbers: boolean;
  enableSyntaxHighlight: boolean;
  enableCodeFolding: boolean;
  enableSearch: boolean;
  
  // 格式选项
  indentSize: number;
  tabSize: number;
  wrapLines: boolean;
  
  // 主题选项
  theme: 'light' | 'dark' | 'auto';
  
  // 搜索配置
  searchConfig: SearchConfig;
}

// 搜索配置
export interface SearchConfig {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  highlightMatches: boolean;
}

// 搜索结果
export interface SearchResult {
  query: string;
  matches: SearchMatch[];
  totalMatches: number;
  currentMatchIndex: number;
}

// 搜索匹配项
export interface SearchMatch {
  line: number;
  column: number;
  length: number;
  text: string;
  context: string;
}

// 折叠状态
export interface FoldingState {
  foldedRanges: Array<{
    startLine: number;
    endLine: number;
    collapsed: boolean;
  }>;
}

// 编辑操作
export interface EditOperation {
  type: 'insert' | 'delete' | 'replace';
  position: {
    line: number;
    column: number;
  };
  length?: number;
  content?: string;
  timestamp: string;
}

// 编辑历史
export interface EditHistory {
  operations: EditOperation[];
  currentIndex: number;
  maxHistorySize: number;
}

// 内容质量分析
export interface ContentQualityAnalysis {
  // 总体评分
  overallScore: number;
  
  // 字数统计
  wordCount: {
    total: number;
    chinese: number;
    english: number;
    target: {
      min: number;
      max: number;
    };
    isWithinRange: boolean;
  };
  
  // 关键词密度
  keywordDensity: {
    primary: {
      keyword: string;
      density: number;
      target: number;
      isOptimal: boolean;
    };
    secondary: Array<{
      keyword: string;
      density: number;
      target: number;
      isOptimal: boolean;
    }>;
  };
  
  // 内容结构分析
  structure: {
    hasTitle: boolean;
    hasDescription: boolean;
    hasFeatures: boolean;
    hasSystemRequirements: boolean;
    completeness: number;
  };
  
  // SEO评分
  seoScore: {
    title: number;
    description: number;
    keywords: number;
    structure: number;
    overall: number;
  };
  
  // 可读性评分
  readability: {
    sentenceLength: number;
    paragraphLength: number;
    complexWords: number;
    score: number;
  };
}

// 扩展的生成结果接口（专为预览组件使用）
export interface PreviewGenerationResult {
  id: string;
  workflowId: string;
  taskId: string;
  gameId: string;
  gameName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  content: {
    rawContent: Record<string, any>;
    formattedContent: string;
    structuredData?: Record<string, any>;
  };
  metadata: {
    generationMode: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    generationTime: number;
    apiCalls: number;
    retryCount: number;
    errors?: Array<{
      code: string;
      message: string;
      stage?: string;
      details?: Record<string, any>;
    }>;
    warnings?: Array<{
      code: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
      suggestions?: string[];
    }>;
  };
  qualityAnalysis?: ContentQualityAnalysis;
  createdAt: string;
  updatedAt: string;
} 