/**
 * QuickStats.jsx
 *
 * Task 4 — Dynamic situation overview stats panel.
 * Derives live values from the current scenario + merged keyframe state.
 *
 * Props:
 *   activeScenario       — scenario object (null = idle)
 *   currentKeyframeIndex — 0..4
 *   interventionApplied  — boolean
 */

import { useMemo } from 'react'
import { mergeKeyframeState } from '../utils/scenarioUtils.js'

// ── Stat derivation helpers ───────────────────────────────────────────────────

function formatPop(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}

function roadNetworkStatus(roads) {
  if (!roads) return { label: '—', variant: 'dim' }
  const blocked    = roads.filter((r) => r.status === 'blocked').length
  const restricted = roads.filter((r) => r.status === 'restricted').length
  const congested  = roads.filter((r) => r.status === 'congested').length
  if (blocked >= 2)              return { label: 'CRITICAL',  variant: 'critical' }
  if (blocked >= 1 || restricted >= 2) return { label: 'DEGRADED', variant: 'high' }
  if (congested >= 2)            return { label: 'CONGESTED', variant: 'elevated' }
  return { label: 'CLEAR', variant: 'ok' }
}

function avgShelterUtil(shelters) {
  if (!shelters || shelters.length === 0) return null
  const valid = shelters.filter((s) => s.utilizationPercent != null)
  if (valid.length === 0) return null
  return Math.round(valid.reduce((sum, s) => sum + s.utilizationPercent, 0) / valid.length)
}

function shelterVariant(pct) {
  if (pct == null) return 'dim'
  if (pct >= 90)   return 'critical'
  if (pct >= 70)   return 'high'
  if (pct >= 50)   return 'elevated'
  return 'ok'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuickStats({ activeScenario, currentKeyframeIndex, interventionApplied }) {
  // Merge current keyframe state to get live stats
  const { stats, roads, shelters } = useMemo(() => {
    if (!activeScenario) return { stats: null, roads: null, shelters: null }

    if (interventionApplied) {
      return {
        stats:    activeScenario.intervention?.stats ?? activeScenario.baseline.stats,
        roads:    activeScenario.intervention?.roads ?? activeScenario.baseline.roads,
        shelters: activeScenario.intervention?.shelters ?? activeScenario.baseline.shelters,
      }
    }

    const merged = mergeKeyframeState(
      activeScenario.baseline,
      activeScenario.timeline,
      currentKeyframeIndex,
    )
    return {
      stats:    merged.stats,
      roads:    merged.roads,
      shelters: merged.shelters,
    }
  }, [activeScenario, currentKeyframeIndex, interventionApplied])

  // Derived display values
  const roadNet  = roadNetworkStatus(roads)
  const shelterPct = avgShelterUtil(shelters)
  const shelterLabel = shelterPct != null ? `${shelterPct}%` : '—'

  return (
    <section
      className="border-b border-hairline shrink-0"
      aria-label="Situation overview statistics"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="panel-label">SITUATION OVERVIEW</span>
        {activeScenario && (
          <span
            className={`text-2xs font-mono rounded px-1.5 py-0.5 border animate-fade-in ${
              activeScenario.severity === 'HIGH'
                ? 'text-risk-red border-risk-red/30'
                : 'text-risk-yellow border-risk-yellow/30'
            }`}
            aria-label={`Severity: ${activeScenario.severity}`}
          >
            {activeScenario.severity}
          </span>
        )}
      </div>

      {/* 2-column grid */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2.5">
        <StatCard
          id="stat-threat"
          label="THREAT LEVEL"
          value={activeScenario ? activeScenario.severity : '—'}
          sub={activeScenario ? activeScenario.threatType : 'No active scenario'}
          variant={
            !activeScenario              ? 'dim'
            : activeScenario.severity === 'HIGH' ? 'critical'
            : 'elevated'
          }
        />
        <StatCard
          id="stat-pop"
          label="POP. AT RISK"
          value={stats ? formatPop(stats.populationAtRisk) : '—'}
          sub={stats ? `${stats.criticalInfraCount ?? '—'} critical infra` : 'Awaiting scenario'}
          variant={
            !stats                         ? 'dim'
            : stats.populationAtRisk >= 35000 ? 'critical'
            : stats.populationAtRisk >= 20000 ? 'high'
            : stats.populationAtRisk >= 10000 ? 'elevated'
            : 'ok'
          }
        />
        <StatCard
          id="stat-evac"
          label="EVAC TIME"
          value={stats ? `${stats.estimatedEvacMinutes}m` : '—'}
          sub="estimated"
          variant={
            !stats                               ? 'dim'
            : stats.estimatedEvacMinutes >= 35   ? 'critical'
            : stats.estimatedEvacMinutes >= 25   ? 'high'
            : stats.estimatedEvacMinutes >= 18   ? 'elevated'
            : 'ok'
          }
        />
        <StatCard
          id="stat-shelter"
          label="SHELTER LOAD"
          value={shelterLabel}
          sub="avg utilisation"
          variant={shelterVariant(shelterPct)}
        />
        <StatCard
          id="stat-hosp"
          label="HOSP. ACCESS"
          value={stats ? `${stats.hospitalAccessPct}%` : '—'}
          sub="route availability"
          variant={
            !stats                          ? 'dim'
            : stats.hospitalAccessPct <= 25 ? 'critical'
            : stats.hospitalAccessPct <= 50 ? 'high'
            : stats.hospitalAccessPct <= 70 ? 'elevated'
            : 'ok'
          }
        />
        <StatCard
          id="stat-road"
          label="ROAD NETWORK"
          value={roadNet.label}
          sub="primary corridors"
          variant={roadNet.variant}
        />
      </div>
    </section>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────

const VARIANT_VALUE_COLOR = {
  critical: 'text-risk-red',
  high:     'text-risk-orange',
  elevated: 'text-risk-yellow',
  ok:       'text-risk-green',
  dim:      'text-ink-faint',
}

const VARIANT_DOT = {
  critical: 'bg-risk-red',
  high:     'bg-risk-orange',
  elevated: 'bg-risk-yellow',
  ok:       'bg-risk-green',
  dim:      'bg-hairline',
}

function StatCard({ id, label, value, sub, variant }) {
  const valueColor = VARIANT_VALUE_COLOR[variant] ?? 'text-ink'
  const dotColor   = VARIANT_DOT[variant]         ?? 'bg-hairline'

  return (
    <div
      id={id}
      className="bg-surface border border-hairline rounded p-2.5 flex flex-col gap-1.5 min-h-[62px]"
      role="group"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} aria-hidden="true" />
        <p className="panel-label leading-none">{label}</p>
      </div>
      <p className={`text-sm font-bold font-mono leading-none ${valueColor}`}>
        {value}
      </p>
      {sub && (
        <p className="text-2xs text-ink-faint leading-none truncate">{sub}</p>
      )}
    </div>
  )
}
