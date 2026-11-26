import { useEffect } from 'react'
import { APP_NAME } from '../lib/legal'
import { PUBLIC_PAGES, publicPageFor } from '../lib/publicPages'
import { LegalBody } from './Legal'

export default function PublicPage({ hash }: { hash: string }) {
  const page = publicPageFor(hash)
  useEffect(() => {
    document.title = page ? `${page.label} · ${APP_NAME}` : APP_NAME
    window.scrollTo(0, 0)
    return () => { document.title = APP_NAME }
  }, [page])
  if (!page) return null
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-6">
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm" aria-label="Pages">
        <a href="#/" className="font-kids text-lg font-bold text-indigo-700">⭐ {APP_NAME}</a>
        <span className="flex gap-3">
          {Object.entries(PUBLIC_PAGES).map(([h, p]) => (
            <a key={h} href={h} aria-current={p === page ? 'page' : undefined} className={p === page ? 'font-bold text-slate-900' : 'text-indigo-700 underline'}>{p.label}</a>
          ))}
        </span>
      </nav>
      <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        <h1 className="font-kids text-2xl font-bold">{page.doc.title}</h1>
        <LegalBody doc={page.doc} />
      </article>
      <p className="mt-4 text-center text-[11px] text-slate-400">Version {__APP_VERSION__}</p>
    </div>
  )
}
