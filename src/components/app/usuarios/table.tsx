"use client";

import type { Usuario } from "@/lib/definitions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditUsuarioButton, DeleteUsuarioButton } from "./buttons";

export function UsuariosTable({
  usuarios,
  onSuccess,
}: {
  usuarios: Usuario[];
  onSuccess: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario._id.toString()}>
              <TableCell className="font-medium">{usuario.nome}</TableCell>
              <TableCell>{usuario.email}</TableCell>
              <TableCell className="capitalize">{usuario.tipo}</TableCell>
              <TableCell>
                <Badge variant={usuario.status === 'ativo' ? 'default' : 'secondary'} className={usuario.status === 'ativo' ? 'bg-green-500/80 hover:bg-green-500/90' : ''}>
                  {usuario.status === 'ativo' ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <EditUsuarioButton usuario={usuario} onSuccess={onSuccess} />
                  <DeleteUsuarioButton id={usuario._id.toString()} onSuccess={onSuccess} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
