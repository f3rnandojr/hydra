"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Printer, Search, RefreshCw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import type { Venda } from "@/lib/definitions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { EditarVendaModal } from "./editar-venda-modal";

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
  itens: Array<{
    nomeProduto: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
  }>;
}

interface VendasRecentesProps {
  onVendaAtualizada?: () => void;
}

export function VendasRecentes({ onVendaAtualizada }: VendasRecentesProps) {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaCompleta | null>(null);

  useEffect(() => {
    buscarVendasRecentes();
  }, []);

  const buscarVendasRecentes = async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/vendas/recentes');
      if (response.ok) {
        const data = await response.json();
        setVendas(data);
      } else {
        throw new Error('Erro ao buscar vendas recentes');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as vendas recentes.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const vendasFiltradas = vendas.filter(venda => 
    pesquisa === "" || 
    venda.numeroVenda.includes(pesquisa) ||
    (venda.usuario?.nome && venda.usuario.nome.toLowerCase().includes(pesquisa.toLowerCase()))
  );

  const cancelarVenda = async (vendaId: string) => {
    if (!usuario) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
     if (!motivoCancelamento.trim()) {
      toast({ title: "Obrigatório", description: "O motivo do cancelamento é obrigatório.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/vendas/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendaId, motivo: motivoCancelamento.trim(), usuarioCancelamentoId: usuario._id }),
      });

      if (response.ok) {
        setVendas(prev => 
          prev.map(venda => 
            venda._id === vendaId 
              ? { 
                  ...venda, 
                  status: "cancelada",
                  motivoCancelamento: motivoCancelamento.trim(),
                  usuarioCancelamentoId: usuario._id,
                  dataCancelamento: new Date().toISOString()
                }
              : venda
          )
        );
        toast({ title: "Sucesso!", description: "Venda cancelada com sucesso." });
        onVendaAtualizada?.();
      } else {
        const result = await response.json();
        throw new Error(result.message || 'Erro ao cancelar venda');
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setMotivoCancelamento(""); 
    }
  };

  const reimprimirCupom = async (venda: VendaCompleta) => {
    toast({
      title: "Reimpressão",
      description: `Preparando cupom da venda #${venda.numeroVenda} para impressão...`,
    });
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
  
  const isVendaEditavel = (venda: VendaCompleta) => {
    const dataVenda = new Date(venda.dataVenda);
    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return (venda.status === "ativa" || venda.status === "finalizada") && dataVenda > duasHorasAtras;
  };

  const handleEditarVenda = (venda: VendaCompleta) => {
    setVendaSelecionada(venda);
    setModalEdicaoAberto(true);
  };

  const handleVendaEditada = (vendaEditada: VendaCompleta) => {
    setVendas(prev => 
      prev.map(v => v._id === vendaEditada._id ? vendaEditada : v)
    );
    onVendaAtualizada?.();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendas Recentes</CardTitle>
              <CardDescription>
                Últimas 2 horas - Ações rápidas disponíveis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={buscarVendasRecentes} 
                variant="outline" 
                size="sm"
                disabled={carregando}
              >
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou vendedor..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {carregando ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Carregando vendas recentes...</p>
            </div>
          ) : vendasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {pesquisa ? "Nenhuma venda encontrada" : "Nenhuma venda nas últimas 2 horas"}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vendasFiltradas.map((venda) => (
                <div key={venda._id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold">#{venda.numeroVenda}</span>
                        {getStatusBadge(venda.status)}
                        <Badge variant="outline" className="text-xs">
                          {getPaymentLabel(venda.formaPagamento)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {new Date(venda.dataVenda).toLocaleTimeString('pt-BR')} • 
                        {venda.usuario?.nome || 'N/A'}
                      </div>
                      
                      {venda.tipoCliente === 'colaborador' && venda.colaborador && (
                        <div className="text-xs text-muted-foreground">
                          Colaborador: {venda.colaborador.nome}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {venda.itens.slice(0, 2).map((item, index) => (
                          <span key={index}>
                            {item.nomeProduto} ({item.quantidade}x)
                            {index < venda.itens.length - 1 && index < 1 ? ', ' : ''}
                          </span>
                        ))}
                        {venda.itens.length > 2 && (
                          <span> +{venda.itens.length - 2} itens</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold">R$ {venda.total.toFixed(2)}</div>
                      
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditarVenda(venda)}
                          disabled={!isVendaEditavel(venda)}
                          title={isVendaEditavel(venda) ? "Editar venda" : "Venda não pode ser editada"}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button size="sm" variant="ghost" onClick={() => reimprimirCupom(venda)} title="Reimprimir cupom">
                          <Printer className="h-3 w-3" />
                        </Button>
                        
                        {isVendaEditavel(venda) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" title="Cancelar venda">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar Venda #{venda.numeroVenda}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja cancelar esta venda no valor de <strong>R$ {venda.total.toFixed(2)}</strong>? O estoque dos itens será devolvido.
                                </AlertDialogDescription>
                                 <div className="mt-4">
                                    <Label htmlFor="motivo-cancelamento" className="mb-2 block">Motivo do Cancelamento (obrigatório)</Label>
                                    <Textarea id="motivo-cancelamento" placeholder="Ex: Cliente desistiu da compra" value={motivoCancelamento} onChange={(e) => setMotivoCancelamento(e.target.value)} />
                                  </div>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setMotivoCancelamento('')}>Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => cancelarVenda(venda._id)} className="bg-red-600 hover:bg-red-700">
                                  Confirmar Cancelamento
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <EditarVendaModal
        open={modalEdicaoAberto}
        onOpenChange={setModalEdicaoAberto}
        venda={vendaSelecionada}
        onVendaEditada={handleVendaEditada}
      />
    </>
  );
}
