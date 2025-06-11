import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,  // Active les vérifications strictes
  swcMinify: true,        // Active l’optimisation du code

  images: {
    // Nouveau format requis par Next.js pour autoriser les images distantes
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },

  experimental: {
    serverActions: {
      // Exemple de configuration si besoin
      // bodySizeLimit: '1mb',
      // allowedOrigins: ['http://localhost:3000'],
    },
  },
};

export default nextConfig;