/**
 * CausalBreakdown.jsx
 *
 * Task 6 — Causal breakdown & vulnerability analysis panel.
 *
 * Features:
 *   • 4 independent vulnerability factor bars (Shelter Deficit, Population Density,
 *     Road Accessibility, Infrastructure Risk).
 *   • Severity-aware color coding (Critical, High, Elevated, Low).
 *   • Automatic primary driver detection using getPrimaryDriver().
 *   • Co-dominant near-tie detection (when top 2 drivers are within 8 pts).
 *   • Dynamic keyframe-aware adjustments during cascade failure.
 *   • Idle state with nominal city-wide baseline metrics.
 *   • Full ARIA progressbar semantics for screen-reader accessibility.
 */

import { useMemo } from 'react'
import { getPrimaryDriver, getCausalSeverity } from '../utils/scenarioUtils.js'

// Fallback baseline for idle state
const IDLE_FACTORS = {
  shelterDeficit:    { value: 18, label: 'Shelter Deficit',    description: 'City shelter network at standard reserve margin' },
  populationDensity: { value: 24, label: 'Population Density', description: 'Normal daytime commercial & residential distribution' },
  roadAccessibility: { value: 12, label: 'Road Accessibility', description: 'All major transport corridors fully operational' },
  infrastructure:    { value: 16, label: 'Infrastructure Risk',description: 'Power, water, and emergency links nominal' },
}

const SEVERITY_CONFIG = {
  critical: {
    label: 'CRITICAL',
    badgeCls: 'bg-risk-red/15 text-risk-red border-risk-red/30',
    barCls: 'from-risk-red/80 to-risk-red',
    textCls: 'text-risk-red',
    glowCls: 'shadow-risk-red/20',
  },
  high: {
    label: 'HIGH',
    badgeCls: 'bg-risk-orange/15 text-risk-orange border-risk-orange/30',
    barCls: 'from-risk-orange/80 to-risk-orange',
    textCls: 'text-risk-orange',
    glowCls: 'shadow-risk-orange/20',
  },
  elevated: {
    label: 'ELEVATED',
    badgeCls: 'bg-risk-yellow/15 text-risk-yellow border-risk-yellow/30',
    barCls: 'from-risk-yellow/80 to-risk-yellow',
    textCls: 'text-risk-yellow',
    glowCls: 'shadow-risk-yellow/20',
  },
  low: {
    label: 'LOW',
    badgeCls: 'bg-risk-green/15 text-risk-green border-risk-green/30',
    barCls: 'from-risk-green/80 to-risk-green',
    textCls: 'text-risk-green',
    glowCls: 'shadow-risk-green/20',
  },
}

export default function CausalBreakdown({
  activeScenario = null,
  currentKeyframeIndex = 0,
}) {
  const isIdle = !activeScenario

  // Resolve base causal factors
  const rawFactors = activeScenario?.causalFactors ?? IDLE_FACTORS

  // Dynamic factor calculation based on timeline progression (cascade worsening)
  const computedFactors = useMemo(() => {
    if (isIdle) return rawFactors

    // If simulating timeline steps T+5, T+10, T+15, T+30, factors escalate slightly with cascade
    const escalation = currentKeyframeIndex * 2

    const res = {}
    for (const [key, data] of Object.entries(rawFactors)) {
      const adjustedVal = Math.min(100, Math.max(0, data.value + (currentKeyframeIndex > 0 ? escalation : 0)))
      res[key] = {
        ...data,
        value: adjustedVal,
      }
    }
    return res
  }, [rawFactors, currentKeyframeIndex, isIdle])

  // Detect primary driver and near-ties
  const driverAnalysis = useMemo(() => {
    return getPrimaryDriver(computedFactors)
  }, [computedFactors])

  const { primary, secondary, isNearTie } = driverAnalysis

  const factorEntries = Object.entries(computedFactors)

  return (
    <section
      className="flex flex-col border-b border-hairline py-3 px-4 bg-canvas/40"
      aria-label="Causal Breakdown and Vulnerability Analysis"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-accent text-xs" aria-hidden="true">⬡</span>
          <span className="panel-label">CAUSAL BREAKDOWN</span>
        </div>
        <span className="text-2xs font-mono text-ink-faint border border-hairline rounded px-1.5 py-0.5">
          {isIdle ? 'NOMINAL' : `T+${currentKeyframeIndex === 4 ? 30 : currentKeyframeIndex * 5}M MODEL`}
        </span>
      </div>

      {/* ── Primary Driver Callout Box ── */}
      {!isIdle && primary && (
        <div
          className={`mb-3 p-2.5 rounded border text-2xs font-mono transition-all duration-200 ${
            isNearTie
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
              : 'bg-red-950/20 border-red-500/40 text-red-300'
          }`}
          role="alert"
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="flex items-center gap-1.5 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden="true" />
              {isNearTie ? 'CO-DOMINANT DRIVERS DETECTED' : 'PRIMARY VULNERABILITY DRIVER'}
            </span>
            <span className="text-2xs opacity-80">
              {isNearTie ? 'Δ ≤ 8%' : `${primary.value}% IMPACT`}
            </span>
          </div>

          <p className="text-ink-dim leading-snug">
            {isNearTie ? (
              <>
                Compounding crisis driven equally by{' '}
                <strong className="text-amber-200">{primary.label} ({primary.value}%)</strong> and{' '}
                <strong className="text-amber-200">{secondary.label} ({secondary.value}%)</strong>.
              </>
            ) : (
              <>
                <strong className="text-red-200">{primary.label}</strong> is the strongest vulnerability vector ({primary.value}%). {primary.description}.
              </>
            )}
          </p>
        </div>
      )}

      {/* ── Idle Baseline Notice ── */}
      {isIdle && (
        <div className="mb-2.5 p-2 rounded bg-surface/40 border border-hairline text-2xs font-mono text-ink-faint flex items-center justify-between">
          <span>ALL RESILIENCE SECTORS STABLE</span>
          <span className="text-risk-green font-bold">NOMINAL</span>
        </div>
      )}

      {/* ── 4 Factor Bars ── */}
      <div className="flex flex-col gap-2.5" role="list" aria-label="Vulnerability factor bars">
        {factorEntries.map(([key, factor]) => {
          const severity = getCausalSeverity(factor.value)
          const conf = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.low
          const isPrimary = !isIdle && primary?.key === key
          const isSecondary = !isIdle && isNearTie && secondary?.key === key

          return (
            <div
              key={key}
              className="flex flex-col gap-1 group"
              role="listitem"
            >
              {/* Row 1: Label, Driver Badge, Value & Severity */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-2xs text-ink-dim font-medium">
                    {factor.label}
                  </span>
                  {isPrimary && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded font-bold bg-risk-red/20 text-risk-red border border-risk-red/40 animate-pulse">
                      PRIMARY
                    </span>
                  )}
                  {isSecondary && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded font-bold bg-risk-yellow/20 text-risk-yellow border border-risk-yellow/40">
                      CO-DRIVER
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-2xs font-mono font-bold ${conf.textCls}`}>
                    {factor.value}%
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded border uppercase font-medium ${conf.badgeCls}`}
                  >
                    {conf.label}
                  </span>
                </div>
              </div>

              {/* Row 2: Animated Progress Bar */}
              <div
                className="relative h-1.5 bg-surface rounded-full overflow-hidden border border-hairline/40"
                role="progressbar"
                aria-label={factor.label}
                aria-valuenow={factor.value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${factor.label}: ${factor.value}% (${conf.label})`}
              >
                <div
                  className={`absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-500 ease-out ${conf.barCls}`}
                  style={{ width: `${factor.value}%` }}
                />
              </div>

              {/* Row 3: Micro context description */}
              {factor.description && (
                <p className="text-[10px] font-mono text-ink-faint truncate leading-none">
                  {factor.description}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
