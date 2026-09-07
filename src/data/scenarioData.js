/**
 * scenarioData.js
 *
 * All scenario state for the Urban Resilience Decision Twin.
 * This file is the single source of truth for all scenario data.
 *
 * Each scenario contains:
 *   - id, name, keywords (for matching)
 *   - mapConfig (camera position)
 *   - baseline (initial city state)
 *   - intervention (post-action city state)
 *   - timeline (5 keyframe diffs, T+0 → T+30)
 *   - causalFactors (vulnerability percentages)
 *   - comparisonStats (before/after intervention metrics)
 *
 * Coordinate format: [longitude, latitude]  (GeoJSON / MapLibre standard)
 * Risk levels: "low" | "elevated" | "high" | "critical"
 * Road status: "clear" | "congested" | "restricted" | "blocked"
 * Shelter state: "available" | "strained" | "overloaded"
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared city entities (stable across all scenarios, different risk per scenario)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BUILDINGS — 10 key landmarks / zones in Central Delhi
 * Each scenario overrides riskLevel, status, extrusionMultiplier
 */
const BUILDING_DEFS = [
  { id: 'B001', name: 'India Gate',            type: 'landmark',    coordinates: [77.2295, 28.6129], baseHeight: 42 },
  { id: 'B002', name: 'Connaught Place Hub',   type: 'commercial',  coordinates: [77.2167, 28.6315], baseHeight: 28 },
  { id: 'B003', name: 'Parliament Complex',    type: 'government',  coordinates: [77.2081, 28.6178], baseHeight: 35 },
  { id: 'B004', name: 'RML Hospital',          type: 'hospital',    coordinates: [77.2026, 28.6245], baseHeight: 30 },
  { id: 'B005', name: 'Mandi House',           type: 'cultural',    coordinates: [77.2380, 28.6250], baseHeight: 22 },
  { id: 'B006', name: 'ITO Complex',           type: 'government',  coordinates: [77.2498, 28.6290], baseHeight: 38 },
  { id: 'B007', name: 'Barakhamba Office Blk', type: 'commercial',  coordinates: [77.2270, 28.6285], baseHeight: 45 },
  { id: 'B008', name: 'Pragati Maidan Conv.',  type: 'convention',  coordinates: [77.2553, 28.6187], baseHeight: 25 },
  { id: 'B009', name: 'Khan Market Area',      type: 'commercial',  coordinates: [77.2310, 28.5999], baseHeight: 20 },
  { id: 'B010', name: 'Lodhi Colony Zone',     type: 'residential', coordinates: [77.2290, 28.5909], baseHeight: 18 },
]

/**
 * ROADS — 6 key corridors
 * path: array of [lng, lat] coordinate pairs defining the road geometry
 */
const ROAD_DEFS = [
  {
    id: 'R001', name: 'Kartavya Path',
    path: [[77.2081, 28.6145], [77.2167, 28.6133], [77.2295, 28.6129]],
  },
  {
    id: 'R002', name: 'Connaught Circus Inner',
    path: [[77.2140, 28.6335], [77.2167, 28.6315], [77.2195, 28.6335], [77.2190, 28.6295], [77.2140, 28.6295], [77.2140, 28.6335]],
  },
  {
    id: 'R003', name: 'Ring Road East',
    path: [[77.2498, 28.6450], [77.2498, 28.6290], [77.2498, 28.6050]],
  },
  {
    id: 'R004', name: 'Janpath',
    path: [[77.2167, 28.6315], [77.2210, 28.6220], [77.2240, 28.6129]],
  },
  {
    id: 'R005', name: 'Lodhi Road',
    path: [[77.2081, 28.5980], [77.2200, 28.5940], [77.2372, 28.5900]],
  },
  {
    id: 'R006', name: 'Mathura Road',
    path: [[77.2295, 28.6129], [77.2400, 28.6050], [77.2553, 28.5980]],
  },
]

/**
 * SHELTERS — 3 permanent + 1 intervention-only
 */
const SHELTER_DEFS = [
  { id: 'S001', name: 'Talkatora Stadium',      coordinates: [77.1993, 28.6282], capacity: 5000 },
  { id: 'S002', name: 'National Stadium',        coordinates: [77.2372, 28.6187], capacity: 8000 },
  { id: 'S003', name: 'Siri Fort Auditorium',   coordinates: [77.2193, 28.5520], capacity: 3000 },
  { id: 'S004', name: 'Pragati Maidan (Temp.)', coordinates: [77.2553, 28.6187], capacity: 500,  interventionOnly: true },
]

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1 — Security / Hostile Attack  (PRIMARY)
// ─────────────────────────────────────────────────────────────────────────────
const SCENARIO_SECURITY = {
  id: 'security-attack',
  name: 'High-Severity Hostile Attack',
  displayName: 'HOSTILE ATTACK',
  severity: 'HIGH',
  threatType: 'HOSTILE ATTACK',
  location: 'CENTRAL DELHI',
  keywords: ['attack', 'hostile', 'threat', 'security', 'terror', 'bomb', 'shoot', 'assault', 'militant', 'armed', 'weapon', 'siege', 'explosion'],

  mapConfig: {
    center: [77.2200, 28.6200],
    zoom: 13.5,
    pitch: 52,
    bearing: -12,
  },

  // ── Baseline state ────────────────────────────────────────────────────────
  baseline: {
    buildings: [
      { id: 'B001', riskLevel: 'critical', status: 'UNDER THREAT',  extrusionMultiplier: 1.6, population: 5200 },
      { id: 'B002', riskLevel: 'high',     status: 'EVACUATING',    extrusionMultiplier: 1.3, population: 12000 },
      { id: 'B003', riskLevel: 'critical', status: 'LOCKDOWN',       extrusionMultiplier: 1.5, population: 3500 },
      { id: 'B004', riskLevel: 'high',     status: 'ACCESS DEGRADED',extrusionMultiplier: 1.2, population: 1800 },
      { id: 'B005', riskLevel: 'elevated', status: 'MONITORING',     extrusionMultiplier: 1.1, population: 900 },
      { id: 'B006', riskLevel: 'low',      status: 'OPERATIONAL',    extrusionMultiplier: 1.0, population: 4200 },
      { id: 'B007', riskLevel: 'elevated', status: 'ALERT',          extrusionMultiplier: 1.1, population: 7800 },
      { id: 'B008', riskLevel: 'low',      status: 'OPERATIONAL',    extrusionMultiplier: 1.0, population: 2100 },
      { id: 'B009', riskLevel: 'elevated', status: 'ALERT',          extrusionMultiplier: 1.1, population: 3400 },
      { id: 'B010', riskLevel: 'low',      status: 'OPERATIONAL',    extrusionMultiplier: 1.0, population: 8900 },
    ],
    roads: [
      { id: 'R001', status: 'restricted', label: 'SECURITY CORDON' },
      { id: 'R002', status: 'congested',  label: 'HEAVY TRAFFIC' },
      { id: 'R003', status: 'clear',      label: 'CLEAR' },
      { id: 'R004', status: 'blocked',    label: 'POLICE BLOCKED' },
      { id: 'R005', status: 'clear',      label: 'CLEAR' },
      { id: 'R006', status: 'congested',  label: 'EVACUATION TRAFFIC' },
    ],
    shelters: [
      { id: 'S001', occupancy: 3750, utilizationPercent: 75, state: 'strained',   status: 'ACCEPTING' },
      { id: 'S002', occupancy: 5440, utilizationPercent: 68, state: 'strained',   status: 'ACCEPTING' },
      { id: 'S003', occupancy: 1350, utilizationPercent: 45, state: 'available',  status: 'OPEN' },
    ],
    threatZone: {
      center: [77.2188, 28.6160],
      radiusMeters: 800,
      type: 'hostile-attack',
    },
    evacuationRoutes: [
      { id: 'EV001', path: [[77.2295, 28.6129], [77.2200, 28.5980], [77.2193, 28.5520]], status: 'active', direction: 'SOUTH' },
      { id: 'EV002', path: [[77.2167, 28.6315], [77.2081, 28.6245], [77.1993, 28.6282]], status: 'active', direction: 'WEST' },
    ],
    stats: {
      populationAtRisk: 28400,
      criticalInfraCount: 3,
      hospitalAccessPct: 42,
      estimatedEvacMinutes: 24,
      overallRiskScore: 87,
    },
  },

  // ── Intervention state ────────────────────────────────────────────────────
  intervention: {
    description: 'Deploy Temporary Shelter at Pragati Maidan (Zone C). Open Ring Road evacuation corridor.',
    actionLabel: 'DEPLOY TEMPORARY SHELTER',
    actionDetail: 'Zone C · Capacity +500 · Estimated evac time −7 min',
    buildings: [
      { id: 'B001', riskLevel: 'high',     status: 'SECURED',        extrusionMultiplier: 1.3 },
      { id: 'B002', riskLevel: 'elevated', status: 'PARTIAL EVAC',   extrusionMultiplier: 1.1 },
      { id: 'B003', riskLevel: 'high',     status: 'SECURED',        extrusionMultiplier: 1.2 },
      { id: 'B004', riskLevel: 'elevated', status: 'OPERATIONAL',    extrusionMultiplier: 1.0 },
      { id: 'B005', riskLevel: 'low',      status: 'CLEARED',        extrusionMultiplier: 1.0 },
      { id: 'B006', riskLevel: 'low',      status: 'OPERATIONAL',    extrusionMultiplier: 1.0 },
      { id: 'B007', riskLevel: 'elevated', status: 'ALERT',          extrusionMultiplier: 1.1 },
      { id: 'B008', riskLevel: 'low',      status: 'OPERATIONAL',    extrusionMultiplier: 1.0 },
      { id: 'B009', riskLevel: 'low',      status: 'CLEARED',        extrusionMultiplier: 1.0 },
      { id: 'B010', riskLevel: 'low',      status: 'OPERATIONAL',    extrusionMultiplier: 1.0 },
    ],
    roads: [
      { id: 'R001', status: 'restricted', label: 'SECURITY CORDON' },
      { id: 'R002', status: 'congested',  label: 'IMPROVING' },
      { id: 'R003', status: 'clear',      label: 'EVAC CORRIDOR' },
      { id: 'R004', status: 'restricted', label: 'PARTIAL OPEN' },
      { id: 'R005', status: 'clear',      label: 'CLEAR' },
      { id: 'R006', status: 'clear',      label: 'EVAC ROUTE' },
    ],
    shelters: [
      { id: 'S001', occupancy: 2750, utilizationPercent: 55, state: 'strained',  status: 'ACCEPTING' },
      { id: 'S002', occupancy: 4400, utilizationPercent: 55, state: 'strained',  status: 'ACCEPTING' },
      { id: 'S003', occupancy: 1350, utilizationPercent: 45, state: 'available', status: 'OPEN' },
      { id: 'S004', occupancy: 420,  utilizationPercent: 84, state: 'strained',  status: 'DEPLOYED' },
    ],
    newEvacuationRoutes: [
      { id: 'EV003', path: [[77.2295, 28.6129], [77.2498, 28.6187], [77.2553, 28.6187]], status: 'active', direction: 'EAST-NEW' },
    ],
    stats: {
      populationAtRisk: 18200,
      criticalInfraCount: 1,
      hospitalAccessPct: 78,
      estimatedEvacMinutes: 17,
      overallRiskScore: 54,
    },
  },

  // ── Timeline keyframes (diffs applied cumulatively from baseline) ──────────
  timeline: [
    {
      index: 0, label: 'T+0', time: 0,
      event: 'THREAT DETECTED',
      description: 'Coordinated hostile attack reported near India Gate. Security forces mobilising. Perimeter being established.',
      statusText: 'Initial alert active. Threat location being verified.',
      diff: {}, // T+0 = baseline state
    },
    {
      index: 1, label: 'T+5', time: 5,
      event: 'FIRST IMPACT',
      description: 'Explosion confirmed on Kartavya Path. Parliament Complex placed on immediate lockdown. Emergency services dispatched.',
      statusText: 'Active incident. Roads around threat zone closing. Evacuation initiated.',
      diff: {
        buildings: [
          { id: 'B001', riskLevel: 'critical', status: 'IMPACT ZONE' },
          { id: 'B002', riskLevel: 'high',     status: 'EVACUATING' },
        ],
        roads: [
          { id: 'R001', status: 'blocked',    label: 'INCIDENT CLOSED' },
          { id: 'R002', status: 'restricted', label: 'DIVERSION ACTIVE' },
        ],
        shelters: [
          { id: 'S001', occupancy: 4100, utilizationPercent: 82, state: 'strained' },
        ],
        stats: { populationAtRisk: 31000, estimatedEvacMinutes: 28 },
      },
    },
    {
      index: 2, label: 'T+10', time: 10,
      event: 'ROAD NETWORK DEGRADING',
      description: 'Janpath and Kartavya Path fully blocked. Connaught Place evacuation underway. Road network capacity at 45% normal.',
      statusText: 'Major corridors closed. Civilian evacuation in progress. Shelter intake rising.',
      diff: {
        buildings: [
          { id: 'B003', riskLevel: 'critical', status: 'SECURE LOCKDOWN' },
          { id: 'B007', riskLevel: 'high',     status: 'EVACUATING' },
        ],
        roads: [
          { id: 'R002', status: 'blocked', label: 'EVACUATION ONLY' },
          { id: 'R006', status: 'restricted', label: 'ONE-WAY EVAC' },
        ],
        shelters: [
          { id: 'S001', occupancy: 4750, utilizationPercent: 95, state: 'overloaded' },
          { id: 'S002', occupancy: 6560, utilizationPercent: 82, state: 'strained' },
        ],
        stats: { populationAtRisk: 34200, estimatedEvacMinutes: 32, hospitalAccessPct: 35 },
      },
    },
    {
      index: 3, label: 'T+15', time: 15,
      event: 'SHELTER CAPACITY CRITICAL',
      description: 'Talkatora Stadium at 95% capacity. Hospital access routes compromised. Emergency declaration issued for Central Delhi.',
      statusText: 'Shelter system under severe strain. Hospital access degraded. Cascade risk HIGH.',
      diff: {
        buildings: [
          { id: 'B004', riskLevel: 'critical', status: 'ACCESS BLOCKED' },
          { id: 'B005', riskLevel: 'high',     status: 'EVACUATING' },
          { id: 'B009', riskLevel: 'high',     status: 'EVACUATING' },
        ],
        roads: [
          { id: 'R005', status: 'congested', label: 'DIVERTED TRAFFIC' },
        ],
        shelters: [
          { id: 'S002', occupancy: 7360, utilizationPercent: 92, state: 'overloaded' },
          { id: 'S003', occupancy: 2340, utilizationPercent: 78, state: 'strained' },
        ],
        stats: { populationAtRisk: 36800, estimatedEvacMinutes: 38, hospitalAccessPct: 22, overallRiskScore: 94 },
      },
    },
    {
      index: 4, label: 'T+30', time: 30,
      event: 'CASCADE FAILURE',
      description: 'All major shelters at or above capacity. Hospital access critically degraded. Cascade effect spreading to adjacent districts.',
      statusText: 'System cascade underway. Immediate intervention required to prevent district-wide collapse.',
      diff: {
        buildings: [
          { id: 'B006', riskLevel: 'elevated', status: 'ALERT' },
          { id: 'B010', riskLevel: 'elevated', status: 'ALERT' },
        ],
        roads: [
          { id: 'R003', status: 'congested', label: 'OVERFLOW TRAFFIC' },
        ],
        shelters: [
          { id: 'S001', occupancy: 5100, utilizationPercent: 102, state: 'overloaded' },
          { id: 'S002', occupancy: 7840, utilizationPercent: 98, state: 'overloaded' },
          { id: 'S003', occupancy: 2880, utilizationPercent: 96, state: 'overloaded' },
        ],
        stats: { populationAtRisk: 41200, estimatedEvacMinutes: 45, hospitalAccessPct: 12, overallRiskScore: 98 },
      },
    },
  ],

  // ── Causal breakdown ──────────────────────────────────────────────────────
  causalFactors: {
    shelterDeficit:      { value: 82, label: 'Shelter Deficit',      description: 'Existing shelters insufficient for mass evacuation demand' },
    populationDensity:   { value: 71, label: 'Population Density',   description: 'High civilian density in primary threat zone' },
    roadAccessibility:   { value: 58, label: 'Road Accessibility',   description: 'Critical corridors blocked, limiting egress' },
    infrastructure:      { value: 43, label: 'Infrastructure Risk',  description: 'Aging infrastructure vulnerable to secondary failures' },
  },

  // ── Before / after comparison ─────────────────────────────────────────────
  comparisonStats: {
    evacTimeBefore:   24, evacTimeAfter:   17, evacTimeUnit:  'min',
    overloadBefore:   81, overloadAfter:   55, overloadUnit:  '%',
    riskZonesBefore:  12, riskZonesAfter:   7, riskZonesUnit: 'zones',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2 — Earthquake
// ─────────────────────────────────────────────────────────────────────────────
const SCENARIO_EARTHQUAKE = {
  id: 'earthquake',
  name: 'Earthquake — Magnitude 6.2',
  displayName: 'EARTHQUAKE',
  severity: 'HIGH',
  threatType: 'SEISMIC EVENT',
  location: 'CENTRAL DELHI',
  keywords: ['earthquake', 'quake', 'seismic', 'tremor', 'magnitude', 'richter', 'aftershock', 'collapse'],

  mapConfig: {
    center: [77.2300, 28.6100],
    zoom: 13.0,
    pitch: 48,
    bearing: 8,
  },

  baseline: {
    buildings: [
      { id: 'B001', riskLevel: 'elevated', status: 'STRUCTURALLY SOUND', extrusionMultiplier: 1.0, population: 4800 },
      { id: 'B002', riskLevel: 'critical', status: 'PARTIAL COLLAPSE',   extrusionMultiplier: 0.6, population: 11000 },
      { id: 'B003', riskLevel: 'high',     status: 'DAMAGE ASSESSED',    extrusionMultiplier: 0.8, population: 3000 },
      { id: 'B004', riskLevel: 'critical', status: 'BUILDING CRACKED',   extrusionMultiplier: 0.7, population: 1600 },
      { id: 'B005', riskLevel: 'high',     status: 'UNSTABLE FACADE',    extrusionMultiplier: 0.9, population: 800 },
      { id: 'B006', riskLevel: 'critical', status: 'STRUCTURAL FAILURE', extrusionMultiplier: 0.5, population: 3800 },
      { id: 'B007', riskLevel: 'high',     status: 'CRACKS DETECTED',    extrusionMultiplier: 0.85, population: 7200 },
      { id: 'B008', riskLevel: 'elevated', status: 'INSPECTING',          extrusionMultiplier: 1.0, population: 1900 },
      { id: 'B009', riskLevel: 'high',     status: 'UNSAFE ENTRY',        extrusionMultiplier: 0.9, population: 3100 },
      { id: 'B010', riskLevel: 'elevated', status: 'INSPECTING',          extrusionMultiplier: 1.0, population: 8600 },
    ],
    roads: [
      { id: 'R001', status: 'congested',  label: 'DEBRIS PARTIAL' },
      { id: 'R002', status: 'blocked',    label: 'COLLAPSE DEBRIS' },
      { id: 'R003', status: 'congested',  label: 'EMERGENCY VEHICLES' },
      { id: 'R004', status: 'restricted', label: 'CRACKS IN ROAD' },
      { id: 'R005', status: 'clear',      label: 'CLEAR' },
      { id: 'R006', status: 'restricted', label: 'PARTIAL DEBRIS' },
    ],
    shelters: [
      { id: 'S001', occupancy: 2500, utilizationPercent: 50, state: 'strained',  status: 'ACCEPTING' },
      { id: 'S002', occupancy: 3200, utilizationPercent: 40, state: 'available', status: 'OPEN' },
      { id: 'S003', occupancy: 1800, utilizationPercent: 60, state: 'strained',  status: 'ACCEPTING' },
    ],
    threatZone: {
      center: [77.2300, 28.6250],
      radiusMeters: 1200,
      type: 'seismic-epicenter',
    },
    evacuationRoutes: [
      { id: 'EV001', path: [[77.2498, 28.6290], [77.2553, 28.6187], [77.2372, 28.6187]], status: 'active', direction: 'SOUTH-EAST' },
      { id: 'EV002', path: [[77.2081, 28.6178], [77.2081, 28.5980], [77.2193, 28.5520]], status: 'active', direction: 'SOUTH' },
    ],
    stats: {
      populationAtRisk: 36000,
      criticalInfraCount: 4,
      hospitalAccessPct: 38,
      estimatedEvacMinutes: 31,
      overallRiskScore: 82,
    },
  },

  intervention: {
    description: 'Deploy structural emergency teams + open southern evacuation corridors via Lodhi Road.',
    actionLabel: 'DEPLOY RESCUE TEAMS',
    actionDetail: 'Zone B · Structural support · Corridor via Lodhi Road',
    buildings: [
      { id: 'B001', riskLevel: 'low',      status: 'CERTIFIED SAFE',   extrusionMultiplier: 1.0 },
      { id: 'B002', riskLevel: 'high',     status: 'RESCUE OPS',       extrusionMultiplier: 0.7 },
      { id: 'B003', riskLevel: 'elevated', status: 'SHORED UP',        extrusionMultiplier: 0.9 },
      { id: 'B004', riskLevel: 'high',     status: 'FIELD HOSPITAL',   extrusionMultiplier: 0.9 },
      { id: 'B005', riskLevel: 'elevated', status: 'ASSESSED SAFE',    extrusionMultiplier: 1.0 },
      { id: 'B006', riskLevel: 'high',     status: 'RESCUE OPS',       extrusionMultiplier: 0.6 },
      { id: 'B007', riskLevel: 'elevated', status: 'STABILISED',       extrusionMultiplier: 0.95 },
      { id: 'B008', riskLevel: 'low',      status: 'OPERATIONAL',      extrusionMultiplier: 1.0 },
      { id: 'B009', riskLevel: 'elevated', status: 'RE-OPENED',        extrusionMultiplier: 1.0 },
      { id: 'B010', riskLevel: 'low',      status: 'OPERATIONAL',      extrusionMultiplier: 1.0 },
    ],
    roads: [
      { id: 'R001', status: 'restricted', label: 'RESCUE PRIORITY' },
      { id: 'R002', status: 'restricted', label: 'CLEARING DEBRIS' },
      { id: 'R003', status: 'clear',      label: 'EMERGENCY CLEAR' },
      { id: 'R004', status: 'congested',  label: 'IMPROVING' },
      { id: 'R005', status: 'clear',      label: 'MAIN EVAC ROUTE' },
      { id: 'R006', status: 'congested',  label: 'IMPROVING' },
    ],
    shelters: [
      { id: 'S001', occupancy: 2600, utilizationPercent: 52, state: 'strained',  status: 'ACCEPTING' },
      { id: 'S002', occupancy: 4160, utilizationPercent: 52, state: 'strained',  status: 'ACCEPTING' },
      { id: 'S003', occupancy: 1560, utilizationPercent: 52, state: 'strained',  status: 'ACCEPTING' },
      { id: 'S004', occupancy: 350,  utilizationPercent: 70, state: 'strained',  status: 'DEPLOYED' },
    ],
    stats: {
      populationAtRisk: 22000,
      criticalInfraCount: 2,
      hospitalAccessPct: 69,
      estimatedEvacMinutes: 22,
      overallRiskScore: 58,
    },
  },

  timeline: [
    {
      index: 0, label: 'T+0', time: 0,
      event: 'QUAKE DETECTED',
      description: 'Magnitude 6.2 earthquake detected. Epicentre near ITO complex. NDRF teams alerted.',
      statusText: 'Seismic event confirmed. Structural assessments underway.',
      diff: {},
    },
    {
      index: 1, label: 'T+5', time: 5,
      event: 'FIRST REPORTS',
      description: 'Structural damage confirmed at Connaught Place and ITO. Power outages in 3 sectors.',
      statusText: 'Collapse reports incoming. Emergency services mobilising.',
      diff: {
        buildings: [
          { id: 'B002', riskLevel: 'critical', status: 'PARTIAL COLLAPSE', extrusionMultiplier: 0.55 },
          { id: 'B006', riskLevel: 'critical', status: 'COLLAPSE RISK',    extrusionMultiplier: 0.45 },
        ],
        roads: [
          { id: 'R002', status: 'blocked', label: 'DEBRIS BLOCKED' },
        ],
        stats: { populationAtRisk: 38000, estimatedEvacMinutes: 35 },
      },
    },
    {
      index: 2, label: 'T+10', time: 10,
      event: 'AFTERSHOCK — M4.1',
      description: 'Aftershock M4.1 worsens structural damage. Hospital building cracked — patients being moved.',
      statusText: 'Secondary tremor detected. Hospital evacuation underway.',
      diff: {
        buildings: [
          { id: 'B004', riskLevel: 'critical', status: 'EVACUATING PATIENTS', extrusionMultiplier: 0.6 },
          { id: 'B005', riskLevel: 'critical', status: 'FACADE COLLAPSE',     extrusionMultiplier: 0.7 },
        ],
        roads: [
          { id: 'R004', status: 'blocked', label: 'AFTERSHOCK DAMAGE' },
        ],
        shelters: [
          { id: 'S001', occupancy: 3500, utilizationPercent: 70, state: 'strained' },
          { id: 'S002', occupancy: 4800, utilizationPercent: 60, state: 'strained' },
        ],
        stats: { hospitalAccessPct: 25, estimatedEvacMinutes: 40 },
      },
    },
    {
      index: 3, label: 'T+15', time: 15,
      event: 'SHELTER CRITICAL',
      description: 'Shelter intake accelerating. ITO complex fully evacuated. Search and rescue operations begin.',
      statusText: 'Rescue ops active. Shelter system reaching capacity limits.',
      diff: {
        buildings: [
          { id: 'B006', riskLevel: 'critical', status: 'RESCUE OPS ACTIVE', extrusionMultiplier: 0.4 },
        ],
        shelters: [
          { id: 'S001', occupancy: 4250, utilizationPercent: 85, state: 'overloaded' },
          { id: 'S003', occupancy: 2550, utilizationPercent: 85, state: 'overloaded' },
        ],
        stats: { populationAtRisk: 42000, overallRiskScore: 90 },
      },
    },
    {
      index: 4, label: 'T+30', time: 30,
      event: 'CASCADE FAILURE',
      description: 'Critical infrastructure cascade: power grid partially down, water supply disrupted. Shelter system overwhelmed.',
      statusText: 'Infrastructure cascade active. Immediate multi-agency response required.',
      diff: {
        buildings: [
          { id: 'B009', riskLevel: 'high', status: 'POWER OUT' },
          { id: 'B010', riskLevel: 'high', status: 'ALERT' },
        ],
        shelters: [
          { id: 'S002', occupancy: 7200, utilizationPercent: 90, state: 'overloaded' },
        ],
        stats: { populationAtRisk: 47000, estimatedEvacMinutes: 48, hospitalAccessPct: 15, overallRiskScore: 95 },
      },
    },
  ],

  causalFactors: {
    shelterDeficit:    { value: 74, label: 'Shelter Deficit',     description: 'Shelter capacity overwhelmed by displaced population' },
    populationDensity: { value: 85, label: 'Population Density',  description: 'Extremely high density in collapsed building zones' },
    roadAccessibility: { value: 67, label: 'Road Accessibility',  description: 'Debris and aftershocks limiting rescue access' },
    infrastructure:    { value: 79, label: 'Infrastructure Risk', description: 'Ageing structures highly susceptible to seismic damage' },
  },

  comparisonStats: {
    evacTimeBefore:  31, evacTimeAfter:  22, evacTimeUnit:  'min',
    overloadBefore:  78, overloadAfter:  52, overloadUnit:  '%',
    riskZonesBefore: 14, riskZonesAfter:  8, riskZonesUnit: 'zones',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3 — Flood
// ─────────────────────────────────────────────────────────────────────────────
const SCENARIO_FLOOD = {
  id: 'flood',
  name: 'Yamuna River Flash Flood',
  displayName: 'FLASH FLOOD',
  severity: 'HIGH',
  threatType: 'FLASH FLOOD',
  location: 'YAMUNA FLOODPLAIN — CENTRAL DELHI',
  keywords: ['flood', 'flooding', 'flash flood', 'inundation', 'yamuna', 'river', 'water', 'rain', 'monsoon', 'waterlogged', 'submerged'],

  mapConfig: {
    center: [77.2500, 28.6250],
    zoom: 13.0,
    pitch: 45,
    bearing: 15,
  },

  baseline: {
    buildings: [
      { id: 'B001', riskLevel: 'elevated', status: 'MONITORING',      extrusionMultiplier: 1.0, population: 5000 },
      { id: 'B002', riskLevel: 'low',      status: 'OPERATIONAL',     extrusionMultiplier: 1.0, population: 11500 },
      { id: 'B003', riskLevel: 'low',      status: 'OPERATIONAL',     extrusionMultiplier: 1.0, population: 3200 },
      { id: 'B004', riskLevel: 'elevated', status: 'FLOOD WATCH',     extrusionMultiplier: 1.0, population: 1700 },
      { id: 'B005', riskLevel: 'elevated', status: 'FLOOD WATCH',     extrusionMultiplier: 1.0, population: 850 },
      { id: 'B006', riskLevel: 'critical', status: 'INUNDATED',       extrusionMultiplier: 0.4, population: 4100 },
      { id: 'B007', riskLevel: 'high',     status: 'FLOODING',        extrusionMultiplier: 0.7, population: 7400 },
      { id: 'B008', riskLevel: 'critical', status: 'WATERLOGGED',     extrusionMultiplier: 0.3, population: 2000 },
      { id: 'B009', riskLevel: 'high',     status: 'EVACUATING',      extrusionMultiplier: 0.8, population: 3300 },
      { id: 'B010', riskLevel: 'elevated', status: 'FLOOD WATCH',     extrusionMultiplier: 1.0, population: 8700 },
    ],
    roads: [
      { id: 'R001', status: 'clear',      label: 'CLEAR' },
      { id: 'R002', status: 'clear',      label: 'CLEAR' },
      { id: 'R003', status: 'blocked',    label: 'SUBMERGED 0.8m' },
      { id: 'R004', status: 'congested',  label: 'DIVERSION ACTIVE' },
      { id: 'R005', status: 'clear',      label: 'CLEAR' },
      { id: 'R006', status: 'blocked',    label: 'WATERLOGGED' },
    ],
    shelters: [
      { id: 'S001', occupancy: 3000, utilizationPercent: 60, state: 'strained',  status: 'ACCEPTING' },
      { id: 'S002', occupancy: 2400, utilizationPercent: 30, state: 'available', status: 'OPEN' },
      { id: 'S003', occupancy: 2100, utilizationPercent: 70, state: 'strained',  status: 'ACCEPTING' },
    ],
    threatZone: {
      center: [77.2498, 28.6290],
      radiusMeters: 1500,
      type: 'flood-zone',
    },
    evacuationRoutes: [
      { id: 'EV001', path: [[77.2498, 28.6290], [77.2167, 28.6290], [77.1993, 28.6282]], status: 'active', direction: 'WEST' },
      { id: 'EV002', path: [[77.2553, 28.6187], [77.2372, 28.5900], [77.2193, 28.5520]], status: 'active', direction: 'SOUTH-WEST' },
    ],
    stats: {
      populationAtRisk: 31500,
      criticalInfraCount: 3,
      hospitalAccessPct: 55,
      estimatedEvacMinutes: 35,
      overallRiskScore: 76,
    },
  },

  intervention: {
    description: 'Activate northern elevated evacuation route + deploy flood relief shelter at Connaught Place.',
    actionLabel: 'OPEN ELEVATED CORRIDOR',
    actionDetail: 'Northern Route · +500 capacity · Estd evac time −11 min',
    buildings: [
      { id: 'B001', riskLevel: 'low',      status: 'OPERATIONAL',  extrusionMultiplier: 1.0 },
      { id: 'B002', riskLevel: 'low',      status: 'RELIEF HUB',   extrusionMultiplier: 1.0 },
      { id: 'B003', riskLevel: 'low',      status: 'OPERATIONAL',  extrusionMultiplier: 1.0 },
      { id: 'B004', riskLevel: 'low',      status: 'CLEARED',      extrusionMultiplier: 1.0 },
      { id: 'B005', riskLevel: 'elevated', status: 'MONITORING',   extrusionMultiplier: 1.0 },
      { id: 'B006', riskLevel: 'high',     status: 'PUMPING OUT',  extrusionMultiplier: 0.6 },
      { id: 'B007', riskLevel: 'elevated', status: 'DRAINING',     extrusionMultiplier: 0.9 },
      { id: 'B008', riskLevel: 'high',     status: 'PUMPING OUT',  extrusionMultiplier: 0.5 },
      { id: 'B009', riskLevel: 'elevated', status: 'DRAINING',     extrusionMultiplier: 0.9 },
      { id: 'B010', riskLevel: 'low',      status: 'OPERATIONAL',  extrusionMultiplier: 1.0 },
    ],
    roads: [
      { id: 'R001', status: 'clear',      label: 'EVAC ROUTE' },
      { id: 'R002', status: 'clear',      label: 'EVAC HUB' },
      { id: 'R003', status: 'restricted', label: 'PARTIAL DRAIN' },
      { id: 'R004', status: 'clear',      label: 'OPEN' },
      { id: 'R005', status: 'clear',      label: 'CLEAR' },
      { id: 'R006', status: 'restricted', label: 'DRAINING' },
    ],
    shelters: [
      { id: 'S001', occupancy: 2400, utilizationPercent: 48, state: 'available', status: 'ACCEPTING' },
      { id: 'S002', occupancy: 3840, utilizationPercent: 48, state: 'available', status: 'OPEN' },
      { id: 'S003', occupancy: 1440, utilizationPercent: 48, state: 'available', status: 'OPEN' },
      { id: 'S004', occupancy: 430,  utilizationPercent: 86, state: 'strained',  status: 'DEPLOYED' },
    ],
    stats: {
      populationAtRisk: 18000,
      criticalInfraCount: 1,
      hospitalAccessPct: 80,
      estimatedEvacMinutes: 24,
      overallRiskScore: 50,
    },
  },

  timeline: [
    {
      index: 0, label: 'T+0', time: 0,
      event: 'FLOOD ALERT',
      description: 'Yamuna river level at 206.5m (warning level 204.5m). ITO and Pragati Maidan on high alert.',
      statusText: 'Flood warning issued. Monitoring activated along Yamuna floodplain.',
      diff: {},
    },
    {
      index: 1, label: 'T+5', time: 5,
      event: 'FIRST INUNDATION',
      description: 'ITO underpass submerged. Ring Road East impassable. Pragati Maidan grounds waterlogged.',
      statusText: 'First inundation confirmed. Eastern corridors closing.',
      diff: {
        buildings: [
          { id: 'B006', riskLevel: 'critical', status: 'INUNDATED',   extrusionMultiplier: 0.35 },
          { id: 'B008', riskLevel: 'critical', status: 'WATERLOGGED', extrusionMultiplier: 0.25 },
        ],
        roads: [
          { id: 'R003', status: 'blocked', label: 'SUBMERGED 1.2m' },
          { id: 'R006', status: 'blocked', label: 'WATERLOGGED' },
        ],
        stats: { estimatedEvacMinutes: 38, populationAtRisk: 34000 },
      },
    },
    {
      index: 2, label: 'T+10', time: 10,
      event: 'SPREADING WEST',
      description: 'Flood water advancing westward. Barakhamba Road area beginning to flood. NDRF boats deployed.',
      statusText: 'Flood expansion confirmed. Western areas now at risk.',
      diff: {
        buildings: [
          { id: 'B007', riskLevel: 'critical', status: 'FLOODING', extrusionMultiplier: 0.5 },
          { id: 'B009', riskLevel: 'high',     status: 'EVACUATING' },
        ],
        roads: [
          { id: 'R004', status: 'restricted', label: 'PARTIAL FLOOD' },
        ],
        shelters: [
          { id: 'S001', occupancy: 4000, utilizationPercent: 80, state: 'strained' },
          { id: 'S002', occupancy: 4800, utilizationPercent: 60, state: 'strained' },
        ],
        stats: { hospitalAccessPct: 42, estimatedEvacMinutes: 42 },
      },
    },
    {
      index: 3, label: 'T+15', time: 15,
      event: 'SHELTER CRITICAL',
      description: 'Shelter intake accelerating. Hospital approach roads partially flooded. NDRF rescue ops active.',
      statusText: 'Shelter system strained. Hospital access deteriorating.',
      diff: {
        buildings: [
          { id: 'B004', riskLevel: 'high', status: 'APPROACH FLOODED' },
        ],
        shelters: [
          { id: 'S001', occupancy: 4500, utilizationPercent: 90, state: 'overloaded' },
          { id: 'S003', occupancy: 2700, utilizationPercent: 90, state: 'overloaded' },
        ],
        stats: { populationAtRisk: 39000, overallRiskScore: 88 },
      },
    },
    {
      index: 4, label: 'T+30', time: 30,
      event: 'CASCADE FAILURE',
      description: 'Yamuna reaches 208.2m. Wide-scale inundation of eastern zones. Shelter system at breaking point.',
      statusText: 'Maximum flood level reached. Eastern districts in cascade failure.',
      diff: {
        buildings: [
          { id: 'B005', riskLevel: 'high', status: 'FLOOD RISK' },
          { id: 'B010', riskLevel: 'high', status: 'FLOOD WATCH' },
        ],
        roads: [
          { id: 'R001', status: 'congested', label: 'DIVERSION' },
        ],
        shelters: [
          { id: 'S002', occupancy: 7200, utilizationPercent: 90, state: 'overloaded' },
        ],
        stats: { populationAtRisk: 44000, estimatedEvacMinutes: 52, hospitalAccessPct: 28, overallRiskScore: 93 },
      },
    },
  ],

  causalFactors: {
    shelterDeficit:    { value: 65, label: 'Shelter Deficit',     description: 'Eastern shelters flooded, reducing effective capacity' },
    populationDensity: { value: 78, label: 'Population Density',  description: 'Dense riverside settlements at direct inundation risk' },
    roadAccessibility: { value: 72, label: 'Road Accessibility',  description: 'Key eastern corridors submerged, limiting evacuation' },
    infrastructure:    { value: 55, label: 'Infrastructure Risk', description: 'Ageing drainage unable to handle extreme rainfall' },
  },

  comparisonStats: {
    evacTimeBefore:  35, evacTimeAfter:  24, evacTimeUnit:  'min',
    overloadBefore:  72, overloadAfter:  48, overloadUnit:  '%',
    riskZonesBefore: 10, riskZonesAfter:  5, riskZonesUnit: 'zones',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4 — Generic / Custom fallback
// ─────────────────────────────────────────────────────────────────────────────
const SCENARIO_GENERIC = {
  id: 'generic',
  name: 'Urban Emergency — Unclassified',
  displayName: 'URBAN EMERGENCY',
  severity: 'ELEVATED',
  threatType: 'UNCLASSIFIED',
  location: 'CENTRAL DELHI',
  keywords: [], // matches as fallback when no other scenario matches

  mapConfig: {
    center: [77.2200, 28.6200],
    zoom: 13.0,
    pitch: 40,
    bearing: 0,
  },

  baseline: {
    buildings: [
      { id: 'B001', riskLevel: 'elevated', status: 'MONITORING',  extrusionMultiplier: 1.1, population: 5000 },
      { id: 'B002', riskLevel: 'elevated', status: 'MONITORING',  extrusionMultiplier: 1.1, population: 11000 },
      { id: 'B003', riskLevel: 'elevated', status: 'ALERT',       extrusionMultiplier: 1.1, population: 3200 },
      { id: 'B004', riskLevel: 'low',      status: 'OPERATIONAL', extrusionMultiplier: 1.0, population: 1700 },
      { id: 'B005', riskLevel: 'low',      status: 'OPERATIONAL', extrusionMultiplier: 1.0, population: 850 },
      { id: 'B006', riskLevel: 'elevated', status: 'ALERT',       extrusionMultiplier: 1.1, population: 4000 },
      { id: 'B007', riskLevel: 'high',     status: 'EVACUATING',  extrusionMultiplier: 1.2, population: 7200 },
      { id: 'B008', riskLevel: 'low',      status: 'OPERATIONAL', extrusionMultiplier: 1.0, population: 1900 },
      { id: 'B009', riskLevel: 'elevated', status: 'MONITORING',  extrusionMultiplier: 1.1, population: 3100 },
      { id: 'B010', riskLevel: 'low',      status: 'OPERATIONAL', extrusionMultiplier: 1.0, population: 8600 },
    ],
    roads: [
      { id: 'R001', status: 'clear',      label: 'CLEAR' },
      { id: 'R002', status: 'congested',  label: 'ALERT TRAFFIC' },
      { id: 'R003', status: 'clear',      label: 'CLEAR' },
      { id: 'R004', status: 'congested',  label: 'DIVERTED' },
      { id: 'R005', status: 'clear',      label: 'CLEAR' },
      { id: 'R006', status: 'restricted', label: 'ALERT ZONE' },
    ],
    shelters: [
      { id: 'S001', occupancy: 1500, utilizationPercent: 30, state: 'available', status: 'OPEN' },
      { id: 'S002', occupancy: 2400, utilizationPercent: 30, state: 'available', status: 'OPEN' },
      { id: 'S003', occupancy: 900,  utilizationPercent: 30, state: 'available', status: 'OPEN' },
    ],
    threatZone: null,
    evacuationRoutes: [
      { id: 'EV001', path: [[77.2270, 28.6285], [77.2167, 28.6315], [77.1993, 28.6282]], status: 'standby', direction: 'WEST' },
    ],
    stats: {
      populationAtRisk: 16500,
      criticalInfraCount: 1,
      hospitalAccessPct: 82,
      estimatedEvacMinutes: 18,
      overallRiskScore: 52,
    },
  },

  intervention: {
    description: 'Activate precautionary shelters and establish traffic diversion routes.',
    actionLabel: 'ACTIVATE PRECAUTIONARY MEASURES',
    actionDetail: 'Shelter pre-positioning · Traffic diversion',
    buildings: [
      { id: 'B001', riskLevel: 'low',      status: 'CLEARED',     extrusionMultiplier: 1.0 },
      { id: 'B002', riskLevel: 'low',      status: 'CLEARED',     extrusionMultiplier: 1.0 },
      { id: 'B003', riskLevel: 'elevated', status: 'MONITORING',  extrusionMultiplier: 1.0 },
      { id: 'B004', riskLevel: 'low',      status: 'OPERATIONAL', extrusionMultiplier: 1.0 },
      { id: 'B005', riskLevel: 'low',      status: 'OPERATIONAL', extrusionMultiplier: 1.0 },
      { id: 'B006', riskLevel: 'low',      status: 'CLEARED',     extrusionMultiplier: 1.0 },
      { id: 'B007', riskLevel: 'elevated', status: 'MONITORING',  extrusionMultiplier: 1.0 },
      { id: 'B008', riskLevel: 'low',      status: 'OPERATIONAL', extrusionMultiplier: 1.0 },
      { id: 'B009', riskLevel: 'low',      status: 'CLEARED',     extrusionMultiplier: 1.0 },
      { id: 'B010', riskLevel: 'low',      status: 'OPERATIONAL', extrusionMultiplier: 1.0 },
    ],
    roads: [
      { id: 'R001', status: 'clear',     label: 'CLEAR' },
      { id: 'R002', status: 'clear',     label: 'IMPROVED' },
      { id: 'R003', status: 'clear',     label: 'CLEAR' },
      { id: 'R004', status: 'clear',     label: 'OPEN' },
      { id: 'R005', status: 'clear',     label: 'CLEAR' },
      { id: 'R006', status: 'congested', label: 'MONITORING' },
    ],
    shelters: [
      { id: 'S001', occupancy: 1750, utilizationPercent: 35, state: 'available', status: 'ACCEPTING' },
      { id: 'S002', occupancy: 2800, utilizationPercent: 35, state: 'available', status: 'OPEN' },
      { id: 'S003', occupancy: 1050, utilizationPercent: 35, state: 'available', status: 'OPEN' },
      { id: 'S004', occupancy: 175,  utilizationPercent: 35, state: 'available', status: 'STANDBY' },
    ],
    stats: {
      populationAtRisk: 8000,
      criticalInfraCount: 0,
      hospitalAccessPct: 95,
      estimatedEvacMinutes: 13,
      overallRiskScore: 28,
    },
  },

  timeline: [
    {
      index: 0, label: 'T+0', time: 0,
      event: 'ALERT ISSUED',
      description: 'Unclassified urban emergency reported. Situation under assessment. All agencies on standby.',
      statusText: 'Initial alert active. Awaiting situation assessment.',
      diff: {},
    },
    {
      index: 1, label: 'T+5', time: 5,
      event: 'SITUATION DEVELOPING',
      description: 'Emergency source partially identified. Precautionary evacuations initiated in affected zone.',
      statusText: 'Situation developing. Precautionary measures active.',
      diff: {
        buildings: [
          { id: 'B007', riskLevel: 'high', status: 'EVACUATING' },
        ],
        roads: [
          { id: 'R004', status: 'restricted', label: 'ALERT ZONE' },
        ],
        stats: { populationAtRisk: 18000, estimatedEvacMinutes: 20 },
      },
    },
    {
      index: 2, label: 'T+10', time: 10,
      event: 'ALERT ESCALATED',
      description: 'Emergency escalated to Level 2. Additional zones placed on alert. Traffic diversions activated.',
      statusText: 'Level 2 alert active. Zone expansion in progress.',
      diff: {
        buildings: [
          { id: 'B002', riskLevel: 'high', status: 'EVACUATING' },
        ],
        roads: [
          { id: 'R002', status: 'restricted', label: 'DIVERSION' },
        ],
        shelters: [
          { id: 'S001', occupancy: 2000, utilizationPercent: 40, state: 'available' },
        ],
        stats: { populationAtRisk: 22000, estimatedEvacMinutes: 24 },
      },
    },
    {
      index: 3, label: 'T+15', time: 15,
      event: 'SHELTER INTAKE RISING',
      description: 'Shelter intake accelerating. Situation contained but population movement ongoing.',
      statusText: 'Situation stabilising. Shelter intake monitored.',
      diff: {
        shelters: [
          { id: 'S001', occupancy: 2750, utilizationPercent: 55, state: 'strained' },
          { id: 'S002', occupancy: 4400, utilizationPercent: 55, state: 'strained' },
        ],
        stats: { estimatedEvacMinutes: 22 },
      },
    },
    {
      index: 4, label: 'T+30', time: 30,
      event: 'SITUATION CONTROLLED',
      description: 'Emergency source contained. All zones accounted for. Recovery phase beginning.',
      statusText: 'Situation under control. Recovery phase initiated.',
      diff: {
        buildings: [
          { id: 'B007', riskLevel: 'elevated', status: 'MONITORING' },
          { id: 'B002', riskLevel: 'elevated', status: 'MONITORING' },
        ],
        stats: { populationAtRisk: 12000, estimatedEvacMinutes: 18, overallRiskScore: 42 },
      },
    },
  ],

  causalFactors: {
    shelterDeficit:    { value: 45, label: 'Shelter Deficit',     description: 'Moderate shelter gap in affected zone' },
    populationDensity: { value: 55, label: 'Population Density',  description: 'Medium-high density in alert area' },
    roadAccessibility: { value: 38, label: 'Road Accessibility',  description: 'Minor disruptions to road network' },
    infrastructure:    { value: 30, label: 'Infrastructure Risk', description: 'Low infrastructure vulnerability in this scenario' },
  },

  comparisonStats: {
    evacTimeBefore:  18, evacTimeAfter:  13, evacTimeUnit:  'min',
    overloadBefore:  55, overloadAfter:  35, overloadUnit:  '%',
    riskZonesBefore:  6, riskZonesAfter:  3, riskZonesUnit: 'zones',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

/** All scenarios in priority order (generic must be last — it's the fallback). */
export const ALL_SCENARIOS = [
  SCENARIO_SECURITY,
  SCENARIO_EARTHQUAKE,
  SCENARIO_FLOOD,
  SCENARIO_GENERIC,
]

/** Static city entity definitions (same for all scenarios). */
export { BUILDING_DEFS, ROAD_DEFS, SHELTER_DEFS }

/**
 * Match a free-text scenario description to the best-fit scenario.
 * Returns the generic fallback if no keywords match.
 *
 * @param {string} input — raw user text
 * @returns {object} matched scenario
 */
export function matchScenario(input) {
  if (!input || typeof input !== 'string') return SCENARIO_GENERIC

  const normalized = input.toLowerCase().trim()

  // Score each non-generic scenario by keyword hits
  const scored = ALL_SCENARIOS
    .filter((s) => s.keywords.length > 0)
    .map((s) => ({
      scenario: s,
      score: s.keywords.filter((kw) => normalized.includes(kw)).length,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.length > 0 ? scored[0].scenario : SCENARIO_GENERIC
}

/**
 * Get scenario by id.
 *
 * @param {string} id
 * @returns {object|undefined}
 */
export function getScenarioById(id) {
  return ALL_SCENARIOS.find((s) => s.id === id)
}
