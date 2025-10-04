import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const colaboradorId = searchParams.get('colaboradorId');

    const client = await clientPromise;
    const db = client.db("hydra");

    const filtro: any = {};
    if (status) filtro.status = status;
    if (colaboradorId) filtro.colaboradorId = new ObjectId(colaboradorId);

    const contas = await db.collection("contas_receber")
      .aggregate([
        {
          $match: filtro
        },
        {
          $lookup: {
            from: "colaboradores",
            localField: "colaboradorId",
            foreignField: "_id",
            as: "colaborador"
          }
        },
        {
          $lookup: {
            from: "vendas",
            localField: "vendaId",
            foreignField: "_id",
            as: "venda"
          }
        },
        {
          $unwind: "$colaborador"
        },
        {
          $unwind: "$venda"
        },
        {
          $sort: { dataVenda: -1 }
        }
      ])
      .toArray();

    return NextResponse.json(contas.map(conta => ({
      ...conta,
      _id: conta._id.toString(),
      vendaId: conta.vendaId.toString(),
      colaboradorId: conta.colaboradorId.toString(),
      colaborador: {
        ...conta.colaborador,
        _id: conta.colaborador._id.toString()
      },
      venda: {
        ...conta.venda,
        _id: conta.venda._id.toString()
      }
    })));
  } catch (error) {
    console.error("Erro ao buscar contas a receber:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}