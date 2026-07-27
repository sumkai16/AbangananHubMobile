/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#156F8C",
        secondary: "#2AA7A1",
        accent: "#69D2C6",
        cta: "#FF8A65",
        background: "#F7FCFC",
        section: "#EEF8F8",
        surface: "#FFFFFF",
        "text-primary": "#1F2937",
        "text-muted": "#64748B",
        border: "#E2E8F0",
        success: "#22C55E",
        warning: "#FBBF24",
        error: "#EF4444",
      },
    },
  },
  plugins: [],
};
