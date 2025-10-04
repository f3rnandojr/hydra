"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createUsuario as dbCreateUsuario,
  updateUsuario as dbUpdateUsuario,
  deleteUsuario as dbDeleteUsuario,
} from "@/lib/data";

const baseSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
  email: z.string().email("Email inválido."),
  tipo: z.enum(["gestor", "usuario"]),
  status: z.enum(["ativo", "inativo"]),
});

const createSchema = baseSchema.extend({
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

const updateSchema = baseSchema.extend({
  senha: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres").optional().or(z.literal('')),
});

export async function createUsuario(formData: FormData) {
  const validatedFields = createSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Erro de validação.",
    };
  }

  try {
    await dbCreateUsuario(validatedFields.data);
    revalidatePath("/usuarios");
    return { message: "Usuário criado com sucesso." };
  } catch (e: any) {
    return { message: e.message || "Falha ao criar usuário." };
  }
}

export async function updateUsuario(id: string, formData: FormData) {
  const validatedFields = updateSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Erro de validação.",
    };
  }

  try {
    const { senha, ...data } = validatedFields.data;
    const dataToUpdate: any = data;
    if (senha) {
      dataToUpdate.senha = senha;
    }

    await dbUpdateUsuario(id, dataToUpdate);
    revalidatePath("/usuarios");
    return { message: "Usuário atualizado com sucesso." };
  } catch (e: any) {
    return { message: e.message || "Falha ao atualizar usuário." };
  }
}

export async function deleteUsuario(id: string) {
  try {
    await dbDeleteUsuario(id);
    revalidatePath("/usuarios");
    return { message: "Usuário excluído com sucesso." };
  } catch (e: any) {
    return { message: e.message || "Falha ao excluir usuário." };
  }
}
