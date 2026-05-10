/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse relies on Node.js built-ins (fs, path) which must not be
  // bundled for the browser.  Since we only use it inside API routes
  // (server-side), the default behaviour is fine, but the dev server
  // sometimes tries to resolve it for the client bundle.  This tells
  // webpack to treat it as an external on the server and ignore it on
  // the client.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
