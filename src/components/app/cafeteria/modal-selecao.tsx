"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useCafeteria } from "@/contexts/cafeteria-context";

export function ModalSelecaoCafeteria() {
  const { cafeteriaAtiva, mostrarModal, setCafeteriaAtiva } = useCafeteria();
  const { usuario } = useAuth(); // Pega o usuário do contexto de autenticação

  // Só mostra o modal se o estado for true E se houver um usuário logado.
  if (!mostrarModal || !usuario) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Selecionar Cafeteria</CardTitle>
          <CardDescription>
            Escolha a cafeteria onde você está trabalhando hoje
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant={cafeteriaAtiva === "cafeteria_01" ? "default" : "outline"}
              onClick={() => setCafeteriaAtiva("cafeteria_01")}
              className="h-16 text-lg"
            >
              🏪 Cafeteria 01
            </Button>
            
            <Button
              variant={cafeteriaAtiva === "cafeteria_02" ? "default" : "outline"}
              onClick={() => setCafeteriaAtiva("cafeteria_02")}
              className="h-16 text-lg"
            >
              🏪 Cafeteria 02
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground text-center">
            Esta seleção será mantida durante toda a sua sessão de trabalho
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
