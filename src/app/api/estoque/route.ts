import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const produtoId = searchParams.get('produtoId');
    const cafeteria = searchParams.get('cafeteria');

    const client = await clientPromise;
    const db = client.db("hydra");

    const filtro: any = {};
    if (produtoId) filtro.produtoId = new ObjectId(produtoId);
    if (cafeteria) filtro.cafeteria = cafeteria;

    const estoque = await db.collection("estoque")
      .find(filtro)
      .toArray();

    return NextResponse.json(estoque.map(e => ({
      ...e,
      _id: e._id.toString(),
      produtoId: e.produtoId.toString()
    })));
  } catch (error) {
    console.error("Erro ao buscar estoque:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
