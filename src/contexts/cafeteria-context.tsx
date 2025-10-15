"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CafeteriaContextType {
  cafeteriaAtiva: string | null;
  setCafeteriaAtiva: (cafeteria: string) => void;
  mostrarModal: boolean;
  abrirModal: () => void;
  fecharModal: () => void;
}

const CafeteriaContext = createContext<CafeteriaContextType | undefined>(undefined);

export function CafeteriaProvider({ children }: { children: React.ReactNode }) {
  const [cafeteriaAtiva, setCafeteriaState] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const cafeteriaSalva = sessionStorage.getItem('cafeteria_ativa');
    if (cafeteriaSalva) {
      setCafeteriaState(cafeteriaSalva);
    }
  }, []);

  const setCafeteriaAtiva = (cafeteria: string) => {
    setCafeteriaState(cafeteria);
    sessionStorage.setItem('cafeteria_ativa', cafeteria);
    fecharModal();
  };

  const abrirModal = () => setMostrarModal(true);
  const fecharModal = () => setMostrarModal(false);

  return (
    <CafeteriaContext.Provider value={{ cafeteriaAtiva, setCafeteriaAtiva, mostrarModal, abrirModal, fecharModal }}>
      {children}
    </CafeteriaContext.Provider>
  );
}

export function useCafeteria() {
  const context = useContext(CafeteriaContext);
  if (context === undefined) {
    throw new Error('useCafeteria deve ser usado dentro de um CafeteriaProvider');
  }
  return context;
}
