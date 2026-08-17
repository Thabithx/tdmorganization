/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        frost: {
          900: '#05070D', // Primary background
          800: '#0B101A', // Secondary background
          700: '#101722', // Cards
          600: '#141C28', // Elevated cards
          100: '#DDF7FF', // Frost highlight
          50: '#8BDFFF',  // Ice blue
        },
        primary: '#F4FBFF',
        secondary: '#8A9AAD'
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
