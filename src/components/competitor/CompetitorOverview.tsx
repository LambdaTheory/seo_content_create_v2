/**
 * 竞品数据概览组件
 * 功能特性：
 * - 数据库状态显示
 * - 网站覆盖统计
 * - 更新时间展示
 * - 数据质量指标
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CompetitorDatabaseService, SitemapService } from '../../services';

interface DatabaseStats {
  totalGames: number;
  totalWebsites: number;
  averageQualityScore: number;
  lastUpdated: Date | null;
  categoriesCount: number;
  sourcesDistribution: Record<string, number>;
  qualityDistribution: {
    excellent: number; // 90-100
    good: number;      // 70-89
    fair: number;      // 50-69
    poor: number;      // 0-49
  };
}

interface WebsiteStatus {
  name: string;
  domain: string;
  gameCount: number;
  lastCrawled: Date | null;
  status: 'active' | 'inactive' | 'error';
  averageQuality: number;
  crawlSuccess: boolean;
}

export const CompetitorOverview: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [websites, setWebsites] = useState<WebsiteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const competitorService = new CompetitorDatabaseService();
  const sitemapService = new SitemapService();

  /**
   * 加载数据库统计信息
   */
  const loadDatabaseStats = useCallback(async (): Promise<DatabaseStats> => {
    const games = await competitorService.getAllGames();
    
    // 基础统计
    const totalGames = games.length;
    const sources = [...new Set(games.map(g => g.source).filter(Boolean))];
    const categories = [...new Set(games.map(g => g.category).filter(Boolean))];
    
    // 质量评分统计
    const qualityScores = games.map(g => g.qualityScore || 0);
    const averageQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;

    // 质量分布
    const qualityDistribution = {
      excellent: qualityScores.filter(s => s >= 90).length,
      good: qualityScores.filter(s => s >= 70 && s < 90).length,
      fair: qualityScores.filter(s => s >= 50 && s < 70).length,
      poor: qualityScores.filter(s => s < 50).length,
    };

    // 来源分布
    const sourcesDistribution: Record<string, number> = {};
    games.forEach(game => {
      if (game.source) {
        sourcesDistribution[game.source] = (sourcesDistribution[game.source] || 0) + 1;
      }
    });

    // 最后更新时间
    const lastUpdated = games.length > 0 
      ? new Date(Math.max(...games.map(g => new Date(g.lastUpdated).getTime())))
      : null;

    return {
      totalGames,
      totalWebsites: sources.length,
      averageQualityScore,
      lastUpdated,
      categoriesCount: categories.length,
      sourcesDistribution,
      qualityDistribution,
    };
  }, [competitorService]);

  /**
   * 加载网站状态信息
   */
  const loadWebsiteStatus = useCallback(async (): Promise<WebsiteStatus[]> => {
    const sitemapWebsites = await sitemapService.getAllWebsites();
    const games = await competitorService.getAllGames();

    return sitemapWebsites.map(website => {
      const websiteGames = games.filter(game => 
        game.source === website.name || 
        game.originalUrl?.includes(website.domain)
      );

      const averageQuality = websiteGames.length > 0
        ? websiteGames.reduce((sum, game) => sum + (game.qualityScore || 0), 0) / websiteGames.length
        : 0;

      let status: 'active' | 'inactive' | 'error' = 'active';
      if (websiteGames.length === 0) {
        status = 'inactive';
      } else if (averageQuality < 30) {
        status = 'error';
      }

      return {
        name: website.name,
        domain: website.domain,
        gameCount: websiteGames.length,
        lastCrawled: website.lastCrawled ? new Date(website.lastCrawled) : null,
        status,
        averageQuality,
        crawlSuccess: website.lastCrawled !== null,
      };
    });
  }, [sitemapService, competitorService]);

  /**
   * 加载所有数据
   */
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [databaseStats, websiteStatus] = await Promise.all([
        loadDatabaseStats(),
        loadWebsiteStatus(),
      ]);
      
      setStats(databaseStats);
      setWebsites(websiteStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadDatabaseStats, loadWebsiteStatus]);

  /**
   * 刷新数据
   */
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  /**
   * 格式化数字
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  /**
   * 格式化日期
   */
  const formatDate = (date: Date | null): string => {
    if (!date) return '从未';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    return date.toLocaleDateString();
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">加载失败</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={refreshData}
              className="mt-2 text-sm text-red-600 hover:text-red-500"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* 头部信息和刷新按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">竞品数据概览</h1>
          <p className="mt-1 text-sm text-gray-500">
            最后更新: {formatDate(stats.lastUpdated)}
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {refreshing ? (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新中...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新数据
            </>
          )}
        </button>
      </div>

      {/* 核心统计指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">总游戏数</dt>
                <dd className="text-lg font-medium text-gray-900">{formatNumber(stats.totalGames)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">覆盖网站</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalWebsites}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">平均质量</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.averageQualityScore.toFixed(1)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">游戏分类</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.categoriesCount}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* 质量分布图表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">质量分布</h2>
        <div className="space-y-4">
          {[
            { label: '优秀 (90-100)', value: stats.qualityDistribution.excellent, color: 'bg-green-500' },
            { label: '良好 (70-89)', value: stats.qualityDistribution.good, color: 'bg-blue-500' },
            { label: '一般 (50-69)', value: stats.qualityDistribution.fair, color: 'bg-yellow-500' },
            { label: '较差 (0-49)', value: stats.qualityDistribution.poor, color: 'bg-red-500' },
          ].map((item) => {
            const percentage = stats.totalGames > 0 ? (item.value / stats.totalGames) * 100 : 0;
            return (
              <div key={item.label} className="flex items-center">
                <div className="w-24 text-sm text-gray-600">{item.label}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-sm text-gray-900 text-right">
                  {item.value} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 网站状态列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">网站状态</h2>
        </div>
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
                  游戏数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均质量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后抓取
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {websites.map((website, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{website.name}</div>
                      <div className="text-sm text-gray-500">{website.domain}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      website.status === 'active' ? 'bg-green-100 text-green-800' :
                      website.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {website.status === 'active' ? '正常' :
                       website.status === 'inactive' ? '未激活' : '错误'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(website.gameCount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {website.averageQuality.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(website.lastCrawled)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 来源分布 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">来源分布</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(stats.sourcesDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([source, count]) => (
            <div key={source} className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900 truncate">{source}</div>
              <div className="text-lg font-bold text-blue-600">{formatNumber(count)}</div>
              <div className="text-xs text-gray-500">
                {((count / stats.totalGames) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 