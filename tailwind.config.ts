import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#F7FAFC",
          100: "#EDF2F7",
          200: "#E2E8F0",
          300: "#CBD5E0",
          400: "#A0AEC0",
          500: "#718096",
          600: "#4A5568",
          700: "#2D3748",
          800: "#1A202C",
          900: "#171923",
        },
        terracotta: {
          50: "#FBF3EE",
          100: "#F4DFD0",
          200: "#E7BFA1",
          300: "#D89E72",
          400: "#C57E4D",
          500: "#A0522D",
          600: "#824326",
          700: "#62331E",
          800: "#3F2114",
          900: "#21100A",
        },
        ink: "#2D3748",
        paper: "#FFFFFF",
        sand: "#F7FAFC",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: [
          "var(--font-poppins)",
          "Poppins",
          "var(--font-inter)",
          "Inter",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(45,55,72,0.04), 0 4px 16px rgba(45,55,72,0.06)",
        lift: "0 4px 8px rgba(45,55,72,0.06), 0 16px 32px rgba(45,55,72,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
