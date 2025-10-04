import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const cafeteria = searchParams.get('cafeteria') || 'cafeteria_01'; // Cafeteria para consulta de saldo
    const tipoCliente = searchParams.get('tipoCliente') || 'normal';

    console.log(`🔍 Busca produtos - Query: "${query}", Cafeteria: ${cafeteria}, TipoCliente: ${tipoCliente}`);

    let filter: any = { 
        ativo: true
    };

    if (query) {
      filter = {
        ...filter,
        $or: [
          { codigoEAN: query },
          { nome: { $regex: query, $options: 'i' } }
        ]
      };
    }
    
    // Pipeline de agregação para buscar produtos e juntar o estoque da cafeteria correta
    const aggregatePipeline: any[] = [
      {
        $match: filter
      },
      {
        $lookup: {
          from: "estoque",
          let: { produtoId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$produtoId", "$$produtoId"] },
                    { $eq: ["$cafeteria", cafeteria] }
                  ]
                }
              }
            }
          ],
          as: "estoqueInfo"
        }
      },
      {
        $addFields: {
          // Pega o saldo do primeiro (e único) item do array de estoqueInfo ou define como 0 se não existir
          saldo: { $ifNull: [{ $arrayElemAt: ["$estoqueInfo.saldo", 0] }, 0] },
          estoqueMinimo: { $ifNull: [{ $arrayElemAt: ["$estoqueInfo.estoqueMinimo", 0] }, 0] }
        }
      },
      {
        $project: {
          estoqueInfo: 0 // Remove o campo lookup do resultado final
        }
      }
    ];

    // Adicionar filtro de saldo apenas para cliente normal
    if (tipoCliente === 'normal') {
      aggregatePipeline.push({
        $match: { saldo: { $gt: 0 } }
      });
      console.log('🛒 Aplicando filtro de estoque para cliente normal');
    } else {
        console.log('👥 Colaborador - Sem filtro de estoque');
    }
    
    aggregatePipeline.push(
      { $sort: { nome: 1 } },
      { $limit: 50 }
    );

    console.log('📋 Filtro aplicado:', JSON.stringify(aggregatePipeline));

    const produtos = await db
      .collection("produtos")
      .aggregate(aggregatePipeline)
      .toArray();
    
    console.log(`📦 Produtos encontrados: ${produtos.length}`);
    
    return NextResponse.json(produtos.map(p => ({...p, _id: p._id.toString()})));
  } catch (error) {
    console.error("Falha ao buscar produtos:", error);
    return NextResponse.json({ error: "Falha ao buscar produtos" }, { status: 500 });
  }
}
