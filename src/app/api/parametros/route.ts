
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

// GET - Buscar um ou todos os parâmetros
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    const { searchParams } = new URL(request.url);
    const chave = searchParams.get('chave');

    let resultado;
    if (chave) {
      // Busca um parâmetro específico
      resultado = await db.collection("parametros").findOne({ chave });
      if (!resultado) {
        return NextResponse.json({ error: `Parâmetro ${chave} não encontrado.` }, { status: 404 });
      }
    } else {
      // Busca todos os parâmetros
      resultado = await db.collection("parametros").find({}).sort({ chave: 1 }).toArray();
    }

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar parâmetro(s):", error);
    return NextResponse.json({ error: "Erro interno ao buscar parâmetro(s)" }, { status: 500 });
  }
}


// POST - Atualizar um parâmetro (para admin)
export async function POST(request: Request) {
  try {
    const { chave, valor } = await request.json();
    if (!chave || valor === undefined) {
        return NextResponse.json({ error: "Os campos 'chave' e 'valor' são obrigatórios." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("hydra");
    
    await db.collection("parametros").updateOne(
      { chave: chave },
      { 
        $set: { 
          valor: valor,
          dataAtualizacao: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: `Parâmetro ${chave} atualizado com sucesso.` });
  } catch (error) {
    console.error("Erro ao atualizar parâmetro:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar parâmetro" }, { status: 500 });
  }
}
