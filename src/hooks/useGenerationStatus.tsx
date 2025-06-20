/**
 * 生成状态管理Hook
 * 任务10.2.6：实现界面状态同步 - 实时状态更新、错误状态处理、断线重连机制、状态持久化
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
// 简单的toast替代方案
const toast = {
  success: (message: string) => console.log(`✅ ${message}`),
  error: (message: string) => console.error(`❌ ${message}`)
};

export interface GenerationFlowStatus {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentStage: string;
  progress: number;
  stageProgress: number;
  processedItems: number;
  totalItems: number;
  startTime?: Date;
  endTime?: Date;
  errors: Array<{
    stage: string;
    message: string;
    timestamp: Date;
    severity: 'warning' | 'error' | 'critical';
  }>;
  stats: {
    itemsCompleted: number;
    itemsFailed: number;
    avgProcessingTime: number;
    estimatedTimeRemaining: number;
  };
}

export interface GenerationQueueStatus {
  activeFlows: number;
  queuedFlows: number;
  maxConcurrentFlows: number;
  totalFlows: number;
}

export interface UseGenerationStatusProps {
  /** 是否启用自动轮询 */
  enablePolling?: boolean;
  /** 轮询间隔（毫秒） */
  pollingInterval?: number;
  /** 是否启用状态持久化 */
  enablePersistence?: boolean;
  /** 持久化键名 */
  persistenceKey?: string;
  /** 错误重试次数 */
  maxRetries?: number;
  /** 重试间隔（毫秒） */
  retryInterval?: number;
  /** 断线重连设置 */
  reconnection?: {
    enabled: boolean;
    maxAttempts: number;
    interval: number;
  };
}

export interface UseGenerationStatusReturn {
  // 状态数据
  flows: GenerationFlowStatus[];
  queueStatus: GenerationQueueStatus;
  isOnline: boolean;
  lastUpdate: Date | null;
  connectionError: string | null;

  // 操作方法
  startFlow: (workflowId: string, gameIds: string[]) => Promise<string>;
  pauseFlow: (flowId: string) => Promise<void>;
  resumeFlow: (flowId: string) => Promise<void>;
  cancelFlow: (flowId: string) => Promise<void>;
  retryFlow: (flowId: string) => Promise<void>;
  clearCompletedFlows: () => void;

  // 控制方法
  startPolling: () => void;
  stopPolling: () => void;
  refreshStatus: () => Promise<void>;
  reconnect: () => Promise<void>;

  // 状态查询
  getFlowById: (flowId: string) => GenerationFlowStatus | undefined;
  getActiveFlows: () => GenerationFlowStatus[];
  getCompletedFlows: () => GenerationFlowStatus[];
  getFailedFlows: () => GenerationFlowStatus[];
}

const STORAGE_KEY_PREFIX = 'generation_status_';
const DEFAULT_POLLING_INTERVAL = 2000; // 2秒
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_INTERVAL = 1000; // 1秒

export const useGenerationStatus = ({
  enablePolling = true,
  pollingInterval = DEFAULT_POLLING_INTERVAL,
  enablePersistence = true,
  persistenceKey = 'default',
  maxRetries = DEFAULT_MAX_RETRIES,
  retryInterval = DEFAULT_RETRY_INTERVAL,
  reconnection = {
    enabled: true,
    maxAttempts: 5,
    interval: 5000
  }
}: UseGenerationStatusProps = {}): UseGenerationStatusReturn => {
  // 状态
  const [flows, setFlows] = useState<GenerationFlowStatus[]>([]);
  const [queueStatus, setQueueStatus] = useState<GenerationQueueStatus>({
    activeFlows: 0,
    queuedFlows: 0,
    maxConcurrentFlows: 3,
    totalFlows: 0
  });
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 内部状态
  const [isPolling, setIsPolling] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [reconnectCount, setReconnectCount] = useState(0);

  // Refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取存储键
  const getStorageKey = useCallback((key: string) => {
    return `${STORAGE_KEY_PREFIX}${persistenceKey}_${key}`;
  }, [persistenceKey]);

  // 状态持久化
  const saveToStorage = useCallback((key: string, data: any) => {
    if (!enablePersistence || typeof window === 'undefined') return;
    try {
      localStorage.setItem(getStorageKey(key), JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [enablePersistence, getStorageKey]);

  const loadFromStorage = useCallback((key: string, defaultValue: any = null) => {
    if (!enablePersistence || typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(getStorageKey(key));
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return defaultValue;
    }
  }, [enablePersistence, getStorageKey]);

  // API调用
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const response = await fetch(`/api/generate/flow${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }, []);

  // 带重试的API调用
  const apiCallWithRetry = useCallback(async (
    endpoint: string, 
    options: RequestInit = {},
    retryAttempts: number = maxRetries
  ): Promise<any> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const result = await apiCall(endpoint, options);
        setRetryCount(0); // 重置重试计数
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryAttempts) {
          // 等待重试间隔
          await new Promise(resolve => setTimeout(resolve, retryInterval * (attempt + 1)));
        }
      }
    }
    
    throw lastError!;
  }, [apiCall, maxRetries, retryInterval]);

  // 获取状态
  const fetchStatus = useCallback(async () => {
    try {
      const response = await apiCallWithRetry('');
      
      if (response.success) {
        setFlows(response.data.flows || []);
        setQueueStatus(response.data.queueStatus || queueStatus);
        setLastUpdate(new Date());
        setConnectionError(null);
        setIsOnline(true);

        // 持久化状态
        saveToStorage('flows', response.data.flows);
        saveToStorage('queueStatus', response.data.queueStatus);
        saveToStorage('lastUpdate', new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setConnectionError((error as Error).message);
      setIsOnline(false);

      // 尝试重连
      if (reconnection.enabled && reconnectCount < reconnection.maxAttempts) {
        setReconnectCount(prev => prev + 1);
        reconnectTimeoutRef.current = setTimeout(() => {
          fetchStatus();
        }, reconnection.interval);
      }
    }
  }, [apiCallWithRetry, queueStatus, saveToStorage, reconnection, reconnectCount]);

  // 启动流程
  const startFlow = useCallback(async (workflowId: string, gameIds: string[]): Promise<string> => {
    try {
      const response = await apiCallWithRetry('', {
        method: 'POST',
        body: JSON.stringify({ workflowId, gameIds }),
      });

      if (response.success) {
        toast.success('生成流程已启动');
        await fetchStatus(); // 立即更新状态
        return response.data.flowId;
      } else {
        throw new Error(response.error || '启动失败');
      }
    } catch (error) {
      toast.error(`启动失败: ${(error as Error).message}`);
      throw error;
    }
  }, [apiCallWithRetry, fetchStatus]);

  // 暂停流程
  const pauseFlow = useCallback(async (flowId: string): Promise<void> => {
    try {
      const response = await apiCallWithRetry('', {
        method: 'PUT',
        body: JSON.stringify({ flowId, action: 'pause' }),
      });

      if (response.success) {
        toast.success('流程已暂停');
        await fetchStatus();
      } else {
        throw new Error(response.error || '暂停失败');
      }
    } catch (error) {
      toast.error(`暂停失败: ${(error as Error).message}`);
      throw error;
    }
  }, [apiCallWithRetry, fetchStatus]);

  // 恢复流程
  const resumeFlow = useCallback(async (flowId: string): Promise<void> => {
    try {
      const response = await apiCallWithRetry('', {
        method: 'PUT',
        body: JSON.stringify({ flowId, action: 'resume' }),
      });

      if (response.success) {
        toast.success('流程已恢复');
        await fetchStatus();
      } else {
        throw new Error(response.error || '恢复失败');
      }
    } catch (error) {
      toast.error(`恢复失败: ${(error as Error).message}`);
      throw error;
    }
  }, [apiCallWithRetry, fetchStatus]);

  // 取消流程
  const cancelFlow = useCallback(async (flowId: string): Promise<void> => {
    try {
      const response = await apiCallWithRetry('', {
        method: 'PUT',
        body: JSON.stringify({ flowId, action: 'cancel' }),
      });

      if (response.success) {
        toast.success('流程已取消');
        await fetchStatus();
      } else {
        throw new Error(response.error || '取消失败');
      }
    } catch (error) {
      toast.error(`取消失败: ${(error as Error).message}`);
      throw error;
    }
  }, [apiCallWithRetry, fetchStatus]);

  // 重试流程
  const retryFlow = useCallback(async (flowId: string): Promise<void> => {
    try {
      const response = await apiCallWithRetry('', {
        method: 'PUT',
        body: JSON.stringify({ flowId, action: 'recover' }),
      });

      if (response.success) {
        toast.success('流程已重试');
        await fetchStatus();
      } else {
        throw new Error(response.error || '重试失败');
      }
    } catch (error) {
      toast.error(`重试失败: ${(error as Error).message}`);
      throw error;
    }
  }, [apiCallWithRetry, fetchStatus]);

  // 清除已完成的流程
  const clearCompletedFlows = useCallback(() => {
    const newFlows = flows.filter(flow => 
      flow.status !== 'completed' && flow.status !== 'cancelled'
    );
    setFlows(newFlows);
    saveToStorage('flows', newFlows);
    toast.success('已清除完成的流程');
  }, [flows, saveToStorage]);

  // 开始轮询
  const startPolling = useCallback(() => {
    if (isPolling || pollingIntervalRef.current) return;
    
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(fetchStatus, pollingInterval);
  }, [isPolling, fetchStatus, pollingInterval]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 刷新状态
  const refreshStatus = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // 重连
  const reconnect = useCallback(async () => {
    setReconnectCount(0);
    setConnectionError(null);
    await fetchStatus();
  }, [fetchStatus]);

  // 查询方法
  const getFlowById = useCallback((flowId: string) => {
    return flows.find(flow => flow.id === flowId);
  }, [flows]);

  const getActiveFlows = useCallback(() => {
    return flows.filter(flow => 
      flow.status === 'running' || flow.status === 'paused'
    );
  }, [flows]);

  const getCompletedFlows = useCallback(() => {
    return flows.filter(flow => flow.status === 'completed');
  }, [flows]);

  const getFailedFlows = useCallback(() => {
    return flows.filter(flow => flow.status === 'failed');
  }, [flows]);

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (reconnection.enabled) {
        reconnect();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionError('网络连接已断开');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [reconnection.enabled, reconnect]);

  // 组件挂载时初始化
  useEffect(() => {
    // 加载持久化状态
    const savedFlows = loadFromStorage('flows', []);
    const savedQueueStatus = loadFromStorage('queueStatus', queueStatus);
    const savedLastUpdate = loadFromStorage('lastUpdate');

    if (savedFlows.length > 0) {
      setFlows(savedFlows);
    }
    if (savedQueueStatus) {
      setQueueStatus(savedQueueStatus);
    }
    if (savedLastUpdate) {
      setLastUpdate(new Date(savedLastUpdate));
    }

    // 启动轮询
    if (enablePolling) {
      fetchStatus().then(() => {
        startPolling();
      });
    }

    return () => {
      stopPolling();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 状态数据
    flows,
    queueStatus,
    isOnline,
    lastUpdate,
    connectionError,

    // 操作方法
    startFlow,
    pauseFlow,
    resumeFlow,
    cancelFlow,
    retryFlow,
    clearCompletedFlows,

    // 控制方法
    startPolling,
    stopPolling,
    refreshStatus,
    reconnect,

    // 状态查询
    getFlowById,
    getActiveFlows,
    getCompletedFlows,
    getFailedFlows,
  };
}; 