"use client";
import { Mail, Phone } from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-sm text-white px-8 py-10 w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto w-full">
        <div>
          <h2 className="font-semibold mb-2">Services</h2>
          <p>Livraison rapide</p>
          <p>Produits certifiés</p>
          <p>Assistance 24/7</p>
        </div>

        <div>
      <h2 className="text-lg font-semibold mb-4">Liens rapides</h2>
      <ul className="space-y-2 text-sm">
        <li><a href="/" className="hover:underline">Accueil</a></li>
        <li><a href="/produits" className="hover:underline">Produits</a></li>
        <li><a href="/contact" className="hover:underline">Contact</a></li>
        <li><a href="/apropos" className="hover:underline">À propos</a></li>
      </ul>
       </div>
        <div>
          <h2 className="font-semibold mb-2">Contact</h2>
          <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> kamenimanuella932@gmail.com</p>
          <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +237 659 556 885 / 674 446 765</p>
        </div>
           <div>
          <h2 className="font-semibold mb-2">Moyens de paiement</h2>
           <div className="flex gap-4 items-center mb-4">
          <Image src="/orange-money.jpg" alt="Orange Money" width={80} height={30} />
          <Image src="/MTN-Mobile-Money.png" alt="MTN Money" width={80} height={30} />
           </div>
      <div>
      <h2 className="text-lg font-semibold mb-4">Suivez-nous</h2>
      <div className="flex gap-4">
        <a href="https://facebook.com" target="_blank"><FaFacebook className="w-5 h-5 hover:text-blue-500" /></a>
        <a href="https://instagram.com" target="_blank"><FaInstagram className="w-5 h-5 hover:text-pink-500" /></a>
        <a href="https://wa.me/237659556885" target="_blank"><FaWhatsapp className="w-5 h-5 hover:text-green-500" /></a>
        <a href="https://youtube.com" target="_blank"><FaYoutube className="w-5 h-5 hover:text-red-500" /></a>
      </div>
    </div>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-600 pt-4">
        © 2025 — Site de vente de produits pharmaceutiques. Tous droits réservés.
      </div>
    </footer>
  );
}
