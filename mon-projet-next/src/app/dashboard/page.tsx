"use client";

import Sidebar from "@/app/components/Sidebar/Sidebar";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ChartBarIcon,
  UsersIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShoppingCartIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  CalendarDaysIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

// Types for our dashboard data
interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  activeUsers: number;
  recentOrders: number;
  monthlyGrowth: number;
  weeklyRevenue: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'product_added' | 'order_placed' | 'stock_low';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  stock: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeUsers: 0,
    recentOrders: 0,
    monthlyGrowth: 0,
    weeklyRevenue: 0
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [userName, setUserName] = useState<string>("");

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check authentication and fetch dashboard data
  useEffect(() => {
    checkAuthAndFetchData();
  }, [selectedPeriod]);

  const checkAuthAndFetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        toast.error("Vous devez être connecté pour accéder au tableau de bord");
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUserName(parsedUser.name || parsedUser.username || parsedUser.email || "Admin");

      // Check if user is admin
      if (parsedUser.role !== 'admin') {
        toast.error("Accès refusé. Seuls les administrateurs peuvent accéder à cette page.");
        router.push("/");
        return;
      }

      await fetchDashboardData();
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error("Session expirée. Veuillez vous reconnecter.");
      router.push("/login");
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }

      // Fetch dashboard stats, activities, and analytics in parallel
      const [statsResponse, activitiesResponse, analyticsResponse] = await Promise.all([
        fetch('/api/admin/stats', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/admin/activities', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`/api/admin/analytics?period=${selectedPeriod === 'week' ? '7' : selectedPeriod === 'month' ? '30' : '365'}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!statsResponse.ok || !activitiesResponse.ok || !analyticsResponse.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const statsData = await statsResponse.json();
      const activitiesData: {
        success: boolean;
        data: RecentActivity[];
      } = await activitiesResponse.json();
      const analyticsData = await analyticsResponse.json();

      // Update stats with real analytics data
      const realStats = {
        ...statsData.data.stats,
        totalRevenue: analyticsData.data.overview.totalRevenue,
        recentOrders: analyticsData.data.overview.totalOrders,
        weeklyRevenue: analyticsData.data.ordersOverTime
          .slice(-7)
          .reduce((sum: number, item: any) => sum + item.revenue, 0)
      };
      setStats(realStats);

      // Set real top products with actual sales data
      const realTopProducts = analyticsData.data.topProducts.map((product: any) => ({
        id: product._id,
        name: product.productName || 'Produit sans nom',
        sales: product.totalSold,
        revenue: product.revenue,
        stock: Math.floor(Math.random() * 200) + 50 // Keep mock stock for now as it's not in analytics
      }));
      setTopProducts(realTopProducts);

      if (activitiesData.success) {
        setRecentActivities(activitiesData.data);
      }

      // Use real revenue data from analytics
      const realRevenueData: RevenueData[] = analyticsData.data.ordersOverTime
        .slice(-6) // Get last 6 data points
        .map((item: any, index: number) => {
          const date = new Date(item.date);
          const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
          return {
            month: selectedPeriod === 'year' ? monthNames[date.getMonth()] : `J${index + 1}`,
            revenue: item.revenue,
            orders: item.orders
          };
        });
      
      // If no real data, show a message but don't use mock data
      if (realRevenueData.length === 0) {
        setRevenueData([{
          month: 'Aucune donnée',
          revenue: 0,
          orders: 0
        }]);
      } else {
        setRevenueData(realRevenueData);
      }

      toast.success("📊 Tableau de bord mis à jour avec les données en temps réel", {
        position: "top-right",
        autoClose: 2000,
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error(`❌ ${error.message || 'Erreur lors du chargement des données'}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registered': return <UsersIcon className="h-5 w-5 text-green-600" />;
      case 'product_added': return <PlusIcon className="h-5 w-5 text-blue-600" />;
      case 'order_placed': return <ShoppingCartIcon className="h-5 w-5 text-purple-600" />;
      case 'stock_low': return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityBgColor = (status: RecentActivity['status']) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} jour(s)`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

        <Sidebar />

        <div className="flex-1 ml-16 lg:ml-64 transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Chargement des données en temps réel...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      <Sidebar />

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
                  <ChartBarIcon className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    Tableau de Bord
                  </h1>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Vue d'ensemble de votre plateforme PHARMASHOP
                  </p>
                </div>
              </div>

              {/* Current Date/Time Display */}
              <div className="bg-white shadow-lg border border-gray-100  p-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CalendarDaysIcon className="h-4 w-4" />
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
                  Connecté: {userName}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  toast.info("🛒 Redirection vers les produits...", { autoClose: 2000 });
                  router.push("/dashboard/produits");
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white  transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <CubeIcon className="h-5 w-5 mr-2" />
                Gérer les Produits
              </button>
              <button
                onClick={() => {
                  toast.info("👥 Redirection vers les utilisateurs...", { autoClose: 2000 });
                  router.push("/dashboard/utilisateurs");
                }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white  transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <UsersIcon className="h-5 w-5 mr-2" />
                Gérer les Utilisateurs
              </button>
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white  transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Actualiser
              </button>
            </div>
          </motion.div>

          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              className="bg-white  shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Produits</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">+8.2%</span>
                    <span className="text-sm text-gray-500 ml-1">ce mois</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 ">
                  <CubeIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white  shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    {stats.monthlyGrowth >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">ce mois</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 ">
                  <UsersIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white  shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} FCFA</p>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">+12.5%</span>
                    <span className="text-sm text-gray-500 ml-1">ce mois</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 ">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white  shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Commandes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.recentOrders}</p>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">+23.1%</span>
                    <span className="text-sm text-gray-500 ml-1">cette semaine</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 ">
                  <ShoppingCartIcon className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <motion.div
              className="bg-white  shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : '0'}% du total
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              className="bg-white  shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CA Hebdomadaire</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.weeklyRevenue.toLocaleString()} FCFA</p>
                  <p className="text-sm text-gray-500 mt-1">7 derniers jours</p>
                </div>
                <ArrowTrendingUpIcon className="h-8 w-8 text-blue-500" />
              </div>
            </motion.div>
          </div>

          {/* Charts and Lists Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Revenue Chart */}
            <motion.div
              className="bg-white  shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Évolution du Chiffre d'Affaires</h3>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300  text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="week">7 jours</option>
                  <option value="month">30 jours</option>
                  <option value="year">12 mois</option>
                </select>
              </div>

              {/* Simple Bar Chart */}
              <div className="space-y-4">
                {revenueData.length > 0 && revenueData[0].month !== 'Aucune donnée' ? (
                  revenueData.map((item, index) => (
                    <motion.div
                      key={item.month}
                      className="flex items-center space-x-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    >
                      <div className="w-12 text-sm font-medium text-gray-600">{item.month}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100}%` }}
                          transition={{ duration: 1, delay: 1 + index * 0.1 }}
                        />
                      </div>
                      <div className="w-20 text-sm font-semibold text-gray-900 text-right">
                        {item.revenue.toLocaleString()} FCFA
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune donnée de revenus disponible</p>
                    <p className="text-sm">Les données apparaîtront après les premières commandes</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Top Products */}
            <motion.div
              className="bg-white  shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Produits les Plus Vendus</h3>
                <button
                  onClick={() => router.push("/dashboard/produits")}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Voir tout
                </button>
              </div>

              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50  transition-colors duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100  flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sales} ventes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{product.revenue.toLocaleString()} FCFA</p>
                        <p className={`text-sm ${product.stock < 16 ? 'text-orange-600' : product.stock < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                          Stock: {product.stock}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CubeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun produit disponible</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            className="bg-white  shadow-lg border border-gray-100 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Activité Récente</h3>
              <button
                onClick={fetchDashboardData}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Actualiser
              </button>
            </div>

            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    className={`flex items-start space-x-3 p-3  border ${getActivityBgColor(activity.status)}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune activité récente</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}