import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

async function seedAdminUser(db: any) {
  const adminEmail = "admin@admin.com";
  const adminUser = await db.collection("usuarios").findOne({ email: adminEmail });

  if (!adminUser) {
    console.log(`Usuário '${adminEmail}' não encontrado. Criando...`);
    const hashedPassword = await bcrypt.hash("admin", 10);
    await db.collection("usuarios").insertOne({
      nome: "fernando",
      email: adminEmail,
      senha: hashedPassword,
      tipo: "gestor",
      status: "ativo",
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    });
    console.log(`Usuário '${adminEmail}' criado com sucesso.`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    
    // Garante que o usuário admin exista
    await seedAdminUser(db);

    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const usuario = await db.collection("usuarios").findOne({
      email: email,
      status: "ativo"
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou usuário inativo" },
        { status: 401 }
      );
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
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
