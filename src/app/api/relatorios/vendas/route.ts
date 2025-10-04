import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    const { searchParams } = new URL(request.url);

    const pipeline: any[] = [];
    const matchStage: any = {};

    // Filtros de Data
    const periodo = searchParams.get("periodo");
    let dataInicio = searchParams.get("dataInicio") ? new Date(searchParams.get("dataInicio")!) : null;
    let dataFim = searchParams.get("dataFim") ? new Date(searchParams.get("dataFim")!) : null;
    
    if (periodo && periodo !== 'personalizado') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        switch (periodo) {
            case 'hoje':
                dataInicio = hoje;
                dataFim = new Date();
                dataFim.setHours(23, 59, 59, 999);
                break;
            case 'semana':
                dataInicio = new Date(hoje);
                dataInicio.setDate(hoje.getDate() - hoje.getDay());
                dataFim = new Date();
                break;
            case 'mes':
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                dataFim = new Date();
                break;
            case 'ano':
                dataInicio = new Date(hoje.getFullYear(), 0, 1);
                dataFim = new Date();
                break;
        }
    } else if (dataInicio && dataFim) {
        dataInicio.setHours(0, 0, 0, 0);
        dataFim.setHours(23, 59, 59, 999);
    }

    if (dataInicio && dataFim) {
      matchStage.dataVenda = { $gte: dataInicio, $lte: dataFim };
    }

    // Outros Filtros
    if (searchParams.get("formaPagamento")) {
      matchStage.formaPagamento = searchParams.get("formaPagamento");
    }
    if (searchParams.get("tipoCliente")) {
      matchStage.tipoCliente = searchParams.get("tipoCliente");
    }
    if (searchParams.get("cafeteria")) {
      matchStage.cafeteria = searchParams.get("cafeteria");
    }
     if (searchParams.get("colaboradorId") && ObjectId.isValid(searchParams.get("colaboradorId")!)) {
      matchStage.colaboradorId = new ObjectId(searchParams.get("colaboradorId")!);
    }

    // Adicionar estágio de match se houver filtros
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Ordenar pelas vendas mais recentes
    pipeline.push({ $sort: { dataVenda: -1 } });

    // Fazer lookup para obter dados do colaborador
    pipeline.push({
      $addFields: {
        colaboradorObjId: { $toObjectId: "$colaboradorId" }
      }
    });
    
    pipeline.push({
      $lookup: {
        from: "colaboradores",
        localField: "colaboradorObjId",
        foreignField: "_id",
        as: "colaboradorInfo"
      }
    });

    // Desconstruir o array do lookup e projetar os campos
    pipeline.push({
      $unwind: {
        path: "$colaboradorInfo",
        preserveNullAndEmptyArrays: true // Mantém vendas sem colaborador
      }
    });
    
    pipeline.push({
      $project: {
        numeroVenda: 1,
        dataVenda: 1,
        cafeteria: 1,
        tipoCliente: 1,
        formaPagamento: 1,
        itens: 1,
        total: 1,
        status: 1,
        colaborador: { // Renomeia e formata o campo
          $cond: {
            if: { $ifNull: ["$colaboradorInfo", false] },
            then: {
              _id: "$colaboradorInfo._id",
              nome: "$colaboradorInfo.nome",
              email: "$colaboradorInfo.email",
            },
            else: "$$REMOVE" // Remove o campo colaborador se não existir
          }
        },
      }
    });


    const vendas = await db.collection("vendas").aggregate(pipeline).toArray();
    
    return NextResponse.json(vendas.map(v => ({...v, _id: v._id.toString() })));
  } catch (error) {
    console.error("Erro ao buscar relatório de vendas:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a solicitação" },
      { status: 500 }
    );
  }
}
