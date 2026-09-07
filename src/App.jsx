import { useState } from 'react'
import TopNav      from './components/TopNav.jsx'
import MapPanel    from './components/MapPanel.jsx'
import RightRail   from './components/RightRail.jsx'
import TimelineBar from './components/TimelineBar.jsx'

/**
 * App — Root layout shell.
 *
 * Owns top-level state:
 *   activeScenario       — currently loaded scenario object (null = idle)
 *   currentKeyframeIndex — 0..4 (T+0 → T+30)
 *   isPlaying            — timeline autoplay flag
 *   interventionApplied  — whether intervention has been simulated
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

  return (
    <div className="flex flex-col h-screen w-screen bg-canvas overflow-hidden">

      {/* ── Top navigation / system status ── */}
      <TopNav activeScenario={activeScenario} />

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
    </div>
  )
}
