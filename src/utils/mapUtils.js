/**
 * mapUtils.js
 *
 * Pure functions for converting scenario city-state to MapLibre-ready GeoJSON.
 * No React, no side effects.
 *
 * Coordinate format throughout: [longitude, latitude]  (GeoJSON / MapLibre)
 */

import { riskLevelToHex, roadStatusToHex } from './scenarioUtils.js'

// ── Visual constants ──────────────────────────────────────────────────────────

/** Half-size of building polygon per building type (degrees ≈ metres at Delhi lat) */
const TYPE_HALF_SIZE = {
  landmark:    0.00070,
  commercial:  0.00055,
  government:  0.00065,
  hospital:    0.00050,
  cultural:    0.00045,
  convention:  0.00075,
  residential: 0.00035,
}

/** Extrusion height multiplier per risk level — critical buildings tower above baseline */
const RISK_HEIGHT_MULT = {
  low:      0.55,
  elevated: 1.00,
  high:     1.55,
  critical: 2.30,
}

export const SHELTER_FILL_COLORS = {
  available:  '#22C55E',
  strained:   '#EAB308',
  overloaded: '#EF4444',
}

// ── Buildings ─────────────────────────────────────────────────────────────────

/**
 * Convert an array of enriched building objects to a GeoJSON FeatureCollection.
 * Buildings are rendered as small rectangular Polygon extrusions.
 * Height and colour are driven by riskLevel + extrusionMultiplier.
 *
 * @param {Array} buildings — enriched building state objects (have coordinates)
 * @returns {GeoJSON.FeatureCollection}
 */
export function buildingsToGeoJSON(buildings) {
  return {
    type: 'FeatureCollection',
    features: buildings
      .filter((b) => Array.isArray(b.coordinates) && b.coordinates.length === 2)
      .map((b) => {
        const [lng, lat] = b.coordinates
        const halfSize  = TYPE_HALF_SIZE[b.type] ?? 0.00050

        // Vary aspect ratio per building (deterministic, based on id character code)
        const seed  = b.id?.charCodeAt(b.id.length - 1) ?? 1
        const wx    = halfSize * (0.70 + (seed % 4) * 0.10)
        const hy    = halfSize * (0.70 + ((seed + 2) % 4) * 0.10)

        // Extrusion height
        const base   = b.baseHeight          ?? 25
        const mult   = b.extrusionMultiplier ?? 1.0
        const rMult  = RISK_HEIGHT_MULT[b.riskLevel] ?? 1.0
        const height = Math.max(Math.round(base * mult * rMult), 8)

        return {
          type: 'Feature',
          id: b.id,
          properties: {
            id:        b.id        ?? '',
            name:      b.name      ?? '',
            type:      b.type      ?? '',
            riskLevel: b.riskLevel ?? 'low',
            status:    b.status    ?? '',
            color:     riskLevelToHex(b.riskLevel ?? 'low'),
            height,
            baseHeight: 0,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [lng - wx, lat - hy],
              [lng + wx, lat - hy],
              [lng + wx, lat + hy],
              [lng - wx, lat + hy],
              [lng - wx, lat - hy],
            ]],
          },
        }
      }),
  }
}

// ── Roads ─────────────────────────────────────────────────────────────────────

const ROAD_WIDTH = { clear: 3, congested: 3, restricted: 4, blocked: 5 }
const ROAD_OPACITY = { clear: 0.75, congested: 0.85, restricted: 0.90, blocked: 1.0 }

/**
 * Convert enriched road objects to GeoJSON LineStrings.
 *
 * @param {Array} roads — enriched road state objects (have path)
 * @returns {GeoJSON.FeatureCollection}
 */
export function roadsToGeoJSON(roads) {
  return {
    type: 'FeatureCollection',
    features: roads
      .filter((r) => Array.isArray(r.path) && r.path.length >= 2)
      .map((r) => ({
        type: 'Feature',
        id: r.id,
        properties: {
          id:      r.id      ?? '',
          name:    r.name    ?? '',
          status:  r.status  ?? 'clear',
          label:   r.label   ?? '',
          color:   roadStatusToHex(r.status ?? 'clear'),
          width:   ROAD_WIDTH[r.status]   ?? 3,
          opacity: ROAD_OPACITY[r.status] ?? 0.75,
        },
        geometry: {
          type: 'LineString',
          coordinates: r.path,
        },
      })),
  }
}

// ── Shelters ──────────────────────────────────────────────────────────────────

/**
 * Convert enriched shelter objects to GeoJSON Points.
 *
 * @param {Array} shelters — enriched shelter state objects (have coordinates)
 * @returns {GeoJSON.FeatureCollection}
 */
export function sheltersToGeoJSON(shelters) {
  return {
    type: 'FeatureCollection',
    features: shelters
      .filter((s) => Array.isArray(s.coordinates) && s.coordinates.length === 2)
      .map((s) => ({
        type: 'Feature',
        id: s.id,
        properties: {
          id:                 s.id                 ?? '',
          name:               s.name               ?? '',
          state:              s.state              ?? 'available',
          utilizationPercent: s.utilizationPercent ?? 0,
          status:             s.status             ?? '',
          color:  SHELTER_FILL_COLORS[s.state] ?? SHELTER_FILL_COLORS.available,
          radius: s.state === 'overloaded' ? 11 : s.state === 'strained' ? 9 : 7,
        },
        geometry: {
          type: 'Point',
          coordinates: s.coordinates,
        },
      })),
  }
}

// ── Threat zone ───────────────────────────────────────────────────────────────

/**
 * Generate a circle polygon GeoJSON for the threat zone.
 * Returns an empty FeatureCollection if threatZone is null.
 *
 * @param {object|null} threatZone — { center: [lng, lat], radiusMeters, type }
 * @returns {GeoJSON.FeatureCollection}
 */
export function threatZoneToGeoJSON(threatZone) {
  if (!threatZone || !Array.isArray(threatZone.center)) {
    return { type: 'FeatureCollection', features: [] }
  }

  const [lng, lat] = threatZone.center
  const r = threatZone.radiusMeters ?? 500
  const STEPS = 64
  const EARTH_R = 6371000
  const DEG = 180 / Math.PI
  const cosLat = Math.cos((lat * Math.PI) / 180)

  const ring = []
  for (let i = 0; i < STEPS; i++) {
    const angle = (i * 2 * Math.PI) / STEPS
    ring.push([
      lng + (r * Math.sin(angle)) / (EARTH_R * cosLat) * DEG,
      lat + (r * Math.cos(angle)) / EARTH_R * DEG,
    ])
  }
  ring.push(ring[0]) // close polygon

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { threatType: threatZone.type ?? 'threat' },
      geometry: { type: 'Polygon', coordinates: [ring] },
    }],
  }
}

// ── Evacuation routes ─────────────────────────────────────────────────────────

/**
 * Convert evacuation route objects to GeoJSON LineStrings.
 *
 * @param {Array} routes — evac route objects (have path, status, direction)
 * @returns {GeoJSON.FeatureCollection}
 */
export function evacRoutesToGeoJSON(routes) {
  if (!Array.isArray(routes) || routes.length === 0) {
    return { type: 'FeatureCollection', features: [] }
  }
  return {
    type: 'FeatureCollection',
    features: routes
      .filter((r) => Array.isArray(r.path) && r.path.length >= 2)
      .map((r) => ({
        type: 'Feature',
        properties: {
          id:        r.id        ?? '',
          direction: r.direction ?? '',
          status:    r.status    ?? 'active',
        },
        geometry: {
          type: 'LineString',
          coordinates: r.path,
        },
      })),
  }
}

// ── Empty GeoJSON ─────────────────────────────────────────────────────────────

export const EMPTY_FC = { type: 'FeatureCollection', features: [] }
