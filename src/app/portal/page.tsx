"use client";

import { useColaboradorAuth } from "@/contexts/colaborador-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Filter, DollarSign, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { ContaReceber } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface ContaComVenda extends ContaReceber {
  venda: {
    _id: string;
    numeroVenda: string;
    dataVenda: string;
    cafeteria: string;
    itens: Array<{
      nomeProduto: string;
      quantidade: number;
      precoUnitario: number;
    }>;
  };
}

export default function PortalPage() {
  const { colaborador, logout, carregando: carregandoAuth } = useColaboradorAuth();
  const { toast } = useToast();
  const [contas, setContas] = useState<ContaComVenda[]>([]);
  const [carregandoContas, setCarregandoContas] = useState(true);
  const [periodo, setPeriodo] = useState("todos");

  useEffect(() => {
    if (colaborador) {
      buscarContas(colaborador._id, periodo);
    }
  }, [colaborador, periodo]);

  const buscarContas = async (colaboradorId: string, periodoFiltro: string) => {
    setCarregandoContas(true);
    try {
        const params = new URLSearchParams({
            colaboradorId,
            status: "todos", // Sempre buscar todos os status para o colaborador
        });

        if (periodoFiltro !== "todos") {
            // A API de contas-receber não tem filtro de período,
            // então filtramos no client-side por enquanto.
            // O ideal seria adicionar isso na API depois.
        }

      const response = await fetch(`/api/contas-receber?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContas(data);
      } else {
        throw new Error("Falha ao buscar suas contas.");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCarregandoContas(false);
    }
  };

  const totalEmDebito = contas
    .filter(c => c.status === 'em_debito')
    .reduce((acc, c) => acc + c.valor, 0);

  const totalQuitado = contas
    .filter(c => c.status === 'quitado')
    .reduce((acc, c) => acc + c.valor, 0);

  if (carregandoAuth) {
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
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-start">
              <div>
                <CardTitle className="text-2xl">Portal do Colaborador</CardTitle>
                <CardDescription>Bem-vindo de volta, {colaborador.nome}!</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="mt-2 md:mt-0">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Resumo de Gastos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Devedor</CardTitle>
                    <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                    R$ {totalEmDebito.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                    Valor total de contas em aberto.
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                    R$ {totalQuitado.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                    Valor total de contas quitadas.
                    </p>
                </CardContent>
            </Card>
        </div>


        {/* Histórico de Gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Gastos</CardTitle>
            <CardDescription>
              Aqui estão todas as suas compras registradas no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carregandoContas ? (
              <div className="text-center py-8">Carregando histórico...</div>
            ) : contas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Você ainda não possui nenhum gasto registrado.
              </div>
            ) : (
              <div className="space-y-4">
                {contas.map((conta) => (
                  <Card key={conta._id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Venda #{conta.venda?.numeroVenda || 'N/A'}</span>
                          <Badge variant={conta.status === 'quitado' ? 'default' : 'secondary'} className={conta.status === 'quitado' ? 'bg-green-500/80' : 'bg-amber-500/80'}>
                            {conta.status === 'quitado' ? 'QUITADO' : 'EM DÉBITO'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(conta.dataVenda).toLocaleString('pt-BR')} • {conta.venda?.cafeteria}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">R$ {conta.valor.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    {conta.status === 'quitado' && conta.dataQuitacao && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                            <CheckCircle className="h-4 w-4" />
                            <span>
                                Quitado em: {new Date(conta.dataQuitacao).toLocaleString('pt-BR')}
                            </span>
                        </div>
                    )}
                    
                    {conta.venda && (
                        <div className="space-y-2">
                        {conta.venda.itens.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                                <span className="font-medium">{item.nomeProduto}</span>
                                <span className="text-muted-foreground ml-2">
                                {item.quantidade} × R$ {item.precoUnitario.toFixed(2)}
                                </span>
                            </div>
                            <span>R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</span>
                            </div>
                        ))}
                        </div>
                    )}

                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
