/**
 * ScenarioChat.jsx
 *
 * Task 4 — Scenario input with keyword matcher + fake AI processing animation.
 *
 * Features:
 *   • Preset chips  — instant scenario load, no AI delay
 *   • Text input    — natural language → AI processing animation → keyword match
 *   • Processing    — 4-step sequential indicator (~420ms per step, ~1.7s total)
 *   • Interpretation card — structured summary of activated scenario
 *
 * Props:
 *   onScenarioActivate(scenario) — called with matched scenario object
 *   activeScenario               — currently active scenario (null = idle)
 */

import { useState, useRef, useEffect } from 'react'
import { matchScenario, getScenarioById } from '../data/scenarioData.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESETS = [
  { id: 'security-attack', label: 'HOSTILE ATTACK', color: 'text-risk-red   border-risk-red/30   hover:bg-risk-red/10'   },
  { id: 'earthquake',      label: 'EARTHQUAKE',     color: 'text-risk-orange border-risk-orange/30 hover:bg-risk-orange/10' },
  { id: 'flood',           label: 'FLOOD',          color: 'text-accent      border-accent/30      hover:bg-accent/10'      },
]

const PROCESSING_STEPS = [
  'INTERPRETING SCENARIO',
  'IDENTIFYING THREAT',
  'RESOLVING LOCATION',
  'PROJECTING IMPACT',
]

/** Duration (ms) per processing step — total animation ≈ 1.7 s */
const STEP_MS = 420

// ── Helper: derive qualitative labels ────────────────────────────────────────

function deriveExposure(scenario) {
  const pop = scenario.baseline?.stats?.populationAtRisk ?? 0
  if (pop >= 35000) return 'CRITICAL'
  if (pop >= 22000) return 'HIGH'
  if (pop >= 12000) return 'ELEVATED'
  return 'MODERATE'
}

function deriveInfraRisk(scenario) {
  const v = scenario.causalFactors?.infrastructure?.value ?? 0
  if (v >= 70) return 'CRITICAL'
  if (v >= 50) return 'HIGH'
  if (v >= 30) return 'ELEVATED'
  return 'MODERATE'
}

function severityToColor(value) {
  switch (value) {
    case 'HIGH':     return 'text-risk-red'
    case 'CRITICAL': return 'text-risk-red'
    case 'ELEVATED': return 'text-risk-yellow'
    case 'MODERATE': return 'text-risk-yellow'
    default:         return 'text-ink'
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScenarioChat({ onScenarioActivate, activeScenario }) {
  const [inputValue,     setInputValue]     = useState('')
  const [processingStep, setProcessingStep] = useState(-1)   // -1 = idle, 0-3 = processing
  const [lastInput,      setLastInput]      = useState('')    // shown during processing

  const timersRef = useRef([])

  // Cleanup timers on unmount
  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  // ── Timer management ───────────────────────────────────────────────────────

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  // ── Activation ────────────────────────────────────────────────────────────

  function startProcessing(rawInput) {
    clearTimers()
    setLastInput(rawInput)
    setProcessingStep(0)

    // Step 1-3 with increasing delay
    const stepTimers = [1, 2, 3].map((i) =>
      setTimeout(() => setProcessingStep(i), STEP_MS * i)
    )

    // Final timer: match + activate
    const finalTimer = setTimeout(() => {
      const matched = matchScenario(rawInput)
      onScenarioActivate(matched)
      setProcessingStep(-1)
      setInputValue('')
    }, STEP_MS * PROCESSING_STEPS.length)

    timersRef.current = [...stepTimers, finalTimer]
  }

  function handleSubmit(e) {
    e?.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || processingStep >= 0) return
    startProcessing(trimmed)
  }

  function handlePreset(id) {
    clearTimers()
    setProcessingStep(-1)
    const scenario = getScenarioById(id)
    if (scenario) onScenarioActivate(scenario)
  }

  const isProcessing = processingStep >= 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section
      className="border-t border-hairline shrink-0 flex flex-col"
      aria-label="Scenario input and control"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-hairline">
        <span className="panel-label">SCENARIO INPUT</span>
        {activeScenario && !isProcessing && (
          <span className="text-2xs font-mono text-accent border border-accent/30 rounded px-1.5 py-0.5 animate-fade-in">
            ACTIVE
          </span>
        )}
        {isProcessing && (
          <span className="text-2xs font-mono text-risk-yellow animate-pulse">
            PROCESSING…
          </span>
        )}
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">

        {/* ── Preset chips ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preset scenarios">
          {PRESETS.map(({ id, label, color }) => {
            const isActive = activeScenario?.id === id && !isProcessing
            return (
              <button
                key={id}
                id={`preset-${id}`}
                onClick={() => handlePreset(id)}
                disabled={isProcessing}
                aria-pressed={isActive}
                aria-label={`Load ${label} scenario`}
                className={`text-2xs font-mono rounded px-2.5 py-1.5 border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? `${color} opacity-100 font-semibold`
                    : `border-hairline text-ink-dim hover:text-ink ${color}`
                }`}
              >
                {isActive && <span className="mr-1.5 opacity-75" aria-hidden="true">▸</span>}
                {label}
              </button>
            )
          })}
        </div>

        {/* ── Text input ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="relative">
            <input
              id="scenario-text-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isProcessing ? `"${lastInput}"` : 'Describe a scenario in natural language…'}
              disabled={isProcessing}
              aria-label="Scenario description"
              aria-busy={isProcessing}
              className={`w-full bg-surface border rounded px-3 py-2.5 text-xs font-mono pr-10
                placeholder:text-ink-faint focus:outline-none transition-colors duration-150
                ${isProcessing
                  ? 'border-accent/30 text-ink-faint cursor-not-allowed'
                  : 'border-hairline text-ink focus:border-accent/50'}
              `}
            />
            {!isProcessing && (
              <button
                type="submit"
                aria-label="Submit scenario"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint hover:text-accent transition-colors duration-150"
              >
                ↵
              </button>
            )}
          </div>
        </form>

        {/* ── Processing animation ───────────────────────────────────────── */}
        {isProcessing && (
          <div
            className="flex flex-col gap-1.5 animate-fade-in"
            role="status"
            aria-live="assertive"
            aria-label={`Processing: ${PROCESSING_STEPS[processingStep] ?? ''}`}
          >
            {PROCESSING_STEPS.map((step, i) => (
              <StepIndicator
                key={step}
                label={step}
                phase={
                  i < processingStep  ? 'done'
                  : i === processingStep ? 'active'
                  : 'pending'
                }
              />
            ))}
          </div>
        )}

        {/* ── Interpretation card ────────────────────────────────────────── */}
        {!isProcessing && activeScenario && (
          <InterpretationCard key={activeScenario.id} scenario={activeScenario} />
        )}

        {/* ── Idle hint ─────────────────────────────────────────────────── */}
        {!isProcessing && !activeScenario && (
          <p className="text-2xs text-ink-faint text-center py-1 animate-fade-in">
            Select a preset or describe a scenario above
          </p>
        )}
      </div>
    </section>
  )
}

// ── StepIndicator ─────────────────────────────────────────────────────────────

function StepIndicator({ label, phase }) {
  return (
    <div
      className={`flex items-center gap-2.5 transition-all duration-200 ${
        phase === 'active'  ? 'opacity-100'
        : phase === 'done' ? 'opacity-35'
        : 'opacity-15'
      }`}
    >
      {/* Dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          phase === 'done'   ? 'bg-risk-green'
          : phase === 'active' ? 'bg-accent animate-pulse'
          : 'bg-ink-faint'
        }`}
        aria-hidden="true"
      />

      {/* Label */}
      <span className={`text-2xs font-mono uppercase tracking-wider ${
        phase === 'active' ? 'text-ink' : 'text-ink-faint'
      }`}>
        {label}
        {phase === 'active' && (
          <span className="animate-pulse">…</span>
        )}
      </span>

      {/* Checkmark for done */}
      {phase === 'done' && (
        <span className="ml-auto text-2xs text-risk-green font-mono" aria-hidden="true">✓</span>
      )}
    </div>
  )
}

// ── InterpretationCard ────────────────────────────────────────────────────────

function InterpretationCard({ scenario }) {
  const exposure   = deriveExposure(scenario)
  const infraRisk  = deriveInfraRisk(scenario)

  const rows = [
    { label: 'THREAT TYPE',    value: scenario.threatType,    valueColor: 'text-accent' },
    { label: 'SEVERITY',       value: scenario.severity,      valueColor: severityToColor(scenario.severity) },
    { label: 'LOCATION',       value: scenario.location,      valueColor: 'text-ink' },
    { label: 'EXPOSURE',       value: exposure,               valueColor: severityToColor(exposure) },
    { label: 'INFRASTRUCTURE', value: infraRisk,              valueColor: severityToColor(infraRisk) },
  ]

  return (
    <div
      className="border border-hairline rounded overflow-hidden animate-slide-up"
      role="region"
      aria-label={`Scenario interpretation: ${scenario.displayName}`}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface border-b border-hairline">
        <span
          className="w-1.5 h-1.5 rounded-full bg-risk-red animate-pulse"
          aria-hidden="true"
        />
        <span className="text-2xs font-mono text-ink-dim uppercase tracking-widest">
          SCENARIO DETECTED
        </span>
        <span className="ml-auto text-2xs font-mono text-ink-faint">
          {scenario.id === 'generic' ? 'FALLBACK' : 'MATCHED'}
        </span>
      </div>

      {/* Data rows */}
      <div className="divide-y divide-hairline">
        {rows.map(({ label, value, valueColor }) => (
          <div key={label} className="flex items-center justify-between px-3 py-1.5">
            <span className="text-2xs font-mono text-ink-faint">{label}</span>
            <span className={`text-2xs font-mono font-semibold ${valueColor}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
