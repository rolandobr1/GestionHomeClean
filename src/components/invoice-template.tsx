
"use client";

import React from 'react';
import type { Income, Client, InvoiceSettings } from '@/components/app-provider';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from './ui/separator';

interface InvoiceTemplateProps {
  income: Income;
  clients: Client[];
  invoiceSettings: InvoiceSettings;
}

export const InvoiceTemplate = ({ income, clients, invoiceSettings }: InvoiceTemplateProps) => {
  const client = clients.find(c => c.id === income.clientId);

  if (!income) return null;

  return (
    <div className="bg-white text-black p-4 md:p-6 font-sans w-full min-w-[320px] flex-grow overflow-y-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-gray-200">
        <div>
          <div className="mb-2">
            <img src={invoiceSettings.companyLogo} alt="Logo de la empresa" width="150" height="50" className="object-contain" />
          </div>
          <p className="text-sm text-gray-500">{invoiceSettings.companyAddress}</p>
          <p className="text-sm text-gray-500">RNC: {invoiceSettings.companyRNC}</p>
        </div>
        <div className="text-left sm:text-right">
          <h2 className="text-2xl font-semibold uppercase text-gray-600">Factura</h2>
          <p className="text-sm text-gray-500">Nº: {income.id.slice(-6).toUpperCase()}</p>
          <p className="text-sm text-gray-500">Fecha: {format(new Date(income.date), 'dd/MM/yyyy', { locale: es })}</p>
        </div>
      </header>

      <section className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <h3 className="font-semibold text-gray-500 uppercase text-sm mb-2">Facturar a:</h3>
            <div className="text-gray-700">
            <p className="font-bold">{client?.name || 'Cliente Genérico'}</p>
            </div>
        </div>
        <div className='text-left sm:text-right'>
            <h3 className="font-semibold text-gray-500 uppercase text-sm mb-2">Método de Pago:</h3>
            <p className="font-bold capitalize text-gray-700">{income.paymentMethod}</p>
        </div>
      </section>

      <section className="overflow-x-auto">
        <table className="w-full text-left min-w-[400px]">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
            <tr>
              <th className="p-3 w-1/2 font-semibold">Producto</th>
              <th className="p-3 text-center font-semibold">Cant.</th>
              <th className="p-3 text-right font-semibold">Precio Unit.</th>
              <th className="p-3 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody className='text-gray-800'>
            {income.products.map(p => (
              <tr key={p.productId} className="border-b border-gray-200">
                <td className="p-3">{p.name}</td>
                <td className="p-3 text-center">{p.quantity}</td>
                <td className="p-3 text-right">RD${p.price.toFixed(2)}</td>
                <td className="p-3 text-right">RD${(p.quantity * p.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mt-8">
        <div className="w-full max-w-xs space-y-2 text-gray-700">
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>RD${income.totalAmount.toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
                <span>ITBIS (0%):</span>
                <span>RD$0.00</span>
            </div>
            <Separator className="bg-gray-300 my-2" />
            <div className="flex justify-between font-bold text-xl text-gray-800">
                <span>Total:</span>
                <span>RD${income.totalAmount.toFixed(2)}</span>
            </div>
        </div>
      </section>
      
      <footer className="mt-12 pt-6 border-t-2 border-gray-200 text-center text-xs text-gray-500">
        <p>¡Gracias por su compra!</p>
      </footer>
    </div>
  );
};
