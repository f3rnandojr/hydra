"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Save, RefreshCw, Building, MapPin, Phone, Mail, Printer as PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

const fiscalSchema = z.object({
  cnpj: z.string().optional(),
  razaoSocial: z.string().optional(),
  nomeFantasia: z.string().optional(),
  endereco: z.object({
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
  }),
  inscricaoEstadual: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }).or(z.literal("")),
  numeroSat: z.string().optional(),
  modeloSat: z.string().optional(),
});

type FiscalFormData = z.infer<typeof fiscalSchema>;

export function ParametrosFiscais() {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);

  const form = useForm<FiscalFormData>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: {
      cnpj: "",
      razaoSocial: "",
      nomeFantasia: "",
      endereco: {
        logradouro: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
      },
      inscricaoEstadual: "",
      telefone: "",
      email: "",
      numeroSat: "",
      modeloSat: "",
    },
  });
  
  const formValues = form.watch();

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        const response = await fetch('/api/parametros-fiscais');
        if (response.ok) {
          const data = await response.json();
          form.reset(data);
        } else {
          throw new Error("Erro ao carregar dados fiscais.");
        }
      } catch (error) {
        console.error("Erro:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados fiscais.",
          variant: "destructive",
        });
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, [form, toast]);

  const onSubmit = async (data: FiscalFormData) => {
    try {
      const response = await fetch('/api/parametros-fiscais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Dados fiscais atualizados com sucesso.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Não foi possível salvar os dados.");
      }
    } catch (error: any) {
       toast({
        title: "Erro ao Salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (usuario?.tipo !== 'gestor') {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Esta área é restrita para gestores.</p>
            </CardContent>
        </Card>
    );
  }

  if (carregando) {
      return <Skeleton className="w-full h-[600px]" />
  }

  const enderecoCompleto = [
      formValues.endereco?.logradouro,
      formValues.endereco?.numero,
      formValues.endereco?.bairro,
      formValues.endereco?.cidade,
      formValues.endereco?.estado,
      formValues.endereco?.cep
  ].filter(Boolean).join(', ');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Dados Fiscais do Estabelecimento</CardTitle>
            <CardDescription>
              Informações utilizadas para a emissão de cupons fiscais e outros documentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Identificação */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2"><Building className="h-5 w-5"/> Identificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="razaoSocial" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                 <FormField control={form.control} name="nomeFantasia" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>

             {/* Endereço */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2"><MapPin className="h-5 w-5"/> Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 p-4 border rounded-lg">
                    <FormField control={form.control} name="endereco.logradouro" render={({ field }) => (
                        <FormItem className="md:col-span-4">
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl><Input placeholder="Ex: Av. Paulista" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="endereco.numero" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel>Número</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="endereco.bairro" render={({ field }) => (
                        <FormItem className="md:col-span-3">
                            <FormLabel>Bairro</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="endereco.cep" render={({ field }) => (
                        <FormItem className="md:col-span-3">
                            <FormLabel>CEP</FormLabel>
                            <FormControl><Input placeholder="00000-000" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="endereco.cidade" render={({ field }) => (
                        <FormItem className="md:col-span-3">
                            <FormLabel>Cidade</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="endereco.estado" render={({ field }) => (
                        <FormItem className="md:col-span-3">
                            <FormLabel>Estado (UF)</FormLabel>
                            <FormControl><Input placeholder="Ex: SP" maxLength={2} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
            </div>
            
            {/* Contato e Registros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2"><Phone className="h-5 w-5"/> Contato</h3>
                   <div className="space-y-6 p-4 border rounded-lg">
                      <FormField control={form.control} name="telefone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" placeholder="contato@suaempresa.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                   </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2"><PrinterIcon className="h-5 w-5"/> Registros e SAT</h3>
                 <div className="space-y-6 p-4 border rounded-lg">
                    <FormField control={form.control} name="inscricaoEstadual" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Estadual</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="numeroSat" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número SAT</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="modeloSat" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo SAT</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                    </div>
                 </div>
              </div>
            </div>

            {/* Preview do Cupom */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Preview do Cupom</h3>
                <div className="border p-4 bg-gray-50 text-xs font-mono rounded-lg">
                    <div className="text-center font-bold">{formValues.nomeFantasia || "[NOME FANTASIA]"}</div>
                    <div className="text-center">{enderecoCompleto || "[ENDEREÇO COMPLETO]"}</div>
                    <div className="text-center">CNPJ: {formValues.cnpj || "[CNPJ]"} | IE: {formValues.inscricaoEstadual || "[IE]"}</div>
                    <div className="border-t my-2 pt-2 text-center">--- CUPOM FISCAL ---</div>
                    <div className="text-center text-gray-400">...itens da venda aqui...</div>
                </div>
            </div>

          </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
