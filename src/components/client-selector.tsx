"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown } from 'lucide-react';
import type { Client } from '@/components/app-provider';
import { cn } from '@/lib/utils';

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: string;
  onClientSelect: (clientId: string) => void;
  triggerClassName?: string;
}

export function ClientSelector({ clients, selectedClientId, onClientSelect, triggerClassName }: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const allClientsWithOptions = useMemo(() => [
    { id: 'all', name: 'Todos los clientes', code: '', email: '', phone: '', address: '' },
    ...clients
  ], [clients]);

  const handleSelect = (clientId: string) => {
    onClientSelect(clientId);
    setIsOpen(false);
  };

  const selectedClientName = allClientsWithOptions.find(c => c.id === selectedClientId)?.name || 'Todos los clientes';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full md:w-[280px] justify-between text-left font-normal",
            !selectedClientId || selectedClientId === 'all' ? "text-muted-foreground" : "",
            triggerClassName
          )}
        >
          <span className="truncate">{selectedClientName}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 max-w-md">
        <Command>
            <DialogHeader className="p-4 pb-0">
                <DialogTitle>Seleccionar Cliente</DialogTitle>
            </DialogHeader>
          <CommandInput placeholder="Buscar cliente por nombre..." />
          <CommandList>
            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            <CommandGroup>
              {allClientsWithOptions.map(client => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => handleSelect(client.id)}
                >
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
