"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { usePanier } from "@/app/context/PanierContext";

export default function CommandePage() {
  const { panier, viderPanier } = usePanier();

  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const fraisLivraison = 2000;
  const sousTotal = panier.reduce((sum, p) => sum + p.prix * (p.quantite || 1), 0);
  const total = sousTotal + fraisLivraison;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom || !adresse || !telephone) {
      toast.error("❌ Veuillez remplir tous les champs.");
      return;
    }

    viderPanier();
    toast.success("✅ Commande envoyée avec succès !");
    setNom("");
    setAdresse("");
    setTelephone("");
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white shadow-2xl border border-gray-200 flex flex-col md:flex-row p-0">
        {/* Résumé du panier */}
        <div className="md:w-1/2 w-full border-r border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide">
            Résumé de la commande
          </h2>
          {panier.length === 0 ? (
            <div className="text-gray-500 text-center py-10">
              Votre panier est vide.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {panier.map((item) => (
                <li key={item.id} className="flex justify-between items-center py-3">
                  <span className="font-medium text-gray-700">{item.nom}</span>
                  <span className="text-gray-500">x{item.quantite || 1}</span>
                  <span className="font-semibold text-blue-700">
                    {item.prix * (item.quantite || 1)} FCFA
                  </span>
                </li>
              ))}
              {/* 🔹 Affichage du prix de la livraison */}
              <li className="flex justify-between items-center pt-4 font-medium text-lg text-blue-600">
                <span>Frais de livraison :</span>
                <span>{fraisLivraison} FCFA</span>
              </li>
              {/* 🔹 Total mis en valeur */}
              <li className="flex justify-between items-center pt-6 font-bold text-xl text-gray-800">
                <span>Total :</span>
                <span>{total} FCFA</span>
              </li>
            </ul>
          )}
        </div>
        {/* Formulaire de paiement */}
        <div className="md:w-1/2 w-full p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide">
            Informations de paiement
          </h2>
          {formSubmitted ? (
            <div className="text-center py-16">
              <p className="text-green-600 text-xl font-semibold mb-2">
                Merci pour votre commande !
              </p>
              <p className="text-gray-700">Vous serez contacté(e) bientôt.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 uppercase tracking-wide">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 focus:ring-blue-400 bg-gray-50"
                  required
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2 uppercase tracking-wide">
                  Adresse
                </label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 focus:ring-blue-400 bg-gray-50"
                  required
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2 uppercase tracking-wide">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 focus:ring-blue-400 bg-gray-50"
                  required
                  style={{ borderRadius: 0 }}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-700 text-white font-bold py-3 px-4 uppercase tracking-wider shadow hover:bg-black transition-all"
                style={{ borderRadius: 0 }}
              >
                Valider la commande
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
