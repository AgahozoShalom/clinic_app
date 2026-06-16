import React from 'react'
import { useAuth } from '@/hooks'
import { Menu } from 'lucide-react'

export function Topbar({ onMenuClick }) {
  const { user } = useAuth()
  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-text-muted hover:text-text-primary"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-medium text-white">
          {initials}
        </div>
      </div>
    </header>
  )
}
