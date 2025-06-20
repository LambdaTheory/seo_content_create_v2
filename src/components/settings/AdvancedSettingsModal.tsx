/**
 * 高级设置模态框组件
 * 任务10.2.2：实现生成配置界面 - 高级选项折叠面板
 */

'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Settings, 
  Clock, 
  Zap, 
  RefreshCw,
  Bell,
  Save,
  RotateCcw,
  X,
  HelpCircle
} from 'lucide-react';
import type { GenerationFlowConfiguration } from '@/services/contentGenerationOrchestrator';

export interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GenerationFlowConfiguration;
  onConfigChange: (config: GenerationFlowConfiguration) => void;
}

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange
}) => {
  const [tempConfig, setTempConfig] = useState<GenerationFlowConfiguration>(config);

  const handleSave = () => {
    onConfigChange(tempConfig);
    onClose();
  };

  const handleReset = () => {
    setTempConfig(config);
  };

  const updateTempConfig = (updates: Partial<GenerationFlowConfiguration>) => {
    setTempConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="高级设置"
      size="lg"
      className="max-w-4xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* 并发控制设置 */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">并发控制</h3>
              <Badge variant="secondary" size="sm">性能</Badge>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大并发游戏数
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempConfig.concurrency.maxConcurrentGames}
                  onChange={(e) => updateTempConfig({
                    concurrency: {
                      ...tempConfig.concurrency,
                      maxConcurrentGames: parseInt(e.target.value) || 1
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  同时处理的游戏数量，建议 1-5 个
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大并发阶段数
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={tempConfig.concurrency.maxConcurrentStages}
                  onChange={(e) => updateTempConfig({
                    concurrency: {
                      ...tempConfig.concurrency,
                      maxConcurrentStages: parseInt(e.target.value) || 1
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  同时运行的处理阶段数
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 超时设置 */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">超时设置</h3>
              <Badge variant="secondary" size="sm">可靠性</Badge>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  单游戏超时 (秒)
                </label>
                <input
                  type="number"
                  min="60"
                  max="1800"
                  value={Math.floor(tempConfig.timeout.perGame / 1000)}
                  onChange={(e) => updateTempConfig({
                    timeout: {
                      ...tempConfig.timeout,
                      perGame: (parseInt(e.target.value) || 60) * 1000
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  每个游戏的最大处理时间
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  总体超时 (秒)
                </label>
                <input
                  type="number"
                  min="300"
                  max="7200"
                  value={Math.floor(tempConfig.timeout.total / 1000)}
                  onChange={(e) => updateTempConfig({
                    timeout: {
                      ...tempConfig.timeout,
                      total: (parseInt(e.target.value) || 300) * 1000
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  整个流程的最大运行时间
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 恢复机制设置 */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">恢复机制</h3>
              <Badge variant="secondary" size="sm">容错</Badge>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tempConfig.recovery.enableAutoRecovery}
                  onChange={(e) => updateTempConfig({
                    recovery: {
                      ...tempConfig.recovery,
                      enableAutoRecovery: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">启用自动恢复</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tempConfig.recovery.saveCheckpoints}
                  onChange={(e) => updateTempConfig({
                    recovery: {
                      ...tempConfig.recovery,
                      saveCheckpoints: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">保存检查点</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大恢复尝试次数
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempConfig.recovery.maxRecoveryAttempts}
                  onChange={(e) => updateTempConfig({
                    recovery: {
                      ...tempConfig.recovery,
                      maxRecoveryAttempts: parseInt(e.target.value) || 1
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 通知设置 */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">通知设置</h3>
              <Badge variant="secondary" size="sm">用户体验</Badge>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tempConfig.notifications.enableProgressUpdates}
                  onChange={(e) => updateTempConfig({
                    notifications: {
                      ...tempConfig.notifications,
                      enableProgressUpdates: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">启用进度更新</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tempConfig.notifications.enableErrorAlerts}
                  onChange={(e) => updateTempConfig({
                    notifications: {
                      ...tempConfig.notifications,
                      enableErrorAlerts: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">启用错误警报</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  进度更新间隔 (毫秒)
                </label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  value={tempConfig.notifications.progressUpdateInterval}
                  onChange={(e) => updateTempConfig({
                    notifications: {
                      ...tempConfig.notifications,
                      progressUpdateInterval: parseInt(e.target.value) || 1000
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 质量控制 */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">质量控制</h3>
              <Badge variant="secondary" size="sm">质量</Badge>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  质量阈值
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={tempConfig.qualityThreshold}
                  onChange={(e) => updateTempConfig({
                    qualityThreshold: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>低</span>
                  <span className="font-medium">{(tempConfig.qualityThreshold * 100).toFixed(0)}%</span>
                  <span>高</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大重试次数
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempConfig.maxRetries}
                  onChange={(e) => updateTempConfig({
                    maxRetries: parseInt(e.target.value) || 1
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 底部操作按钮 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <HelpCircle className="h-4 w-4" />
          <span>配置项影响生成速度和质量</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            保存设置
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdvancedSettingsModal; 