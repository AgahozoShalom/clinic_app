import React from 'react'

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  )
}
