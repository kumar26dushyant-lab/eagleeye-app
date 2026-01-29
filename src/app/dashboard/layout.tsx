'use client'

import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
