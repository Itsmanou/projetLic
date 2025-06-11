"use client";

import Sidebar from "@/app/components/Sidebar/Sidebar";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Paracétamol",
    description: "Un antidouleur efficace contre les maux de tête et fièvre.",
    price: 1200,
    stock: 50,
    image: "/paracetamol.jpg"
  },
  {
    id: 2,
    name: "Vitamine C",
    description: "Renforce le système immunitaire et réduit la fatigue.",
    price: 1500,
    stock: 30,
    image: "/vitamineC.jpg"
  },
  {
    id: 3,
    name: "Doliprane",
    description: "Soulage rapidement la douleur et la fièvre.",
    price: 2000,
    stock: 20,
    image: "/doliprane.jpg"
  }
];

export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false); // 🔹 Pour différencier ajout / modification

  // ✅ Sélectionner un fichier image
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = URL.createObjectURL(event.target.files[0]);
      setSelectedFile(file);
      setNewProduct(prev => prev ? { ...prev, image: file } : null);
    }
  };

  // ✅ Ajouter ou modifier un produit
  const handleSaveProduct = () => {
    if (
      !newProduct ||
      !newProduct.name ||
      !newProduct.description ||
      newProduct.price <= 0 ||
      newProduct.stock <= 0 ||
      !newProduct.image
    ) {
      toast.error("❌ Veuillez remplir tous les champs !");
      return;
    }

    if (isEditing) {
      setProducts(prev =>
        prev.map(p => (p.id === newProduct.id ? newProduct : p))
      );
      toast.success("✅ Produit mis à jour avec succès !");
    } else {
      setProducts(prev => [...prev, newProduct]);
      toast.success("✅ Produit ajouté avec succès !");
    }

    setShowForm(false);
    setNewProduct(null);
    setSelectedFile(null);
    setIsEditing(false);
  };

  // ✅ Supprimer un produit
  const handleDelete = (id: number) => {
  const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?");
  if (!confirmDelete) return;

  setProducts(products.filter(product => product.id !== id));
  toast.success("✅ Produit supprimé avec succès !");
};

  // ✅ Modifier un produit
  const handleEdit = (id: number) => {
    const productToEdit = products.find(product => product.id === id);
    if (productToEdit) {
      setNewProduct(productToEdit);
      setShowForm(true);
      setSelectedFile(null);
      setIsEditing(true); // 🔹 Mode édition
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 p-6">
        <ToastContainer position="top-right" />

        {/* 🔹 Header avec le bouton "Ajouter un produit" */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">🛒 Tous les Produits</h1>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
            onClick={() => {
              setNewProduct({
                id: Date.now(),
                name: "",
                description: "",
                price: 0,
                stock: 0,
                image: ""
              });
              setSelectedFile(null);
              setShowForm(true);
              setIsEditing(false); // 🔹 Mode ajout
            }}
          >
            + Ajouter un produit
          </button>
        </div>

        {/* 🔹 Formulaire pour ajouter/modifier un produit */}
        {showForm && newProduct && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {isEditing ? "📝 Modifier le produit" : "🆕 Ajouter un produit"}
            </h2>
            <div className="flex gap-4">
              {/* 🔹 Sélection de l'image */}
              <div className="relative w-40 h-40 border border-gray-300 rounded flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileSelect}
                />
                {selectedFile || newProduct.image ? (
                  <img
                    src={selectedFile || newProduct.image}
                    alt="Produit"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <span className="text-gray-500">📷 Choisir une image</span>
                )}
              </div>

              {/* 🔹 Champs du formulaire */}
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  placeholder="Nom du produit"
                  className="w-full border p-3 rounded"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
                <textarea
                  placeholder="Description du produit"
                  className="w-full border p-3 rounded"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Prix"
                  className="w-full border p-3 rounded"
                  value={newProduct.price || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setNewProduct({
                      ...newProduct,
                      price: isNaN(value) ? 0 : value
                    });
                  }}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  className="w-full border p-3 rounded"
                  value={newProduct.stock || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setNewProduct({
                      ...newProduct,
                      stock: isNaN(value) ? 0 : value
                    });
                  }}
                />
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={handleSaveProduct}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔹 Liste des produits avec description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white shadow-md rounded-lg p-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover rounded"
              />
              <h3 className="text-xl font-bold text-gray-800 mt-3">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600">{product.description}</p>
              <p className="text-lg font-semibold text-blue-600">
                {product.price} FCFA
              </p>
              <p className="text-sm text-gray-500">Stock : {product.stock}</p>
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => handleEdit(product.id)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-700"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
