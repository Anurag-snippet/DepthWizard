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
          950: '#f6f8fb', // App background
          900: '#ffffff', // Main surface
          850: '#ffffff', // Card surface
          800: '#eef2f7', // Soft panel
          700: '#d9e1ec', // Borders & divider
          600: '#c6d2e1', // Hover state
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
        'geo-card': '0 4px 18px -6px rgba(15, 23, 42, 0.18)',
        'geo-glow': '0 0 18px -6px rgba(37, 99, 235, 0.25)',
      }
    },
  },
  plugins: [],
}
