import type { ReactNode } from 'react'

/** The title row at the top of a full screen: title (and optional line under it) on the left, actions on the right. */
export function PageHeader({ title, subtitle, actions, className = '' }: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${className}`.trim()}>
      <div className="min-w-0">
        <h1 className="font-kids text-2xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
