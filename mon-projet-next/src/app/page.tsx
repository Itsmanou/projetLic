"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useSpring, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import { usePanier } from "@/app/context/PanierContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaStar } from "react-icons/fa";

// Mock cart context
interface Produit {
  id: number;
  nom: string;
  prix: number;
  image: string;
  rating: number;
  description: string;
}

export default function Page() {
  const { ajouterAuPanier } = usePanier();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<React.ReactElement[]>([]);

  // Scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Mouse tracking for parallax
  useEffect(() => {
    interface MousePosition {
      x: number;
      y: number;
    }

    interface MouseMoveEvent extends MouseEvent {}

    const handleMouseMove = (e: MouseMoveEvent): void => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const arr = [...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-sky-400 opacity-20"
        animate={{
          x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
          y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
        }}
        transition={{
          duration: Math.random() * 20 + 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }}
        style={{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
        }}
      />
    ));
    setParticles(arr);
  }, []);

  const produits = [
   {
    id: 1,
    nom: 'Paracétamol 500mg',
    prix: 1200,
    image: '/produits.13.jpeg',
    rating: 4,
    description: 'Soulage la douleur et fait baisser la fièvre.',
  },
  {
    id: 2,
    nom: 'Vitamine C 1000mg',
    prix: 1500,
    image: '/produits.14.jpg',
    rating: 5,
    description: 'Renforce le système immunitaire.',
  },
  {
    id: 3,
    nom: 'Gel hydroalcoolique',
    prix: 1000,
    image: '/gelhydro.avif',
    rating: 3,
    description: 'Nettoie les mains sans eau.',
  },
  { id: 4, nom: "Doliprane", prix: 2000, image: "/produits.12.jpg", rating: 4,description: 'Agit au niveau du système nerveux central pour bloquer les messages de douleur et abaisser la température corporelle.' },
  { id: 5, nom: "Ibuprofène", prix: 2500, image: "/produits8.png", rating: 4, description: "Inhibe les enzymes COX impliquées dans la production des prostaglandines (molécules de l'inflammation et de la douleur)." },
  { id: 6, nom: "La Croix Rouge", prix: 5000, image: "/produits.15.jpg", rating: 1, description:"Secours d'urgence (catastrophes, guerres)" },
  ];

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-gray-100 via-white to-sky-50 text-gray-900 font-sans overflow-x-hidden">
      <ToastContainer position="top-right" />
      
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles}
      </div>

      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleY }}
        className="fixed right-0 top-0 w-2 h-full bg-gradient-to-b from-sky-400 via-blue-500 to-sky-600 origin-top z-50 shadow-lg shadow-sky-400/20"
      />

      <main className="flex-grow">

        {/* Hero Section with 3D parallax */}
        <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
          {/* Hero background image */}
          <motion.div
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-center bg-no-repeat bg-cover z-0"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1920&h=1080&fit=crop')" }}
          />
          
          <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-sm" />
          
          {/* Parallax background layers */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-sky-900/20 via-blue-900/30 to-sky-900/20 z-15"
            style={{
              x: useTransform(scrollYProgress, [0, 1], [0, -50]),
              y: useTransform(scrollYProgress, [0, 1], [0, -100]),
            }}
          />
          
          {/* Floating geometric shapes */}
          <motion.div
            className="absolute top-20 left-20 w-32 h-32 border border-sky-400/30"
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          <motion.div
            className="absolute bottom-40 right-20 w-24 h-24 bg-gradient-to-br from-sky-500/20 to-blue-500/20"
            animate={{
              rotate: -360,
              y: [-20, 20, -20],
            }}
            transition={{
              rotate: { duration: 15, repeat: Infinity, ease: "linear" },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative z-20 text-center px-4 max-w-4xl"
          >
            <motion.div
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="text-7xl md:text-8xl font-black bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600 bg-300% bg-clip-text text-transparent mb-8"
              style={{ backgroundSize: "300% 100%" }}
            >
              PharmaShop
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl md:text-2xl text-white mb-10 leading-relaxed"
            >
              La solution <span className="text-sky-400 font-semibold">révolutionnaire</span> pour commander vos produits pharmaceutiques
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row justify-center gap-6"
            >
              <Link href="/produits">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(14, 165, 233, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 px-8 font-bold text-lg shadow-lg hover:shadow-sky-500/25 transition-all duration-300"
                >
                  Découvrir nos produits
                </motion.button>
              </Link>
              <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255, 255, 255, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 py-4 px-8 font-bold text-lg transition-all duration-300"
              >
                Contactez Nous
              </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-sky-400 flex justify-center">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-3 bg-sky-400 mt-2"
              />
            </div>
          </motion.div>
        </section>

        {/* Products Section with Advanced Animations */}
        <section className="py-20 px-4 max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-4">
              Nos Produits Premium
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Découvrez notre sélection de produits pharmaceutiques de haute qualité
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {produits.map((produit, index) => (
              <ProductCard key={produit.id} produit={produit} index={index} ajouterAuPanier={ajouterAuPanier} />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-sky-50/50 to-blue-50/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent"
            >
              Pourquoi choisir PharmaShop ?
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Livraison Express", desc: "Livraison en moins de 2h", icon: "🚀" },
                { title: "Qualité Garantie", desc: "Produits certifiés et authentiques", icon: "✨" },
                { title: "Service 24/7", desc: "Support client disponible 24h/24", icon: "🛡️" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="text-center p-8 bg-white/10 backdrop-blur-sm border border-white/20 hover:border-sky-500/50 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-sky-400 mb-2">{feature.title}</h3>
                  <p className="text-white">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Product Card Component with Advanced Animations
interface ProductCardProps {
  produit: Produit;
  index: number;
  ajouterAuPanier: (produit: Produit) => void;
}

function ProductCard({ produit, index, ajouterAuPanier }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = () => {
    ajouterAuPanier(produit);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotateX: -15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, y: -100, rotateX: 15 }}
      viewport={{ once: false, margin: "-100px" }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 5,
        z: 50,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white backdrop-blur-lg p-6 border border-gray-200 hover:border-sky-500/50 transition-all duration-500 overflow-hidden shadow-lg hover:shadow-sky-500/20"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-sky-500/10"
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Floating particles effect */}
      {isHovered && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-sky-400"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                opacity: 0 
              }}
              animate={{ 
                y: [null, -50],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        {/* Image with 3D effect */}
        <Link href={`/produits/${produit.id}`} className="block">
        <motion.div 
          className="relative w-full h-64 mb-6 overflow-hidden cursor-pointer"
          whileHover={{ rotateX: 10, rotateY: -10 }}
          transition={{ duration: 0.3 }}
        >
          <motion.img 
            src={produit.image} 
            alt={produit.nom} 
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
            animate={{ opacity: isHovered ? 0.7 : 0.3 }}
          />
        </motion.div>
        </Link>

        {/* Content */}
        <motion.h3 
          className="text-xl font-bold text-gray-900 mb-2"
          animate={{ color: isHovered ? "#0ea5e9" : "#111827" }}
        >
          {produit.nom}
        </motion.h3>
        
        <motion.p 
          className="text-2xl font-bold text-sky-600 mb-3"
          animate={{ scale: isHovered ? 1.1 : 1 }}
        >
          {produit.prix} FCFA
        </motion.p>

        {/* Rating with animation */}
        <div className="flex items-center justify-center mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ rotate: 0 }}
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <FaStar 
                className={`${i < produit.rating ? "text-yellow-400" : "text-gray-600"} transition-colors`}
              />
            </motion.div>
          ))}
        </div>

        <motion.p 
          className="text-gray-600 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ y: 10 }}
          animate={{ y: isHovered ? 0 : 10 }}
        >
          {produit.description}
        </motion.p>

        {/* Button with morphing effect */}
        <motion.button
          onClick={handleAddToCart}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 30px rgba(14, 165, 233, 0.4)"
          }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 font-bold transition-all duration-300 hover:from-sky-400 hover:to-blue-500"
        >
          <motion.span
            animate={{ 
              backgroundPosition: isHovered ? "100% 0" : "0% 0"
            }}
            transition={{ duration: 0.3 }}
          >
            Ajouter au panier
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
}