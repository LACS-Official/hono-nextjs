'use client';

import { useState, useEffect } from 'react';
import { GroupChat } from '@/lib/info-management-schema';
import Image from 'next/image';

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/info-management/group-chats');
      const data = await response.json();
      
      if (data.success) {
        setGroups(data.data);
      } else {
        setError(data.error || '获取群聊列表失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = (joinLink: string, analyticsEvent: string) => {
    // 这里可以添加分析事件追踪
    console.log('Analytics Event:', analyticsEvent);
    window.open(joinLink, '_blank');
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
            onClick={fetchGroups}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">群聊列表</h2>
        <p className="text-gray-600">加入我们的交流群，与其他用户一起讨论技术问题</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={group.qrcode}
                    alt={`${group.name} 二维码`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {group.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {group.limit}
                </p>
                <p className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded mb-3">
                  {group.groupNumber}
                </p>
                <button
                  onClick={() => handleJoinClick(group.joinLink, group.analyticsEvent)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  加入群聊
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
