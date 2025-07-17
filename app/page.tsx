import { useEffect, useState } from 'react'
import Hello from './Hello'
import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <Hello />
      <div className="text-center mt-8">
        <Link
          href="/oauth-test"
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-950"
        >
          测试 GitHub OAuth 登录
        </Link>
      </div>
    </div>
  )
}
