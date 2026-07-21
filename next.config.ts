/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  typedRoutes: true,
  eslint: {
    // Les warnings ESLint ne bloquent pas le build Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
