/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        rubik: ["Rubik-Regular", "sans-serif"],
        "rubik-bold": ["Rubik-Bold", "sans-serif"],
        "rubik-extrabold": ["Rubik-ExtraBold", "sans-serif"],
        "rubik-medium": ["Rubik-Medium", "sans-serif"],
        "rubik-semibold": ["Rubik-SemiBold", "sans-serif"],
        "rubik-light": ["Rubik-Light", "sans-serif"],
        "SF-bold":["SF-bold","sans-serif"],
        "SF-heavy":["SF-heavy","sans-serif"],
        "SF-light":["SF-light","sans-serif"],
        "SF-medium":["SF-medium","sans-serif"],
        "SF-regular":["SF-regular","sans-serif"],
        "SF-semibold":["SF-semibold","sans-serif"],
        "PP-bold":["PP-bold","sans-serif"],
        "PP-semibold":["PP-semibold","sans-serif"],
        "PP-light":["PP-light","sans-serif"],
        "PP-medium":["PP-medium","sans-serif"],
        "PP-regular":["PP-regular","sans-serif"],
      },
      colors: {
        primary: {
          100: "#EFF3FF",
          200: "#C6DBEF",
          300: "#9ECAE1",
          400: "#6baed6",
          500: "#3182bd",
          600: "#08519c"
        },
        accent: {
          100: "#FBFBFD",
        },
        black: {
          DEFAULT: "#000000",
          100: "#8C8E98",
          200: "#666876",
          300: "#191D31",
        },
        danger: "#F75555",
      },
    },
  },
  plugins: [],
};