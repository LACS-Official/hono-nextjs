const packageVersion = require('./package.json').version

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 统一版本号来源，避免 health/stats 等端点硬编码旧版本
  env: {
    NEXT_PUBLIC_APP_VERSION: packageVersion,
  },
  reactStrictMode: true,
  poweredByHeader: false, // 隐藏 X-Powered-By 头部
  compress: true, // 启用 gzip 压缩

  // 实验性功能
  experimental: {
    optimizeCss: true, // CSS 优化
    scrollRestoration: true, // 滚动位置恢复
    cpus: 1, // 限制构建 worker 数，避免静态生成阶段多进程并发导致内存/句柄耗尽崩溃
  },

  // 图片优化配置
  images: {
    domains: ['via.placeholder.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  async headers() {
    return [
      {
        // 匹配所有页面
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // 静态资源缓存
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },

  // 重定向配置
  async redirects() {
    return [
      // 移除了 /admin 到 /admin/activation-codes 的重定向
      // 现在 /admin 将显示仪表板页面
    ]
  },

  // 路由重写
  async rewrites() {
    return [
      {
        source: '/更新日志',
        destination: '/changelog',
      },
      {
        source: '/%E6%9B%B4%E6%96%B0%E6%97%A5%E5%BF%97',
        destination: '/changelog',
      },
    ]
  },
}

module.exports = nextConfig
