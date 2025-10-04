import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cafeteria = searchParams.get('cafeteria');
    const produtoId = searchParams.get('produtoId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const client = await clientPromise;
    const db = client.db("hydra");

    // Construir o estágio $match da pipeline de agregação
    const matchFilter: any = {};
    if (cafeteria && cafeteria !== 'todos') {
      matchFilter.cafeteria = cafeteria;
    }
    if (produtoId) {
      matchFilter.produtoId = new ObjectId(produtoId);
    }
    if (dataInicio) {
      matchFilter.dataAtualizacao = { ...matchFilter.dataAtualizacao, $gte: new Date(dataInicio) };
    }
    if (dataFim) {
      matchFilter.dataAtualizacao = { ...matchFilter.dataAtualizacao, $lte: new Date(dataFim + 'T23:59:59.999Z') };
    }

    const pipeline = [
      {
        $match: matchFilter
      },
      {
        $lookup: {
          from: 'produtos',
          localField: 'produtoId',
          foreignField: '_id',
          as: 'produtoInfo'
        }
      },
      {
        $unwind: '$produtoInfo' // Desconstrói o array produtoInfo para um objeto
      },
      {
        $project: {
          _id: 1,
          produtoId: 1,
          cafeteria: 1,
          saldo: 1,
          estoqueMinimo: 1,
          dataAtualizacao: 1,
          produto: {
            _id: '$produtoInfo._id',
            nome: '$produtoInfo.nome',
            codigoEAN: '$produtoInfo.codigoEAN',
            precoVenda: '$produtoInfo.precoVenda'
          }
        }
      },
      {
        $sort: {
          'produto.nome': 1,
          'cafeteria': 1
        }
      }
    ];

    const estoque = await db.collection("estoque").aggregate(pipeline).toArray();

    return NextResponse.json(estoque.map(e => ({
      ...e,
      _id: e._id.toString(),
      produtoId: e.produtoId.toString(),
      produto: {
        ...e.produto,
        _id: e.produto._id.toString()
      }
    })));

  } catch (error) {
    console.error("Erro ao buscar relatório de estoque:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
