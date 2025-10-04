import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("hydra");

    const usuario = await db.collection("usuarios").findOne({
      email: email,
      senha: senha, // Temporário - vamos criptografar depois
      status: "ativo"
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Retornar dados do usuário (sem senha)
    const { senha: _, ...usuarioSemSenha } = usuario;

    return NextResponse.json({
      usuario: {
        ...usuarioSemSenha,
        _id: usuario._id.toString()
      }
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
