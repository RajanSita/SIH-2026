/**
 * PresenterModal.jsx
 *
 * Task 8 — Presenter Mode & SIH 2026 Evaluation Guide.
 *
 * Provides a structured 2-minute live demo script, architectural highlights,
 * and keyboard shortcut reference for hackathon presentations.
 */

import { useState } from 'react'

export default function PresenterModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('pitch') // 'pitch' | 'shortcuts' | 'architecture'

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="presenter-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-canvas border border-hairline rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hairline bg-surface/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-accent font-mono text-sm" aria-hidden="true">◈</span>
            <h3
              id="presenter-modal-title"
              className="text-xs font-bold text-ink font-mono tracking-wider uppercase"
            >
              SIH 2026 EVALUATION GUIDE & PRESENTER SCRIPT
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xs font-mono text-ink-faint">ESC to close</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close presenter guide"
              className="w-6 h-6 rounded flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface border border-hairline text-xs font-mono transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-hairline bg-canvas shrink-0">
          <TabButton
            active={activeTab === 'pitch'}
            onClick={() => setActiveTab('pitch')}
            label="2-MIN DEMO SCRIPT"
          />
          <TabButton
            active={activeTab === 'shortcuts'}
            onClick={() => setActiveTab('shortcuts')}
            label="KEYBOARD SHORTCUTS"
          />
          <TabButton
            active={activeTab === 'architecture'}
            onClick={() => setActiveTab('architecture')}
            label="THREE-LAYER INTELLIGENCE"
          />
        </div>

        {/* ── Tab Content Area ── */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Tab 1: 2-Minute Demo Script */}
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              <div className="p-3 rounded border border-accent/30 bg-accent/10">
                <p className="text-xs font-bold text-accent mb-1">
                  CORE ELEVATOR PITCH FOR JUDGES:
                </p>
                <p className="text-2xs text-ink-dim leading-relaxed">
                  "Traditional disaster dashboards show what IS happening. The Urban Resilience Twin shows what WILL happen next through cascade prediction, and gives incident commanders the exact optimal countermeasure to reverse systemic collapse."
                </p>
              </div>

              <div className="space-y-3">
                <StepRow
                  step="01"
                  title="OBSERVE THE INITIAL EVENT (T+0)"
                  desc="Click 'HOSTILE ATTACK' (or key '1'). Point out India Gate impact zone, security cordons on Kartavya Path, and the 10 landmarks visualized in 3D."
                />
                <StepRow
                  step="02"
                  title="RUN THE PREDICTIVE TIMELINE (T+0 → T+30)"
                  desc="Press SPACEBAR or Play. Point out the cascading degradation: at T+10 Janpath blocks, at T+15 Talkatora Stadium hits 95% load, by T+30 district-wide cascade failure looms with hospital access falling to 12%."
                />
                <StepRow
                  step="03"
                  title="EXPLAIN THE AI CAUSAL ENGINE"
                  desc="Direct judges' eyes to the CAUSAL BREAKDOWN panel. Notice Shelter Deficit (82%) is automatically detected as the primary driver behind the bottleneck."
                />
                <StepRow
                  step="04"
                  title="TRIGGER DECISION INTELLIGENCE (INTERVENTION)"
                  desc="Click 'SIMULATE INTERVENTION' (or key 'I'). Watch the digital twin reconfigure in real time: Pragati Maidan temporary shelter deploys, Ring Road corridor clears, and evac time drops by 7 minutes (-29%)!"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Keyboard Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <p className="text-2xs text-ink-faint mb-2">
                Use these global hotkeys anytime during the live demonstration:
              </p>

              <div className="border border-hairline rounded divide-y divide-hairline bg-surface/30">
                <ShortcutRow keyCombo="1 / 2 / 3" label="Instant Scenarios" desc="Hostile Attack (1), Earthquake (2), Flash Flood (3)" />
                <ShortcutRow keyCombo="Space" label="Play / Pause" desc="Toggle timeline autoplay simulation" />
                <ShortcutRow keyCombo="← / →" label="Step Timeline" desc="Move backward / forward one keyframe" />
                <ShortcutRow keyCombo="Home / End" label="Rewind / Final" desc="Jump to T+0 baseline or T+30 cascade" />
                <ShortcutRow keyCombo="I" label="Intervention Toggle" desc="Apply or revert AI countermeasure" />
                <ShortcutRow keyCombo="P or ?" label="Presenter Guide" desc="Toggle this presentation script modal" />
                <ShortcutRow keyCombo="Click Map" label="3D Inspection" desc="Click any building or shelter on map for live telemetry" />
              </div>
            </div>
          )}

          {/* Tab 3: Three-Layer Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-3">
              <LayerCard
                layer="LAYER 1: OBSERVATION"
                question="What is happening now?"
                example="Real-time 3D building risk heights, road closures, shelter utilization."
                statusColor="text-risk-green"
              />
              <LayerCard
                layer="LAYER 2: PREDICTION"
                question="What will happen next if unaddressed?"
                example="Keyframe cascade simulation predicting hospital access loss and shelter overload in 15 minutes."
                statusColor="text-risk-yellow"
              />
              <LayerCard
                layer="LAYER 3: DECISION"
                question="What should commanders do right now?"
                example="Actionable countermeasure: deploy Zone C temporary shelter + open emergency corridor to cut evacuation time by 29%."
                statusColor="text-accent"
              />
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-5 py-3 border-t border-hairline bg-surface/40 flex items-center justify-between shrink-0">
          <span className="text-2xs text-ink-faint font-mono">
            Antigravity · Team SIH 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-accent hover:bg-accent-dim text-white text-xs font-mono font-semibold transition-colors"
          >
            Ready to Present
          </button>
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-2xs font-mono font-bold tracking-wider border-b-2 transition-colors ${
        active
          ? 'border-accent text-accent'
          : 'border-transparent text-ink-faint hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

function StepRow({ step, title, desc }) {
  return (
    <div className="flex items-start gap-3 p-2.5 rounded bg-surface/40 border border-hairline/60">
      <span className="text-accent font-bold text-xs shrink-0 px-1.5 py-0.5 rounded bg-accent/15 border border-accent/30">
        {step}
      </span>
      <div>
        <p className="text-xs font-bold text-ink mb-0.5">{title}</p>
        <p className="text-2xs text-ink-dim leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function ShortcutRow({ keyCombo, label, desc }) {
  return (
    <div className="flex items-center justify-between p-2.5 text-2xs">
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-0.5 rounded bg-surface border border-hairline text-ink font-bold text-2xs">
          {keyCombo}
        </kbd>
        <span className="text-ink-dim font-semibold">{label}</span>
      </div>
      <span className="text-ink-faint">{desc}</span>
    </div>
  )
}

function LayerCard({ layer, question, example, statusColor }) {
  return (
    <div className="p-3 rounded bg-surface/40 border border-hairline">
      <span className={`text-2xs font-bold tracking-wider uppercase ${statusColor} block mb-1`}>
        {layer}
      </span>
      <p className="text-xs font-semibold text-ink mb-1">{question}</p>
      <p className="text-2xs text-ink-faint leading-relaxed">{example}</p>
    </div>
  )
}
