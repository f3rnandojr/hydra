"use client";

import React, { useEffect } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Collaborator } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";

const collaboratorSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  status: z.boolean().default(true),
});

const createSchema = collaboratorSchema.extend({
    senha: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres." }),
});

const updateSchema = collaboratorSchema.extend({
    senha: z.string().optional(),
});


type CollaboratorFormProps = {
  collaborator?: Collaborator;
  action: (prevState: any, formData: FormData) => Promise<{ message: string; errors?: any }>;
  onSuccess: () => void;
};

export function CollaboratorForm({ collaborator, action, onSuccess }: CollaboratorFormProps) {
  const [state, formAction] = useFormState(action, { message: "" });
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(collaborator ? updateSchema : createSchema),
    defaultValues: {
      nome: collaborator?.nome || "",
      email: collaborator?.email || "",
      senha: "",
      status: collaborator?.status ?? true,
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
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="senha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>
                {collaborator ? "Deixe em branco para não alterar." : "Mínimo de 6 caracteres."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Status</FormLabel>
                <FormDescription>
                  {field.value ? "Colaborador ativo." : "Colaborador inativo."}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {collaborator ? "Salvar Alterações" : "Criar Colaborador"}
        </Button>
      </form>
    </Form>
  );
}
