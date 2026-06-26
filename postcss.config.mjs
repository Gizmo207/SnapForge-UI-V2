/** Tailwind v4 runs through PostCSS. Only the landing page uses Tailwind; it's
 * imported into globals.css without preflight so the existing app UI is untouched. */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
