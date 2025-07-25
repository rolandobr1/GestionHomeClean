
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus } from 'lucide-react';
import { useAppData } from '@/hooks/use-app-data';
import type { Client } from '@/components/app-provider';
import { useToast } from '@/hooks/use-toast';
import { ContactForm } from './contact-form';

interface ClientSelectorModalProps {
    selectedClientId: string;
    onClientSelect: (clientId: string) => void;
}

export function ClientSelectorModal({ selectedClientId, onClientSelect }: ClientSelectorModalProps) {
    const { clients: allClientsData, addClient } = useAppData();
    const { toast } = useToast();
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isNewClientOpen, setIsNewClientOpen] = useState(false);

    const allClients = useMemo(() => [
        { id: 'generic', name: 'Cliente Genérico', code: 'CLI-000', email: '', phone: '', address: '' },
        ...[...allClientsData].sort((a,b) => a.name.localeCompare(b.name))
    ], [allClientsData]);

    const filteredClients = useMemo(() => {
        if (!searchTerm) return allClients;
        return allClients.filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, allClients]);
    
    const selectedClientName = useMemo(() => {
        return allClients.find(c => c.id === selectedClientId)?.name || 'Cliente Genérico';
    }, [selectedClientId, allClients]);

    const handleSelect = (clientId: string) => {
        onClientSelect(clientId);
        setIsSelectorOpen(false);
    }
    
    const handleSaveNewClient = async (clientData: Omit<Client, 'id' | 'code'>) => {
        try {
            const newClient = await addClient(clientData);
            if (newClient) {
                toast({ title: "Cliente Añadido", description: `El cliente "${newClient.name}" ha sido creado y seleccionado.` });
                onClientSelect(newClient.id);
                setIsNewClientOpen(false);
                setIsSelectorOpen(false);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el nuevo cliente.' });
        }
    };

    return (
        <>
            <div className="space-y-2">
                <Label>Cliente</Label>
                <Button type="button" variant="outline" className="w-full justify-start font-normal truncate" onClick={() => setIsSelectorOpen(true)}>
                    {selectedClientName}
                </Button>
            </div>
            
            <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                <DialogContent className="sm:max-w-md flex flex-col h-[70vh]">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <ScrollArea className="flex-grow">
                        <div className="pr-4 space-y-1">
                            {filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => handleSelect(client.id)}
                                    className="p-2 -mx-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                                >
                                    {client.name}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-2">
                        <Button type="button" variant="outline" onClick={() => setIsNewClientOpen(true)}>
                           <UserPlus className="mr-2 h-4 w-4" />
                           Crear Nuevo Cliente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
                        <DialogDescription>
                            Crea un nuevo cliente que se seleccionará automáticamente.
                        </DialogDescription>
                    </DialogHeader>
                    <ContactForm 
                        contact={null} 
                        onSave={handleSaveNewClient as (contactData: any) => Promise<void>} 
                        onClose={() => setIsNewClientOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
