import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed ignoreDuringBuilds and ignoreBuildErrors
  // This ensures code quality checks run during build
  
  // Configure image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kjuomsrchqrhyjgmbzgf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Add any other image domains you might use
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
