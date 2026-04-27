/** @type {import('next').NextConfig} */
const normalizeApiBase = (value) => {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) return '';
  return v.replace(/\/+$/, '').replace(/\/api$/i, '');
};

const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: normalizeApiBase(process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000',
  },
  async rewrites() {
    const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
