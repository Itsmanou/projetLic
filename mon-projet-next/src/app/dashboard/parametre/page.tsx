"use client";

import Sidebar from "@/app/components/Sidebar/Sidebar";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // 🔹 Import des icônes

export default function DashboardSettings() {
  const [formData, setFormData] = useState({
    nom: "Manou",
    email: "manuellakameni932@gmail.com",
    password: "Manou123",
  });

  const [showPassword, setShowPassword] = useState(false); // 🔹 État pour afficher/masquer le mot de passe

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.email || !formData.password) {
      alert("❌ Veuillez remplir tous les champs !");
      return;
    }

    alert("✅ Paramètres enregistrés avec succès !");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar affiché à gauche */}
      <div className="w-64 h-screen bg-white shadow-md">
        <Sidebar />
      </div>

      {/* Contenu principal du Dashboard */}
      <motion.div 
        className="flex-1 p-8 bg-gray-100 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1 
          className="text-3xl font-bold text-center text-blue-700 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          ⚙️ Paramètres de l'Administrateur
        </motion.h1>

        <motion.div 
          className="max-w-lg mx-auto bg-white shadow-lg rounded-lg p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {(["nom", "email"] as Array<keyof typeof formData>).map((field, index) => (
              <motion.div 
                key={field}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 + index * 0.2 }}
              >
                <label className="block text-sm font-medium text-gray-700">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input 
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </motion.div>
            ))}

            {/* Sécurité avec icône œil 🔍 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
                  required
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

            {/* Bouton de validation */}
            <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
              <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded shadow-lg">
                Enregistrer
              </button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
