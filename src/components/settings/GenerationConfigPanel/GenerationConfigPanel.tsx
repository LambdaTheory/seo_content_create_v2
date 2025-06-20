/**
 * 生成配置面板组件
 * 提供完整的内容生成配置界面
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Workflow } from '@/types/Workflow.types';
import { GameData } from '@/types/GameData.types';
import { GenerationFlowConfiguration } from '@/services/contentGenerationOrchestrator';
import { ContentSettings } from '@/types/ContentSettings.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { 
  Settings, 
  Database, 
  Target, 
  ChevronDown, 
  ChevronUp,
  Info,
  CheckCircle,
  AlertTriangle,
  Zap,
  FileText,
  BarChart3
} from 'lucide-react';

export interface GenerationConfigPanelProps {
  /** 可用的工作流列表 */
  workflows: Workflow[];
  /** 当前选中的工作流 */
  selectedWorkflow: Workflow | null;
  /** 游戏数据列表 */
  gameData: GameData[];
  /** 生成配置 */
  config: GenerationFlowConfiguration;
  /** 是否禁用编辑 */
  disabled?: boolean;
  /** 工作流选择回调 */
  onWorkflowSelect: (workflow: Workflow | null) => void;
  /** 配置更新回调 */
  onConfigUpdate: (config: Partial<GenerationFlowConfiguration>) => void;
  /** 高级设置打开回调 */
  onAdvancedSettings: () => void;
  /** 自定义类名 */
  className?: string;
}

interface StructuredDataType {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const GenerationConfigPanel: React.FC<GenerationConfigPanelProps> = ({
  workflows,
  selectedWorkflow,
  gameData,
  config,
  disabled = false,
  onWorkflowSelect,
  onConfigUpdate,
  onAdvancedSettings,
  className
}) => {
  // 状态管理
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showDataDetails, setShowDataDetails] = useState(false);
  const [showStructuredDataHelp, setShowStructuredDataHelp] = useState(false);
  
  // 结构化数据类型配置
  const [structuredDataTypes, setStructuredDataTypes] = useState<StructuredDataType[]>([
    {
      key: 'VideoGame',
      label: '游戏对象',
      description: 'Schema.org VideoGame 格式，包含游戏基本信息、平台、评分等',
      enabled: true
    },
    {
      key: 'VideoObject',
      label: '视频对象', 
      description: 'Schema.org VideoObject 格式，用于游戏预告片、演示视频等',
      enabled: true
    },
    {
      key: 'Review',
      label: '用户评价',
      description: 'Schema.org Review 和 AggregateRating 格式，包含用户评分和评论',
      enabled: false
    },
    {
      key: 'BreadcrumbList',
      label: '面包屑导航',
      description: 'Schema.org BreadcrumbList 格式，提供导航路径信息',
      enabled: false
    },
    {
      key: 'FAQPage',
      label: '常见问题',
      description: 'Schema.org FAQPage 格式，包含游戏相关的常见问题解答',
      enabled: false
    }
  ]);

  // 获取数据统计
  const getDataStats = useCallback(() => {
    const total = gameData.length;
    const validGames = gameData.filter(game => 
      game.gameName && 
      game.mainKeyword && 
      game.realUrl
    ).length;
    const missingData = total - validGames;
    
    return {
      total,
      valid: validGames,
      missing: missingData,
      completeness: total > 0 ? Math.round((validGames / total) * 100) : 0
    };
  }, [gameData]);

  // 获取内容设置摘要
  const getContentSettingsSummary = useCallback(() => {
    if (!selectedWorkflow?.contentSettings) {
      return null;
    }
    
    const settings = selectedWorkflow.contentSettings;
    return {
      wordCount: {
        min: settings.wordCount?.total?.min || 0,
        max: settings.wordCount?.total?.max || 0,
        target: settings.wordCount?.total?.target || 0
      },
      keywordDensity: {
        main: settings.keywordDensity?.mainKeyword?.target || 0,
        longTail: settings.keywordDensity?.longTailKeywords?.target || 0
      },
      mode: settings.generationMode || 'standard',
      quality: {
        readability: settings.qualityParams?.readabilityLevel || 'intermediate',
        professional: settings.qualityParams?.professionalTone || false
      }
    };
  }, [selectedWorkflow]);

  // 处理工作流选择
  const handleWorkflowChange = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId) || null;
    onWorkflowSelect(workflow);
    onConfigUpdate({ workflowId });
  };

  // 处理结构化数据类型切换
  const handleStructuredDataToggle = (typeKey: string) => {
    setStructuredDataTypes(prev => 
      prev.map(type => 
        type.key === typeKey 
          ? { ...type, enabled: !type.enabled }
          : type
      )
    );
  };

  // 处理输出格式变更
  const handleOutputFormatChange = (format: 'json' | 'csv' | 'xlsx') => {
    onConfigUpdate({ outputFormat: format });
  };

  const dataStats = getDataStats();
  const contentSummary = getContentSettingsSummary();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 工作流选择器 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">工作流配置</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择工作流
            </label>
            <select
              value={selectedWorkflow?.id || ''}
              onChange={(e) => handleWorkflowChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            >
              <option value="">请选择工作流</option>
              {workflows.map(workflow => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                  {workflow.isDefault && ' (默认)'}
                </option>
              ))}
            </select>
          </div>
          
          {selectedWorkflow && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <div className="font-medium">{selectedWorkflow.name}</div>
                {selectedWorkflow.description && (
                  <div className="text-blue-600 mt-1">{selectedWorkflow.description}</div>
                )}
                <div className="text-xs text-blue-500 mt-1">
                  创建于: {new Date(selectedWorkflow.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 数据状态显示卡片 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">数据状态</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDataDetails(!showDataDetails)}
            className="flex items-center gap-1"
          >
            {showDataDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            详情
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900">{dataStats.total}</div>
            <div className="text-sm text-gray-600">总游戏数</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-green-700">{dataStats.valid}</div>
            <div className="text-sm text-green-600">有效数据</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${dataStats.completeness}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {dataStats.completeness}%
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-sm">
          {dataStats.completeness >= 90 ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600">数据质量良好</span>
            </>
          ) : dataStats.completeness >= 70 ? (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-600">数据质量一般</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-red-600">需要补充数据</span>
            </>
          )}
        </div>
        
        {showDataDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">已加载工作流:</span>
                <span className="font-medium">{workflows.length} 个</span>
              </div>
              {dataStats.missing > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">缺失数据:</span>
                  <span className="font-medium text-orange-600">{dataStats.missing} 条</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">数据完整度:</span>
                <span className="font-medium">{dataStats.completeness}%</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 内容设置快速预览 */}
      {contentSummary && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">内容设置预览</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {/* 字数设置 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">字数控制</span>
              </div>
              <div className="text-sm text-blue-700">
                范围: {contentSummary.wordCount.min}-{contentSummary.wordCount.max} 字
                {contentSummary.wordCount.target > 0 && (
                  <span className="ml-2">目标: {contentSummary.wordCount.target} 字</span>
                )}
              </div>
            </div>
            
            {/* 关键词密度 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">关键词密度</span>
              </div>
              <div className="text-sm text-green-700">
                主关键词: {contentSummary.keywordDensity.main}%
                <span className="ml-3">长尾关键词: {contentSummary.keywordDensity.longTail}%</span>
              </div>
            </div>
            
            {/* 生成模式 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">生成模式</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={contentSummary.mode === 'strict' ? 'warning' : 
                          contentSummary.mode === 'free' ? 'info' : 'primary'}
                  size="sm"
                >
                  {contentSummary.mode === 'strict' ? '严格模式' :
                   contentSummary.mode === 'free' ? '自由模式' : '标准模式'}
                </Badge>
                <span className="text-sm text-purple-600">
                  {contentSummary.quality.readability === 'advanced' ? '高级' :
                   contentSummary.quality.readability === 'beginner' ? '入门' : '中级'}可读性
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 结构化数据选择组件 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">结构化数据</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStructuredDataHelp(true)}
            className="flex items-center gap-1"
          >
            <Info className="h-4 w-4" />
            帮助
          </Button>
        </div>
        
        <div className="space-y-3">
          {structuredDataTypes.map(type => (
            <label key={type.key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={type.enabled}
                onChange={() => handleStructuredDataToggle(type.key)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={disabled}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{type.label}</span>
                  {type.enabled && (
                    <Badge variant="success" size="sm">已启用</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">{type.description}</div>
              </div>
            </label>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            已选择 {structuredDataTypes.filter(t => t.enabled).length} / {structuredDataTypes.length} 种数据类型
          </div>
        </div>
      </Card>

      {/* 输出格式选择 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">输出格式</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'json', label: 'JSON', description: '标准JSON格式' },
            { key: 'csv', label: 'CSV', description: '表格数据格式' },
            { key: 'xlsx', label: 'Excel', description: 'Excel工作表' }
          ].map(format => (
            <button
              key={format.key}
              onClick={() => handleOutputFormatChange(format.key as 'json' | 'csv' | 'xlsx')}
              disabled={disabled}
              className={`p-3 border rounded-lg text-center transition-colors ${
                config.outputFormat === format.key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{format.label}</div>
              <div className="text-xs text-gray-500 mt-1">{format.description}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* 高级选项折叠面板 */}
      <Card className="p-4">
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="w-full flex items-center justify-between text-left"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">高级选项</h3>
          </div>
          {showAdvancedOptions ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {showAdvancedOptions && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* 质量阈值 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                质量阈值: {config.qualityThreshold}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={config.qualityThreshold}
                onChange={(e) => onConfigUpdate({ qualityThreshold: parseFloat(e.target.value) })}
                className="w-full"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.1 (宽松)</span>
                <span>1.0 (严格)</span>
              </div>
            </div>
            
            {/* 并发控制 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大并发游戏数: {config.concurrency.maxConcurrentGames}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={config.concurrency.maxConcurrentGames}
                onChange={(e) => onConfigUpdate({
                  concurrency: {
                    ...config.concurrency,
                    maxConcurrentGames: parseInt(e.target.value)
                  }
                })}
                className="w-full"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 (慢速)</span>
                <span>10 (快速)</span>
              </div>
            </div>
            
            {/* 重试次数 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大重试次数
              </label>
              <select
                value={config.maxRetries}
                onChange={(e) => onConfigUpdate({ maxRetries: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                disabled={disabled}
              >
                <option value={1}>1 次</option>
                <option value={3}>3 次</option>
                <option value={5}>5 次</option>
                <option value={10}>10 次</option>
              </select>
            </div>
            
            {/* 自动恢复 */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.recovery.enableAutoRecovery}
                  onChange={(e) => onConfigUpdate({
                    recovery: {
                      ...config.recovery,
                      enableAutoRecovery: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 text-blue-600"
                  disabled={disabled}
                />
                <span className="text-sm text-gray-700">启用自动恢复</span>
              </label>
              <div className="text-xs text-gray-500 mt-1 ml-6">
                流程中断时自动尝试恢复
              </div>
            </div>
            
            {/* 高级设置按钮 */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={onAdvancedSettings}
                disabled={disabled}
                className="w-full flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                更多高级设置
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 结构化数据帮助模态框 */}
      <Modal
        isOpen={showStructuredDataHelp}
        onClose={() => setShowStructuredDataHelp(false)}
        title="结构化数据说明"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            结构化数据是一种标准化的数据格式，帮助搜索引擎更好地理解和索引您的内容，提升SEO效果。
          </div>
          
          <div className="space-y-3">
            {structuredDataTypes.map(type => (
              <div key={type.key} className="border border-gray-200 rounded-lg p-3">
                <div className="font-medium text-gray-900 mb-1">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
                <div className="mt-2">
                  <Badge variant="info" size="sm">Schema.org 标准</Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <strong>建议:</strong> 游戏对象和视频对象是必选项，其他类型可根据需要选择。
              启用的类型越多，SEO效果越好，但生成时间也会相应增加。
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowStructuredDataHelp(false)}>
              我知道了
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 