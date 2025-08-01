/**
 * 优化后的用户行为统计使用示例
 * 展示如何在Tauri应用中集成优化后的统计服务
 */

import React, { useEffect, useState } from 'react';
import { 
  OptimizedUserBehaviorService, 
  createOptimizedUserBehaviorService,
  DEFAULT_OPTIMIZED_CONFIG 
} from '../src/services/optimizedUserBehaviorService';

interface StatsData {
  overview?: any;
  countries?: any[];
  trends?: any[];
}

export const OptimizedUserBehaviorExample: React.FC = () => {
  const [service, setService] = useState<OptimizedUserBehaviorService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<StatsData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化服务
  useEffect(() => {
    const initializeService = async () => {
      try {
        setLoading(true);
        setError(null);

        // 创建服务实例
        const userBehaviorService = createOptimizedUserBehaviorService({
          ...DEFAULT_OPTIMIZED_CONFIG,
          apiBaseUrl: 'http://localhost:3000', // 开发环境
        });

        // 初始化服务
        await userBehaviorService.initialize();
        
        // 记录应用启动
        await userBehaviorService.recordAppLaunch();

        setService(userBehaviorService);
        setIsInitialized(true);

        console.log('✅ 优化用户行为服务初始化成功');
        console.log('设备指纹:', userBehaviorService.getDeviceFingerprint());

      } catch (err) {
        console.error('❌ 服务初始化失败:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeService();
  }, []);

  // 加载统计数据
  const loadStats = async () => {
    if (!service || !isInitialized) {
      setError('服务未初始化');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [overview, countries, trends] = await Promise.all([
        service.getStatsOverview().catch(err => {
          console.warn('获取概览失败:', err);
          return null;
        }),
        service.getCountryStats(5).catch(err => {
          console.warn('获取国家统计失败:', err);
          return [];
        }),
        service.getActivityTrends(7).catch(err => {
          console.warn('获取活动趋势失败:', err);
          return [];
        }),
      ]);

      setStats({ overview, countries, trends });

    } catch (err) {
      console.error('加载统计数据失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 手动记录启动
  const recordLaunch = async () => {
    if (!service) return;

    try {
      setLoading(true);
      await service.recordAppLaunch();
      console.log('✅ 手动记录应用启动成功');
      
      // 重新加载统计数据
      await loadStats();
    } catch (err) {
      console.error('❌ 记录启动失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 优化用户行为统计示例</h1>
      
      {/* 服务状态 */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        backgroundColor: isInitialized ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isInitialized ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '5px'
      }}>
        <h3>📊 服务状态</h3>
        <p><strong>初始化状态:</strong> {isInitialized ? '✅ 已初始化' : '❌ 未初始化'}</p>
        <p><strong>设备指纹:</strong> {service?.getDeviceFingerprint() || '未获取'}</p>
        <p><strong>服务就绪:</strong> {service?.isServiceReady() ? '✅ 就绪' : '❌ 未就绪'}</p>
      </div>

      {/* 错误信息 */}
      {error && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          color: '#721c24'
        }}>
          <h4>❌ 错误信息</h4>
          <p>{error}</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={loadStats}
          disabled={!isInitialized || loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '加载中...' : '📈 加载统计数据'}
        </button>

        <button 
          onClick={recordLaunch}
          disabled={!isInitialized || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '记录中...' : '🚀 手动记录启动'}
        </button>
      </div>

      {/* 统计概览 */}
      {stats.overview && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px'
        }}>
          <h3>📊 统计概览</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <strong>总设备数:</strong> {stats.overview.totalDevices?.toLocaleString() || 0}
            </div>
            <div>
              <strong>总运行次数:</strong> {stats.overview.totalRuns?.toLocaleString() || 0}
            </div>
            <div>
              <strong>平均运行次数:</strong> {stats.overview.averageRunsPerDevice?.toFixed(1) || 0}
            </div>
            <div>
              <strong>国家数量:</strong> {stats.overview.countriesCount || 0}
            </div>
            <div>
              <strong>最新安装排名:</strong> #{stats.overview.latestInstallRank || 0}
            </div>
            <div>
              <strong>7天活跃设备:</strong> {stats.overview.activeLast7Days || 0}
            </div>
            <div>
              <strong>30天活跃设备:</strong> {stats.overview.activeLast30Days || 0}
            </div>
          </div>
        </div>
      )}

      {/* 热门国家 */}
      {stats.countries && stats.countries.length > 0 && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px'
        }}>
          <h3>🌍 热门国家 (前5名)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>国家</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>设备数</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>总运行次数</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>平均运行次数</th>
                </tr>
              </thead>
              <tbody>
                {stats.countries.map((country, index) => (
                  <tr key={index}>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      {country.countryName} ({country.countryCode})
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                      {country.deviceCount?.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                      {country.totalRuns?.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                      {country.averageRuns?.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 活动趋势 */}
      {stats.trends && stats.trends.length > 0 && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px'
        }}>
          <h3>📈 最近7天活动趋势</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>日期</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>活跃设备</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>新设备</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>总运行次数</th>
                </tr>
              </thead>
              <tbody>
                {stats.trends.map((trend, index) => (
                  <tr key={index}>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      {trend.date}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                      {trend.activeDevices?.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                      {trend.newDevices?.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                      {trend.totalRuns?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#d1ecf1',
        border: '1px solid #bee5eb',
        borderRadius: '5px'
      }}>
        <h3>💡 使用说明</h3>
        <ul>
          <li>✅ <strong>自动记录:</strong> 应用启动时自动记录设备统计</li>
          <li>📊 <strong>实时统计:</strong> 点击"加载统计数据"查看最新数据</li>
          <li>🚀 <strong>手动记录:</strong> 点击"手动记录启动"增加运行次数</li>
          <li>💾 <strong>存储优化:</strong> 使用精简数据结构，节省存储空间</li>
          <li>🔒 <strong>安全传输:</strong> 支持API密钥认证和数据验证</li>
        </ul>
      </div>
    </div>
  );
};

export default OptimizedUserBehaviorExample;
