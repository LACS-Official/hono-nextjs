'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { id: 'contact', label: '联系方式', href: '/aboutus/contact' },
  { id: 'groups', label: '群聊列表', href: '/aboutus/groups' },
  { id: 'media', label: '媒体平台', href: '/aboutus/media' },
  { id: 'projects', label: '项目列表', href: '/aboutus/projects' },
];

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">关于我们</h1>
          <p className="text-gray-600">了解领创工作室的联系方式、群聊、媒体平台和项目信息</p>
        </div>

        {/* 标签页导航 */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
