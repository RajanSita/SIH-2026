# Urban Resilience Decision Twin — SIH 2026

> AI-powered urban resilience command center for real-time threat simulation, causal analysis, and intervention planning.

[![Status](https://img.shields.io/badge/status-active-22C55E?style=flat-square)](https://github.com/RajanSita/SIH-2026)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Vite%20%7C%20Tailwind%20%7C%20MapLibre-3B82F6?style=flat-square)](https://github.com/RajanSita/SIH-2026)

---

## What This Is

A **scripted, fully-deterministic demo** of an AI-driven 3D Urban Resilience Decision Twin.

The core product loop:

```
Detect → Understand → Predict → Explain → Intervene → Compare
```

An operator describes a threat in natural language. The system interprets it, projects cascading effects across an urban environment, explains vulnerability causes, proposes interventions, and compares outcomes — all visualised on a live 3D map of Central Delhi.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 (named design tokens) |
| Map | MapLibre GL JS |
| Data | Local JSON (fully offline) |
| Deploy | Static — Vercel / Netlify |

---

## Build Progress

| Task | Feature | Status |
|---|---|---|
| 1 | Scaffold · Layout shell · Design system | ✅ Done |
| 2 | Scenario JSON datasets (4 scenarios) | ✅ Done |
| 3 | MapLibre 3D map · Buildings · Roads · Shelters | ✅ Done |
| 4 | Scenario input · Keyword matcher · AI delay | ✅ Done |
| 5 | Timeline scrubber · Play/pause · Keyframes | ✅ Done |
| 6 | Causal breakdown panel | ✅ Done |
| 7 | Intervention trigger · Comparison panel | ✅ Done |
| 8 | Polish · Transitions · Responsive | ✅ Done |
| 9 | Bug fixes · Rehearsal pass · Production build | ✅ Done |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Primary Scenario

> "High-severity hostile attack in Central Delhi"

Secondary scenarios: Earthquake · Flood · Generic fallback

---

*Built for SIH 2026 — Smart India Hackathon*
