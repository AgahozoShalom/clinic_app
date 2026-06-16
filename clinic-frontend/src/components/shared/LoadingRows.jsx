import React from 'react'

export function LoadingRows({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex border-b border-border py-4 px-4 items-center gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div 
              key={j} 
              className="h-4 bg-gray-200 animate-pulse rounded" 
              style={{ width: `${Math.max(20, Math.random() * 80)}%`, flex: 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
