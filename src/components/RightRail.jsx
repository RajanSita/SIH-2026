/**
 * RightRail — The 35%-width analytics sidebar.
 *
 * Fixed Layout Architecture:
 *   • Entire sidebar has smooth overflow-y-auto scrolling (no elements submerged).
 *   • Compact Situation Overview stats at top.
 *   • Tab switcher for Intelligence Layers:
 *       [ ⬡ CAUSAL BREAKDOWN ]  |  [ ⚡ INTERVENTION IMPACT ]
 *     This ensures neither panel is squished or hidden between other tabs.
 *   • Scenario Command Chat with preset chips and interpretation card.
 */

import { useState, useEffect } from 'react'
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
  const [activeTab, setActiveTab] = useState('causal') // 'causal' | 'intervention'

  // Auto-switch to intervention tab when intervention is applied
  useEffect(() => {
    if (interventionApplied) {
      setActiveTab('intervention')
    }
  }, [interventionApplied])

  // Auto-switch to causal tab when a new scenario is activated
  useEffect(() => {
    if (activeScenario) {
      setActiveTab('causal')
    }
  }, [activeScenario?.id])

  return (
    <aside
      className="flex flex-col w-[35%] min-w-[320px] max-w-[460px] border-l border-hairline bg-canvas shrink-0 overflow-y-auto overflow-x-hidden"
      role="complementary"
      aria-label="Analytics and scenario control panel"
    >
      {/* ── 1. Situation overview stats (Compact header) ──────────────────── */}
      <QuickStats
        activeScenario={activeScenario}
        currentKeyframeIndex={currentKeyframeIndex}
        interventionApplied={interventionApplied}
      />

      {/* ── 2. Intelligence Layer Tabs Switcher ────────────────────────────── */}
      <div className="flex border-y border-hairline bg-surface/30 shrink-0 sticky top-0 z-10 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('causal')}
          aria-selected={activeTab === 'causal'}
          className={`flex-1 py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'causal'
              ? 'border-accent text-accent bg-accent/10 shadow-xs'
              : 'border-transparent text-ink-faint hover:text-ink hover:bg-surface/50'
          }`}
        >
          <span aria-hidden="true">⬡</span>
          <span>CAUSAL BREAKDOWN</span>
          {activeScenario && (
            <span className="w-1.5 h-1.5 rounded-full bg-risk-red animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('intervention')}
          aria-selected={activeTab === 'intervention'}
          className={`flex-1 py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'intervention'
              ? 'border-accent text-accent bg-accent/10 shadow-xs'
              : 'border-transparent text-ink-faint hover:text-ink hover:bg-surface/50'
          }`}
        >
          <span aria-hidden="true">⚡</span>
          <span>INTERVENTION IMPACT</span>
          {interventionApplied && (
            <span className="text-[10px] text-risk-green font-bold">✓</span>
          )}
        </button>
      </div>

      {/* ── 3. Active Intelligence Panel (Full height, never submerged) ───── */}
      <div className="shrink-0 bg-canvas">
        {activeTab === 'causal' ? (
          <CausalBreakdown
            activeScenario={activeScenario}
            currentKeyframeIndex={currentKeyframeIndex}
          />
        ) : (
          <InterventionPanel
            activeScenario={activeScenario}
            interventionApplied={interventionApplied}
            onInterventionApply={onInterventionApply}
            onInterventionReset={onInterventionReset}
          />
        )}
      </div>

      {/* ── 4. Scenario Command Chat & Input ──────────────────────────────── */}
      <div className="shrink-0 border-t border-hairline">
        <ScenarioChat
          activeScenario={activeScenario}
          onScenarioActivate={onScenarioActivate}
        />
      </div>
    </aside>
  )
}
