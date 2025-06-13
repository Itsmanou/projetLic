'use client';

import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
  FaYoutube
} from 'react-icons/fa';

interface FormData {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    email: '',
    sujet: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.sujet.trim()) {
      newErrors.sujet = 'Le sujet est requis';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("❌ Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("✅ Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.", {
        icon: <>🚀</>
      });
      
      setFormData({ nom: '', email: '', sujet: '', message: '' });
    } catch (error) {
      toast.error("❌ Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <EnvelopeIcon className="h-6 w-6" />,
      title: "Email",
      details: ["kamenimanuella932@gmail.com"],
      action: "mailto:kamenimanuella932@gmail.com"
    },
    {
      icon: <PhoneIcon className="h-6 w-6" />,
      title: "Téléphone",
      details: ["+237 659 556 885", "+237 674 446 765"],
      action: "tel:+237659556885"
    },
    {
      icon: <MapPinIcon className="h-6 w-6" />,
      title: "Adresse",
      details: ["Douala, Cameroun"],
      action: null
    },
    {
      icon: <ClockIcon className="h-6 w-6" />,
      title: "Horaires",
      details: ["Lun-Ven: 8h-18h", "Sam: 9h-15h", "Dim: Fermé"],
      action: null
    }
  ];

  const subjects = [
    "Question générale",
    "Commande et livraison",
    "Produits disponibles",
    "Support technique",
    "Partenariat",
    "Réclamation",
    "Autre"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <ToastContainer 
        position="top-right" 
        autoClose={5000} 
        theme="colored"
        limit={3}
      />

      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-6 text-blue-200" />
            <h1 className="text-5xl font-bold mb-4">
              Contactez-nous
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Notre équipe est là pour vous aider ! Posez-nous vos questions sur nos produits pharmaceutiques
              ou bénéficiez de nos conseils professionnels.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Form */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="bg-white shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <PaperAirplaneIcon className="h-6 w-6 mr-3" />
                  Envoyez-nous un message
                </h2>
                <p className="text-blue-100 mt-2">
                  Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nom */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <label htmlFor="nom" className="block text-sm font-semibold text-gray-700 mb-2">
                      <UserIcon className="h-4 w-4 inline mr-2" />
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="nom"
                      id="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 transition-all duration-200 text-black ${
                        errors.nom 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } focus:ring-4 focus:outline-none`}
                      placeholder="Votre nom complet"
                    />
                    {errors.nom && (
                      <motion.p 
                        className="mt-1 text-sm text-red-600 flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {errors.nom}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      <EnvelopeIcon className="h-4 w-4 inline mr-2" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 transition-all duration-200 text-black ${
                        errors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } focus:ring-4 focus:outline-none`}
                      placeholder="votre.email@example.com"
                    />
                    {errors.email && (
                      <motion.p 
                        className="mt-1 text-sm text-red-600 flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {errors.email}
                      </motion.p>
                    )}
                  </motion.div>
                </div>

                {/* Sujet */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <label htmlFor="sujet" className="block text-sm font-semibold text-gray-700 mb-2">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-2" />
                    Sujet *
                  </label>
                  <select
                    name="sujet"
                    id="sujet"
                    value={formData.sujet}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 transition-all duration-200 text-black ${
                      errors.sujet 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                    } focus:ring-4 focus:outline-none bg-white`}
                  >
                    <option value="">Sélectionnez un sujet</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  {errors.sujet && (
                    <motion.p 
                      className="mt-1 text-sm text-red-600 flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.sujet}
                    </motion.p>
                  )}
                </motion.div>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 transition-all duration-200 resize-none text-black ${
                      errors.message 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                    } focus:ring-4 focus:outline-none`}
                    placeholder="Décrivez votre question ou votre demande en détail..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    {errors.message ? (
                      <motion.p 
                        className="text-sm text-red-600 flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {errors.message}
                      </motion.p>
                    ) : (
                      <div></div>
                    )}
                    <span className={`text-sm ${formData.message.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.message.length}/500
                    </span>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div 
                  className="pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                             text-white font-semibold py-4 px-8 transition-all duration-200 
                             disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 
                             active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-5 w-5 mr-3" />
                        Envoyer le message
                      </>
                    )}
                  </button>
                </motion.div>
              </form>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="space-y-8">
              
              {/* Contact Cards */}
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.title}
                  className="bg-white shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                        {info.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {info.title}
                      </h3>
                      <div className="space-y-1">
                        {info.details.map((detail, i) => (
                          <p key={i} className="text-gray-600">
                            {info.action ? (
                              <a 
                                href={info.action} 
                                className="hover:text-blue-600 transition-colors duration-200"
                              >
                                {detail}
                              </a>
                            ) : (
                              detail
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Social Media */}
              <motion.div
                className="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg p-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <h3 className="text-lg font-semibold mb-4">Suivez-nous</h3>
                <div className="flex space-x-4">
                  {[
                    { icon: FaFacebook, href: "https://facebook.com", color: "hover:text-blue-300" },
                    { icon: FaInstagram, href: "https://instagram.com", color: "hover:text-pink-300" },
                    { icon: FaWhatsapp, href: "https://wa.me/237659556885", color: "hover:text-green-300" },
                    { icon: FaYoutube, href: "https://youtube.com", color: "hover:text-red-300" }
                  ].map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-white ${social.color} transition-all duration-200 transform hover:scale-110`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <social.icon className="w-6 h-6" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              {/* Emergency Notice */}
              <motion.div
                className="bg-amber-50 border border-amber-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">
                      Urgence médicale ?
                    </h3>
                    <p className="text-sm text-amber-800">
                      En cas d'urgence médicale, contactez immédiatement le 
                      <span className="font-semibold"> 15 (SAMU)</span> ou rendez-vous 
                      aux urgences de l'hôpital le plus proche.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}