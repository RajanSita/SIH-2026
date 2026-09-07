/**
 * RightRail — The 35%-width analytics sidebar.
 * Contains:
 *   1. QuickStats   — live numeric overview
 *   2. CausalPanel  — vulnerability breakdown (Task 6)
 *   3. ScenarioChat — natural-language input (Task 4)
 *
 * Task 1: Renders structural shell with labelled placeholder sections.
 */

export default function RightRail({ activeScenario }) {
  return (
    <aside
      className="flex flex-col w-[35%] min-w-[280px] max-w-[420px] border-l border-hairline bg-canvas shrink-0 overflow-hidden"
      role="complementary"
      aria-label="Analytics and scenario control panel"
    >
      {/* ── 1. Quick Stats ─────────────────────────────────────────────── */}
      <section className="border-b border-hairline" aria-label="Quick statistics">
        <SectionHeader label="SITUATION OVERVIEW" />
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          <StatCard label="THREAT LEVEL"    value={activeScenario ? activeScenario.severity : '—'} variant={activeScenario ? 'critical' : 'dim'} />
          <StatCard label="EXPOSURE"        value={activeScenario ? 'HIGH' : '—'}                 variant={activeScenario ? 'high'     : 'dim'} />
          <StatCard label="SHELTER STATUS"  value={activeScenario ? '82%'  : '—'}                 variant={activeScenario ? 'elevated' : 'dim'} />
          <StatCard label="ROAD NETWORK"    value={activeScenario ? 'DEGRADED' : '—'}             variant={activeScenario ? 'high'     : 'dim'} />
        </div>
      </section>

      {/* ── 2. Causal Breakdown placeholder ───────────────────────────── */}
      <section className="border-b border-hairline flex-1 overflow-y-auto" aria-label="Causal breakdown">
        <SectionHeader label="CAUSAL BREAKDOWN" tag="Task 6" />
        <PlaceholderBlock
          icon="⬡"
          title="Vulnerability Analysis"
          subtitle="Causal factor bars — implemented in Task 6"
        />

        {/* ── Comparison placeholder ───────────────────────────────── */}
        <div className="section-divider" />
        <SectionHeader label="INTERVENTION IMPACT" tag="Task 7" />
        <PlaceholderBlock
          icon="⇄"
          title="Before / After Comparison"
          subtitle="Evacuation · Shelter · Risk zones — Task 7"
        />
      </section>

      {/* ── 3. Scenario Chat input ─────────────────────────────────────── */}
      <section className="border-t border-hairline shrink-0" aria-label="Scenario input">
        <SectionHeader label="SCENARIO INPUT" tag="Task 4" />
        <div className="px-4 pb-4">
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {['HOSTILE ATTACK', 'EARTHQUAKE', 'FLOOD'].map((chip) => (
              <button
                key={chip}
                aria-label={`Load ${chip} scenario`}
                className="text-2xs font-mono text-ink-dim border border-hairline rounded px-2 py-1 hover:border-accent/50 hover:text-accent transition-colors duration-150"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input field */}
          <div className="relative">
            <input
              type="text"
              placeholder="Describe a scenario in natural language…"
              aria-label="Scenario description input"
              className="w-full bg-surface border border-hairline rounded px-3 py-2.5 text-xs text-ink placeholder:text-ink-faint font-mono focus:outline-none focus:border-accent/50 transition-colors duration-150 pr-16"
              disabled
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-ink-faint font-mono pointer-events-none">
              ENTER
            </span>
          </div>
          <p className="text-2xs text-ink-faint mt-1.5">
            Full interaction implemented in Task 4
          </p>
        </div>
      </section>
    </aside>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function SectionHeader({ label, tag }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="panel-label">{label}</span>
      {tag && (
        <span className="text-2xs font-mono text-ink-faint border border-hairline rounded px-1.5 py-0.5 opacity-50">
          {tag}
        </span>
      )}
    </div>
  )
}

function StatCard({ label, value, variant }) {
  const valueColor = {
    critical: 'text-risk-red',
    high:     'text-risk-orange',
    elevated: 'text-risk-yellow',
    dim:      'text-ink-faint',
  }[variant] || 'text-ink'

  return (
    <div className="bg-surface border border-hairline rounded p-3">
      <p className="panel-label mb-1">{label}</p>
      <p className={`text-sm font-bold font-mono ${valueColor}`}>{value}</p>
    </div>
  )
}

function PlaceholderBlock({ icon, title, subtitle }) {
  return (
    <div className="mx-4 mb-4 flex flex-col items-center justify-center gap-2 py-6 border border-dashed border-hairline rounded opacity-40">
      <span className="text-2xl text-ink-faint">{icon}</span>
      <p className="text-xs font-semibold text-ink-dim">{title}</p>
      <p className="text-2xs text-ink-faint text-center px-4">{subtitle}</p>
    </div>
  )
}
