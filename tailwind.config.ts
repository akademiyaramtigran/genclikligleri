import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  safelist: [
    { pattern: /(bg|text|border|ring|from|to|via)-(emerald|orange|sky|violet|rose|fuchsia|amber|green|red|blue|slate|zinc|yellow|teal|stone)-(50|100|200|300|400|500|600|700|800|900)/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-oswald)", "Impact", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        music: ["var(--font-unbounded)", "var(--font-inter)", "sans-serif"],
        stage: ["var(--font-anton)", "Impact", "sans-serif"],
        grotesk: ["var(--font-grotesk)", "var(--font-inter)", "sans-serif"],
      },
      colors: {
        basalt: {
          50: "#f6f7f9", 100: "#eceef2", 200: "#d5d9e2", 300: "#b0b8c9", 400: "#8592ab", 500: "#667391",
          600: "#515c78", 700: "#434b62", 800: "#1e2433", 900: "#121622", 950: "#0a0d15",
        },
        dicle: { 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e" },
        curtain: { 700: "#7f1d1d", 800: "#5c1414", 900: "#3b0b0b", 950: "#220606" },
        gold: { 300: "#fde68a", 400: "#fbbf24", 500: "#d4a017" },
        stage: { 900: "#1c1c1f", 950: "#0c0c0e", line: "#2c2c30" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 4px 16px -4px rgba(16,24,40,.08)",
        glow: "0 0 40px -8px rgba(217,70,239,.6)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "none" } },
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".3" } },
        spot: { "0%,100%": { transform: "rotate(-12deg)" }, "50%": { transform: "rotate(12deg)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        "fade-up": "fade-up .6s ease-out both",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
        spot: "spot 8s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
