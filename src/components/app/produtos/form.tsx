"use client";

import React, { useEffect, useActionState } from "react";
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

const productSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
  tipo: z.enum(["alimento", "bebida"]),
  estoqueMinimo: z.coerce.number().optional().nullable(),
});

type ProductFormProps = {
  product?: Product;
  action: (prevState: any, formData: FormData) => Promise<{ message: string; errors?: any }>;
  onSuccess: () => void;
};

export function ProductForm({ product, action, onSuccess }: ProductFormProps) {
  const [state, formAction] = useActionState(action, { message: "" });
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nome: product?.nome || "",
      tipo: product?.tipo || "alimento",
      estoqueMinimo: product?.estoqueMinimo || undefined,
    },
  });

  useEffect(() => {
    if (state.message && !state.errors) {
      toast({
        title: "Sucesso!",
        description: state.message,
      });
      onSuccess();
    } else if (state.message && state.errors) {
       toast({
        title: "Erro",
        description: state.message,
        variant: "destructive",
       });
    }
  }, [state, toast, onSuccess]);


  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
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
                <Input type="number" placeholder="Opcional" {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormDescription>
                Deixe em branco se não houver estoque mínimo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {product ? "Salvar Alterações" : "Criar Produto"}
        </Button>
      </form>
    </Form>
  );
}
