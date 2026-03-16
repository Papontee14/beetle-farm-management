/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  "#f3f1ee",
          100: "#DCD7C9",
          200: "#c0bcb3",
          300: "#9ca09e",
          400: "#728080",
          500: "#4d6162",
          600: "#3F4E4F",
          700: "#354344",
          800: "#2C3639",
          900: "#202829",
        },
        soil: {
          50:  "#f5efe7",
          100: "#e8d8c5",
          200: "#d8c2a8",
          300: "#c5a988",
          400: "#b3906d",
          500: "#A27B5C",
          600: "#8c6a4e",
          700: "#725640",
          800: "#594333",
          900: "#3b2c21",
        },
      },
    },
  },
  plugins: [],
};
