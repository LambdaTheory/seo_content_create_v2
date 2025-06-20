/**
 * 结构化数据生成器主组件
 * 提供完整的结构化数据生成界面和功能
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  StructuredDataTemplate,
  StructuredDataGenerationRequest,
  StructuredDataResult,
  StructuredDataMode,
  OutputFormat,
  ValidationLevel,
  SeoOptimizationLevel,
} from '@/types/StructuredData.types';
import { SchemaGameType } from '@/services/structuredData/schemaOrgStandards';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Progress } from '@/components/ui/Progress';
import { Alert } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { 
  Settings, 
  Play, 
  Download, 
  Copy, 
  Code, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Zap,
  Database,
  FileText,
} from 'lucide-react';

/**
 * 结构化数据生成器属性
 */
export interface StructuredDataGeneratorProps {
  gameData?: any;
  gameId?: string;
  onGenerated?: (result: StructuredDataResult) => void;
  onError?: (error: Error) => void;
  className?: string;
}

/**
 * 结构化数据生成器组件
 */
export const StructuredDataGenerator: React.FC<StructuredDataGeneratorProps> = ({
  gameData,
  gameId,
  onGenerated,
  onError,
  className = '',
}) => {
  // 状态管理
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<StructuredDataResult | null>(null);
  const [templates, setTemplates] = useState<StructuredDataTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [inputData, setInputData] = useState<string>('');
  const [generationConfig, setGenerationConfig] = useState<StructuredDataGenerationRequest>({
    gameData: null,
    schemaType: SchemaGameType.VideoGame,
    mode: StructuredDataMode.STANDARD,
    outputFormat: OutputFormat.JSON_LD,
    validationLevel: ValidationLevel.STANDARD,
    seoOptimization: SeoOptimizationLevel.BALANCED,
    includeOptional: true,
  });

  // 初始化
  useEffect(() => {
    loadTemplates();
    if (gameData) {
      setInputData(JSON.stringify(gameData, null, 2));
      setGenerationConfig(prev => ({ ...prev, gameData, gameId }));
    }
  }, [gameData, gameId]);

  /**
   * 加载模板列表
   */
  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/structured-data/templates');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data);
        // 设置默认模板
        if (result.data.length > 0) {
          setSelectedTemplate(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  /**
   * 生成结构化数据
   */
  const handleGenerate = useCallback(async () => {
    if (!inputData.trim()) {
      alert('请输入游戏数据');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      // 解析输入数据
      let parsedData;
      try {
        parsedData = JSON.parse(inputData);
      } catch (error) {
        throw new Error('输入数据格式错误，请输入有效的JSON格式');
      }

      // 准备请求数据
      const requestData: StructuredDataGenerationRequest = {
        ...generationConfig,
        gameData: parsedData,
        templateId: selectedTemplate || undefined,
      };

      // 发送生成请求
      const response = await fetch('/api/structured-data/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setResult(result.data);
        onGenerated?.(result.data);
      } else {
        throw new Error(result.error?.message || '生成失败');
      }
    } catch (error) {
      console.error('Generation error:', error);
      const errorObj = error instanceof Error ? error : new Error('未知错误');
      onError?.(errorObj);
      alert(`生成失败: ${errorObj.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [inputData, generationConfig, selectedTemplate, onGenerated, onError]);

  /**
   * 复制结果到剪贴板
   */
  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('已复制到剪贴板');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('复制失败');
    }
  }, []);

  /**
   * 下载结果文件
   */
  const handleDownload = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  /**
   * 更新配置
   */
  const updateConfig = useCallback((updates: Partial<StructuredDataGenerationRequest>) => {
    setGenerationConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和控制区 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">结构化数据生成器</h2>
          <p className="text-gray-600 mt-1">
            将游戏数据转换为符合Schema.org标准的结构化数据
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !inputData.trim()}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              生成中...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              开始生成
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：输入和配置 */}
        <div className="space-y-6">
          {/* 模板选择 */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Database className="h-5 w-5" />
              选择模板
            </h3>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
              placeholder="选择生成模板"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.schemaType})
                </option>
              ))}
            </Select>
            {selectedTemplate && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {templates.find(t => t.id === selectedTemplate)?.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {templates.find(t => t.id === selectedTemplate)?.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* 输入数据 */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              游戏数据输入
            </h3>
            <Textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="请输入游戏数据 (JSON格式)..."
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              支持JSON格式的游戏数据，包括游戏名称、描述、平台、评分等信息
            </p>
          </Card>

          {/* 生成配置 */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              生成配置
            </h3>
            
            <div className="space-y-4">
              {/* Schema类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schema类型
                </label>
                <Select
                  value={generationConfig.schemaType}
                  onValueChange={(value) => updateConfig({ schemaType: value as SchemaGameType })}
                >
                  <option value={SchemaGameType.VideoGame}>VideoGame</option>
                  <option value={SchemaGameType.Game}>Game</option>
                  <option value={SchemaGameType.SoftwareApplication}>SoftwareApplication</option>
                  <option value={SchemaGameType.VideoGameSeries}>VideoGameSeries</option>
                </Select>
              </div>

              {/* 生成模式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  生成模式
                </label>
                <Select
                  value={generationConfig.mode}
                  onValueChange={(value) => updateConfig({ mode: value as StructuredDataMode })}
                >
                  <option value={StructuredDataMode.BASIC}>基础模式</option>
                  <option value={StructuredDataMode.STANDARD}>标准模式</option>
                  <option value={StructuredDataMode.COMPREHENSIVE}>全面模式</option>
                  <option value={StructuredDataMode.CUSTOM}>自定义模式</option>
                </Select>
              </div>

              {/* 输出格式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  输出格式
                </label>
                <Select
                  value={generationConfig.outputFormat}
                  onValueChange={(value) => updateConfig({ outputFormat: value as OutputFormat })}
                >
                  <option value={OutputFormat.JSON_LD}>JSON-LD</option>
                  <option value={OutputFormat.MICRODATA}>Microdata</option>
                  <option value={OutputFormat.RDFA}>RDFa</option>
                  <option value={OutputFormat.ALL}>全部格式</option>
                </Select>
              </div>

              {/* 验证级别 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  验证级别
                </label>
                <Select
                  value={generationConfig.validationLevel}
                  onValueChange={(value) => updateConfig({ validationLevel: value as ValidationLevel })}
                >
                  <option value={ValidationLevel.LOOSE}>宽松验证</option>
                  <option value={ValidationLevel.STANDARD}>标准验证</option>
                  <option value={ValidationLevel.STRICT}>严格验证</option>
                  <option value={ValidationLevel.NONE}>无验证</option>
                </Select>
              </div>

              {/* SEO优化级别 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO优化级别
                </label>
                <Select
                  value={generationConfig.seoOptimization}
                  onValueChange={(value) => updateConfig({ seoOptimization: value as SeoOptimizationLevel })}
                >
                  <option value={SeoOptimizationLevel.CONSERVATIVE}>保守优化</option>
                  <option value={SeoOptimizationLevel.BALANCED}>平衡优化</option>
                  <option value={SeoOptimizationLevel.AGGRESSIVE}>激进优化</option>
                  <option value={SeoOptimizationLevel.NONE}>无优化</option>
                </Select>
              </div>

              {/* 包含可选字段 */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  包含可选字段
                </label>
                <Switch
                  checked={generationConfig.includeOptional}
                  onCheckedChange={(checked) => updateConfig({ includeOptional: checked })}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧：结果和分析 */}
        <div className="space-y-6">
          {/* 生成进度 */}
          {isGenerating && (
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-lg font-semibold">正在生成结构化数据...</span>
              </div>
              <Progress value={66} className="mb-2" />
              <p className="text-sm text-gray-600">解析游戏数据并生成Schema.org格式</p>
            </Card>
          )}

          {/* 生成结果 */}
          {result && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  生成结果
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => result.jsonLd && handleCopy(result.jsonLd)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    复制
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => result.jsonLd && handleDownload(result.jsonLd, 'structured-data.json')}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    下载
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="result" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="result">结果数据</TabsTrigger>
                  <TabsTrigger value="analysis">质量分析</TabsTrigger>
                  <TabsTrigger value="optimization">优化建议</TabsTrigger>
                </TabsList>

                <TabsContent value="result" className="space-y-4">
                  {result.jsonLd && (
                    <div>
                      <h4 className="font-medium mb-2">JSON-LD格式</h4>
                      <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-auto max-h-96 border">
                        {result.jsonLd}
                      </pre>
                    </div>
                  )}
                  
                  {result.microdata && (
                    <div>
                      <h4 className="font-medium mb-2">Microdata格式</h4>
                      <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-auto max-h-96 border">
                        {result.microdata}
                      </pre>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  {/* 验证分数 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{result.validationScore}</div>
                      <div className="text-sm text-blue-800">验证分数</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{result.seoScore}</div>
                      <div className="text-sm text-green-800">SEO分数</div>
                    </div>
                  </div>

                  {/* 错误和警告 */}
                  {result.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <div>
                        <h4 className="font-medium">发现错误</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          {result.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </Alert>
                  )}

                  {result.warnings.length > 0 && (
                    <Alert variant="default">
                      <Info className="h-4 w-4" />
                      <div>
                        <h4 className="font-medium">警告信息</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          {result.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="optimization" className="space-y-4">
                  {result.optimizations.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        优化建议
                      </h4>
                      <ul className="space-y-2">
                        {result.optimizations.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                            <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-yellow-800">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>结构化数据质量很好，无需优化！</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          )}

          {/* 空状态 */}
          {!isGenerating && !result && (
            <Card className="p-8 text-center text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>输入游戏数据并点击"开始生成"按钮</p>
              <p className="text-sm mt-1">将为您生成符合Schema.org标准的结构化数据</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 