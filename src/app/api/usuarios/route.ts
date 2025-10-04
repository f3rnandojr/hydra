import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

// Schema para validação
const usuarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  tipo: z.enum(["gestor", "usuario"]),
  status: z.enum(["ativo", "inativo"]).default("ativo")
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const client = await clientPromise;
    const db = client.db("hydra");

    const filtro: any = {};
    if (status) filtro.status = status;

    const usuarios = await db.collection("usuarios")
      .find(filtro)
      .project({ senha: 0 }) // Não retornar senha
      .sort({ nome: 1 })
      .toArray();

    return NextResponse.json(usuarios.map(usuario => ({
      ...usuario,
      _id: usuario._id.toString()
    })));
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = usuarioSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("hydra");

    // Verificar se email já existe
    const usuarioExistente = await db.collection("usuarios").findOne({
      email: validation.data.email
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    const usuario = {
      ...validation.data,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    const resultado = await db.collection("usuarios").insertOne(usuario);

    return NextResponse.json({
      _id: resultado.insertedId.toString(),
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      status: usuario.status
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
