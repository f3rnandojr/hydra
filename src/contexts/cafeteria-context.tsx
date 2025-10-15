"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCafeteriaByIP, createOrUpdateSession } from '@/lib/cafeteria-session';
import { getClientIP } from '@/lib/ip-utils';
import { useAuth } from './auth-context';

interface CafeteriaContextType {
  cafeteriaAtiva: string | null;
  mostrarModal: boolean;
  setCafeteriaAtiva: (cafeteria: string) => void;
  abrirModal: () => void;
  fecharModal: () => void;
  carregando: boolean;
}

const CafeteriaContext = createContext<CafeteriaContextType | undefined>(undefined);

export function CafeteriaProvider({ children }: { children: React.ReactNode }) {
  const [cafeteriaAtiva, setCafeteriaState] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const { usuario } = useAuth();

  useEffect(() => {
    async function verificarCafeteriaIP() {
      try {
        setCarregando(true);
        const ip = await getClientIP();
        
        if (ip !== 'unknown') {
          const cafeteriaDoIP = await getCafeteriaByIP(ip);
          
          if (cafeteriaDoIP) {
            setCafeteriaState(cafeteriaDoIP);
            sessionStorage.setItem('cafeteria_ativa', cafeteriaDoIP);
          } else {
            setMostrarModal(true);
          }
        } else {
          setMostrarModal(true);
        }
      } catch (error) {
        console.error('Erro ao verificar cafeteria por IP:', error);
        setMostrarModal(true); // Fallback: mostrar modal
      } finally {
        setCarregando(false);
      }
    }

    const salva = sessionStorage.getItem('cafeteria_ativa');
    if (salva) {
      setCafeteriaState(salva);
      setCarregando(false);
    } else {
      verificarCafeteriaIP();
    }
  }, []);

  const setCafeteriaAtiva = async (cafeteria: string) => {
    try {
      const ip = await getClientIP();
      const nomeUsuario = usuario?.nome || "Não logado";
      
      if (ip !== 'unknown') {
        await createOrUpdateSession(ip, cafeteria, nomeUsuario);
      }
      
      setCafeteriaState(cafeteria);
      sessionStorage.setItem('cafeteria_ativa', cafeteria);
      setMostrarModal(false);
    } catch (error) {
      console.error('Erro ao selecionar cafeteria:', error);
      // Fallback
      setCafeteriaState(cafeteria);
      sessionStorage.setItem('cafeteria_ativa', cafeteria);
      setMostrarModal(false);
    }
  };

  const abrirModal = () => {
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
  };

  return (
    <CafeteriaContext.Provider value={{
      cafeteriaAtiva,
      mostrarModal,
      setCafeteriaAtiva,
      abrirModal,
      fecharModal,
      carregando
    }}>
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
