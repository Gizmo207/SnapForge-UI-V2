/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SWC transform for styled-components (stable class names + SSR). Used by the
  // landing page's vault components; pairs with the StyledComponentsRegistry.
  compiler: { styledComponents: true },
  // Keep the (large, CJS) TypeScript compiler out of the webpack bundle; Node
  // resolves it at runtime. HTML sanitization now uses htmlparser2 (pure CJS),
  // so jsdom/dompurify are gone entirely.
  serverExternalPackages: ['typescript'],
};

export default nextConfig;
