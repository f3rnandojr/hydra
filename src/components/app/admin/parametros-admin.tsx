
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, RefreshCw } from "lucide-react";

interface Parametro {
  _id: string;
  chave: string;
  valor: string;
  descricao: string;
  dataAtualizacao: string;
}

export function ParametrosAdmin() {
  const { toast } = useToast();
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [valoresEditados, setValoresEditados] = useState<Record<string, string>>({});

  // Buscar parâmetros ao carregar o componente
  useEffect(() => {
    carregarParametros();
  }, []);

  const carregarParametros = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/parametros'); // Busca todos os parâmetros
      if (response.ok) {
        const data = await response.json();
        setParametros(data);
        
        // Inicializar valores editados
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
    setSalvando(true);
    try {
      for (const [chave, valor] of Object.entries(valoresEditados)) {
        // Only save if the value has changed
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
      
      // Recarregar para pegar datas de atualização
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

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando parâmetros...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parâmetros do Sistema</h1>
          <p className="text-muted-foreground">
            Configure as settings globais do sistema
          </p>
        </div>
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
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6">
        {parametros.map((parametro) => (
          <Card key={parametro._id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {parametro.chave}
              </CardTitle>
              <CardDescription>
                {parametro.descricao}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor={parametro.chave}>Valor</Label>
                <Input
                  id={parametro.chave}
                  value={valoresEditados[parametro.chave] || ""}
                  onChange={(e) => handleValorChange(parametro.chave, e.target.value)}
                  placeholder={`Digite o valor para ${parametro.chave}`}
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                Última atualização: {new Date(parametro.dataAtualizacao).toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}

        {parametros.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum parâmetro encontrado</h3>
              <p className="text-muted-foreground">
                Os parâmetros do sistema ainda não foram configurados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
