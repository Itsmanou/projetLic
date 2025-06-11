"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePanier } from "@/app/context/PanierContext";
import { FaShoppingCart, FaUserCircle } from "react-icons/fa"; // ✅ Ajout de l'icône login admin

export default function Navbar() {
  const { panier } = usePanier();
  const [recherche, setRecherche] = useState("");
  const router = useRouter();

  const handleRecherche = (e: React.FormEvent) => {
    e.preventDefault();
    if (recherche.trim()) {
      router.push(`/recherche?query=${encodeURIComponent(recherche.trim())}`);
      setRecherche(""); // optionnel : vider le champ
    }
  };

  return (
    <header className="bg-black text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div className="flex items-center space-x-3 hover:scale-105 transform transition">
        <Image src="/logo.jpg" alt="Logo PharmaShop" width={40} height={40} />
        <Link href="/" className="text-2xl font-bold text-white">PharmaShop</Link>
      </div>

      <nav className="flex flex-wrap items-center gap-4 text-sm sm:text-base">
        <Link href="/apropos" className="hover:underline">À propos</Link>
        <Link href="/produits" className="hover:underline">Produits</Link>
        <Link href="/contact" className="hover:underline">Contact</Link>
      </nav>

      <div className="flex items-center gap-4">
        <form onSubmit={handleRecherche} className="flex border rounded overflow-hidden">
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher..."
            className="px-2 py-1 text-black bg-white focus:outline-none"
          />
          <button type="submit" className="bg-blue text-black px-2">🔍</button>
        </form>

        {/* ✅ Panier et Icône de connexion admin à droite */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Link href="/panier" className="text-2xl">
              <FaShoppingCart />
            </Link>
            {panier.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {panier.length}
              </span>
            )}
          </div>

          <Link href="/dashboard/adminlogin" className="text-white text-2xl hover:text-gray-400">
            <FaUserCircle />
          </Link>
        </div>
      </div>
    </header>
  );
}
