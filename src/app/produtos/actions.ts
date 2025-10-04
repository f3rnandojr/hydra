"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createProduct as dbCreateProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
} from "@/lib/data";
import { Product } from "@/lib/definitions";
import { validarEAN13 } from "@/lib/validators";

const productSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
  tipo: z.enum(["alimento", "bebida"]),
  codigoEAN: z.string()
    .optional()
    .nullable()
    .refine((ean) => !ean || validarEAN13(ean), {
      message: "Código EAN-13 inválido"
    }),
  precoVenda: z.coerce.number().min(0.01, "Preço de venda deve ser maior que zero"),
  estoqueMinimo: z.coerce.number().optional().nullable(),
});

export async function createProduct(prevState: any, formData: FormData) {
  const validatedFields = productSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Erro de validação.",
    };
  }

  try {
    await dbCreateProduct(validatedFields.data);
    revalidatePath("/produtos");
    return { message: "Produto criado com sucesso." };
  } catch (e: any) {
    return { message: e.message || "Falha ao criar produto." };
  }
}

export async function updateProduct(id: string, prevState: any, formData: FormData) {
    const validatedFields = productSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Erro de validação.",
        };
    }

    try {
        await dbUpdateProduct(id, validatedFields.data);
        revalidatePath("/produtos");
        return { message: "Produto atualizado com sucesso." };
    } catch (e: any) {
        return { message: e.message || "Falha ao atualizar produto." };
    }
}

export async function deleteProduct(id: string) {
    try {
        await dbDeleteProduct(id);
        revalidatePath("/produtos");
        return { message: "Produto excluído com sucesso." };
    } catch (e) {
        return { message: "Falha ao excluir produto." };
    }
}
