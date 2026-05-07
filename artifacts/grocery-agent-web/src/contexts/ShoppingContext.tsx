import { createContext, useContext, useState, ReactNode } from "react";
import type { Ingredient } from "@shared/schema";

interface ShoppingListItem {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  acquired: boolean;
}

interface CurrentRecipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
}

interface ShoppingContextType {
  shoppingList: ShoppingListItem[];
  setShoppingList: (items: ShoppingListItem[]) => void;
  toggleItemAcquired: (itemId: string) => void;
  clearShoppingList: () => void;
  currentRecipe: CurrentRecipe | null;
  setCurrentRecipe: (recipe: CurrentRecipe | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<CurrentRecipe | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

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
    <ShoppingContext.Provider value={{ 
      shoppingList, 
      setShoppingList, 
      toggleItemAcquired, 
      clearShoppingList,
      currentRecipe,
      setCurrentRecipe,
      currentStep,
      setCurrentStep
    }}>
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
