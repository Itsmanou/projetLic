'use client';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { usePanier } from '@/app/context/PanierContext';
import { FaStar } from 'react-icons/fa';
import { MdDescription } from 'react-icons/md';
import { motion } from "framer-motion";

const produits = [
	{
		id: 1,
		nom: 'Paracétamol 500mg',
		prix: 1200,
		image: '/produits.13.jpeg',
		rating: 4,
		description: 'Soulage la douleur et fait baisser la fièvre.',
	},
	{
		id: 2,
		nom: 'Vitamine C 1000mg',
		prix: 1500,
		image: '/produits.14.jpg',
		rating: 5,
		description: 'Renforce le système immunitaire.',
	},
	{
		id: 3,
		nom: 'Gel hydroalcoolique',
		prix: 1000,
		image: '/gelhydro.avif',
		rating: 3,
		description: 'Nettoie les mains sans eau.',
	},
	{ id: 4, nom: "Doliprane", prix: 2000, image: "/produits.12.jpg", rating: 4,Description: 'Agit au niveau du système nerveux central pour bloquer les messages de douleur et abaisser la température corporelle.' },
	{ id: 5, nom: "Ibuprofène", prix: 2500, image: "/produits8.png", rating: 4, Description: "Inhibe les enzymes COX impliquées dans la production des prostaglandines (molécules de l'inflammation et de la douleur)." },
	{ id: 6, nom: "La Croix Rouge", prix: 5000, image: "/produits.15.jpg", rating: 1, Description:"Secours d'urgence (catastrophes, guerres)" },
];

export default function ProduitDetail() {
	const { id } = useParams();
	const { ajouterAuPanier } = usePanier();

	const produit = produits.find((p) => p.id === Number(id));

	if (!produit) {
		return <p className="text-center mt-10 text-red-500">Produit non trouvé.</p>;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-blue-100 py-10 px-4 flex items-center justify-center">
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 40 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.7, ease: "easeOut" }}
				className="max-w-3xl w-full bg-white shadow-2xl p-0 overflow-hidden relative"
			>
				{/* Floating gradient blob */}
				<motion.div
					className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-sky-400/30 via-blue-400/20 to-sky-600/10 blur-3xl z-0"
					animate={{ scale: [1, 1.2, 1], rotate: [0, 30, 0] }}
					transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
				/>
				{/* Back link */}
				<div className="px-8 pt-8 relative z-10">
					<Link
						href="/produits"
						className="text-blue-600 hover:text-blue-800 font-semibold inline-block mb-4 transition-colors"
					>
						← Retour aux produits
					</Link>
				</div>
				<div className="flex flex-col md:flex-row gap-10 px-8 pb-8 pt-2 relative z-10">
					{/* Image with animated border */}
					<motion.div
						className="relative w-full md:w-1/2 h-72 overflow-hidden shadow-lg"
						whileHover={{ scale: 1.04, rotate: 2 }}
						transition={{ duration: 0.4 }}
					>
						<Image
							src={produit.image}
							alt={produit.nom}
							fill
							className="object-cover"
							priority
						/>
						<motion.div
							className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
							animate={{ opacity: [0.3, 0.5, 0.3] }}
							transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
						/>
					</motion.div>
					{/* Details */}
					<div className="md:w-1/2 flex flex-col justify-center">
						<motion.h1
							className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.6 }}
						>
							{produit.nom}
						</motion.h1>
						<motion.p
							className="text-2xl font-bold text-sky-600 mb-3"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.5 }}
						>
							{produit.prix} FCFA
						</motion.p>
						<div className="flex items-center mb-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<motion.span
									key={i}
									initial={{ scale: 0.8, opacity: 0.5 }}
									animate={{
										scale: i < produit.rating ? 1.2 : 1,
										opacity: 1,
										color: i < produit.rating ? "#facc15" : "#d1d5db"
									}}
									transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
								>
									<FaStar className={i < produit.rating ? "text-yellow-400" : "text-gray-300"} />
								</motion.span>
							))}
						</div>
						<motion.p
							className="text-gray-600 text-base mb-8"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5, duration: 0.5 }}
						>
							{produit.description || produit.Description}
						</motion.p>
						<motion.button
							onClick={() => ajouterAuPanier(produit)}
							whileHover={{
								scale: 1.05,
								background: "linear-gradient(to right, #0ea5e9, #2563eb)",
								boxShadow: "0 8px 32px 0 rgba(14, 165, 233, 0.25)"
							}}
							whileTap={{ scale: 0.97 }}
							className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 font-bold shadow transition-all duration-300 hover:from-sky-400 hover:to-blue-500"
						>
							Ajouter au panier
						</motion.button>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
