"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ItemVenda, Product } from "@/lib/definitions";
import type { UseFieldArrayRemove, UseFieldArrayUpdate, Control, UseFormWatch } from "react-hook-form";
import { useWatch } from "react-hook-form";

interface VendaCarrinhoProps {
  control: Control<any>;
  remove: UseFieldArrayRemove;
  update: UseFieldArrayUpdate<any>;
  watch: UseFormWatch<any>;
}

export function CarrinhoVenda({ control, remove, update, watch }: VendaCarrinhoProps) {
  const itens = watch("itens") as ItemVenda[];
  
  const handleQuantityChange = (index: number, newQuantity: number) => {
    const item = itens[index];
    if (newQuantity > 0) {
      update(index, {
        ...item,
        quantidade: newQuantity,
        subtotal: newQuantity * item.precoUnitario,
      });
    }
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + (item.subtotal || 0), 0);
  };


  if (!itens || itens.length === 0) {
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
            {itens.map((item, index) => (
              <TableRow key={item.produtoId}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{item.nomeProduto}</div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {/* {item.produto.tipo} */}
                      </Badge>
                      {item.codigoEAN && (
                        <Badge variant="secondary" className="text-xs font-mono">
                          {item.codigoEAN}
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
                      onClick={() => handleQuantityChange(index, item.quantidade - 1)}
                      disabled={item.quantidade <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(index, item.quantidade + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  R$ {item.precoUnitario.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {item.subtotal.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
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
        
        <Button 
          size="lg" 
          className="font-semibold"
          disabled={itens.length === 0}
        >
          Finalizar Venda
        </Button>
      </div>
    </div>
  );
}