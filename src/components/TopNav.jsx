/**
 * TopNav — System status bar spanning the full width of the application.
 * Communicates product identity, system health, active scenario state,
 * live clock, and presenter mode toggle.
 */

import { useState, useEffect } from 'react'

const SYSTEM_STATUS = {
  label: 'OPERATIONAL',
  variant: 'operational',
}

export default function TopNav({
  activeScenario = null,
  currentKeyframeIndex = 0,
  onOpenPresenterModal,
}) {
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    function updateClock() {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
      setDateStr(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).toUpperCase()
      )
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header
      className="flex items-center justify-between px-4 h-11 border-b border-hairline shrink-0 bg-canvas z-30 relative select-none"
      role="banner"
    >
      {/* ── Left: product identity ── */}
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <polygon
              points="10,2 18,7 18,13 10,18 2,13 2,7"
              stroke="#3B82F6"
              strokeWidth="1.5"
              fill="none"
            />
            <polygon
              points="10,6 14,8.5 14,11.5 10,14 6,11.5 6,8.5"
              fill="#3B82F6"
              opacity="0.4"
            />
          </svg>
          <span className="text-xs font-semibold text-ink tracking-wide font-mono">
            URBAN RESILIENCE TWIN
          </span>
        </div>

        <span className="w-px h-4 bg-hairline" aria-hidden="true" />

        {/* System status badge */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-risk-green animate-pulse-slow" aria-hidden="true" />
          <span className="badge-operational">{SYSTEM_STATUS.label}</span>
        </div>
      </div>

      {/* ── Centre: active scenario ── */}
      <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
        {activeScenario ? (
          <>
            <span className="panel-label">ACTIVE SCENARIO</span>
            <span className="text-xs font-semibold text-accent font-mono uppercase tracking-wide">
              {activeScenario.name}
            </span>
            <span
              className={`badge-${
                activeScenario.severity === 'HIGH' ? 'critical' : 'elevated'
              }`}
            >
              {activeScenario.severity}
            </span>
            <span className="text-2xs font-mono text-ink-faint border border-hairline/80 px-1 rounded">
              T+{currentKeyframeIndex === 4 ? 30 : currentKeyframeIndex * 5}M
            </span>
          </>
        ) : (
          <span className="panel-label">NO ACTIVE SCENARIO — IDLE MONITORING</span>
        )}
      </div>

      {/* ── Right: system metadata & Presenter guide trigger ── */}
      <div className="flex items-center gap-3 text-ink-faint font-mono text-2xs">
        <span className="hidden md:inline">{dateStr}</span>
        <span className="w-px h-3 bg-hairline hidden md:inline" aria-hidden="true" />
        <span aria-label="Current live time">{timeStr} IST</span>

        <span className="w-px h-3 bg-hairline" aria-hidden="true" />

        {/* Presenter Mode Button */}
        <button
          type="button"
          onClick={onOpenPresenterModal}
          aria-label="Open Presenter Script and Evaluation Guide (P)"
          title="Open Presenter Script & Evaluation Guide (Press P)"
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent hover:text-white transition-all text-2xs font-mono font-bold"
        >
          <span aria-hidden="true">◈</span>
          <span>PRESENTER SCRIPT</span>
          <kbd className="hidden lg:inline text-[9px] px-1 py-0.2 rounded bg-surface border border-hairline opacity-75">
            P
          </kbd>
        </button>

        <span className="w-px h-3 bg-hairline" aria-hidden="true" />
        <span className="hidden lg:inline">SIH 2026</span>
      </div>
    </header>
  )
}
