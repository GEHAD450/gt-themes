/** @type {import('next').NextConfig} */
// A fully static site (GitHub Pages): no server, every page is a file.
// NEXT_PUBLIC_BASE_PATH is the folder the site lives in ("/gt-themes" on a project site,
// empty on a domain of its own); the deploy workflow sets it from the repository's name.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
