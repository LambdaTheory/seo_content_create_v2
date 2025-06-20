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
      const unsubscribe = orchestratorRef.current.onStatusUpdate((status) => {
        setFlowStatus(status);
        
        if (status.stage === 'completed') {
          setUIState(UIState.COMPLETED);
          toast.success('内容生成完成！');
        } else if (status.stage === 'failed') {
          setUIState(UIState.ERROR);
          toast.error(`生成失败: ${status.error}`);
        }
      });
      
      // 执行生成流程
      const result = await orchestratorRef.current.executeFlow(generationConfig);
      setCurrentFlowId(result.flowId);
      
      if (result.results) {
        setGenerationResults(result.results);
      }
      
    } catch (error) {
      console.error('生成失败:', error);
      setUIState(UIState.ERROR);
      toast.error('生成过程中发生错误');
    }
  }, [selectedWorkflow, generationConfig, toast]);
  
  // 暂停生成
  const handlePauseGeneration = useCallback(async () => {
    if (currentFlowId && orchestratorRef.current) {
      try {
        await orchestratorRef.current.pauseFlow(currentFlowId);
        setUIState(UIState.PAUSED);
        toast.info('生成已暂停');
      } catch (error) {
        console.error('暂停失败:', error);
        toast.error('暂停失败');
      }
    }
  }, [currentFlowId, toast]);
  
  // 停止生成
  const handleStopGeneration = useCallback(async () => {
    if (currentFlowId && orchestratorRef.current) {
      try {
        await orchestratorRef.current.stopFlow(currentFlowId);
        setUIState(UIState.IDLE);
        setFlowStatus(null);
        setCurrentFlowId(null);
        toast.info('生成已停止');
      } catch (error) {
        console.error('停止失败:', error);
        toast.error('停止失败');
      }
    }
  }, [currentFlowId, toast]);
  
  // 键盘快捷键
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
          case 'p':
            e.preventDefault();
            if (uiState === UIState.GENERATING) {
              handlePauseGeneration();
            }
            break;
          case 's':
            e.preventDefault();
            if (uiState !== UIState.IDLE) {
              handleStopGeneration();
            }
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiState, handleStartGeneration, handlePauseGeneration, handleStopGeneration]);

  // 渲染配置面板
  const renderConfigurationPanel = () => (
    <div className={`
      ${layoutMode === LayoutMode.THREE_COLUMN ? 'w-80' : 'w-1/2'}
      ${isConfigCollapsed ? 'w-16' : ''}
      transition-all duration-300 ease-in-out
      bg-white border-r border-gray-200 flex flex-col
      ${layoutMode === LayoutMode.MOBILE_TABS ? 'hidden' : ''}
    `}>
      {/* 配置区头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          {!isConfigCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">生成配置</h2>
              <p className="text-sm text-gray-600">设置生成参数</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
          className="p-2"
        >
          {isConfigCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {!isConfigCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 工作流选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">选择工作流</label>
            <div className="space-y-2">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`
                    p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${selectedWorkflow?.id === workflow.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => {
                    setSelectedWorkflow(workflow);
                    setGenerationConfig(prev => ({ ...prev, workflowId: workflow.id }));
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    </div>
                    <Badge variant={workflow.status === 'active' ? 'success' : 'warning'}>
                      {workflow.status === 'active' ? '激活' : '停用'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 游戏数据配置 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">游戏数据范围</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Database className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">全部游戏数据</p>
                  <p className="text-xs text-gray-600">将处理所有可用的游戏数据</p>
                </div>
              </div>
            </div>
          </div>

          {/* 质量控制 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">质量设置</label>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">质量阈值</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.1"
                    value={generationConfig.qualityThreshold}
                    onChange={(e) => setGenerationConfig(prev => ({
                      ...prev,
                      qualityThreshold: parseFloat(e.target.value)
                    }))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                    {Math.round(generationConfig.qualityThreshold * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">重试次数</label>
                <select
                  value={generationConfig.maxRetries}
                  onChange={(e) => setGenerationConfig(prev => ({
                    ...prev,
                    maxRetries: parseInt(e.target.value)
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1次</option>
                  <option value={2}>2次</option>
                  <option value={3}>3次</option>
                  <option value={5}>5次</option>
                </select>
              </div>
            </div>
          </div>

          {/* 高级设置按钮 */}
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowAdvancedSettings(true)}
            className="border-2"
          >
            <Settings className="w-4 h-4 mr-2" />
            高级设置
          </Button>
        </div>
      )}
    </div>
  );

  // 渲染进度面板
  const renderProgressPanel = () => (
    <div className={`
      flex-1 bg-gray-50 flex flex-col
      ${layoutMode === LayoutMode.MOBILE_TABS ? 'hidden' : ''}
    `}>
      {/* 进度区头部 */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">生成进度</h2>
            <p className="text-sm text-gray-600">实时监控生成状态</p>
          </div>
        </div>
        
        {/* 状态指示器 */}
        <div className="flex items-center space-x-2">
          <div className={`
            w-3 h-3 rounded-full
            ${uiState === UIState.GENERATING ? 'bg-green-500 animate-pulse' : 
              uiState === UIState.COMPLETED ? 'bg-blue-500' :
              uiState === UIState.ERROR ? 'bg-red-500' :
              uiState === UIState.PAUSED ? 'bg-yellow-500' :
              'bg-gray-400'}
          `} />
          <span className="text-sm font-medium text-gray-700">
            {uiState === UIState.GENERATING ? '生成中' :
             uiState === UIState.COMPLETED ? '已完成' :
             uiState === UIState.ERROR ? '错误' :
             uiState === UIState.PAUSED ? '已暂停' :
             '就绪'}
          </span>
        </div>
      </div>

      {/* 进度内容 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {flowStatus ? (
          <div className="space-y-4">
            {/* 总体进度 */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">总体进度</h3>
                <span className="text-sm text-gray-600">
                  {Math.round((flowStatus.completedTasks / flowStatus.totalTasks) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(flowStatus.completedTasks / flowStatus.totalTasks) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>已完成: {flowStatus.completedTasks}</span>
                <span>总计: {flowStatus.totalTasks}</span>
              </div>
            </div>

            {/* 当前任务 */}
            {flowStatus.currentTask && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">当前任务</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{flowStatus.currentTask.name}</p>
                    <p className="text-xs text-gray-600">{flowStatus.currentTask.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">准备开始生成</h3>
              <p className="text-gray-600">配置完成后点击开始按钮</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染预览面板
  const renderPreviewPanel = () => (
    <div className={`
      ${layoutMode === LayoutMode.THREE_COLUMN ? 'w-96' : 'w-1/2'}
      ${isPreviewCollapsed ? 'w-16' : ''}
      transition-all duration-300 ease-in-out
      bg-white border-l border-gray-200 flex flex-col
      ${layoutMode === LayoutMode.MOBILE_TABS ? 'hidden' : ''}
    `}>
      {/* 预览区头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
          className="p-2"
        >
          {isPreviewCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
        {!isPreviewCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">结果预览</h2>
              <p className="text-sm text-gray-600">查看生成结果</p>
            </div>
          </div>
        )}
      </div>

      {!isPreviewCollapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          {generationResults.length > 0 ? (
            <div className="space-y-4">
              <ResultsList results={generationResults} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无结果</h3>
                <p className="text-gray-600">开始生成后结果将显示在这里</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 渲染操作工具栏
  const renderActionToolbar = () => (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* 主要操作按钮 */}
          {uiState === UIState.IDLE && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartGeneration}
              disabled={!selectedWorkflow}
              className="bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              开始生成
            </Button>
          )}
          
          {uiState === UIState.GENERATING && (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={handlePauseGeneration}
                className="border-2"
              >
                <Pause className="w-5 h-5 mr-2" />
                暂停
              </Button>
              <Button
                variant="danger"
                size="lg"
                onClick={handleStopGeneration}
              >
                <Square className="w-5 h-5 mr-2" />
                停止
              </Button>
            </>
          )}
          
          {uiState === UIState.PAUSED && (
            <>
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartGeneration}
                className="bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                继续
              </Button>
              <Button
                variant="danger"
                size="lg"
                onClick={handleStopGeneration}
              >
                <Square className="w-5 h-5 mr-2" />
                停止
              </Button>
            </>
          )}
          
          {uiState === UIState.COMPLETED && (
            <>
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartGeneration}
                className="bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Refresh className="w-5 h-5 mr-2" />
                重新生成
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2"
              >
                <Download className="w-5 h-5 mr-2" />
                导出结果
              </Button>
            </>
          )}
        </div>

        {/* 次要操作 */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          {layoutMode !== LayoutMode.MOBILE_TABS && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
                title="切换配置面板"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                title="切换预览面板"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* 快捷键提示 */}
      <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2">
        快捷键: Ctrl/Cmd + Enter (开始), Ctrl/Cmd + P (暂停), Ctrl/Cmd + S (停止)
      </div>
    </div>
  );

  // 渲染移动端Tab导航
  const renderMobileTabNavigation = () => (
    <div className={`${layoutMode === LayoutMode.MOBILE_TABS ? 'block' : 'hidden'}`}>
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
              mobileTab === MobileTab.CONFIG
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setMobileTab(MobileTab.CONFIG)}
          >
            <Settings className="w-4 h-4 mx-auto mb-1" />
            配置
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
              mobileTab === MobileTab.PROGRESS
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setMobileTab(MobileTab.PROGRESS)}
          >
            <Monitor className="w-4 h-4 mx-auto mb-1" />
            进度
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
              mobileTab === MobileTab.PREVIEW
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setMobileTab(MobileTab.PREVIEW)}
          >
            <FileText className="w-4 h-4 mx-auto mb-1" />
            预览
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染移动端内容
  const renderMobileContent = () => (
    <div className={`flex-1 ${layoutMode === LayoutMode.MOBILE_TABS ? 'block' : 'hidden'}`}>
      {mobileTab === MobileTab.CONFIG && renderConfigurationPanel()}
      {mobileTab === MobileTab.PROGRESS && renderProgressPanel()}
      {mobileTab === MobileTab.PREVIEW && renderPreviewPanel()}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI内容生成</h1>
              <p className="text-sm text-gray-600">基于工作流的智能内容生成系统</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={uiState === UIState.GENERATING ? 'success' : 'default'}>
              {uiState === UIState.GENERATING ? '生成中' : '就绪'}
            </Badge>
          </div>
        </div>
      </div>

      {/* 移动端Tab导航 */}
      {renderMobileTabNavigation()}

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 桌面端布局 */}
        {layoutMode !== LayoutMode.MOBILE_TABS && (
          <>
            {renderConfigurationPanel()}
            {renderProgressPanel()}
            {renderPreviewPanel()}
          </>
        )}
        
        {/* 移动端布局 */}
        {renderMobileContent()}
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
        <div className="space-y-6 p-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">并发控制</h3>
            <div className="grid grid-cols-2 gap-4">
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
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大并发阶段数
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={generationConfig.concurrency.maxConcurrentStages}
                  onChange={(e) => setGenerationConfig(prev => ({
                    ...prev,
                    concurrency: {
                      ...prev.concurrency,
                      maxConcurrentStages: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">超时设置</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  单游戏超时 (分钟)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={generationConfig.timeout.perGame / 60000}
                  onChange={(e) => setGenerationConfig(prev => ({
                    ...prev,
                    timeout: {
                      ...prev.timeout,
                      perGame: parseInt(e.target.value) * 60000
                    }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  总超时 (分钟)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={generationConfig.timeout.total / 60000}
                  onChange={(e) => setGenerationConfig(prev => ({
                    ...prev,
                    timeout: {
                      ...prev.timeout,
                      total: parseInt(e.target.value) * 60000
                    }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSettings(false)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowAdvancedSettings(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              保存设置
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}