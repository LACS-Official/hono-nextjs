'use client'

import { useState } from 'react'

export default function TestDeviceConnections() {
  const [deviceSerial, setDeviceSerial] = useState('')
  const [softwareId, setSoftwareId] = useState('1')
  const [userDeviceFingerprint, setUserDeviceFingerprint] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/user-behavior/device-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceSerial,
          softwareId: parseInt(softwareId),
          userDeviceFingerprint: userDeviceFingerprint || undefined,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: '请求失败' })
    } finally {
      setLoading(false)
    }
  }

  const generateRandomSerial = () => {
    const randomSerial = `DEVICE_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    setDeviceSerial(randomSerial)
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">设备连接测试页面</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">功能说明</h2>
        <ul className="text-blue-700 space-y-1">
          <li>• 如果设备序列号不存在，将创建新记录，linked = 1</li>
          <li>• 如果设备序列号已存在，将更新 linked 字段自增</li>
          <li>• 设备序列号作为主要标识符</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label htmlFor="deviceSerial" className="block text-sm font-medium text-gray-700 mb-1">
            设备序列号 *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="deviceSerial"
              value={deviceSerial}
              onChange={(e) => setDeviceSerial(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入设备序列号"
              required
            />
            <button
              type="button"
              onClick={generateRandomSerial}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              随机生成
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="softwareId" className="block text-sm font-medium text-gray-700 mb-1">
            软件 ID *
          </label>
          <input
            type="number"
            id="softwareId"
            value={softwareId}
            onChange={(e) => setSoftwareId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="userDeviceFingerprint" className="block text-sm font-medium text-gray-700 mb-1">
            用户设备指纹 (可选)
          </label>
          <input
            type="text"
            id="userDeviceFingerprint"
            value={userDeviceFingerprint}
            onChange={(e) => setUserDeviceFingerprint(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入用户设备指纹"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '提交中...' : '提交设备连接'}
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✅ 成功' : '❌ 失败'}
          </h3>
          
          {result.success ? (
            <div className="space-y-2 text-green-700">
              <p><strong>消息:</strong> {result.message}</p>
              <p><strong>设备 ID:</strong> {result.data.id}</p>
              <p><strong>设备序列号:</strong> {result.data.deviceSerial}</p>
              <p><strong>软件 ID:</strong> {result.data.softwareId}</p>
              <p><strong>连接次数:</strong> <span className="text-xl font-bold">{result.data.linked}</span></p>
              <p><strong>是否新设备:</strong> {result.data.isNewDevice ? '是' : '否'}</p>
            </div>
          ) : (
            <p className="text-red-700">{result.error}</p>
          )}
          
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">查看完整响应</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
