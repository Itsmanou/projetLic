"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePanier } from "@/app/context/PanierContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  FaStar, 
  FaShoppingCart, 
  FaHeart, 
  FaTruck, 
  FaShieldAlt, 
  FaClock, 
  FaUserMd,
  FaPills,
  FaChevronRight,
  FaPlay
} from "react-icons/fa";

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category?: string;
  stock: number;
  rating?: number;
  isActive?: boolean;
}

interface ProductToAdd {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

// Product Card Component
interface ProductCardProps {
  product: Product;
  index: number;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, index, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const rating = product.rating || 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -10, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Product Image */}
      <Link href={`/produits/${product._id}`}>
        <div className="relative h-64 overflow-hidden cursor-pointer">
          <img
            src={imageError ? '/placeholder-product.jpg' : product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          
          {/* Stock Badge */}
          {product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 font-semibold">
              Stock faible
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 font-semibold">
              Rupture
            </div>
          )}

          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 font-semibold">
              {product.category}
            </div>
          )}

          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <FaHeart className="text-white text-2xl" />
          </motion.div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-6">
        <Link href={`/produits/${product._id}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.2, rotate: 15 }}
              transition={{ duration: 0.2 }}
            >
              <FaStar
                className={`text-sm ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
              />
            </motion.div>
          ))}
          <span className="text-sm text-gray-500 ml-2">({rating}/5)</span>
        </div>

        {/* Price and Stock */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold text-blue-600">
            {product.price.toLocaleString()} FCFA
          </div>
          <div className={`text-sm font-medium ${
            product.stock > 5 ? 'text-green-600' :
            product.stock > 0 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {product.stock > 0 ? `En stock (${product.stock})` : 'Rupture de stock'}
          </div>
        </div>

        {/* Add to Cart Button */}
        <motion.button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          whileHover={{ scale: product.stock > 0 ? 1.02 : 1 }}
          whileTap={{ scale: product.stock > 0 ? 0.98 : 1 }}
          className={`w-full py-3 px-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            product.stock > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <FaShoppingCart className="text-sm" />
          {product.stock > 0 ? 'Ajouter au panier' : 'Indisponible'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// Main Homepage Component
export default function HomePage() {
  const { ajouterAuPanier } = usePanier();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // Scroll animations
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    setHasMounted(true);
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      
      // Try to fetch products with error handling
      const response = await fetch('/api/search?limit=6&sortBy=newest');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.products) {
          setFeaturedProducts(data.data.products.slice(0, 6));
        }
      } else {
        console.warn('Failed to fetch products, using fallback');
        setFeaturedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    try {
      const productToAdd: ProductToAdd = {
        id: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      };
      ajouterAuPanier(productToAdd);
      toast.success(`${product.name} ajouté au panier!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white text-gray-900 overflow-x-hidden">
     
      
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleY }}
        className="fixed right-0 top-0 w-1 h-full bg-gradient-to-b from-blue-600 to-blue-400 origin-top z-50"
      />

      {/* Hero Section */}
      <motion.section 
        className="relative h-screen flex items-center justify-center overflow-hidden"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        {/* Background with CSS instead of Next/Image to avoid loading issues */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1585435557343-3b092031d886?w=1920&h=1080&fit=crop&crop=center')`
          }}
        >
          <div className="absolute inset-0 bg-blue-600" />
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 border-2 border-white/30"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-32 right-16 w-16 h-16 bg-white/10 backdrop-blur-sm"
          animate={{ rotate: -360, y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-6xl md:text-8xl font-black text-white mb-6"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent bg-300%">
                PharmaShop
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Votre pharmacie de confiance, accessible 24h/24. 
              <span className="text-white font-semibold"> Livraison rapide</span> et 
              <span className="text-white font-semibold"> produits certifiés</span> partout au Cameroun.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
            >
              <Link href="/produits">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 border-2 border-white hover:bg-white text-white px-8 py-4 font-bold text-lg shadow-xl transition-all duration-300 flex items-center gap-3 hover:text-blue-900"
                >
                  <FaShoppingCart />
                  Commander maintenant
                  <FaChevronRight className="text-sm" />
                </motion.button>
              </Link>
              
              <Link href="/apropos">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 font-bold text-lg transition-all duration-300 flex items-center gap-3"
                >
                  <FaPlay className="text-sm" />
                  En savoir plus
                </motion.button>
              </Link>
            </motion.div>

            {/* Static Stats - No API calls */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-blue-200 text-sm">Produits</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-3xl font-bold text-white">25+</div>
                <div className="text-blue-200 text-sm">Catégories</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-3xl font-bold text-white">1000+</div>
                <div className="text-blue-200 text-sm">Commandes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-3xl font-bold text-white">4.8</div>
                <div className="text-blue-200 text-sm">Note moyenne</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white"
        >
          <div className="w-6 h-10 border-2 border-white/50 flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/70 mt-2"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir <span className="text-blue-600">PharmaShop</span> ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une expérience pharmaceutique moderne, sécurisée et accessible à tous
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FaTruck className="text-4xl text-blue-600" />,
                title: "Livraison Express",
                desc: "Livraison en 24h partout au Sénégal avec suivi en temps réel"
              },
              {
                icon: <FaShieldAlt className="text-4xl text-green-600" />,
                title: "Produits Certifiés",
                desc: "Tous nos médicaments sont certifiés et approuvés par les autorités"
              },
              {
                icon: <FaUserMd className="text-4xl text-purple-600" />,
                title: "Conseil Pharmaceutique",
                desc: "Notre équipe de pharmaciens est disponible pour vous conseiller"
              },
              {
                icon: <FaClock className="text-4xl text-orange-600" />,
                title: "Service 24/7",
                desc: "Commandez à tout moment, notre service est disponible 24h/24"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="text-center p-8 bg-white shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="mb-6 flex justify-center"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nos <span className="text-blue-600">Produits Phares</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Découvrez notre sélection de produits pharmaceutiques les plus demandés
            </p>
            <Link href="/produits">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 mx-auto"
              >
                Voir tous les produits
                <FaChevronRight className="text-sm" />
              </motion.button>
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 h-96 animate-pulse"></div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  index={index} 
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🏥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Produits bientôt disponibles</h3>
              <p className="text-gray-600 mb-8">
                Notre équipe travaille à enrichir notre catalogue de produits pharmaceutiques
              </p>
              <Link href="/produits">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="bg-blue-600 text-white px-8 py-3 hover:bg-blue-700 transition-colors"
                >
                  Explorer notre catalogue
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <FaPills className="text-6xl mx-auto mb-8 text-blue-200" />
            <h2 className="text-4xl font-bold mb-6">
              Prêt à commander vos médicaments ?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers de clients satisfaits qui font confiance à PharmaShop 
              pour leurs besoins pharmaceutiques
            </p>
            <Link href="/produits">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 font-bold text-lg shadow-xl transition-all duration-300"
              >
                Commencer mes achats
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}