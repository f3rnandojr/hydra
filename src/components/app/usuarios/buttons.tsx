"use client";

import { useState } from "react";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import {
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "@/app/usuarios/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UsuarioForm } from "./form";
import type { Usuario } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";

export function CreateUsuarioButton({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Usuário do Sistema</DialogTitle>
        </DialogHeader>
        <UsuarioForm
          action={createUsuario}
          onSuccess={() => {
            setOpen(false);
            onSuccess();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditUsuarioButton({
  usuario,
  onSuccess,
}: {
  usuario: Usuario;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const updateUsuarioWithId = updateUsuario.bind(null, usuario._id.toString());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <UsuarioForm
          usuario={usuario}
          action={updateUsuarioWithId}
          onSuccess={() => {
            setOpen(false);
            onSuccess();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteUsuarioButton({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();

  const handleDelete = async () => {
    const result = await deleteUsuario(id);
    if (result.message && !result.errors) {
      toast({
        title: "Sucesso!",
        description: result.message,
      });
      onSuccess();
    } else {
      toast({
        title: "Erro",
        description: result.message || "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Excluir</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso irá inativar o usuário permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}