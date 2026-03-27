/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebarBg: "#0f172a",
        sidebarBorder: "#1e293b",
        sidebarActive: "#3b82f6",
      },
      spacing: {
        72: "18rem", // for expanded sidebar width
        20: "5rem",  // for collapsed sidebar width
      },
      transitionProperty: {
        width: "width",
      },
    },
  },
  plugins: [],
}