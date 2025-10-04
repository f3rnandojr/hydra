"use client";

import type { Product } from "@/lib/definitions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditProductButton, DeleteProductButton } from "./buttons";
import { Badge } from "@/components/ui/badge";

export function ProductsTable({ products }: { products: Product[] }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">EAN</TableHead>
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead className="hidden sm:table-cell text-right">Preço</TableHead>
            <TableHead className="hidden md:table-cell text-right">Estoque Mínimo</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p._id.toString()}>
              <TableCell className="font-medium">{p.nome}</TableCell>
              <TableCell className="hidden md:table-cell font-mono text-xs">
                {p.codigoEAN || '-'}
              </TableCell>
              <TableCell className="hidden md:table-cell capitalize">{p.tipo}</TableCell>
              <TableCell className="hidden sm:table-cell text-right">
                {formatPrice(p.precoVenda)}
              </TableCell>
               <TableCell className="hidden md:table-cell text-right">
                {p.estoqueMinimo ?? "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <Badge 
                  variant={p.estoqueMinimo != null && p.saldo < p.estoqueMinimo ? "destructive" : "outline"}
                >
                  {p.saldo}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <EditProductButton product={p} />
                  <DeleteProductButton id={p._id.toString()} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
