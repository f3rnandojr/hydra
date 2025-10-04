"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product, ItemVenda } from "@/lib/definitions";

import { Button } from "@/components/ui/button";
import { ProdutoSearchVenda } from "./produto-search-venda";
import { CarrinhoVenda } from "./carrinho-venda";
import { Card, CardContent } from "@/components/ui/card";

const vendaSchema = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.string(),
        nomeProduto: z.string(),
        codigoEAN: z.string().optional(),
        quantidade: z.number().min(1, "Quantidade deve ser pelo menos 1"),
        precoUnitario: z.number(),
        subtotal: z.number(),
      })
    )
    .min(1, "Adicione pelo menos um item à venda."),
  total: z.number(),
});

type VendaFormData = z.infer<typeof vendaSchema>;

export function VendaForm() {
  const form = useForm<VendaFormData>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      itens: [],
      total: 0,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "itens",
  });

  const handleProductSelect = (product: Product) => {
    // Mock price, replace with real price logic later
    const mockPrice = Math.floor(Math.random() * 20) + 5;
    
    const existingItemIndex = fields.findIndex(
      (item) => item.produtoId === product._id
    );

    if (existingItemIndex > -1) {
      const existingItem = fields[existingItemIndex];
      update(existingItemIndex, {
        ...existingItem,
        quantidade: existingItem.quantidade + 1,
        subtotal: (existingItem.quantidade + 1) * existingItem.precoUnitario,
      });
    } else {
      append({
        produtoId: product._id,
        nomeProduto: product.nome,
        codigoEAN: product.codigoEAN || undefined,
        quantidade: 1,
        precoUnitario: mockPrice,
        subtotal: mockPrice,
      });
    }
  };
  
  const total = fields.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna da Venda (Busca e Carrinho) */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <label className="text-sm font-medium">Buscar Produto (Nome ou EAN)</label>
          <ProdutoSearchVenda onProductSelect={handleProductSelect} />
        </div>
        <Card>
          <CardContent className="p-4">
             <CarrinhoVenda itens={fields} onRemove={remove} onUpdate={update} />
          </CardContent>
        </Card>
      </div>

      {/* Coluna do Resumo e Finalização */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Total da Venda</h2>
            <div className="text-4xl font-bold text-right">
              R$ {total.toFixed(2)}
            </div>
             <Button className="w-full" size="lg" disabled={fields.length === 0}>
                Finalizar Venda
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
