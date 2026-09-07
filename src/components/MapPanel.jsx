/**
 * MapPanel — Hero map area (65% width).
 * Task 1: Renders a styled placeholder showing the Digital Twin will live here.
 * Task 3: Will be replaced with MapLibre GL JS integration.
 */
export default function MapPanel({ activeScenario }) {
  return (
    <div
      className="relative flex-1 bg-canvas overflow-hidden"
      role="region"
      aria-label="Digital Twin map view"
    >
      {/* ── Grid overlay — command center aesthetic ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30,32,41,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,32,41,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Radial glow from centre — depth illusion ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(59,130,246,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ── Corner coordinates decoration ── */}
      <CornerLabel position="top-left"    text="28.6315°N  77.2167°E" />
      <CornerLabel position="top-right"   text="28.6430°N  77.2290°E" />
      <CornerLabel position="bottom-left" text="28.6210°N  77.2140°E" />
      <CornerLabel position="bottom-right"text="28.6220°N  77.2310°E" />

      {/* ── Map attribution strip ── */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-hairline" aria-hidden="true" />

      {/* ── Placeholder content (removed when MapLibre loads) ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <svg
          width="48" height="48" viewBox="0 0 48 48" fill="none"
          aria-hidden="true"
          className="opacity-20"
        >
          <polygon
            points="24,4 44,14 44,34 24,44 4,34 4,14"
            stroke="#3B82F6" strokeWidth="2" fill="none"
          />
          <polygon
            points="24,14 34,19.5 34,28.5 24,34 14,28.5 14,19.5"
            stroke="#3B82F6" strokeWidth="1" fill="rgba(59,130,246,0.15)"
          />
          <circle cx="24" cy="24" r="3" fill="#3B82F6" opacity="0.5" />
        </svg>

        <div className="text-center">
          <p className="panel-label mb-1">3D DIGITAL TWIN</p>
          <p className="text-ink-faint text-xs">
            MapLibre GL JS — Central Delhi
          </p>
          <p className="text-ink-faint text-2xs mt-1">
            Initialising in Task 3
          </p>
        </div>

        {activeScenario && (
          <div className="mt-2 px-3 py-1.5 border border-hairline rounded text-center animate-fade-in">
            <p className="text-2xs text-ink-faint font-mono uppercase tracking-widest mb-0.5">
              Scenario Active
            </p>
            <p className="text-xs font-semibold text-accent font-mono">
              {activeScenario.name}
            </p>
          </div>
        )}
      </div>

      {/* ── Map overlay controls ── */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5" role="toolbar" aria-label="Map controls">
        <MapControlButton label="Zoom in"  icon="+" />
        <MapControlButton label="Zoom out" icon="−" />
        <div className="w-px h-px" />
        <MapControlButton label="Reset bearing" icon="◎" />
        <MapControlButton label="Toggle 3D"     icon="⬡" />
      </div>

      {/* ── Scale indicator ── */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2" aria-label="Map scale">
        <div className="w-16 h-px bg-ink-faint relative">
          <div className="absolute left-0 top-0 w-px h-1.5 -translate-y-1/2 bg-ink-faint" />
          <div className="absolute right-0 top-0 w-px h-1.5 -translate-y-1/2 bg-ink-faint" />
        </div>
        <span className="text-2xs text-ink-faint font-mono">500 m</span>
      </div>
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function CornerLabel({ position, text }) {
  const classes = {
    'top-left':     'top-3 left-3',
    'top-right':    'top-3 right-3',
    'bottom-left':  'bottom-4 left-3',
    'bottom-right': 'bottom-4 right-3',
  }
  return (
    <div
      className={`absolute ${classes[position]} text-2xs font-mono text-ink-faint opacity-50 pointer-events-none`}
      aria-hidden="true"
    >
      {text}
    </div>
  )
}

function MapControlButton({ label, icon }) {
  return (
    <button
      aria-label={label}
      className="w-7 h-7 flex items-center justify-center bg-surface border border-hairline rounded text-ink-dim text-xs hover:text-ink hover:border-accent/50 transition-colors duration-150 font-mono"
    >
      {icon}
    </button>
  )
}
