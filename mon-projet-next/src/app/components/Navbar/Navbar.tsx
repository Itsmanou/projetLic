"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePanier } from "@/app/context/PanierContext";
import { FaShoppingCart, FaUserCircle, FaBars, FaTimes, FaSearch } from "react-icons/fa";
import { getCurrentUser, logout } from "@/utils/api";

export default function Navbar() {
  const { panier, isLoading } = usePanier();
  const [recherche, setRecherche] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());

    // Listen for localStorage changes (login/logout in other tabs)
    const syncUser = () => setUser(getCurrentUser());
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const handleRecherche = (e: React.FormEvent) => {
    e.preventDefault();
    if (recherche.trim()) {
      router.push(`/recherche?query=${encodeURIComponent(recherche.trim())}`);
      setRecherche("");
      setMobileMenuOpen(false); // Close mobile menu after search
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Cart count with loading state
  const cartCount = isLoading ? 0 : panier.length;
  const showCartBadge = !isLoading && panier.length > 0;

  // Get user's initial
  const getUserInitial = () => {
    if (!user || !user.name) return null;
    return user.name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/");
  };

  return (
    <header className="bg-black text-white shadow-lg sticky top-0 z-50">
      {/* Main navbar container */}
      <div className="container mx-auto px-4">
        {/* Desktop and mobile header */}
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo section */}
          <div className="flex items-center space-x-3 hover:scale-105 transform transition-transform duration-200">
            <Image 
              src="/logo.jpg" 
              alt="Logo PharmaShop" 
              width={40} 
              height={40} 
              className="rounded-full"
            />
            <Link href="/" className="text-xl lg:text-2xl font-bold text-white">
              PharmaShop
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/apropos" 
              className="text-white hover:text-blue-400 transition-colors duration-200 font-medium"
            >
              À propos
            </Link>
            <Link 
              href="/produits" 
              className="text-white hover:text-blue-400 transition-colors duration-200 font-medium"
            >
              Produits
            </Link>
            <Link 
              href="/contact" 
              className="text-white hover:text-blue-400 transition-colors duration-200 font-medium"
            >
              Contact
            </Link>
          </nav>

          {/* Desktop search and icons */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Search form */}
            <form onSubmit={handleRecherche} className="flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-64 px-4 py-2 pr-12 text-black bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <FaSearch className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Cart and user icons */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <div className="relative">
                <Link 
                  href="/panier" 
                  className="text-white hover:text-blue-400 transition-colors duration-200"
                >
                  <FaShoppingCart className="w-6 h-6" />
                </Link>
                {showCartBadge && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {cartCount}
                  </span>
                )}
                {isLoading && (
                  <span className="absolute -top-2 -right-2 bg-gray-400 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </span>
                )}
              </div>

              {/* User profile/Login */}
              {user ? (
                <div className="relative group">
                  <button
                    className="bg-blue-500 w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={user.name}
                  >
                    {getUserInitial()}
                  </button>
                  {/* Dropdown on hover */}
                  <div className="absolute right-0 mt-2 w-36 bg-white text-black rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                    <div className="px-4 py-2 border-b">{user.name}</div>
                    <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">Mon profil</Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="text-white hover:text-blue-400 transition-colors duration-200"
                >
                  <FaUserCircle className="w-6 h-6" />
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button and icons */}
          <div className="lg:hidden flex items-center space-x-4">
            {/* Mobile cart */}
            <div className="relative">
              <Link 
                href="/panier" 
                className="text-white hover:text-blue-400 transition-colors duration-200"
              >
                <FaShoppingCart className="w-5 h-5" />
              </Link>
              {showCartBadge && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold text-[10px]">
                  {cartCount}
                </span>
              )}
              {isLoading && (
                <span className="absolute -top-2 -right-2 bg-gray-400 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </span>
              )}
            </div>

            {/* Mobile user profile/Login */}
            {user ? (
              <div className="relative group">
                <button
                  className="bg-blue-500 w-7 h-7 flex items-center justify-center rounded-full text-white font-bold text-base focus:outline-none"
                  title={user.name}
                >
                  {getUserInitial()}
                </button>
                {/* Dropdown on click for mobile */}
                {mobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white text-black rounded shadow-lg z-50">
                    <div className="px-4 py-2 border-b">{user.name}</div>
                    <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100" onClick={closeMobileMenu}>Mon profil</Link>
                    <button
                      onClick={() => { handleLogout(); closeMobileMenu(); }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="text-white hover:text-blue-400 transition-colors duration-200"
              >
                <FaUserCircle className="w-5 h-5" />
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={toggleMobileMenu}
              className="text-white hover:text-blue-400 transition-colors duration-200 p-1"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <FaTimes className="w-5 h-5" />
              ) : (
                <FaBars className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen 
            ? 'max-h-96 opacity-100 visible' 
            : 'max-h-0 opacity-0 invisible overflow-hidden'
        }`}>
          <div className="py-4 space-y-4 border-t border-gray-700">
            {/* Mobile search */}
            <form onSubmit={handleRecherche} className="px-2">
              <div className="relative">
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full px-4 py-2 pr-12 text-black bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-600"
                >
                  <FaSearch className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Mobile navigation links */}
            <nav className="flex flex-col space-y-2 px-2">
              <Link 
                href="/apropos" 
                onClick={closeMobileMenu}
                className="text-white hover:text-blue-400 transition-colors duration-200 py-2 px-2 rounded hover:bg-gray-800"
              >
                À propos
              </Link>
              <Link 
                href="/produits" 
                onClick={closeMobileMenu}
                className="text-white hover:text-blue-400 transition-colors duration-200 py-2 px-2 rounded hover:bg-gray-800"
              >
                Produits
              </Link>
              <Link 
                href="/contact" 
                onClick={closeMobileMenu}
                className="text-white hover:text-blue-400 transition-colors duration-200 py-2 px-2 rounded hover:bg-gray-800"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}