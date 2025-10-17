"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Setor } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";

const setorSchema = z.object({
  nome: z.string().min(3, "Nome do setor deve ter no mínimo 3 caracteres.").trim().toUpperCase(),
  status: z.enum(["ativo", "inativo"]),
});

type FormValues = z.infer<typeof setorSchema>;

type SetorFormProps = {
  setor?: Setor;
  onSuccess: () => void;
};

export function SetorForm({ setor, onSuccess }: SetorFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(setorSchema),
    defaultValues: {
      nome: setor?.nome || "",
      status: setor?.status || "ativo",
    },
  });

  const { formState, handleSubmit } = form;

  const processForm: SubmitHandler<FormValues> = async (data) => {
    try {
        const url = setor ? `/api/setores/${setor._id}` : '/api/setores';
        const method = setor ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            toast({
                title: "Sucesso!",
                description: result.message,
            });
            onSuccess();
        } else {
            throw new Error(result.message || "Ocorreu um erro");
        }
    } catch (error: any) {
        toast({
            title: "Erro",
            description: error.message,
            variant: "destructive",
        });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(processForm)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Setor</FormLabel>
              <FormControl>
                <Input placeholder="Ex: FINANCEIRO" {...field} disabled={formState.isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={formState.isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Salvando..." : (setor ? "Salvar Alterações" : "Criar Setor")}
        </Button>
      </form>
    </Form>
  );
}
