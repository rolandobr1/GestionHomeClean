
"use client";

import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export function useSort<T>(initialData: T[], initialSortKey: keyof T, initialDirection: 'asc' | 'desc' = 'asc') {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' }>({ key: initialSortKey, direction: initialDirection });

    const sortedData = useMemo(() => {
        if (!initialData) return [];
        return [...initialData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (sortConfig.direction === 'asc') {
                return String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
            } else {
                return String(bValue).localeCompare(String(aValue), undefined, { numeric: true });
            }
        });
    }, [initialData, sortConfig]);

    const handleSort = (key: keyof T) => {
        setSortConfig(prev => {
            const isSameKey = prev.key === key;
            const newDirection = isSameKey ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'asc';
            return { key, direction: newDirection };
        });
    };

    const renderSortArrow = (key: keyof T) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
        }
        return null;
    };
    
    return { sortedData, handleSort, renderSortArrow, sortConfig };
};
