// This file is deprecated. Please use app-provider.tsx instead.
"use client";

import React, { createContext, useState, ReactNode } from 'react';

export const FinancialContext = createContext(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  return (
    // @ts-ignore
    <FinancialContext.Provider value={{}}>
      {children}
    </FinancialContext.Provider>
  );
};
