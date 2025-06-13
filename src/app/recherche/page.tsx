"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaStar, FaSearch, FaFilter, FaShoppingCart, FaArrowLeft, FaStore } from "react-icons/fa";
import { usePanier } from "@/app/context/PanierContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Product interface matching backend
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

// Product type for cart context
interface ProductToAdd {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity?: number;
}

export default function PageRecherche() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query")?.toLowerCase() || "";
  const { ajouterAuPanier } = usePanier();
  
  const [resultats, setResultats] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredResults, setFilteredResults] = useState<Produit[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch products and filter by search query
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la recherche');
        }

        const data = await response.json();
        
        if (data.success) {
          const products = data.data || [];
          
          // Filter products based on search query
          const filtered = products.filter((produit: Produit) =>
            produit.name.toLowerCase().includes(query) ||
            produit.description.toLowerCase().includes(query) ||
            (produit.category && produit.category.toLowerCase().includes(query))
          );
          
          setResultats(filtered);
          setFilteredResults(filtered);
          
          // Extract unique categories from search results
          const uniqueCategories = [...new Set(
            filtered
              .map((p: Produit) => p.category)
              .filter((cat: string | undefined) => cat && cat.trim() !== '')
          )] as string[];
          setCategories(uniqueCategories);
          
          // Set price range based on search results
          if (filtered.length > 0) {
            const prices = filtered.map((p: Produit) => p.price);
            setPriceRange({
              min: Math.min(...prices),
              max: Math.max(...prices)
            });
          }
        } else {
          throw new Error(data.error || 'Erreur lors de la recherche');
        }
      } catch (err: any) {
        console.error('Failed to search products:', err);
        setError(err.message || 'Impossible d\'effectuer la recherche');
        toast.error('Erreur lors de la recherche');
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchProducts();
    } else {
      setResultats([]);
      setFilteredResults([]);
      setLoading(false);
    }
  }, [query]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...resultats];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(produit => produit.category === selectedCategory);
    }

    // Filter by price range
    filtered = filtered.filter(produit => 
      produit.price >= priceRange.min && produit.price <= priceRange.max
    );

    // Sort results
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredResults(filtered);
  }, [resultats, selectedCategory, priceRange, sortBy, sortOrder]);

  const clearFilters = () => {
    setSelectedCategory('');
    if (resultats.length > 0) {
      const prices = resultats.map(p => p.price);
      setPriceRange({
        min: Math.min(...prices),
        max: Math.max(...prices)
      });
    }
  };

  const handleAddToCart = (produit: Produit) => {
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
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
     
      
      <div className="max-w-6xl mx-auto">
        {/* Navigation Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">     
            <Link 
              href="/produits" 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
            >
              <FaStore />
              <span>Continuer les achats</span>
            </Link>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-blue-700 mb-4">
            Résultats de recherche
          </h1>
          <p className="text-xl text-gray-600">
            Recherche pour : <span className="font-semibold text-blue-600">"{query}"</span>
          </p>
        </motion.div>

        {/* Search and Filter Section */}
        {!loading && resultats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-md p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <FaFilter />
                  Filtres
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Trier par:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'rating')}
                    className="px-3 py-1 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="name">Nom</option>
                    <option value="price">Prix</option>
                    <option value="rating">Note</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              <p className="text-blue-600">
                {filteredResults.length} produit{filteredResults.length !== 1 ? 's' : ''} trouvé{filteredResults.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Filters */}
            {showFilters && (
              <motion.div 
                className="pt-4 border-t border-gray-200"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        <option value="">Toutes les catégories</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix minimum (FCFA)
                    </label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix maximum (FCFA)
                    </label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Effacer les filtres
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Recherche en cours...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <div>
                <p className="font-medium">Erreur de recherche</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* No Query */}
        {!query && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-600 mb-4">Effectuez une recherche</p>
            <p className="text-gray-500 mb-6">
              Utilisez la barre de recherche pour trouver des produits
            </p>
            <Link
              href="/produits"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors"
            >
              <FaStore />
              Parcourir tous les produits
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && !error && query && (
          <>
            {filteredResults.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                  {filteredResults.map((produit, index) => (
                    <SearchResultCard
                      key={produit._id}
                      produit={produit}
                      index={index}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
                
                {/* Bottom Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 border-t border-gray-200"
                >
                  <Link 
                    href="/produits" 
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors"
                  >
                    <FaStore />
                    <span>Continuer les achats</span>
                  </Link>
                  
                  <Link 
                    href="/panier" 
                    className="flex items-center gap-2 border border-blue-600 text-blue-600 px-6 py-3 hover:bg-blue-50 transition-colors"
                  >
                    <FaShoppingCart />
                    <span>Voir le panier</span>
                  </Link>
                </motion.div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😞</div>
                <p className="text-xl text-gray-600 mb-4">Aucun produit trouvé</p>
                <p className="text-gray-500 mb-6">
                  Aucun produit ne correspond à votre recherche "{query}"
                </p>
                <div className="space-y-2 text-gray-500 mb-8">
                  <p>Suggestions :</p>
                  <ul className="text-sm space-y-1">
                    <li>• Vérifiez l'orthographe</li>
                    <li>• Utilisez des mots-clés plus généraux</li>
                    <li>• Essayez des synonymes</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/produits"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors"
                  >
                    <FaStore />
                    Voir tous les produits
                  </Link>
                  
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 px-6 py-3 hover:bg-blue-50 transition-colors"
                  >
                    <FaArrowLeft />
                    Retour à l'accueil
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// SearchResultCard component (unchanged)
interface SearchResultCardProps {
  produit: Produit;
  index: number;
  onAddToCart: (produit: Produit) => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ produit, index, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const rating = produit.rating || 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative"
    >
      {/* Stock badge */}
      {produit.stock <= 5 && produit.stock > 0 && (
        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full z-10">
          Stock faible
        </div>
      )}
      
      {produit.stock === 0 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
          Rupture
        </div>
      )}

      {/* Category badge */}
      {produit.category && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-10">
          {produit.category}
        </div>
      )}

      {/* Image */}
      <Link href={`/produits/${produit._id}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageError ? '/placeholder-product.jpg' : produit.imageUrl}
            alt={produit.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            onError={() => setImageError(true)}
          />
          
          {/* Out of stock overlay */}
          {produit.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold">Rupture de stock</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/produits/${produit._id}`}>
          <h3 className="font-bold text-lg text-black mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {produit.name}
          </h3>
        </Link>

        <p className="text-xl font-bold text-blue-600 mb-2">
          {produit.price.toLocaleString()} FCFA
        </p>

        {/* Rating */}
        <div className="flex items-center mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              className={`${i < rating ? "text-yellow-400" : "text-gray-300"} transition-colors`}
            />
          ))}
          <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {produit.description}
        </p>

        {/* Stock info */}
        <p className={`text-sm mb-4 ${produit.stock > 5 ? 'text-green-600' : produit.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
          {produit.stock > 0 ? `En stock (${produit.stock})` : 'Rupture de stock'}
        </p>

        {/* Add to cart button */}
        <button
          onClick={() => onAddToCart(produit)}
          disabled={produit.stock === 0}
          className={`w-full px-4 py-2 font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            produit.stock > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
        >
          <FaShoppingCart />
          {produit.stock > 0 ? 'Ajouter au panier' : 'Indisponible'}
        </button>
      </div>
    </motion.div>
  );
};