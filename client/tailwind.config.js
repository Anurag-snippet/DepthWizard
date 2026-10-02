/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        geo: {
          950: '#070A12', // Deep cosmic navy background
          900: '#0B0F19', // Main surface background
          850: '#111726', // Panel surface
          800: '#172033', // Card / module surface
          700: '#1E2B45', // Borders & divider
          600: '#2E3F63', // Hover state
          500: '#3B82F6', // Geospatial blue accent
          400: '#60A5FA', // Sky highlight
          300: '#93C5FD', // Light text highlight
          accent: '#38BDF8', // Cyan radar accent
          terrain: '#10B981', // Elevation green
          warning: '#F59E0B', // Disparity caution
          danger: '#EF4444' // Error
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'geo-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 189, 248, 0.1)',
        'geo-glow': '0 0 25px -5px rgba(56, 189, 248, 0.3)',
      }
    },
  },
  plugins: [],
}
