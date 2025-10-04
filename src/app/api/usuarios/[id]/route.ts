import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

// Schema para validação de atualização
const usuarioUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  tipo: z.enum(["gestor", "usuario"]).optional(),
  status: z.enum(["ativo", "inativo"]).optional()
});

// GET /api/usuarios/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de usuário inválido" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("hydra");

    const usuario = await db.collection("usuarios").findOne(
      { _id: new ObjectId(id) },
      { projection: { senha: 0 } }
    );

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ...usuario, _id: usuario._id.toString() });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// PUT /api/usuarios/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de usuário inválido" }, { status: 400 });
    }

    const body = await request.json();
    const validation = usuarioUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("hydra");

    const updateData: any = { ...validation.data, dataAtualizacao: new Date() };

    // Verificar se o email já está em uso por outro usuário
    if (updateData.email) {
      const usuarioExistente = await db.collection("usuarios").findOne({
        email: updateData.email,
        _id: { $ne: new ObjectId(id) }
      });
      if (usuarioExistente) {
        return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
      }
    }

    const resultado = await db.collection("usuarios").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (resultado.matchedCount === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// DELETE /api/usuarios/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de usuário inválido" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("hydra");

    // Soft delete: apenas muda o status para "inativo"
    const resultado = await db.collection("usuarios").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "inativo", dataAtualizacao: new Date() } }
    );

    if (resultado.matchedCount === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Usuário desativado com sucesso" });
  } catch (error) {
    console.error("Erro ao desativar usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
