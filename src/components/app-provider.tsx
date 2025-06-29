"use client";

import React, { createContext, useState, ReactNode } from 'react';

// Type definitions
export type SoldProduct = {
  productId: string;
  quantity: number;
  price: number;
  name: string;
};

export type Income = {
  id: string;
  totalAmount: number;
  date: string;
  category: string;
  clientId: string;
  paymentMethod: 'credito' | 'contado';
  products: SoldProduct[];
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  salePriceRetail: number;
  salePriceWholesale: number;
  stock: number;
  reorderLevel: number;
};

export const initialProducts: Product[] = [
  { id: '1', name: 'Ácido Clorhídrico', sku: 'AC-001', unit: 'Litros', salePriceRetail: 10.0, salePriceWholesale: 8.5, stock: 150, reorderLevel: 20 },
  { id: '2', name: 'Hipoclorito de Sodio', sku: 'HS-002', unit: 'Galones', salePriceRetail: 25.0, salePriceWholesale: 22.0, stock: 80, reorderLevel: 15 },
  { id: '3', name: 'Sosa Cáustica (Escamas)', sku: 'SC-001', unit: 'Kg', salePriceRetail: 15.5, salePriceWholesale: 13.0, stock: 200, reorderLevel: 50 },
  { id: '4', name: 'Peróxido de Hidrógeno', sku: 'PH-001', unit: 'Litros', salePriceRetail: 14.0, salePriceWholesale: 12.0, stock: 45, reorderLevel: 30 },
];


// Context interface
interface AppContextType {
  incomes: Income[];
  expenses: Expense[];
  products: Product[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  deleteIncome: (id: string) => void;
  updateIncome: (income: Income) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addMultipleExpenses: (expenses: Omit<Expense, 'id'>[]) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addMultipleProducts: (products: Product[]) => void;
  deleteProduct: (id: string) => void;
  updateProduct: (product: Product) => void;
}

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const addIncome = (income: Omit<Income, 'id'>) => {
    setIncomes(prev => [...prev, { ...income, id: new Date().toISOString() + Math.random() }]);
  };

  const updateIncome = (updatedIncome: Income) => {
    setIncomes(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: new Date().toISOString() + Math.random() }]);
  };

  const addMultipleExpenses = (newExpenses: Omit<Expense, 'id'>[]) => {
      const expensesWithId = newExpenses.map(e => ({ ...e, id: e.id || new Date().toISOString() + Math.random() }));
      setExpenses(prev => [...prev, ...expensesWithId]);
  }

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
      setProducts(prev => [...prev, { ...product, id: new Date().toISOString() + Math.random() }]);
  }

  const addMultipleProducts = (newProducts: Product[]) => {
      const productsWithId = newProducts.map(p => ({ ...p, id: p.id || new Date().toISOString() + Math.random() }));
      const existingIds = new Set(products.map(p => p.id));
      const uniqueNewProducts = productsWithId.filter(p => !existingIds.has(p.id));
      setProducts(prev => [...prev, ...uniqueNewProducts]);
  }

  const updateProduct = (updatedProduct: Product) => {
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }

  const deleteProduct = (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
  }


  return (
    <AppContext.Provider value={{
        incomes, expenses, products,
        addIncome, deleteIncome, updateIncome,
        addExpense, addMultipleExpenses, deleteExpense, updateExpense,
        addProduct, addMultipleProducts, deleteProduct, updateProduct
    }}>
      {children}
    </AppContext.Provider>
  );
};
