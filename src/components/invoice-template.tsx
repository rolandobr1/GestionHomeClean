"use client";

import React from 'react';
import type { Income } from '@/components/financial-provider';
import { allClients } from '@/app/dashboard/registros/ingresos/page';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from './ui/separator';
import { FlaskConical } from 'lucide-react';

interface InvoiceTemplateProps {
  income: Income;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ income }, ref) => {
  const client = allClients.find(c => c.id === income.clientId);
  const companyName = "QuimioGest S.R.L.";
  const companyAddress = "Calle Ficticia 123, Santo Domingo";
  const companyRNC = "1-2345678-9";

  if (!income) return null;

  return (
    <div ref={ref} className="bg-white text-black p-8 font-sans w-[800px] mx-auto">
      <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">{companyName}</h1>
          </div>
          <p className="text-sm text-gray-500">{companyAddress}</p>
          <p className="text-sm text-gray-500">RNC: {companyRNC}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold uppercase text-gray-600">Factura</h2>
          <p className="text-sm text-gray-500">Nº: {income.id.slice(-6).toUpperCase()}</p>
          <p className="text-sm text-gray-500">Fecha: {format(new Date(income.date), 'dd/MM/yyyy', { locale: es })}</p>
        </div>
      </header>

      <section className="my-8 grid grid-cols-2 gap-4">
        <div>
            <h3 className="font-semibold text-gray-500 uppercase text-sm mb-2">Facturar a:</h3>
            <div className="text-gray-700">
            <p className="font-bold">{client?.name || 'Cliente Genérico'}</p>
            </div>
        </div>
        <div className='text-right'>
            <h3 className="font-semibold text-gray-500 uppercase text-sm mb-2">Método de Pago:</h3>
            <p className="font-bold capitalize text-gray-700">{income.paymentMethod}</p>
        </div>
      </section>

      <section>
        <table className="w-full text-left">
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
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
