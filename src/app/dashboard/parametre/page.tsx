"use client";

import Sidebar from "@/app/components/Sidebar/Sidebar";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  UserCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  CogIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

interface AdminProfile {
  nom: string;
  email: string;
  phone: string;
  address: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export default function DashboardSettings() {
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form data
  const [profileData, setProfileData] = useState<AdminProfile>({
    nom: "",
    email: "",
    phone: "",
    address: "",
    currentPassword: "",
    password: "",
    confirmPassword: ""
  });

  // Get current date and time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetchingProfile(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('🔒 Session expirée - Veuillez vous reconnecter');
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement du profil');
      }

      if (data.success) {
        setProfileData(prevData => ({
          ...prevData,
          nom: data.data.nom || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          address: data.data.address || ''
        }));
        
        console.log('✅ Profil chargé avec succès');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!profileData.nom.trim()) {
      toast.error("❌ Le nom est requis");
      return;
    }

    if (!profileData.email.trim()) {
      toast.error("❌ L'email est requis");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast.error("❌ Format d'email invalide");
      return;
    }
    
    // Validation for password change
    if (profileData.password) {
      if (!profileData.currentPassword) {
        toast.error("❌ Veuillez saisir votre mot de passe actuel");
        return;
      }
      
      if (profileData.password !== profileData.confirmPassword) {
        toast.error("❌ Les nouveaux mots de passe ne correspondent pas");
        return;
      }

      if (profileData.password.length < 6) {
        toast.error("❌ Le nouveau mot de passe doit contenir au moins 6 caractères");
        return;
      }
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading("🔄 Mise à jour du profil...", {
        toastId: "profile-update"
      });

      const token = localStorage.getItem('token');
      if (!token) {
        toast.dismiss(loadingToast);
        toast.error('🔒 Session expirée - Veuillez vous reconnecter');
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: profileData.nom,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          currentPassword: profileData.currentPassword,
          password: profileData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      if (data.success) {
        toast.dismiss(loadingToast);
        
        if (profileData.password) {
          toast.success("✅ Profil et mot de passe mis à jour avec succès !");
        } else {
          toast.success("✅ Profil mis à jour avec succès !");
        }
        
        // Clear password fields after successful update
        setProfileData(prev => ({
          ...prev,
          currentPassword: "",
          password: "",
          confirmPassword: ""
        }));

        // Update profile data with response
        if (data.data) {
          setProfileData(prev => ({
            ...prev,
            nom: data.data.nom || prev.nom,
            email: data.data.email || prev.email,
            phone: data.data.phone || prev.phone,
            address: data.data.address || prev.address
          }));
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          limit={3}
        />
        
        <Sidebar />
        
        {/* Loading Content with proper margin for fixed sidebar */}
        <div className="flex-1 ml-16 lg:ml-64 transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Chargement du profil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        limit={3}
      />
      
      <Sidebar />

      {/* Main Content Area with proper margin for fixed sidebar */}
      <div className="flex-1 ml-16 lg:ml-64 transition-all duration-300 ease-in-out">
        <div className="p-4 lg:p-8 min-h-screen overflow-auto">
          {/* Header Section */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 ">
                  <CogIcon className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    Paramètres du Profil
                  </h1>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Gérez vos informations personnelles
                  </p>
                </div>
              </div>
              
              {/* Current Date/Time Display */}
              <div className="bg-white shadow-lg border border-gray-100  p-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{currentDateTime.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span>{currentDateTime.toLocaleTimeString('fr-FR')}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Connecté: {profileData.nom || 'Joedev247'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white shadow-lg border border-gray-100  overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <UserCircleIcon className="h-6 w-6 mr-2" />
                  Informations du Profil
                </h2>
              </div>
              
              <form onSubmit={handleProfileSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Informations Personnelles
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Vos informations de base et de contact
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <UserIcon className="h-4 w-4 inline mr-1" />
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        name="nom"
                        value={profileData.nom}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 text-black border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                        Adresse email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 text-black border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <PhoneIcon className="h-4 w-4 inline mr-1" />
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 text-black border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPinIcon className="h-4 w-4 inline mr-1" />
                        Adresse
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={profileData.address}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 text-black border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <KeyIcon className="h-5 w-5 mr-2 text-green-600" />
                        Sécurité du Compte
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Modifiez votre mot de passe (optionnel)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <LockClosedIcon className="h-4 w-4 inline mr-1" />
                        Mot de passe actuel
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="currentPassword"
                          value={profileData.currentPassword}
                          onChange={handleProfileChange}
                          placeholder="Saisissez votre mot de passe actuel"
                          className="w-full px-4 py-3 text-black border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                          {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Requis uniquement si vous souhaitez changer votre mot de passe
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <KeyIcon className="h-4 w-4 inline mr-1" />
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={profileData.password}
                          onChange={handleProfileChange}
                          placeholder="Nouveau mot de passe (optionnel)"
                          className="w-full px-4 py-3 text-black border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                          {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>
                      {profileData.password && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <div className={`h-2 flex-1 bg-gray-200 rounded-full overflow-hidden`}>
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  profileData.password.length < 6 ? 'bg-red-500 w-1/4' :
                                  profileData.password.length < 8 ? 'bg-yellow-500 w-2/4' :
                                  profileData.password.length < 12 ? 'bg-blue-500 w-3/4' :
                                  'bg-green-500 w-full'
                                }`}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              profileData.password.length < 6 ? 'text-red-600' :
                              profileData.password.length < 8 ? 'text-yellow-600' :
                              profileData.password.length < 12 ? 'text-blue-600' :
                              'text-green-600'
                            }`}>
                              {profileData.password.length < 6 ? 'Faible' :
                               profileData.password.length < 8 ? 'Moyen' :
                               profileData.password.length < 12 ? 'Bon' :
                               'Excellent'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <KeyIcon className="h-4 w-4 inline mr-1" />
                        Confirmer le nouveau mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={profileData.confirmPassword}
                          onChange={handleProfileChange}
                          placeholder="Confirmez le nouveau mot de passe"
                          className="w-full px-4 py-3 text-black border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                          {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>
                      {profileData.confirmPassword && (
                        <div className="mt-2">
                          <div className={`flex items-center space-x-2 text-xs ${
                            profileData.password === profileData.confirmPassword 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>
                              {profileData.password === profileData.confirmPassword 
                                ? 'Les mots de passe correspondent' 
                                : 'Les mots de passe ne correspondent pas'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Security Info Box */}
                    <div className="bg-blue-50 border border-blue-200  p-4">
                      <div className="flex items-start space-x-3">
                        <LockClosedIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Conseils de sécurité</h4>
                          <ul className="text-xs text-blue-800 mt-1 space-y-1">
                            <li>• Utilisez au moins 8 caractères</li>
                            <li>• Mélangez lettres, chiffres et symboles</li>
                            <li>• Évitez les informations personnelles</li>
                            <li>• Ne réutilisez pas d'anciens mots de passe</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold  transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetchProfile(); // Reload original data
                      setProfileData(prev => ({
                        ...prev,
                        currentPassword: "",
                        password: "",
                        confirmPassword: ""
                      }));
                      toast.info("🔄 Formulaire réinitialisé");
                    }}
                    className="flex-1 sm:flex-none px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold  transition-all duration-200"
                  >
                    Réinitialiser
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}