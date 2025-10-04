"use client";

import { ItemVenda } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import type { UseFieldArrayRemove, UseFieldArrayUpdate } from "react-hook-form";

interface CarrinhoVendaProps {
  itens: ItemVenda[];
  onRemove: UseFieldArrayRemove;
  onUpdate: UseFieldArrayUpdate<any>;
}

export function CarrinhoVenda({ itens, onRemove, onUpdate }: CarrinhoVendaProps) {

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const item = itens[index];
    if (newQuantity > 0) {
      onUpdate(index, {
        ...item,
        quantidade: newQuantity,
        subtotal: newQuantity * item.precoUnitario,
      });
    }
  };

  if (itens.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        O carrinho está vazio.
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="w-[100px]">Qtd.</TableHead>
            <TableHead className="w-[120px] text-right">Subtotal</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item, index) => (
            <TableRow key={item.produtoId}>
              <TableCell className="font-medium">{item.nomeProduto}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantidade}
                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10))}
                  className="h-8 w-20 text-center"
                  min="1"
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                R$ {item.subtotal.toFixed(2)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
