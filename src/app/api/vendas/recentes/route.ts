import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");

    // Calcular data de 2 horas atrás
    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const filtro = {
      dataVenda: { $gte: duasHorasAtras }
    };
    
    const aggregatePipeline: any[] = [
      {
        $match: filtro
      },
      {
        $sort: { dataVenda: -1 }
      },
      {
        $addFields: {
          usuarioIdObj: { 
            $cond: {
              if: { $eq: [{ $type: "$usuarioId" }, "objectId"] },
              then: "$usuarioId",
              else: { $toObjectId: "$usuarioId" }
            }
          },
          colaboradorIdObj: {
            $cond: {
              if: { $and: ["$colaboradorId", { $ne: ["$colaboradorId", null] }, { $ne: ["$colaboradorId", ""] }] },
              then: {
                $cond: {
                  if: { $eq: [{ $type: "$colaboradorId" }, "objectId"] },
                  then: "$colaboradorId",
                  else: { $toObjectId: "$colaboradorId" }
                }
              },
              else: null
            }
          }
        }
      },
      {
        $lookup: {
          from: "usuarios",
          localField: "usuarioIdObj",
          foreignField: "_id",
          as: "usuario"
        }
      },
      {
        $lookup: {
          from: "colaboradores",
          localField: "colaboradorIdObj",
          foreignField: "_id",
          as: "colaborador"
        }
      },
      {
        $addFields: {
          usuario: { $arrayElemAt: ["$usuario", 0] },
          colaborador: { $arrayElemAt: ["$colaborador", 0] }
        }
      },
      {
        $project: {
          "usuario.senha": 0,
          "colaborador.senha": 0,
          usuarioIdObj: 0,
          colaboradorIdObj: 0
        }
      },
      {
        $limit: 50 // Limite para performance
      }
    ];

    const vendas = await db.collection("vendas")
      .aggregate(aggregatePipeline)
      .toArray();

    const vendasFormatadas = vendas.map(venda => ({
      ...venda,
      _id: venda._id.toString(),
      usuarioId: venda.usuarioId?.toString(),
      colaboradorId: venda.colaboradorId?.toString(),
      usuario: venda.usuario ? {
        ...venda.usuario,
        _id: venda.usuario._id?.toString()
      } : null,
      colaborador: venda.colaborador ? {
        ...venda.colaborador,
        _id: venda.colaborador._id?.toString()
      } : null
    }));

    return NextResponse.json(vendasFormatadas);

  } catch (error) {
    console.error('Erro ao buscar vendas recentes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
