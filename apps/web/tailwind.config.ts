import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fw: {
          bg: "#1a1a1a",
          panel: "#1f1f1f",
          border: "#2d2d2d",
          text: "#e0e0e0",
          muted: "#888888",
          accent: "#4f8ef7",
          "accent-hover": "#6fa3f9",
          error: "#f87171",
          warning: "#fbbf24",
          success: "#4ade80",
        },
      },
    },
  },
  plugins: [],
};

export default config;
