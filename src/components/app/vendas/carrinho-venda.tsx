"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";

interface VendaItem {
  produto: Product;
  quantidade: number;
  precoUnitario: number;
}

interface VendaCarrinhoProps {
  itens: VendaItem[];
  onRemoverItem: (produtoId: string) => void;
  onAtualizarQuantidade: (produtoId: string, quantidade: number) => void;
}

export function CarrinhoVenda({ itens, onRemoverItem, onAtualizarQuantidade }: VendaCarrinhoProps) {
  const { toast } = useToast();

  const handleQuantityChange = (item: VendaItem, newQuantity: number) => {
    if (newQuantity > item.produto.saldo) {
      toast({
        title: "Estoque Insuficiente",
        description: `A quantidade para "${item.produto.nome}" não pode exceder o estoque de ${item.produto.saldo}.`,
        variant: "destructive",
      });
      onAtualizarQuantidade(item.produto._id.toString(), item.produto.saldo);
    } else {
      onAtualizarQuantidade(item.produto._id.toString(), newQuantity);
    }
  };
  
  const calcularSubtotal = (item: VendaItem) => {
    return item.quantidade * item.precoUnitario;
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + calcularSubtotal(item), 0);
  };

  if (itens.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum produto adicionado à venda.</p>
        <p className="text-sm">Use a busca acima para adicionar produtos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-center">Quantidade</TableHead>
              <TableHead className="text-right">Preço Unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((item) => (
              <TableRow key={item.produto._id.toString()}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{item.produto.nome}</div>
                    <div className="flex gap-2">
                       {item.produto.codigoEAN && (
                          <Badge variant="secondary" className="text-xs font-mono">
                            {item.produto.codigoEAN}
                          </Badge>
                        )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item, item.quantidade - 1)}
                      disabled={item.quantidade <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={item.produto.saldo}
                      value={item.quantidade}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item, item.quantidade + 1)}
                      disabled={item.quantidade >= item.produto.saldo}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    Estoque: {item.produto.saldo}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  R$ {item.precoUnitario.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {calcularSubtotal(item).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoverItem(item.produto._id.toString())}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

       {/* Resumo do Total */}
      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'} na venda
          </div>
          <div className="text-lg font-semibold">
            Total: R$ {calcularTotal().toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
