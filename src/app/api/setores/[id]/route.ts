import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const setorUpdateSchema = z.object({
  nome: z.string().min(3, "Nome do setor deve ter no mínimo 3 caracteres.").trim().toUpperCase(),
  status: z.enum(['ativo', 'inativo'])
});

// PUT /api/setores/[id] - Atualizar setor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID de setor inválido" }, { status: 400 });
    }

    const body = await request.json();
    const validation = setorUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("hydra");

    const setorExistente = await db.collection("setores").findOne({
      nome: validation.data.nome,
      _id: { $ne: new ObjectId(id) }
    });
    if (setorExistente) {
      return NextResponse.json({ message: `O setor '${validation.data.nome}' já está cadastrado.` }, { status: 409 });
    }

    const resultado = await db.collection("setores").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...validation.data, dataAtualizacao: new Date() } }
    );

    if (resultado.matchedCount === 0) {
      return NextResponse.json({ message: "Setor não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Setor atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar setor:", error);
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}

// DELETE /api/setores/[id] - Inativar setor (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID de setor inválido" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("hydra");

    // Soft delete: apenas muda o status para "inativo"
    const resultado = await db.collection("setores").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "inativo", dataAtualizacao: new Date() } }
    );

    if (resultado.matchedCount === 0) {
      return NextResponse.json({ message: "Setor não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Setor inativado com sucesso" });
  } catch (error) {
    console.error("Erro ao inativar setor:", error);
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
