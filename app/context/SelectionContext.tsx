'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface ISelection {
  casis: string[];
  storage: string[];
  head: string[];
}

interface ISelectionContext {
  selections: ISelection;
  setSelections: (selections: ISelection) => void;
  isLoading: boolean;
}

const SelectionContext = createContext<ISelectionContext | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<ISelection>({ casis: [], storage: [], head: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSelections = localStorage.getItem('cng_selections');
      if (storedSelections) {
        setSelections(JSON.parse(storedSelections));
      }
    } catch (error) {
      console.error("Gagal membaca dari localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSetSelections = (newSelections: ISelection) => {
    try {
      setSelections(newSelections);
      localStorage.setItem('cng_selections', JSON.stringify(newSelections));
    } catch (error) {
      console.error("Gagal menyimpan ke localStorage", error);
    }
  };

  return (
    <SelectionContext.Provider value={{ selections, setSelections: handleSetSelections, isLoading }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}