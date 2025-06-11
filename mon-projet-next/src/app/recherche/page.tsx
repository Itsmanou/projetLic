"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { produits } from "../produits/page"; // Make sure this path is correct

type Produit = {
  id: number;
  nom: string;
  prix: number;
  image: string;
  rating: number;
  description: string;
};

export default function PageRecherche() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query")?.toLowerCase() || "";
  const [resultats, setResultats] = useState<Produit[]>([]);

  useEffect(() => {
    const filtres = produits.filter((p) =>
      p.nom.toLowerCase().includes(query)
    );
    setResultats(filtres);
  }, [query]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Résultats pour : "{query}"</h1>
      {resultats.length > 0 ? (
        <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {resultats.map((produit) => (
            <li key={produit.id} className="border p-4 rounded">
              <img
                src={produit.image}
                alt={produit.nom}
                className="w-full h-40 object-cover mb-2"
              />
              <p className="font-semibold">{produit.nom}</p>
              <p>{produit.prix} FCFA</p>
              <p>Note : {produit.rating} / 5</p>
              <p>{produit.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun produit trouvé.</p>
      )}
    </div>
  );
}
