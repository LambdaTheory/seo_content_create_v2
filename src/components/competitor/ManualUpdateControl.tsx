/**
 * 手动更新功能组件
 * 功能特性：
 * - 一键更新按钮
 * - 选择性更新
 * - 更新进度显示
 * - 更新结果反馈
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  SitemapService,
  CompetitorDatabaseService,
  WebScrapingService,
  WebContentParsingService,
  ContentParsingMonitorService
} from '../../services';

/**
 * 更新选项
 */
interface UpdateOptions {
  websites: string[];
  updateType: 'incremental' | 'full' | 'selective';
  maxConcurrency: number;
  forceUpdate: boolean;
  skipExisting: boolean;
}

/**
 * 更新状态
 */
interface UpdateStatus {
  isRunning: boolean;
  startTime: Date | null;
  endTime: Date | null;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  currentWebsite: string;
  currentPhase: 'sitemap' | 'scraping' | 'parsing' | 'saving' | 'complete';
  estimatedTimeRemaining: number;
}

/**
 * 更新结果
 */
interface UpdateResult {
  website: string;
  success: boolean;
  newGames: number;
  updatedGames: number;
  errors: string[];
  duration: number;
  qualityScore: number;
}

/**
 * 网站选项
 */
interface WebsiteOption {
  id: string;
  name: string;
  domain: string;
  lastUpdated: Date | null;
  gameCount: number;
  status: 'active' | 'inactive' | 'error';
  priority: 'high' | 'medium' | 'low';
}

/**
 * 手动更新控制组件
 */
export const ManualUpdateControl: React.FC = () => {
  const [updateOptions, setUpdateOptions] = useState<UpdateOptions>({
    websites: [],
    updateType: 'incremental',
    maxConcurrency: 3,
    forceUpdate: false,
    skipExisting: true
  });

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    isRunning: false,
    startTime: null,
    endTime: null,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    currentWebsite: '',
    currentPhase: 'sitemap',
    estimatedTimeRemaining: 0
  });

  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const [availableWebsites, setAvailableWebsites] = useState<WebsiteOption[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 服务实例引用
  const sitemapServiceRef = useRef<SitemapService>();
  const competitorServiceRef = useRef<CompetitorDatabaseService>();
  const scrapingServiceRef = useRef<WebScrapingService>();
  const parsingServiceRef = useRef<WebContentParsingService>();
  const monitorServiceRef = useRef<ContentParsingMonitorService>();

  // 初始化服务
  const initializeServices = useCallback(() => {
    if (!sitemapServiceRef.current) {
      sitemapServiceRef.current = new SitemapService();
      competitorServiceRef.current = new CompetitorDatabaseService();
      scrapingServiceRef.current = new WebScrapingService();
      parsingServiceRef.current = new WebContentParsingService();
      monitorServiceRef.current = new ContentParsingMonitorService();
    }
  }, []);

  /**
   * 添加日志
   */
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-99), `[${timestamp}] ${message}`]);
  }, []);

  /**
   * 加载可用网站列表
   */
  const loadAvailableWebsites = useCallback(async () => {
    try {
      initializeServices();
      const websites = await sitemapServiceRef.current!.getAllWebsites();
      const competitors = await competitorServiceRef.current!.getAllGames();

      const websiteOptions: WebsiteOption[] = websites.map(website => {
        const websiteGames = competitors.filter(game => 
          game.source === website.name || game.originalUrl?.includes(website.domain)
        );

        // 确定优先级
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (websiteGames.length > 1000) priority = 'high';
        else if (websiteGames.length < 100) priority = 'low';

        // 确定状态
        let status: 'active' | 'inactive' | 'error' = 'active';
        if (websiteGames.length === 0) status = 'inactive';

        return {
          id: website.domain,
          name: website.name,
          domain: website.domain,
          lastUpdated: website.lastCrawled ? new Date(website.lastCrawled) : null,
          gameCount: websiteGames.length,
          status,
          priority
        };
      });

      setAvailableWebsites(websiteOptions);
      
      // 默认选中高优先级的网站
      const highPriorityWebsites = websiteOptions
        .filter(w => w.priority === 'high' && w.status === 'active')
        .map(w => w.id);
      
      setUpdateOptions(prev => ({
        ...prev,
        websites: highPriorityWebsites
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : '加载网站列表失败');
    }
  }, [initializeServices]);

  /**
   * 执行单个网站更新
   */
  const updateSingleWebsite = useCallback(async (websiteId: string): Promise<UpdateResult> => {
    const website = availableWebsites.find(w => w.id === websiteId);
    if (!website) {
      throw new Error(`Website not found: ${websiteId}`);
    }

    const startTime = Date.now();
    let newGames = 0;
    let updatedGames = 0;
    const errors: string[] = [];

    try {
      addLog(`开始更新 ${website.name}...`);

      // 阶段1: 获取Sitemap
      setUpdateStatus(prev => ({ ...prev, currentPhase: 'sitemap', currentWebsite: website.name }));
      const sitemapUrls = await sitemapServiceRef.current!.getSitemapUrls(website.domain);
      addLog(`从 ${website.name} 获取到 ${sitemapUrls.length} 个游戏链接`);

      // 阶段2: 抓取内容
      setUpdateStatus(prev => ({ ...prev, currentPhase: 'scraping' }));
      const scrapingResults = [];
      
      for (let i = 0; i < sitemapUrls.length; i += updateOptions.maxConcurrency) {
        const batch = sitemapUrls.slice(i, i + updateOptions.maxConcurrency);
        const batchResults = await Promise.allSettled(
          batch.map(url => scrapingServiceRef.current!.scrapeUrl(url))
        );

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            scrapingResults.push(result.value);
          } else {
            errors.push(`抓取失败: ${result.reason}`);
          }
        }

        // 更新进度
        const completed = Math.min(i + updateOptions.maxConcurrency, sitemapUrls.length);
        addLog(`${website.name}: 已抓取 ${completed}/${sitemapUrls.length} 个页面`);
      }

      // 阶段3: 解析内容
      setUpdateStatus(prev => ({ ...prev, currentPhase: 'parsing' }));
      const parseResults = [];
      
      for (const scrapingResult of scrapingResults) {
        try {
          const parseResult = parsingServiceRef.current!.parseContent(scrapingResult);
          if (parseResult.success) {
            parseResults.push(parseResult);
          } else {
            errors.push(`解析失败: ${parseResult.error}`);
          }
        } catch (err) {
          errors.push(`解析异常: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }

      // 阶段4: 保存数据
      setUpdateStatus(prev => ({ ...prev, currentPhase: 'saving' }));
      const existingGames = await competitorServiceRef.current!.getAllGames();
      
      for (const parseResult of parseResults) {
        if (!parseResult.content) continue;

        const existingGame = existingGames.find(g => 
          g.title === parseResult.content!.title || 
          g.originalUrl === parseResult.content!.gameUrl
        );

        try {
          if (existingGame && !updateOptions.forceUpdate && updateOptions.skipExisting) {
            // 跳过已存在的游戏
            continue;
          }

          const gameData = {
            id: existingGame?.id || `${website.id}_${Date.now()}_${Math.random()}`,
            title: parseResult.content.title,
            description: parseResult.content.description || '',
            category: parseResult.content.category || 'unknown',
            tags: parseResult.content.tags || [],
            source: website.name,
            originalUrl: parseResult.content.gameUrl || '',
            qualityScore: parseResult.qualityScore,
            lastUpdated: new Date().toISOString(),
            metadata: {
              parser: parseResult.parser,
              parseTime: parseResult.parseTime,
              confidence: parseResult.confidence,
              features: parseResult.content.features || [],
              thumbnail: parseResult.content.thumbnail,
              rating: parseResult.content.rating,
              developer: parseResult.content.developer
            }
          };

          if (existingGame) {
            await competitorServiceRef.current!.updateGame(gameData);
            updatedGames++;
          } else {
            await competitorServiceRef.current!.addGame(gameData);
            newGames++;
          }
        } catch (err) {
          errors.push(`保存失败: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }

      const duration = Date.now() - startTime;
      const averageQuality = parseResults.length > 0
        ? parseResults.reduce((sum, r) => sum + r.qualityScore, 0) / parseResults.length
        : 0;

      addLog(`${website.name} 更新完成: 新增 ${newGames}, 更新 ${updatedGames}, 错误 ${errors.length}`);

      return {
        website: website.name,
        success: errors.length < parseResults.length / 2, // 错误率低于50%视为成功
        newGames,
        updatedGames,
        errors,
        duration,
        qualityScore: averageQuality
      };

    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      errors.push(errorMessage);
      addLog(`${website.name} 更新失败: ${errorMessage}`);

      return {
        website: website.name,
        success: false,
        newGames: 0,
        updatedGames: 0,
        errors,
        duration,
        qualityScore: 0
      };
    }
  }, [availableWebsites, updateOptions, addLog]);

  /**
   * 开始更新
   */
  const startUpdate = useCallback(async () => {
    if (updateOptions.websites.length === 0) {
      setError('请至少选择一个网站');
      return;
    }

    initializeServices();
    setError(null);
    setUpdateResults([]);
    setLogs([]);

    const startTime = new Date();
    setUpdateStatus({
      isRunning: true,
      startTime,
      endTime: null,
      totalTasks: updateOptions.websites.length,
      completedTasks: 0,
      failedTasks: 0,
      currentWebsite: '',
      currentPhase: 'sitemap',
      estimatedTimeRemaining: 0
    });

    addLog(`开始更新 ${updateOptions.websites.length} 个网站...`);
    addLog(`更新模式: ${updateOptions.updateType === 'full' ? '完全更新' : updateOptions.updateType === 'incremental' ? '增量更新' : '选择性更新'}`);
    addLog(`并发数: ${updateOptions.maxConcurrency}`);

    const results: UpdateResult[] = [];

    try {
      for (let i = 0; i < updateOptions.websites.length; i++) {
        const websiteId = updateOptions.websites[i];
        const result = await updateSingleWebsite(websiteId);
        results.push(result);

        setUpdateStatus(prev => ({
          ...prev,
          completedTasks: i + 1,
          failedTasks: prev.failedTasks + (result.success ? 0 : 1),
          estimatedTimeRemaining: ((Date.now() - startTime.getTime()) / (i + 1)) * (updateOptions.websites.length - i - 1)
        }));

        setUpdateResults([...results]);
      }

      const endTime = new Date();
      setUpdateStatus(prev => ({
        ...prev,
        isRunning: false,
        endTime,
        currentPhase: 'complete'
      }));

      const totalNew = results.reduce((sum, r) => sum + r.newGames, 0);
      const totalUpdated = results.reduce((sum, r) => sum + r.updatedGames, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

      addLog(`所有更新完成! 新增: ${totalNew}, 更新: ${totalUpdated}, 错误: ${totalErrors}`);
      addLog(`总耗时: ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(1)}秒`);

    } catch (err) {
      setUpdateStatus(prev => ({
        ...prev,
        isRunning: false,
        endTime: new Date()
      }));
      setError(err instanceof Error ? err.message : '更新过程中发生未知错误');
      addLog(`更新失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [updateOptions, initializeServices, addLog, updateSingleWebsite]);

  /**
   * 停止更新
   */
  const stopUpdate = useCallback(() => {
    setUpdateStatus(prev => ({
      ...prev,
      isRunning: false,
      endTime: new Date()
    }));
    addLog('用户取消更新');
  }, [addLog]);

  /**
   * 清空日志
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  /**
   * 格式化时间
   */
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  /**
   * 获取进度百分比
   */
  const getProgressPercentage = (): number => {
    if (updateStatus.totalTasks === 0) return 0;
    return (updateStatus.completedTasks / updateStatus.totalTasks) * 100;
  };

  // 组件挂载时加载网站列表
  React.useEffect(() => {
    loadAvailableWebsites();
  }, [loadAvailableWebsites]);

  return (
    <div className="space-y-6">
      {/* 更新选项配置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">更新配置</h2>
        
        {/* 网站选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择要更新的网站
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableWebsites.map(website => (
              <label key={website.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={updateOptions.websites.includes(website.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setUpdateOptions(prev => ({
                        ...prev,
                        websites: [...prev.websites, website.id]
                      }));
                    } else {
                      setUpdateOptions(prev => ({
                        ...prev,
                        websites: prev.websites.filter(id => id !== website.id)
                      }));
                    }
                  }}
                  disabled={updateStatus.isRunning}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {website.name}
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                    website.priority === 'high' ? 'bg-red-100 text-red-800' :
                    website.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {website.gameCount} 游戏
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 更新选项 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              更新模式
            </label>
            <select
              value={updateOptions.updateType}
              onChange={(e) => setUpdateOptions(prev => ({
                ...prev,
                updateType: e.target.value as any
              }))}
              disabled={updateStatus.isRunning}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="incremental">增量更新</option>
              <option value="full">完全更新</option>
              <option value="selective">选择性更新</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              并发数
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={updateOptions.maxConcurrency}
              onChange={(e) => setUpdateOptions(prev => ({
                ...prev,
                maxConcurrency: parseInt(e.target.value)
              }))}
              disabled={updateStatus.isRunning}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={updateOptions.forceUpdate}
                onChange={(e) => setUpdateOptions(prev => ({
                  ...prev,
                  forceUpdate: e.target.checked
                }))}
                disabled={updateStatus.isRunning}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">强制更新</span>
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={updateOptions.skipExisting}
                onChange={(e) => setUpdateOptions(prev => ({
                  ...prev,
                  skipExisting: e.target.checked
                }))}
                disabled={updateStatus.isRunning}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">跳过已存在</span>
            </label>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center space-x-4">
          {!updateStatus.isRunning ? (
            <button
              onClick={startUpdate}
              disabled={updateOptions.websites.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              开始更新
            </button>
          ) : (
            <button
              onClick={stopUpdate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              停止更新
            </button>
          )}

          <button
            onClick={loadAvailableWebsites}
            disabled={updateStatus.isRunning}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            刷新网站列表
          </button>
        </div>
      </div>

      {/* 更新进度 */}
      {updateStatus.isRunning && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">更新进度</h2>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>总体进度</span>
              <span>{updateStatus.completedTasks}/{updateStatus.totalTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">当前网站:</span>
              <p className="font-medium">{updateStatus.currentWebsite || '准备中...'}</p>
            </div>
            <div>
              <span className="text-gray-600">当前阶段:</span>
              <p className="font-medium">
                {updateStatus.currentPhase === 'sitemap' ? 'Sitemap解析' :
                 updateStatus.currentPhase === 'scraping' ? '内容抓取' :
                 updateStatus.currentPhase === 'parsing' ? '内容解析' :
                 updateStatus.currentPhase === 'saving' ? '数据保存' : '完成'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">已完成:</span>
              <p className="font-medium text-green-600">{updateStatus.completedTasks}</p>
            </div>
            <div>
              <span className="text-gray-600">失败:</span>
              <p className="font-medium text-red-600">{updateStatus.failedTasks}</p>
            </div>
          </div>

          {updateStatus.estimatedTimeRemaining > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              预计剩余时间: {formatDuration(updateStatus.estimatedTimeRemaining)}
            </div>
          )}
        </div>
      )}

      {/* 更新结果 */}
      {updateResults.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">更新结果</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    网站
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    新增游戏
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    更新游戏
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    质量评分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    耗时
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    错误
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {updateResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.website}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.success ? '成功' : '失败'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.newGames}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.updatedGames}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.qualityScore.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(result.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.errors.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 实时日志 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">实时日志</h2>
          <button
            onClick={clearLogs}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            清空日志
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm text-green-400">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-500">暂无日志...</div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">更新失败</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualUpdateControl; 