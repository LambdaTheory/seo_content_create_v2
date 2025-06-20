/**
 * 内容生成主界面
 * 实现三栏布局设计：配置区-进度区-预览区
 * 支持响应式适配、界面状态管理、快捷操作工具栏
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ContentGenerationOrchestrator,
  GenerationFlowConfiguration,
  FlowExecutionStatus
} from '@/services/contentGenerationOrchestrator';
import { GameDataStorageService } from '@/services/gameDataStorage';
import { workflowStorage } from '@/services/workflowStorage';
import { Workflow } from '@/types/Workflow.types';
import { GameData } from '@/types/GameData.types';
import { ContentSettings } from '@/types/ContentSettings.types';
import { 
  ContentSettingsForm,
  WordCountSlider,
  KeywordDensityControl,
  GenerationModeSelector,
  QualityControlSlider
} from '@/components/settings';
import { 
  ResultPreview,
  QualityAnalysis,
  ResultsList
} from '@/components/result-preview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Download, 
  RefreshCw as Refresh,
  Monitor,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Zap,
  Database,
  Target
} from 'lucide-react';

// 界面状态枚举
enum UIState {
  IDLE = 'idle',
  CONFIGURING = 'configuring',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error',
  PAUSED = 'paused'
}

// 布局模式枚举
enum LayoutMode {
  THREE_COLUMN = 'three-column',
  TWO_COLUMN = 'two-column',
  MOBILE_TABS = 'mobile-tabs'
}

// 移动端Tab枚举
enum MobileTab {
  CONFIG = 'config',
  PROGRESS = 'progress',
  PREVIEW = 'preview'
}

// 主界面组件
export default function GeneratePage() {
  // Toast hook
  const toast = useToast();
  
  // 状态管理
  const [uiState, setUIState] = useState<UIState>(UIState.IDLE);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(LayoutMode.THREE_COLUMN);
  const [mobileTab, setMobileTab] = useState<MobileTab>(MobileTab.CONFIG);
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  
  // 数据状态
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [gameData, setGameData] = useState<GameData[]>([]);
  const [flowStatus, setFlowStatus] = useState<FlowExecutionStatus | null>(null);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [generationResults, setGenerationResults] = useState<any[]>([]);
  
  // 配置状态
  const [generationConfig, setGenerationConfig] = useState<GenerationFlowConfiguration>({
    workflowId: '',
    gameDataIds: [],
    enableStructuredData: true,
    outputFormat: 'json',
    qualityThreshold: 0.8,
    maxRetries: 3,
    concurrency: {
      maxConcurrentGames: 3,
      maxConcurrentStages: 2
    },
    timeout: {
      perGame: 300000, // 5分钟
      total: 1800000   // 30分钟
    },
    recovery: {
      enableAutoRecovery: true,
      saveCheckpoints: true,
      maxRecoveryAttempts: 3
    },
    notifications: {
      enableProgressUpdates: true,
      enableErrorAlerts: true,
      progressUpdateInterval: 1000
    }
  });
  
  // 高级设置模态框
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // 服务实例
  const orchestratorRef = useRef<ContentGenerationOrchestrator>();
  const gameStorageRef = useRef<GameDataStorageService>();
  
  // 响应式监听
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setLayoutMode(LayoutMode.MOBILE_TABS);
      } else if (width < 1024) {
        setLayoutMode(LayoutMode.TWO_COLUMN);
      } else {
        setLayoutMode(LayoutMode.THREE_COLUMN);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 初始化数据
  useEffect(() => {
    initializeData();
  }, []);
  
  // 初始化服务和数据
  const initializeData = async () => {
    try {
      // 初始化服务
      orchestratorRef.current = new ContentGenerationOrchestrator();
      gameStorageRef.current = new GameDataStorageService();
      
      // 加载工作流
      const workflowsResult = workflowStorage.getAll();
      if (workflowsResult.success && workflowsResult.data) {
        setWorkflows(workflowsResult.data);
        
        if (workflowsResult.data.length > 0) {
          setSelectedWorkflow(workflowsResult.data[0]);
          setGenerationConfig(prev => ({
            ...prev,
            workflowId: workflowsResult.data[0].id
          }));
        }
      }
      
      // 加载游戏数据
      const stats = await gameStorageRef.current.getStats();
      console.log('游戏数据统计:', stats);
      
    } catch (error) {
      console.error('初始化失败:', error);
      setUIState(UIState.ERROR);
    }
  };
  
  // 开始生成
  const handleStartGeneration = useCallback(async () => {
    if (!selectedWorkflow || !orchestratorRef.current) {
      toast.error('请选择工作流和确保服务已初始化');
      return;
    }
    
    try {
      setUIState(UIState.GENERATING);
      
      // 设置进度监听
      orchestratorRef.current.on('progress-updated', (flowId: string, progress: any) => {
        setFlowStatus(progress);
      });
      
             orchestratorRef.current.on('flow-completed', (flowId: string, result: any) => {
         setGenerationResults(prev => [...prev, result]);
         setUIState(UIState.COMPLETED);
         toast.success('内容生成完成');
       });
       
       orchestratorRef.current.on('flow-failed', (flowId: string, error: any) => {
         setUIState(UIState.ERROR);
         toast.error(`生成失败: ${error.message}`);
       });
      
      // 启动生成流程
      const flowId = await orchestratorRef.current.startGenerationFlow(generationConfig);
      setCurrentFlowId(flowId);
      
      // 切换到进度Tab (移动端)
      if (layoutMode === LayoutMode.MOBILE_TABS) {
        setMobileTab(MobileTab.PROGRESS);
      }
      
    } catch (error) {
      console.error('启动生成失败:', error);
      setUIState(UIState.ERROR);
      toast?.error('启动生成失败');
    }
  }, [selectedWorkflow, generationConfig, layoutMode, toast]);
  
  // 暂停生成
  const handlePauseGeneration = useCallback(async () => {
    if (!currentFlowId || !orchestratorRef.current) return;
    
    try {
      await orchestratorRef.current.pauseFlow(currentFlowId);
      setUIState(UIState.PAUSED);
      toast?.info('生成已暂停');
    } catch (error) {
      console.error('暂停失败:', error);
      toast?.error('暂停失败');
    }
  }, [currentFlowId, toast]);
  
  // 恢复生成
  const handleResumeGeneration = useCallback(async () => {
    if (!currentFlowId || !orchestratorRef.current) return;
    
    try {
      await orchestratorRef.current.resumeFlow(currentFlowId);
      setUIState(UIState.GENERATING);
      toast?.info('生成已恢复');
    } catch (error) {
      console.error('恢复失败:', error);
      toast?.error('恢复失败');
    }
  }, [currentFlowId, toast]);
  
  // 停止生成
  const handleStopGeneration = useCallback(async () => {
    if (!currentFlowId || !orchestratorRef.current) return;
    
    try {
      await orchestratorRef.current.cancelFlow(currentFlowId);
      setUIState(UIState.IDLE);
      setCurrentFlowId(null);
      setFlowStatus(null);
      toast?.info('生成已停止');
    } catch (error) {
      console.error('停止失败:', error);
      toast?.error('停止失败');
    }
  }, [currentFlowId, toast]);
  
  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (uiState === UIState.IDLE) {
              handleStartGeneration();
            }
            break;
          case ' ':
            e.preventDefault();
            if (uiState === UIState.GENERATING) {
              handlePauseGeneration();
            } else if (uiState === UIState.PAUSED) {
              handleResumeGeneration();
            }
            break;
          case 'Escape':
            e.preventDefault();
            if (uiState === UIState.GENERATING || uiState === UIState.PAUSED) {
              handleStopGeneration();
            }
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiState, handleStartGeneration, handlePauseGeneration, handleResumeGeneration, handleStopGeneration]);
  
  // 渲染配置区域
  const renderConfigurationPanel = () => (
    <Card className={`h-full ${isConfigCollapsed ? 'w-16' : 'flex-1'} transition-all duration-300`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          {!isConfigCollapsed && <h3 className="font-semibold text-gray-900">生成配置</h3>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
          className="lg:flex hidden"
        >
          {isConfigCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      {!isConfigCollapsed && (
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* 工作流选择器 - 增强版卡片式UI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              工作流选择
            </label>
            {selectedWorkflow ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">{selectedWorkflow.name}</h4>
                      <p className="text-sm text-blue-600 truncate max-w-48">
                        {selectedWorkflow.description || '暂无描述'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWorkflow(null);
                      setGenerationConfig(prev => ({ ...prev, workflowId: '' }));
                    }}
                    disabled={uiState === UIState.GENERATING}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    更换
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value=""
                  onChange={(e) => {
                    const workflow = workflows.find(w => w.id === e.target.value);
                    setSelectedWorkflow(workflow || null);
                    setGenerationConfig(prev => ({
                      ...prev,
                      workflowId: e.target.value
                    }));
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={uiState === UIState.GENERATING}
                >
                  <option value="">请选择工作流</option>
                  {workflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
                {workflows.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    暂无可用工作流，请先创建工作流
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* 数据状态显示卡片 - 增强版 */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">数据状态</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{gameData.length}</div>
                <div className="text-sm text-gray-500">游戏数据</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">已就绪</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{workflows.length}</div>
                <div className="text-sm text-gray-500">工作流</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-blue-600">可用</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 内容设置快速预览 - 增强版 */}
          {selectedWorkflow?.contentSettings && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700">内容设置预览</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(true)}
                  className="text-emerald-600 hover:bg-emerald-100"
                >
                  详细设置
                </Button>
              </div>
              
              <div className="space-y-3">
                {/* 字数设置预览 */}
                <div className="bg-white rounded-md p-3 border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">字数控制</span>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      总计 {selectedWorkflow.contentSettings.wordCount?.total?.min}-{selectedWorkflow.contentSettings.wordCount?.total?.max}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>标题: {selectedWorkflow.contentSettings.wordCount?.title?.min}-{selectedWorkflow.contentSettings.wordCount?.title?.max}</div>
                    <div>描述: {selectedWorkflow.contentSettings.wordCount?.description?.min}-{selectedWorkflow.contentSettings.wordCount?.description?.max}</div>
                  </div>
                </div>
                
                {/* 关键词密度预览 */}
                <div className="bg-white rounded-md p-3 border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">关键词密度</span>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      主词 {selectedWorkflow.contentSettings.keywordDensity?.mainKeyword?.target}%
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    长尾词: {selectedWorkflow.contentSettings.keywordDensity?.longTailKeywords?.target}%
                  </div>
                </div>
                
                {/* 生成模式预览 */}
                <div className="bg-white rounded-md p-3 border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">生成模式</span>
                    <Badge 
                      variant={
                        selectedWorkflow.contentSettings.generationMode === 'seo_optimized' ? 'primary' :
                        selectedWorkflow.contentSettings.generationMode === 'balanced' ? 'success' :
                        selectedWorkflow.contentSettings.generationMode === 'creative' ? 'warning' : 'secondary'
                      }
                    >
                      {selectedWorkflow.contentSettings.generationMode === 'seo_optimized' ? 'SEO优化' :
                       selectedWorkflow.contentSettings.generationMode === 'balanced' ? '平衡模式' :
                       selectedWorkflow.contentSettings.generationMode === 'creative' ? '创意模式' : '自定义'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 结构化数据选择 - 优化版 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              结构化数据类型
            </label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { type: 'VideoGame', label: '游戏信息', desc: '基础游戏数据结构', required: true },
                  { type: 'VideoObject', label: '视频对象', desc: '游戏视频相关数据' },
                  { type: 'Review', label: '评价信息', desc: '用户评价和评分' },
                  { type: 'BreadcrumbList', label: '面包屑导航', desc: '页面导航结构' },
                  { type: 'FAQPage', label: '常见问题', desc: 'FAQ页面结构' }
                ].map(({ type, label, desc, required }) => (
                  <label key={type} className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      className="mt-1 rounded border-gray-300 text-blue-600"
                      disabled={uiState === UIState.GENERATING || required}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        {required && (
                          <Badge variant="primary" size="sm">必需</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {/* 高级选项折叠面板 */}
          <div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSettings(true)}
              disabled={uiState === UIState.GENERATING}
              className="w-full flex items-center justify-between p-4 h-auto"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>高级设置</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" size="sm">
                  {Object.keys(generationConfig).length} 项配置
                </Badge>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
  
  // 渲染进度区域
  const renderProgressPanel = () => (
    <Card className="flex-1 min-h-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">生成进度</h3>
        </div>
        <Badge 
          variant={
            uiState === UIState.GENERATING ? 'primary' :
            uiState === UIState.COMPLETED ? 'success' :
            uiState === UIState.ERROR ? 'danger' :
            uiState === UIState.PAUSED ? 'warning' : 'secondary'
          }
        >
          {uiState === UIState.GENERATING ? '生成中' :
           uiState === UIState.COMPLETED ? '已完成' :
           uiState === UIState.ERROR ? '错误' :
           uiState === UIState.PAUSED ? '已暂停' : '待启动'}
        </Badge>
      </div>
      
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* 总体进度 */}
        {flowStatus && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">总体进度</span>
              <span className="text-sm text-gray-500">
                {Math.round(flowStatus.progress.overall)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${flowStatus.progress.overall}%` }}
              />
            </div>
            
            {/* 当前步骤 */}
            <div className="mt-3 text-sm text-gray-600">
              当前步骤: {flowStatus.currentStep || '准备中'}
            </div>
            
            {/* 预计剩余时间 */}
            {flowStatus.estimatedCompletion && (
              <div className="text-sm text-gray-500">
                预计完成: {new Date(flowStatus.estimatedCompletion).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
        
        {/* 阶段进度详情 */}
        {flowStatus?.steps && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">阶段详情</h4>
            <div className="space-y-2">
              {flowStatus.steps.map(step => (
                <div key={step.step} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{step.step}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{step.progress}%</span>
                    <Badge 
                      variant={
                        step.status === 'completed' ? 'success' :
                        step.status === 'running' ? 'primary' :
                        step.status === 'failed' ? 'danger' : 'secondary'
                      }
                      size="sm"
                    >
                      {step.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 性能监控 */}
        {flowStatus?.metrics && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">性能监控</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-500">内存使用</div>
                <div className="font-medium">{Math.round(flowStatus.metrics.memoryUsage || 0)}MB</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-500">并发数</div>
                <div className="font-medium">{flowStatus.metrics.currentConcurrency || 0}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* 无进度状态 */}
        {!flowStatus && uiState === UIState.IDLE && (
          <div className="text-center py-8 text-gray-500">
            <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>点击开始生成按钮启动内容生成流程</p>
          </div>
        )}
      </div>
    </Card>
  );
  
  // 渲染预览区域
  const renderPreviewPanel = () => (
    <Card className={`h-full ${isPreviewCollapsed ? 'w-16' : 'flex-1'} transition-all duration-300`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          {!isPreviewCollapsed && <h3 className="font-semibold text-gray-900">结果预览</h3>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
          className="lg:flex hidden"
        >
          {isPreviewCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      
      {!isPreviewCollapsed && (
        <div className="flex-1 overflow-hidden">
          {generationResults.length > 0 ? (
            <div className="h-full flex flex-col">
              {/* 结果列表 */}
              <div className="flex-1 overflow-y-auto">
                <ResultsList
                  results={generationResults}
                  onSelectResult={(result) => {
                    // 处理结果选择
                    console.log('选择结果:', result);
                  }}
                  showSearch={true}
                  showFilter={true}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>暂无生成结果</p>
              <p className="text-sm">开始生成后结果将在这里显示</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
  
  // 渲染操作工具栏
  const renderActionToolbar = () => (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {uiState === UIState.IDLE && (
            <Button
              onClick={handleStartGeneration}
              disabled={!selectedWorkflow}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              开始生成
            </Button>
          )}
          
          {uiState === UIState.GENERATING && (
            <>
              <Button
                variant="secondary"
                onClick={handlePauseGeneration}
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                暂停
              </Button>
              <Button
                variant="danger"
                onClick={handleStopGeneration}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                停止
              </Button>
            </>
          )}
          
          {uiState === UIState.PAUSED && (
            <>
              <Button
                onClick={handleResumeGeneration}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                恢复
              </Button>
              <Button
                variant="danger"
                onClick={handleStopGeneration}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                停止
              </Button>
            </>
          )}
          
          {(uiState === UIState.COMPLETED || uiState === UIState.ERROR) && (
            <Button
              variant="secondary"
              onClick={() => {
                setUIState(UIState.IDLE);
                setCurrentFlowId(null);
                setFlowStatus(null);
              }}
              className="flex items-center gap-2"
            >
              <Refresh className="h-4 w-4" />
              重新开始
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {generationResults.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                // 导出功能
                Toast.info('导出功能开发中');
              }}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              导出结果
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={() => {
              // 全屏切换
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            className="flex items-center gap-2"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 快捷键提示 */}
      <div className="mt-2 text-xs text-gray-500 flex gap-4">
        <span>Ctrl+Enter: 开始生成</span>
        <span>Ctrl+Space: 暂停/恢复</span>
        <span>Ctrl+Esc: 停止</span>
      </div>
    </div>
  );
  
  // 移动端Tab导航
  const renderMobileTabNavigation = () => (
    <div className="bg-white border-b border-gray-200">
      <div className="flex">
        <button
          onClick={() => setMobileTab(MobileTab.CONFIG)}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
            mobileTab === MobileTab.CONFIG
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          配置
        </button>
        <button
          onClick={() => setMobileTab(MobileTab.PROGRESS)}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
            mobileTab === MobileTab.PROGRESS
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          进度
        </button>
        <button
          onClick={() => setMobileTab(MobileTab.PREVIEW)}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
            mobileTab === MobileTab.PREVIEW
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          预览
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-semibold text-gray-900">内容生成</h1>
        <p className="text-sm text-gray-600 mt-1">
          AI驱动的游戏内容自动生成系统
        </p>
      </div>
      
      {/* 移动端Tab导航 */}
      {layoutMode === LayoutMode.MOBILE_TABS && renderMobileTabNavigation()}
      
      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {layoutMode === LayoutMode.MOBILE_TABS ? (
          // 移动端Tab切换布局
          <div className="h-full">
            {mobileTab === MobileTab.CONFIG && renderConfigurationPanel()}
            {mobileTab === MobileTab.PROGRESS && renderProgressPanel()}
            {mobileTab === MobileTab.PREVIEW && renderPreviewPanel()}
          </div>
        ) : (
          // 桌面端多栏布局
          <div className="h-full flex gap-4 p-4">
            {/* 配置区域 */}
            {renderConfigurationPanel()}
            
            {/* 进度区域 */}
            {renderProgressPanel()}
            
            {/* 预览区域 */}
            {layoutMode === LayoutMode.THREE_COLUMN && renderPreviewPanel()}
          </div>
        )}
      </div>
      
      {/* 操作工具栏 */}
      {renderActionToolbar()}
      
      {/* 高级设置模态框 */}
      <Modal
        isOpen={showAdvancedSettings}
        onClose={() => setShowAdvancedSettings(false)}
        title="高级设置"
        size="lg"
      >
        <div className="space-y-4">
          {/* 并发设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大并发游戏数
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={generationConfig.concurrency.maxConcurrentGames}
              onChange={(e) => setGenerationConfig(prev => ({
                ...prev,
                concurrency: {
                  ...prev.concurrency,
                  maxConcurrentGames: parseInt(e.target.value)
                }
              }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* 质量阈值 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              质量阈值 ({generationConfig.qualityThreshold})
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={generationConfig.qualityThreshold}
              onChange={(e) => setGenerationConfig(prev => ({
                ...prev,
                qualityThreshold: parseFloat(e.target.value)
              }))}
              className="w-full"
            />
          </div>
          
          {/* 重试次数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大重试次数
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={generationConfig.maxRetries}
              onChange={(e) => setGenerationConfig(prev => ({
                ...prev,
                maxRetries: parseInt(e.target.value)
              }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* 自动恢复 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={generationConfig.recovery.enableAutoRecovery}
                onChange={(e) => setGenerationConfig(prev => ({
                  ...prev,
                  recovery: {
                    ...prev.recovery,
                    enableAutoRecovery: e.target.checked
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 mr-2"
              />
              <span className="text-sm text-gray-700">启用自动恢复</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowAdvancedSettings(false)}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                setShowAdvancedSettings(false);
                Toast.success('高级设置已保存');
              }}
            >
              保存设置
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 加载状态 */}
      {uiState === UIState.CONFIGURING && (
        <Loading message="正在初始化生成配置..." />
      )}
    </div>
  );
}