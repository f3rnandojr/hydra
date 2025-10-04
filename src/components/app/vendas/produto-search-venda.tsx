"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '@/lib/definitions';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface ProdutoSearchVendaProps {
  onProductSelect: (product: Product) => void;
}

export function ProdutoSearchVenda({ onProductSelect }: ProdutoSearchVendaProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchProducts = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    try {
      const response = await fetch(`/api/produtos?q=${encodeURIComponent(searchQuery)}`);
      const data: Product[] = await response.json();
      setResults(data);
      setIsOpen(true);

      // Auto-select if EAN returns one exact match
      if (/^\d{13}$/.test(searchQuery) && data.length === 1) {
        handleSelect(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setResults([]);
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    const isEAN = /^\d{13}$/.test(query);
    if (isEAN) {
      fetchProducts(query);
    } else {
      const debounce = setTimeout(() => {
        if (query) fetchProducts(query);
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [query, fetchProducts]);

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    const input = document.getElementById("product-search-input");
    if (input) (input as HTMLInputElement).focus();
  };

  return (
    <div className="relative">
      <Command shouldFilter={false} className="overflow-visible">
        <CommandInput
          id="product-search-input"
          placeholder="Digite para buscar..."
          value={query}
          onValueChange={setQuery}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onFocus={() => query && results.length > 0 && setIsOpen(true)}
        />
        {isOpen && (
          <div className="absolute top-full z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md mt-1">
            <CommandList>
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              <CommandGroup>
                {results.map((product) => (
                  <CommandItem
                    key={product._id}
                    onSelect={() => handleSelect(product)}
                    value={product.nome}
                  >
                    {product.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}
