import clientPromise from "@/lib/mongodb";
import { NextResponse, NextRequest } from "next/server";

// GET - Buscar parâmetro da cafeteria ativa
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    
    const parametro = await db.collection("parametros").findOne({
      chave: "CAFETERIA_ATIVA"
    });

    if (!parametro) {
       return NextResponse.json({ error: "Parâmetro CAFETERIA_ATIVA não configurado." }, { status: 404 });
    }

    return NextResponse.json(parametro);
  } catch (error) {
    console.error("Erro ao buscar parâmetro:", error);
    return NextResponse.json({ error: "Erro interno ao buscar parâmetro" }, { status: 500 });
  }
}

// POST - Atualizar cafeteria ativa (para admin)
export async function POST(request: Request) {
  try {
    const { valor } = await request.json();
    if (!valor) {
        return NextResponse.json({ error: "O campo 'valor' é obrigatório." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("hydra");
    
    await db.collection("parametros").updateOne(
      { chave: "CAFETERIA_ATIVA" },
      { 
        $set: { 
          valor: valor,
          dataAtualizacao: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Parâmetro atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar parâmetro:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar parâmetro" }, { status: 500 });
  }
}
