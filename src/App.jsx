import { useState, useEffect } from 'react'
import TopNav         from './components/TopNav.jsx'
import MapPanel       from './components/MapPanel.jsx'
import RightRail      from './components/RightRail.jsx'
import TimelineBar    from './components/TimelineBar.jsx'
import PresenterModal from './components/PresenterModal.jsx'
import { ALL_SCENARIOS } from './data/scenarioData.js'

/**
 * App — Root layout shell.
 *
 * Owns top-level state:
 *   activeScenario       — currently loaded scenario object (null = idle)
 *   currentKeyframeIndex — 0..4 (T+0 → T+30)
 *   isPlaying            — timeline autoplay flag
 *   interventionApplied  — whether intervention has been simulated
 *   isPresenterOpen      — presenter script and evaluation guide overlay
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ TopNav (full width)                                     │
 *   ├─────────────────────────────────────┬───────────────────┤
 *   │ MapPanel (~65%)                     │ RightRail (~35%)  │
 *   ├─────────────────────────────────────┴───────────────────┤
 *   │ TimelineBar (full width, thin strip)                    │
 *   └─────────────────────────────────────────────────────────┘
 */
export default function App() {
  // ── Application state ────────────────────────────────────────────────────
  const [activeScenario,       setActiveScenario]       = useState(null)
  const [currentKeyframeIndex, setCurrentKeyframeIndex] = useState(0)
  const [isPlaying,            setIsPlaying]            = useState(false)
  const [interventionApplied,  setInterventionApplied]  = useState(false)
  const [isPresenterOpen,      setIsPresenterOpen]      = useState(false)

  // ── Global Keyboard Shortcuts (Presenter & Demo Controls) ────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't intercept when user is typing in a form or input
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return

      if (e.key === 'p' || e.key === 'P' || e.key === '?') {
        e.preventDefault()
        setIsPresenterOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setIsPresenterOpen(false)
      } else if (e.key === '1') {
        e.preventDefault()
        if (ALL_SCENARIOS[0]) {
          setActiveScenario(ALL_SCENARIOS[0])
          setCurrentKeyframeIndex(0)
          setInterventionApplied(false)
          setIsPlaying(false)
        }
      } else if (e.key === '2') {
        e.preventDefault()
        if (ALL_SCENARIOS[1]) {
          setActiveScenario(ALL_SCENARIOS[1])
          setCurrentKeyframeIndex(0)
          setInterventionApplied(false)
          setIsPlaying(false)
        }
      } else if (e.key === '3') {
        e.preventDefault()
        if (ALL_SCENARIOS[2]) {
          setActiveScenario(ALL_SCENARIOS[2])
          setCurrentKeyframeIndex(0)
          setInterventionApplied(false)
          setIsPlaying(false)
        }
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        if (activeScenario) {
          setInterventionApplied((v) => !v)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeScenario])

  return (
    <div className="flex flex-col h-screen w-screen bg-canvas overflow-hidden">
      {/* ── Top navigation / system status ── */}
      <TopNav
        activeScenario={activeScenario}
        currentKeyframeIndex={currentKeyframeIndex}
        onOpenPresenterModal={() => setIsPresenterOpen(true)}
      />

      {/* ── Main content area ── */}
      <main className="flex flex-1 overflow-hidden" role="main">
        {/* ── Hero map (65%) ── */}
        <MapPanel
          activeScenario={activeScenario}
          currentKeyframeIndex={currentKeyframeIndex}
          interventionApplied={interventionApplied}
        />

        {/* ── Analytics rail (35%) ── */}
        <RightRail
          activeScenario={activeScenario}
          currentKeyframeIndex={currentKeyframeIndex}
          interventionApplied={interventionApplied}
          onInterventionApply={() => setInterventionApplied(true)}
          onInterventionReset={() => setInterventionApplied(false)}
          onScenarioActivate={(scenario) => {
            setActiveScenario(scenario)
            setCurrentKeyframeIndex(0)
            setInterventionApplied(false)
            setIsPlaying(false)
          }}
        />
      </main>

      {/* ── Timeline strip ── */}
      <TimelineBar
        currentIndex={currentKeyframeIndex}
        isPlaying={isPlaying}
        activeScenario={activeScenario}
        onIndexChange={setCurrentKeyframeIndex}
        onPlayingChange={setIsPlaying}
      />

      {/* ── Presenter Mode & Evaluation Guide Overlay ── */}
      <PresenterModal
        isOpen={isPresenterOpen}
        onClose={() => setIsPresenterOpen(false)}
      />
    </div>
  )
}
