/**
 * TimelineBar.jsx
 *
 * Task 5 — Video-editor-style interactive timeline strip beneath the map.
 *
 * Features:
 *   • Play / Pause toggle with auto-stepping (configurable 1x / 2x speed)
 *   • Step forward / backward with boundary guards
 *   • Click-to-jump on any keyframe pill or track position
 *   • Keyboard ARIA slider semantics (ArrowLeft/Right, Home/End, Spacebar)
 *   • Auto-stops at T+30 (or loops if loop mode enabled)
 *   • Dynamic keyframe labels & event descriptions from activeScenario.timeline
 *   • Real-time simulation status ticker and elapsed minutes display
 *   • Strict timer cleanup on unmount, scenario switch, or pause
 */

import { useEffect, useRef, useState, useCallback } from 'react'

const DEFAULT_KEYFRAMES = [
  { index: 0, label: 'T+0',  time: 0,  event: 'THREAT DETECTED' },
  { index: 1, label: 'T+5',  time: 5,  event: 'FIRST IMPACT' },
  { index: 2, label: 'T+10', time: 10, event: 'ROAD DEGRADING' },
  { index: 3, label: 'T+15', time: 15, event: 'SHELTER CRITICAL' },
  { index: 4, label: 'T+30', time: 30, event: 'CASCADE FAILURE' },
]

export default function TimelineBar({
  currentIndex = 0,
  isPlaying = false,
  activeScenario = null,
  onIndexChange,
  onPlayingChange,
}) {
  const [speed, setSpeed] = useState(1) // 1x or 2x
  const [loop, setLoop] = useState(false)
  const trackRef = useRef(null)

  // Resolve keyframes from scenario or default
  const keyframes = activeScenario?.timeline?.length
    ? activeScenario.timeline.map((kf, i) => ({
        index: i,
        label: kf.label ?? `T+${kf.time ?? i * 5}`,
        time: kf.time ?? (i === 4 ? 30 : i * 5),
        event: kf.event ?? DEFAULT_KEYFRAMES[i]?.event ?? 'EVENT',
        description: kf.description ?? '',
        statusText: kf.statusText ?? '',
      }))
    : DEFAULT_KEYFRAMES

  const totalFrames = keyframes.length
  const currentKeyframe = keyframes[currentIndex] ?? keyframes[0]
  const progressPercent = totalFrames > 1 ? (currentIndex / (totalFrames - 1)) * 100 : 0

  // ── Step Navigation Handlers ──────────────────────────────────────────────
  const handleJump = useCallback((index) => {
    const clamped = Math.max(0, Math.min(index, totalFrames - 1))
    onIndexChange?.(clamped)
  }, [totalFrames, onIndexChange])

  const handleStepBack = useCallback(() => {
    onPlayingChange?.(false)
    handleJump(currentIndex - 1)
  }, [currentIndex, handleJump, onPlayingChange])

  const handleStepForward = useCallback(() => {
    onPlayingChange?.(false)
    handleJump(currentIndex + 1)
  }, [currentIndex, handleJump, onPlayingChange])

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      onPlayingChange?.(false)
    } else {
      // If at end, restart from beginning
      if (currentIndex >= totalFrames - 1) {
        handleJump(0)
      }
      onPlayingChange?.(true)
    }
  }, [isPlaying, currentIndex, totalFrames, handleJump, onPlayingChange])

  const toggleSpeed = () => {
    setSpeed((s) => (s === 1 ? 2 : 1))
  }

  const toggleLoop = () => {
    setLoop((l) => !l)
  }

  // ── Autoplay Interval ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return

    const intervalMs = speed === 2 ? 900 : 1800

    const timer = setInterval(() => {
      onIndexChange?.((prev) => {
        if (prev >= totalFrames - 1) {
          if (loop) {
            return 0
          } else {
            onPlayingChange?.(false)
            return prev
          }
        }
        return prev + 1
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isPlaying, speed, loop, totalFrames, onIndexChange, onPlayingChange])

  // ── Keyboard Accessibility ────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault()
        handleStepBack()
        break
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault()
        handleStepForward()
        break
      case 'Home':
        e.preventDefault()
        onPlayingChange?.(false)
        handleJump(0)
        break
      case 'End':
        e.preventDefault()
        onPlayingChange?.(false)
        handleJump(totalFrames - 1)
        break
      case ' ':
        e.preventDefault()
        handleTogglePlay()
        break
      default:
        break
    }
  }

  // ── Click on Scrubber Track ───────────────────────────────────────────────
  const handleTrackClick = (e) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const fraction = Math.max(0, Math.min(1, clickX / rect.width))
    const targetIdx = Math.round(fraction * (totalFrames - 1))
    onPlayingChange?.(false)
    handleJump(targetIdx)
  }

  return (
    <footer
      className="h-[76px] border-t border-hairline bg-canvas shrink-0 flex items-center px-4 gap-4 select-none relative z-20"
      role="region"
      aria-label="Scenario simulation timeline"
    >
      {/* ── Playback controls ── */}
      <div className="flex items-center gap-1.5 shrink-0" role="toolbar" aria-label="Timeline playback controls">
        {/* Rewind to Start */}
        <ControlButton
          label="Rewind to start (Home)"
          icon="⇤"
          disabled={currentIndex === 0 && !isPlaying}
          onClick={() => {
            onPlayingChange?.(false)
            handleJump(0)
          }}
        />

        {/* Step backward */}
        <ControlButton
          label="Step backward (←)"
          icon="◀"
          disabled={currentIndex === 0}
          onClick={handleStepBack}
        />

        {/* Play / Pause toggle */}
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label={isPlaying ? 'Pause simulation (Space)' : 'Play simulation (Space)'}
          className={`w-9 h-9 flex items-center justify-center rounded font-mono text-sm font-bold transition-all duration-150 relative ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 text-canvas shadow-sm shadow-amber-500/20'
              : 'bg-accent hover:bg-accent-dim text-white shadow-sm shadow-accent/20'
          }`}
        >
          {isPlaying ? (
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-3.5 bg-current rounded-xs" />
              <span className="w-1 h-3.5 bg-current rounded-xs" />
            </span>
          ) : (
            <span className="translate-x-0.5">▶</span>
          )}
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        {/* Step forward */}
        <ControlButton
          label="Step forward (→)"
          icon="▶"
          disabled={currentIndex === totalFrames - 1}
          onClick={handleStepForward}
        />

        {/* Loop toggle */}
        <button
          type="button"
          onClick={toggleLoop}
          aria-label={loop ? 'Loop enabled: Click to disable' : 'Loop disabled: Click to enable'}
          title={loop ? 'Loop playback: ON' : 'Loop playback: OFF'}
          className={`w-7 h-7 flex items-center justify-center rounded text-xs font-mono transition-colors duration-150 border ${
            loop
              ? 'border-accent text-accent bg-accent/10'
              : 'border-hairline text-ink-faint hover:text-ink hover:border-hairline-bright bg-surface/40'
          }`}
        >
          ↻
        </button>

        {/* Speed toggle */}
        <button
          type="button"
          onClick={toggleSpeed}
          aria-label={`Simulation speed: ${speed}x. Click to switch.`}
          title="Toggle playback speed"
          className={`w-7 h-7 flex items-center justify-center rounded text-2xs font-mono font-bold transition-colors duration-150 border ${
            speed === 2
              ? 'border-accent text-accent bg-accent/10'
              : 'border-hairline text-ink-faint hover:text-ink hover:border-hairline-bright bg-surface/40'
          }`}
        >
          {speed}x
        </button>
      </div>

      <div className="w-px h-8 bg-hairline shrink-0" aria-hidden="true" />

      {/* ── Timeline track & keyframe markers ── */}
      <div
        className="flex-1 flex flex-col gap-2 relative focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 rounded p-1"
        tabIndex={0}
        role="slider"
        aria-label="Timeline position"
        aria-valuemin={0}
        aria-valuemax={totalFrames - 1}
        aria-valuenow={currentIndex}
        aria-valuetext={`${currentKeyframe.label} - ${currentKeyframe.event}`}
        onKeyDown={handleKeyDown}
      >
        {/* Keyframe time labels */}
        <div className="flex justify-between items-end px-1" aria-hidden="true">
          {keyframes.map((kf) => {
            const isCurrent = kf.index === currentIndex
            const isPassed = kf.index < currentIndex
            return (
              <button
                key={kf.index}
                type="button"
                tabIndex={-1}
                onClick={() => {
                  onPlayingChange?.(false)
                  handleJump(kf.index)
                }}
                className={`group flex flex-col items-center gap-0.5 cursor-pointer focus:outline-none`}
              >
                <span
                  className={`text-2xs font-mono font-medium transition-colors duration-200 ${
                    isCurrent
                      ? 'text-accent font-bold scale-105'
                      : isPassed
                      ? 'text-ink-dim hover:text-ink'
                      : 'text-ink-faint hover:text-ink'
                  }`}
                >
                  {kf.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Track Bar (Clickable) */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-2 bg-surface border border-hairline/60 rounded-full cursor-pointer group"
          title="Click to seek timeline"
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent/70 to-accent rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Keyframe tick nodes */}
          {keyframes.map((kf) => {
            const pos = totalFrames > 1 ? (kf.index / (totalFrames - 1)) * 100 : 0
            const isCurrent = kf.index === currentIndex
            const isPassed = kf.index <= currentIndex

            return (
              <button
                key={kf.index}
                type="button"
                tabIndex={-1}
                aria-label={`Jump to ${kf.label}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onPlayingChange?.(false)
                  handleJump(kf.index)
                }}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all duration-200 focus:outline-none ${
                  isCurrent
                    ? 'w-4 h-4 bg-accent border-2 border-white shadow-md shadow-accent/40 scale-110 z-10'
                    : isPassed
                    ? 'w-2.5 h-2.5 bg-accent/80 border border-canvas hover:scale-125'
                    : 'w-2.5 h-2.5 bg-surface-raised border border-hairline hover:border-accent hover:scale-125'
                }`}
                style={{ left: `${pos}%` }}
              />
            )
          })}
        </div>

        {/* Event description per keyframe */}
        <div className="flex justify-between px-1" aria-hidden="true">
          {keyframes.map((kf) => {
            const isCurrent = kf.index === currentIndex
            return (
              <span
                key={kf.index}
                className={`text-2xs font-mono truncate max-w-[130px] transition-all duration-200 text-center ${
                  isCurrent
                    ? 'text-accent font-semibold opacity-100'
                    : 'text-ink-faint/60 opacity-60'
                }`}
              >
                {kf.event}
              </span>
            )
          })}
        </div>
      </div>

      <div className="w-px h-8 bg-hairline shrink-0" aria-hidden="true" />

      {/* ── Telemetry & Current Step Display ── */}
      <div className="shrink-0 flex items-center gap-3 bg-surface/50 border border-hairline/80 px-3 py-1.5 rounded min-w-[180px]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="panel-label text-2xs">STEP</span>
            <span className="text-xs font-bold font-mono text-accent">
              {currentKeyframe.label}
            </span>
            <span className="text-2xs text-ink-faint font-mono">
              (+{currentKeyframe.time}m)
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-ink-faint'
              }`}
              aria-hidden="true"
            />
            <span className="text-2xs font-mono text-ink-dim uppercase truncate max-w-[140px]">
              {isPlaying ? 'SIMULATING' : currentKeyframe.event}
            </span>
          </div>
        </div>

        <div className="ml-auto text-right">
          <span className="text-2xs font-mono text-ink-faint">
            {currentIndex + 1}/{totalFrames}
          </span>
        </div>
      </div>
    </footer>
  )
}

function ControlButton({ label, icon, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors duration-150 text-xs font-mono ${
        disabled
          ? 'bg-surface/30 border border-hairline/40 text-ink-faint/40 cursor-not-allowed'
          : 'bg-surface border border-hairline text-ink-dim hover:text-ink hover:border-accent/50 active:bg-surface-raised'
      }`}
    >
      {icon}
    </button>
  )
}
