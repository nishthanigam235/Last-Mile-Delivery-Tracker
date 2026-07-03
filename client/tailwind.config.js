/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc3fb',
          400: '#38a3f8',
          500: '#0e87eb',
          600: '#026bc7',
          700: '#0355a2',
          800: '#074985',
          900: '#0c3e6e',
          950: '#082749',
        },
      },
    },
  },
  plugins: [],
}
