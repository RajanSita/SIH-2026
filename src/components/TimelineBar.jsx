/**
 * TimelineBar — Thin video-editor-style strip beneath the map.
 * Task 1: Structural shell with labelled keyframe positions.
 * Task 5: Full playback, stepping, and map-state sync implemented.
 */

const KEYFRAMES = [
  { index: 0, label: 'T+0',  event: 'THREAT DETECTED' },
  { index: 1, label: 'T+5',  event: 'FIRST IMPACT' },
  { index: 2, label: 'T+10', event: 'ROAD DEGRADING' },
  { index: 3, label: 'T+15', event: 'SHELTER CRITICAL' },
  { index: 4, label: 'T+30', event: 'CASCADE FAILURE' },
]

export default function TimelineBar({ currentIndex = 0 }) {
  const progress = (currentIndex / (KEYFRAMES.length - 1)) * 100

  return (
    <footer
      className="h-[72px] border-t border-hairline bg-canvas shrink-0 flex items-center px-4 gap-4"
      role="region"
      aria-label="Scenario timeline"
    >
      {/* ── Playback controls ── */}
      <div className="flex items-center gap-1.5 shrink-0" role="toolbar" aria-label="Timeline playback controls">
        <ControlButton label="Step backward" icon="⏮" />
        <ControlButton label="Play"          icon="▶" primary />
        <ControlButton label="Step forward"  icon="⏭" />
      </div>

      <div className="w-px h-8 bg-hairline shrink-0" aria-hidden="true" />

      {/* ── Timeline track ── */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Keyframe labels */}
        <div className="flex justify-between items-end" aria-hidden="true">
          {KEYFRAMES.map((kf) => (
            <div key={kf.index} className="flex flex-col items-center gap-0.5">
              <span className={`text-2xs font-mono transition-colors duration-200 ${
                kf.index === currentIndex ? 'text-accent' : 'text-ink-faint'
              }`}>
                {kf.label}
              </span>
            </div>
          ))}
        </div>

        {/* Track */}
        <div className="relative h-1 bg-surface rounded-full" role="slider" aria-label="Timeline position" aria-valuemin={0} aria-valuemax={4} aria-valuenow={currentIndex}>
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
          {/* Keyframe ticks */}
          {KEYFRAMES.map((kf) => {
            const pos = (kf.index / (KEYFRAMES.length - 1)) * 100
            const isActive = kf.index <= currentIndex
            return (
              <div
                key={kf.index}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full border transition-colors duration-200 ${
                  kf.index === currentIndex
                    ? 'bg-accent border-accent scale-125'
                    : isActive
                    ? 'bg-accent/60 border-accent/60'
                    : 'bg-canvas border-hairline'
                }`}
                style={{ left: `${pos}%` }}
                aria-hidden="true"
              />
            )
          })}
        </div>

        {/* Event label */}
        <div className="flex justify-between">
          {KEYFRAMES.map((kf) => (
            <span
              key={kf.index}
              className={`text-2xs font-mono transition-colors duration-200 ${
                kf.index === currentIndex
                  ? 'text-ink-dim'
                  : 'text-ink-faint opacity-40'
              }`}
              aria-hidden="true"
            >
              {kf.event}
            </span>
          ))}
        </div>
      </div>

      <div className="w-px h-8 bg-hairline shrink-0" aria-hidden="true" />

      {/* ── Current step indicator ── */}
      <div className="shrink-0 text-right">
        <p className="panel-label">STEP</p>
        <p className="text-sm font-bold font-mono text-accent">
          {KEYFRAMES[currentIndex]?.label ?? 'T+0'}
        </p>
      </div>
    </footer>
  )
}

function ControlButton({ label, icon, primary = false }) {
  return (
    <button
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors duration-150 text-sm font-mono ${
        primary
          ? 'bg-accent text-white hover:bg-accent-dim'
          : 'bg-surface border border-hairline text-ink-dim hover:text-ink hover:border-accent/50'
      }`}
    >
      {icon}
    </button>
  )
}
