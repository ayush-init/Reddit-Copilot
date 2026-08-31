import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        reddit: {
          orange: "#FF4500",
          hover: "#E03D00",
          dark: "#1A1A1B",
          gray: "#272729",
          border: "#343536",
          text: "#D7DADC",
        },
      },
    },
  },
  plugins: [],
};
export default config;
