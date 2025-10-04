"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Search, Filter, Plus, Edit, Trash2, User, Shield, UserCheck, UserX } from "lucide-react";
import { Usuario } from "@/lib/definitions";
import { CreateUsuarioButton, EditUsuarioButton, DeleteUsuarioButton } from "./buttons";
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
