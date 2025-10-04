"use client";

import { useState, useEffect } from "react";
import { Search, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/definitions";

interface VendaProdutoSearchProps {
  onProductSelect: (produto: Product) => void;
}

export function ProdutoSearchVenda({ onProductSelect }: VendaProdutoSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function buscarProdutos() {
      if (query.length < 1) {
        setProdutos([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/produtos?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setProdutos(data);
        if (data.length > 0) {
            setOpen(true);
        }
        if (/^\d{13}$/.test(query) && data.length === 1) {
          handleSelecionarProduto(data[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        setProdutos([]);
      } finally {
        setIsLoading(false);
      }
    }

    const isEAN = /^\d{13}$/.test(query);
    if (isEAN) {
      buscarProdutos();
    } else {
      const timeoutId = setTimeout(buscarProdutos, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [query]);

  const handleSelecionarProduto = (produto: Product) => {
    onProductSelect(produto);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o nome ou EAN do produto..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Buscando..." : "Nenhum produto encontrado"}
              </CommandEmpty>
              <CommandGroup>
                {produtos.map((produto) => (
                  <CommandItem
                    key={produto._id.toString()}
                    value={produto._id.toString()}
                    onSelect={() => handleSelecionarProduto(produto)}
                    className="flex flex-col items-start py-3"
                  >
                    <div className="flex justify-between w-full">
                      <span className="font-medium">{produto.nome}</span>
                      <Badge variant="outline" className="ml-2">
                        Estoque: {produto.saldo}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {produto.tipo}
                      </Badge>
                      {produto.codigoEAN && (
                        <Badge variant="outline" className="text-xs font-mono">
                          EAN: {produto.codigoEAN}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/^\d+$/.test(query) && query.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Barcode className="h-3 w-3" />
          <span>Buscando por código EAN...</span>
        </div>
      )}
    </div>
  );
}