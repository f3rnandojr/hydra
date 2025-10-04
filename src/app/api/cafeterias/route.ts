import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';

const cafeteriaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
  codigo: z.string().min(3, "Código deve ter no mínimo 3 caracteres.").regex(/^[A-Z0-9_]+$/, "Código deve conter apenas letras maiúsculas, números e underscore."),
  status: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('hydra');
    
    const cafeterias = await db.collection('cafeterias')
      .find({})
      .sort({ nome: 1 })
      .toArray();
    
    const formattedCafeterias = cafeterias.map(c => ({
      ...c,
      _id: c._id.toString(),
    }));
    
    return NextResponse.json(formattedCafeterias);
  } catch (error) {
    console.error('Erro ao buscar cafeterias:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar cafeterias' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = cafeteriaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Dados da cafeteria inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nome, codigo, status } = validation.data;

    const client = await clientPromise;
    const db = client.db("hydra");

    // Verificar se código já existe
    const existing = await db.collection('cafeterias').findOne({ codigo });
    if (existing) {
        return NextResponse.json({ message: `O código '${codigo}' já está em uso.` }, { status: 409 });
    }

    const newCafeteria = {
      nome,
      codigo,
      status,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    };

    const result = await db.collection("cafeterias").insertOne(newCafeteria);

    const createdCafeteria = {
      _id: result.insertedId.toString(),
      ...newCafeteria
    }

    return NextResponse.json({ message: "Cafeteria criada com sucesso!", cafeteria: createdCafeteria }, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar cafeteria:", error);
    return NextResponse.json({ message: "Falha ao criar cafeteria." }, { status: 500 });
  }
}
