/**
 * MapPanel.jsx
 *
 * MapLibre GL JS 3D Digital Twin hero map for Central Delhi.
 *
 * Features:
 *   • Self-contained dark tactical style using OpenStreetMap with dark shader matrix
 *     (Zero watermarks, zero API keys, instant load)
 *   • 5 GeoJSON layers: 3D extruded buildings, multi-state roads, shelters, threat zone, evac routes
 *   • Interactive 3D landmark markers floating over key locations with real-time risk badges
 *   • Hover & click inspection popups for real-time facility telemetry
 *   • StrictMode-safe lifecycle: map instance created once in ref
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

// ── Inline Dark Tactical Style (Zero watermark, zero API key, dark raster filter) ──
const DARK_TACTICAL_STYLE = {
  version: 8,
  sources: {
    'osm-base': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#08090B',
      },
    },
    {
      id: 'osm-dark-layer',
      type: 'raster',
      source: 'osm-base',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-brightness-max': 0.42,
        'raster-brightness-min': 0.05,
        'raster-contrast': 0.35,
        'raster-saturation': -0.92,
      },
    },
  ],
}

const DEFAULT_VIEW = {
  center:  [77.2250, 28.6180],
  zoom:    13.6,
  pitch:   54,
  bearing: -12,
}

// ── Source and layer ID registry ──────────────────────────────────────────────

const SRC = Object.freeze({
  THREAT:    'sih-threat',
  EVAC:      'sih-evac',
  ROADS:     'sih-roads',
  BUILDINGS: 'sih-buildings',
})

const LYR = Object.freeze({
  THREAT_FILL:         'sih-lyr-threat-fill',
  THREAT_BORDER:       'sih-lyr-threat-border',
  EVAC_CASING:         'sih-lyr-evac-casing',
  EVAC:                'sih-lyr-evac',
  ROADS_CASING:        'sih-lyr-roads-casing',
  ROADS:               'sih-lyr-roads',
  BUILDINGS_EXTRUSION: 'sih-lyr-buildings-extrusion',
})

// ── Idle city state (shown when no scenario is active) ────────────────────────

function buildIdleState() {
  return {
    buildings: [
      ...BUILDING_DEFS.map((d) => ({
        ...d,
        riskLevel: 'low',
        status: 'MONITORING',
        extrusionMultiplier: 0.8,
      })),
      // Shelters rendered as buildings (green, low profile)
      ...SHELTER_DEFS
        .filter((d) => !d.interventionOnly)
        .map((d) => ({
          ...d,
          riskLevel: 'low',
          status: 'STANDBY',
          extrusionMultiplier: 1.0,
          occupancy: Math.floor(d.capacity * 0.18),
          utilizationPercent: 18,
          state: 'available',
          isShelter: true,
        })),
    ],
    roads: ROAD_DEFS.map((d) => ({
      ...d,
      status: 'clear',
      label: 'CLEAR',
    })),
    shelters: [], // kept for popup data only, not rendered as circles
    threatZone: null,
    evacuationRoutes: [],
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MapPanel({ activeScenario, currentKeyframeIndex, interventionApplied }) {
  const containerRef   = useRef(null)
  const mapRef         = useRef(null)
  const sourcesReady   = useRef(false)
  const markersRef     = useRef([])

  // ── 1. Initialize map exactly once ────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = new maplibregl.Map({
      container,
      style: DARK_TACTICAL_STYLE,
      center: DEFAULT_VIEW.center,
      zoom: DEFAULT_VIEW.zoom,
      pitch: DEFAULT_VIEW.pitch,
      bearing: DEFAULT_VIEW.bearing,
      antialias: true,
    })

    mapRef.current = map
    window.__map = map
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
      
      const initialState = buildIdleState()
      applyStateToMap(map, initialState)
      syncHTMLMarkers(map, initialState, markersRef)

      // ── Cursor pointer for interactive 3D layers ─────────────────────────
      const interactiveLayers = [LYR.BUILDINGS_EXTRUSION]
      interactiveLayers.forEach((lyrId) => {
        map.on('mouseenter', lyrId, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', lyrId, () => {
          map.getCanvas().style.cursor = ''
        })
      })

      // ── Building / shelter click popup ──────────────────────────────────
      map.on('click', LYR.BUILDINGS_EXTRUSION, (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties || {}
        const coords = e.lngLat
        if (p.isShelter) {
          showShelterPopup(map, p, coords)
        } else {
          showBuildingPopup(map, p, coords)
        }
      })
    })

    map.on('error', (e) => {
      console.warn('[MapPanel] notice:', e?.error?.message ?? e)
    })

    // Cleanup
    return () => {
      sourcesReady.current = false
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
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
      syncHTMLMarkers(map, state, markersRef)
    }

    if (sourcesReady.current) {
      doUpdate()
    } else {
      map.once('load', doUpdate)
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
  }, [activeScenario?.id])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative flex-1 overflow-hidden bg-[#08090B]"
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
  const order = [SRC.THREAT, SRC.EVAC, SRC.ROADS, SRC.BUILDINGS]
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
        'fill-opacity': 0.16,
      },
    },
    // ── Threat zone border (dashed) ─────────────────────────────────────────
    {
      id:     LYR.THREAT_BORDER,
      type:   'line',
      source: SRC.THREAT,
      paint: {
        'line-color':       '#EF4444',
        'line-width':       2.5,
        'line-opacity':     0.85,
        'line-dasharray':   [4, 2],
      },
    },
    // ── Evac route dark casing for contrast ──────────────────────────────────
    {
      id:     LYR.EVAC_CASING,
      type:   'line',
      source: SRC.EVAC,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color':   '#000000',
        'line-width':   ['+', ['get', 'width'], 3],
        'line-opacity': 0.50,
      },
    },
    // ── Evacuation routes — data-driven colour, width, opacity ───────────────
    {
      id:     LYR.EVAC,
      type:   'line',
      source: SRC.EVAC,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color':   ['get', 'color'],
        'line-width':   ['get', 'width'],
        'line-opacity': ['get', 'opacity'],
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
        'line-width':     ['+', ['get', 'width'], 3],
        'line-opacity':   0.60,
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
    // ── Buildings + Shelters (shared 3D extrusion layer) ────────────────────
    {
      id:     LYR.BUILDINGS_EXTRUSION,
      type:   'fill-extrusion',
      source: SRC.BUILDINGS,
      paint: {
        'fill-extrusion-color':   ['get', 'color'],
        'fill-extrusion-height':  ['get', 'height'],
        'fill-extrusion-base':    ['get', 'baseHeight'],
        'fill-extrusion-opacity': 0.92,
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

  // Merge shelter buildings into the same source as landmark buildings
  const enrichedShelters = Array.isArray(shelters)
    ? shelters.map((s) => ({ ...s, isShelter: true }))
    : []
  const allBuildings = [...(buildings ?? []), ...enrichedShelters]

  safeSetData(map, SRC.BUILDINGS, buildingsToGeoJSON(allBuildings))
  safeSetData(map, SRC.ROADS,     roadsToGeoJSON(roads))
  safeSetData(map, SRC.THREAT,    threatZoneToGeoJSON(threatZone))
  safeSetData(map, SRC.EVAC,      evacRoutesToGeoJSON(evacuationRoutes))
}

function safeSetData(map, sourceId, data) {
  const src = map.getSource(sourceId)
  if (src) {
    src.setData(data)
  }
}

// ── HTML Landmark Badges (Floating on map) ─────────────────────────────────────

function syncHTMLMarkers(map, cityState, markersRef) {
  // Clear old markers
  markersRef.current.forEach((m) => m.remove())
  markersRef.current = []

  const { buildings = [], shelters = [] } = cityState

  // Add building landmark labels
  buildings.forEach((b) => {
    if (!Array.isArray(b.coordinates) || b.coordinates.length !== 2) return

    const el = document.createElement('div')
    el.className = 'group pointer-events-auto cursor-pointer select-none'

    const riskColor =
      b.riskLevel === 'critical' ? '#EF4444' :
      b.riskLevel === 'high'     ? '#F97316' :
      b.riskLevel === 'elevated' ? '#EAB308' : '#22C55E'

    const icon =
      b.type === 'hospital'   ? '🏥' :
      b.type === 'government' ? '🏛️' :
      b.type === 'landmark'   ? '📍' : '🏢'

    el.innerHTML = `
      <div style="
        background: rgba(13, 17, 23, 0.94);
        border: 1px solid ${riskColor}95;
        box-shadow: 0 4px 14px rgba(0,0,0,0.6), 0 0 12px ${riskColor}40;
        border-radius: 4px;
        padding: 3px 6px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: monospace;
        font-size: 10px;
        color: #E8EAF0;
        transform: translateY(-8px);
        transition: transform 0.15s ease;
      ">
        <span style="font-size: 11px;">${icon}</span>
        <span style="font-weight: 700; white-space: nowrap;">${b.name}</span>
        <span style="
          font-size: 8px;
          font-weight: bold;
          text-transform: uppercase;
          color: ${riskColor};
          background: ${riskColor}25;
          border: 1px solid ${riskColor}50;
          padding: 1px 4px;
          border-radius: 2px;
        ">${b.status || b.riskLevel}</span>
      </div>
    `

    el.addEventListener('click', (e) => {
      e.stopPropagation()
      showBuildingPopup(map, b, b.coordinates)
    })

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(b.coordinates)
      .addTo(map)

    markersRef.current.push(marker)
  })

  // Add shelter markers
  shelters.forEach((s) => {
    if (!Array.isArray(s.coordinates) || s.coordinates.length !== 2) return

    const el = document.createElement('div')
    el.className = 'group pointer-events-auto cursor-pointer select-none'

    const stateColor =
      s.state === 'overloaded' ? '#EF4444' :
      s.state === 'strained'   ? '#EAB308' : '#22C55E'

    el.innerHTML = `
      <div style="
        background: rgba(15, 23, 42, 0.94);
        border: 1px solid ${stateColor}95;
        box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        border-radius: 4px;
        padding: 2px 5px;
        display: flex;
        align-items: center;
        gap: 3px;
        font-family: monospace;
        font-size: 9px;
        color: #E8EAF0;
        transform: translateY(12px);
      ">
        <span>⛺</span>
        <span style="font-weight: 700;">${s.name.split(' ')[0]}</span>
        <span style="color: ${stateColor}; font-weight: bold;">${s.utilizationPercent ?? 0}%</span>
      </div>
    `

    el.addEventListener('click', (e) => {
      e.stopPropagation()
      showShelterPopup(map, s, s.coordinates)
    })

    const marker = new maplibregl.Marker({ element: el, anchor: 'top' })
      .setLngLat(s.coordinates)
      .addTo(map)

    markersRef.current.push(marker)
  })
}

// ── Popups ───────────────────────────────────────────────────────────────────

function showBuildingPopup(map, p, coords) {
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
}

function showShelterPopup(map, p, coords) {
  const stateColor =
    p.state === 'overloaded' ? '#EF4444' :
    p.state === 'strained'   ? '#EAB308' : '#22C55E'

  const triageIcon  = p.triageReady ? '🏥 TRIAGE READY' : ''
  const helipadIcon = p.helipad ? '🚁 HELIPAD' : ''

  new maplibregl.Popup({ closeButton: true, offset: [0, -10] })
    .setLngLat(coords)
    .setHTML(`
      <div style="min-width: 200px; font-family: monospace;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 11px; color: #E8EAF0;">⛺ ${p.name || 'Emergency Shelter'}</strong>
          <span style="font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: bold; text-transform: uppercase; color: ${stateColor}; border: 1px solid ${stateColor}50; background: ${stateColor}15;">
            ${(p.state || 'AVAILABLE').toUpperCase()}
          </span>
        </div>
        ${p.zone ? `<div style="font-size: 9px; color: #6B7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">📍 ${p.zone}</div>` : ''}
        <div style="font-size: 10px; color: #8B90A0; margin-bottom: 2px;">
          CAPACITY: <span style="color: #E8EAF0;">${Number(p.capacity || 0).toLocaleString()}</span>
        </div>
        ${p.occupancy ? `<div style="font-size: 10px; color: #8B90A0; margin-bottom: 2px;">OCCUPANCY: <span style="color: ${stateColor}; font-weight: bold;">${Number(p.occupancy).toLocaleString()} (${p.utilizationPercent || 0}%)</span></div>` : ''}
        <div style="font-size: 10px; color: #8B90A0; margin-bottom: 4px;">
          STATUS: <span style="color: #E8EAF0;">${p.status || 'ACCEPTING'}</span>
        </div>
        ${(triageIcon || helipadIcon) ? `
        <div style="display: flex; gap: 8px; margin-top: 4px; border-top: 1px solid #1F2937; padding-top: 4px;">
          ${triageIcon ? `<span style="font-size: 9px; color: #22C55E;">${triageIcon}</span>` : ''}
          ${helipadIcon ? `<span style="font-size: 9px; color: #06B6D4;">${helipadIcon}</span>` : ''}
        </div>` : ''}
      </div>
    `)
    .addTo(map)
}

// ── State resolution ──────────────────────────────────────────────────────────

function resolveCityState(activeScenario, currentKeyframeIndex, interventionApplied) {
  if (!activeScenario) {
    return buildIdleState()
  }

  let state
  if (interventionApplied && activeScenario.intervention) {
    state = mergeInterventionState(activeScenario.baseline, activeScenario.intervention)
  } else {
    state = mergeKeyframeState(
      activeScenario.baseline,
      activeScenario.timeline,
      currentKeyframeIndex,
    )
  }

  // Enrich shelter defs and merge into buildings list for 3D extrusion rendering
  const enrichedShelterDefs = enrichWithDefs(state.shelters ?? [], SHELTER_DEFS)
  const enrichedShelters = enrichedShelterDefs.map((s) => ({ ...s, isShelter: true }))

  return {
    ...state,
    buildings: [
      ...enrichWithDefs(state.buildings, BUILDING_DEFS),
      ...enrichedShelters,
    ],
    roads:    enrichWithDefs(state.roads, ROAD_DEFS),
    shelters: enrichedShelterDefs, // still kept for popup click data
  }
}

// ── Map UI Overlays ───────────────────────────────────────────────────────────

function MapOverlays({ activeScenario }) {
  return (
    <>
      {/* Active scenario badge */}
      {activeScenario && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-canvas/90 border border-hairline rounded-full backdrop-blur-sm animate-fade-in pointer-events-none z-10 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-risk-red animate-pulse" aria-hidden="true" />
          <span className="text-2xs font-mono text-ink uppercase tracking-widest font-bold">
            {activeScenario.displayName}
          </span>
          <span className="w-px h-3 bg-hairline" aria-hidden="true" />
          <span className="text-2xs font-mono text-risk-red font-bold">LIVE</span>
        </div>
      )}

      {/* Coordinates — top left */}
      <div
        className="absolute top-3 left-3 text-2xs font-mono text-ink-faint bg-canvas/70 border border-hairline px-2 py-1 rounded backdrop-blur-sm pointer-events-none z-10"
        aria-hidden="true"
      >
        28.6200°N · 77.2200°E · CENTRAL DELHI
      </div>

      {/* Map attribution / data credit — bottom right */}
      <div
        className="absolute bottom-8 right-24 text-2xs font-mono text-ink-faint opacity-50 pointer-events-none z-10"
        aria-hidden="true"
      >
        Central Delhi Digital Twin · OSM
      </div>

      {/* Risk level legend — bottom left */}
      <div
        className="absolute bottom-8 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 bg-canvas/90 border border-hairline rounded backdrop-blur-sm pointer-events-none z-10 shadow-md max-w-[360px]"
        aria-label="Map legend"
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

        {/* Shelter legend swatch */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-risk-green opacity-90" aria-hidden="true" />
          <span className="text-2xs font-mono text-ink-faint">SHELTER</span>
        </div>

        <span className="w-px h-3 bg-hairline" aria-hidden="true" />

        {/* Evacuation route legend — 4 statuses */}
        {[
          { color: '#22C55E', label: 'PRIMARY' },
          { color: '#06B6D4', label: 'ALT' },
          { color: '#EAB308', label: 'CONGESTED' },
          { color: '#EF4444', label: 'BLOCKED' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width="14" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="14" y2="3" stroke={color} strokeWidth="2.5"
                strokeDasharray={label === 'ALT' ? '4 2' : label === 'CONGESTED' ? '3 2 1 2' : label === 'BLOCKED' ? '2 2' : undefined} />
            </svg>
            <span className="text-2xs font-mono text-ink-faint">{label}</span>
          </div>
        ))}
      </div>
    </>
  )
}
