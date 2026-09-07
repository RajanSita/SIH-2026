/**
 * InterventionPanel.jsx
 *
 * Task 7 — Countermeasure decision engine & Before/After comparison panel.
 *
 * Features:
 *   • Action card with scenario-specific recommended intervention.
 *   • Single-click "[ SIMULATE INTERVENTION ]" toggle button.
 *   • Instant Map & QuickStats reconfiguration via application state.
 *   • 3 before/after comparative metric gauges (Evacuation time, Shelter load, Risk zones).
 *   • Visual delta indicators (absolute difference + percentage reduction in green).
 *   • Reset to baseline simulation trigger.
 *   • Idle state when no scenario is selected.
 */

export default function InterventionPanel({
  activeScenario = null,
  interventionApplied = false,
  onInterventionApply,
  onInterventionReset,
}) {
  const isIdle = !activeScenario
  const intervention = activeScenario?.intervention
  const stats = activeScenario?.comparisonStats

  // Fallback default stats for display
  const evacBefore = stats?.evacTimeBefore ?? 25
  const evacAfter = stats?.evacTimeAfter ?? 18
  const evacUnit = stats?.evacTimeUnit ?? 'min'
  const evacDelta = evacAfter - evacBefore
  const evacPct = Math.round((Math.abs(evacDelta) / evacBefore) * 100)

  const overloadBefore = stats?.overloadBefore ?? 80
  const overloadAfter = stats?.overloadAfter ?? 55
  const overloadUnit = stats?.overloadUnit ?? '%'
  const overloadDelta = overloadAfter - overloadBefore

  const zonesBefore = stats?.riskZonesBefore ?? 12
  const zonesAfter = stats?.riskZonesAfter ?? 7
  const zonesUnit = stats?.riskZonesUnit ?? 'zones'
  const zonesDelta = zonesAfter - zonesBefore
  const zonesPct = Math.round((Math.abs(zonesDelta) / zonesBefore) * 100)

  return (
    <section
      className="flex flex-col border-b border-hairline py-3 px-4 bg-canvas/60"
      aria-label="Countermeasure Recommendation and Impact Analysis"
    >
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-accent text-xs" aria-hidden="true">⚡</span>
          <span className="panel-label">DECISION INTELLIGENCE</span>
        </div>
        <span
          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium transition-colors ${
            interventionApplied
              ? 'bg-risk-green/15 text-risk-green border-risk-green/40 font-bold'
              : activeScenario
              ? 'bg-accent/15 text-accent border-accent/30'
              : 'border-hairline text-ink-faint'
          }`}
        >
          {interventionApplied
            ? '✓ SIMULATED'
            : activeScenario
            ? 'RECOMMENDED'
            : 'STANDBY'}
        </span>
      </div>

      {/* ── Idle State Notice ── */}
      {isIdle && (
        <div className="p-3 rounded border border-dashed border-hairline/60 bg-surface/30 text-center">
          <p className="text-xs font-semibold text-ink-dim mb-1">
            No Active Incident
          </p>
          <p className="text-2xs font-mono text-ink-faint leading-relaxed">
            Select a scenario to compute spatial countermeasure recommendations and project impact metrics.
          </p>
        </div>
      )}

      {/* ── Active Scenario: Action Card ── */}
      {!isIdle && (
        <div
          className={`rounded border transition-all duration-200 p-3 mb-3 ${
            interventionApplied
              ? 'bg-accent/10 border-accent/40 shadow-sm shadow-accent/10'
              : 'bg-surface/50 border-hairline hover:border-hairline-bright'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <span className="panel-label text-[9px] block text-accent mb-0.5">
                OPTIMIZED COUNTERMEASURE
              </span>
              <h4 className="text-xs font-bold text-ink tracking-wide font-mono">
                {intervention?.actionLabel ?? 'DISPATCH EMERGENCY INTERVENTION'}
              </h4>
            </div>
            {interventionApplied && (
              <span className="text-2xs font-mono text-risk-green font-bold shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-risk-green animate-pulse" />
                ACTIVE
              </span>
            )}
          </div>

          <p className="text-2xs font-mono text-ink-dim leading-snug mb-3">
            {intervention?.actionDetail ?? intervention?.description}
          </p>

          {/* Action Trigger / Reset Button */}
          {!interventionApplied ? (
            <button
              id="btn-apply-intervention"
              type="button"
              onClick={onInterventionApply}
              aria-label={`Simulate intervention: ${intervention?.actionLabel}`}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-accent hover:bg-accent-dim text-white text-xs font-mono font-bold tracking-wide transition-all shadow-sm shadow-accent/20 active:scale-[0.99]"
            >
              <span aria-hidden="true">⚡</span>
              SIMULATE INTERVENTION
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 py-1.5 px-2.5 rounded bg-risk-green/10 border border-risk-green/30 text-2xs font-mono text-risk-green font-semibold flex items-center gap-1.5">
                <span>✓</span>
                <span>TWIN ADAPTED</span>
              </div>
              <button
                id="btn-reset-intervention"
                type="button"
                onClick={onInterventionReset}
                aria-label="Revert to baseline scenario simulation"
                className="py-1.5 px-3 rounded border border-hairline hover:border-accent/40 bg-surface/80 text-ink-dim hover:text-ink text-2xs font-mono transition-colors"
              >
                ↺ REVERT
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Before / After Comparative Metrics ── */}
      {!isIdle && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-2xs font-mono text-ink-faint mb-0.5">
            <span>RESILIENCE DELTA</span>
            <span>
              {interventionApplied ? 'SIMULATED IMPACT' : 'PROJECTED IMPACT'}
            </span>
          </div>

          {/* Metric 1: Evacuation Time */}
          <ComparisonRow
            label="EVACUATION TIME"
            beforeVal={`${evacBefore} ${evacUnit}`}
            afterVal={`${evacAfter} ${evacUnit}`}
            deltaBadge={`↓ ${Math.abs(evacDelta)} ${evacUnit} (-${evacPct}%)`}
            beforeRatio={100}
            afterRatio={Math.round((evacAfter / evacBefore) * 100)}
            isApplied={interventionApplied}
          />

          {/* Metric 2: Shelter Peak Load */}
          <ComparisonRow
            label="SHELTER LOAD"
            beforeVal={`${overloadBefore}${overloadUnit}`}
            afterVal={`${overloadAfter}${overloadUnit}`}
            deltaBadge={`↓ ${Math.abs(overloadDelta)}% LOAD`}
            beforeRatio={overloadBefore}
            afterRatio={overloadAfter}
            isApplied={interventionApplied}
          />

          {/* Metric 3: Critical Risk Zones */}
          <ComparisonRow
            label="RISK ZONES"
            beforeVal={`${zonesBefore} ${zonesUnit}`}
            afterVal={`${zonesAfter} ${zonesUnit}`}
            deltaBadge={`↓ ${Math.abs(zonesDelta)} ZONES (-${zonesPct}%)`}
            beforeRatio={100}
            afterRatio={Math.round((zonesAfter / zonesBefore) * 100)}
            isApplied={interventionApplied}
          />
        </div>
      )}
    </section>
  )
}

function ComparisonRow({
  label,
  beforeVal,
  afterVal,
  deltaBadge,
  beforeRatio = 100,
  afterRatio = 70,
  isApplied = false,
}) {
  return (
    <div className="p-2 rounded bg-surface/40 border border-hairline/60 flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-2xs font-mono">
        <span className="text-ink-dim font-medium">{label}</span>
        <span className="text-risk-green font-bold tracking-tight">
          {deltaBadge}
        </span>
      </div>

      {/* Comparison values */}
      <div className="flex items-center justify-between text-2xs font-mono">
        <span className="text-ink-faint line-through opacity-75">
          {beforeVal}
        </span>
        <span className="text-ink-faint text-[10px]">→</span>
        <span
          className={`font-bold transition-colors ${
            isApplied ? 'text-accent' : 'text-ink'
          }`}
        >
          {afterVal}
        </span>
      </div>

      {/* Comparative Gauge Bar */}
      <div className="flex items-center gap-1.5 h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
        {/* Post-intervention width */}
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isApplied
              ? 'bg-gradient-to-r from-accent to-risk-green'
              : 'bg-accent/60'
          }`}
          style={{ width: `${Math.min(100, afterRatio)}%` }}
        />
      </div>
    </div>
  )
}
