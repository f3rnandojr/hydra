import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    const client = await clientPromise;
    const db = client.db('hydra');
    
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
    
    const products = await db.collection('produtos')
      .find(filter)
      .sort({ nome: 1 })
      .limit(50) 
      .toArray();
    
    const formattedProducts = products.map(p => ({
      ...p,
      _id: p._id.toString(),
    }));
    
    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Falha ao buscar produtos:", error);
    return NextResponse.json({ error: 'Falha ao buscar produtos' }, { status: 500 });
  }
}
