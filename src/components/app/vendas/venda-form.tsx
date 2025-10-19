"use client";

import { useState } from "react";
import { Users, User, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProdutoSearchVenda } from "./produto-search-venda";
import { CarrinhoVenda } from "./carrinho-venda";
import { FinalizarVenda } from "./finalizar-venda";
import { VendasRecentes } from "./vendas-recentes";
import { EditarVendaModal } from "./editar-venda-modal";
import type { Product, Venda } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
    produtoId: string;
    saldoEstoque?: number;
  }>;
}

export function VendaForm() {
  const { toast } = useToast();
  const [itensVenda, setItensVenda] = useState<Array<{
    produto: Product;
    quantidade: number;
    precoUnitario: number;
  }>>([]);
  
  const [finalizarOpen, setFinalizarOpen] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaCompleta | null>(null);
  const [tipoCliente, setTipoCliente] = useState<"normal" | "colaborador">("normal");

  const adicionarItem = (produto: Product) => {
    if (produto.saldo <= 0 && tipoCliente === 'normal') {
      toast({
        title: "Produto sem estoque",
        description: `O produto "${produto.nome}" não está disponível no estoque.`,
        variant: "destructive",
      });
      return;
    }

    const itemExistente = itensVenda.find(item => 
      item.produto._id.toString() === produto._id.toString()
    );

    if (itemExistente) {
      if (itemExistente.quantidade >= produto.saldo && tipoCliente === 'normal') {
        toast({
          title: "Limite de Estoque Atingido",
          description: `Você já adicionou todo o estoque disponível para "${produto.nome}".`,
          variant: "destructive"
        });
        return;
      }
      setItensVenda(prev => 
        prev.map(item =>
          item.produto._id.toString() === produto._id.toString()
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      setItensVenda(prev => [
        ...prev,
        {
          produto,
          quantidade: 1,
          precoUnitario: produto.precoVenda
        }
      ]);
    }
  };

  const removerItem = (produtoId: string) => {
    setItensVenda(prev => prev.filter(item => 
      item.produto._id.toString() !== produtoId
    ));
  };

  const atualizarQuantidade = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerItem(produtoId);
      return;
    }
    
    const item = itensVenda.find(item => item.produto._id.toString() === produtoId);
    if (item && quantidade > item.produto.saldo && tipoCliente === 'normal') {
      toast({
        title: "Estoque Insuficiente",
        description: `A quantidade para "${item.produto.nome}" não pode exceder o estoque de ${item.produto.saldo}.`,
        variant: "destructive",
      });
      return;
    }

    setItensVenda(prev =>
      prev.map(item =>
        item.produto._id.toString() === produtoId
          ? { ...item, quantidade }
          : item
      )
    );
  };

  const handleVendaFinalizada = (venda: Venda) => {
    setItensVenda([]);
    setTipoCliente("normal");
    toast({
      title: "Venda Finalizada!",
      description: `Venda #${venda.numeroVenda} registrada com sucesso.`,
    });
  };

  const handleEditarVenda = (venda: VendaCompleta) => {
    setVendaSelecionada(venda);
    setModalEdicaoAberto(true);
  };

  const handleVendaEditada = (vendaEditada: VendaCompleta) => {
    toast({
      title: "Venda Editada!",
      description: `Venda #${vendaEditada.numeroVenda} atualizada com sucesso.`,
    });
  };

  const handleVendaAtualizada = () => {
    // Pode ser usado para recarregar dados se necessário
  };

  return (
    <div className="space-y-6">
       {/* Layout em Grid - Nova Venda + Vendas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna da Esquerda - Nova Venda */}
        <div className="space-y-6">
           {/* Seletor de Tipo de Cliente */}
          <div className="space-y-3">
            <Label className="text-base">Tipo de Cliente</Label>
            <RadioGroup 
              value={tipoCliente} 
              onValueChange={(value: "normal" | "colaborador") => setTipoCliente(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Cliente Normal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="colaborador" id="colaborador" />
                <Label htmlFor="colaborador" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Colaborador
                </Label>
              </div>
            </RadioGroup>
            
            {/* Indicador Visual */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${
              tipoCliente === "colaborador" 
                ? "bg-accent/10 text-accent-foreground border-accent/20" 
                : "bg-muted text-muted-foreground border-border"
            }`}>
              {tipoCliente === "colaborador" ? (
                <>
                  <Users className="h-3 w-3" />
                  Venda para colaborador
                </>
              ) : (
                <>
                  <User className="h-3 w-3" />
                  Venda para cliente normal
                </>
              )}
            </div>
          </div>

          {/* Busca de Produtos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adicionar Produtos</h3>
            <ProdutoSearchVenda 
              onProductSelect={adicionarItem} 
              tipoCliente={tipoCliente}
            />
          </div>

          {/* Carrinho de Venda */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Itens da Venda</h3>
            <CarrinhoVenda
              itens={itensVenda}
              onRemoverItem={removerItem}
              onAtualizarQuantidade={atualizarQuantidade}
            />
          </div>

          {/* Botão Finalizar */}
          {itensVenda.length > 0 && (
            <div className="flex justify-end">
              <Button 
                size="lg" 
                onClick={() => setFinalizarOpen(true)}
                className="font-semibold"
              >
                Finalizar Venda
              </Button>
            </div>
          )}
        </div>

        {/* Coluna da Direita - Vendas Recentes */}
        <div>
          <VendasRecentes 
            onEditarVenda={handleEditarVenda}
            onVendaAtualizada={handleVendaAtualizada}
          />
        </div>
      </div>

      {/* Modal de Finalização */}
      <FinalizarVenda
        open={finalizarOpen}
        onOpenChange={setFinalizarOpen}
        itens={itensVenda}
        tipoCliente={tipoCliente}
        onVendaFinalizada={handleVendaFinalizada}
      />

      {/* Modal de Edição */}
      <EditarVendaModal
        open={modalEdicaoAberto}
        onOpenChange={setModalEdicaoAberto}
        venda={vendaSelecionada}
        onVendaEditada={handleVendaEditada}
      />
    </div>
  );
}
