/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // 匹配所有 API 路由
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://admin.lacs.cc",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS", // 移除了危险的 PUT, DELETE
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-API-Key", // 添加了 API Key 支持
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "false", // 禁用凭据传输
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400", // 预检请求缓存24小时
          },
          // 添加安全头部
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
        ],
      },
    ]
  },
}

module.exports = nextConfig
