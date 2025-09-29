'use client';

import { useState, useEffect } from 'react';
import { MediaPlatform } from '@/lib/info-management-schema';
import Image from 'next/image';

export default function MediaPage() {
  const [platforms, setPlatforms] = useState<MediaPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/info-management/media-platforms');
      const data = await response.json();
      
      if (data.success) {
        setPlatforms(data.data);
      } else {
        setError(data.error || '获取媒体平台失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformClick = (link: string, analyticsEvent: string) => {
    // 这里可以添加分析事件追踪
    console.log('Analytics Event:', analyticsEvent);
    window.open(link, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPlatforms}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">媒体平台</h2>
        <p className="text-gray-600">关注我们在各大媒体平台的账号，获取最新动态</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              {/* 平台Logo */}
              <div className="w-16 h-16 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={platform.logo}
                  alt={`${platform.name} Logo`}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 平台信息 */}
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {platform.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {platform.account}
              </p>
              <p className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded mb-4">
                {platform.accountId}
              </p>

              {/* 二维码 */}
              <div className="w-24 h-24 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={platform.qrcode}
                  alt={platform.qrcodeTitle}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-xs text-gray-500 mb-2">
                {platform.qrcodeDesc}
              </p>

              {/* 访问按钮 */}
              <button
                onClick={() => handlePlatformClick(platform.link, platform.analyticsEvent)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm w-full"
              >
                访问{platform.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
