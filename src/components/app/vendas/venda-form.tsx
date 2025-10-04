"use client";

import React, { useState } from "react";
import type { Product, ItemVenda } from "@/lib/definitions";

import { Button } from "@/components/ui/button";
import { ProdutoSearchVenda } from "./produto-search-venda";
import { CarrinhoVenda } from "./carrinho-venda";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";

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
    const { register, control, handleSubmit, watch, setValue } = useForm<VendaFormData>({
        defaultValues: {
            itens: [],
            total: 0,
        }
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "itens",
    });

    const handleProductSelect = (product: Product) => {
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

    const total = watch("itens").reduce((acc, item) => acc + item.subtotal, 0);

    return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Adicionar Produtos</h3>
        <ProdutoSearchVenda onProductSelect={handleProductSelect} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Itens da Venda</h3>
        <CarrinhoVenda itens={fields} onRemove={remove} onUpdate={update} />
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold">
            R$ {total.toFixed(2)}
          </span>
        </div>
      </div>
       <div className="flex justify-end">
            <Button size="lg" disabled={fields.length === 0}>
                Finalizar Venda
            </Button>
       </div>
    </div>
    );
}