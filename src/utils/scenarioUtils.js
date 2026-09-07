/**
 * scenarioUtils.js
 *
 * Pure utility functions for scenario state management.
 * No React, no side effects — testable in isolation.
 */

import { BUILDING_DEFS, ROAD_DEFS, SHELTER_DEFS } from '../data/scenarioData.js'

// ─────────────────────────────────────────────────────────────────────────────
// State Merge
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge timeline keyframe diffs cumulatively onto a baseline state.
 *
 * Keyframes are applied in order from T+0 up to `targetIndex`.
 * Each diff is a partial override — only specified fields are changed.
 * The baseline itself is never mutated.
 *
 * @param {object} baseline — scenario.baseline
 * @param {Array}  timeline — scenario.timeline
 * @param {number} targetIndex — 0..4
 * @returns {object} merged state with buildings, roads, shelters, stats
 */
export function mergeKeyframeState(baseline, timeline, targetIndex) {
  // Deep-clone baseline (avoid mutating imported data)
  let state = deepCloneBaseline(baseline)

  // Apply diffs from T+0 up to targetIndex
  for (let i = 0; i <= targetIndex; i++) {
    const frame = timeline[i]
    if (!frame || !frame.diff) continue

    const diff = frame.diff

    // Merge buildings
    if (diff.buildings) {
      diff.buildings.forEach((bDiff) => {
        const idx = state.buildings.findIndex((b) => b.id === bDiff.id)
        if (idx !== -1) {
          state.buildings[idx] = { ...state.buildings[idx], ...bDiff }
        }
      })
    }

    // Merge roads
    if (diff.roads) {
      diff.roads.forEach((rDiff) => {
        const idx = state.roads.findIndex((r) => r.id === rDiff.id)
        if (idx !== -1) {
          state.roads[idx] = { ...state.roads[idx], ...rDiff }
        }
      })
    }

    // Merge shelters
    if (diff.shelters) {
      diff.shelters.forEach((sDiff) => {
        const idx = state.shelters.findIndex((s) => s.id === sDiff.id)
        if (idx !== -1) {
          state.shelters[idx] = { ...state.shelters[idx], ...sDiff }
        }
      })
    }

    // Merge stats
    if (diff.stats) {
      state.stats = { ...state.stats, ...diff.stats }
    }
  }

  return state
}

/**
 * Merge baseline + intervention state.
 * Intervention is not a diff — it is a full replacement of the arrays.
 * Stats are also replaced from the intervention object.
 *
 * @param {object} baseline     — scenario.baseline
 * @param {object} intervention — scenario.intervention
 * @returns {object} intervention city state
 */
export function mergeInterventionState(baseline, intervention) {
  return {
    buildings: intervention.buildings
      ? enrichWithDefs(intervention.buildings, BUILDING_DEFS)
      : deepCloneArray(baseline.buildings),

    roads: intervention.roads
      ? enrichWithDefs(intervention.roads, ROAD_DEFS)
      : deepCloneArray(baseline.roads),

    shelters: intervention.shelters
      ? enrichWithDefs(intervention.shelters, SHELTER_DEFS)
      : deepCloneArray(baseline.shelters),

    threatZone: baseline.threatZone, // threat zone unchanged by intervention
    evacuationRoutes: [
      ...(baseline.evacuationRoutes || []),
      ...(intervention.newEvacuationRoutes || []),
    ],

    stats: intervention.stats
      ? { ...baseline.stats, ...intervention.stats }
      : { ...baseline.stats },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Causal Factor Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the primary vulnerability driver from causal factors.
 * Handles near-ties: if top two are within 8 points, both are returned.
 *
 * @param {object} causalFactors — scenario.causalFactors
 * @returns {{ primary: object, secondary: object|null, isNearTie: boolean }}
 */
export function getPrimaryDriver(causalFactors) {
  const NEAR_TIE_THRESHOLD = 8

  const sorted = Object.entries(causalFactors)
    .map(([key, data]) => ({ key, ...data }))
    .sort((a, b) => b.value - a.value)

  const primary   = sorted[0] ?? null
  const secondary = sorted[1] ?? null

  const isNearTie =
    primary && secondary &&
    Math.abs(primary.value - secondary.value) <= NEAR_TIE_THRESHOLD

  return { primary, secondary: isNearTie ? secondary : null, isNearTie }
}

/**
 * Get severity class for a causal factor value.
 *
 * @param {number} value — 0–100
 * @returns {'critical'|'high'|'elevated'|'low'}
 */
export function getCausalSeverity(value) {
  if (value >= 75) return 'critical'
  if (value >= 55) return 'high'
  if (value >= 35) return 'elevated'
  return 'low'
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk Colour Mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a riskLevel string to its Tailwind colour token name.
 *
 * @param {'low'|'elevated'|'high'|'critical'} level
 * @returns {string} Tailwind token suffix
 */
export function riskLevelToToken(level) {
  const MAP = {
    low:      'risk-green',
    elevated: 'risk-yellow',
    high:     'risk-orange',
    critical: 'risk-red',
  }
  return MAP[level] ?? 'risk-green'
}

/**
 * Map a riskLevel to its hex colour (for MapLibre paint expressions).
 *
 * @param {'low'|'elevated'|'high'|'critical'} level
 * @returns {string} hex colour
 */
export function riskLevelToHex(level) {
  const MAP = {
    low:      '#22C55E',
    elevated: '#EAB308',
    high:     '#F97316',
    critical: '#EF4444',
  }
  return MAP[level] ?? '#22C55E'
}

/**
 * Map a road status to its hex colour (for MapLibre paint expressions).
 *
 * @param {'clear'|'congested'|'restricted'|'blocked'} status
 * @returns {string} hex colour
 */
export function roadStatusToHex(status) {
  const MAP = {
    clear:      '#22C55E',
    congested:  '#EAB308',
    restricted: '#F97316',
    blocked:    '#EF4444',
  }
  return MAP[status] ?? '#8B90A0'
}

/**
 * Map shelter state to Tailwind token.
 *
 * @param {'available'|'strained'|'overloaded'} state
 * @returns {string}
 */
export function shelterStateToToken(state) {
  const MAP = {
    available: 'risk-green',
    strained:  'risk-yellow',
    overloaded:'risk-red',
  }
  return MAP[state] ?? 'risk-green'
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the timeline event status text for a given keyframe index.
 *
 * @param {Array}  timeline
 * @param {number} index
 * @returns {string}
 */
export function getTimelineStatus(timeline, index) {
  return timeline[index]?.statusText ?? timeline[index]?.event ?? ''
}

/**
 * Count the number of buildings at a given risk level in a state.
 *
 * @param {Array}  buildings — merged state buildings
 * @param {string} level
 * @returns {number}
 */
export function countBuildingsByRisk(buildings, level) {
  return buildings.filter((b) => b.riskLevel === level).length
}

/**
 * Compute total shelter utilization percentage across all shelters.
 *
 * @param {Array} shelters — merged state shelters
 * @returns {number} 0–100+
 */
export function totalShelterUtilization(shelters) {
  const activeShelters = shelters.filter(
    (s) => s.utilizationPercent !== undefined && s.utilizationPercent !== null
  )
  if (activeShelters.length === 0) return 0
  const avg = activeShelters.reduce((sum, s) => sum + s.utilizationPercent, 0) / activeShelters.length
  return Math.round(avg)
}

// ─────────────────────────────────────────────────────────────────────────────
// Enrich utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enrich a state array (buildings/roads/shelters) with their static
 * definition metadata (name, coordinates, etc.) that doesn't change
 * between scenarios.
 *
 * @param {Array} stateArray — dynamic state items (have id + state fields)
 * @param {Array} defs       — static definition items (have id + static fields)
 * @returns {Array}
 */
export function enrichWithDefs(stateArray, defs) {
  return stateArray.map((item) => {
    const def = defs.find((d) => d.id === item.id) ?? {}
    return { ...def, ...item } // item (dynamic) takes precedence over def (static)
  })
}

/**
 * Build the full initial state by merging baseline dynamic state with static defs.
 *
 * @param {object} baseline — scenario.baseline
 * @returns {object}
 */
export function buildInitialState(baseline) {
  return {
    ...baseline,
    buildings: enrichWithDefs(baseline.buildings, BUILDING_DEFS),
    roads:     enrichWithDefs(baseline.roads,     ROAD_DEFS),
    shelters:  enrichWithDefs(baseline.shelters,  SHELTER_DEFS),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function deepCloneBaseline(baseline) {
  return {
    ...baseline,
    buildings:        deepCloneArray(baseline.buildings),
    roads:            deepCloneArray(baseline.roads),
    shelters:         deepCloneArray(baseline.shelters),
    stats:            { ...(baseline.stats ?? {}) },
    evacuationRoutes: deepCloneArray(baseline.evacuationRoutes ?? []),
    threatZone:       baseline.threatZone ? { ...baseline.threatZone } : null,
  }
}

function deepCloneArray(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map((item) => ({ ...item }))
}
