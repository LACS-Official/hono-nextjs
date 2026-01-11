import '../styles/globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata = {
  title: 'LACS API Server',
  description: 'API server with Neon Postgres, activation codes and software management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* 抑制 Ant Design 的 -ms-high-contrast 弃用警告 */
            @media (forced-colors: active) {
              * {
                forced-color-adjust: auto;
              }
            }
          `
        }} />
      </head>
      <body>
        <ThemeProvider>
          <AntdRegistry>
            <ConfigProvider locale={zhCN}>
              <AuthProvider>
                {children}
              </AuthProvider>
            </ConfigProvider>
          </AntdRegistry>
        </ThemeProvider>
      </body>
    </html>
  )
}
