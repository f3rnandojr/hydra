"use client";

import React, { useEffect, useActionState, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEntrada } from "@/app/entradas/actions";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/definitions";

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
import { ChevronsUpDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Schemas
const itemSchema = z.object({
  produtoId: z.string().min(1, "Selecione um produto."),
  produtoNome: z.string(),
  quantidade: z.coerce.number().min(0.01, "Quantidade deve ser positiva."),
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

type FormData = z.infer<typeof notaFiscalSchema> | z.infer<typeof ajusteSchema>;

type EntradaFormProps = {
  onSuccess: () => void;
};

export function EntradaForm({ onSuccess }: EntradaFormProps) {
  const [state, formAction] = useActionState(createEntrada, { message: "" });
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"nota_fiscal" | "ajuste">("nota_fiscal");

  const form = useForm<FormData>({
    resolver: zodResolver(activeTab === 'nota_fiscal' ? notaFiscalSchema : ajusteSchema),
    defaultValues: {
      tipo: activeTab,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens" as any, // HACK: for discriminated union
  });

  // Reset form when tab changes
  useEffect(() => {
    form.reset({ tipo: activeTab });
    if (activeTab === 'nota_fiscal' && 'itens' in form.getValues() && form.getValues().itens?.length === 0) {
      // @ts-ignore
      form.setValue('itens', []);
    }
  }, [activeTab, form]);
  
  useEffect(() => {
    if (state.message && !state.errors) {
      toast({
        title: "Sucesso!",
        description: state.message,
      });
      onSuccess();
    } else if (state.message && state.errors) {
      toast({
        title: "Erro de Validação",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, onSuccess]);

  function handleFormSubmit(data: FormData) {
    const formData = new FormData();
    formData.append("tipo", data.tipo);

    if (data.tipo === 'nota_fiscal') {
      formData.append("numeroNotaFiscal", data.numeroNotaFiscal);
      formData.append("itens", JSON.stringify(data.itens.map(it => ({produtoId: it.produtoId, quantidade: it.quantidade}))));
    } else { // ajuste
      formData.append("produtoId", data.produtoId);
      formData.append("novoSaldo", String(data.novoSaldo));
    }

    formAction(formData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nota_fiscal">Nota Fiscal</TabsTrigger>
            <TabsTrigger value="ajuste">Ajuste de Estoque</TabsTrigger>
          </TabsList>

          {/* NOTA FISCAL */}
          <TabsContent value="nota_fiscal" className="space-y-4">
            <FormField
              control={form.control}
              name="numeroNotaFiscal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Nota Fiscal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Itens da Nota</h3>
              <ProductSearch onProductSelect={(product) => append({ produtoId: product._id.toString(), produtoNome: product.nome, quantidade: 1 })} />
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-[120px]">Quantidade</TableHead>
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
                                <Input type="number" step="0.01" {...field} />
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
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
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

          {/* AJUSTE */}
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
                    <Input type="number" placeholder="Ex: 50" {...field} />
                  </FormControl>
                  <FormDescription>Informe a quantidade correta do produto em estoque.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Registrar Entrada
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

  useEffect(() => {
    async function fetchProducts() {
      if (query.length < 2 && !selectedProductId) return;
      const response = await fetch(`/api/produtos?q=${query}`);
      const data: Product[] = await response.json();
      setProducts(data);
    }
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query, selectedProductId]);

  useEffect(() => {
    if(selectedProductId && products.length > 0) {
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
            placeholder="Digite o nome do produto..."
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
