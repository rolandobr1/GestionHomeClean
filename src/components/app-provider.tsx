
"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';

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
  supplierId: string;
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

export type RawMaterial = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  purchasePrice: number;
  stock: number;
  reorderLevel: number;
  supplierId: string;
  recordedBy: string;
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

export type InvoiceSettings = {
  companyName: string;
  companyAddress: string;
  companyRNC: string;
  companyLogo: string;
  shareMessage: string;
};

// Context interface
interface AppContextType {
  incomes: Income[];
  expenses: Expense[];
  products: Product[];
  rawMaterials: RawMaterial[];
  clients: Client[];
  suppliers: Supplier[];
  invoiceSettings: InvoiceSettings;
  addIncome: (income: Omit<Income, 'id'>) => void;
  addMultipleIncomes: (incomes: Income[]) => void;
  deleteIncome: (id: string) => void;
  updateIncome: (income: Income) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addMultipleExpenses: (expenses: Expense[]) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  addMultipleProducts: (products: Product[]) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addRawMaterial: (material: Omit<RawMaterial, 'id'>) => void;
  addMultipleRawMaterials: (materials: RawMaterial[]) => void;
  updateRawMaterial: (material: RawMaterial) => void;
  deleteRawMaterial: (id: string) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  addMultipleClients: (clients: Client[]) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  addMultipleSuppliers: (suppliers: Supplier[]) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  updateInvoiceSettings: (settings: Partial<InvoiceSettings>) => void;
}

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    companyName: "QuimioGest S.R.L.",
    companyAddress: "Calle Ficticia 123, Santo Domingo",
    companyRNC: "1-2345678-9",
    companyLogo: "/logohomeclean.png",
    shareMessage: "Aquí está tu factura de QuimioGest.",
  });

  // Fetch Products from Firestore
  useEffect(() => {
    if (db) {
      const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(productsData);
      });
      return () => unsubscribe();
    }
  }, []);


  const updateInvoiceSettings = (settings: Partial<InvoiceSettings>) => {
    setInvoiceSettings(prev => ({ ...prev, ...settings }));
  };

  const addIncome = (income: Omit<Income, 'id'>) => {
    const quantitySoldMap = new Map<string, number>();
    income.products.forEach(soldProduct => {
        quantitySoldMap.set(soldProduct.productId, (quantitySoldMap.get(soldProduct.productId) || 0) + soldProduct.quantity);
    });
    
    if (db) {
      const batch = writeBatch(db);
      products.forEach(product => {
        if (quantitySoldMap.has(product.id)) {
          const quantitySold = quantitySoldMap.get(product.id)!;
          const productRef = doc(db, "products", product.id);
          batch.update(productRef, { stock: product.stock - quantitySold });
        }
      });
      batch.commit();
    }

    setIncomes(prev => [...prev, { ...income, id: new Date().toISOString() + Math.random() }]);
  };

  const addMultipleIncomes = (incomesToUpsert: Income[]) => {
      const stockChanges = new Map<string, number>();
      const existingIncomesMap = new Map(incomes.map(i => [i.id, i]));

      incomesToUpsert.forEach(income => {
          const originalIncome = income.id ? existingIncomesMap.get(income.id) : undefined;
          
          if (originalIncome) { // This is an UPDATE, so add back original stock
              originalIncome.products.forEach(p => {
                  stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) + p.quantity);
              });
          }
          // Subtract new/updated stock
          income.products.forEach(p => {
              stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) - p.quantity);
          });
      });
      
      if (db) {
        const batch = writeBatch(db);
        products.forEach(product => {
            if (stockChanges.has(product.id)) {
                const productRef = doc(db, "products", product.id);
                batch.update(productRef, { stock: product.stock + stockChanges.get(product.id)! });
            }
        });
        batch.commit();
      }

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

      if (originalIncome && db) {
          const stockChanges = new Map<string, number>();
          // + for original items, - for updated items
          originalIncome.products.forEach(p => {
              stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) + p.quantity);
          });
          updatedIncome.products.forEach(p => {
              stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) - p.quantity);
          });
          
          const batch = writeBatch(db);
          products.forEach(product => {
              if (stockChanges.has(product.id)) {
                  const productRef = doc(db, "products", product.id);
                  batch.update(productRef, { stock: product.stock + stockChanges.get(product.id)! });
              }
          });
          batch.commit();
      }
      
      setIncomes(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
  };

  const deleteIncome = (id: string) => {
    const incomeToDelete = incomes.find(i => i.id === id);

    if (incomeToDelete && db) {
        const stockToReturn = new Map<string, number>();
        incomeToDelete.products.forEach(p => {
            stockToReturn.set(p.productId, (stockToReturn.get(p.productId) || 0) + p.quantity);
        });

        const batch = writeBatch(db);
        products.forEach(product => {
            if (stockToReturn.has(product.id)) {
                const productRef = doc(db, "products", product.id);
                batch.update(productRef, { stock: product.stock + stockToReturn.get(product.id)! });
            }
        });
        batch.commit();
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

  // --- Product Management with Firestore ---
  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (db) {
      await addDoc(collection(db, 'products'), product);
    }
  }

  const addMultipleProducts = async (productsToUpsert: Product[]) => {
    if (db) {
      const batch = writeBatch(db);
      productsToUpsert.forEach(product => {
        const { id, ...productData } = product;
        let docRef;
        if (id) {
          docRef = doc(db, 'products', id);
          batch.set(docRef, productData);
        } else {
          docRef = doc(collection(db, 'products'));
          batch.set(docRef, productData);
        }
      });
      await batch.commit();
    }
  }

  const updateProduct = async (updatedProduct: Product) => {
    if (db) {
      const { id, ...productData } = updatedProduct;
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, productData);
    }
  }

  const deleteProduct = async (id: string) => {
    if (db) {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
    }
  }

  const addRawMaterial = (material: Omit<RawMaterial, 'id'>) => {
    setRawMaterials(prev => [...prev, { ...material, id: new Date().toISOString() + Math.random() }]);
  };

  const addMultipleRawMaterials = (materialsToUpsert: RawMaterial[]) => {
      setRawMaterials(prevMaterials => {
        const materialMap = new Map(prevMaterials.map(m => [m.id, m]));
        materialsToUpsert.forEach(material => {
            const id = material.id || (new Date().toISOString() + Math.random());
            materialMap.set(id, { ...material, id });
        });
        return Array.from(materialMap.values());
      });
  };

  const updateRawMaterial = (updatedMaterial: RawMaterial) => {
      setRawMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  };

  const deleteRawMaterial = (id: string) => {
      setRawMaterials(prev => prev.filter(m => m.id !== id));
  };

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
        incomes, expenses, products, rawMaterials, clients, suppliers, invoiceSettings,
        addIncome, addMultipleIncomes, deleteIncome, updateIncome,
        addExpense, addMultipleExpenses, deleteExpense, updateExpense,
        addProduct, addMultipleProducts, deleteProduct, updateProduct,
        addRawMaterial, addMultipleRawMaterials, updateRawMaterial, deleteRawMaterial,
        addClient, addMultipleClients, updateClient, deleteClient,
        addSupplier, addMultipleSuppliers, updateSupplier, deleteSupplier,
        updateInvoiceSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};
