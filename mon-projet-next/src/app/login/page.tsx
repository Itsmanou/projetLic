"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login: React.FC = () => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Show success toast
    toast.success("Utilisateur créé avec succès");

    // Redirect to the commande page
    router.push("/commandes");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-600 text-xl"
          onClick={() => router.push("/")}
          aria-label="Fermer"
        >
          ✕
        </button>

        {/* Toast Container */}
        <ToastContainer position="top-right" />

        <h2 className="text-xl font-bold mb-4 text-center">Connexion requise</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Adresse e-mail"
            className="w-full p-2 mb-3 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full p-2 mb-3 border rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-800"
          >
            Se connecter
          </button>
        </form>

        {/* Sign-up Option */}
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
  );
};

export default Login;
