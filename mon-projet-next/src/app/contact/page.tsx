'use client';
import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

export default function Contact() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    sujet: '',
    message: '',
  });

  // Correction du problème TypeScript
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ 
      ...formData, 
      [e.target.name as keyof typeof formData]: e.target.value 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("✅ Votre message a été envoyé avec succès !");
    setFormData({ nom: '', email: '', sujet: '', message: '' });
  };

  return (
    <motion.div 
      className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-3xl font-bold text-center text-blue-700 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Contactez-nous
        </motion.h1>

        <ToastContainer position="bottom-right" autoClose={5000} theme="colored" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {["nom", "email", "sujet", "message"].map((field, index) => (
            <motion.div 
              key={field}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input 
                type={field === "email" ? "email" : field === "message" ? "textarea" : "text"}
                name={field}
                id={field}
                value={formData[field as keyof typeof formData]}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </motion.div>
          ))}

          <motion.div className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-6 rounded shadow">
              Envoyer
            </button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
}