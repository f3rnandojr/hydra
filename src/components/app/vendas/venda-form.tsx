"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product, ItemVenda } from "@/lib/definitions";

import { ProdutoSearchVenda } from "./produto-search-venda";
import { CarrinhoVenda } from "./carrinho-venda";
import { useToast } from "@/hooks/use-toast";

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
    const { toast } = useToast();
  const { control, watch, setValue, reset } = useForm<VendaFormData>({
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
    const existingItemIndex = fields.findIndex(
      (item) => item.produtoId === product._id
    );

    if (existingItemIndex > -1) {
      const existingItem = fields[existingItemIndex];
       if (existingItem.quantidade >= product.saldo) {
            toast({
                title: "Limite de Estoque Atingido",
                description: `Você já adicionou todo o estoque disponível para "${product.nome}".`,
                variant: "destructive"
            });
            return;
        }
      update(existingItemIndex, {
        ...existingItem,
        quantidade: existingItem.quantidade + 1,
        subtotal: (existingItem.quantidade + 1) * existingItem.precoUnitario,
      });
    } else {
      append({
        produtoId: product._id.toString(),
        nomeProduto: product.nome,
        codigoEAN: product.codigoEAN || undefined,
        quantidade: 1,
        precoUnitario: product.precoVenda, // Usar o preço de venda do produto
        subtotal: product.precoVenda,      // Subtotal inicial é o próprio preço
      });
    }
  };
  
   const handleVendaFinalizada = () => {
    toast({
        title: "Venda Finalizada!",
        description: "A venda foi registrada com sucesso.",
    });
    reset({ itens: [], total: 0 });
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
            onVendaFinalizada={handleVendaFinalizada}
        />
      </div>
    </div>
  );
}
