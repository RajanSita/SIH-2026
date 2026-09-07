/**
 * RightRail — The 35%-width analytics sidebar.
 *
 * Layout (Task 4 update):
 *   ┌─────────────────┐  ← QuickStats     — live 6-stat grid (Task 4)
 *   │ SITUATION OVRVW │
 *   ├─────────────────┤
 *   │ CAUSAL BRKDWN  │  ← placeholder (Task 6)
 *   │                 │
 *   │ INTERVENTION    │  ← placeholder (Task 7)
 *   ├─────────────────┤
 *   │ SCENARIO INPUT  │  ← ScenarioChat  — live NL input (Task 4)
 *   └─────────────────┘
 */

import QuickStats      from './QuickStats.jsx'
import ScenarioChat    from './ScenarioChat.jsx'
import CausalBreakdown from './CausalBreakdown.jsx'

export default function RightRail({
  activeScenario,
  currentKeyframeIndex,
  interventionApplied,
  onInterventionApply,
  onInterventionReset,
  onScenarioActivate,
}) {
  return (
    <aside
      className="flex flex-col w-[35%] min-w-[300px] max-w-[440px] border-l border-hairline bg-canvas shrink-0 overflow-hidden"
      role="complementary"
      aria-label="Analytics and scenario control panel"
    >
      {/* ── 1. Situation overview stats ──────────────────────────────────── */}
      <QuickStats
        activeScenario={activeScenario}
        currentKeyframeIndex={currentKeyframeIndex}
        interventionApplied={interventionApplied}
      />

      {/* ── 2. Causal breakdown + Intervention comparison (Tasks 6 & 7) ── */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Causal breakdown — Task 6 */}
        <CausalBreakdown
          activeScenario={activeScenario}
          currentKeyframeIndex={currentKeyframeIndex}
        />

        <div className="section-divider" />

        {/* Intervention impact — Task 7 placeholder */}
        <section aria-label="Intervention impact comparison">
          <SectionHeader label="INTERVENTION IMPACT" tag="Task 7" />
          {activeScenario && !interventionApplied && (
            <div className="px-4 pb-3">
              <button
                id="btn-apply-intervention"
                onClick={onInterventionApply}
                aria-label={`Apply intervention: ${activeScenario.intervention?.actionLabel}`}
                className="w-full text-2xs font-mono text-accent border border-accent/30 rounded px-3 py-2.5 hover:bg-accent/10 transition-colors duration-150 text-left"
              >
                <span className="text-ink-faint mr-2" aria-hidden="true">▶</span>
                {activeScenario.intervention?.actionLabel ?? 'APPLY INTERVENTION'}
                {activeScenario.intervention?.actionDetail && (
                  <span className="block text-2xs text-ink-faint mt-0.5 pl-4">
                    {activeScenario.intervention.actionDetail}
                  </span>
                )}
              </button>
            </div>
          )}
          {activeScenario && interventionApplied && (
            <div className="px-4 pb-3 flex items-center justify-between">
              <span className="text-2xs font-mono text-risk-green">
                ✓ INTERVENTION APPLIED
              </span>
              <button
                id="btn-reset-intervention"
                onClick={onInterventionReset}
                aria-label="Reset intervention"
                className="text-2xs font-mono text-ink-faint hover:text-ink border border-hairline rounded px-2 py-1 transition-colors duration-150"
              >
                RESET
              </button>
            </div>
          )}
          <PlaceholderBlock
            icon="⇄"
            title="Before / After Comparison"
            subtitle="Evacuation time · Shelter load · Risk zones — Task 7"
          />
        </section>
      </div>

      {/* ── 3. Scenario Chat ──────────────────────────────────────────────── */}
      <ScenarioChat
        activeScenario={activeScenario}
        onScenarioActivate={onScenarioActivate}
      />
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

function PlaceholderBlock({ icon, title, subtitle }) {
  return (
    <div className="mx-4 mb-4 flex flex-col items-center justify-center gap-2 py-6 border border-dashed border-hairline rounded opacity-35">
      <span className="text-2xl text-ink-faint" aria-hidden="true">{icon}</span>
      <p className="text-xs font-semibold text-ink-dim">{title}</p>
      <p className="text-2xs text-ink-faint text-center px-4">{subtitle}</p>
    </div>
  )
}
