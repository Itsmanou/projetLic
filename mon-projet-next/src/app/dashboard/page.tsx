"use client";
import Sidebar from "../components/Sidebar/Sidebar";
import { Bar } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Import Chart.js components & register them
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetchSalesData = async (): Promise<{ sales: number[] }> => {
  const { data } = await axios.get("/api/sales");
  return data;
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["salesData"],
    queryFn: fetchSalesData,
  });

  const salesChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr"],
    datasets: [{ label: "Ventes (FCFA)", data: data?.sales || [5000, 7000, 8000, 9000], backgroundColor: "blue" }]
  };

  const options = {
    responsive: true,
    scales: {
      x: { type: "category" as const }, // ✅ Specify category type
      y: { type: "linear" as const, beginAtZero: true },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 p-6">
        <ToastContainer position="top-right" />
        <h2 className="text-3xl font-bold">📊 Tableau de Bord Administratif</h2>

        {isLoading ? (
          <p className="mt-4">Chargement des données...</p>
        ) : (
          <div className="bg-white p-6 rounded shadow mt-4">
            <h3 className="text-xl font-semibold mb-3">💰 Revenus Mensuels</h3>
            <Bar data={salesChartData} options={options} />
          </div>
        )}
      </div>
    </div>
  );
}
