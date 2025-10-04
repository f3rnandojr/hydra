import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'hoje';
    const formaPagamento = searchParams.get('formaPagamento');
    const tipoCliente = searchParams.get('tipoCliente');
    const cafeteria = searchParams.get('cafeteria');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const client = await clientPromise;
    const db = client.db("hydra");

    // Construir filtro de data baseado no período
    const dataFiltro: any = {};
    const hoje = new Date();
    
    switch (periodo) {
      case 'hoje':
        dataFiltro.dataVenda = {
          $gte: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
          $lt: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)
        };
        break;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        dataFiltro.dataVenda = { $gte: inicioSemana };
        break;
      case 'mes':
        dataFiltro.dataVenda = {
          $gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
          $lt: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
        };
        break;
      case 'ano':
        dataFiltro.dataVenda = {
          $gte: new Date(hoje.getFullYear(), 0, 1),
          $lt: new Date(hoje.getFullYear() + 1, 0, 1)
        };
        break;
      case 'personalizado':
        if (dataInicio && dataFim) {
          dataFiltro.dataVenda = {
            $gte: new Date(dataInicio),
            $lte: new Date(dataFim + 'T23:59:59.999Z')
          };
        }
        break;
    }

    // Construir filtro completo
    const filtro: any = { ...dataFiltro };

    if (formaPagamento && formaPagamento !== 'todos') {
      filtro.formaPagamento = formaPagamento;
    }

    if (tipoCliente && tipoCliente !== 'todos') {
      filtro.tipoCliente = tipoCliente;
    }

    if (cafeteria && cafeteria !== 'todos') {
      filtro.cafeteria = cafeteria;
    }

    // Pipeline de agregação para buscar vendas e popular dados relacionados
    const aggregatePipeline: any[] = [
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
          from: "usuarios",
          localField: "usuarioId",
          foreignField: "_id",
          as: "usuario"
        }
      },
      {
        $sort: { dataVenda: -1 }
      },
      {
        $project: { // Projetar para formatar a saída e remover campos desnecessários
          "usuario.senha": 0,
          "colaborador.senha": 0
        }
      }
    ];

    const vendas = await db.collection("vendas")
      .aggregate(aggregatePipeline)
      .toArray();
      
    // DEBUG ADICIONADO
    console.log('=== DEBUG API VENDAS ===');
    console.log('Total de vendas:', vendas.length);
    if (vendas.length > 0) {
      console.log('Primeira venda:', {
        _id: vendas[0]._id,
        numeroVenda: vendas[0].numeroVenda,
        usuarioId: vendas[0].usuarioId,
        usuario: vendas[0].usuario, // ← O QUE TEM AQUI?
        colaboradorId: vendas[0].colaboradorId,
        colaborador: vendas[0].colaborador, // ← O QUE TEM AQUI?
        lookupResult: {
          usuarioLookup: vendas[0].usuario,
          colaboradorLookup: vendas[0].colaborador
        }
      });
    }


    return NextResponse.json(vendas.map(v => ({
      ...v,
      _id: v._id.toString(),
      usuarioId: v.usuarioId?.toString(),
      colaboradorId: v.colaboradorId?.toString(),
      // Mapear o array para objeto
      usuario: v.usuario?.[0] ? { ...v.usuario[0], _id: v.usuario[0]._id.toString() } : null,
      colaborador: v.colaborador?.[0] ? { ...v.colaborador[0], _id: v.colaborador[0]._id.toString() } : null,
    })));

  } catch (error) {
    console.error("Erro ao buscar relatório de vendas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
