"use client"; // ✅ Ajout du client component

import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar"; // ✅ Update the path if Sidebar is in components/Sidebar/Sidebar.tsx
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import { PanierProvider } from "@/app/context/PanierContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// ✅ Metadata (à garder séparément si nécessaire)
// export const metadata: Metadata = {
//   title: "PharmaShop",
//   description: "Application de commande de produits pharmaceutiques",
// };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="fr" className={`${inter.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans">
        <QueryClientProvider client={queryClient}>
          <PanierProvider>
           *
              <div className="flex-1 p-6">
                <Navbar />
                {children}
                <Footer />
                <ToastContainer />
              </div>
            
          </PanierProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
