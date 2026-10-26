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
        background: "#ffffff",
        surface: "#f8fafc",
        surfaceCard: "#ffffff",
        borderDark: "#e2e8f0",
        brandBlue: "#2563eb",
        brandCyan: "#0284c7",
        safeGreen: "#16a34a",
        alertOrange: "#d97706",
        hazardRed: "#dc2626",
        textPrimary: "#0f172a",
        textSecondary: "#475569",
        textMuted: "#64748b"
      },
    },
  },
  plugins: [],
};
