"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const Sidebar: React.FC = () => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile
      if (mobile) {
        setIsExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Logout function
  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success("🚪 Déconnexion réussie");
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("❌ Erreur lors de la déconnexion");
    }
  };

  const menuItems = [
    { icon: "🏠", label: "Accueil", path: "/dashboard" },
    { icon: "🛒", label: "Produits", path: "/dashboard/produits" },
    { icon: "👤", label: "Utilisateurs", path: "/dashboard/utilisateurs" },
    { icon: "⚙️", label: "Paramètre", path: "/dashboard/parametre" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* Fixed Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen
        ${isExpanded ? (isMobile ? 'w-64' : 'w-64') : 'w-16'} 
        bg-blue-700 text-white shadow-xl backdrop-blur-md bg-opacity-80 
        transition-all duration-300 ease-in-out z-50 flex flex-col
        ${isMobile && !isExpanded ? '-translate-x-full' : 'translate-x-0'}
      `}>
        
        {/* Header with Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-blue-600 flex-shrink-0">
          {isExpanded && (
            <h1 className="text-xl font-bold transition-opacity duration-300">
              📊 Admin Dashboard
            </h1>
          )}
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`
              p-2 rounded-lg hover:bg-blue-600 transition-all duration-300
              ${!isExpanded && !isMobile ? 'mx-auto' : ''}
            `}
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <span className="text-lg">
              {isExpanded ? "◀" : "▶"}
            </span>
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <nav className="mt-6">
            <ul className="space-y-2 px-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <button
                    className={`
                      w-full cursor-pointer hover:bg-blue-600 p-3 rounded-lg 
                      flex items-center gap-3 transition-all duration-300
                      ${!isExpanded ? 'justify-center' : 'justify-start'}
                      group relative
                    `}
                    onClick={() => router.push(item.path)}
                  >
                    {/* Icon */}
                    <span className="text-xl flex-shrink-0">
                      {item.icon}
                    </span>
                    
                    {/* Label */}
                    {isExpanded && (
                      <span className="transition-opacity duration-300 capitalize">
                        {item.label}
                      </span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {!isExpanded && !isMobile && (
                      <div className="
                        absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm 
                        rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        pointer-events-none whitespace-nowrap z-60
                      ">
                        {item.label}
                        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 
                          border-4 border-transparent border-r-gray-800"></div>
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Fixed Logout Section */}
        <div className="border-t border-blue-600 p-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`
              w-full cursor-pointer hover:bg-red-600 p-3 rounded-lg 
              flex items-center gap-3 transition-all duration-300
              ${!isExpanded ? 'justify-center' : 'justify-start'}
              group relative text-red-200 hover:text-white
            `}
          >
            {/* Icon */}
            <span className="text-xl flex-shrink-0">
              🚪
            </span>
            
            {/* Label */}
            {isExpanded && (
              <span className="transition-opacity duration-300 capitalize">
                Déconnexion
              </span>
            )}
            
            {/* Tooltip for collapsed state */}
            {!isExpanded && !isMobile && (
              <div className="
                absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm 
                rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
                pointer-events-none whitespace-nowrap z-60
              ">
                Déconnexion
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 
                  border-4 border-transparent border-r-gray-800"></div>
              </div>
            )}
          </button>
        </div>

        {/* Fixed Footer - Only show when expanded */}
        {isExpanded && (
          <div className="p-4 text-center text-xs opacity-60 flex-shrink-0 border-t border-blue-600">
            <p>Admin Panel v1.0</p>
            <p className="text-blue-200 mt-1">Joedev247</p>
          </div>
        )}
      </div>

      {/* Mobile Toggle Button - Only show when sidebar is collapsed on mobile */}
      {isMobile && !isExpanded && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-3 bg-blue-700 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-all duration-300"
          aria-label="Open sidebar"
        >
          <span className="text-lg">☰</span>
        </button>
      )}
    </>
  );
};

export default Sidebar;