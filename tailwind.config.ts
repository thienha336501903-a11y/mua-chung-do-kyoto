import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kyoto: {
          50: "#f2f8f5",
          100: "#e1efe8",
          200: "#c4dfd3",
          300: "#99c6b4",
          400: "#69a790",
          500: "#448a71",
          600: "#326f5a",
          700: "#275949",
          800: "#1e463a",
          900: "#0c3b2e",
          950: "#06221b",
        },
        champagne: {
          50: "#fdfbf7",
          100: "#faf5eb",
          200: "#f3e7cf",
          300: "#e9d3a7",
          400: "#ddba78",
          500: "#d4a350",
          600: "#ba833b",
          700: "#96632e",
          800: "#7b502b",
          900: "#674227",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(12, 59, 46, 0.08)",
        card: "0 10px 30px -5px rgba(12, 59, 46, 0.06), 0 0 1px 1px rgba(12, 59, 46, 0.05)",
        gold: "0 10px 25px -5px rgba(212, 163, 80, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
