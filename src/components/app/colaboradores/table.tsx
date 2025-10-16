"use client";

import type { Collaborator } from "@/lib/definitions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  EditCollaboratorButton,
  DeleteCollaboratorButton,
} from "./buttons";

export function CollaboratorsTable({
  collaborators,
}: {
  collaborators: Collaborator[];
}) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Matrícula</TableHead>
            <TableHead className="hidden lg:table-cell">Setor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collaborators.map((c) => (
            <TableRow key={c._id.toString()}>
              <TableCell className="font-medium">{c.nome}</TableCell>
              <TableCell className="hidden md:table-cell">{c.email}</TableCell>
              <TableCell className="hidden lg:table-cell">{c.matricula || "-"}</TableCell>
              <TableCell className="hidden lg:table-cell">{c.setor || "-"}</TableCell>
              <TableCell>
                <Badge variant={c.status ? "default" : "secondary"} className={c.status ? 'bg-green-500/80 hover:bg-green-500/90' : ''}>
                  {c.status ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <EditCollaboratorButton collaborator={c} />
                  <DeleteCollaboratorButton id={c._id.toString()} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
