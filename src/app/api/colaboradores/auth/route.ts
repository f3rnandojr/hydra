import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcrypt';
import { Collaborator } from '@/lib/definitions';

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

    const colaborador = await db.collection("colaboradores").findOne({
      email: email,
      status: true, // Apenas colaboradores ativos podem logar
      deletedAt: null // E não deletados
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou colaborador inativo" },
        { status: 401 }
      );
    }
    
    // As senhas estão criptografadas, precisamos comparar
    const senhaValida = await bcrypt.compare(senha, colaborador.senha);

    if (!senhaValida) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Retornar dados do colaborador (sem senha)
    const { senha: _, ...colaboradorSemSenha } = colaborador;

    return NextResponse.json({
      message: "Login bem-sucedido",
      // Em um app real, aqui retornaria um JWT
      token: "fake-jwt-token-for-collaborator", 
      colaborador: {
        ...colaboradorSemSenha,
        _id: colaborador._id.toString()
      }
    });
  } catch (error) {
    console.error("Erro no login do colaborador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
