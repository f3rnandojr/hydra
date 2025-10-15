"use client";

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCafeteria } from '@/contexts/cafeteria-context';
import { TrocarCafeteriaButton } from '@/components/app/cafeteria/trocar-cafeteria-button';

export function AppHeader() {
  const { usuario, logout, carregando } = useAuth();
  const { cafeteriaAtiva } = useCafeteria();
  const router = useRouter();

  useEffect(() => {
    // Se não está carregando e não há usuário, redireciona para o login
    if (!carregando && !usuario) {
      router.push('/login');
    }
  }, [usuario, carregando, router]);


  // Não renderiza nada até que o estado de autenticação seja resolvido
  // ou se o usuário não estiver logado para evitar piscar o conteúdo
  if (carregando || !usuario) {
    return null;
  }


  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
            {cafeteriaAtiva && (
              <div className="text-sm font-medium border-r pr-4">
                <span className="text-muted-foreground">Cafeteria Ativa: </span>
                <span className="font-bold">{cafeteriaAtiva === 'cafeteria_01' ? '01' : '02'}</span>
              </div>
            )}
            <TrocarCafeteriaButton />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Logado como: <strong>{usuario.nome}</strong>
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{usuario.nome}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {usuario.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {usuario.tipo}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
