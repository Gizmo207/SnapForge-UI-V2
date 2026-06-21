/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the (large, CJS) TypeScript compiler out of the webpack bundle; Node
  // resolves it at runtime. HTML sanitization now uses htmlparser2 (pure CJS),
  // so jsdom/dompurify are gone entirely.
  serverExternalPackages: ['typescript'],
};

export default nextConfig;
