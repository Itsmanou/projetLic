"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 🔹 Import du router pour la redirection
import { motion } from "framer-motion";

export default function RegisterForm() {
  const router = useRouter(); // 🔹 Initialisation du router

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({ nom: "", email: "", password: "" });
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let newErrors = { nom: "", email: "", password: "" };

    if (!formData.nom) newErrors.nom = "Le nom est requis.";
    if (!validateEmail(formData.email)) newErrors.email = "Email invalide.";
    if (formData.password.length < 6) newErrors.password = "Le mot de passe doit contenir au moins 6 caractères.";

    if (newErrors.nom || newErrors.email || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    setSuccessMessage("✅ Compte créé avec succès !");
    
    // 🔹 Redirection automatique vers le formulaire de connexion
    setTimeout(() => {
      router.push("/login"); // Remplacez par le chemin de votre formulaire de connexion
    }, 2000);
  };

  return (
    <motion.div 
      className="min-h-screen flex justify-center items-center bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Créer un compte</h2>

        {successMessage && <p className="text-green-600 text-center mb-4">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            { label: "Nom", name: "nom", type: "text", error: errors.nom },
            { label: "Email", name: "email", type: "email", error: errors.email },
            { label: "Mot de passe", name: "password", type: "password", error: errors.password },
          ].map((field, index) => (
            <motion.div 
              key={field.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700">{field.label}</label>
              <input 
                type={field.type}
                name={field.name}
                value={formData[field.name as keyof typeof formData]}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {field.error && <p className="text-red-500 text-sm mt-1">{field.error}</p>}
            </motion.div>
          ))}

          <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
            <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-6 rounded shadow">
              S'inscrire
            </button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
}
