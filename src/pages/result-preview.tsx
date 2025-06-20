/**
 * 结果预览页面
 * 集成预览、质量分析和导出功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { ResultPreviewManager } from '@/components/result-preview';
import { PreviewGenerationResult } from '@/types/ResultPreview.types';
import { PageLayout } from '@/components/layout/PageLayout';

/**
 * 结果预览页面组件
 */
const ResultPreviewPage: React.FC = () => {
  // 状态管理
  const [results, setResults] = useState<PreviewGenerationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<PreviewGenerationResult | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载结果数据
   */
  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 从localStorage或API获取结果数据
      const savedResults = localStorage.getItem('generation_results');
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults) as PreviewGenerationResult[];
        setResults(parsedResults);
        
        // 设置默认选中第一个结果
        if (parsedResults.length > 0) {
          setSelectedResult(parsedResults[0]);
        }
      } else {
        // 如果没有保存的结果，设置示例数据
        const exampleResults: PreviewGenerationResult[] = [
          {
            id: 'example-1',
            gameId: 'game-001',
            gameName: '示例游戏',
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: {
              rawContent: '这是一个示例游戏的内容描述，展示了游戏的核心玩法、特色功能和玩家体验。',
              structuredContent: {
                title: '示例游戏',
                description: '一款精彩的示例游戏，提供丰富的游戏体验。',
                features: ['特色功能1', '特色功能2', '特色功能3'],
                requirements: {
                  minimum: '最低系统要求：Windows 10, 4GB RAM',
                  recommended: '推荐配置：Windows 11, 8GB RAM, GTX 1060'
                }
              },
              metadata: {
                wordCount: 150,
                readability: 85,
                seoScore: 90,
                keywordDensity: {
                  '游戏': 0.12,
                  '示例': 0.08,
                  '功能': 0.06
                }
              }
            },
            qualityAnalysis: {
              overallScore: 85,
              scores: {
                readability: 90,
                seoOptimization: 80,
                contentQuality: 85,
                structureScore: 90,
                keywordUsage: 75
              },
              suggestions: [
                '可以增加更多关键词提升SEO效果',
                '建议添加更多具体的游戏特色描述',
                '可以优化段落结构提升可读性'
              ],
              issues: [
                '某些关键词密度偏低'
              ],
              strengths: [
                '内容结构清晰',
                '可读性良好',
                '包含了完整的游戏信息'
              ]
            }
          }
        ];
        
        setResults(exampleResults);
        setSelectedResult(exampleResults[0]);
        
        // 保存示例数据
        localStorage.setItem('generation_results', JSON.stringify(exampleResults));
      }
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('加载结果数据失败: ' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 处理结果选择
   */
  const handleSelectResult = useCallback((result: PreviewGenerationResult) => {
    setSelectedResult(result);
  }, []);

  /**
   * 处理结果更新
   */
  const handleUpdateResult = useCallback((updatedResult: PreviewGenerationResult) => {
    setResults(prevResults => 
      prevResults.map(result => 
        result.id === updatedResult.id ? updatedResult : result
      )
    );
    
    // 如果更新的是当前选中的结果，也要更新选中状态
    if (selectedResult?.id === updatedResult.id) {
      setSelectedResult(updatedResult);
    }
    
    // 保存到localStorage
    const updatedResults = results.map(result => 
      result.id === updatedResult.id ? updatedResult : result
    );
    localStorage.setItem('generation_results', JSON.stringify(updatedResults));
  }, [results, selectedResult]);

  /**
   * 清空所有结果
   */
  const handleClearResults = useCallback(() => {
    if (confirm('确定要清空所有结果吗？此操作不可撤销。')) {
      setResults([]);
      setSelectedResult(undefined);
      localStorage.removeItem('generation_results');
    }
  }, []);

  /**
   * 刷新结果数据
   */
  const handleRefresh = useCallback(() => {
    loadResults();
  }, [loadResults]);

  // 页面加载时获取数据
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return (
    <>
      <Head>
        <title>结果预览 - 游戏内容生成工具</title>
        <meta name="description" content="预览和管理生成的游戏内容，支持导出和质量分析" />
      </Head>

      <PageLayout>
        <div className="h-full flex flex-col">
          {/* 页面头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                结果预览
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                预览生成的内容，进行质量分析并导出结果
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* 操作按钮 */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '加载中...' : '刷新'}
              </button>
              
              <button
                onClick={handleClearResults}
                disabled={results.length === 0}
                className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                清空结果
              </button>
            </div>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                  <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    加载结果数据...
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    请稍候，正在获取生成的内容
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-600 dark:text-red-400 text-5xl mb-4">⚠️</div>
                  <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    加载失败
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {error}
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    重试
                  </button>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 text-5xl mb-4">📄</div>
                  <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    暂无结果数据
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    开始生成内容后，结果将在这里显示
                  </div>
                  <a
                    href="/ai-content-generation"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors inline-block"
                  >
                    开始生成内容
                  </a>
                </div>
              </div>
            ) : (
              <ResultPreviewManager
                results={results}
                selectedResult={selectedResult}
                onSelectResult={handleSelectResult}
                onUpdateResult={handleUpdateResult}
                showQualityAnalysis={true}
                showExportFeatures={true}
                className="h-full"
              />
            )}
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default ResultPreviewPage; 