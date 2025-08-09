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
    // Add timeout and optimization settings
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Add timeout settings for image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    // Disable image optimization for external images to prevent timeouts
    unoptimized: true,
  },
  
  // Add experimental settings for better performance (stable features only)
  experimental: {
    // Optimize bundle size
    optimizePackageImports: ['@supabase/ssr', '@supabase/supabase-js'],
  },
  
  // Add webpack configuration for better performance
  webpack: (config, { isServer }) => {
    // Optimize image handling
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      type: 'asset/resource',
    });
    
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // Add headers for better caching
  async headers() {
    return [
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Add compiler optimizations
  compiler: {
    // Keep console logs for debugging real-time issues
    // removeConsole: process.env.NODE_ENV === 'production',
  },

  // Add performance optimizations
  poweredByHeader: false,
  
  // Add compression
  compress: true,
};

export default nextConfig;
