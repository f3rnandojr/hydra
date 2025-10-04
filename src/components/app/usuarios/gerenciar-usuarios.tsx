"use client";

import { useState } from "react";
import type { Usuario } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUsuarioButton } from "./buttons";
import { UsuariosTable } from "./table";

interface GerenciarUsuariosProps {
  initialUsuarios: Usuario[];
}

export function GerenciarUsuarios({ initialUsuarios }: GerenciarUsuariosProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  
  // Função para ser chamada após uma ação para recarregar a lista
  const handleSuccess = async () => {
    const response = await fetch('/api/usuarios');
    if (response.ok) {
        const updatedUsuarios = await response.json();
        setUsuarios(updatedUsuarios);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Adicione, edite e remova usuários do sistema.
          </p>
        </div>
        <CreateUsuarioButton onSuccess={handleSuccess} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {usuarios.length} usuários cadastrados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsuariosTable usuarios={usuarios} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
