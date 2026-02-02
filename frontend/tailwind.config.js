/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "primary-blue": "#696FC7",
        lavender: "#A7AAE1",
        cream: "#E6D8C3",
        terracotta: "#D97D55",
        mustard: "#E9B63B",
        // TODO: Documentation.md does not specify an exact mint hex.
        mint: "#BFE6D0",
      },
    },
  },
  plugins: [],
};
