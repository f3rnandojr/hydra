import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const setorSchema = z.object({
  nome: z.string().min(3, "Nome do setor deve ter no mínimo 3 caracteres.").trim().toUpperCase(),
  status: z.enum(['ativo', 'inativo']).default('ativo')
});

// GET /api/setores - Listar todos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const client = await clientPromise;
    const db = client.db('hydra');
    
    const query: any = {};
    if (status) {
        query.status = status;
    }

    const setores = await db.collection('setores')
      .find(query)
      .sort({ nome: 1 })
      .toArray();
    
    const formattedSetores = setores.map(c => ({
      ...c,
      _id: c._id.toString(),
    }));
    
    return NextResponse.json(formattedSetores);
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
    return NextResponse.json(
      { message: 'Falha ao buscar setores' }, 
      { status: 500 }
    );
  }
}

// POST /api/setores - Criar setor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = setorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Dados do setor inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nome, status } = validation.data;

    const client = await clientPromise;
    const db = client.db("hydra");

    const setorExistente = await db.collection('setores').findOne({ nome });
    if (setorExistente) {
        return NextResponse.json({ message: `O setor '${nome}' já está cadastrado.` }, { status: 409 });
    }

    const newSetor = {
      nome,
      status,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    };

    const result = await db.collection("setores").insertOne(newSetor);

    const createdSetor = {
      _id: result.insertedId.toString(),
      ...newSetor
    }

    return NextResponse.json({ message: "Setor criado com sucesso!", setor: createdSetor }, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar setor:", error);
    return NextResponse.json({ message: "Falha ao criar setor." }, { status: 500 });
  }
}
