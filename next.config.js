/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@remotion/bundler', '@remotion/renderer', 'esbuild'],
  experimental: {
    serverActions: {
      allowedOrigins: ['http://localhost:3000'],
      bodySizeLimit: '100mb',
    },
    // esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark these packages as external on the server
      config.externals.push('@remotion/bundler', '@remotion/renderer', 'esbuild');
    }

    // Handle video files
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
      type: 'asset/resource',
    });

    // Remotion requires these fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
  // api: {
  //   responseLimit: false,
  //   bodyParser: {
  //     sizeLimit: '100mb',
  //   },
  // },
  // env: {
  //   NODE_OPTIONS: '--max-old-space-size=4096',
  // },
};

module.exports = nextConfig;
