// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // هنا حطي أي إعدادات انتي كنتِ حاطّتها (ألوان، فونت، ...).
      // مثال بسيط:
      fontFamily: {
        sans: [
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Noto Kufi Arabic",
          "Noto Sans Arabic",
          "Tahoma",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
