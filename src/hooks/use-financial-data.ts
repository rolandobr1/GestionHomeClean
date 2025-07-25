// This file is deprecated. Please use use-app-data.ts instead.
"use client";

import { useContext } from "react";
// @ts-ignore
import { AppContext } from "@/components/app-provider";

export const useFinancialData = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useFinancialData must be used within a AppProvider');
    }
    return context;
};
