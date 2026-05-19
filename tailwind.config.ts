import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Refined soil palette: warm neutrals + a single product accent.
        ink: {
          900: "#0F1410",
          800: "#1A2218",
          700: "#293126",
          600: "#3D453B",
          500: "#5A6256",
          400: "#7B8377",
          300: "#A3A99F",
          200: "#CFD3CA",
          100: "#E7E9E2",
          50: "#F4F5EF",
        },
        loam: {
          50: "#FBF6F0",
          100: "#F2E7D6",
          200: "#E2CFAE",
          300: "#CFB385",
          400: "#B89860",
          500: "#9A7E48",
          600: "#7A6238",
          700: "#5C4928",
        },
        moss: {
          50: "#F1F5EE",
          100: "#DAE6D2",
          200: "#B7CDA8",
          300: "#8FB179",
          400: "#6E9559",
          500: "#557A42",
          600: "#406032",
          700: "#2D4523",
          800: "#1B2C15",
        },
        clay: {
          50: "#FBF1EB",
          100: "#F2D7C5",
          200: "#E3AC8A",
          300: "#D08458",
          400: "#B86334",
          500: "#9D4F25",
          600: "#7B3D1C",
          700: "#5B2C13",
        },
        sky2: {
          50: "#F0F6FA",
          100: "#D7E6F1",
          200: "#A7C7DD",
          300: "#76A6C7",
          400: "#4E86AC",
          500: "#356A8E",
          600: "#244F6C",
          700: "#163749",
        },
        amber2: {
          50: "#FBF4DE",
          400: "#D8A33C",
          500: "#B88528",
        },
        rose2: {
          50: "#FBEEEA",
          400: "#D77264",
          500: "#B65849",
        },
        canvas: "#FAF7F1", // app background
        paper: "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: [
          "var(--font-fraunces)",
          "Fraunces",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightish: "-0.012em",
      },
      boxShadow: {
        card: "0 1px 1px rgba(15,20,16,0.04), 0 1px 2px rgba(15,20,16,0.05)",
        lift: "0 1px 2px rgba(15,20,16,0.05), 0 8px 24px rgba(15,20,16,0.08)",
        glow: "0 0 0 1px rgba(85,122,66,0.25), 0 8px 32px rgba(85,122,66,0.15)",
        innerSoft: "inset 0 1px 0 rgba(255,255,255,0.6)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      backgroundImage: {
        "grain":
          "radial-gradient(rgba(15,20,16,0.045) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
