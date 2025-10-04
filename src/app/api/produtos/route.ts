import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const tipoCliente = searchParams.get('tipoCliente') || 'normal'; // 👈 Novo parâmetro

    console.log(`🔍 Busca produtos - Query: "${query}", TipoCliente: ${tipoCliente}`); // 👈 Log para debug

    let filter: any = { 
        ativo: true
    };

    // 👇 Aplicar filtro de estoque apenas para cliente normal
    if (tipoCliente === 'normal') {
        filter.saldo = { $gt: 0 };
        console.log('🛒 Aplicando filtro de estoque para cliente normal');
    } else {
        console.log('👥 Colaborador - Sem filtro de estoque');
    }
    // Para colaborador, não aplicamos filtro de saldo

    if (query) {
      filter = {
        ...filter,
        $or: [
          { codigoEAN: query },
          { nome: { $regex: query, $options: 'i' } }
        ]
      };
    }

    console.log('📋 Filtro aplicado:', JSON.stringify(filter)); // 👈 Log do filtro

    const produtos = await db
      .collection("produtos")
      .find(filter)
      .sort({ nome: 1 })
      .limit(50) 
      .toArray();
    
    console.log(`📦 Produtos encontrados: ${produtos.length}`); // 👈 Log de resultados
    
    return NextResponse.json(produtos.map(p => ({...p, _id: p._id.toString()})));
  } catch (error) {
    console.error("Falha ao buscar produtos:", error);
    return NextResponse.json({ error: "Falha ao buscar produtos" }, { status: 500 });
  }
}
