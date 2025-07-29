/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // 隐藏 X-Powered-By 头部
  compress: true, // 启用 gzip 压缩

  // 实验性功能
  experimental: {
    optimizeCss: true, // CSS 优化
    scrollRestoration: true, // 滚动位置恢复
  },

  // 图片优化配置
  images: {
    domains: ['via.placeholder.com', 'avatars.githubusercontent.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  async headers() {
    return [
      {
        // 匹配所有 API 路由
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === 'production' ?
              (process.env.ALLOWED_ORIGINS || "https://admin.lacs.cc") : "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-API-Key, X-Request-ID",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "false",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
          {
            key: "Vary",
            value: "Origin",
          },
          // 安全头部
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
          // 性能头部
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
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
      {
        source: '/admin',
        destination: '/admin/activation-codes',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
