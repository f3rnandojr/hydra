"use client";

import { useColaboradorAuth } from "@/contexts/colaborador-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";

export default function PortalPage() {
  const { colaborador, logout, carregando } = useColaboradorAuth();

  if (carregando) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40">
            <p>Carregando...</p>
        </div>
    );
  }

  if (!colaborador) {
      return null; // O layout já redireciona
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl">Portal do Colaborador</CardTitle>
                        <CardDescription>Bem-vindo de volta, {colaborador.nome}!</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <p>Aqui você poderá ver seus gastos e outras informações.</p>
                <p className="mt-4 text-sm text-muted-foreground">FASE 2 em breve...</p>
            </CardContent>
        </Card>
    </div>
  );
}
