/**
 * TopNav — System status bar spanning the full width of the application.
 * Communicates product identity, system health, and active scenario state.
 */

const SYSTEM_STATUS = {
  label: 'OPERATIONAL',
  variant: 'operational',
}

export default function TopNav({ activeScenario }) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()

  return (
    <header
      className="flex items-center justify-between px-4 h-11 border-b border-hairline shrink-0 bg-canvas"
      role="banner"
    >
      {/* ── Left: product identity ── */}
      <div className="flex items-center gap-4">
        {/* Logo mark */}
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <polygon
              points="10,2 18,7 18,13 10,18 2,13 2,7"
              stroke="#3B82F6"
              strokeWidth="1.5"
              fill="none"
            />
            <polygon
              points="10,6 14,8.5 14,11.5 10,14 6,11.5 6,8.5"
              fill="#3B82F6"
              opacity="0.4"
            />
          </svg>
          <span className="text-xs font-semibold text-ink tracking-wide">
            URBAN RESILIENCE TWIN
          </span>
        </div>

        <span className="w-px h-4 bg-hairline" aria-hidden="true" />

        {/* System status badge */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-risk-green animate-pulse-slow" aria-hidden="true" />
          <span className="badge-operational">{SYSTEM_STATUS.label}</span>
        </div>
      </div>

      {/* ── Centre: active scenario ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        {activeScenario ? (
          <>
            <span className="panel-label">ACTIVE SCENARIO</span>
            <span className="text-xs font-semibold text-accent font-mono uppercase tracking-wide">
              {activeScenario.name}
            </span>
            <span className={`badge-${activeScenario.severity === 'HIGH' ? 'critical' : 'elevated'}`}>
              {activeScenario.severity}
            </span>
          </>
        ) : (
          <span className="panel-label">NO ACTIVE SCENARIO — IDLE</span>
        )}
      </div>

      {/* ── Right: system metadata ── */}
      <div className="flex items-center gap-4 text-ink-faint font-mono text-2xs">
        <span>{dateStr}</span>
        <span className="w-px h-3 bg-hairline" aria-hidden="true" />
        <span aria-label="Current time">{timeStr} IST</span>
        <span className="w-px h-3 bg-hairline" aria-hidden="true" />
        <span>SIH 2026</span>
      </div>
    </header>
  )
}
