"use client";
import { useRouter } from "next/navigation";

const Sidebar: React.FC = () => {
  const router = useRouter();

  return (
    <div className="w-64 bg-blue-700 text-white p-4 h-screen shadow-xl backdrop-blur-md bg-opacity-80">
      <h1 className="text-2xl font-bold text-center mb-6">📊 Admin Dashboard</h1>

      <ul className="space-y-4">
        {/* Accueil */}
        <li
          className="cursor-pointer hover:bg-blue-600 p-3 rounded flex items-center gap-3 transition-all duration-300"
          onClick={() => router.push("/dashboard")}
        >
          🏠 <span>Accueil</span>
        </li>
        <li 
          className="cursor-pointer hover:bg-blue-600 p-3 rounded flex items-center gap-3 transition-all duration-300"
          onClick={() => router.push("/dashboard/statistiques")}
        >
          📈 <span>Statistiques</span>
        </li>
        <li 
          className="cursor-pointer hover:bg-blue-600 p-3 rounded flex items-center gap-3 transition-all duration-300"
          onClick={() => router.push("/dashboard/produits")}
        >
          🛒 <span>Produits</span>
        </li>
        <li 
          className="cursor-pointer hover:bg-blue-600 p-3 rounded flex items-center gap-3 transition-all duration-300"
          onClick={() => router.push("/dashboard/utilisateurs")}
        >
          👤 <span>utilisateurs</span>
        </li>
        {/* Paramètre */}
        <li
          className="cursor-pointer hover:bg-blue-600 p-3 rounded flex items-center gap-3 transition-all duration-300"
          onClick={() => router.push("/dashboard/parametre")}
        >
          ⚙️ <span>Paramètre</span>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;