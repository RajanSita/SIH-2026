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

import QuickStats        from './QuickStats.jsx'
import ScenarioChat      from './ScenarioChat.jsx'
import CausalBreakdown   from './CausalBreakdown.jsx'
import InterventionPanel from './InterventionPanel.jsx'

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

        {/* Intervention impact — Task 7 */}
        <InterventionPanel
          activeScenario={activeScenario}
          interventionApplied={interventionApplied}
          onInterventionApply={onInterventionApply}
          onInterventionReset={onInterventionReset}
        />
      </div>

      {/* ── 3. Scenario Chat ──────────────────────────────────────────────── */}
      <ScenarioChat
        activeScenario={activeScenario}
        onScenarioActivate={onScenarioActivate}
      />
    </aside>
  )
}

