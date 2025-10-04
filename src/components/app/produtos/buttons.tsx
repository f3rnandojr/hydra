"use client";

import { useState } from "react";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/produtos/actions";

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

import { ProductForm } from "./form";
import type { Product } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";

export function CreateProductButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
        </DialogHeader>
        <ProductForm
          action={createProduct}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditProductButton({
  product,
}: {
  product: Product;
}) {
  const [open, setOpen] = useState(false);
  const updateProductWithId = updateProduct.bind(null, product._id.toString());

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
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <ProductForm
          product={product}
          action={updateProductWithId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteProductButton({ id }: { id: string }) {
  const { toast } = useToast();
  
  const handleDelete = async () => {
    const result = await deleteProduct(id);
    if (result.message) {
      toast({
        title: "Sucesso!",
        description: result.message,
      });
    } else {
       toast({
        title: "Erro",
        description: result.message || "Ocorreu um erro.",
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
            Essa ação não pode ser desfeita. Isso marcará o produto como
            inativo.
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
