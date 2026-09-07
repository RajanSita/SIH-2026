/**
 * MapPanel.jsx
 *
 * MapLibre GL JS 3D Digital Twin hero map for Central Delhi.
 *
 * Lifecycle model (StrictMode-safe):
 *   mount → create map once → store in ref → add sources/layers on 'load'
 *   → update GeoJSON data on scenario/keyframe/intervention change
 *   → flyTo camera on scenario ID change
 *   → cleanup: null ref → map.remove()
 *
 * Sources:  sih-buildings | sih-roads | sih-shelters | sih-threat | sih-evac
 * Layers:   extrusion | line | circle | fill (threat) | line (evac)
 */

import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import {
  mergeKeyframeState,
  mergeInterventionState,
  enrichWithDefs,
} from '../utils/scenarioUtils.js'
import {
  buildingsToGeoJSON,
  roadsToGeoJSON,
  sheltersToGeoJSON,
  threatZoneToGeoJSON,
  evacRoutesToGeoJSON,
  EMPTY_FC,
} from '../utils/mapUtils.js'
import { BUILDING_DEFS, ROAD_DEFS, SHELTER_DEFS } from '../data/scenarioData.js'

// ── Map configuration ─────────────────────────────────────────────────────────

// OpenFreeMap liberty style — free, no API key, real OSM data with 3D buildings
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

const DEFAULT_VIEW = {
  center:  [77.2200, 28.6200],
  zoom:    13.0,
  pitch:   48,
  bearing: 0,
}

// ── Source and layer ID registry ──────────────────────────────────────────────

const SRC = Object.freeze({
  THREAT:     'sih-threat',
  EVAC:       'sih-evac',
  ROADS:      'sih-roads',
  BUILDINGS:  'sih-buildings',
  SHELTERS:   'sih-shelters',
})

const LYR = Object.freeze({
  THREAT_FILL:        'sih-lyr-threat-fill',
  THREAT_BORDER:      'sih-lyr-threat-border',
  EVAC:               'sih-lyr-evac',
  ROADS_CASING:       'sih-lyr-roads-casing',
  ROADS:              'sih-lyr-roads',
  BUILDINGS_EXTRUSION:'sih-lyr-buildings-extrusion',
  SHELTERS_CIRCLE:    'sih-lyr-shelters',
})

// ── Idle city state (shown when no scenario is active) ────────────────────────

function buildIdleState() {
  return {
    buildings: BUILDING_DEFS.map((d) => ({
      ...d,
      riskLevel: 'low',
      status: 'MONITORING',
      extrusionMultiplier: 0.5,
    })),
    roads: ROAD_DEFS.map((d) => ({
      ...d,
      status: 'clear',
      label: 'CLEAR',
    })),
    shelters: SHELTER_DEFS
      .filter((d) => !d.interventionOnly)
      .map((d) => ({
        ...d,
        occupancy: Math.floor(d.capacity * 0.18),
        utilizationPercent: 18,
        state: 'available',
        status: 'STANDBY',
      })),
    threatZone: null,
    evacuationRoutes: [],
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MapPanel({ activeScenario, currentKeyframeIndex, interventionApplied }) {
  const containerRef   = useRef(null)
  const mapRef         = useRef(null)
  const sourcesReady   = useRef(false)

  // ── 1. Initialize map exactly once ────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = new maplibregl.Map({
      container,
      style:   STYLE_URL,
      center:  DEFAULT_VIEW.center,
      zoom:    DEFAULT_VIEW.zoom,
      pitch:   DEFAULT_VIEW.pitch,
      bearing: DEFAULT_VIEW.bearing,
      antialias: true,
    })

    mapRef.current = map
    sourcesReady.current = false

    // Navigation control (zoom + compass)
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right',
    )

    // Once style is loaded: add sources, layers, then apply idle state
    map.once('load', () => {
      if (mapRef.current !== map) return // stale-map guard

      initSources(map)
      initLayers(map)
      sourcesReady.current = true
      applyStateToMap(map, buildIdleState())

      // ── Cursor pointer for interactive 3D layers ─────────────────────────
      const interactiveLayers = [LYR.BUILDINGS_EXTRUSION, LYR.SHELTERS_CIRCLE]
      interactiveLayers.forEach((lyrId) => {
        map.on('mouseenter', lyrId, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', lyrId, () => {
          map.getCanvas().style.cursor = ''
        })
      })

      // ── Building click popup ─────────────────────────────────────────────
      map.on('click', LYR.BUILDINGS_EXTRUSION, (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties || {}
        const coords = e.lngLat

        const riskColor =
          p.riskLevel === 'critical' ? '#EF4444' :
          p.riskLevel === 'high'     ? '#F97316' :
          p.riskLevel === 'elevated' ? '#EAB308' : '#22C55E'

        new maplibregl.Popup({ closeButton: true, offset: [0, -10] })
          .setLngLat(coords)
          .setHTML(`
            <div style="min-width: 175px; font-family: monospace;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <strong style="font-size: 11px; color: #E8EAF0;">${p.name || 'Building'}</strong>
                <span style="font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: bold; text-transform: uppercase; color: ${riskColor}; border: 1px solid ${riskColor}50; background: ${riskColor}15;">
                  ${p.riskLevel || 'LOW'}
                </span>
              </div>
              <div style="font-size: 10px; color: #8B90A0; margin-bottom: 2px;">
                TYPE: <span style="color: #E8EAF0; text-transform: uppercase;">${p.type || 'LANDMARK'}</span>
              </div>
              <div style="font-size: 10px; color: #8B90A0; margin-bottom: 2px;">
                STATUS: <span style="color: #E8EAF0; font-weight: bold;">${p.status || 'OPERATIONAL'}</span>
              </div>
              ${p.population ? `<div style="font-size: 10px; color: #8B90A0;">POPULATION: <span style="color: #E8EAF0;">${Number(p.population).toLocaleString()}</span></div>` : ''}
            </div>
          `)
          .addTo(map)
      })

      // ── Shelter click popup ──────────────────────────────────────────────
      map.on('click', LYR.SHELTERS_CIRCLE, (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties || {}
        const coords = e.lngLat

        const stateColor =
          p.state === 'overloaded' ? '#EF4444' :
          p.state === 'strained'   ? '#EAB308' : '#22C55E'

        new maplibregl.Popup({ closeButton: true, offset: [0, -10] })
          .setLngLat(coords)
          .setHTML(`
            <div style="min-width: 180px; font-family: monospace;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <strong style="font-size: 11px; color: #E8EAF0;">${p.name || 'Emergency Shelter'}</strong>
                <span style="font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: bold; text-transform: uppercase; color: ${stateColor}; border: 1px solid ${stateColor}50; background: ${stateColor}15;">
                  ${p.state || 'AVAILABLE'}
                </span>
              </div>
              <div style="font-size: 10px; color: #8B90A0; margin-bottom: 2px;">
                CAPACITY: <span style="color: #E8EAF0;">${Number(p.capacity || 0).toLocaleString()}</span>
              </div>
              ${p.occupancy ? `<div style="font-size: 10px; color: #8B90A0;">OCCUPANCY: <span style="color: #E8EAF0; font-weight: bold;">${Number(p.occupancy).toLocaleString()} (${p.utilizationPercent || 0}%)</span></div>` : ''}
              <div style="font-size: 10px; color: #8B90A0; margin-top: 2px;">
                STATUS: <span style="color: #E8EAF0;">${p.status || 'ACCEPTING'}</span>
              </div>
            </div>
          `)
          .addTo(map)
      })
    })

    map.on('error', (e) => {
      console.warn('[MapPanel] error:', e?.error?.message ?? e)
    })

    // Cleanup
    return () => {
      sourcesReady.current = false
      mapRef.current = null
      map.remove()
    }
  }, []) // ← empty dep array: create map only once

  // ── 2. Update map data on scenario / keyframe / intervention change ────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function doUpdate() {
      if (mapRef.current !== map) return
      if (!sourcesReady.current) return
      const state = resolveCityState(activeScenario, currentKeyframeIndex, interventionApplied)
      applyStateToMap(map, state)
    }

    if (sourcesReady.current && map.isStyleLoaded()) {
      doUpdate()
    } else {
      // Wait for map to finish loading before updating
      map.once('idle', doUpdate)
      return () => map.off('idle', doUpdate)
    }
  }, [activeScenario, currentKeyframeIndex, interventionApplied])

  // ── 3. Fly camera when scenario changes ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const cfg = activeScenario?.mapConfig
    map.flyTo({
      center:  cfg?.center  ?? DEFAULT_VIEW.center,
      zoom:    cfg?.zoom    ?? DEFAULT_VIEW.zoom,
      pitch:   cfg?.pitch   ?? DEFAULT_VIEW.pitch,
      bearing: cfg?.bearing ?? DEFAULT_VIEW.bearing,
      duration: 1800,
      essential: true,
    })
  }, [activeScenario?.id]) // ← only fires on scenario ID change, not on keyframe updates

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative flex-1 overflow-hidden bg-[#0d1117]"
      role="region"
      aria-label="3D Digital Twin map — Central Delhi"
    >
      {/* MapLibre canvas fills the entire panel */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* UI overlays rendered above the map */}
      <MapOverlays activeScenario={activeScenario} />
    </div>
  )
}

// ── Source initialisation ─────────────────────────────────────────────────────

function initSources(map) {
  const order = [SRC.THREAT, SRC.EVAC, SRC.ROADS, SRC.BUILDINGS, SRC.SHELTERS]
  order.forEach((id) => {
    if (!map.getSource(id)) {
      map.addSource(id, { type: 'geojson', data: EMPTY_FC })
    }
  })
}

// ── Layer initialisation ──────────────────────────────────────────────────────

function initLayers(map) {
  const layerSpecs = [
    // ── Threat zone fill ────────────────────────────────────────────────────
    {
      id:     LYR.THREAT_FILL,
      type:   'fill',
      source: SRC.THREAT,
      paint: {
        'fill-color':   '#EF4444',
        'fill-opacity': 0.09,
      },
    },
    // ── Threat zone border (dashed) ─────────────────────────────────────────
    {
      id:     LYR.THREAT_BORDER,
      type:   'line',
      source: SRC.THREAT,
      paint: {
        'line-color':       '#EF4444',
        'line-width':       2,
        'line-opacity':     0.55,
        'line-dasharray':   [4, 2],
      },
    },
    // ── Evacuation routes ──────────────────────────────────────────────────
    {
      id:     LYR.EVAC,
      type:   'line',
      source: SRC.EVAC,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color':     '#3B82F6',
        'line-width':     3.5,
        'line-opacity':   0.80,
        'line-dasharray': [3, 2],
      },
    },
    // ── Road casing (dark outline for contrast) ─────────────────────────────
    {
      id:     LYR.ROADS_CASING,
      type:   'line',
      source: SRC.ROADS,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color':     '#000000',
        'line-width':     ['get', 'width'],
        'line-opacity':   0.18,
        'line-gap-width': 1,
      },
    },
    // ── Roads (data-driven colour + width) ──────────────────────────────────
    {
      id:     LYR.ROADS,
      type:   'line',
      source: SRC.ROADS,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color':   ['get', 'color'],
        'line-width':   ['get', 'width'],
        'line-opacity': ['get', 'opacity'],
      },
    },
    // ── Buildings (3D extrusion) ────────────────────────────────────────────
    {
      id:     LYR.BUILDINGS_EXTRUSION,
      type:   'fill-extrusion',
      source: SRC.BUILDINGS,
      paint: {
        'fill-extrusion-color':   ['get', 'color'],
        'fill-extrusion-height':  ['get', 'height'],
        'fill-extrusion-base':    ['get', 'baseHeight'],
        'fill-extrusion-opacity': 0.85,
      },
    },
    // ── Shelters (circles) ─────────────────────────────────────────────────
    {
      id:     LYR.SHELTERS_CIRCLE,
      type:   'circle',
      source: SRC.SHELTERS,
      paint: {
        'circle-radius':         ['get', 'radius'],
        'circle-color':          ['get', 'color'],
        'circle-opacity':        0.92,
        'circle-stroke-width':   2.5,
        'circle-stroke-color':   '#0d1117',
        'circle-stroke-opacity': 0.85,
      },
    },
  ]

  layerSpecs.forEach((spec) => {
    if (!map.getLayer(spec.id)) {
      map.addLayer(spec)
    }
  })
}

// ── GeoJSON source data update ────────────────────────────────────────────────

function applyStateToMap(map, cityState) {
  const { buildings, roads, shelters, threatZone, evacuationRoutes } = cityState

  safeSetData(map, SRC.BUILDINGS, buildingsToGeoJSON(buildings))
  safeSetData(map, SRC.ROADS,     roadsToGeoJSON(roads))
  safeSetData(map, SRC.SHELTERS,  sheltersToGeoJSON(shelters))
  safeSetData(map, SRC.THREAT,    threatZoneToGeoJSON(threatZone))
  safeSetData(map, SRC.EVAC,      evacRoutesToGeoJSON(evacuationRoutes ?? []))
}

function safeSetData(map, sourceId, data) {
  const src = map.getSource(sourceId)
  if (src) src.setData(data)
}

// ── City state resolver ───────────────────────────────────────────────────────

function resolveCityState(activeScenario, currentKeyframeIndex, interventionApplied) {
  if (!activeScenario) return buildIdleState()

  const raw = interventionApplied
    ? mergeInterventionState(activeScenario.baseline, activeScenario.intervention)
    : mergeKeyframeState(activeScenario.baseline, activeScenario.timeline, currentKeyframeIndex)

  return {
    buildings:       enrichWithDefs(raw.buildings ?? [],     BUILDING_DEFS),
    roads:           enrichWithDefs(raw.roads ?? [],         ROAD_DEFS),
    shelters:        enrichWithDefs(raw.shelters ?? [],      SHELTER_DEFS),
    threatZone:      raw.threatZone ?? null,
    evacuationRoutes: raw.evacuationRoutes ?? [],
  }
}

// ── Map UI overlays ───────────────────────────────────────────────────────────

function MapOverlays({ activeScenario }) {
  return (
    <>
      {/* Active scenario badge */}
      {activeScenario && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-canvas/80 border border-hairline rounded-full backdrop-blur-sm animate-fade-in pointer-events-none z-10"
          role="status"
          aria-live="polite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-risk-red animate-pulse" aria-hidden="true" />
          <span className="text-2xs font-mono text-ink uppercase tracking-widest">
            {activeScenario.displayName}
          </span>
          <span className="w-px h-3 bg-hairline" aria-hidden="true" />
          <span className="text-2xs font-mono text-risk-red">LIVE</span>
        </div>
      )}

      {/* Coordinates — top left */}
      <div
        className="absolute top-3 left-3 text-2xs font-mono text-ink-faint opacity-50 pointer-events-none z-10"
        aria-hidden="true"
      >
        28.6200°N · 77.2200°E
      </div>

      {/* Map attribution / data credit — bottom right */}
      <div
        className="absolute bottom-8 right-24 text-2xs font-mono text-ink-faint opacity-40 pointer-events-none z-10"
        aria-hidden="true"
      >
        Central Delhi · © OpenStreetMap
      </div>

      {/* Risk level legend — bottom left */}
      <div
        className="absolute bottom-8 left-3 flex items-center gap-3 px-3 py-2 bg-canvas/80 border border-hairline rounded backdrop-blur-sm pointer-events-none z-10"
        aria-label="Map risk legend"
        role="img"
      >
        {[
          { cls: 'bg-risk-green',  label: 'LOW' },
          { cls: 'bg-risk-yellow', label: 'ELEVATED' },
          { cls: 'bg-risk-orange', label: 'HIGH' },
          { cls: 'bg-risk-red',    label: 'CRITICAL' },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${cls} opacity-90`} aria-hidden="true" />
            <span className="text-2xs font-mono text-ink-faint">{label}</span>
          </div>
        ))}

        <span className="w-px h-3 bg-hairline" aria-hidden="true" />

        {/* Evac route legend swatch */}
        <div className="flex items-center gap-1.5">
          <svg width="14" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="14" y2="3" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="4 2" />
          </svg>
          <span className="text-2xs font-mono text-ink-faint">EVAC ROUTE</span>
        </div>

        {/* Shelter legend swatch */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-risk-green opacity-90" aria-hidden="true" />
          <span className="text-2xs font-mono text-ink-faint">SHELTER</span>
        </div>
      </div>
    </>
  )
}
