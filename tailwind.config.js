/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Core canvas & surfaces ────────────────────────────────────────
        canvas:    '#08090B',   // page background — near-black
        surface:   '#0F1117',   // panel surface — slightly lifted
        'surface-2': '#161821', // secondary raised surface

        // ── Dividers ─────────────────────────────────────────────────────
        hairline:  '#1E2029',   // 1px borders / dividers

        // ── Typography ───────────────────────────────────────────────────
        ink:       '#E8EAF0',   // primary text
        'ink-dim': '#8B90A0',   // secondary text
        'ink-faint':'#45495A',  // tertiary / disabled text

        // ── Interactive accent ────────────────────────────────────────────
        accent:    '#3B82F6',   // blue accent — links, active states
        'accent-dim': '#1D4ED8',

        // ── Risk scale ───────────────────────────────────────────────────
        'risk-green':  '#22C55E',
        'risk-yellow': '#EAB308',
        'risk-orange': '#F97316',
        'risk-red':    '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderWidth: {
        hairline: '1px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.3s ease-out forwards',
        'slide-up':   'slideUp 0.35s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
