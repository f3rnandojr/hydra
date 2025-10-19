"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, Filter, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import type { Venda } from "@/lib/definitions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface VendaCompleta extends Venda {
  usuario?: {
    _id: string;
    nome: string;
    email: string;
  };
  colaborador?: {
    _id: string;
    nome: string;
    email: string;
  };
}

export function GerenciarVendas() {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("ativas");
  const [pesquisa, setPesquisa] = useState("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");

  useEffect(() => {
    buscarVendas();
  }, []);

  const buscarVendas = async () => {
    setCarregando(true);
    try {
      // Usando a rota de relatório que já popula os dados de usuário e colaborador
      const response = await fetch('/api/relatorios/vendas-v2');
      if (response.ok) {
        const data = await response.json();
        setVendas(data);
      } else {
        throw new Error('Erro ao buscar vendas');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as vendas.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const vendasFiltradas = vendas.filter(venda => {
    const matchStatus = filtroStatus === "todas" || 
      (filtroStatus === "ativas" && (venda.status === "ativa" || venda.status === "finalizada")) ||
      (filtroStatus === "canceladas" && venda.status === "cancelada");

    const matchPesquisa = pesquisa === "" || 
      venda.numeroVenda.includes(pesquisa) ||
      venda.usuario?.nome.toLowerCase().includes(pesquisa.toLowerCase());

    return matchStatus && matchPesquisa;
  });

  const cancelarVenda = async (vendaId: string, motivo: string) => {
    if (!usuario) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
     if (!motivo) {
      toast({ title: "Obrigatório", description: "O motivo do cancelamento é obrigatório.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/vendas/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendaId, motivo, usuarioCancelamentoId: usuario._id }),
      });

      if (response.ok) {
        setVendas(prev => 
          prev.map(venda => 
            venda._id === vendaId 
              ? { 
                  ...venda, 
                  status: "cancelada",
                  motivoCancelamento: motivo,
                  usuarioCancelamentoId: usuario._id,
                  dataCancelamento: new Date().toISOString()
                }
              : venda
          )
        );
        toast({ title: "Sucesso!", description: "Venda cancelada com sucesso." });
      } else {
        const result = await response.json();
        throw new Error(result.message || 'Erro ao cancelar venda');
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setMotivoCancelamento(""); // Limpa o motivo após a tentativa
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativa": return <Badge className="bg-green-500 hover:bg-green-600">Ativa</Badge>;
      case "finalizada": return <Badge className="bg-green-500 hover:bg-green-600">Finalizada</Badge>;
      case "cancelada": return <Badge variant="destructive">Cancelada</Badge>;
      case "editada": return <Badge className="bg-blue-500 hover:bg-blue-600">Editada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'dinheiro': 'Dinheiro', 'cartao_credito': 'Crédito', 
      'cartao_debito': 'Débito', 'pix': 'PIX', 'apagar': 'À Pagar'
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Vendas</h1>
          <p className="text-muted-foreground">Visualize, edite ou cancele vendas realizadas</p>
        </div>
        <Button onClick={buscarVendas} variant="outline" disabled={carregando}>
          <RefreshCw className={`h-4 w-4 mr-2 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status da Venda</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativas">Vendas Ativas</SelectItem>
                  <SelectItem value="canceladas">Vendas Canceladas</SelectItem>
                  <SelectItem value="todas">Todas as Vendas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pesquisar</label>
              <Input placeholder="Nº da venda ou nome do vendedor..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendas Realizadas</CardTitle>
          <CardDescription>{vendasFiltradas.length} vendas encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="text-center py-8">Carregando vendas...</div>
          ) : vendasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma venda encontrada com os filtros selecionados</div>
          ) : (
            <div className="space-y-4">
              {vendasFiltradas.map((venda) => (
                <Card key={venda._id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold">Venda #{venda.numeroVenda}</span>
                        {getStatusBadge(venda.status)}
                        <Badge variant="outline">{getPaymentLabel(venda.formaPagamento)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(venda.dataVenda).toLocaleString('pt-BR')} • {venda.cafeteria}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1"><strong>Vendedor:</strong> {venda.usuario?.nome || 'N/A'}</div>
                      {venda.tipoCliente === 'colaborador' && venda.colaborador && (
                        <div className="text-sm text-muted-foreground"><strong>Colaborador:</strong> {venda.colaborador.nome}</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-lg font-bold">R$ {venda.total.toFixed(2)}</div>
                      {(venda.status === "ativa" || venda.status === "finalizada") && (
                        <div className="flex gap-2 mt-2 justify-end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="h-8">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja cancelar a venda #{venda.numeroVenda}? <strong>Esta ação não pode ser desfeita.</strong>
                                </AlertDialogDescription>
                                <div className="mt-4">
                                  <Label htmlFor="motivo-cancelamento" className="mb-2 block">Motivo do Cancelamento (obrigatório)</Label>
                                  <Textarea 
                                      id="motivo-cancelamento"
                                      placeholder="Ex: Cliente desistiu da compra" 
                                      value={motivoCancelamento}
                                      onChange={(e) => setMotivoCancelamento(e.target.value)}
                                  />
                                </div>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setMotivoCancelamento('')}>Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => cancelarVenda(venda._id, motivoCancelamento)} className="bg-red-600 hover:bg-red-700">Sim, Cancelar Venda</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                       {venda.status === "cancelada" && (
                        <div className="text-xs text-red-600 mt-1 max-w-xs text-right">
                          <p><strong>Cancelado em:</strong> {venda.dataCancelamento ? new Date(venda.dataCancelamento).toLocaleDateString('pt-BR') : 'N/A'}</p>
                          <p><strong>Motivo:</strong> {venda.motivoCancelamento}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
