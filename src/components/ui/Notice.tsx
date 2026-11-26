import type { ReactNode } from 'react'

export type NoticeTone = 'error' | 'info' | 'warn' | 'success'

/**
 * A message box. Errors and warnings are announced right away to screen readers (role="alert");
 * info and success politely (role="status").
 */
export function Notice({ tone = 'info', className = '', children }: { tone?: NoticeTone; className?: string; children: ReactNode }) {
  const urgent = tone === 'error' || tone === 'warn'
  return (
    <p role={urgent ? 'alert' : 'status'} className={`notice-${tone} ${className}`.trim()}>
      {children}
    </p>
  )
}
