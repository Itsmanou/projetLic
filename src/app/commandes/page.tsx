"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { 
  FaShoppingBag, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaDownload, 
  FaCalendarAlt,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaBox,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaSync,
  FaExclamationTriangle
} from 'react-icons/fa';

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl?: string;
}

interface Order {
  _id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  requiresPrescription?: boolean;
  prescriptionImages?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderFilters {
  status: string;
  dateRange: string;
  search: string;
}

interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function CommandesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    dateRange: 'all',
    search: ''
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      checkAuthAndFetchOrders();
    }
  }, [hasMounted]);

  useEffect(() => {
    if (hasMounted && orders.length >= 0) {
      applyFilters();
    }
  }, [orders, filters, hasMounted]);

  const checkAuthAndFetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Veuillez vous connecter pour accéder à vos commandes');
        router.push('/login');
        return;
      }

      await fetchOrders();
    } catch (err) {
      console.error('Auth check failed:', err);
      router.push('/login');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch('/api/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          toast.error('Session expirée, veuillez vous reconnecter');
          router.push('/login');
          return;
        }
        throw new Error('Erreur lors du chargement des commandes');
      }

      const data: OrdersResponse = await response.json();
      
      if (data.success) {
        // Extract orders array from the correct path
        const ordersArray = data.data?.orders || [];
        setOrders(ordersArray);
      } else {
        throw new Error('Erreur lors du chargement des commandes');
      }
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.message);
      toast.error(err.message);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Ensure orders is always an array
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case '7days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          filterDate.setDate(now.getDate() - 90);
          break;
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
      }
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order._id.toLowerCase().includes(searchLower) ||
        order.shippingAddress.fullName.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredOrders(filtered);
  };

  const handleCancelOrderClick = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowConfirmModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderToCancel}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'annulation de la commande');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Commande annulée avec succès');
        fetchOrders();
        setShowModal(false);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setShowConfirmModal(false);
      setOrderToCancel(null);
    }
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement de la facture');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Facture téléchargée avec succès');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-600" />;
      case 'confirmed':
        return <FaCheckCircle className="text-blue-600" />;
      case 'processing':
        return <FaBox className="text-blue-600" />;
      case 'shipped':
        return <FaTruck className="text-purple-600" />;
      case 'delivered':
        return <FaCheckCircle className="text-green-600" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'processing':
        return 'En traitement';
      case 'shipped':
        return 'Expédié';
      case 'delivered':
        return 'Livré';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const canCancelOrder = (order: Order) => {
    return order.status === 'pending' || order.status === 'confirmed';
  };

  // Show loading until hydrated
  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

   if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
     
      
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <FaShoppingBag className="text-blue-600" />
            Mes Commandes
          </h1>
          <p className="text-gray-600">Suivez l'état de vos commandes et téléchargez vos factures</p>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <div>
                <p className="font-medium text-red-800">Erreur</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              className="mt-2 bg-red-600 text-white px-4 py-2 hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Filters */}
        <motion.div
          className="bg-white shadow-md p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex items-center bg-gray-50 p-3 flex-1 max-w-md">
              <FaSearch className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Rechercher par numéro de commande..."
                className="w-full bg-transparent focus:outline-none text-black placeholder-gray-500"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-black bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="processing">En traitement</option>
                <option value="shipped">Expédié</option>
                <option value="delivered">Livré</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-500" />
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-black bg-white"
              >
                <option value="all">Toutes les dates</option>
                <option value="7days">7 derniers jours</option>
                <option value="30days">30 derniers jours</option>
                <option value="90days">90 derniers jours</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>

          <div className="mt-4 text-sm text-black">
            {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} trouvée{filteredOrders.length !== 1 ? 's' : ''}
          </div>
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-white shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-xl text-black mb-6">
              {orders.length === 0 ? "Vous n'avez pas encore de commandes" : "Aucune commande trouvée avec ces filtres"}
            </p>
            <button
              onClick={() => router.push('/produits')}
              className="bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors"
            >
              Découvrir nos produits
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order._id}
                className="bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-black mb-1">
                        Commande #{order.orderNumber || order._id.substring(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <FaCalendarAlt />
                        {formatDate(order.createdAt)}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-sm text-blue-600 mt-1">
                          Suivi: {order.trackingNumber}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 text-sm font-medium border flex items-center gap-2 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {translateStatus(order.status)}
                      </span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-sm text-gray-500">{order.items.length} article{order.items.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-medium text-black mb-3">Produits commandés</h4>
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm bg-gray-50 p-3">
                          <span className="font-medium text-black">{item.name}</span>
                          <div className="text-right">
                            <span className="text-black">Qté: {item.quantity}</span>
                            <span className="ml-4 font-semibold text-black">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-black text-center py-2">
                          +{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''} produit{order.items.length - 3 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estimated Delivery */}
                  {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="bg-blue-50 border border-blue-200 p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <FaTruck className="inline mr-2" />
                        Livraison estimée: {formatDate(order.estimatedDelivery)}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <FaEye />
                      Voir détails
                    </button>
                    
                    <button
                      onClick={() => downloadInvoice(order._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <FaDownload />
                      Facture
                    </button>

                    {canCancelOrder(order) && (
                      <button
                        onClick={() => handleCancelOrderClick(order._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <FaTimesCircle />
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-black">
                    Détails de la commande #{selectedOrder.orderNumber || selectedOrder._id.substring(0, 8)}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Order Status */}
                <div className="mb-6">
                  <span className={`px-4 py-2 text-sm font-medium border flex items-center gap-2 w-fit ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {translateStatus(selectedOrder.status)}
                  </span>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h4 className="font-semibold text-black mb-3">Produits commandés</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50">
                        <div>
                          <p className="font-medium text-black">{item.name}</p>
                          <p className="text-sm text-black">Prix unitaire: {formatCurrency(item.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-black">Qté: {item.quantity}</p>
                          <p className="text-blue-600 font-bold">{formatCurrency(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mb-6">
                  <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <FaMapMarkerAlt />
                    Adresse de livraison
                  </h4>
                  <div className="bg-gray-50 p-4">
                    <p className="font-medium text-black">{selectedOrder.shippingAddress.fullName}</p>
                    <p className="text-black">{selectedOrder.shippingAddress.address}</p>
                    <p className="text-black">{selectedOrder.shippingAddress.postalCode} {selectedOrder.shippingAddress.city}</p>
                    <p className="text-black">{selectedOrder.shippingAddress.country}</p>
                    {selectedOrder.shippingAddress.phone && (
                      <p className="mt-2 flex items-center gap-2 text-black">
                        <FaPhone className="text-sm" />
                        {selectedOrder.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Sous-total</span>
                      <span className="text-black">{formatCurrency(selectedOrder.subtotal || selectedOrder.totalAmount - (selectedOrder.shippingCost || 2000))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Frais de livraison</span>
                      <span className="text-black">{formatCurrency(selectedOrder.shippingCost || 2000)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                    <span className="text-black">Total</span>
                    <span className="text-blue-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                  <p className="text-sm text-black mt-1">
                    Commande passée le {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => downloadInvoice(selectedOrder._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <FaDownload />
                    Télécharger la facture
                  </button>
                  
                  {canCancelOrder(selectedOrder) && (
                    <button
                      onClick={() => handleCancelOrderClick(selectedOrder._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      <FaTimesCircle />
                      Annuler la commande
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Clean Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <motion.div
              className="bg-white shadow-xl w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
                    <FaExclamationTriangle className="text-red-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">
                      Confirmer l'annulation
                    </h3>
                    <p className="text-sm text-black mt-1">
                      Cette action ne peut pas être annulée
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <p className="text-black">
                    Êtes-vous sûr de vouloir annuler cette commande ? Une fois annulée, vous ne pourrez plus la récupérer.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setOrderToCancel(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-black hover:bg-gray-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmCancelOrder}
                    className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                  >
                    Confirmer l'annulation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}