/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // Deepest Navy
        surface: '#0f172a',    // Dark Slate
        'surface-light': '#1e293b',
        primary: {
          DEFAULT: '#38bdf8', // Cyan/Sky Blue
          dark: '#0284c7',
          glow: 'rgba(56, 189, 248, 0.15)',
        },
        accent: {
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          indigo: '#6366f1',
        },
        slate: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          400: '#94a3b8',
          200: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'premium-gradient': 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
      }
    },
  },
  plugins: [],
}
