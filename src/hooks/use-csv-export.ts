
"use client";

import { useToast } from "@/hooks/use-toast";

export function useCsvExport() {
    const { toast } = useToast();

    const convertArrayOfObjectsToCSV = (data: any[], headers: string[]) => {
        if (data.length === 0) return '';
        const columnDelimiter = ',';
        const lineDelimiter = '\n';
        
        let result = headers.join(columnDelimiter) + lineDelimiter;

        data.forEach(item => {
            let ctr = 0;
            headers.forEach(key => {
                if (ctr > 0) result += columnDelimiter;
                let value = item[key] ?? '';
                if (typeof value === 'string' && value.includes('"')) {
                   value = `"${value.replace(/"/g, '""')}"`;
                }
                if (typeof value === 'string' && value.includes(columnDelimiter)) {
                   value = `"${value}"`;
                }
                result += value;
                ctr++;
            });
            result += lineDelimiter;
        });
        return result;
    };

    const downloadCSV = (data: any[], headers: string[], fileName: string) => {
        if (data.length === 0) {
            toast({ title: 'No hay datos', description: 'No hay registros para exportar.', variant: 'destructive' });
            return;
        }
        
        const dataToExport = data.map(d => {
            const row: {[key: string]: any} = {};
            headers.forEach(h => row[h] = d[h]);
            return row;
        });

        const csvString = convertArrayOfObjectsToCSV(dataToExport, headers);
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Exportación Exitosa', description: 'Tus datos han sido descargados.' });
    };

    return { downloadCSV };
};
