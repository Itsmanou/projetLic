"use client";

import { Mail, Phone, MapPin } from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <footer className="bg-black text-white">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-black text-white">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Company Info & Logo */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <Image 
                src="/logo.jpg" 
                alt="Logo PharmaShop" 
                width={40} 
                height={40} 
                className="rounded-full"
                priority
              />
              <h2 className="text-xl font-bold">PharmaShop</h2>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Votre pharmacie en ligne de confiance. Nous proposons des produits pharmaceutiques 
              certifiés avec une livraison rapide et sécurisée.
            </p>
            
            {/* Services */}
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-400 mb-3">Nos Services</h3>
              <div className="space-y-1 text-sm text-gray-300">
                <p className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Livraison rapide
                </p>
                <p className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Produits certifiés
                </p>
                <p className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Assistance 24/7
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Liens rapides</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link 
                  href="/produits" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Produits
                </Link>
              </li>
              <li>
                <Link 
                  href="/apropos" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  href="/panier" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Mon Panier
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-gray-300">
                <Mail className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <a 
                  href="mailto:kamenimanuella932@gmail.com"
                  className="hover:text-white transition-colors duration-200 break-all"
                >
                  kamenimanuella932@gmail.com
                </a>
              </div>
              
              <div className="flex items-start gap-3 text-gray-300">
                <Phone className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <div className="space-y-1">
                  <a 
                    href="tel:+237659556885"
                    className="block hover:text-white transition-colors duration-200"
                  >
                    +237 659 556 885
                  </a>
                  <a 
                    href="tel:+237674446765"
                    className="block hover:text-white transition-colors duration-200"
                  >
                    +237 674 446 765
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <p>Cameroun, Douala</p>
              </div>
            </div>
          </div>

          {/* Payment & Social */}
          <div>
            {/* Payment Methods */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Moyens de paiement</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="bg-white rounded-lg p-2 hover:scale-105 transition-transform duration-200">
                  <Image 
                    src="/orange-money.jpg" 
                    alt="Orange Money" 
                    width={70} 
                    height={25}
                    className="object-contain"
                  />
                </div>
                <div className="bg-white rounded-lg p-2 hover:scale-105 transition-transform duration-200">
                  <Image 
                    src="/MTN-Mobile-Money.png" 
                    alt="MTN Money" 
                    width={70} 
                    height={25}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Suivez-nous</h3>
              <div className="flex gap-4">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-500 hover:scale-110 transition-all duration-200"
                  aria-label="Facebook"
                >
                  <FaFacebook className="w-6 h-6" />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-pink-500 hover:scale-110 transition-all duration-200"
                  aria-label="Instagram"
                >
                  <FaInstagram className="w-6 h-6" />
                </a>
                <a 
                  href="https://wa.me/237659556885" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-green-500 hover:scale-110 transition-all duration-200"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp className="w-6 h-6" />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-red-500 hover:scale-110 transition-all duration-200"
                  aria-label="YouTube"
                >
                  <FaYoutube className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <p>
              © 2025 PharmaShop — Site de vente de produits pharmaceutiques. Tous droits réservés.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors duration-200">
                Politique de confidentialité
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors duration-200">
                Conditions d'utilisation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}