/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: '#ebedf0',
        card: '#ffffff',
      }
    },
  },
  plugins: [],
}
