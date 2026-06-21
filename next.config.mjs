/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep these out of the webpack bundle so Node resolves their correct CJS
  // entry at runtime. Bundling them caused `require() of ES Module` on Vercel
  // (dompurify ships an ESM build that the serverless bundler require()'d).
  serverExternalPackages: ['isomorphic-dompurify', 'dompurify', 'jsdom', 'typescript'],
};

export default nextConfig;
