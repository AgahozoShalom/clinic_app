import React from 'react'
import { cn } from '@/utils'

const config = {
  open:              { label: 'Open',             bg: 'bg-accent-light',   text: 'text-warning',  dot: 'bg-accent'   },
  closed:            { label: 'Closed',           bg: 'bg-success-bg',     text: 'text-success',  dot: 'bg-success'  },
  pending_transfer:  { label: 'Pending transfer', bg: 'bg-danger-bg',      text: 'text-danger',   dot: 'bg-danger'   },
  requested:         { label: 'Requested',        bg: 'bg-[#F0F3F1]',      text: 'text-text-muted', dot: 'bg-text-muted' },
  in_progress:       { label: 'In progress',      bg: 'bg-brand-light',    text: 'text-brand',    dot: 'bg-brand'    },
  completed:         { label: 'Completed',        bg: 'bg-success-bg',     text: 'text-success',  dot: 'bg-success'  },
  initiated:         { label: 'Initiated',        bg: 'bg-danger-bg',      text: 'text-danger',   dot: 'bg-danger'   },
  confirmed:         { label: 'Confirmed',        bg: 'bg-success-bg',     text: 'text-success',  dot: 'bg-success'  },
  cancelled:         { label: 'Cancelled',        bg: 'bg-[#F0F3F1]',      text: 'text-text-muted', dot: 'bg-text-muted' },
}

export function StatusPill({ status, className }) {
  const normalizedStatus = status?.toLowerCase()
  const style = config[normalizedStatus] || config.open

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium w-fit",
      style.bg,
      style.text,
      className
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  )
}
