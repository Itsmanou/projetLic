"use client";
import Sidebar from "@/app/components/Sidebar/Sidebar";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaTrash, FaUserEdit } from "react-icons/fa";

const usersData = [
  { id: 1, nom: "Alice Dupont", email: "alice@example.com", statut: "Actif" },
  { id: 2, nom: "Marc Lemoine", email: "marc@example.com", statut: "Inactif" },
  { id: 3, nom: "Julie Martel", email: "julie@example.com", statut: "Actif" },
  { id: 4, nom: "Xavier Bernard", email: "xavier@example.com", statut: "Suspendu" },
];

export default function DashboardUsers() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = usersData.filter((user) =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar affiché à gauche */}
      <Sidebar />

    <motion.div 
      className="min-h-screen p-8 bg-gray-100"
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
        👥 Gestion des Utilisateurs
      </motion.h1>

      {/* Barre de recherche */}
      <motion.div 
        className="max-w-lg mx-auto flex items-center bg-white shadow-md rounded-lg p-3 mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <FaSearch className="text-gray-400 text-lg mr-3" />
        <input 
          type="text"
          placeholder="Rechercher un utilisateur..."
          className="w-full focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </motion.div>

      {/* Tableau des utilisateurs */}
      <motion.div 
        className="bg-white shadow-lg rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <table className="w-full text-left border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-4">Nom</th>
              <th className="p-4">Email</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <motion.tr 
                key={user.id}
                className="border-b hover:bg-blue-50 transition"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <td className="p-4">{user.nom}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.statut === "Actif" ? "bg-green-100 text-green-700" : user.statut === "Inactif" ? "bg-gray-200 text-gray-600" : "bg-red-200 text-red-700"}`}>
                    {user.statut}
                  </span>
                </td>
                <td className="p-4 flex gap-4">
                  <button className="text-blue-600 hover:text-blue-800">
                    <FaUserEdit />
                  </button>
                  <button className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
    </div>
  );
}
