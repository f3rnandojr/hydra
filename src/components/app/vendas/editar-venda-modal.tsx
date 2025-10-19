"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, Save, X, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Venda } from "@/lib/definitions";

interface ItemVendaEditavel {
  _id?: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  produtoId: string;
  saldoEstoque?: number;
}

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
  itens: ItemVendaEditavel[];
}

interface EditarVendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venda: VendaCompleta | null;
  onVendaEditada: (vendaEditada: VendaCompleta) => void;
}

export function EditarVendaModal({ open, onOpenChange, venda, onVendaEditada }: EditarVendaModalProps) {
  const { toast } = useToast();
  const [itensEditados, setItensEditados] = useState<ItemVendaEditavel[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Inicializar com os dados da venda quando o modal abrir
  useEffect(() => {
    if (venda && open) {
      setItensEditados(venda.itens.map(item => ({ ...item })));
    }
  }, [venda, open]);

  const calcularTotal = () => {
    return itensEditados.reduce((total, item) => total + item.subtotal, 0);
  };

  const atualizarQuantidade = (index: number, novaQuantidade: number) => {
    if (novaQuantidade < 0) return;
    
    // Verificar estoque se for cliente normal
    const item = itensEditados[index];
    if (venda?.tipoCliente === 'normal' && item.saldoEstoque && novaQuantidade > item.saldoEstoque) {
      toast({
        title: "Estoque insuficiente",
        description: `Quantidade não pode exceder ${item.saldoEstoque} unidades.`,
        variant: "destructive",
      });
      return;
    }

    setItensEditados(prev => 
      prev.map((item, i) => 
        i === index 
          ? {
              ...item,
              quantidade: novaQuantidade,
              subtotal: novaQuantidade * item.precoUnitario
            }
          : item
      )
    );
  };

  const removerItem = (index: number) => {
    if (itensEditados.length <= 1) {
      toast({
        title: "Ação não permitida",
        description: "A venda deve ter pelo menos um item.",
        variant: "destructive",
      });
      return;
    }

    setItensEditados(prev => prev.filter((_, i) => i !== index));
  };

  const adicionarItem = async () => {
    // Em uma implementação completa, aqui abriria um modal de busca de produtos
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Adição de novos produtos será implementada em breve.",
    });
  };

  const salvarEdicao = async () => {
    if (!venda) return;

    setCarregando(true);
    try {
      const response = await fetch('/api/vendas/editar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendaId: venda._id,
          itens: itensEditados,
          total: calcularTotal(),
          // Mantém os outros dados da venda originais
          formaPagamento: venda.formaPagamento,
          tipoCliente: venda.tipoCliente,
          colaboradorId: venda.colaboradorId
        }),
      });

      if (response.ok) {
        const vendaEditada = await response.json();
        
        toast({
          title: "Sucesso!",
          description: `Venda #${venda.numeroVenda} editada com sucesso.`,
        });
        
        onVendaEditada(vendaEditada);
        onOpenChange(false);
      } else {
        throw new Error('Erro ao editar venda');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível editar a venda.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const getPaymentLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão Crédito', 
      'cartao_debito': 'Cartão Débito',
      'pix': 'PIX',
      'apagar': 'À Pagar'
    };
    return tipos[tipo] || tipo;
  };

  if (!venda) return null;

  const totalOriginal = venda.itens.reduce((sum, item) => sum + item.subtotal, 0);
  const totalEditado = calcularTotal();
  const diferenca = totalEditado - totalOriginal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Venda #{venda.numeroVenda}
          </DialogTitle>
          <DialogDescription>
            Modifique os itens desta venda. Alterações serão registradas no histórico.
          </DialogDescription>
        </DialogHeader>

        {/* Informações da Venda */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-xs">Data/Hora</Label>
                <p className="font-medium">{new Date(venda.dataVenda).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <Label className="text-xs">Vendedor</Label>
                <p className="font-medium">{venda.usuario?.nome || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs">Pagamento</Label>
                <Badge variant="outline">{getPaymentLabel(venda.formaPagamento)}</Badge>
              </div>
              <div>
                <Label className="text-xs">Tipo Cliente</Label>
                <Badge variant="outline">
                  {venda.tipoCliente === 'colaborador' ? 'Colaborador' : 'Normal'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens da Venda */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Itens da Venda</Label>
            <Button onClick={adicionarItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Item
            </Button>
          </div>

          <div className="space-y-3">
            {itensEditados.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{item.nomeProduto}</span>
                      {venda.tipoCliente === 'normal' && item.saldoEstoque && (
                        <Badge variant="outline" className="text-xs">
                          Estoque: {item.saldoEstoque}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarQuantidade(index, item.quantidade - 1)}
                          disabled={item.quantidade <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => atualizarQuantidade(index, parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                          min="0"
                        />
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarQuantidade(index, item.quantidade + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        R$ {item.precoUnitario.toFixed(2)} un
                      </div>
                      
                      <div className="font-semibold">
                        R$ {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removerItem(index)}
                    disabled={itensEditados.length <= 1}
                    className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Resumo e Totais */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Original:</span>
                <span className="font-medium">R$ {totalOriginal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Editado:</span>
                <span className="font-medium text-green-600">R$ {totalEditado.toFixed(2)}</span>
              </div>
              
              {diferenca !== 0 && (
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm">Diferença:</span>
                  <span className={`font-bold ${diferenca > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diferenca > 0 ? '+' : ''}R$ {Math.abs(diferenca).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={carregando}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          
          <Button
            onClick={salvarEdicao}
            disabled={carregando || itensEditados.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {carregando ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
