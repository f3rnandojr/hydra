"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product, ItemVenda } from "@/lib/definitions";

import { Button } from "@/components/ui/button";
import { ProdutoSearchVenda } from "./produto-search-venda";
import { CarrinhoVenda } from "./carrinho-venda";

const vendaSchema = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.string(),
        nomeProduto: z.string(),
        codigoEAN: z.string().optional().nullable(),
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
  const { control, watch, setValue } = useForm<VendaFormData>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      itens: [],
      total: 0,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "itens",
  });

  const handleProductSelect = (product: Product) => {
    // TODO: Usar preço real do produto
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Adicionar Produtos</h3>
        <ProdutoSearchVenda onProductSelect={handleProductSelect} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Itens da Venda</h3>
        <CarrinhoVenda 
            control={control} 
            remove={remove} 
            update={update}
            watch={watch}
        />
      </div>
    </div>
  );
}