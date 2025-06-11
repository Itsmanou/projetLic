'use client';
import { usePanier } from "@/app/context/PanierContext";
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaStar } from 'react-icons/fa';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const produits = [
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

export default function ProduitsPage() {
  const { ajouterAuPanier } = usePanier();

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <ToastContainer position="top-right" />
      <h1 className="text-3xl font-bold text-center mb-10 text-blue-700">Nos Produits</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {produits.map((produit, index) => (
          <ProductCard
            key={produit.id}
            produit={produit}
            index={index}
            ajouterAuPanier={ajouterAuPanier}
          />
        ))}
      </div>
    </div>
  );
}

// --- ProductCard component with home page design ---
interface Produit {
  id: number;
  nom: string;
  prix: number;
  image: string;
  rating: number;
  description: string;
  quantite?: number;

}
interface ProductCardProps {
  produit: Produit;
  index: number;
  ajouterAuPanier: (produit: Omit<Produit, "quantite">) => void;
}

function ProductCard({ produit, index, ajouterAuPanier }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

 // ...dans ProductCard
const handleAddToCart = () => {
  const { quantite, ...produitSansQuantite } = produit;
  ajouterAuPanier(produitSansQuantite);
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
            <img
              src={produit.image}
              alt={produit.nom}
              className="w-full h-full object-cover"
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
