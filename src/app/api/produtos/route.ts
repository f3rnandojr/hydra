import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const produtos = await db
      .collection("produtos")
      .find({ 
        ativo: true,
        nome: { $regex: query, $options: 'i' } 
      })
      .sort({ nome: 1 })
      .limit(50) // Limita a 50 resultados para performance
      .toArray();
    
    return NextResponse.json(produtos);
  } catch (error) {
    console.error("Falha ao buscar produtos:", error);
    return NextResponse.json({ error: "Falha ao buscar produtos" }, { status: 500 });
  }
}
