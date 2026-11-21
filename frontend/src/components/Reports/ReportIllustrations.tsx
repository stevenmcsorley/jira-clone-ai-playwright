/**
 * The picture on each card of the reports landing page: a small drawing of what that report shows, in the
 * Workbench palette (signal for the thing that matters, warm greys for the rest) so it reads in both themes.
 * They are drawings, not data, and say so to assistive tech by being hidden from it.
 */

export type ReportKind = 'burnup' | 'burndown' | 'velocity' | 'cumulative-flow' | 'cycle-time'

const W = 240
const H = 96
const base = 80   // the chart's floor

/** A faint floor and two guide lines, the same under every drawing so the five read as a set. */
const Frame = () => (
  <g className="stroke-gray-300" strokeWidth="1">
    <line x1="16" y1={base} x2="224" y2={base} />
    <line x1="16" y1="48" x2="224" y2="48" strokeDasharray="2 4" />
    <line x1="16" y1="16" x2="224" y2="16" strokeDasharray="2 4" />
  </g>
)

const Burnup = () => (
  <>
    <Frame />
    {/* total scope: flat, then it grows */}
    <polyline points="16,26 128,26 128,18 224,18" fill="none" className="stroke-gray-400" strokeWidth="2" strokeLinejoin="round" strokeDasharray="5 4" />
    {/* work completed: climbs toward it */}
    <polyline points="16,80 52,74 84,62 116,58 150,42 186,34 224,22" fill="none" className="stroke-blue-500" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    <circle cx="224" cy="22" r="3.5" className="fill-blue-500" />
  </>
)

const Burndown = () => (
  <>
    <Frame />
    {/* the ideal: a straight line down */}
    <line x1="16" y1="18" x2="224" y2="80" className="stroke-gray-400" strokeWidth="2" strokeDasharray="5 4" />
    {/* the actual: steps down as work finishes */}
    <polyline points="16,18 54,18 54,30 96,30 96,44 140,44 140,58 184,58 184,64 224,64" fill="none" className="stroke-blue-500" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="224" cy="64" r="3.5" className="fill-blue-500" />
  </>
)

const Velocity = () => {
  // planned (quiet) and completed (signal) for six sprints
  const sprints: Array<[number, number]> = [[34, 22], [40, 30], [46, 38], [36, 36], [50, 40], [44, 42]]
  return (
    <>
      <Frame />
      {sprints.map(([planned, done], i) => {
        const x = 24 + i * 33
        return (
          <g key={i}>
            <rect x={x} y={base - planned} width="12" height={planned} rx="2" className="fill-gray-400" opacity="0.55" />
            <rect x={x + 14} y={base - done} width="12" height={done} rx="2" className="fill-blue-500" />
          </g>
        )
      })}
    </>
  )
}

const CumulativeFlow = () => (
  <>
    <Frame />
    {/* done (bottom), in review, in progress, to do (top): bands that widen where work piles up */}
    <path d="M16,80 L16,70 C70,66 130,56 224,40 L224,80 Z" className="fill-blue-500" opacity="0.85" />
    <path d="M16,70 C70,66 130,56 224,40 L224,34 C140,48 70,58 16,62 Z" className="fill-gray-500" opacity="0.6" />
    <path d="M16,62 C70,58 140,48 224,34 L224,24 C140,38 70,52 16,52 Z" className="fill-gray-400" opacity="0.55" />
    <path d="M16,52 C70,52 140,38 224,24 L224,14 C140,26 70,40 16,38 Z" className="fill-gray-300" opacity="0.7" />
  </>
)

const CycleTime = () => {
  // how long issues took: most are quick, a few take much longer
  const bins = [16, 36, 50, 40, 26, 16, 10, 6, 4, 3]
  return (
    <>
      <Frame />
      {bins.map((h, i) => (
        <rect key={i} x={20 + i * 20} y={base - h} width="16" height={h} rx="2" className="fill-gray-400" opacity="0.6" />
      ))}
      {/* the median, and the 85th percentile */}
      <line x1="76" y1="12" x2="76" y2={base} className="stroke-blue-500" strokeWidth="2.5" />
      <line x1="140" y1="12" x2="140" y2={base} className="stroke-gray-500" strokeWidth="1.5" strokeDasharray="4 3" />
    </>
  )
}

const DRAWINGS: Record<ReportKind, () => React.JSX.Element> = {
  burnup: Burnup,
  burndown: Burndown,
  velocity: Velocity,
  'cumulative-flow': CumulativeFlow,
  'cycle-time': CycleTime,
}

export const ReportIllustration = ({ kind }: { kind: ReportKind }) => {
  const Drawing = DRAWINGS[kind]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-28 w-full rounded-md bg-gray-100" role="img" aria-hidden="true" data-testid={`report-illustration-${kind}`}>
      <Drawing />
    </svg>
  )
}
