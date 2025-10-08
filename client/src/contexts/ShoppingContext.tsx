import { createContext, useContext, useState, ReactNode } from "react";

interface ShoppingListItem {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  acquired: boolean;
}

interface ShoppingContextType {
  shoppingList: ShoppingListItem[];
  setShoppingList: (items: ShoppingListItem[]) => void;
  toggleItemAcquired: (itemId: string) => void;
  clearShoppingList: () => void;
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);

  const toggleItemAcquired = (itemId: string) => {
    setShoppingList(items => 
      items.map(item => 
        item.id === itemId ? { ...item, acquired: !item.acquired } : item
      )
    );
  };

  const clearShoppingList = () => {
    setShoppingList([]);
  };

  return (
    <ShoppingContext.Provider value={{ shoppingList, setShoppingList, toggleItemAcquired, clearShoppingList }}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  const context = useContext(ShoppingContext);
  if (context === undefined) {
    throw new Error("useShopping must be used within a ShoppingProvider");
  }
  return context;
}

export type { ShoppingListItem };
