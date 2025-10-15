
"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEntrada } from "@/app/entradas/actions";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/definitions";
import { useAuth } from '@/contexts/auth-context';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronsUpDown, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Schemas
const itemSchema = z.object({
  produtoId: z.string().min(1, "Selecione um produto."),
  produtoNome: z.string(),
  quantidade: z.coerce.number().min(0.01, "Quantidade deve ser positiva."),
  precoCusto: z.coerce.number().min(0.01, "Preço de custo deve ser maior que zero"),
});

const notaFiscalSchema = z.object({
  tipo: z.literal("nota_fiscal"),
  numeroNotaFiscal: z.string().min(1, "Número da nota fiscal é obrigatório."),
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item à nota."),
});

const ajusteSchema = z.object({
  tipo: z.literal("ajuste"),
  produtoId: z.string().min(1, "Selecione um produto."),
  novoSaldo: z.coerce.number().min(0, "O novo saldo não pode ser negativo."),
});

const formSchema = z.discriminatedUnion("tipo", [notaFiscalSchema, ajusteSchema]);

type FormData = z.infer<typeof formSchema>;

type EntradaFormProps = {
  onSuccess: () => void;
};

// Função para obter valores padrão com base na aba
function getDefaultValues(tab: "nota_fiscal" | "ajuste") {
  if (tab === 'nota_fiscal') {
    return { 
      tipo: "nota_fiscal" as const, 
      numeroNotaFiscal: "", 
      itens: [] 
    };
  }
  return { 
    tipo: "ajuste" as const, 
    produtoId: "", 
    novoSaldo: 0 
  };
}

export function EntradaForm({ onSuccess }: EntradaFormProps) {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cafeteria, setCafeteria] = useState("cafeteria_01");

  const [habilitarNotaFiscal, setHabilitarNotaFiscal] = useState(false);
  const [carregandoParam, setCarregandoParam] = useState(true);
  const [activeTab, setActiveTab] = useState<"nota_fiscal" | "ajuste">("ajuste");
  const [initialLoad, setInitialLoad] = useState(true);

  // Busca do parâmetro
  useEffect(() => {
    async function fetchParam() {
      try {
        setCarregandoParam(true);
        const response = await fetch('/api/parametros?chave=HABILITAR_ENTRADA_NOTA_FISCAL');
        const param = await response.json();
        const habilitado = param.valor === 'sim';
        setHabilitarNotaFiscal(habilitado);
        
        if (initialLoad) {
          setActiveTab(habilitado ? "nota_fiscal" : "ajuste");
          setInitialLoad(false);
        }
      } catch (error) {
        console.error("Erro ao buscar parâmetro de nota fiscal", error);
        setHabilitarNotaFiscal(false);
        if (initialLoad) {
          setActiveTab("ajuste");
          setInitialLoad(false);
        }
      } finally {
        setCarregandoParam(false);
      }
    }
    fetchParam();
  }, [initialLoad]);

  const form = useForm<FormData>({
    resolver: zodResolver(activeTab === 'nota_fiscal' ? notaFiscalSchema : ajusteSchema),
    defaultValues: getDefaultValues(activeTab),
  });
  
  // Reseta o formulário quando a aba muda para garantir a validação correta
  React.useEffect(() => {
    form.reset(getDefaultValues(activeTab));
  }, [activeTab, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens" as any, 
  });
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("tipo", data.tipo);
    formData.append("cafeteria", cafeteria); 

    if (data.tipo === 'nota_fiscal') {
      formData.append("numeroNotaFiscal", data.numeroNotaFiscal);
      formData.append("itens", JSON.stringify(data.itens.map(it => ({produtoId: it.produtoId, quantidade: it.quantidade, precoCusto: it.precoCusto}))));
    } else { 
      formData.append("produtoId", data.produtoId);
      formData.append("novoSaldo", String(data.novoSaldo));
    }
    
    try {
        const result = await createEntrada(null, formData, usuario?._id);
        if (result.message && !result.errors) {
            toast({
                title: "Sucesso!",
                description: result.message,
            });
            onSuccess();
        } else {
            toast({
                title: "Erro na Operação",
                description: result.message || "Ocorreu um erro desconhecido.",
                variant: "destructive",
            });
        }
    } catch (error) {
         toast({
            title: "Erro Inesperado",
            description: "Não foi possível registrar a entrada.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (carregandoParam) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormItem>
          <FormLabel>Cafeteria</FormLabel>
          <Select value={cafeteria} onValueChange={setCafeteria}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cafeteria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cafeteria_01">Cafeteria 01</SelectItem>
              <SelectItem value="cafeteria_02">Cafeteria 02</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Selecione a cafeteria onde o estoque será registrado
          </FormDescription>
        </FormItem>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className={cn("grid w-full", habilitarNotaFiscal ? "grid-cols-2" : "grid-cols-1")}>
            {habilitarNotaFiscal && <TabsTrigger value="nota_fiscal">Nota Fiscal</TabsTrigger>}
            <TabsTrigger value="ajuste">Ajuste de Estoque</TabsTrigger>
          </TabsList>

          {habilitarNotaFiscal && (
            <TabsContent value="nota_fiscal" className="space-y-4">
              <FormField
                control={form.control}
                name="numeroNotaFiscal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Nota Fiscal</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 123456" 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Itens da Nota</h3>
                <ProductSearch onProductSelect={(product) => append({ produtoId: product._id.toString(), produtoNome: product.nome, quantidade: 1, precoCusto: 0 })} />
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-[120px]">Quantidade</TableHead>
                        <TableHead className="w-[150px]">Preço Custo (R$)</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{(item as any).produtoNome}</TableCell>
                          <TableCell>
                            <FormField
                                control={form.control}
                                name={`itens.${index}.quantidade` as any}
                                render={({ field }) => (
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                )}
                              />
                          </TableCell>
                          <TableCell>
                            <FormField
                                control={form.control}
                                name={`itens.${index}.precoCusto` as any}
                                render={({ field }) => (
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0,00"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                )}
                              />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum item adicionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {form.formState.errors.itens && <p className="text-sm font-medium text-destructive">{form.formState.errors.itens.message || form.formState.errors.itens.root?.message}</p>}
              </div>
            </TabsContent>
          )}

          <TabsContent value="ajuste" className="space-y-4">
             <FormField
                control={form.control}
                name="produtoId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Produto</FormLabel>
                    <ProductSearch 
                      onProductSelect={(product) => form.setValue('produtoId', product._id.toString())} 
                      selectedProductId={field.value}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="novoSaldo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo Saldo de Estoque</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ex: 50" 
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>Informe a quantidade correta do produto em estoque.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar Entrada"}
          </Button>
        </div>
      </form>
    </Form>
  );
}


function ProductSearch({ onProductSelect, selectedProductId }: { onProductSelect: (product: Product) => void, selectedProductId?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const fetchProducts = React.useCallback(async () => {
      if (query.length === 0) {
        setProducts([]);
        return;
      }
      const response = await fetch(`/api/produtos/search?q=${encodeURIComponent(query)}`);
      const data: Product[] = await response.json();
      setProducts(data);
      if (data.length === 1 && /^\d{13}$/.test(query)) {
        handleSelect(data[0]);
      }
  }, [query]);

  useEffect(() => {
    const isEAN = /^\d{13}$/.test(query);
    if (isEAN) {
      fetchProducts();
    } else {
      const debounce = setTimeout(() => {
        fetchProducts();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [query, fetchProducts]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const input = document.querySelector('input[placeholder="Digite o nome ou EAN do produto..."]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      setSelectedProduct(products.find(p => p._id.toString() === selectedProductId) || null);
    } else if (!selectedProductId) {
       setSelectedProduct(null);
    }
  }, [selectedProductId, products]);

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setSelectedProduct(product);
    setOpen(false);
    setQuery("");
  };
  
  const triggerText = selectedProduct ? selectedProduct.nome : "Buscar produto...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {triggerText}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Digite o nome ou EAN do produto..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product._id.toString()}
                  onSelect={() => handleSelect(product)}
                >
                  {product.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
