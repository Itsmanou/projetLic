"use client";
import { useState, useEffect } from "react";
import { usePanier } from "@/app/context/PanierContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaTrash, FaPlus, FaMinus, FaShoppingBag, FaTruck, FaUser, FaMapMarkerAlt, FaUpload, FaHospital, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaArrowLeft, FaHome } from "react-icons/fa";
import Tesseract from 'tesseract.js';

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  imageUrl: string;
  price: number;
}

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface PrescriptionData {
  prescriptionFile: File | null;
  clinicName: string;
  isValidated: boolean;
  validationText: string;
}

export default function PanierPage() {
  const { panier, supprimerDuPanier, changerQuantite, viderPanier } = usePanier();
  const router = useRouter();

  const [isConnected, setIsConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Cameroun',
    phone: ''
  });
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
    prescriptionFile: null,
    clinicName: '',
    isValidated: false,
    validationText: ''
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isValidatingPrescription, setIsValidatingPrescription] = useState(false);
  const [prescriptionValidationStatus, setPrescriptionValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token with backend
          const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setIsConnected(data.success);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
            setIsConnected(false);
          }
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsConnected(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const fraisLivraison = 2000;
  const sousTotal = panier.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = sousTotal + (panier.length > 0 ? fraisLivraison : 0);

  // Prescription validation keywords (French and English)
  const prescriptionKeywords = [
    // French medical terms
    'prescription', 'ordonnance', 'médicament', 'posologie', 'traitement',
    'docteur', 'médecin', 'dr', 'patient', 'date', 'signature',
    'pharmacie', 'dispensé', 'renouvelable', 'fois par jour',
    'comprimé', 'gélule', 'sirop', 'injection', 'pommade',
    'avant repas', 'après repas', 'matin', 'soir', 'midi',
    
    // English medical terms (common in some regions)
    'medication', 'medicine', 'doctor', 'patient', 'dosage',
    'tablet', 'capsule', 'syrup', 'prescription', 'pharmacy',
    'times daily', 'before meals', 'after meals', 'morning', 'evening',
    
    // Medical abbreviations
    'mg', 'ml', 'cc', 'bid', 'tid', 'qid', 'od', 'bd', 'tds'
  ];

  const validatePrescriptionImage = async (file: File): Promise<{ isValid: boolean; extractedText: string }> => {
    try {
      setIsValidatingPrescription(true);
      setPrescriptionValidationStatus('validating');

      const { data: { text } } = await Tesseract.recognize(file, 'fra+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const extractedText = text.toLowerCase();
      console.log('Extracted text:', extractedText);

      // Check if the text contains prescription-related keywords
      const foundKeywords = prescriptionKeywords.filter(keyword => 
        extractedText.includes(keyword.toLowerCase())
      );

      const isValid = foundKeywords.length >= 2; // Require at least 2 medical keywords

      setPrescriptionValidationStatus(isValid ? 'valid' : 'invalid');
      
      return {
        isValid,
        extractedText: text
      };
    } catch (error) {
      console.error('OCR validation error:', error);
      setPrescriptionValidationStatus('invalid');
      return {
        isValid: false,
        extractedText: ''
      };
    } finally {
      setIsValidatingPrescription(false);
    }
  };

  const handleCommander = () => {
    if (!isConnected) {
      setShowModal(true);
      return;
    }

    // Validate prescription requirements
    if (!prescriptionData.prescriptionFile) {
      toast.error('Veuillez télécharger une prescription médicale avant de continuer.');
      return;
    }

    if (!prescriptionData.isValidated) {
      toast.error('Veuillez attendre la validation de votre prescription ou téléchargez une prescription valide.');
      return;
    }

    if (!prescriptionData.clinicName.trim()) {
      toast.error('Veuillez indiquer le nom de l\'établissement de santé.');
      return;
    }

    setShowCheckout(true);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handlePrescriptionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validate file type (only images for OCR)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Format de fichier non supporté. Veuillez utiliser JPG, PNG ou GIF pour la prescription.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux. Taille maximale: 5MB.');
        return;
      }

      // Create preview for images
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Update prescription data first
      setPrescriptionData(prev => ({ 
        ...prev, 
        prescriptionFile: file,
        isValidated: false,
        validationText: ''
      }));

      // Validate prescription using OCR
      toast.info('Validation de la prescription en cours...');
      const validation = await validatePrescriptionImage(file);
      
      if (validation.isValid) {
        toast.success('Prescription validée avec succès!');
        setPrescriptionData(prev => ({ 
          ...prev, 
          isValidated: true,
          validationText: validation.extractedText
        }));
      } else {
        toast.error('Cette image ne semble pas être une prescription médicale valide. Veuillez télécharger une image claire d\'une prescription.');
        setPrescriptionData(prev => ({ 
          ...prev, 
          isValidated: false,
          validationText: validation.extractedText
        }));
      }
    } else {
      setImagePreview(null);
      setPrescriptionData(prev => ({ 
        ...prev, 
        prescriptionFile: null,
        isValidated: false,
        validationText: ''
      }));
      setPrescriptionValidationStatus('idle');
    }
  };

  const handleRemoveFile = () => {
    setPrescriptionData(prev => ({ 
      ...prev, 
      prescriptionFile: null,
      isValidated: false,
      validationText: ''
    }));
    setImagePreview(null);
    setPrescriptionValidationStatus('idle');
    // Reset the file input
    const fileInput = document.getElementById('prescription') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleClinicNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrescriptionData(prev => ({ ...prev, clinicName: e.target.value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté pour passer commande');
        setShowModal(true);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();

      // Format items for order creation
      const items = panier.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const orderData = {
        items,
        shippingAddress,
        totalAmount: total,
        prescriptionData: {
          clinicName: prescriptionData.clinicName
        }
      };

      // Add order data to FormData
      formData.append('orderData', JSON.stringify(orderData));

      // Add prescription file if exists
      if (prescriptionData.prescriptionFile) {
        formData.append('prescriptionFile', prescriptionData.prescriptionFile);
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Commande passée avec succès!');
        viderPanier();

        // Reset prescription data
        setPrescriptionData({
          prescriptionFile: null,
          clinicName: '',
          isValidated: false,
          validationText: ''
        });
        setImagePreview(null);

        // Redirect to orders page or order confirmation
        setTimeout(() => {
          router.push('/commandes');
        }, 2000);
      } else {
        throw new Error(data.error || 'Erreur lors de la création de la commande');
      }
    } catch (err: any) {
      console.error('Order creation error:', err);
      toast.error(err.message || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      supprimerDuPanier(productId);
    } else {
      changerQuantite(productId, newQuantity);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Back to Home Button */}
        <motion.div
          className="mb-6"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition-colors duration-200 hover:text-blue-600"
          >
            <FaArrowLeft className="text-sm" />
            <FaHome className="text-sm" />
            Retour à l'accueil
          </button>
        </motion.div>

        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <FaShoppingBag className="inline-block mr-3 text-blue-600" />
            Mon Panier
          </h1>
          <p className="text-gray-600">
            {panier.length} article{panier.length !== 1 ? 's' : ''} dans votre panier
          </p>
        </motion.div>

        {panier.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white shadow-lg p-12 max-w-md mx-auto">
              <div className="text-6xl mb-6">🛒</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Votre panier est vide</h2>
              <p className="text-gray-600 mb-8">
                Découvrez nos produits et ajoutez-les à votre panier
              </p>
              <button
                onClick={() => router.push('/produits')}
                className="bg-blue-600 text-white px-8 py-3 hover:bg-blue-700 transition-colors font-semibold"
              >
                Découvrir nos produits
              </button>
            </div>
          </motion.div>
        ) : !showCheckout ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <motion.div
                className="bg-white shadow-lg p-6"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Articles dans votre panier</h2>

                <div className="space-y-4">
                  {panier.map((produit, index) => (
                    <motion.div
                      key={produit.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      {/* Product Image */}
                      <motion.div
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="relative w-20 h-20 overflow-hidden">
                          <Image
                            src={imageErrors[produit.id] ? '/placeholder-product.jpg' : produit.imageUrl}
                            alt={produit.name}
                            fill
                            className="object-cover"
                            onError={() => handleImageError(produit.id)}
                          />
                        </div>
                      </motion.div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{produit.name}</h3>
                        <p className="text-blue-600 font-bold">{produit.price.toLocaleString()} FCFA</p>
                        <p className="text-sm text-gray-500">
                          Sous-total: {(produit.price * produit.quantity).toLocaleString()} FCFA
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(produit.id, produit.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-black transition-colors"
                        >
                          <FaMinus className="text-xs" />
                        </button>

                        <span className="w-12 text-center font-semibold text-black">{produit.quantity}</span>

                        <button
                          onClick={() => handleQuantityChange(produit.id, produit.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-black transition-colors"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => supprimerDuPanier(produit.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        title="Supprimer du panier"
                      >
                        <FaTrash />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Clear Cart Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={viderPanier}
                    className="text-red-600 hover:text-red-800 font-medium transition-colors"
                  >
                    Vider le panier
                  </button>
                </div>
              </motion.div>

              <motion.div
                className="bg-white shadow-lg p-6 mt-6"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <FaUpload className="text-red-600 text-xl" />
                  <h2 className="text-xl font-bold text-gray-800">Prescription Médicale (Obligatoire)</h2>
                  <span className="text-red-500 text-sm">*</span>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 text-lg mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">Prescription obligatoire</p>
                      <p className="text-red-700 text-sm mt-1">
                        Pour des raisons de sécurité et de conformité réglementaire, une prescription médicale 
                        valide est obligatoire pour finaliser votre commande.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label htmlFor="prescription" className="block text-sm font-medium text-gray-700 mb-2">
                      Télécharger votre prescription *
                    </label>

                    {!prescriptionData.prescriptionFile ? (
                      <div className="relative">
                        <input
                          type="file"
                          id="prescription"
                          accept="image/*"
                          onChange={handlePrescriptionFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="prescription"
                          className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-red-300 hover:border-red-400 cursor-pointer transition-colors bg-red-50 hover:bg-red-100 rounded-lg"
                        >
                          <div className="text-center">
                            <FaUpload className="mx-auto text-3xl text-red-400 mb-2" />
                            <p className="text-red-600 font-medium">
                              Cliquez pour télécharger votre prescription
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              Formats acceptés: JPG, PNG, GIF (Max: 5MB)
                            </p>
                            <p className="text-xs text-red-600 font-medium mt-2">
                              ⚠️ Champ obligatoire
                            </p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* File Info with Validation Status */}
                        <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                          prescriptionValidationStatus === 'validating' ? 'bg-blue-50 border-blue-200' :
                          prescriptionValidationStatus === 'valid' ? 'bg-green-50 border-green-200' :
                          prescriptionValidationStatus === 'invalid' ? 'bg-red-50 border-red-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            {prescriptionValidationStatus === 'validating' && (
                              <FaSpinner className="text-blue-500 animate-spin" />
                            )}
                            {prescriptionValidationStatus === 'valid' && (
                              <FaCheckCircle className="text-green-500" />
                            )}
                            {prescriptionValidationStatus === 'invalid' && (
                              <FaExclamationTriangle className="text-red-500" />
                            )}
                            {prescriptionValidationStatus === 'idle' && (
                              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            )}
                            <div>
                              <p className={`text-sm font-medium ${
                                prescriptionValidationStatus === 'valid' ? 'text-green-700' :
                                prescriptionValidationStatus === 'invalid' ? 'text-red-700' :
                                prescriptionValidationStatus === 'validating' ? 'text-blue-700' :
                                'text-gray-700'
                              }`}>
                                {prescriptionData.prescriptionFile.name}
                              </p>
                              <p className={`text-xs ${
                                prescriptionValidationStatus === 'valid' ? 'text-green-600' :
                                prescriptionValidationStatus === 'invalid' ? 'text-red-600' :
                                prescriptionValidationStatus === 'validating' ? 'text-blue-600' :
                                'text-gray-600'
                              }`}>
                                {prescriptionValidationStatus === 'validating' && 'Validation en cours...'}
                                {prescriptionValidationStatus === 'valid' && '✓ Prescription validée'}
                                {prescriptionValidationStatus === 'invalid' && '✗ Prescription non valide'}
                                {prescriptionValidationStatus === 'idle' && `${(prescriptionData.prescriptionFile.size / 1024 / 1024).toFixed(2)} MB`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveFile}
                            className="flex items-center gap-2 px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            disabled={isValidatingPrescription}
                          >
                            <FaTrash className="text-sm" />
                            <span className="text-sm">Supprimer</span>
                          </button>
                        </div>

                        {/* Validation Message */}
                        {prescriptionValidationStatus === 'invalid' && (
                          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <FaExclamationTriangle className="text-red-600 text-lg mt-0.5" />
                              <div>
                                <p className="text-red-800 font-medium">Prescription non valide</p>
                                <p className="text-red-700 text-sm mt-1">
                                  L'image téléchargée ne semble pas être une prescription médicale valide. 
                                  Assurez-vous que l'image est claire et contient les informations médicales nécessaires.
                                </p>
                                <p className="text-red-600 text-xs mt-2">
                                  Conseils: Vérifiez que l'image est nette, bien éclairée et que le texte est lisible.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {prescriptionValidationStatus === 'validating' && (
                          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <FaSpinner className="text-blue-600 animate-spin" />
                              <div>
                                <p className="text-blue-800 font-medium">Validation en cours...</p>
                                <p className="text-blue-700 text-sm">
                                  Notre système analyse votre prescription. Veuillez patienter quelques instants.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Image Preview */}
                        {imagePreview && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">Aperçu de la prescription:</p>
                            <div className="relative max-w-md mx-auto">
                              <img
                                src={imagePreview}
                                alt="Aperçu de la prescription"
                                className="w-full h-auto max-h-96 object-contain rounded-lg shadow-sm border border-gray-200"
                              />
                            </div>
                          </div>
                        )}

                        {/* Replace File Button */}
                        <div className="text-center">
                          <label
                            htmlFor="prescription"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <FaUpload />
                            Changer le fichier
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clinic Name Input */}
                  <div>
                    <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-2">
                      <FaHospital className="inline-block mr-2 text-red-600" />
                      Nom de la clinique/centre de santé/hôpital *
                    </label>
                    <input
                      type="text"
                      id="clinicName"
                      value={prescriptionData.clinicName}
                      onChange={handleClinicNameChange}
                      placeholder="Ex: Clinique Pasteur, Hôpital Principal de Dakar..."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black ${
                        !prescriptionData.clinicName.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                    {!prescriptionData.clinicName.trim() && (
                      <p className="text-red-600 text-xs mt-1">⚠️ Ce champ est obligatoire</p>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Validation automatique:</strong> Notre système utilise la reconnaissance de texte (OCR) 
                      pour vérifier que votre document est bien une prescription médicale valide. 
                      Assurez-vous que l'image est claire et lisible.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                className="bg-white shadow-lg p-6 sticky top-6"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Récapitulatif</h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-black">
                    <span>Sous-total ({panier.length} article{panier.length !== 1 ? 's' : ''})</span>
                    <span>{sousTotal.toLocaleString()} FCFA</span>
                  </div>

                  <div className="flex justify-between items-center text-blue-600">
                    <div className="flex items-center gap-2">
                      <FaTruck />
                      <span>Frais de livraison</span>
                    </div>
                    <span>{fraisLivraison.toLocaleString()} FCFA</span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center text-xl font-bold text-black">
                      <span>Total</span>
                      <span>{total.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleCommander}
                  whileHover={{ scale: prescriptionData.isValidated && prescriptionData.clinicName.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: prescriptionData.isValidated && prescriptionData.clinicName.trim() ? 0.98 : 1 }}
                  disabled={!prescriptionData.isValidated || !prescriptionData.clinicName.trim() || isValidatingPrescription}
                  className={`w-full mt-6 py-3 px-6 font-semibold transition-colors shadow-lg ${
                    prescriptionData.isValidated && prescriptionData.clinicName.trim() && !isValidatingPrescription
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  {isValidatingPrescription ? (
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" />
                      Validation en cours...
                    </div>
                  ) : !prescriptionData.prescriptionFile ? (
                    'Prescription requise'
                  ) : !prescriptionData.isValidated ? (
                    'Prescription non validée'
                  ) : !prescriptionData.clinicName.trim() ? (
                    'Nom établissement requis'
                  ) : (
                    'Passer commande'
                  )}
                </motion.button>

                {(!prescriptionData.isValidated || !prescriptionData.clinicName.trim()) && (
                  <div className="mt-3 text-center">
                    <p className="text-red-600 text-sm">
                      ⚠️ Une prescription validée et le nom de l'établissement sont obligatoires
                    </p>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.push('/produits')}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Continuer mes achats
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <motion.div
            className="max-w-4xl mx-auto bg-white shadow-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <FaUser className="text-blue-600 text-2xl" />
              <h2 className="text-3xl font-bold text-gray-800">Finaliser votre commande</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Summary */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Récapitulatif de la commande</h3>
                <div className="bg-gray-50 p-6">
                  <div className="space-y-3">
                    {panier.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex-1">
                          <span className="font-medium text-black">{item.name}</span>
                          <span className="text-blue-600 ml-2">x {item.quantity}</span>
                        </div>
                        <span className="font-semibold text-black">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center py-2 text-blue-600">
                      <div className="flex items-center gap-2">
                        <FaTruck />
                        <span>Frais de livraison</span>
                      </div>
                      <span>{fraisLivraison.toLocaleString()} FCFA</span>
                    </div>

                    <div className="flex justify-between items-center py-3 text-xl font-bold text-gray-800 border-t border-gray-300">
                      <span>Total</span>
                      <span>{total.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Prescription Summary */}
                {(prescriptionData.prescriptionFile || prescriptionData.clinicName) && (
                  <div className="mt-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-3">Prescription</h4>
                    <div className={`p-4 rounded-lg space-y-2 ${
                      prescriptionData.isValidated ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      {prescriptionData.prescriptionFile && (
                        <div className="flex items-center gap-2">
                          {prescriptionData.isValidated ? (
                            <FaCheckCircle className="text-green-600" />
                          ) : (
                            <FaExclamationTriangle className="text-red-600" />
                          )}
                          <span className={`text-sm ${prescriptionData.isValidated ? 'text-green-700' : 'text-red-700'}`}>
                            Fichier: {prescriptionData.prescriptionFile.name}
                            {prescriptionData.isValidated ? ' (Validée)' : ' (Non validée)'}
                          </span>
                        </div>
                      )}
                      {prescriptionData.clinicName && (
                        <div className="flex items-center gap-2">
                          <FaHospital className={prescriptionData.isValidated ? 'text-green-600' : 'text-red-600'} />
                          <span className={`text-sm ${prescriptionData.isValidated ? 'text-green-700' : 'text-red-700'}`}>
                            Établissement: {prescriptionData.clinicName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Show image preview in checkout if available */}
                    {imagePreview && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Aperçu de la prescription:</p>
                        <div className="relative max-w-xs">
                          <img
                            src={imagePreview}
                            alt="Aperçu de la prescription"
                            className="w-full h-auto max-h-48 object-contain rounded border border-gray-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shipping Form */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FaMapMarkerAlt className="text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-800">Adresse de livraison</h3>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={shippingAddress.fullName}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="+221 XX XXX XX XX"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={shippingAddress.address}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        Ville *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Code postal
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Pays *
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 transition-colors font-medium text-black"
                    >
                      Retour au panier
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 px-6 py-3 text-white font-semibold transition-colors ${loading
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                          Traitement...
                        </div>
                      ) : (
                        'Confirmer la commande'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* Login Modal */}
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white shadow-xl w-full max-w-md p-8 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>

              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🔐</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Connexion requise</h2>
                <p className="text-gray-600">
                  Veuillez vous connecter pour finaliser votre commande
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    router.push('/login');
                  }}
                  className="w-full bg-blue-600 text-white py-3 hover:bg-blue-700 transition-colors font-semibold"
                >
                  Se connecter
                </button>

                <button
                  onClick={() => {
                    setShowModal(false);
                    router.push('/register');
                  }}
                  className="w-full bg-gray-200 text-gray-800 py-3 hover:bg-gray-300 transition-colors font-semibold"
                >
                  Créer un compte
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}