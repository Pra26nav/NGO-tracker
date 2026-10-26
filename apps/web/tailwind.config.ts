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
        primary: "#ffe17c",
        charcoal: "#171e19",
        sage: "#b7c6c2",
        brutal: {
          yellow: "#ffe17c",
          charcoal: "#171e19",
          sage: "#b7c6c2",
          white: "#ffffff",
          black: "#000000",
          red: "#ff5964",
          green: "#10b981",
          orange: "#ff9f1c",
        },
      },
      fontFamily: {
        heading: ["'Cabinet Grotesk'", "system-ui", "-apple-system", "sans-serif"],
        body: ["'Satoshi'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #000000",
        "brutal-lg": "8px 8px 0px 0px #000000",
        "brutal-xl": "12px 12px 0px 0px #000000",
        "brutal-sm": "2px 2px 0px 0px #000000",
        "brutal-press": "0px 0px 0px 0px #000000",
      },
      borderWidth: {
        brutal: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
