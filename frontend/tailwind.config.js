/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        peach: {
          50:  "#fdf5ef",
          100: "#fae8d4",
          200: "#f5c6a0",
          300: "#f0a46c",
          400: "#e8823a",
          500: "#d4631b",
          600: "#b54e16",
          700: "#8f3c13",
          800: "#6e2e10",
          900: "#55230d",
        },
      },
    },
  },
  plugins: [],
}

