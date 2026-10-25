/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f1f7f3', 100: '#dcebe2', 200: '#b9d7c5', 500: '#2f7d57', 600: '#1f6b47', 700: '#165a3b', 800: '#0f4a30', 900: '#0a3a25' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
