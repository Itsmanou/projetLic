"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "@/utils/api";
import {
  UserCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";

// Utility for formatting currency (CFA)
function formatCurrency(amount: number) {
  return amount?.toLocaleString("fr-FR") + " CFA";
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();

  // Fetch user info
  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    if (!u) router.push("/login");
    else {
      setProfileData((prev) => ({
        ...prev,
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        address: u.address || "",
      }));
    }
    // eslint-disable-next-line
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Session expirée, veuillez vous reconnecter.");
        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Erreur lors du chargement des commandes");
        setOrders(data.data.orders || []);
      } catch (error: any) {
        setOrdersError(error.message || "Erreur inconnue");
      } finally {
        setOrdersLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expirée, veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      if (profileData.password && profileData.password !== profileData.confirmPassword) {
        alert("Les mots de passe ne correspondent pas.");
        setLoading(false);
        return;
      }

      const payload = {
        nom: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        currentPassword: profileData.currentPassword,
        password: profileData.password
      };

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.error || "Erreur lors de la mise à jour");
        setLoading(false);
        return;
      }

      alert(data.message || "Profil mis à jour !");
      setUser((prev: any) => ({
        ...prev,
        name: payload.nom,
        email: payload.email,
        phone: payload.phone,
        address: payload.address
      }));
      setProfileData((prev) => ({
        ...prev,
        currentPassword: "",
        password: "",
        confirmPassword: ""
      }));

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...getCurrentUser(),
          name: payload.nom,
          email: payload.email,
          phone: payload.phone,
          address: payload.address
        })
      );
    } catch (error: any) {
      alert(error.message || "Erreur inconnue !");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-gray-400 animate-pulse">Chargement du profil...</span>
      </div>
    );
  }

  // Password strength helpers
  const passwordStrength = (pw: string) =>
    pw.length < 6
      ? "Faible"
      : pw.length < 8
        ? "Moyen"
        : pw.length < 12
          ? "Bon"
          : "Excellent";

  const passwordStrengthColor = (pw: string) =>
    pw.length < 6
      ? "bg-red-500"
      : pw.length < 8
        ? "bg-yellow-500"
        : pw.length < 12
          ? "bg-blue-500"
          : "bg-green-500";

  const passwordStrengthTextColor = (pw: string) =>
    pw.length < 6
      ? "text-red-600"
      : pw.length < 8
        ? "text-yellow-600"
        : pw.length < 12
          ? "text-blue-600"
          : "text-green-600";

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-0 py-0">
      <div
        className="
          w-full
          max-w-full
          bg-white
          shadow-2xl
          border border-gray-100
          overflow-hidden
          flex flex-col
          md:flex-row
          md:m-8
        "
        style={{ minHeight: "90vh" }}
      >
        {/* Header/Profile Card */}
        <div className="
          flex flex-col items-center gap-2 
          bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800
          py-10 px-4
          md:w-1/3
          w-full
        ">
          <div className="w-28 h-28 bg-gradient-to-tr from-blue-600 to-blue-400 shadow-xl rounded-full flex items-center justify-center text-white text-5xl font-extrabold border-4 border-white">
            {user.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <h2 className="text-2xl font-bold text-white mt-3">{user.name}</h2>
          <div className="mt-1 text-sm text-blue-100 font-medium flex items-center gap-1">
            {user.role === "admin" ? (
              <>
                <UserIcon className="h-5 w-5 text-blue-200" /> Administrateur
              </>
            ) : (
              <>
                <UserCircleIcon className="h-5 w-5 text-blue-200" /> Client
              </>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow font-semibold transition
              rounded-full
              w-40 h-12 min-w-[8rem] min-h-[3rem] max-w-[10rem] max-h-[3rem] text-base"
            style={{ borderRadius: "2rem" }}
          >
            <LockClosedIcon className="h-5 w-5" />
            Déconnexion
          </button>
          <div className="mt-6 bg-blue-800/60 rounded-md px-4 py-2 text-sm text-white flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Inscrit le :{" "}
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("fr-FR")
              : "--"}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium mt-2">
            {user.isActive ? (
              <span className="flex items-center gap-1 bg-green-500/90 text-white px-2 py-0.5 rounded-full">
                <CheckCircleIcon className="h-4 w-4 text-white" />
                Compte actif
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-red-500/90 text-white px-2 py-0.5 rounded-full">
                <LockClosedIcon className="h-4 w-4 text-white" />
                Compte désactivé
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-300 mt-2">
            <ClockIcon className="h-4 w-4" />
            <span>{currentDateTime.toLocaleTimeString("fr-FR")}</span>
          </div>
        </div>

        {/* Profile Form + Order History */}
        <div className="flex-1 flex flex-col w-full overflow-y-auto">
          <form
            onSubmit={handleProfileSubmit}
            className="
              grid grid-cols-1 md:grid-cols-2 gap-8
              bg-white
              px-8 py-10
              w-full
              flex-shrink-0
            "
          >
            {/* Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Nom complet *
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 text-black border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 text-black border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 text-black border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 text-black border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            {/* Passwords */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <KeyIcon className="h-4 w-4 inline mr-1" />
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={profileData.currentPassword}
                    onChange={handleProfileChange}
                    placeholder="Saisissez votre mot de passe actuel"
                    className="w-full px-4 py-3 text-black border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200
                    w-10 h-10 flex items-center justify-center"
                    style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
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
                    className="w-full px-4 py-3 text-black border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200
                    w-10 h-10 flex items-center justify-center"
                    style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {profileData.password && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className={`h-2 flex-1 bg-gray-200 rounded-full overflow-hidden`}>
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrengthColor(profileData.password)}`}
                        style={{
                          width:
                            profileData.password.length < 6
                              ? "25%"
                              : profileData.password.length < 8
                                ? "50%"
                                : profileData.password.length < 12
                                  ? "75%"
                                  : "100%",
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrengthTextColor(profileData.password)}`}>
                      {passwordStrength(profileData.password)}
                    </span>
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
                    className="w-full px-4 py-3 text-black border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200
                    w-10 h-10 flex items-center justify-center"
                    style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {profileData.confirmPassword && (
                  <div className={`flex items-center space-x-2 text-xs ${profileData.password === profileData.confirmPassword
                    ? "text-green-600"
                    : "text-red-600"
                    } mt-2`}>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>
                      {profileData.password === profileData.confirmPassword
                        ? "Les mots de passe correspondent"
                        : "Les mots de passe ne correspondent pas"}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 mt-4">
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
            {/* Actions */}
            <div className="md:col-span-2 flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed
                w-44 h-12 min-w-[8rem] min-h-[3rem] max-w-[11rem] max-h-[3rem] text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent"></div>
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
                  setProfileData({
                    name: user.name || "",
                    email: user.email || "",
                    phone: user.phone || "",
                    address: user.address || "",
                    currentPassword: "",
                    password: "",
                    confirmPassword: "",
                  });
                }}
                className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all duration-200
                w-44 h-12 min-w-[8rem] min-h-[3rem] max-w-[11rem] max-h-[3rem] text-base"
              >
                Réinitialiser
              </button>
            </div>
          </form>

          {/* Order History */}
          <div className="bg-gray-50 border-t px-6 py-8 flex-1 w-full">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Historique des commandes</h3>
            </div>
            {ordersLoading ? (
              <div className="flex items-center text-blue-600 gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Chargement de vos commandes...
              </div>
            ) : ordersError ? (
              <div className="text-red-600">{ordersError}</div>
            ) : orders.length === 0 ? (
              <div className="text-gray-500">Aucune commande trouvée pour ce compte.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm text-sm">
                  <thead>
                    <tr className="bg-blue-100 text-blue-800">
                      <th className="px-4 py-2 text-left">N°</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Statut</th>
                      <th className="px-4 py-2 text-left">Paiement</th>
                      <th className="px-4 py-2 text-left">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, idx) => (
                      <tr key={order._id} className="border-t border-gray-100 hover:bg-blue-50 transition">
                        <td className="px-4 py-2">{order.orderNumber || order._id?.toString().slice(-6)}</td>
                        <td className="px-4 py-2">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("fr-FR") : "--"}
                        </td>
                        <td className="px-4 py-2 font-medium">{formatCurrency(order.totalAmount || order.subtotal)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                            ${order.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-200 text-gray-700"
                            }`}>
                            {order.status || "?"}
                          </span>
                        </td>
                        <td className="px-4 py-2 capitalize">{order.paymentStatus || "pending"}</td>
                        <td className="px-4 py-2">
                          <details>
                            <summary className="cursor-pointer text-blue-600 hover:underline">Voir</summary>
                            <div className="mt-2 bg-blue-50 p-2 rounded shadow text-xs">
                              {order.items && order.items.length > 0 ? (
                                <ul>
                                  {order.items.map((item: any, i: number) => (
                                    <li key={i}>
                                      {item.name} × {item.quantity} — {formatCurrency(item.price)} chacun
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span>Aucun produit</span>
                              )}
                              <div className="mt-1 text-gray-500">Note: {order.notes || "—"}</div>
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-xs text-gray-400 mt-2">
                  {orders.length} commande{orders.length > 1 ? "s" : ""} affichée{orders.length > 1 ? "s" : ""}.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}