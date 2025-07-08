
"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { db, isConfigured, firebaseConfig } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, increment, setDoc, arrayUnion, getDocs } from 'firebase/firestore';
import { FirebaseConfigStatus } from './config-status';

// Type definitions
export type SoldProduct = {
  productId: string;
  quantity: number;
  price: number;
  name: string;
};

export type Payment = {
  id: string;
  date: string;
  amount: number;
  recordedBy: string;
  createdAt?: any;
};

export type Income = {
  id: string;
  totalAmount: number;
  balance: number;
  date: string;
  createdAt: any;
  category: string;
  clientId: string;
  paymentMethod: 'credito' | 'contado';
  paymentType?: string;
  products: SoldProduct[];
  recordedBy: string;
  payments: Payment[];
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  balance: number;
  date: string;
  createdAt: any;
  category: string;
  supplierId: string;
  paymentMethod: 'credito' | 'contado';
  paymentType?: string;
  recordedBy: string;
  payments: Payment[];
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
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type Supplier = {
  id: string;
  code: string;
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
  paymentMethods: string[];
  priceLabels: {
    retail: string;
    wholesale: string;
  };
};

export type ExpenseCategorySettings = {
  categories: string[];
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
  expenseCategories: string[];
  loading: boolean;
  addIncome: (income: Omit<Income, 'id' | 'balance' | 'payments' | 'createdAt'>) => Promise<void>;
  addMultipleIncomes: (incomes: Income[], mode: 'append' | 'replace') => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  updateIncome: (income: Income) => Promise<void>;
  addPayment: (incomeId: string, payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'balance' | 'payments' | 'createdAt'>) => Promise<void>;
  addMultipleExpenses: (expenses: Omit<Expense, 'id' | 'balance' | 'payments' | 'createdAt'>[], mode: 'append' | 'replace') => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  addPaymentToExpense: (expenseId: string, payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  addMultipleProducts: (products: Product[], mode: 'append' | 'replace') => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addRawMaterial: (material: Omit<RawMaterial, 'id'>) => Promise<void>;
  addMultipleRawMaterials: (materials: RawMaterial[], mode: 'append' | 'replace') => Promise<void>;
  updateRawMaterial: (material: RawMaterial) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'code'>) => Promise<Client | undefined>;
  addMultipleClients: (clients: Omit<Client, 'id' | 'code'>[], mode: 'append' | 'replace') => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'code'>) => Promise<Supplier | undefined>;
  addMultipleSuppliers: (suppliers: Omit<Supplier, 'id' | 'code'>[], mode: 'append' | 'replace') => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  updateInvoiceSettings: (settings: InvoiceSettings) => Promise<void>;
  updateExpenseCategories: (categories: string[]) => Promise<void>;
}

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    companyName: "HOMECLEAN S.R.L.",
    companyAddress: "Calle Ficticia 123, Santo Domingo",
    companyRNC: "1-2345678-9",
    companyLogo: "/logohomeclean.png",
    shareMessage: "Aquí está tu factura de HOMECLEAN.",
    paymentMethods: ["Efectivo", "Transferencia", "Tarjeta"],
    priceLabels: { retail: "Detalle", wholesale: "Por Mayor" },
  });

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!db) {
        setLoading(false);
        return;
    }

    const unsubscribers: (() => void)[] = [];

    const collectionsToSync: { name: string, setter: React.Dispatch<any> }[] = [
        { name: 'products', setter: setProducts },
        { name: 'clients', setter: setClients },
        { name: 'suppliers', setter: setSuppliers },
        { name: 'rawMaterials', setter: setRawMaterials },
    ];

    const loadStatus: Record<string, boolean> = {
        incomes: false,
        expenses: false,
        products: false,
        clients: false,
        suppliers: false,
        rawMaterials: false,
        settings: false,
        expenseCategories: false,
    };
    
    const checkAllLoaded = () => {
        if (Object.values(loadStatus).every(Boolean)) {
            setLoading(false);
        }
    };

    unsubscribers.push(onSnapshot(collection(db, 'incomes'), (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => {
            const incomeData = { id: doc.id, ...doc.data() } as any;
            if (incomeData.payments === undefined) {
                incomeData.payments = [];
            }
            if (incomeData.balance === undefined) {
                const paymentsTotal = incomeData.payments.reduce((acc: number, p: Payment) => acc + p.amount, 0);
                if (incomeData.paymentMethod === 'contado') {
                    incomeData.balance = 0;
                } else {
                    incomeData.balance = incomeData.totalAmount - paymentsTotal;
                }
            }
            return incomeData;
        });
        setIncomes(data as Income[]);
        if (!loadStatus.incomes) {
            loadStatus.incomes = true;
            checkAllLoaded();
        }
    }, (error) => {
        console.error(`Error al escuchar la colección incomes:`, error);
        if (!loadStatus.incomes) {
            loadStatus.incomes = true;
            checkAllLoaded();
        }
    }));

     unsubscribers.push(onSnapshot(collection(db, 'expenses'), (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => {
            const expenseData = { id: doc.id, ...doc.data() } as any;
            if (expenseData.payments === undefined) {
                expenseData.payments = [];
            }
            if (expenseData.balance === undefined) {
                const paymentsTotal = expenseData.payments.reduce((acc: number, p: Payment) => acc + p.amount, 0);
                if (expenseData.paymentMethod === 'contado') {
                    expenseData.balance = 0;
                } else {
                    expenseData.balance = expenseData.amount - paymentsTotal;
                }
            }
            return expenseData;
        });
        setExpenses(data as Expense[]);
        if (!loadStatus.expenses) {
            loadStatus.expenses = true;
            checkAllLoaded();
        }
    }, (error) => {
        console.error(`Error al escuchar la colección expenses:`, error);
        if (!loadStatus.expenses) {
            loadStatus.expenses = true;
            checkAllLoaded();
        }
    }));

    const createUnsubscriber = (name: string, setter: React.Dispatch<any>) => {
        const q = collection(db, name);
        return onSnapshot(q,
            (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data);
                if (!loadStatus[name]) {
                    loadStatus[name] = true;
                    checkAllLoaded();
                }
            },
            (error) => {
                console.error(`Error al escuchar la colección ${name}:`, error);
                if (!loadStatus[name]) {
                    loadStatus[name] = true;
                    checkAllLoaded();
                }
            }
        );
    };

    collectionsToSync.forEach(({ name, setter }) => {
        unsubscribers.push(createUnsubscriber(name, setter));
    });

    const settingsDocRef = doc(db, 'settings', 'invoice');
    const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const remoteSettings = docSnap.data() as Partial<InvoiceSettings>;
            setInvoiceSettings(prev => ({ ...prev, ...remoteSettings }));
        }
        if (!loadStatus.settings) {
            loadStatus.settings = true;
            checkAllLoaded();
        }
    }, (error) => {
        console.error("Error al escuchar los ajustes:", error);
        if (!loadStatus.settings) {
            loadStatus.settings = true;
            checkAllLoaded();
        }
    });
    unsubscribers.push(unsubscribeSettings);

    const expenseCategoriesDocRef = doc(db, 'settings', 'expenseCategories');
    const unsubscribeCategories = onSnapshot(expenseCategoriesDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setExpenseCategories((docSnap.data() as ExpenseCategorySettings).categories);
        } else {
            const defaultCategories = ["Materia Prima", "Envases", "Etiquetas", "Transportación", "Maquinarias y Herramientas", "Otro"];
            setDoc(expenseCategoriesDocRef, { categories: defaultCategories });
            setExpenseCategories(defaultCategories);
        }
        if (!loadStatus.expenseCategories) {
            loadStatus.expenseCategories = true;
            checkAllLoaded();
        }
    }, (error) => {
        console.error("Error al escuchar las categorías de egresos:", error);
        if (!loadStatus.expenseCategories) {
            loadStatus.expenseCategories = true;
            checkAllLoaded();
        }
    });
    unsubscribers.push(unsubscribeCategories);

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);


  const updateInvoiceSettings = async (settings: InvoiceSettings) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const settingsDocRef = doc(db, 'settings', 'invoice');
        await setDoc(settingsDocRef, settings, { merge: true });
    } catch (error) {
        console.error("Error updating invoice settings:", error);
        throw new Error("No se pudieron guardar los ajustes de factura.");
    }
  };
  
  const updateExpenseCategories = async (categories: string[]) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const docRef = doc(db, 'settings', 'expenseCategories');
        await setDoc(docRef, { categories });
    } catch (error) {
        console.error("Error updating expense categories:", error);
        throw new Error("No se pudieron guardar las categorías de egresos.");
    }
  };

  // --- Income Management with Firestore ---
  const addIncome = async (income: Omit<Income, 'id' | 'balance' | 'payments' | 'createdAt'>) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
      const batch = writeBatch(db);
      
      const incomeRef = doc(collection(db, "incomes"));

      const { paymentType, ...restOfIncome } = income;
      const newIncomeData: any = { 
        ...restOfIncome, 
        payments: [], 
        balance: 0, 
        createdAt: new Date()
      };

      if (income.paymentMethod === 'contado') {
          newIncomeData.balance = 0;
          newIncomeData.paymentType = paymentType || (invoiceSettings.paymentMethods.length > 0 ? invoiceSettings.paymentMethods[0] : 'Efectivo');
          newIncomeData.payments.push({
              id: doc(collection(db, 'temp')).id,
              amount: income.totalAmount,
              date: income.date,
              recordedBy: income.recordedBy,
              createdAt: new Date(),
          });
      } else {
          newIncomeData.balance = income.totalAmount;
      }

      batch.set(incomeRef, newIncomeData);

      income.products.forEach(soldProduct => {
          if (!soldProduct.productId.startsWith('generic_')) {
              const productRef = doc(db, "products", soldProduct.productId);
              batch.update(productRef, { stock: increment(-soldProduct.quantity) });
          }
      });

      await batch.commit();
    } catch(error) {
        console.error("Error adding income:", error);
        throw new Error("No se pudo registrar el ingreso en la base de datos.");
    }
  };

  const addMultipleIncomes = async (incomesToProcess: Income[], mode: 'append' | 'replace' = 'append') => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const batch = writeBatch(db);
        const stockChanges = new Map<string, number>();
        const existingIncomesMap = new Map(incomes.map(i => [i.id, i]));

        if (mode === 'replace') {
            const allIncomesSnapshot = await getDocs(collection(db, "incomes"));
            for (const docSnap of allIncomesSnapshot.docs) {
                const oldIncome = { id: docSnap.id, ...docSnap.data() } as Income;
                if (oldIncome.products) {
                    oldIncome.products.forEach(p => {
                        if (!p.productId.startsWith('generic_')) {
                            stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) + p.quantity);
                        }
                    });
                }
                batch.delete(docSnap.ref);
            }
        }

        for (const income of incomesToProcess) {
            const { id, ...incomeData } = { ...income, createdAt: new Date() };

            if (mode === 'append' && id) {
                const originalIncome = existingIncomesMap.get(id);
                if (originalIncome) {
                    originalIncome.products.forEach(p => {
                        if (!p.productId.startsWith('generic_')) {
                            stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) + p.quantity);
                        }
                    });
                }
            }
            
            income.products.forEach(p => {
                if (!p.productId.startsWith('generic_')) {
                    stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) - p.quantity);
                }
            });

            const docRef = id && mode === 'append' ? doc(db, 'incomes', id) : doc(collection(db, 'incomes'));
            batch.set(docRef, incomeData);
        }
        
        for (const [productId, quantityChange] of stockChanges.entries()) {
            if (quantityChange !== 0) {
                const productRef = doc(db, "products", productId);
                batch.update(productRef, { stock: increment(quantityChange) });
            }
        }

        await batch.commit();
    } catch(error) {
        console.error("Error adding multiple incomes:", error);
        throw new Error("No se pudieron importar los ingresos.");
    }
  };

  const updateIncome = async (updatedIncome: Income) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const originalIncome = incomes.find(i => i.id === updatedIncome.id);
        if (!originalIncome) {
            throw new Error("No se encontró el ingreso original a actualizar.");
        }
        
        const batch = writeBatch(db);
        
        const dataToUpdate: any = { ...updatedIncome };

        if (originalIncome.paymentMethod === 'credito' && dataToUpdate.paymentMethod === 'contado') {
            dataToUpdate.payments = [{
                id: doc(collection(db, 'temp')).id,
                amount: dataToUpdate.totalAmount,
                date: dataToUpdate.date,
                recordedBy: dataToUpdate.recordedBy,
                createdAt: new Date(),
            }];
             if (!dataToUpdate.paymentType) {
                 dataToUpdate.paymentType = (invoiceSettings.paymentMethods && invoiceSettings.paymentMethods.length > 0 ? invoiceSettings.paymentMethods[0] : 'Efectivo');
            }
        } else if (originalIncome.paymentMethod === 'contado' && dataToUpdate.paymentMethod === 'credito') {
            dataToUpdate.payments = [];
            delete dataToUpdate.paymentType;
        }
        
        const paymentSum = dataToUpdate.payments.reduce((acc: number, p: Payment) => acc + p.amount, 0);
        dataToUpdate.balance = dataToUpdate.totalAmount - paymentSum;

        if (dataToUpdate.paymentMethod !== 'contado') {
            delete dataToUpdate.paymentType;
        }

        const { id, ...incomeData } = dataToUpdate;
        const incomeRef = doc(db, 'incomes', id);
        batch.update(incomeRef, incomeData);

        const stockChanges = new Map<string, number>();
        
        originalIncome.products.forEach(p => {
            if (!p.productId.startsWith('generic_')) {
              stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) + p.quantity);
            }
        });

        updatedIncome.products.forEach(p => {
            if (!p.productId.startsWith('generic_')) {
              stockChanges.set(p.productId, (stockChanges.get(p.productId) || 0) - p.quantity);
            }
        });
        
        for (const [productId, quantityChange] of stockChanges.entries()) {
            if (quantityChange !== 0) {
                const productRef = doc(db, "products", productId);
                batch.update(productRef, { stock: increment(quantityChange) });
            }
        }
        
        await batch.commit();
    } catch(error) {
        console.error("Error updating income:", error);
        throw new Error("No se pudo actualizar el ingreso.");
    }
  };

  const deleteIncome = async (id: string) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const incomeToDelete = incomes.find(i => i.id === id);
        if (!incomeToDelete) throw new Error("Ingreso no encontrado para eliminar.");
        
        const batch = writeBatch(db);
        const incomeRef = doc(db, 'incomes', id);
        batch.delete(incomeRef);

        incomeToDelete.products.forEach(p => {
            if (!p.productId.startsWith('generic_')) {
                const productRef = doc(db, "products", p.productId);
                batch.update(productRef, { stock: increment(p.quantity) });
            }
        });

        await batch.commit();
    } catch (error) {
        console.error("Error deleting income:", error);
        throw new Error("No se pudo eliminar el ingreso.");
    }
  };
  
  const addPayment = async (incomeId: string, payment: Omit<Payment, 'id' | 'createdAt'>) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const incomeRef = doc(db, 'incomes', incomeId);
        const newPayment = { ...payment, id: doc(collection(db, 'temp')).id, createdAt: new Date() };
        await updateDoc(incomeRef, {
            payments: arrayUnion(newPayment),
            balance: increment(-payment.amount)
        });
    } catch (error) {
        console.error("Error adding payment:", error);
        throw new Error("No se pudo registrar el pago.");
    }
  };

  // --- Expense Management with Firestore ---
    const addExpense = async (expense: Omit<Expense, 'id' | 'balance' | 'payments' | 'createdAt'>) => {
        if (!db) throw new Error("Firestore no está inicializado.");
        try {
            const { paymentType, ...restOfExpense } = expense;
            const dataToSave: any = {
                ...restOfExpense,
                payments: [],
                balance: 0,
                createdAt: new Date(),
            };

            if (expense.paymentMethod === 'contado') {
                dataToSave.balance = 0;
                dataToSave.paymentType = paymentType || (invoiceSettings.paymentMethods.length > 0 ? invoiceSettings.paymentMethods[0] : 'Efectivo');
                dataToSave.payments.push({
                    id: doc(collection(db, 'temp')).id,
                    amount: expense.amount,
                    date: expense.date,
                    recordedBy: expense.recordedBy,
                    createdAt: new Date(),
                });
            } else {
                dataToSave.balance = expense.amount;
            }
            
            await addDoc(collection(db, 'expenses'), dataToSave);
        } catch (error) {
            console.error("Error adding expense:", error);
            throw new Error("No se pudo registrar el egreso.");
        }
    };

  const addMultipleExpenses = async (expensesToProcess: Omit<Expense, 'id' | 'balance' | 'payments' | 'createdAt'>[], mode: 'append' | 'replace' = 'append') => {
      if (!db) throw new Error("Firestore no está inicializado.");
      try {
        const batch = writeBatch(db);
        if (mode === 'replace') {
          const existingDocsSnapshot = await getDocs(collection(db, 'expenses'));
          existingDocsSnapshot.forEach(doc => batch.delete(doc.ref));
        }
        expensesToProcess.forEach(expense => {
            const { paymentType, ...restOfExpense } = expense;
            const dataToSave: any = { 
                ...restOfExpense, 
                payments: [], 
                balance: 0,
                createdAt: new Date(),
            };

            if (expense.paymentMethod === 'contado') {
              dataToSave.balance = 0;
              dataToSave.paymentType = paymentType || (invoiceSettings.paymentMethods && invoiceSettings.paymentMethods.length > 0 ? invoiceSettings.paymentMethods[0] : 'Efectivo');
              dataToSave.payments.push({
                  id: doc(collection(db, 'temp')).id,
                  amount: expense.amount,
                  date: expense.date,
                  recordedBy: expense.recordedBy,
                  createdAt: new Date(),
              });
            } else {
              dataToSave.balance = expense.amount;
              delete dataToSave.paymentType;
            }
            const docRef = doc(collection(db, 'expenses'));
            batch.set(docRef, dataToSave);
        });
        await batch.commit();
      } catch (error) {
        console.error("Error adding multiple expenses:", error);
        throw new Error("No se pudieron importar los egresos.");
      }
  }

  const updateExpense = async (updatedExpense: Expense) => {
    if(!db) throw new Error("Firestore no está inicializado.");
    try {
        const dataToUpdate: any = { ...updatedExpense };
        
        const paymentSum = dataToUpdate.payments.reduce((acc: number, p: Payment) => acc + p.amount, 0);
        dataToUpdate.balance = dataToUpdate.amount - paymentSum;

        if (dataToUpdate.paymentMethod !== 'contado') {
            delete dataToUpdate.paymentType;
        } else if (!dataToUpdate.paymentType) {
            dataToUpdate.paymentType = (invoiceSettings.paymentMethods && invoiceSettings.paymentMethods.length > 0 ? invoiceSettings.paymentMethods[0] : 'Efectivo');
        }
        
        const { id, ...finalExpenseData } = dataToUpdate;
        await updateDoc(doc(db, 'expenses', id), finalExpenseData);
    } catch(error) {
        console.error("Error updating expense:", error);
        throw new Error("No se pudo actualizar el egreso.");
    }
  };

  const deleteExpense = async (id: string) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
        console.error("Error deleting expense:", error);
        throw new Error("No se pudo eliminar el egreso.");
    }
  };
  
  const addPaymentToExpense = async (expenseId: string, payment: Omit<Payment, 'id' | 'createdAt'>) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const expenseRef = doc(db, 'expenses', expenseId);
        
        const newPayment = { ...payment, id: doc(collection(db, 'temp')).id, createdAt: new Date() };

        await updateDoc(expenseRef, {
            payments: arrayUnion(newPayment),
            balance: increment(-payment.amount)
        });
    } catch (error) {
        console.error("Error adding payment to expense:", error);
        throw new Error("No se pudo registrar el pago.");
    }
  };

  // --- Product Management with Firestore ---
  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        await addDoc(collection(db, 'products'), product);
    } catch (error) {
        console.error("Error adding product:", error);
        throw new Error("No se pudo guardar el producto.");
    }
  }

  const addMultipleProducts = async (productsToProcess: Product[], mode: 'append' | 'replace' = 'append') => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const batch = writeBatch(db);
        if (mode === 'replace') {
            const existingDocsSnapshot = await getDocs(collection(db, 'products'));
            existingDocsSnapshot.forEach(doc => batch.delete(doc.ref));
        }
        productsToProcess.forEach(product => {
        const { id, ...productData } = product;
        const docRef = id && mode === 'append' ? doc(db, 'products', id) : doc(collection(db, 'products'));
        batch.set(docRef, productData);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error adding multiple products:", error);
        throw new Error("No se pudieron importar los productos.");
    }
  }

  const updateProduct = async (updatedProduct: Product) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const { id, ...productData } = updatedProduct;
        const productRef = doc(db, 'products', id);
        await updateDoc(productRef, productData as any);
    } catch (error) {
        console.error("Error updating product:", error);
        throw new Error("No se pudo actualizar el producto.");
    }
  }

  const deleteProduct = async (id: string) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        await deleteDoc(doc(db, 'products', id));
    } catch (error) {
        console.error("Error deleting product:", error);
        throw new Error("No se pudo eliminar el producto.");
    }
  }

  // --- Raw Material Management with Firestore ---
  const addRawMaterial = async (material: Omit<RawMaterial, 'id'>) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        await addDoc(collection(db, 'rawMaterials'), material);
    } catch (error) {
        console.error("Error adding raw material:", error);
        throw new Error("No se pudo guardar la materia prima.");
    }
  };

  const addMultipleRawMaterials = async (materialsToProcess: RawMaterial[], mode: 'append' | 'replace' = 'append') => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const batch = writeBatch(db);
        if (mode === 'replace') {
            const existingDocsSnapshot = await getDocs(collection(db, 'rawMaterials'));
            existingDocsSnapshot.forEach(doc => batch.delete(doc.ref));
        }
        materialsToProcess.forEach(material => {
            const { id, ...materialData } = material;
            const docRef = id && mode === 'append' ? doc(db, 'rawMaterials', id) : doc(collection(db, 'rawMaterials'));
            batch.set(docRef, materialData);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error adding multiple raw materials:", error);
        throw new Error("No se pudieron importar las materias primas.");
    }
  };

  const updateRawMaterial = async (updatedMaterial: RawMaterial) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const { id, ...materialData } = updatedMaterial;
        const materialRef = doc(db, 'rawMaterials', id);
        await updateDoc(materialRef, materialData as any);
    } catch(error) {
        console.error("Error updating raw material:", error);
        throw new Error("No se pudo actualizar la materia prima.");
    }
  };

  const deleteRawMaterial = async (id: string) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        await deleteDoc(doc(db, 'rawMaterials', id));
    } catch (error) {
        console.error("Error deleting raw material:", error);
        throw new Error("No se pudo eliminar la materia prima.");
    }
  };

  // --- Client Management with Firestore ---
  const addClient = async (client: Omit<Client, 'id' | 'code'>): Promise<Client | undefined> => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const querySnapshot = await getDocs(collection(db, 'clients'));
        const currentClientsData = querySnapshot.docs.map(doc => doc.data() as Omit<Client, 'id'>);

        const existingCodes = currentClientsData
        .map(c => parseInt(c.code?.split('-')[1] || '0', 10))
        .filter(n => !isNaN(n));
        
        const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        const newCode = `CLI-${(maxCode + 1).toString().padStart(3, '0')}`;
        
        const clientData = { ...client, code: newCode };
        const docRef = await addDoc(collection(db, 'clients'), clientData);
        return { id: docRef.id, ...clientData };
    } catch (error) {
        console.error("Error adding client:", error);
        throw new Error("No se pudo guardar el cliente.");
    }
  };

  const addMultipleClients = async (clientsToAdd: Omit<Client, 'id' | 'code'>[], mode: 'append' | 'replace' = 'append') => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const batch = writeBatch(db);
        
        let startingMaxCode = 0;
        if (mode === 'append') {
            const querySnapshot = await getDocs(collection(db, 'clients'));
            const currentClientsData = querySnapshot.docs.map(doc => doc.data() as Omit<Client, 'id'>);
            const existingCodes = currentClientsData
            .map(c => parseInt(c.code?.split('-')[1] || '0', 10))
            .filter(n => !isNaN(n));
            startingMaxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        } else { // mode === 'replace'
            const existingDocsSnapshot = await getDocs(collection(db, 'clients'));
            existingDocsSnapshot.forEach(doc => batch.delete(doc.ref));
        }

        let maxCode = startingMaxCode;
        
        clientsToAdd.forEach(client => {
        maxCode++;
        const newCode = `CLI-${maxCode.toString().padStart(3, '0')}`;
        const docRef = doc(collection(db, 'clients'));
        batch.set(docRef, { ...client, code: newCode });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error adding multiple clients:", error);
        throw new Error("No se pudieron importar los clientes.");
    }
  };

  const updateClient = async (updatedClient: Client) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const { id, ...clientData } = updatedClient;
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, clientData as any);
    } catch (error) {
        console.error("Error updating client:", error);
        throw new Error("No se pudo actualizar el cliente.");
    }
  };

  const deleteClient = async (id: string) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
        console.error("Error deleting client:", error);
        throw new Error("No se pudo eliminar el cliente.");
    }
  };

  // --- Supplier Management with Firestore ---
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'code'>): Promise<Supplier | undefined> => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const querySnapshot = await getDocs(collection(db, 'suppliers'));
        const currentSuppliersData = querySnapshot.docs.map(doc => doc.data() as Omit<Supplier, 'id'>);

        const existingCodes = currentSuppliersData
        .map(s => parseInt(s.code?.split('-')[1] || '0', 10))
        .filter(n => !isNaN(n));
        
        const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        const newCode = `SUP-${(maxCode + 1).toString().padStart(3, '0')}`;
        
        const supplierData = { ...supplier, code: newCode };
        const docRef = await addDoc(collection(db, 'suppliers'), supplierData);
        return { id: docRef.id, ...supplierData };
    } catch (error) {
        console.error("Error adding supplier:", error);
        throw new Error("No se pudo guardar el suplidor.");
    }
  };

  const addMultipleSuppliers = async (suppliersToAdd: Omit<Supplier, 'id' | 'code'>[], mode: 'append' | 'replace' = 'append') => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const batch = writeBatch(db);
        
        let startingMaxCode = 0;
        if (mode === 'append') {
            const querySnapshot = await getDocs(collection(db, 'suppliers'));
            const currentSuppliersData = querySnapshot.docs.map(doc => doc.data() as Omit<Supplier, 'id'>);
            const existingCodes = currentSuppliersData
            .map(s => parseInt(s.code?.split('-')[1] || '0', 10))
            .filter(n => !isNaN(n));
            startingMaxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        } else { // mode === 'replace'
            const existingDocsSnapshot = await getDocs(collection(db, 'suppliers'));
            existingDocsSnapshot.forEach(doc => batch.delete(doc.ref));
        }

        let maxCode = startingMaxCode;

        suppliersToAdd.forEach(supplier => {
            maxCode++;
            const newCode = `SUP-${maxCode.toString().padStart(3, '0')}`;
            const docRef = doc(collection(db, 'suppliers'));
            batch.set(docRef, { ...supplier, code: newCode });
        });
        await batch.commit();
    } catch(error) {
        console.error("Error adding multiple suppliers:", error);
        throw new Error("No se pudieron importar los suplidores.");
    }
  };

  const updateSupplier = async (updatedSupplier: Supplier) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        const { id, ...supplierData } = updatedSupplier;
        const supplierRef = doc(db, 'suppliers', id);
        await updateDoc(supplierRef, supplierData as any);
    } catch(error) {
        console.error("Error updating supplier:", error);
        throw new Error("No se pudo actualizar el suplidor.");
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!db) throw new Error("Firestore no está inicializado.");
    try {
        await deleteDoc(doc(db, 'suppliers', id));
    } catch(error) {
        console.error("Error deleting supplier:", error);
        throw new Error("No se pudo eliminar el suplidor.");
    }
  };

  if (!isConfigured || !db) {
    return <FirebaseConfigStatus config={firebaseConfig} />;
  }

  return (
    <AppContext.Provider value={{
        loading,
        incomes, expenses, products, rawMaterials, clients, suppliers, invoiceSettings,
        expenseCategories,
        addIncome, addMultipleIncomes, deleteIncome, updateIncome, addPayment,
        addExpense, addMultipleExpenses, deleteExpense, updateExpense, addPaymentToExpense,
        addProduct, addMultipleProducts, deleteProduct, updateProduct,
        addRawMaterial, addMultipleRawMaterials, updateRawMaterial, deleteRawMaterial,
        addClient, addMultipleClients, updateClient, deleteClient,
        addSupplier, addMultipleSuppliers, updateSupplier, deleteSupplier,
        updateInvoiceSettings,
        updateExpenseCategories,
    }}>
      {children}
    </AppContext.Provider>
  );
};
