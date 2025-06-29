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
  recordedBy: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  recordedBy: string;
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

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export const initialProducts: Product[] = [
  { id: '1', name: 'Jabon de Cuaba', sku: 'JC-001', unit: 'Galon', salePriceRetail: 200, salePriceWholesale: 150, stock: 50, reorderLevel: 10 },
  { id: '2', name: 'Jabon Lavaplatos', sku: 'JL-001', unit: 'Galon', salePriceRetail: 200, salePriceWholesale: 150, stock: 50, reorderLevel: 10 },
  { id: '3', name: 'Desinfectante Lavanda', sku: 'DL-001', unit: 'Galon', salePriceRetail: 200, salePriceWholesale: 150, stock: 50, reorderLevel: 10 },
];


// Context interface
interface AppContextType {
  incomes: Income[];
  expenses: Expense[];
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  addMultipleIncomes: (incomes: Income[]) => void;
  deleteIncome: (id: string) => void;
  updateIncome: (income: Income) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addMultipleExpenses: (expenses: Expense[]) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addMultipleProducts: (products: Product[]) => void;
  deleteProduct: (id: string) => void;
  updateProduct: (product: Product) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  addMultipleClients: (clients: Client[]) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  addMultipleSuppliers: (suppliers: Supplier[]) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
}

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const addIncome = (income: Omit<Income, 'id'>) => {
    // Update product stock
    setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        income.products.forEach(soldProduct => {
            const productIndex = newProducts.findIndex(p => p.id === soldProduct.productId);
            if (productIndex !== -1) {
                newProducts[productIndex].stock -= soldProduct.quantity;
            }
        });
        return newProducts;
    });

    setIncomes(prev => [...prev, { ...income, id: new Date().toISOString() + Math.random() }]);
  };

  const addMultipleIncomes = (incomesToUpsert: Income[]) => {
      const stockChanges = new Map<string, number>();

      incomesToUpsert.forEach(income => {
          const originalIncome = incomes.find(i => i.id && i.id === income.id);

          if (originalIncome) { // This is an UPDATE
              // Add back original stock
              originalIncome.products.forEach(p => {
                  stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) + p.quantity);
              });
              // Subtract new stock
              income.products.forEach(p => {
                  stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) - p.quantity);
              });
          } else { // This is a NEW income
              // Subtract new stock
              income.products.forEach(p => {
                  stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) - p.quantity);
              });
          }
      });
      
      setProducts(prevProducts => {
          const newProducts = [...prevProducts];
          stockChanges.forEach((change, productId) => {
              const productIndex = newProducts.findIndex(p => p.id === productId);
              if (productIndex !== -1) {
                  newProducts[productIndex].stock += change;
              }
          });
          return newProducts;
      });

      setIncomes(prevIncomes => {
        const incomeMap = new Map(prevIncomes.map(i => [i.id, i]));
        incomesToUpsert.forEach(income => {
          const id = income.id || (new Date().toISOString() + Math.random());
          incomeMap.set(id, { ...income, id });
        });
        return Array.from(incomeMap.values());
      });
  };

  const updateIncome = (updatedIncome: Income) => {
      const originalIncome = incomes.find(i => i.id === updatedIncome.id);

      if (originalIncome) {
          setProducts(prevProducts => {
              const newProducts = [...prevProducts];

              // 1. Return stock from original sale
              originalIncome.products.forEach(soldProduct => {
                  const productIndex = newProducts.findIndex(p => p.id === soldProduct.productId);
                  if (productIndex !== -1) {
                      newProducts[productIndex].stock += soldProduct.quantity;
                  }
              });

              // 2. Deduct stock for new sale
              updatedIncome.products.forEach(soldProduct => {
                  const productIndex = newProducts.findIndex(p => p.id === soldProduct.productId);
                  if (productIndex !== -1) {
                      newProducts[productIndex].stock -= soldProduct.quantity;
                  }
              });
              
              return newProducts;
          });
      }
      
      setIncomes(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
  };

  const deleteIncome = (id: string) => {
    const incomeToDelete = incomes.find(i => i.id === id);

    if (incomeToDelete) {
        setProducts(prevProducts => {
            const newProducts = [...prevProducts];
            incomeToDelete.products.forEach(soldProduct => {
                const productIndex = newProducts.findIndex(p => p.id === soldProduct.productId);
                if (productIndex !== -1) {
                    newProducts[productIndex].stock += soldProduct.quantity;
                }
            });
            return newProducts;
        });
    }

    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: new Date().toISOString() + Math.random() }]);
  };

  const addMultipleExpenses = (expensesToUpsert: Expense[]) => {
      setExpenses(prevExpenses => {
        const expenseMap = new Map(prevExpenses.map(e => [e.id, e]));
        expensesToUpsert.forEach(expense => {
            const id = expense.id || (new Date().toISOString() + Math.random());
            expenseMap.set(id, { ...expense, id });
        });
        return Array.from(expenseMap.values());
      });
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

  const addMultipleProducts = (productsToUpsert: Product[]) => {
    setProducts(prevProducts => {
      const productMap = new Map(prevProducts.map(p => [p.id, p]));
      productsToUpsert.forEach(product => {
        const id = product.id || (new Date().toISOString() + Math.random());
        productMap.set(id, { ...product, id });
      });
      return Array.from(productMap.values());
    });
  }

  const updateProduct = (updatedProduct: Product) => {
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }

  const deleteProduct = (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
  }

  const addClient = (client: Omit<Client, 'id'>) => {
    setClients(prev => [...prev, { ...client, id: new Date().toISOString() + Math.random() }]);
  };

  const addMultipleClients = (clientsToUpsert: Client[]) => {
    setClients(prevClients => {
      const clientMap = new Map(prevClients.map(c => [c.id, c]));
      clientsToUpsert.forEach(client => {
        const id = client.id || (new Date().toISOString() + Math.random());
        clientMap.set(id, { ...client, id });
      });
      return Array.from(clientMap.values());
    });
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    setSuppliers(prev => [...prev, { ...supplier, id: new Date().toISOString() + Math.random() }]);
  };

  const addMultipleSuppliers = (suppliersToUpsert: Supplier[]) => {
      setSuppliers(prevSuppliers => {
        const supplierMap = new Map(prevSuppliers.map(s => [s.id, s]));
        suppliersToUpsert.forEach(supplier => {
            const id = supplier.id || (new Date().toISOString() + Math.random());
            supplierMap.set(id, { ...supplier, id });
        });
        return Array.from(supplierMap.values());
      });
  };

  const updateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };


  return (
    <AppContext.Provider value={{
        incomes, expenses, products, clients, suppliers,
        addIncome, addMultipleIncomes, deleteIncome, updateIncome,
        addExpense, addMultipleExpenses, deleteExpense, updateExpense,
        addProduct, addMultipleProducts, deleteProduct, updateProduct,
        addClient, addMultipleClients, updateClient, deleteClient,
        addSupplier, addMultipleSuppliers, updateSupplier, deleteSupplier
    }}>
      {children}
    </AppContext.Provider>
  );
};
