'use client';

import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

export default function ConfigInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ConfigProvider.config({
      holderRender: (children) => (
        <ConfigProvider locale={zhCN}>
          {children}
        </ConfigProvider>
      ),
    });
  }, []);
  return <>{children}</>;
}
