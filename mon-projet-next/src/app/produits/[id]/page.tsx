'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { usePanier } from '@/app/context/PanierContext';
import {
  FaStar,
  FaShoppingCart,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheck,
  FaShieldAlt,
  FaTruck,
  FaPhoneAlt,
  FaHeart,
  FaShare
} from 'react-icons/fa';
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Navbar from '@/app/components/Navbar/Navbar';
import Footer from '@/app/components/Footer/Footer';

// Product interface matching backend
interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category?: string;
  stock: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Product type for cart context
interface ProductToAdd {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity?: number;
}

export default function ProduitDetail() {
  const { id } = useParams();
  const { ajouterAuPanier } = usePanier();
  const [produit, setProduit] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/products/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Produit non trouvé');
        }

        const data = await response.json();

        if (data.success) {
          setProduit(data.data);
        } else {
          throw new Error(data.error || 'Erreur lors du chargement du produit');
        }
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
        setError(err.message || 'Impossible de charger le produit');
        toast.error('Erreur lors du chargement du produit');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!produit) return;

    if (produit.stock <= 0) {
      toast.error('Ce produit n\'est plus en stock');
      return;
    }

    if (quantity > produit.stock) {
      toast.error(`Seulement ${produit.stock} articles disponibles en stock`);
      return;
    }

    const productToAdd: ProductToAdd = {
      id: produit._id,
      name: produit.name,
      price: produit.price,
      imageUrl: produit.imageUrl,
      quantity: quantity,
    };

    console.log('add to cart', productToAdd);
    ajouterAuPanier(productToAdd);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (produit && newQuantity > produit.stock) {
      toast.warning(`Seulement ${produit.stock} articles disponibles`);
      return;
    }
    setQuantity(newQuantity);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: produit?.name,
        text: `Découvrez ${produit?.name} sur PharmaShop`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !produit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="text-3xl text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h1>
          <p className="text-gray-600 mb-8">{error || 'Le produit que vous recherchez n\'existe pas ou n\'est plus disponible.'}</p>
          <Link
            href="/produits"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors shadow-lg"
          >
            <FaArrowLeft />
            Retour aux produits
          </Link>
        </div>
      </div>
    );
  }

  const rating = produit.rating || 4;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">

        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">Accueil</Link>
              <span className="text-gray-400">/</span>
              <Link href="/produits" className="text-gray-500 hover:text-gray-700">Produits</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{produit.name}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/produits"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-8 transition-colors"
          >
            <FaArrowLeft />
            Retour aux produits
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Product Image Section */}
            <div className="space-y-6">
              <div className="relative">
                <div className="aspect-square bg-white shadow-xl overflow-hidden border border-gray-100">
                  <motion.img
                    src={imageError ? '/placeholder-product.jpg' : produit.imageUrl}
                    alt={produit.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Stock Status Badge */}
                  <div className="absolute top-4 left-4">
                    {produit.stock > 0 ? (
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <FaCheck className="text-xs" />
                        En stock
                      </div>
                    ) : (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Rupture de stock
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 text-center border border-gray-200">
                  <FaShieldAlt className="text-green-500 text-2xl mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Produit Certifié</p>
                  <p className="text-xs text-gray-600">Qualité garantie</p>
                </div>
                <div className="bg-white p-4 text-center border border-gray-200">
                  <FaTruck className="text-blue-500 text-2xl mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Livraison Rapide</p>
                  <p className="text-xs text-gray-600">24-48h</p>
                </div>
                <div className="bg-white p-4 text-center border border-gray-200">
                  <FaPhoneAlt className="text-purple-500 text-2xl mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Support 24/7</p>
                  <p className="text-xs text-gray-600">Assistance</p>
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="space-y-8">
              {/* Product Header */}
              <div>
                {produit.category && (
                  <div className="mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {produit.category}
                    </span>
                  </div>
                )}

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {produit.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-lg ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">({rating}/5 • 127 avis)</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-4xl font-bold text-blue-600">
                    {produit.price.toLocaleString()} FCFA
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {(produit.price * 1.2).toLocaleString()} FCFA
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                    -17%
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {produit.description}
                </p>
              </div>

              {/* Stock Info */}
              <div className="bg-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Disponibilité</span>
                  <span className={`font-semibold ${produit.stock > 50 ? 'text-green-600' :
                      produit.stock > 15 ? 'text-yellow-600' : produit.stock > 0 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                    {produit.stock > 0 ? `${produit.stock} en stock` : 'Rupture de stock'}
                  </span>
                </div>

                {produit.stock > 0 && produit.stock <= 15 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <FaExclamationTriangle />
                    <span className="text-sm">Stock limité - Commandez rapidement!</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector & Add to Cart */}
              {produit.stock > 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Quantité
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-4 py-2 text-lg font-semibold border-x border-gray-300 text-black">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                          disabled={quantity >= produit.stock}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-gray-600">
                        (Max: {produit.stock} disponibles)
                      </span>
                    </div>
                  </div>

                  {/* Price Total */}
                  {quantity > 1 && (
                    <div className="bg-blue-50 border border-blue-200 p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          Total ({quantity} articles)
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {(produit.price * quantity).toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-blue-600 text-white py-4 px-8 font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <FaShoppingCart />
                    Ajouter au panier
                  </button>
                </div>
              )}

              {/* Out of Stock */}
              {produit.stock === 0 && (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 p-6">
                    <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-red-800 mb-2">Produit Indisponible</h3>
                    <p className="text-red-600 mb-4">Ce produit est actuellement en rupture de stock.</p>
                    <button className="bg-red-600 text-white px-6 py-2 hover:bg-red-700 transition-colors">
                      Me notifier quand disponible
                    </button>
                  </div>
                </div>
              )}

              {/* Product Specifications */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations produit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Référence</span>
                    <span className="font-medium text-gray-900">{produit._id.slice(-8)}</span>
                  </div>
                  {produit.category && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Catégorie</span>
                      <span className="font-medium text-gray-900">{produit.category}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Stock</span>
                    <span className="font-medium text-gray-900">{produit.stock} unités</span>
                  </div>
                  {produit.createdAt && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Ajouté le</span>
                      <span className="font-medium text-gray-900">
                        {new Date(produit.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Besoin d'aide ou de conseils ?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Notre équipe de pharmaciens qualifiés est disponible pour répondre à vos questions
                et vous conseiller sur l'utilisation de nos produits.
              </p>
              <div className="flex justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  <FaPhoneAlt />
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}