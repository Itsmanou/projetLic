"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "react-toastify";

// Type for cart item
export interface CartItem {
  id: string;  // Changed to string for MongoDB _id
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

// Type for product when adding to cart
type ProductToAdd = Omit<CartItem, "quantity">;

// Context type
interface PanierContextType {
  cart: CartItem[];
  addToCart: (product: ProductToAdd) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  // Keep the original French method names for backward compatibility
  panier: CartItem[];
  ajouterAuPanier: (produit: ProductToAdd) => void;
  supprimerDuPanier: (id: string) => void;
  changerQuantite: (id: string, quantite: number) => void;
  viderPanier: () => void;
  // Loading state for hydration
  isLoading: boolean;
}

// Create context
const PanierContext = createContext<PanierContextType | undefined>(undefined);

// Custom hook
export const usePanier = () => {
  const context = useContext(PanierContext);
  if (!context) throw new Error("usePanier must be used within PanierProvider");
  return context;
};

// Provider
export const PanierProvider = ({ children }: { children: ReactNode }) => {
  console.log('PanierProvider mounted');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // Handle hydration and load cart from localStorage
  useEffect(() => {
    setHasMounted(true);
    
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('pharmashop_cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          // Validate that it's an array and has proper structure
          if (Array.isArray(parsedCart)) {
            setCart(parsedCart);
          }
        }
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
        // Clear corrupted data
        localStorage.removeItem('pharmashop_cart');
      }
    }
    
    setIsLoading(false);
  }, []);
  
  // Save cart to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (hasMounted && !isLoading && typeof window !== 'undefined') {
      try {
        localStorage.setItem('pharmashop_cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    }
  }, [cart, hasMounted, isLoading]);

  const addToCart = (product: ProductToAdd) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      let newCart: CartItem[];

      if (existing) {
        newCart = prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        newCart = [...prev, { ...product, quantity: 1 }];
      }

      // Use setTimeout to avoid React state update during render
      setTimeout(() => {
        toast.success(` ${product.name} ajouté au panier!`, {
          position: "top-right",
          autoClose: 2000,
        });
      }, 0);

      return newCart;
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const item = prev.find(p => p.id === id);
      const newCart = prev.filter((p) => p.id !== id);
      
      if (item) {
        setTimeout(() => {
          toast.info(`${item.name} retiré du panier.`, {
            position: "top-right",
            autoClose: 2000,
          });
        }, 0);
      }
      
      return newCart;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCart((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity } : p))
    );
  };

  const clearCart = () => {
    setCart([]);
    setTimeout(() => {
      toast.info("Panier vidé.", {
        position: "top-right",
        autoClose: 2000,
      });
    }, 0);
  };

  return (
    <PanierContext.Provider
      value={{ 
        // English method names
        cart, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart,
        // French method names for backward compatibility
        panier: cart, 
        ajouterAuPanier: addToCart, 
        supprimerDuPanier: removeFromCart, 
        changerQuantite: updateQuantity, 
        viderPanier: clearCart,
        // Loading state
        isLoading
      }}
    >
      {children}
    </PanierContext.Provider>
  );
};

export default PanierContext;