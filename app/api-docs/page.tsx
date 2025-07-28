import Link from 'next/link'

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
            >
              ← 返回首页
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API 文档</h1>
            <p className="text-gray-600">
              Neon API Server 接口文档和使用说明
            </p>
          </div>

          <div className="space-y-8">
            {/* 基础信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">基础信息</h2>
              <div className="space-y-2">
                <p><strong>Base URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3001/api</code></p>
                <p><strong>Content-Type:</strong> <code className="bg-gray-100 px-2 py-1 rounded">application/json</code></p>
              </div>
            </div>

            {/* 健康检查 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">健康检查</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900">GET /api/health</h3>
                  <p className="text-gray-600">检查服务器和数据库连接状态</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">响应示例：</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* 激活码管理 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">激活码管理</h2>
              
              {/* 生成激活码 */}
              <div className="space-y-4 mb-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">POST /api/activation-codes</h3>
                  <p className="text-gray-600">生成新的激活码</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">请求体：</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`{
  "expiresInHours": 24,
  "metadata": {
    "product": "premium",
    "version": "1.0"
  }
}`}
                  </pre>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">响应示例：</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`{
  "success": true,
  "code": "ABC123DEF456",
  "expiresAt": "2024-01-02T00:00:00.000Z"
}`}
                  </pre>
                </div>
              </div>

              {/* 验证激活码 */}
              <div className="space-y-4 mb-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900">POST /api/activation-codes/verify</h3>
                  <p className="text-gray-600">验证激活码</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">请求体：</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`{
  "code": "ABC123DEF456"
}`}
                  </pre>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">响应示例：</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`{
  "valid": true,
  "code": "ABC123DEF456",
  "metadata": {
    "product": "premium",
    "version": "1.0"
  },
  "expiresAt": "2024-01-02T00:00:00.000Z"
}`}
                  </pre>
                </div>
              </div>

              {/* 获取激活码列表 */}
              <div className="space-y-4">
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-medium text-gray-900">GET /api/activation-codes</h3>
                  <p className="text-gray-600">获取激活码列表（分页）</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">查询参数：</h4>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li><code>page</code> - 页码（默认：1）</li>
                    <li><code>limit</code> - 每页数量（默认：10，最大：100）</li>
                    <li><code>status</code> - 状态筛选（active/used/expired）</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* GitHub OAuth */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">GitHub OAuth</h2>
              
              <div className="space-y-4 mb-6">
                <div className="border-l-4 border-gray-800 pl-4">
                  <h3 className="font-medium text-gray-900">GET /api/auth/github</h3>
                  <p className="text-gray-600">重定向到 GitHub OAuth 授权页面</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-gray-800 pl-4">
                  <h3 className="font-medium text-gray-900">GET /api/auth/github/callback</h3>
                  <p className="text-gray-600">GitHub OAuth 回调处理</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">响应示例：</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`{
  "success": true,
  "user": {
    "id": 12345,
    "login": "username",
    "name": "User Name",
    "email": "user@example.com",
    "avatar_url": "https://avatars.githubusercontent.com/..."
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* 错误响应 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">错误响应</h2>
              <div className="space-y-4">
                <p className="text-gray-600">所有错误响应都遵循统一格式：</p>
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`{
  "error": "错误描述",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}`}
                  </pre>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">常见错误码：</h4>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li><code>400</code> - 请求参数错误</li>
                    <li><code>404</code> - 资源不存在</li>
                    <li><code>500</code> - 服务器内部错误</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 测试链接 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">快速测试</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/activation-test"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-center"
                >
                  测试激活码功能
                </Link>
                <Link
                  href="/oauth-test"
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded text-center"
                >
                  测试 GitHub OAuth
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
