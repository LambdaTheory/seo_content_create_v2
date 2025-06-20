/**
 * 生成控制按钮组件
 * 任务10.2.5：添加操作按钮集成 - 开始/暂停/停止按钮、状态变化动画、快捷键支持、危险操作确认
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Download,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

export interface GenerationStatus {
  status: 'idle' | 'configuring' | 'generating' | 'paused' | 'completed' | 'error' | 'stopping';
  progress: number;
  currentStage?: string;
  processedItems?: number;
  totalItems?: number;
  canStart: boolean;
  canPause: boolean;
  canStop: boolean;
  canRestart: boolean;
  hasResults?: boolean;
}

export interface GenerationControlButtonsProps {
  status: GenerationStatus;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onRestart: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  disabled?: boolean;
  showProgress?: boolean;
  className?: string;
}

const GenerationControlButtons: React.FC<GenerationControlButtonsProps> = ({
  status,
  onStart,
  onPause,
  onStop,
  onRestart,
  onExport,
  onSettings,
  disabled = false,
  showProgress = true,
  className = ''
}) => {
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略输入框内的快捷键
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            if (status.canStart && !disabled) {
              handleStart();
            }
            break;
          case ' ':
            event.preventDefault();
            if (status.status === 'generating' && status.canPause && !disabled) {
              handlePause();
            } else if (status.status === 'paused' && !disabled) {
              handleStart();
            }
            break;
          case 'Escape':
            event.preventDefault();
            if (status.canStop && !disabled) {
              handleStopClick();
            }
            break;
          case 'r':
            event.preventDefault();
            if (status.canRestart && !disabled) {
              handleRestartClick();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, disabled]);

  // 操作处理函数
  const handleStart = useCallback(() => {
    setLastAction('start');
    onStart();
  }, [onStart]);

  const handlePause = useCallback(() => {
    setLastAction('pause');
    onPause();
  }, [onPause]);

  const handleStopClick = useCallback(() => {
    if (status.status === 'generating' || status.status === 'paused') {
      setShowStopConfirm(true);
    } else {
      handleStopConfirm();
    }
  }, [status.status]);

  const handleStopConfirm = useCallback(() => {
    setLastAction('stop');
    setShowStopConfirm(false);
    onStop();
  }, [onStop]);

  const handleRestartClick = useCallback(() => {
    if (status.status === 'generating' || status.hasResults) {
      setShowRestartConfirm(true);
    } else {
      handleRestartConfirm();
    }
  }, [status.status, status.hasResults]);

  const handleRestartConfirm = useCallback(() => {
    setLastAction('restart');
    setShowRestartConfirm(false);
    onRestart();
  }, [onRestart]);

  // 获取状态配置
  const getStatusConfig = () => {
    switch (status.status) {
      case 'idle':
        return {
          icon: Play,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: '待开始',
          variant: 'secondary' as const
        };
      case 'configuring':
        return {
          icon: Settings,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          label: '配置中',
          variant: 'primary' as const
        };
      case 'generating':
        return {
          icon: Zap,
          color: 'text-green-600',
          bg: 'bg-green-100',
          label: '生成中',
          variant: 'success' as const
        };
      case 'paused':
        return {
          icon: Pause,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          label: '已暂停',
          variant: 'warning' as const
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100',
          label: '已完成',
          variant: 'success' as const
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          label: '错误',
          variant: 'danger' as const
        };
      case 'stopping':
        return {
          icon: Loader2,
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          label: '停止中',
          variant: 'warning' as const
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: '未知',
          variant: 'secondary' as const
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // 主要操作按钮
  const renderMainButton = () => {
    if (status.status === 'generating') {
      return (
                 <Button
           onClick={handlePause}
           disabled={!status.canPause || disabled}
           variant="secondary"
           size="lg"
           className="relative overflow-hidden group"
         >
          <Pause className="h-5 w-5 mr-2" />
          暂停生成
          <span className="ml-2 text-xs opacity-75">(Ctrl+Space)</span>
          
          {/* 动画效果 */}
          <div className="absolute inset-0 bg-yellow-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
        </Button>
      );
    }

    if (status.status === 'paused') {
      return (
                 <Button
           onClick={handleStart}
           disabled={disabled}
           variant="primary"
           size="lg"
           className="relative overflow-hidden group"
         >
          <Play className="h-5 w-5 mr-2" />
          继续生成
          <span className="ml-2 text-xs opacity-75">(Ctrl+Space)</span>
          
          <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
        </Button>
      );
    }

    return (
      <Button
        onClick={handleStart}
        disabled={!status.canStart || disabled}
        variant="primary"
        size="lg"
        className="relative overflow-hidden group"
      >
        <Play className="h-5 w-5 mr-2" />
        开始生成
        <span className="ml-2 text-xs opacity-75">(Ctrl+Enter)</span>
        
        <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
      </Button>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 状态显示 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${statusConfig.bg}`}>
            <StatusIcon className={`h-5 w-5 ${statusConfig.color} ${
              status.status === 'generating' || status.status === 'stopping' ? 'animate-spin' : ''
            }`} />
          </div>
          <div>
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
            {status.currentStage && (
              <p className="text-sm text-gray-600 mt-1">{status.currentStage}</p>
            )}
          </div>
        </div>

        {/* 进度信息 */}
        {showProgress && (status.processedItems !== undefined || status.progress > 0) && (
          <div className="text-right">
            {status.processedItems !== undefined && status.totalItems && (
              <div className="text-sm font-medium text-gray-700">
                {status.processedItems} / {status.totalItems} 项
              </div>
            )}
            {status.progress > 0 && (
              <div className="text-xs text-gray-500">
                进度 {status.progress.toFixed(1)}%
              </div>
            )}
          </div>
        )}
      </div>

      {/* 主要控制按钮 */}
      <div className="flex gap-3">
        {/* 主要操作按钮 */}
        <div className="flex-1">
          {renderMainButton()}
        </div>

        {/* 停止按钮 */}
        {status.canStop && (
          <Button
            onClick={handleStopClick}
            disabled={disabled}
            variant="danger"
            size="lg"
            className="relative overflow-hidden group"
          >
            <Square className="h-5 w-5 mr-2" />
            停止
            <span className="ml-1 text-xs opacity-75">(Ctrl+Esc)</span>
            
            <div className="absolute inset-0 bg-red-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
          </Button>
        )}
      </div>

      {/* 次要操作按钮 */}
      <div className="flex gap-2">
        {/* 重新开始 */}
        {status.canRestart && (
          <Button
            onClick={handleRestartClick}
            disabled={disabled}
            variant="outline"
            size="md"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重新开始
            <span className="ml-2 text-xs opacity-75">(Ctrl+R)</span>
          </Button>
        )}

        {/* 导出结果 */}
        {status.hasResults && onExport && (
          <Button
            onClick={onExport}
            disabled={disabled}
            variant="outline"
            size="md"
          >
            <Download className="h-4 w-4 mr-2" />
            导出结果
          </Button>
        )}

        {/* 设置 */}
        {onSettings && (
          <Button
            onClick={onSettings}
            disabled={disabled || status.status === 'generating'}
            variant="ghost"
            size="md"
          >
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
        )}
      </div>

      {/* 快捷键提示 */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <div className="font-medium mb-1">快捷键：</div>
        <div className="grid grid-cols-2 gap-2">
          <div>Ctrl+Enter: 开始生成</div>
          <div>Ctrl+Space: 暂停/继续</div>
          <div>Ctrl+Esc: 停止生成</div>
          <div>Ctrl+R: 重新开始</div>
        </div>
      </div>

      {/* 停止确认对话框 */}
      <Modal
        open={showStopConfirm}
        onClose={() => setShowStopConfirm(false)}
        title="确认停止生成"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-gray-900 font-medium">
                确定要停止当前的内容生成过程吗？
              </p>
              <p className="text-gray-600 text-sm mt-1">
                已生成的内容将会保存，但未完成的项目将会丢失。
              </p>
            </div>
          </div>

          {status.processedItems !== undefined && status.totalItems && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                当前进度：{status.processedItems} / {status.totalItems} 项已完成
                （{((status.processedItems / status.totalItems) * 100).toFixed(1)}%）
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowStopConfirm(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleStopConfirm}
            >
              确认停止
            </Button>
          </div>
        </div>
      </Modal>

      {/* 重新开始确认对话框 */}
      <Modal
        isOpen={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        title="确认重新开始"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-gray-900 font-medium">
                确定要重新开始生成过程吗？
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {status.hasResults 
                  ? '现有的生成结果将会被清除，重新开始整个生成流程。'
                  : '当前的进度将会丢失，重新开始整个生成流程。'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowRestartConfirm(false)}
            >
              取消
            </Button>
            <Button
              variant="warning"
              onClick={handleRestartConfirm}
            >
              确认重新开始
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GenerationControlButtons; 