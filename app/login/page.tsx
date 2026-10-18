import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import LoginForm from '@/components/login-form'
import { checkSecurityEntrance } from '@/lib/security-entrance'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { entrance?: string }
}) {
  const cookieStore = cookies()
  const entranceCookie = cookieStore.get('lacs_entrance_pass')?.value
  const entranceQuery = searchParams?.entrance

  const { enabled, allowed, code } = await checkSecurityEntrance(entranceQuery, entranceCookie)

  // 1Panel 核心安全准则：开启安全入口后，若未通过安全入口直接访问，一律返回 404 Not Found 隐藏后台
  if (enabled && !allowed) {
    notFound()
  }

  return (
    <div className="login-page">
      <LoginForm entranceCode={allowed && enabled ? code : undefined} />
    </div>
  )
}