"use client";

import type { Cafeteria } from "@/lib/definitions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function CafeteriasTable({
  cafeterias,
}: {
  cafeterias: Cafeteria[];
}) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Código</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cafeterias.map((c) => (
            <TableRow key={c._id.toString()}>
              <TableCell className="font-medium">{c.nome}</TableCell>
              <TableCell className="hidden md:table-cell font-mono">{c.codigo}</TableCell>
              <TableCell>
                <Badge variant={c.status ? "default" : "secondary"} className={c.status ? 'bg-green-500/80 hover:bg-green-500/90' : ''}>
                  {c.status ? "Ativa" : "Inativa"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  {/* Action buttons will go here */}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
