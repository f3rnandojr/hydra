"use client";

import { useState } from "react";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import {
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
} from "@/app/colaboradores/actions";

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

import { CollaboratorForm } from "./form";
import type { Collaborator } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";

export function CreateCollaboratorButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Colaborador</DialogTitle>
        </DialogHeader>
        <CollaboratorForm
          action={createCollaborator}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditCollaboratorButton({
  collaborator,
}: {
  collaborator: Collaborator;
}) {
  const [open, setOpen] = useState(false);
  const updateCollaboratorWithId = updateCollaborator.bind(null, collaborator._id.toString());

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
          <DialogTitle>Editar Colaborador</DialogTitle>
        </DialogHeader>
        <CollaboratorForm
          collaborator={collaborator}
          action={updateCollaboratorWithId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCollaboratorButton({ id }: { id: string }) {
  const { toast } = useToast();
  
  const handleDelete = async () => {
    const result = await deleteCollaborator(id);
    if (result.message) {
      toast({
        title: "Sucesso!",
        description: result.message,
      });
    } else {
       toast({
        title: "Erro",
        description: "Ocorreu um erro.",
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
            Essa ação não pode ser desfeita. Isso irá marcar o colaborador como
            excluído.
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
