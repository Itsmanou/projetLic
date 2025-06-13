"use client";

import Sidebar from "@/app/components/Sidebar/Sidebar";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  PhotoIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CubeIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AllProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Product>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    imageUrl: "",
    category: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // Check authentication and admin rights
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          toast.error("Vous devez être connecté pour accéder au tableau de bord");
          router.push("/login");
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Check if user is admin
        if (parsedUser.role !== 'admin') {
          toast.error("Accès refusé. Seuls les administrateurs peuvent accéder à cette page.");
          router.push("/");
          return;
        }

        // Verify token with backend
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Token invalide');
        }

        // If everything is good, fetch products
        fetchProducts();
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error("Session expirée. Veuillez vous reconnecter.");
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Get authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Fetch products from the API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits');
      }

      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data || []);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des produits');
      }
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      setError(err.message || "Impossible de charger les produits");
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for product image
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner un fichier image valide");
        return;
      }

      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Validate form data
  const validateForm = () => {
    if (!newProduct.name.trim()) {
      toast.error("Le nom du produit est requis");
      return false;
    }

    if (!newProduct.description.trim()) {
      toast.error("La description du produit est requise");
      return false;
    }

    if (newProduct.price <= 0) {
      toast.error("Le prix doit être supérieur à 0");
      return false;
    }

    if (newProduct.stock < 0) {
      toast.error("Le stock ne peut pas être négatif");
      return false;
    }

    if (!isEditing && !selectedFile) {
      toast.error("Veuillez sélectionner une image pour le produit");
      return false;
    }

    return true;
  };

  // Create or update a product
  const handleSaveProduct = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData object to handle file upload
      const formData = new FormData();
      formData.append("name", newProduct.name.trim());
      formData.append("description", newProduct.description.trim());
      formData.append("price", newProduct.price.toString());
      formData.append("stock", newProduct.stock.toString());
      
      if (newProduct.category?.trim()) {
        formData.append("category", newProduct.category.trim());
      }
      
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const token = localStorage.getItem('token');
      let response;
      
      if (isEditing && newProduct._id) {
        // Update existing product
        response = await fetch(`/api/products/${newProduct._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Create new product
        response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement du produit');
      }

      if (data.success) {
        toast.success(isEditing ? "✅ Produit mis à jour avec succès !" : "✅ Produit ajouté avec succès !");
        
        // Refresh products list
        fetchProducts();
        
        // Reset form
        setShowForm(false);
        resetForm();
      } else {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement du produit');
      }
      
    } catch (err: any) {
      console.error("Error saving product:", err);
      toast.error(err.message || "Erreur lors de l'enregistrement du produit");
    } finally {
      setLoading(false);
    }
  };

  // Delete a product
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression du produit');
      }

      if (data.success) {
        // Update local state
        setProducts(products.filter(product => product._id !== id));
        toast.success("✅ Produit supprimé avec succès !");
      } else {
        throw new Error(data.error || 'Erreur lors de la suppression du produit');
      }
    } catch (err: any) {
      console.error("Error deleting product:", err);
      toast.error(err.message || "Erreur lors de la suppression du produit");
    } finally {
      setLoading(false);
    }
  };

  // Edit a product
  const handleEdit = (product: Product) => {
    setNewProduct({ ...product });
    setImagePreview(product.imageUrl);
    setSelectedFile(null);
    setShowForm(true);
    setIsEditing(true);
  };

  // Reset form fields
  const resetForm = () => {
    setNewProduct({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      imageUrl: "",
      category: ""
    });
    setSelectedFile(null);
    setImagePreview(null);
    setIsEditing(false);
  };


  // Get stock status
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Épuisé', color: 'text-red-600 bg-red-50', icon: '❌' };
    if (stock <= 5) return { text: 'Stock faible', color: 'text-orange-600 bg-orange-50', icon: '⚠️' };
    if (stock <= 20) return { text: 'Stock moyen', color: 'text-yellow-600 bg-yellow-50', icon: '📦' };
    return { text: 'En stock', color: 'text-green-600 bg-green-50', icon: '✅' };
  };

  // Calculate statistics
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  const lowStockCount = products.filter(product => product.stock <= 5).length;
  const categoriesCount = [...new Set(products.map(p => p.category).filter(Boolean))].length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      <div className="flex-1 ml-16 lg:ml-64 transition-all duration-300 ease-in-out">
        <div className="p-4 lg:p-8 min-h-screen overflow-auto">
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100">
                  <CubeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    Gestion des Produits
                  </h1>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Gérez votre catalogue de produits pharmaceutiques
                  </p>
                </div>
              </div>
              {user && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500"></div>
                    <span>Connecté en tant que</span>
                  </div>
                  <span className="font-semibold text-gray-900">{user.name}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
                    {user.role}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nouveau Produit
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Produits</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                </div>
                <div className="p-3 bg-blue-100">
                  <CubeIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valeur Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">FCFA</p>
                </div>
                <div className="p-3 bg-green-100">
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Faible</p>
                  <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
                </div>
                <div className="p-3 bg-orange-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Catégories</p>
                  <p className="text-2xl font-bold text-gray-900">{categoriesCount}</p>
                </div>
                <div className="p-3 bg-purple-100">
                  <TagIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Product Form */}
        {showForm && (
          <div className="bg-white shadow-xl border border-gray-100 p-6 lg:p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600">
                {isEditing ? (
                  <PencilIcon className="h-6 w-6 text-white" />
                ) : (
                  <PlusIcon className="h-6 w-6 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Modifier le produit" : "Ajouter un nouveau produit"}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image Upload Section */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image du produit *
                </label>
                <div className="relative group">
                  <div className="w-full h-64 border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer group-hover:border-blue-400">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={handleFileSelect}
                    />
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Aperçu du produit"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <PhotoIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <PhotoIcon className="h-16 w-16 mb-4 text-gray-400" />
                        <p className="text-lg font-medium">Choisir une image</p>
                        <p className="text-sm">PNG, JPG jusqu'à 5MB</p>
                      </div>
                    )}
                  </div>
                </div>
                {selectedFile && (
                  <div className="bg-blue-50 border border-blue-200 p-3">
                    <p className="text-sm text-blue-800 font-medium">
                      📎 {selectedFile.name}
                    </p>
                    <p className="text-xs text-blue-600">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}
                {isEditing && !selectedFile && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3">
                    <p className="text-sm text-yellow-800">
                      💡 Laissez vide pour conserver l'image actuelle
                    </p>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du produit *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Paracétamol 500mg"
                      className="w-full px-4 py-3 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Médicament, Cosmétique"
                      className="w-full px-4 py-3 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={newProduct.category || ""}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, category: e.target.value })
                      }
                      maxLength={50}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    placeholder="Décrivez le produit, ses indications, posologie..."
                    className="w-full px-4 py-3 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={4}
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, description: e.target.value })
                    }
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newProduct.description.length}/500 caractères
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (FCFA) *
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-3 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={newProduct.price || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setNewProduct({
                          ...newProduct,
                          price: isNaN(value) ? 0 : value
                        });
                      }}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock disponible *
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-3 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={newProduct.stock || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setNewProduct({
                          ...newProduct,
                          stock: isNaN(value) ? 0 : value
                        });
                      }}
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <button
                    onClick={handleSaveProduct}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : isEditing ? (
                      <>
                        <PencilIcon className="h-5 w-5 mr-2" />
                        Mettre à jour
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !showForm && (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-gray-600 font-medium">Chargement des produits...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 p-6 mb-6">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Erreur de chargement</h3>
                <p className="text-red-700 text-sm mb-3">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <div key={product._id} className="bg-white shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={product.imageUrl || "/placeholder-product.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.icon} {stockStatus.text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 h-10" title={product.description}>
                        {product.description}
                      </p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-blue-600">
                          {product.price.toLocaleString()} FCFA
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-semibold ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                          {product.stock} unités
                        </span>
                      </div>
                      
                      {product.category && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Catégorie:</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
                            {product.category}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white transition-colors duration-200"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(product._id!)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16 bg-white shadow-lg">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 flex items-center justify-center">
              <CubeIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun produit disponible</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Commencez par ajouter votre premier produit à votre catalogue pour démarrer la vente en ligne.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter votre premier produit
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}