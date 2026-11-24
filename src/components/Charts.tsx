/** Small, dependency-free SVG charts (no third-party scripts, so the strict CSP still holds). */

const W = 320
const H = 140
const PAD = { l: 28, r: 8, t: 10, b: 22 }

function shortDay(day: string): string {
  const [, m, d] = day.split('-').map(Number)
  return `${m}/${d}`
}

function ticks(max: number): number[] {
  if (max <= 0) return [0]
  const step = Math.pow(10, Math.floor(Math.log10(max)))
  const nice = max / step > 5 ? step * 2 : max / step > 2 ? step : step / 2
  const out: number[] = []
  for (let v = 0; v <= max + 1e-9; v += nice) out.push(Math.round(v * 100) / 100)
  return out.slice(0, 6)
}

function XLabels({ days, x }: { days: string[]; x: (i: number) => number }) {
  if (days.length === 0) return null
  const idx = days.length <= 7 ? days.map((_, i) => i) : [0, Math.floor((days.length - 1) / 2), days.length - 1]
  return (
    <>
      {idx.map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor={x(i) < PAD.l + 12 ? 'start' : x(i) > W - PAD.r - 12 ? 'end' : 'middle'} className="fill-slate-400" fontSize="9">{shortDay(days[i])}</text>
      ))}
    </>
  )
}

function Grid({ max, y, unit = '' }: { max: number; y: (v: number) => number; unit?: string }) {
  return (
    <>
      {ticks(max).map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-slate-200" strokeWidth="1" />
          <text x={PAD.l - 4} y={y(v) + 3} textAnchor="end" className="fill-slate-400" fontSize="9">{v}{unit}</text>
        </g>
      ))}
    </>
  )
}

/** Bars per day; optional second, darker series drawn inside (e.g. said-without-help inside total). */
export function BarChart({ title, days, values, inner, unit, legend }: {
  title: string
  days: string[]
  values: number[]
  inner?: number[]
  unit?: string
  legend?: [string, string]
}) {
  const max = Math.max(1, ...values)
  const top = ticks(max).at(-1) ?? max
  const scaleMax = Math.max(top, max)
  const bw = (W - PAD.l - PAD.r) / Math.max(values.length, 1)
  const x = (i: number) => PAD.l + bw * i + bw / 2
  const y = (v: number) => H - PAD.b - (v / scaleMax) * (H - PAD.t - PAD.b)
  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-3">
      <figcaption className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
        <span>{title}</span>
        {legend && (
          <span className="flex gap-2 font-semibold text-slate-500">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-indigo-200" />{legend[0]}</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-indigo-600" />{legend[1]}</span>
          </span>
        )}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${title}: ${values.reduce((a, b) => a + b, 0)} total`}>
        <Grid max={scaleMax} y={y} />
        {values.map((v, i) => {
          const w = Math.max(1, bw * 0.7)
          return (
            <g key={i}>
              {v > 0 && <rect x={x(i) - w / 2} y={y(v)} width={w} height={H - PAD.b - y(v)} rx="1.5" className={inner ? 'fill-indigo-200' : 'fill-indigo-500'}><title>{`${days[i]}: ${v}${unit ?? ''}`}</title></rect>}
              {inner && inner[i] > 0 && <rect x={x(i) - w / 2} y={y(inner[i])} width={w} height={H - PAD.b - y(inner[i])} rx="1.5" className="fill-indigo-600"><title>{`${days[i]}: ${inner[i]}`}</title></rect>}
            </g>
          )
        })}
        <XLabels days={days} x={x} />
      </svg>
    </figure>
  )
}

/** One or two lines per day; nulls leave gaps. */
export function LineChart({ title, days, series, max, unit }: {
  title: string
  days: string[]
  series: { name: string; values: (number | null)[]; className: string; dot: string; fill: string }[]
  max?: number
  unit?: string
}) {
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null))
  const top = max ?? Math.max(1, ...all)
  const step = (W - PAD.l - PAD.r) / Math.max(days.length - 1, 1)
  const x = (i: number) => PAD.l + step * i
  const y = (v: number) => H - PAD.b - (v / top) * (H - PAD.t - PAD.b)
  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-3">
      <figcaption className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
        <span>{title}</span>
        {series.length > 1 && (
          <span className="flex gap-2 font-semibold text-slate-500">
            {series.map((s) => <span key={s.name}><span className={`mr-1 inline-block h-2 w-2 rounded-full ${s.dot}`} />{s.name}</span>)}
          </span>
        )}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
        <Grid max={top} y={y} unit={unit} />
        {series.map((s) => {
          // Break the line wherever there is no value.
          const parts: string[] = []
          let cur = ''
          s.values.forEach((v, i) => {
            if (v === null) { if (cur) parts.push(cur); cur = ''; return }
            cur += `${cur ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
          })
          if (cur) parts.push(cur)
          return (
            <g key={s.name}>
              {parts.map((d, i) => <path key={i} d={d} fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className={s.className} />)}
              {s.values.map((v, i) => (v !== null && (days.length <= 31 || i === s.values.length - 1) ? (
                <circle key={i} cx={x(i)} cy={y(v)} r="2.5" className={s.fill}><title>{`${days[i]}: ${v}${unit ?? ''}`}</title></circle>
              ) : null))}
            </g>
          )
        })}
        <XLabels days={days} x={x} />
      </svg>
    </figure>
  )
}

export function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-kids text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  )
}
