import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,  // Active les vérifications strictes
  swcMinify: true,        // Active l'optimisation du code

  images: {
    // Configuration pour autoriser les images distantes
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // ✅ Ajout de Cloudinary
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
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

  eslint: {
    ignoreDuringBuilds: true, // Ignore les erreurs ESLint pendant le build
  },

  typescript: {
    ignoreBuildErrors: true, // Ignore les erreurs TypeScript pendant le build
  },
};

export default nextConfig;