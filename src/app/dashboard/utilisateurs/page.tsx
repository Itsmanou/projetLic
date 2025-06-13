"use client";
import Sidebar from "@/app/components/Sidebar/Sidebar";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaTrash, FaUserEdit, FaPlus, FaEye, FaBan, FaCheck, FaUserShield } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  EyeIcon,
  NoSymbolIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
}

export default function DashboardUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete'>('view');
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, inactive: 0, admins: 0 });
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and sort users
  useEffect(() => {
    let filtered = users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply status filter
    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter(user => user.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(user => !user.isActive);
        break;
      case 'admin':
        filtered = filtered.filter(user => user.role === 'admin');
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterStatus, sortBy, sortOrder]);

  // Calculate stats
  useEffect(() => {
    const total = users.length;
    const active = users.filter(user => user.isActive).length;
    const inactive = total - active;
    const admins = users.filter(user => user.role === 'admin').length;

    setStats({ total, active, inactive, admins });
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      // Show loading toast for initial fetch
      const loadingToast = toast.loading("Chargement des utilisateurs...", {
        position: "top-right"
      });

      const token = localStorage.getItem('token');
      if (!token) {
        toast.dismiss(loadingToast);
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        toast.dismiss(loadingToast);
        if (response.status === 401) {
          toast.error("🔒 Session expirée - Veuillez vous reconnecter", {
            position: "top-right",
            autoClose: 5000,
          });
          throw new Error('Non autorisé - Veuillez vous reconnecter');
        }
        if (response.status === 403) {
          toast.error("⛔ Accès refusé - Droits administrateur requis", {
            position: "top-right",
            autoClose: 5000,
          });
          throw new Error('Accès refusé - Droits administrateur requis');
        }
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
        toast.dismiss(loadingToast);
        toast.success(`✅ ${data.data?.length || 0} utilisateur(s) chargé(s) avec succès`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.dismiss(loadingToast);
        throw new Error(data.error || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message);
      toast.error(`❌ ${err.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'delete' | 'makeAdmin' | 'removeAdmin') => {
    // Find user for personalized messages
    const targetUser = users.find(u => u._id === userId);
    const userName = targetUser?.name || 'Utilisateur';
    let loadingToast: any = null;

    try {
      setActionLoading(userId);

      // Show loading toast with action-specific message
      const loadingMessage = getLoadingMessage(action, userName);
      loadingToast = toast.loading(loadingMessage, {
        position: "top-right",
        toastId: `action-${userId}-${action}` // Unique ID to control this specific toast
      });

      const token = localStorage.getItem('token');
      if (!token) {
        // Dismiss loading toast before showing error
        if (loadingToast) toast.dismiss(loadingToast);
        toast.error("🔒 Token d'authentification manquant", {
          position: "top-right",
          autoClose: 4000,
        });
        throw new Error('Token d\'authentification manquant');
      }

      let endpoint = '';
      let method = 'PUT';
      let body: any = {};

      switch (action) {
        case 'activate':
          endpoint = `/api/admin/users/${userId}/activate`;
          break;
        case 'deactivate':
          endpoint = `/api/admin/users/${userId}/disactivate`;
          break;
        case 'delete':
          endpoint = `/api/admin/users/${userId}`;
          method = 'DELETE';
          break;
        case 'makeAdmin':
          endpoint = `/api/admin/users/${userId}/role`;
          body = { role: 'admin' };
          break;
        case 'removeAdmin':
          endpoint = `/api/admin/users/${userId}/role`;
          body = { role: 'user' };
          break;
      }

      console.log('🚀 Making request:', {
        action,
        userId,
        userName,
        endpoint,
        method,
        body,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        }
      });

      // Get response text first to see what we're getting
      const responseText = await response.text();
      console.log('📥 Raw response text:', {
        length: responseText.length,
        preview: responseText.substring(0, 500)
      });

      let data;

      if (!responseText || responseText.trim() === '') {
        // Dismiss loading toast before showing error
        if (loadingToast) toast.dismiss(loadingToast);
        toast.error("❌ Réponse vide du serveur", {
          position: "top-right",
          autoClose: 4000,
        });
        throw new Error('Empty response from server');
      }

      try {
        data = JSON.parse(responseText);
        console.log('📥 Parsed JSON data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', {
          parseError,
          responseText: responseText.substring(0, 1000),
          contentType: response.headers.get('content-type')
        });

        // Dismiss loading toast before showing error
        if (loadingToast) toast.dismiss(loadingToast);
        toast.error("❌ Réponse invalide du serveur", {
          position: "top-right",
          autoClose: 4000,
        });
        throw new Error(`Invalid JSON response. Response was: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        // Dismiss loading toast before showing error
        if (loadingToast) toast.dismiss(loadingToast);

        // Show specific error messages based on status code
        if (response.status === 403) {
          toast.error("⛔ Vous n'avez pas les droits pour effectuer cette action", {
            position: "top-right",
            autoClose: 5000,
          });
        } else if (response.status === 404) {
          toast.error("👤 Utilisateur introuvable", {
            position: "top-right",
            autoClose: 4000,
          });
        } else if (response.status === 400) {
          toast.error(`⚠️ ${data.error || 'Action non autorisée'}`, {
            position: "top-right",
            autoClose: 5000,
          });
        } else if (response.status === 500) {
          toast.error(`💥 Erreur serveur: ${data.error || 'Erreur interne'}`, {
            position: "top-right",
            autoClose: 6000,
          });
        } else {
          toast.error(`❌ Erreur HTTP ${response.status}: ${data.error || response.statusText}`, {
            position: "top-right",
            autoClose: 5000,
          });
        }

        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success) {
        // 🎯 IMPORTANT: Dismiss loading toast before showing success
        if (loadingToast) {
          toast.dismiss(loadingToast);
          // Add a small delay to ensure the loading toast is fully dismissed
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Show success toast with personalized message and icon
        const successMessage = getSuccessMessage(action, userName);
        toast.success(successMessage, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: `success-${userId}-${action}` // Unique ID for success toast
        });

        // Refresh users list
        await fetchUsers();
        setShowModal(false);
      } else {
        // Dismiss loading toast before showing error
        if (loadingToast) toast.dismiss(loadingToast);
        toast.error(`❌ ${data.error || 'Erreur lors de l\'action'}`, {
          position: "top-right",
          autoClose: 4000,
        });
        throw new Error(data.error || 'Erreur lors de l\'action');
      }
    } catch (err: any) {
      console.error('❌ User action error details:', {
        error: err,
        message: err.message,
        action,
        userId,
        userName,
        stack: err.stack
      });

      // 🎯 IMPORTANT: Always dismiss loading toast in catch block
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      // Only show error toast if we haven't already shown one
      if (!err.message.includes('HTTP') && !err.message.includes('Invalid JSON') && !err.message.includes('Token d\'authentification')) {
        toast.error(`❌ ${err.message || 'Une erreur est survenue'}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } finally {
      setActionLoading(null);

      // 🎯 SAFETY NET: Ensure loading toast is dismissed even if something goes wrong
      if (loadingToast) {
        setTimeout(() => {
          toast.dismiss(loadingToast);
        }, 100);
      }
    }
  };

  const getLoadingMessage = (action: string, userName: string) => {
    switch (action) {
      case 'activate': return `🔄 Activation de ${userName}...`;
      case 'deactivate': return `🔄 Désactivation de ${userName}...`;
      case 'delete': return `🗑️ Suppression de ${userName}...`;
      case 'makeAdmin': return `👑 Promotion de ${userName} en administrateur...`;
      case 'removeAdmin': return `👤 Retrait des droits admin de ${userName}...`;
      default: return `🔄 Traitement en cours...`;
    }
  };

  const getSuccessMessage = (action: string, userName: string) => {
    switch (action) {
      case 'activate': return `✅ ${userName} a été activé avec succès`;
      case 'deactivate': return `🚫 ${userName} a été désactivé avec succès`;
      case 'delete': return `🗑️ ${userName} a été supprimé définitivement`;
      case 'makeAdmin': return `👑 ${userName} est maintenant administrateur`;
      case 'removeAdmin': return `👤 ${userName} n'est plus administrateur`;
      default: return `✅ Action effectuée avec succès`;
    }
  };

  const openModal = (user: User, type: 'view' | 'edit' | 'delete') => {
    setSelectedUser(user);
    setModalType(type);
    setShowModal(true);

    // Show info toast when viewing user details
    if (type === 'view') {
      toast.info(`👁️ Consultation du profil de ${user.name}`, {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-md">Inactif</span>;
    }
    return <span className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-700 rounded-md">Actif</span>;
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <span className="px-3 py-1 text-sm font-semibold bg-purple-100 text-purple-700 rounded-md">Admin</span>
    ) : (
      <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-md">Utilisateur</span>
    );
  };

  // Handle search with toast feedback
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length > 2) {
      const results = users.filter((user) =>
        user.name.toLowerCase().includes(value.toLowerCase()) ||
        user.email.toLowerCase().includes(value.toLowerCase())
      ).length;

      toast.info(`🔍 ${results} résultat(s) trouvé(s) pour "${value}"`, {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  // Handle filter change with toast feedback
  const handleFilterChange = (newFilter: 'all' | 'active' | 'inactive' | 'admin') => {
    setFilterStatus(newFilter);

    const filterMessages = {
      all: "📊 Affichage de tous les utilisateurs",
      active: "✅ Filtrage des utilisateurs actifs",
      inactive: "❌ Filtrage des utilisateurs inactifs",
      admin: "👑 Filtrage des administrateurs"
    };

    toast.info(filterMessages[newFilter], {
      position: "top-right",
      autoClose: 2000,
    });
  };

  if (loading) {
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
          limit={5}
        />
        
        <Sidebar />
        
        {/* Loading Content with proper margin for fixed sidebar */}
        <div className="flex-1 ml-16 lg:ml-64 transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Chargement des utilisateurs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        limit={5}
      />
      
      <Sidebar />

      {/* Main Content Area with proper margin for fixed sidebar */}
      <div className="flex-1 ml-16 lg:ml-64 transition-all duration-300 ease-in-out">
        <div className="p-4 lg:p-8 min-h-screen overflow-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Header Section */}
            <div className="mb-8">
              <motion.div
                className="flex items-center space-x-4 mb-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="p-3 bg-blue-100">
                  <UserGroupIcon className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    Gestion des Utilisateurs
                  </h1>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Gérez les utilisateurs de votre plateforme
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 mb-6">
                <div className="flex items-start space-x-3">
                  <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Erreur de chargement</h3>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                      onClick={() => {
                        toast.info("🔄 Nouvelle tentative de chargement...", {
                          position: "top-right",
                          autoClose: 2000,
                        });
                        fetchUsers();
                      }}
                      className="mt-3 bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors duration-200"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <motion.div
                className="bg-white shadow-lg border border-gray-100 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white shadow-lg border border-gray-100 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <div className="p-3 bg-green-100">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white shadow-lg border border-gray-100 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utilisateurs Inactifs</p>
                    <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                  </div>
                  <div className="p-3 bg-red-100">
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white shadow-lg border border-gray-100 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Administrateurs</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                  </div>
                  <div className="p-3 bg-purple-100">
                    <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Search and Filters */}
            <motion.div
              className="bg-white shadow-lg border border-gray-100 p-6 mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search */}
                <div className="flex items-center bg-gray-50 p-3 w-full lg:max-w-md">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    className="w-full bg-transparent focus:outline-none text-black"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                  <select
                    value={filterStatus}
                    onChange={(e) => handleFilterChange(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black min-w-[160px]"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                    <option value="admin">Administrateurs</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value as any);
                        toast.info(`📋 Tri par ${e.target.value === 'name' ? 'nom' : e.target.value === 'email' ? 'email' : 'date'}`, {
                          position: "top-right",
                          autoClose: 1500,
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black min-w-[140px]"
                    >
                      <option value="name">Trier par nom</option>
                      <option value="email">Trier par email</option>
                      <option value="createdAt">Trier par date</option>
                    </select>

                    <button
                      onClick={() => {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        toast.info(`🔄 Tri ${sortOrder === 'asc' ? 'décroissant' : 'croissant'}`, {
                          position: "top-right",
                          autoClose: 1500,
                        });
                      }}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-200 flex items-center"
                      title={`Tri ${sortOrder === 'asc' ? 'croissant' : 'décroissant'}`}
                    >
                      <ChevronUpDownIcon className="h-4 w-4" />
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
                </div>
              </div>
            </motion.div>

            {/* Users Table */}
            <motion.div
              className="bg-white shadow-lg border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <tr>
                        <th className="p-4 font-semibold">Nom</th>
                        <th className="p-4 font-semibold">Email</th>
                        <th className="p-4 font-semibold">Rôle</th>
                        <th className="p-4 font-semibold">Statut</th>
                        <th className="p-4 font-semibold">Date d'inscription</th>
                        <th className="p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user._id}
                          className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.05 }}
                        >
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-gray-600">{user.email}</div>
                          </td>
                          <td className="p-4">{getRoleBadge(user.role)}</td>
                          <td className="p-4">{getStatusBadge(user)}</td>
                          <td className="p-4">
                            <div className="text-gray-600">
                              {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <button
                                onClick={() => openModal(user, 'view')}
                                className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-100 transition-colors duration-200"
                                title="Voir détails"
                                disabled={actionLoading === user._id}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>

                              {user.isActive ? (
                                <button
                                  onClick={() => handleUserAction(user._id, 'deactivate')}
                                  className="text-orange-600 hover:text-orange-800 p-2 hover:bg-orange-100 transition-colors duration-200 disabled:opacity-50"
                                  title="Désactiver"
                                  disabled={actionLoading === user._id}
                                >
                                  {actionLoading === user._id ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-orange-600 rounded-full border-t-transparent"></div>
                                  ) : (
                                    <NoSymbolIcon className="h-4 w-4" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user._id, 'activate')}
                                  className="text-green-600 hover:text-green-800 p-2 hover:bg-green-100 transition-colors duration-200 disabled:opacity-50"
                                  title="Activer"
                                  disabled={actionLoading === user._id}
                                >
                                  {actionLoading === user._id ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-green-600 rounded-full border-t-transparent"></div>
                                  ) : (
                                    <CheckCircleIcon className="h-4 w-4" />
                                  )}
                                </button>
                              )}

                              {user.role === 'user' ? (
                                <button
                                  onClick={() => handleUserAction(user._id, 'makeAdmin')}
                                  className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-100 transition-colors duration-200 disabled:opacity-50"
                                  title="Promouvoir admin"
                                  disabled={actionLoading === user._id}
                                >
                                  {actionLoading === user._id ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-purple-600 rounded-full border-t-transparent"></div>
                                  ) : (
                                    <ShieldCheckIcon className="h-4 w-4" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user._id, 'removeAdmin')}
                                  className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
                                  title="Retirer droits admin"
                                  disabled={actionLoading === user._id}
                                >
                                  {actionLoading === user._id ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-gray-600 rounded-full border-t-transparent"></div>
                                  ) : (
                                    <UsersIcon className="h-4 w-4" />
                                  )}
                                </button>
                              )}

                              <button
                                onClick={() => openModal(user, 'delete')}
                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50"
                                title="Supprimer"
                                disabled={actionLoading === user._id}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 flex items-center justify-center">
                    <UserGroupIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucun utilisateur dans la base de données'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => {
                        toast.info("🚀 Fonctionnalité d'invitation bientôt disponible", {
                          position: "top-right",
                          autoClose: 3000,
                        });
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
                    >
                      <UserPlusIcon className="h-5 w-5 mr-2" />
                      Inviter des utilisateurs
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Modal */}
            {showModal && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <motion.div
                  className="bg-white shadow-xl w-full max-w-md p-6"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      {modalType === 'view' && 'Détails utilisateur'}
                      {modalType === 'edit' && 'Modifier utilisateur'}
                      {modalType === 'delete' && 'Supprimer utilisateur'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        toast.info("📄 Modal fermé", {
                          position: "top-right",
                          autoClose: 1500,
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1 transition-colors duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {modalType === 'view' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <p className="text-gray-900 bg-gray-50 p-3">{selectedUser.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900 bg-gray-50 p-3">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                        <div className="bg-gray-50 p-3">
                          {getRoleBadge(selectedUser.role)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <div className="bg-gray-50 p-3">
                          {getStatusBadge(selectedUser)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date d'inscription</label>
                        <p className="text-gray-900 bg-gray-50 p-3">
                          {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {selectedUser.lastLogin && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dernière connexion</label>
                          <p className="text-gray-900 bg-gray-50 p-3">
                            {new Date(selectedUser.lastLogin).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {modalType === 'delete' && (
                    <div>
                      <div className="bg-red-50 border border-red-200 p-4 mb-4">
                        <div className="flex items-center">
                          <TrashIcon className="h-5 w-5 text-red-500 mr-2" />
                          <h4 className="text-red-800 font-medium">Attention</h4>
                        </div>
                        <p className="text-red-700 text-sm mt-1">
                          Cette action est irréversible et supprimera définitivement l'utilisateur.
                        </p>
                      </div>
                      <p className="text-gray-700 mb-6">
                        Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser.name}</strong> ?
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowModal(false);
                            toast.info("❌ Suppression annulée", {
                              position: "top-right",
                              autoClose: 2000,
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => {
                            handleUserAction(selectedUser._id, 'delete');
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                          disabled={actionLoading === selectedUser._id}
                        >
                          {actionLoading === selectedUser._id ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </div>
                  )}

                  {modalType === 'view' && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => {
                          setShowModal(false);
                          toast.info("📄 Consultation terminée", {
                            position: "top-right",
                            autoClose: 1500,
                          });
                        }}
                        className="px-6 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
                      >
                        Fermer
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}