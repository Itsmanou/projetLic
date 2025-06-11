"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 🔹 Gestion de la navigation
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // 🔹 Icônes pour visibilité du mot de passe

export default function AdminLogin() {
  const router = useRouter(); // 🔹 Initialisation du router pour la redirection

  // 🔹 Informations pré-enregistrées (issues de la page paramètres)
  const adminData = {
    nom: "Manou",
    email: "manuellakameni932@gmail.com",
    password: "Manou123",
  };

  // 🔹 État pour gérer les entrées utilisateur
  const [formData, setFormData] = useState({ nom: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔹 Vérification des informations
    if (
      formData.nom === adminData.nom &&
      formData.email === adminData.email &&
      formData.password === adminData.password
    ) {
      alert("✅ Connexion réussie ! Redirection vers le dashboard...");
      router.push("/dashboard"); // 🔹 Redirection vers le dashboard
    } else {
      setErrorMessage("❌ Nom, email ou mot de passe incorrect !");
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gray-100 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="max-w-md w-full bg-white shadow-xl rounded-lg p-8"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">🔐 Connexion Admin</h2>

        {errorMessage && <p className="text-red-500 text-center mb-4">{errorMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Inputs Nom & Email */}
          {(["nom", "email"] as Array<keyof typeof formData>).map((field, index) => (
            <motion.div 
              key={field}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input 
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
                className="mt-1 w-full border border-gray-300 rounded-md p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Entrez votre ${field}`}
              />
            </motion.div>
          ))}

          {/* Mot de passe avec icône œil 👁️ */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              <button 
                type="button"
                className="absolute right-3 top-3 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </motion.div>

          {/* Bouton de connexion */}
          <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
            <button type="submit" className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded shadow-lg">
              Se connecter
            </button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
}
