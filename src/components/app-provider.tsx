
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
  addRawMaterial: (material: Omit<RawMaterial, 'id'>) => Promise<void>;
  addMultipleRawMaterials: (materials: RawMaterial[]) => Promise<void>;
  updateRawMaterial: (material: RawMaterial) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  addMultipleClients: (clients: Client[]) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  addMultipleSuppliers: (suppliers: Supplier[]) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
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

  // Fetch Clients from Firestore
  useEffect(() => {
    if (db) {
      const unsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
        setClients(clientsData);
      });
      return () => unsubscribe();
    }
  }, []);

  // Fetch Suppliers from Firestore
  useEffect(() => {
    if (db) {
      const unsubscribe = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
        const suppliersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
        setSuppliers(suppliersData);
      });
      return () => unsubscribe();
    }
  }, []);
  
  // Fetch Raw Materials from Firestore
  useEffect(() => {
    if (db) {
      const unsubscribe = onSnapshot(collection(db, 'rawMaterials'), (snapshot) => {
        const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RawMaterial[];
        setRawMaterials(materialsData);
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

  // --- Raw Material Management with Firestore ---
  const addRawMaterial = async (material: Omit<RawMaterial, 'id'>) => {
    if (db) {
      await addDoc(collection(db, 'rawMaterials'), material);
    }
  };

  const addMultipleRawMaterials = async (materialsToUpsert: RawMaterial[]) => {
    if (db) {
        const batch = writeBatch(db);
        materialsToUpsert.forEach(material => {
            const { id, ...materialData } = material;
            let docRef;
            if (id) {
                docRef = doc(db, 'rawMaterials', id);
            } else {
                docRef = doc(collection(db, 'rawMaterials'));
            }
            batch.set(docRef, materialData);
        });
        await batch.commit();
    }
  };

  const updateRawMaterial = async (updatedMaterial: RawMaterial) => {
    if (db) {
      const { id, ...materialData } = updatedMaterial;
      const materialRef = doc(db, 'rawMaterials', id);
      await updateDoc(materialRef, materialData);
    }
  };

  const deleteRawMaterial = async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, 'rawMaterials', id));
    }
  };

  // --- Client Management with Firestore ---
  const addClient = async (client: Omit<Client, 'id'>) => {
    if (db) {
      await addDoc(collection(db, 'clients'), client);
    }
  };

  const addMultipleClients = async (clientsToUpsert: Client[]) => {
    if (db) {
      const batch = writeBatch(db);
      clientsToUpsert.forEach(client => {
        const { id, ...clientData } = client;
        let docRef;
        if (id) {
          docRef = doc(db, 'clients', id);
        } else {
          docRef = doc(collection(db, 'clients'));
        }
        batch.set(docRef, clientData);
      });
      await batch.commit();
    }
  };

  const updateClient = async (updatedClient: Client) => {
    if (db) {
      const { id, ...clientData } = updatedClient;
      const clientRef = doc(db, 'clients', id);
      await updateDoc(clientRef, clientData);
    }
  };

  const deleteClient = async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, 'clients', id));
    }
  };

  // --- Supplier Management with Firestore ---
  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (db) {
      await addDoc(collection(db, 'suppliers'), supplier);
    }
  };

  const addMultipleSuppliers = async (suppliersToUpsert: Supplier[]) => {
    if (db) {
      const batch = writeBatch(db);
      suppliersToUpsert.forEach(supplier => {
        const { id, ...supplierData } = supplier;
        let docRef;
        if (id) {
          docRef = doc(db, 'suppliers', id);
        } else {
          docRef = doc(collection(db, 'suppliers'));
        }
        batch.set(docRef, supplierData);
      });
      await batch.commit();
    }
  };

  const updateSupplier = async (updatedSupplier: Supplier) => {
    if (db) {
      const { id, ...supplierData } = updatedSupplier;
      const supplierRef = doc(db, 'suppliers', id);
      await updateDoc(supplierRef, supplierData);
    }
  };

  const deleteSupplier = async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, 'suppliers', id));
    }
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
