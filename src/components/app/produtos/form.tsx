"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { Product } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { validarEAN13 } from "@/lib/validators";

const productSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
  tipo: z.enum(["alimento", "bebida"]),
  codigoEAN: z.string()
    .optional()
    .nullable()
    .refine((ean) => !ean || validarEAN13(ean), {
      message: "Código EAN-13 inválido"
    }),
  estoqueMinimo: z.coerce.number().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

type ProductFormProps = {
  product?: Product;
  action: (prevState: any, formData: FormData) => Promise<{ message: string; errors?: any }>;
  onSuccess: () => void;
};

export function ProductForm({ product, action, onSuccess }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nome: product?.nome || "",
      tipo: product?.tipo || "alimento",
      codigoEAN: product?.codigoEAN || "",
      estoqueMinimo: product?.estoqueMinimo || null,
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    // Manually build formData to handle null/optional values correctly
    formData.append('nome', data.nome);
    formData.append('tipo', data.tipo);
    if (data.codigoEAN) {
      formData.append('codigoEAN', data.codigoEAN);
    }
    if (data.estoqueMinimo !== null && data.estoqueMinimo !== undefined) {
      formData.append('estoqueMinimo', String(data.estoqueMinimo));
    }


    try {
      const result = await action(null, formData);
      
      if (result.message && !result.errors) {
        toast({
          title: "Sucesso!",
          description: result.message,
        });
        onSuccess();
      } else if (result.message) {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        });
        // You could use form.setError here if the errors object matches
      }
    } catch (error) {
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro ao processar o formulário.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="codigoEAN"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código EAN</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: 7891234567890" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Código de barras EAN-13 (opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="alimento">Alimento</SelectItem>
                            <SelectItem value="bebida">Bebida</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="estoqueMinimo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estoque Mínimo</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Opcional" 
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Deixe em branco se não houver estoque mínimo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {product ? "Salvar Alterações" : "Criar Produto"}
        </Button>
      </form>
    </Form>
  );
}
