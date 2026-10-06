/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette taken from the project deck — kept across all surfaces.
        ink: "#13343B",
        mute: "#5B7A82",
        teal: "#028090",
        seafoam: "#00A896",
        mint: "#02C39A",
        amber: "#F5A623",
        danger: "#E63946",
        panel: "#F4F8F8",
        dark: "#0A2E36",
        dark2: "#0F3B45",
      },
      fontFamily: {
        serif: ['"Cambria"', "ui-serif", "Georgia", "serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
