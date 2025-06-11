"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "react-toastify";

// Type pour un produit avec quantité
export interface Produit {
  id: number;
  nom: string;
  prix: number;
  image: string;
  rating: number;
  quantite: number;
}

// Type pour un produit sans quantité (utilisé lors de l'ajout)
type ProduitSansQuantite = Omit<Produit, "quantite">;

// Type du contexte
interface PanierContextType {
  panier: Produit[];
  ajouterAuPanier: (produit: ProduitSansQuantite) => void;
  supprimerDuPanier: (id: number) => void;
  changerQuantite: (id: number, quantite: number) => void;
  viderPanier: () => void;
}

// Création du contexte
const PanierContext = createContext<PanierContextType | undefined>(undefined);

// Hook personnalisé
export const usePanier = () => {
  const context = useContext(PanierContext);
  if (!context) throw new Error("usePanier must be used within PanierProvider");
  return context;
};

// Provider
export const PanierProvider = ({ children }: { children: ReactNode }) => {
  const [panier, setPanier] = useState<Produit[]>([]);

  const ajouterAuPanier = (produit: ProduitSansQuantite) => {
    setPanier((prev) => {
      const existant = prev.find((p) => p.id === produit.id);
      let nouveauPanier: Produit[];

      if (existant) {
        nouveauPanier = prev.map((p) =>
          p.id === produit.id ? { ...p, quantite: p.quantite + 1 } : p
        );
      } else {
        nouveauPanier = [...prev, { ...produit, quantite: 1 }];
      }

      // ✅ Utiliser setTimeout pour éviter l'erreur React
      setTimeout(() => {
        toast.success("✅ Produit ajouté au panier !", {
          position: "top-right",
          autoClose: 2000,
        });
      }, 0);

      return nouveauPanier;
    });
  };

  const supprimerDuPanier = (id: number) => {
    setPanier((prev) => prev.filter((p) => p.id !== id));
    setTimeout(() => {
      toast.info("Produit retiré du panier.", {
        position: "top-right",
        autoClose: 2000,
      });
    }, 0);
  };

  const changerQuantite = (id: number, quantite: number) => {
    if (quantite < 1) return;
    setPanier((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantite } : p))
    );
  };

  // ✅ Fonction pour vider complètement le panier
  const viderPanier = () => {
    setPanier([]);
  };

  return (
    <PanierContext.Provider
      value={{ panier, ajouterAuPanier, supprimerDuPanier, changerQuantite, viderPanier }}
    >
      {children}
    </PanierContext.Provider>
  );
};