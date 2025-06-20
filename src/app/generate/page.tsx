/**
 * 内容生成主界面 - 简化版
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Workflow } from '@/types/Workflow.types';
import { WorkflowStorageService } from '@/services/workflowStorage';

// UI状态
enum UIState {
  IDLE = 'idle',
  GENERATING = 'generating',
  COMPLETED = 'completed'
}

export default function GeneratePage() {
  const [uiState, setUIState] = useState<UIState>(UIState.IDLE);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  
  // 加载工作流
  useEffect(() => {
    const workflowStorage = new WorkflowStorageService();
    const result = workflowStorage.getAll();
    if (result.success && result.data) {
      setWorkflows(result.data);
      if (result.data.length > 0) {
        setSelectedWorkflow(result.data[0]);
      }
    }
  }, []);

  const handleStartGeneration = () => {
    if (!selectedWorkflow) return;
    setUIState(UIState.GENERATING);
    setTimeout(() => setUIState(UIState.COMPLETED), 3000);
  };

  const handleStopGeneration = () => {
    setUIState(UIState.IDLE);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI内容生成</h1>
                <p className="text-sm text-gray-600">基于工作流的智能内容生成系统</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Badge variant={uiState === UIState.GENERATING ? 'success' : 'default'}>
                {uiState === UIState.GENERATING ? '生成中' : uiState === UIState.COMPLETED ? '已完成' : '就绪'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 配置面板 */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">生成配置</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">选择工作流</label>
                    <select
                      value={selectedWorkflow?.id || ''}
                      onChange={(e) => {
                        const workflow = workflows.find(w => w.id === e.target.value);
                        setSelectedWorkflow(workflow || null);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择工作流</option>
                      {workflows.map(workflow => (
                        <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">输出格式</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg">
                      <option value="json">JSON</option>
                      <option value="html">HTML</option>
                      <option value="markdown">Markdown</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">质量阈值</label>
                    <input type="range" min="0" max="1" step="0.1" defaultValue="0.8" className="w-full" />
                  </div>
                </div>

                <div className="mt-6">
                  {uiState === UIState.GENERATING ? (
                    <Button variant="danger" onClick={handleStopGeneration} className="w-full">
                      停止生成
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      onClick={handleStartGeneration} 
                      disabled={!selectedWorkflow}
                      className="w-full"
                    >
                      开始生成
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* 进度面板 */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">生成进度</h2>
                
                {uiState === UIState.GENERATING ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">正在生成内容...</p>
                    </div>
                  </div>
                ) : uiState === UIState.COMPLETED ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-medium">生成完成</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>等待开始生成</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* 预览面板 */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">结果预览</h2>
                
                {uiState === UIState.COMPLETED ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">生成内容</h4>
                      <p className="text-sm text-gray-600">示例生成的游戏内容...</p>
                    </div>
                    <Button variant="outline" className="w-full">导出结果</Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>生成完成后显示结果</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}