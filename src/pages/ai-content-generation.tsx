/**
 * AI内容生成页面
 * 展示内容设置UI组件的完整功能
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { 
  WordCountSlider,
  KeywordDensityControl,
  GenerationModeSelector,
  QualityControlSlider,
  WordCountRange,
  KeywordDensitySettings
} from '@/components/settings';
import { 
  QualityParameters,
  GenerationMode
} from '@/types/ContentSettings.types';

export default function AIContentGenerationPage() {
  // 状态管理
  const [wordCount, setWordCount] = useState<WordCountRange>({
    min: 800,
    max: 1200,
    target: 1000
  });

  const [keywordDensity, setKeywordDensity] = useState<KeywordDensitySettings>({
    mainKeyword: { min: 1.5, max: 3.0, target: 2.5 },
    longTailKeywords: { min: 0.3, max: 0.8, target: 0.5 },
    naturalDistribution: true,
    useVariations: true,
    contextualRelevance: true
  });

  const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.STANDARD);

  const [qualityParams, setQualityParams] = useState<QualityParameters>({
    targetAudience: 'gamers',
    readabilityLevel: 'intermediate',
    professionalTone: true,
    creativeFreedom: false,
    emotionalTone: 'friendly',
    languageStyle: 'conversational'
  });

  return (
    <>
      <Head>
        <title>AI内容生成设置 - SEO内容自动生成工具</title>
        <meta name="description" content="配置AI内容生成参数，包括字数控制、关键词密度、生成模式和质量控制" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              AI内容生成设置
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              通过精确配置生成参数，让AI为您的游戏网站创建高质量的SEO优化内容
            </p>
          </div>

          {/* 设置面板 */}
          <div className="space-y-8">
            {/* 字数控制设置 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <WordCountSlider
                label="字数控制设置"
                description="设置生成内容的字数范围和目标值"
                value={wordCount}
                config={{
                  absoluteMin: 100,
                  absoluteMax: 3000,
                  step: 50,
                  showTarget: true,
                  presets: [
                    { label: '简短', value: { min: 300, max: 600, target: 450 } },
                    { label: '中等', value: { min: 800, max: 1200, target: 1000 } },
                    { label: '详细', value: { min: 1500, max: 2500, target: 2000 } }
                  ]
                }}
                onChange={setWordCount}
                showPresets={true}
                showInputs={true}
              />
            </div>

            {/* 关键词密度设置 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <KeywordDensityControl
                label="关键词密度设置"
                description="控制主关键词、长尾关键词的分布密度"
                value={keywordDensity}
                config={{
                  minDensity: 0.1,
                  maxDensity: 8.0,
                  step: 0.1,
                  showPercentage: true,
                  showRecommendations: true,
                  presets: [
                    {
                      label: 'SEO优化',
                      value: { min: 2.0, max: 4.0, target: 3.0 }
                    },
                    {
                      label: '自然分布',
                      value: { min: 1.0, max: 2.5, target: 1.8 }
                    }
                  ]
                }}
                onChange={setKeywordDensity}
                showAdvanced={true}
              />
            </div>

            {/* 生成模式选择 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <GenerationModeSelector
                label="生成模式选择"
                description="选择适合您需求的内容生成策略"
                value={generationMode}
                onChange={setGenerationMode}
                displayMode="cards"
                showDetails={true}
              />
            </div>

            {/* 质量控制参数 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <QualityControlSlider
                label="内容质量控制"
                description="调节内容质量的各项指标参数"
                value={qualityParams}
                onChange={setQualityParams}
                showPresets={true}
                showScore={true}
                layout="vertical"
              />
            </div>

            {/* 操作按钮 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  配置完成后，即可开始生成AI内容
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    重置配置
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                  >
                    开始生成
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 配置预览 */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">当前配置预览</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto">
                {JSON.stringify({
                  wordCount,
                  keywordDensity,
                  generationMode,
                  qualityParams
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 