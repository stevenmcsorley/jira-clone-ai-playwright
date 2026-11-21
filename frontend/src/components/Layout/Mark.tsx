/** The mark: two ossicones, the knobbed horns of a giraffe. Stalks in ink, knobs in the signal colour. */
export const Mark = ({ className = 'size-6' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <g className="stroke-gray-900" strokeWidth="3" strokeLinecap="round" fill="none">
      <path d="M11 27V14" />
      <path d="M21 27V14" />
    </g>
    <circle cx="11" cy="9.5" r="3.6" className="fill-blue-600" />
    <circle cx="21" cy="9.5" r="3.6" className="fill-blue-600" />
  </svg>
)
