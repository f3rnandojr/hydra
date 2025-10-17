"use client";

import type { Setor } from "@/lib/definitions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditSetorButton, DeleteSetorButton } from "./buttons";

export function SetoresTable({
  setores,
  onSuccess,
}: {
  setores: Setor[];
  onSuccess: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Última Atualização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {setores.map((setor) => (
            <TableRow key={setor._id}>
              <TableCell className="font-medium">{setor.nome}</TableCell>
              <TableCell>
                <Badge variant={setor.status === 'ativo' ? 'default' : 'secondary'} className={setor.status === 'ativo' ? 'bg-green-500/80 hover:bg-green-500/90' : ''}>
                  {setor.status === 'ativo' ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {new Date(setor.dataAtualizacao).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <EditSetorButton setor={setor} onSuccess={onSuccess} />
                  <DeleteSetorButton id={setor._id} onSuccess={onSuccess} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
