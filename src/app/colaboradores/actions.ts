"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createCollaborator as dbCreateCollaborator,
  updateCollaborator as dbUpdateCollaborator,
  deleteCollaborator as dbDeleteCollaborator,
} from "@/lib/data";

const collaboratorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
  email: z.string().email("Email inválido."),
  setor: z.string().optional(),
  matricula: z.string().optional(),
  status: z.boolean().default(true),
});

const createCollaboratorSchema = collaboratorSchema.extend({
    senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres."),
});

const updateCollaboratorSchema = collaboratorSchema.extend({
    senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres.").optional().or(z.literal('')),
});


export async function createCollaborator(prevState: any, formData: FormData) {
  const validatedFields = createCollaboratorSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Erro de validação.",
    };
  }
  
  try {
    const { nome, email, senha, status, setor, matricula } = validatedFields.data;
    await dbCreateCollaborator({ nome, email, senha, status, setor, matricula });
    revalidatePath("/colaboradores");
    return { message: "Colaborador criado com sucesso." };
  } catch (e) {
    return { message: "Falha ao criar colaborador." };
  }
}

export async function updateCollaborator(id: string, prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    // Se a senha estiver vazia, remove do objeto para não validar o mínimo de 6 caracteres
    if (!rawData.senha) {
        delete rawData.senha;
    }

    const validatedFields = updateCollaboratorSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Erro de validação.",
        };
    }

    try {
        const { senha, ...rest } = validatedFields.data;
        const dataToUpdate: any = {
            ...rest,
        };

        if (senha) {
            dataToUpdate.senha = senha;
        }

        await dbUpdateCollaborator(id, dataToUpdate);
        revalidatePath("/colaboradores");
        return { message: "Colaborador atualizado com sucesso." };
    } catch (e) {
        return { message: "Falha ao atualizar colaborador." };
    }
}

export async function deleteCollaborator(id: string) {
    try {
        await dbDeleteCollaborator(id);
        revalidatePath("/colaboradores");
        return { message: "Colaborador excluído com sucesso." };
    } catch (e) {
        return { message: "Falha ao excluir colaborador." };
    }
}
