"use client";

import { usePanier } from "@/app/context/PanierContext";
import { motion } from 'framer-motion';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { FaStar, FaSearch, FaFilter, FaShoppingCart, FaTimes, FaSort } from 'react-icons/fa';
import { toast } from "react-toastify";

// Product interfaces
interface Produit {
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

interface ProductToAdd {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity?: number;
}

interface SearchResponse {
  success: boolean;
  data: {
    products: Produit[];
    suggestions: string[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    filters: {
      query: string;
      category: string;
      minPrice: number;
      maxPrice: number;
      inStock: boolean;
      sortBy: string;
    };
  };
}

export default function ProduitsPage() {
  const { ajouterAuPanier } = usePanier();

  // Hydration state
  const [hasMounted, setHasMounted] = useState(false);

  // Product state
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [inStock, setInStock] = useState(false);

  // UI states
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Debounce state
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Handle hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fetch products using search API
  const fetchProducts = useCallback(async (params: {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    sortBy?: string;
  } = {}) => {
    if (!hasMounted) return;

    try {
      setLoading(true);
      setError('');

      const searchParams = new URLSearchParams();

      if (params.query) searchParams.set('q', params.query);
      if (params.category && params.category !== '') searchParams.set('category', params.category);
      if (params.minPrice !== undefined) searchParams.set('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) searchParams.set('maxPrice', params.maxPrice.toString());
      if (params.inStock) searchParams.set('inStock', 'true');
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      searchParams.set('limit', pagination.limit.toString());

      const response = await fetch(`/api/search?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits');
      }

      const data: SearchResponse = await response.json();

      if (data.success) {
        setProduits(data.data.products);
        setPagination(data.data.pagination);
        setSuggestions(data.data.suggestions);

        // Extract unique categories for initial load
        if (!params.query && !params.category && data.data.products.length > 0) {
          const uniqueCategories = [...new Set(
            data.data.products
              .map((p: Produit) => p.category)
              .filter((cat: string | undefined) => cat && cat.trim() !== '')
          )] as string[];
          setCategories(uniqueCategories);
        }
      } else {
        throw new Error('Erreur lors du chargement des produits');
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.message || 'Impossible de charger les produits');
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, hasMounted]);

  // Initial load after hydration
  useEffect(() => {
    if (hasMounted) {
      fetchProducts();
    }
  }, [hasMounted, fetchProducts]);

  // Handle search with debounce
  useEffect(() => {
    if (!hasMounted) return;

    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      fetchProducts({
        query: searchTerm,
        category: selectedCategory,
        minPrice: priceRange.min === '' ? undefined : Number(priceRange.min),
        maxPrice: priceRange.max === '' ? undefined : Number(priceRange.max),
        inStock: inStock,
        page: 1,
        sortBy: sortBy
      });
    }, 500);

    setSearchDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm, selectedCategory, priceRange, inStock, sortBy, fetchProducts, hasMounted]);

  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setInStock(false);
    setSortBy('relevance');
    setShowSuggestions(false);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    fetchProducts({
      query: searchTerm,
      category: selectedCategory,
      minPrice: priceRange.min === '' ? undefined : Number(priceRange.min),
      maxPrice: priceRange.max === '' ? undefined : Number(priceRange.max),
      inStock: inStock,
      page: newPage,
      sortBy: sortBy
    });
  }, [searchTerm, selectedCategory, priceRange, inStock, sortBy, fetchProducts]);

  // Memoized product cards
  const productCards = useMemo(() => {
    if (!hasMounted) return [];

    return produits.map((produit) => (
      <ProductCard
        key={`product-${produit._id}`}
        produit={produit}
        ajouterAuPanier={ajouterAuPanier}
      />
    ));
  }, [produits, ajouterAuPanier, hasMounted]);

  // Show loading skeleton until hydrated
  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="h-12 bg-gray-200 mb-4 max-w-md mx-auto animate-pulse"></div>
            <div className="h-6 bg-gray-200 max-w-2xl mx-auto animate-pulse"></div>
          </div>

          {/* Search Skeleton */}
          <div className="bg-white shadow-lg p-6 mb-8 text-black">
            <div className="h-12 bg-gray-200 animate-pulse"></div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white shadow-lg overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nos Produits Pharmaceutiques
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Découvrez notre large gamme de produits pharmaceutiques certifiés et de qualité
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white shadow-lg border border-gray-100 p-6 mb-8 text-black">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />

              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <FaSort className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
              >
                <option value="relevance">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="name_asc">Nom A-Z</option>
                <option value="name_desc">Nom Z-A</option>
                <option value="newest">Plus récent</option>
              </select>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaFilter />
              Filtres
              {(searchTerm || selectedCategory || inStock) && (
                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Catégorie
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prix minimum (FCFA)
                  </label>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange(prev => ({
                        ...prev,
                        min: e.target.value
                      }))
                    }
                    className="w-full p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prix maximum (FCFA)
                  </label>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange(prev => ({
                        ...prev,
                        max: e.target.value
                      }))
                    }
                    className="w-full p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                {/* Stock Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Disponibilité
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm">En stock uniquement</span>
                  </label>
                </div>
              </div>

              {/* Active Filters */}
              <div className="mt-6 flex justify-between items-center">
                <div className="flex gap-2 flex-wrap">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      "{searchTerm}"
                      <button onClick={() => setSearchTerm('')}>
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory('')}>
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  )}
                  {inStock && (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full">
                      En stock
                      <button onClick={() => setInStock(false)}>
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                >
                  Effacer tout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <p className="text-gray-700 font-medium">
              {pagination.total} produit{pagination.total !== 1 ? 's' : ''} trouvé{pagination.total !== 1 ? 's' : ''}
            </p>
            {pagination.pages > 1 && (
              <span className="text-blue-600 text-sm">
                Page {pagination.page} sur {pagination.pages}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-600">Chargement des produits...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <div>
                <p className="font-semibold">Erreur de chargement</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <>
          {produits.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto mb-8">
                {productCards}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Précédent
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={`page-${page}`}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 ${page === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucun produit trouvé</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Essayez de modifier vos critères de recherche ou explorez nos différentes catégories
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-8 py-3 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Voir tous les produits
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ProductCard component
interface ProductCardProps {
  produit: Produit;
  ajouterAuPanier: (produit: ProductToAdd) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ produit, ajouterAuPanier }) => {
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = useCallback(() => {
    if (produit.stock <= 0) {
      toast.error('Ce produit n\'est plus en stock');
      return;
    }

    const productToAdd: ProductToAdd = {
      id: produit._id,
      name: produit.name,
      price: produit.price,
      imageUrl: produit.imageUrl,
      quantity: 1,
    };

    ajouterAuPanier(productToAdd);
    toast.success(`${produit.name} ajouté au panier!`);
  }, [produit, ajouterAuPanier]);

  const rating = produit.rating || 4;

  return (
    <div className="bg-white shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">

      {/* Badges */}
      <div className="relative">
        {produit.stock <= 5 && produit.stock > 0 && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full z-10 font-medium">
            Stock faible
          </div>
        )}

        {produit.stock === 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 font-medium">
            Rupture
          </div>
        )}

        {produit.category && (
          <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-10 font-medium">
            {produit.category}
          </div>
        )}

        {/* Image with scaling animation */}
        <Link href={`/produits/${produit._id}`} className="block">
          <div className="relative w-full h-48 overflow-hidden bg-gray-100">
            <motion.img
              src={imageError ? '/placeholder-product.jpg' : produit.imageUrl}
              alt={produit.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Out of stock overlay */}
            {produit.stock === 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Rupture de stock</span>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="p-5">
        <Link href={`/produits/${produit._id}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors duration-200" title={produit.name}>
            {produit.name}
          </h3>
        </Link>

        <p className="text-2xl font-bold text-blue-600 mb-3">
          {produit.price.toLocaleString()} FCFA
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              className={`text-sm ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
            />
          ))}
          <span className="text-sm text-gray-500 ml-2">({rating}/5)</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2" title={produit.description}>
          {produit.description}
        </p>

        {/* Stock info */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm font-medium ${produit.stock > 5 ? 'text-green-600' :
              produit.stock > 0 ? 'text-orange-600' : 'text-red-600'
            }`}>
            {produit.stock > 0 ? `En stock (${produit.stock})` : 'Rupture de stock'}
          </span>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={produit.stock === 0}
          className={`w-full px-4 py-3 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${produit.stock > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          <FaShoppingCart className="text-sm" />
          {produit.stock > 0 ? 'Ajouter au panier' : 'Indisponible'}
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';