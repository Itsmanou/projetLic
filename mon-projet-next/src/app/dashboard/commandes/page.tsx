"use client";
import Sidebar from "@/app/components/Sidebar/Sidebar";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaEye, FaTruck, FaCheckCircle, FaClock, FaTimesCircle, FaBox, FaExclamationTriangle, FaBan } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
type StatusFilter = "all" | OrderStatus;

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
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

const statusLabel = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En traitement",
  shipped: "Expédié",
  delivered: "Livré",
  cancelled: "Annulé"
};

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const statusIcon = {
  pending: <FaClock className="text-yellow-600" />,
  confirmed: <FaCheckCircle className="text-blue-600" />,
  processing: <FaBox className="text-blue-600" />,
  shipped: <FaTruck className="text-purple-600" />,
  delivered: <FaCheckCircle className="text-green-600" />,
  cancelled: <FaTimesCircle className="text-red-600" />,
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  // Fetch orders from backend
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token d'authentification manquant");
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Erreur lors du chargement des commandes");
      setOrders(data.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
      toast.error(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  // Filter/sort orders
  useEffect(() => {
    let filtered = [...orders];
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter(order =>
        (order.orderNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  // Update status via backend
  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    setUpdatingOrderId(orderId);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token d'authentification manquant");
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Erreur lors de la mise à jour");
      toast.success("Statut mis à jour !");
      fetchOrders();
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString("fr-FR") + " FCFA";
  }

  // Statuses the admin can set (en traitement excluded)
  const adminSettableStatus: OrderStatus[] = ["confirmed", "shipped", "delivered", "cancelled"];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
        <div className="p-2 sm:p-4 lg:p-8 min-h-screen overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white p-3 sm:p-6 border shadow flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-bold text-blue-700">{stats.total}</span>
              <span className="mt-2 text-gray-600 font-medium text-xs sm:text-base">Total commandes</span>
            </div>
            <div className="bg-white p-3 sm:p-6 border shadow flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</span>
              <span className="mt-2 text-gray-600 font-medium text-xs sm:text-base">En attente</span>
            </div>
            <div className="bg-white p-3 sm:p-6 border shadow flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-bold text-blue-600">{stats.confirmed}</span>
              <span className="mt-2 text-gray-600 font-medium text-xs sm:text-base">Confirmées</span>
            </div>
            <div className="bg-white p-3 sm:p-6 border shadow flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-bold text-purple-700">{stats.shipped}</span>
              <span className="mt-2 text-gray-600 font-medium text-xs sm:text-base">Expédiées</span>
            </div>
            <div className="bg-white p-3 sm:p-6 border shadow flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-bold text-green-700">{stats.delivered}</span>
              <span className="mt-2 text-gray-600 font-medium text-xs sm:text-base">Livrées</span>
            </div>
            <div className="bg-white p-3 sm:p-6 border shadow flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-bold text-red-700">{stats.cancelled}</span>
              <span className="mt-2 text-gray-600 font-medium text-xs sm:text-base">Annulées</span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow-lg border border-gray-100 p-3 sm:p-6 mb-6 sm:mb-8 flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
              {(["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded ${statusFilter === status ? "bg-blue-600 text-white" : "bg-gray-100 text-blue-800"} font-semibold text-xs sm:text-base transition`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "Toutes" : statusLabel[status]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-2 sm:p-3 rounded w-full lg:w-auto">
              <FaSearch className="text-black mr-2" />
              <input
                type="text"
                placeholder="Rechercher commande/client..."
                className="bg-transparent text-black w-full focus:outline-none text-xs sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-4 mb-6">
              <div className="flex items-start space-x-3">
                <FaExclamationTriangle className="h-6 w-6 text-red-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Erreur de chargement</h3>
                  <p className="text-sm mt-1">{error}</p>
                  <button
                    onClick={fetchOrders}
                    className="mt-3 bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors duration-200"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <motion.div
            className="bg-white shadow-lg border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-60">
                <div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-blue-500 rounded-full"></div>
                <span className="ml-4 text-blue-600 font-semibold">Chargement des commandes...</span>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[540px]">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <tr>
                      <th className="p-2 sm:p-4 font-semibold">Numéro</th>
                      <th className="p-2 sm:p-4 font-semibold">Utilisateur</th>
                      <th className="p-2 sm:p-4 font-semibold">Montant</th>
                      <th className="p-2 sm:p-4 font-semibold">Date</th>
                      <th className="p-2 sm:p-4 font-semibold">Statut</th>
                      <th className="p-2 sm:p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, idx) => (
                      <motion.tr
                        key={order._id}
                        className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-100"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.04 }}
                      >
                        <td className="p-2 sm:p-4 font-bold text-blue-700">{order.orderNumber || order._id.slice(-6)}</td>
                        <td className="p-2 sm:p-4 text-black">{order.shippingAddress.fullName}</td>
                        <td className="p-2 sm:p-4 font-semibold text-blue-600">{formatCurrency(order.totalAmount)}</td>
                        <td className="p-2 sm:p-4 text-black">{formatDate(order.createdAt)}</td>
                        <td className="p-2 sm:p-4">
                          <span className={`px-2 sm:px-3 py-1 rounded border text-xs font-semibold flex items-center gap-2 ${statusColor[order.status]}`}>
                            {statusIcon[order.status]} {statusLabel[order.status]}
                          </span>
                        </td>
                        <td className="p-2 sm:p-4">
                          <div className="flex gap-1 sm:gap-2 flex-wrap">
                            <button
                              title="Voir détails"
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-100 rounded"
                              onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                            >
                              <FaEye />
                            </button>
                            {/* Status actions (admin can set: confirmée, expédiée, livrée, annulée) */}
                            {order.status !== "delivered" && order.status !== "cancelled" && (
                              <>
                                {adminSettableStatus.map(s =>
                                  s !== order.status ? (
                                    <button
                                      key={s}
                                      className={`${
                                        s === "confirmed"
                                          ? "text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                                          : s === "shipped"
                                          ? "text-purple-700 hover:text-purple-900 hover:bg-purple-100"
                                          : s === "delivered"
                                          ? "text-green-700 hover:text-green-900 hover:bg-green-100"
                                          : s === "cancelled"
                                          ? "text-red-700 hover:text-red-900 hover:bg-red-100"
                                          : ""
                                      } p-2 rounded`}
                                      title={`Marquer comme ${statusLabel[s]}`}
                                      disabled={updatingOrderId === order._id}
                                      onClick={() => updateOrderStatus(order._id, s)}
                                    >
                                      {updatingOrderId === order._id ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                                      ) : (
                                        <>
                                          {s === "confirmed" && <FaCheckCircle />}
                                          {s === "shipped" && <FaTruck />}
                                          {s === "delivered" && <FaCheckCircle />}
                                          {s === "cancelled" && <FaBan />}
                                        </>
                                      )}
                                    </button>
                                  ) : null
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-16">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 flex items-center justify-center">
                  <FaBox className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Aucune commande trouvée</h3>
                <p className="text-gray-600 mb-2 sm:mb-4 text-sm sm:text-base">
                  {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucune commande enregistrée'}
                </p>
              </div>
            )}
          </motion.div>

          {/* Order Details Modal */}
          {showModal && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <motion.div
                className="bg-white shadow-xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-5 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-black">
                      Commande #{selectedOrder.orderNumber || selectedOrder._id.slice(-6)}
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                      aria-label="Fermer"
                    >
                      &times;
                    </button>
                  </div>
                  {/* Status */}
                  <div className="mb-5 sm:mb-6">
                    <span className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border flex items-center gap-2 w-fit ${statusColor[selectedOrder.status]}`}>
                      {statusIcon[selectedOrder.status]} {statusLabel[selectedOrder.status]}
                    </span>
                  </div>
                  {/* Items */}
                  <div className="mb-5 sm:mb-6">
                    <h4 className="font-semibold text-black mb-2 sm:mb-3 text-base sm:text-lg">Produits commandés</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-3 bg-gray-50">
                          <div>
                            <p className="font-medium text-black text-sm sm:text-base">{item.name}</p>
                            <p className="text-xs sm:text-sm text-black">Prix unitaire: {formatCurrency(item.price)}</p>
                          </div>
                          <div className="text-left sm:text-right mt-1 sm:mt-0">
                            <p className="font-semibold text-black text-xs sm:text-base">Qté: {item.quantity}</p>
                            <p className="text-blue-600 font-bold text-xs sm:text-base">{formatCurrency(item.subtotal)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Shipping Address */}
                  <div className="mb-5 sm:mb-6">
                    <h4 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-base sm:text-lg">
                      <FaBox /> Adresse de livraison
                    </h4>
                    <div className="bg-gray-50 p-2 sm:p-4">
                      <p className="font-medium text-black">{selectedOrder.shippingAddress.fullName}</p>
                      <p className="text-black">{selectedOrder.shippingAddress.address}</p>
                      <p className="text-black">{selectedOrder.shippingAddress.postalCode} {selectedOrder.shippingAddress.city}</p>
                      <p className="text-black">{selectedOrder.shippingAddress.country}</p>
                      {selectedOrder.shippingAddress.phone && (
                        <p className="mt-2 flex items-center gap-2 text-black">
                          <FaBox className="text-sm" />
                          {selectedOrder.shippingAddress.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Summary */}
                  <div className="border-t pt-3 sm:pt-4">
                    <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-black">Sous-total</span>
                        <span className="text-black">{formatCurrency(selectedOrder.subtotal || selectedOrder.totalAmount - (selectedOrder.shippingCost || 2000))}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-black">Frais de livraison</span>
                        <span className="text-black">{formatCurrency(selectedOrder.shippingCost || 2000)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-base sm:text-lg font-bold border-t pt-2">
                      <span className="text-black">Total</span>
                      <span className="text-blue-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-black mt-1">
                      Commande passée le {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  {/* Modal Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-5 sm:mt-6 pt-3 sm:pt-4 border-t">
                    {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                      <>
                        {adminSettableStatus.map(s =>
                          s !== selectedOrder.status ? (
                            <button
                              key={s}
                              onClick={() => updateOrderStatus(selectedOrder._id, s)}
                              className={`flex-1 px-2 py-2 sm:px-4 sm:py-2 ${
                                s === "confirmed"
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : s === "shipped"
                                  ? "bg-purple-600 hover:bg-purple-700"
                                  : s === "delivered"
                                  ? "bg-green-600 hover:bg-green-700"
                                  : s === "cancelled"
                                  ? "bg-red-600 hover:bg-red-700"
                                  : ""
                              } text-white transition-colors text-xs sm:text-base`}
                              disabled={updatingOrderId === selectedOrder._id}
                            >
                              {updatingOrderId === selectedOrder._id ? "Traitement..." : `Marquer comme ${statusLabel[s]}`}
                            </button>
                          ) : null
                        )}
                      </>
                    )}
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-2 py-2 sm:px-4 sm:py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors text-xs sm:text-base"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}