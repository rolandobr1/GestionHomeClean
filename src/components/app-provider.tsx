
"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { db, isConfigured, firebaseConfig } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { FirebaseConfigStatus } from './config-status';

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
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  addMultipleIncomes: (incomes: Income[]) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  updateIncome: (income: Income) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  addMultipleExpenses: (expenses: Expense[]) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
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

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!db) return;
    const unsubscribers: (() => void)[] = [];

    const collectionsToSync: { name: string, setter: React.Dispatch<any> }[] = [
      { name: 'incomes', setter: setIncomes },
      { name: 'expenses', setter: setExpenses },
      { name: 'products', setter: setProducts },
      { name: 'clients', setter: setClients },
      { name: 'suppliers', setter: setSuppliers },
      { name: 'rawMaterials', setter: setRawMaterials },
    ];

    collectionsToSync.forEach(({ name, setter }) => {
      const q = collection(db, name);
      const unsubscribe = onSnapshot(q,
        (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setter(data);
        },
        (error) => {
          console.error(`Error al escuchar la colección ${name}:`, error);
          if (error.code === 'permission-denied') {
            console.error("FIREBASE: ¡Permiso denegado! Revisa las reglas de seguridad de Firestore.");
          }
        }
      );
      unsubscribers.push(unsubscribe);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);


  const updateInvoiceSettings = (settings: Partial<InvoiceSettings>) => {
    setInvoiceSettings(prev => ({ ...prev, ...settings }));
  };
  
  // --- Income Management with Firestore ---
  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!db) return;
    const batch = writeBatch(db);
    
    // Create new income document
    const incomeRef = doc(collection(db, "incomes"));
    batch.set(incomeRef, income);

    // Update product stock
    const quantitySoldMap = new Map<string, number>();
    income.products.forEach(soldProduct => {
        quantitySoldMap.set(soldProduct.productId, (quantitySoldMap.get(soldProduct.productId) || 0) + soldProduct.quantity);
    });
    
    products.forEach(product => {
      if (quantitySoldMap.has(product.id)) {
        const quantitySold = quantitySoldMap.get(product.id)!;
        const productRef = doc(db, "products", product.id);
        batch.update(productRef, { stock: product.stock - quantitySold });
      }
    });

    await batch.commit();
  };

  const addMultipleIncomes = async (incomesToUpsert: Income[]) => {
      if (!db) return;
      const stockChanges = new Map<string, number>();
      const existingIncomesMap = new Map(incomes.map(i => [i.id, i]));
      const batch = writeBatch(db);

      incomesToUpsert.forEach(income => {
          const originalIncome = income.id ? existingIncomesMap.get(income.id) : undefined;
          
          if (originalIncome) { 
              // UPDATE: add back original stock
              originalIncome.products.forEach(p => {
                  stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) + p.quantity);
              });
          }
          // ADD/UPDATE: subtract new stock
          income.products.forEach(p => {
              stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) - p.quantity);
          });
          
          // Add or update income doc in batch
          const {id, ...incomeData} = income;
          const docRef = id ? doc(db, 'incomes', id) : doc(collection(db, 'incomes'));
          batch.set(docRef, incomeData);
      });
      
      // Add stock updates to batch
      products.forEach(product => {
          if (stockChanges.has(product.id)) {
              const productRef = doc(db, "products", product.id);
              const currentStock = products.find(p => p.id === product.id)?.stock || 0;
              batch.update(productRef, { stock: currentStock + stockChanges.get(product.id)! });
          }
      });
      await batch.commit();
  };

  const updateIncome = async (updatedIncome: Income) => {
      if (!db) return;
      const originalIncome = incomes.find(i => i.id === updatedIncome.id);
      
      const batch = writeBatch(db);
      
      // Update income doc
      const {id, ...incomeData} = updatedIncome;
      const incomeRef = doc(db, 'incomes', id);
      batch.update(incomeRef, incomeData);

      // Update stock if original income is found
      if (originalIncome) {
          const stockChanges = new Map<string, number>();
          // + for original items, - for updated items
          originalIncome.products.forEach(p => {
              stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) + p.quantity);
          });
          updatedIncome.products.forEach(p => {
              stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) - p.quantity);
          });
          
          products.forEach(product => {
              if (stockChanges.has(product.id)) {
                  const productRef = doc(db, "products", product.id);
                  const currentStock = products.find(p => p.id === product.id)?.stock || 0;
                  batch.update(productRef, { stock: currentStock + stockChanges.get(product.id)! });
              }
          });
      }
      
      await batch.commit();
  };

  const deleteIncome = async (id: string) => {
    if (!db) return;
    const incomeToDelete = incomes.find(i => i.id === id);
    const batch = writeBatch(db);

    // Delete income doc
    const incomeRef = doc(db, 'incomes', id);
    batch.delete(incomeRef);

    // Return stock
    if (incomeToDelete) {
        const stockToReturn = new Map<string, number>();
        incomeToDelete.products.forEach(p => {
            stockToReturn.set(p.productId, (stockToReturn.get(p.productId) || 0) + p.quantity);
        });

        products.forEach(product => {
            if (stockToReturn.has(product.id)) {
                const productRef = doc(db, "products", product.id);
                const currentStock = products.find(p => p.id === product.id)?.stock || 0;
                batch.update(productRef, { stock: currentStock + stockToReturn.get(product.id)! });
            }
        });
    }

    await batch.commit();
  };

  // --- Expense Management with Firestore ---
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if(db) await addDoc(collection(db, 'expenses'), expense);
  };

  const addMultipleExpenses = async (expensesToUpsert: Expense[]) => {
      if (!db) return;
      const batch = writeBatch(db);
      expensesToUpsert.forEach(expense => {
          const { id, ...expenseData } = expense;
          const docRef = id ? doc(db, 'expenses', id) : doc(collection(db, 'expenses'));
          batch.set(docRef, expenseData);
      });
      await batch.commit();
  }

  const updateExpense = async (updatedExpense: Expense) => {
    if(db) {
        const { id, ...expenseData } = updatedExpense;
        await updateDoc(doc(db, 'expenses', id), expenseData);
    }
  };

  const deleteExpense = async (id: string) => {
    if(db) await deleteDoc(doc(db, 'expenses', id));
  };

  // --- Product Management with Firestore ---
  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (db) await addDoc(collection(db, 'products'), product);
  }

  const addMultipleProducts = async (productsToUpsert: Product[]) => {
    if (!db) return;
    const batch = writeBatch(db);
    productsToUpsert.forEach(product => {
      const { id, ...productData } = product;
      const docRef = id ? doc(db, 'products', id) : doc(collection(db, 'products'));
      batch.set(docRef, productData);
    });
    await batch.commit();
  }

  const updateProduct = async (updatedProduct: Product) => {
    if (!db) return;
    const { id, ...productData } = updatedProduct;
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, productData);
  }

  const deleteProduct = async (id: string) => {
    if (db) await deleteDoc(doc(db, 'products', id));
  }

  // --- Raw Material Management with Firestore ---
  const addRawMaterial = async (material: Omit<RawMaterial, 'id'>) => {
    if (db) await addDoc(collection(db, 'rawMaterials'), material);
  };

  const addMultipleRawMaterials = async (materialsToUpsert: RawMaterial[]) => {
    if (!db) return;
    const batch = writeBatch(db);
    materialsToUpsert.forEach(material => {
        const { id, ...materialData } = material;
        const docRef = id ? doc(db, 'rawMaterials', id) : doc(collection(db, 'rawMaterials'));
        batch.set(docRef, materialData);
    });
    await batch.commit();
  };

  const updateRawMaterial = async (updatedMaterial: RawMaterial) => {
    if (!db) return;
    const { id, ...materialData } = updatedMaterial;
    const materialRef = doc(db, 'rawMaterials', id);
    await updateDoc(materialRef, materialData);
  };

  const deleteRawMaterial = async (id: string) => {
    if (db) await deleteDoc(doc(db, 'rawMaterials', id));
  };

  // --- Client Management with Firestore ---
  const addClient = async (client: Omit<Client, 'id'>) => {
    if (db) await addDoc(collection(db, 'clients'), client);
  };

  const addMultipleClients = async (clientsToUpsert: Client[]) => {
    if (!db) return;
    const batch = writeBatch(db);
    clientsToUpsert.forEach(client => {
      const { id, ...clientData } = client;
      const docRef = id ? doc(db, 'clients', id) : doc(collection(db, 'clients'));
      batch.set(docRef, clientData);
    });
    await batch.commit();
  };

  const updateClient = async (updatedClient: Client) => {
    if (!db) return;
    const { id, ...clientData } = updatedClient;
    const clientRef = doc(db, 'clients', id);
    await updateDoc(clientRef, clientData);
  };

  const deleteClient = async (id: string) => {
    if (db) await deleteDoc(doc(db, 'clients', id));
  };

  // --- Supplier Management with Firestore ---
  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (db) await addDoc(collection(db, 'suppliers'), supplier);
  };

  const addMultipleSuppliers = async (suppliersToUpsert: Supplier[]) => {
    if (!db) return;
    const batch = writeBatch(db);
    suppliersToUpsert.forEach(supplier => {
      const { id, ...supplierData } = supplier;
      const docRef = id ? doc(db, 'suppliers', id) : doc(collection(db, 'suppliers'));
      batch.set(docRef, supplierData);
    });
    await batch.commit();
  };

  const updateSupplier = async (updatedSupplier: Supplier) => {
    if (!db) return;
    const { id, ...supplierData } = updatedSupplier;
    const supplierRef = doc(db, 'suppliers', id);
    await updateDoc(supplierRef, supplierData);
  };

  const deleteSupplier = async (id: string) => {
    if (db) await deleteDoc(doc(db, 'suppliers', id));
  };

  if (!isConfigured) {
    return <FirebaseConfigStatus config={firebaseConfig} />;
  }

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
