
// src/app/api/relatorios/vendas-v2/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    const { searchParams } = new URL(request.url);

    // Obter parâmetros de filtro
    const periodo = searchParams.get('periodo') || 'todos';
    const formaPagamento = searchParams.get('formaPagamento');
    const tipoCliente = searchParams.get('tipoCliente');
    const cafeteria = searchParams.get('cafeteria');

    // Construir filtro baseado nos parâmetros
    const filtro: any = {};

    // Filtro de período
    if (periodo && periodo !== 'todos') {
      const hoje = new Date();
      switch (periodo) {
        case 'hoje':
          filtro.dataVenda = {
            $gte: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
            $lt: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)
          };
          break;
        case 'semana':
          const inicioSemana = new Date(hoje);
          inicioSemana.setDate(hoje.getDate() - hoje.getDay());
          filtro.dataVenda = { $gte: inicioSemana };
          break;
        case 'mes':
          filtro.dataVenda = {
            $gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
            $lt: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
          };
          break;
      }
    }

    // Outros filtros
    if (formaPagamento && formaPagamento !== 'todos') {
      filtro.formaPagamento = formaPagamento;
    }

    if (tipoCliente && tipoCliente !== 'todos') {
      filtro.tipoCliente = tipoCliente;
    }

    if (cafeteria && cafeteria !== 'todos') {
      filtro.cafeteria = cafeteria;
    }

    console.log('=== FILTROS APLICADOS ===', filtro);
    
    // Pipeline SIMPLES e TESTADO
    const aggregatePipeline: any[] = [
      {
        $match: filtro // ← Usar o filtro construído
      },
      {
        $sort: { dataVenda: -1 }
      },
      {
        $lookup: {
          from: "usuarios",
          localField: "usuarioId",
          foreignField: "_id",
          as: "usuario"
        }
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
        $addFields: {
          // Converter arrays em objetos simples
          usuario: { $arrayElemAt: ["$usuario", 0] },
          colaborador: { $arrayElemAt: ["$colaborador", 0] }
        }
      },
      {
        $project: {
          "usuario.senha": 0,
          "colaborador.senha": 0
        }
      }
    ];

    const vendas = await db.collection("vendas")
      .aggregate(aggregatePipeline)
      .toArray();

    // Converter ObjectIds para strings
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
    console.error('=== ERRO FASE 1 ===', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
