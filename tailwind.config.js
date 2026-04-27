/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clinical blue-grey palette — professional, not sterile
        slate: {
          850: '#1a2332',
          950: '#0d1420',
        },
        clinical: {
          50:  '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        seam: {
          // The seam indicator color — amber for in-flight, green for accepted, red for failed
          idle:      '#6b7280',
          flight:    '#d97706',
          accepted:  '#059669',
          retryable: '#dc2626',
          permanent: '#7c3aed',
        }
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
