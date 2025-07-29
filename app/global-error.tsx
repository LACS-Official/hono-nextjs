'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">服务器错误</h2>
              <p className="text-gray-600 mb-4">
                抱歉，服务器遇到了一个错误。
              </p>
              {error.digest && (
                <p className="text-sm text-gray-500 mb-4">
                  错误ID: {error.digest}
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              <button
                onClick={reset}
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                重试
              </button>
              
              <div className="text-sm text-gray-500">
                <a href="/" className="hover:text-blue-600">
                  返回首页
                </a>
                {' | '}
                <a href="/admin" className="hover:text-blue-600">
                  管理后台
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
