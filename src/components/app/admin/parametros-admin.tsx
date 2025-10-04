"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface Parametro {
  _id: string;
  chave: string;
  valor: string;
  descricao: string;
  dataAtualizacao: string;
}

export function ParametrosAdmin() {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [valoresEditados, setValoresEditados] = useState<Record<string, string>>({});

  useEffect(() => {
    carregarParametros();
  }, []);

  const carregarParametros = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/parametros');
      if (response.ok) {
        const data = await response.json();
        setParametros(data);
        
        const iniciais: Record<string, string> = {};
        data.forEach((param: Parametro) => {
          iniciais[param.chave] = param.valor;
        });
        setValoresEditados(iniciais);
      } else {
        throw new Error('Erro ao carregar parâmetros');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os parâmetros.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleValorChange = (chave: string, valor: string) => {
    setValoresEditados(prev => ({
      ...prev,
      [chave]: valor
    }));
  };

  const salvarParametros = async () => {
    if (usuario?.tipo !== 'gestor') {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para salvar parâmetros.",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    try {
      for (const [chave, valor] of Object.entries(valoresEditados)) {
        const originalParam = parametros.find(p => p.chave === chave);
        if (originalParam && originalParam.valor !== valor) {
            const response = await fetch('/api/parametros', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ chave, valor }),
            });

            if (!response.ok) {
              throw new Error(`Erro ao salvar parâmetro ${chave}`);
            }
        }
      }

      toast({
        title: "Sucesso!",
        description: "Parâmetros atualizados com sucesso.",
      });
      
      await carregarParametros();
      
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar alguns parâmetros.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };
  
  if (usuario?.tipo !== 'gestor') {
    return (
        <Card>
            <CardHeader><CardTitle>Acesso Negado</CardTitle></CardHeader>
            <CardContent>
                <p>Esta área é restrita para gestores.</p>
            </CardContent>
        </Card>
    );
  }


  if (carregando) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando parâmetros...</span>
      </div>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Parâmetros Gerais do Sistema</CardTitle>
            <CardDescription>
                Configure as settings globais do sistema.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {parametros.map((parametro) => (
                <div key={parametro._id} className="grid gap-2 border-b pb-4">
                    <Label htmlFor={parametro.chave} className="font-semibold">{parametro.chave}</Label>
                    <p className="text-sm text-muted-foreground">{parametro.descricao}</p>
                    <Input
                        id={parametro.chave}
                        value={valoresEditados[parametro.chave] || ""}
                        onChange={(e) => handleValorChange(parametro.chave, e.target.value)}
                        placeholder={`Digite o valor para ${parametro.chave}`}
                    />
                    <div className="text-xs text-muted-foreground">
                        Última atualização: {new Date(parametro.dataAtualizacao).toLocaleString('pt-BR')}
                    </div>
                </div>
            ))}

            {parametros.length === 0 && (
                <div className="py-8 text-center">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum parâmetro encontrado</h3>
                    <p className="text-muted-foreground">
                        Os parâmetros do sistema ainda não foram configurados.
                    </p>
                </div>
            )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
             <Button 
                onClick={salvarParametros} 
                disabled={salvando}
                className="flex items-center gap-2"
                >
                {salvando ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                    <Save className="h-4 w-4" />
                )}
                {salvando ? "Salvando..." : "Salvar Parâmetros Gerais"}
                </Button>
        </CardFooter>
    </Card>
  );
}
