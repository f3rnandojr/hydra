import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    let filter: any = { ativo: true };

    if (query) {
      // Buscar por EAN exato OU nome (case insensitive)
      filter = {
        ...filter,
        $or: [
          { codigoEAN: query }, // Busca exata por EAN
          { nome: { $regex: query, $options: 'i' } } // Busca por nome
        ]
      };
    }

    const produtos = await db
      .collection("produtos")
      .find(filter)
      .sort({ nome: 1 })
      .limit(50) 
      .toArray();
    
    return NextResponse.json(produtos);
  } catch (error) {
    console.error("Falha ao buscar produtos:", error);
    return NextResponse.json({ error: "Falha ao buscar produtos" }, { status: 500 });
  }
}
