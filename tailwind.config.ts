import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#070C16",
        panel: "#101B33",
        panel2: "#14213D",
        line: "rgba(140,158,196,0.16)",
        ink: "#F4F6FA",
        inkdim: "#8B98B8",
        // Real brand palette, sampled from the DIAV logo file
        brand: {
          deep: "#2E3F8C",
          mid: "#3C64C8",
          cyan: "#2FB8E0",
          red: "#E23A3A",
          orange: "#F0A23C",
          green: "#7CC24A",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2E3F8C 0%, #3C64C8 52%, #2FB8E0 100%)",
      },
      animation: {
        "gradient-shift": "gradientShift 6s ease-in-out infinite",
        "pulse-slow": "pulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
