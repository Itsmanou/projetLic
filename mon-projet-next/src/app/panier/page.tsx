"use client";
import { useState } from "react";
import { usePanier } from "@/app/context/PanierContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PanierPage() {
  const { panier, supprimerDuPanier, changerQuantite } = usePanier();
  const router = useRouter();

  const [isConnected, setIsConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fraisLivraison = 2000;
  const sousTotal = panier.reduce((acc, item) => acc + item.prix * item.quantite, 0);
  const total = sousTotal + fraisLivraison;

  const handleCommander = () => {
    if (!isConnected) {
      setShowModal(true);
    } else {
      router.push("/commande");
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gray-100 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.h1 
        className="text-3xl font-bold mb-6 text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        🛒 Mon Panier
      </motion.h1>

      {panier.length === 0 ? (
        <motion.p 
          className="text-center text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Votre panier est vide.
        </motion.p>
      ) : (
        <motion.div 
          className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {panier.map((produit, index) => (
            <motion.div
              key={produit.id}
              className="flex items-center gap-4 mb-6 border-b pb-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
                <Image
                  src={produit.image}
                  alt={produit.nom}
                  width={80}
                  height={80}
                  className="object-cover shadow-md"
                />
              </motion.div>

              <div className="flex-1">
                <h2 className="font-semibold text-gray-800">{produit.nom}</h2>
                <p className="text-sm text-gray-500">{produit.prix} FCFA</p>

                <div className="flex items-center mt-2">
                  <button
                    onClick={() => changerQuantite(produit.id, produit.quantite - 1)}
                    disabled={produit.quantite === 1}
                    className="px-2 py-1 bg-gray-200 rounded-l disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="px-4">{produit.quantite}</span>
                  <button
                    onClick={() => changerQuantite(produit.id, produit.quantite + 1)}
                    className="px-2 py-1 bg-gray-200 rounded-r"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="text-red-500 hover:text-red-700 font-semibold"
                onClick={() => supprimerDuPanier(produit.id)}
              >
                Supprimer
              </button>
            </motion.div>
          ))}

          <motion.div 
            className="flex justify-between items-center mt-4 font-semibold text-lg text-blue-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span>Frais de livraison :</span>
            <span>{fraisLivraison} FCFA</span>
          </motion.div>

          <motion.div 
            className="flex justify-between items-center mt-4 font-bold text-xl text-gray-800"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span>Total à payer :</span>
            <span>{total} FCFA</span>
          </motion.div>

          <motion.div className="text-center mt-6" whileHover={{ scale: 1.1 }}>
            <button
              onClick={handleCommander}
              className="bg-blue-600 hover:bg-black text-white px-6 py-2 rounded shadow-md text-lg"
            >
              Commander
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* 🔹 Modale de connexion directement intégrée */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button className="absolute top-3 right-3 text-gray-600 text-xl" onClick={() => setShowModal(false)}>
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Connexion requise</h2>
            <form onSubmit={(e) => { 
              e.preventDefault();
              setIsConnected(true);
              setShowModal(false);
              router.push("/commandes");
            }}>
              <input type="email" placeholder="Adresse e-mail" className="w-full p-2 mb-3 border rounded" required />
              <input type="password" placeholder="Mot de passe" className="w-full p-2 mb-3 border rounded" required />
              <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-800">
                Se connecter
              </button>
            </form>

            {/* 🔹 Ajout de l'option "Créer un compte" */}
            <p className="mt-4 text-center text-sm">
              Vous n'avez pas de compte ?{" "}
              <span
                className="text-blue-600 cursor-pointer ml-1 underline"
                onClick={() => router.push("/register")}
              >
                Créer un compte
              </span>
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
