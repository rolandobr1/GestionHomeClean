"use client";

import { useContext } from "react";
import { AppContext } from "@/components/app-provider";

export const useAppData = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppData must be used within a AppProvider');
    }
    return context;
};
