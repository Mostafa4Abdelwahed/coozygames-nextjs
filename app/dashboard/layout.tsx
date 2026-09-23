import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/shell'

export const metadata: Metadata = {
  title: 'لوحة التحكم | Coozy Games',
  robots: { index: false, follow: false },
}

export default async function DashboardLayout(props: LayoutProps<'/dashboard'>) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect('/login/')
  }
  if (session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <DashboardShell user={{ name: session.user.name, role: session.user.role }}>
      {props.children}
    </DashboardShell>
  )
}