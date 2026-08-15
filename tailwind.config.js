/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  "./*.html",
  "./pages/**/*.html",
  "./assets/js/**/*.js",
  "./assets/components/**/*.js"
],
  theme: {
    extend: {
      colors: {
        'kn-blue': '#00479b',
        'kn-orange': '#ff5e00',
        'kn-light': '#f5f6f8',
        'kn-dark': '#003370'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
