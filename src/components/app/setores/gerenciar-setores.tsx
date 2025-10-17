"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Setor } from "@/lib/definitions";
import { CreateSetorButton } from "./buttons";
import { SetoresTable } from "./table";
import { useToast } from "@/hooks/use-toast";

interface GerenciarSetoresProps {
  initialSetores: Setor[];
}

export function GerenciarSetores({ initialSetores }: GerenciarSetoresProps) {
  const [setores, setSetores] = useState<Setor[]>(initialSetores);
  const { toast } = useToast();

  const handleSuccess = async () => {
    try {
      const response = await fetch('/api/setores');
      if (response.ok) {
        const updatedSetores = await response.json();
        setSetores(updatedSetores);
        toast({ title: "Sucesso", description: "Lista de setores atualizada." });
      } else {
        throw new Error("Falha ao buscar setores");
      }
    } catch (error) {
       toast({ title: "Erro", description: "Não foi possível atualizar a lista de setores.", variant: "destructive"});
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Setores</h1>
          <p className="text-muted-foreground">
            Adicione, edite e gerencie os setores da empresa.
          </p>
        </div>
        <CreateSetorButton onSuccess={handleSuccess} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Setores</CardTitle>
          <CardDescription>
            {setores.length} setores cadastrados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetoresTable setores={setores} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
