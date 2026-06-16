import React from 'react'
import { cn } from '@/utils'

export function StatCard({ label, value, sub, color }) {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-success',
    amber: 'text-warning',
    red: 'text-danger',
    purple: 'text-purple-600'
  }

  return (
    <div className="bg-bg border border-border rounded-xl p-4 flex flex-col justify-between h-full">
      <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">
        {label}
      </div>
      <div className={cn("text-2xl font-bold mb-1", colorMap[color] || 'text-text-primary')}>
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-text-muted">
          {sub}
        </div>
      )}
    </div>
  )
}
