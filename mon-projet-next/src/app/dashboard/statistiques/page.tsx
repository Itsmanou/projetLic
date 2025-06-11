"use client";

import Sidebar from "@/app/components/Sidebar/Sidebar";
import React from "react";
import { motion } from "framer-motion";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function DashboardStats() {
  const stats = [
    { label: "Produits vendus", value: 3200 },
    { label: "Commandes en cours", value: 150 },
    { label: "Revenus (FCFA)", value: "24,500" },
    { label: "Clients enregistrés", value: 520 },
  ];

  const barChartData = {
    labels: ["Jan", "Fév", "Mars", "Avril", "Mai", "Juin"],
    datasets: [
      {
        label: "Revenus mensuels (FCFA)",
        data: [4000, 6000, 8000, 10000, 9000, 12000],
        backgroundColor: "#3b82f6",
        borderRadius: 8,
      },
    ],
  };

  const doughnutChartData = {
    labels: ["Paracétamol", "Ibuprofène", "Vitamines", "Antibiotiques"],
    datasets: [
      {
        data: [25, 20, 30, 25],
        backgroundColor: ["#1e3a8a", "#9333ea", "#dc2626", "#059669"],
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar affiché à gauche */}
      <Sidebar />


      {/* Contenu principal du Dashboard */}
      <motion.div 
        className="flex-1 p-8 bg-gray-100 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1 
          className="text-3xl font-bold text-center text-blue-700 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          📊 Tableau de Bord - Statistiques Pharmacie
        </motion.h1>

        {/* Cartes Statistiques */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="bg-white shadow-md rounded-lg p-6 text-center"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <h2 className="text-lg font-semibold text-gray-800">{stat.label}</h2>
              <p className="text-2xl font-bold text-blue-700">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Graphique Bar */}
          <motion.div 
            className="bg-white shadow-md rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Revenus par Mois</h2>
            <Bar data={barChartData} />
          </motion.div>

          {/* Graphique Doughnut */}
          <motion.div 
            className="bg-white shadow-md rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">🩺 Produits les plus vendus</h2>
            <Doughnut data={doughnutChartData} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
