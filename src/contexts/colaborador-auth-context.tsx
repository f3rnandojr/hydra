"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Colaborador {
  _id: string;
  nome: string;
  email: string;
  status: boolean;
}

interface ColaboradorAuthContextType {
  colaborador: Colaborador | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  carregando: boolean;
}

const ColaboradorAuthContext = createContext<ColaboradorAuthContextType | undefined>(undefined);

export function ColaboradorAuthProvider({ children }: { children: ReactNode }) {
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const colaboradorData = localStorage.getItem('colaborador_data');
    if (colaboradorData) {
      try {
        setColaborador(JSON.parse(colaboradorData));
      } catch (error) {
        console.error('Erro ao recuperar dados do colaborador:', error);
        logout();
      }
    }
    setCarregando(false);
  }, []);
  
  useEffect(() => {
    if (!carregando && !colaborador && pathname !== '/portal/login') {
        router.push('/portal/login');
    }
  }, [carregando, colaborador, pathname, router]);

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/colaboradores/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      if (response.ok) {
        const data = await response.json();
        setColaborador(data.colaborador);
        localStorage.setItem('colaborador_data', JSON.stringify(data.colaborador));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = () => {
    setColaborador(null);
    localStorage.removeItem('colaborador_data');
    router.push('/portal/login');
  };

  return (
    <ColaboradorAuthContext.Provider value={{ colaborador, login, logout, carregando }}>
      {children}
    </ColaboradorAuthContext.Provider>
  );
}

export function useColaboradorAuth() {
  const context = useContext(ColaboradorAuthContext);
  if (context === undefined) {
    throw new Error('useColaboradorAuth deve ser usado dentro de um ColaboradorAuthProvider');
  }
  return context;
}
