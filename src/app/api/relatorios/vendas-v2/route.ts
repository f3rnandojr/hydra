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

    // ================= DEBUG BLOCK START =================
    console.log('--- INICIANDO DEBUG ESTRUTURAL ---');
    const userCount = await db.collection('usuarios').countDocuments();
    const collabCount = await db.collection('colaboradores').countDocuments();
    console.log(`Coleção 'usuarios' existe e tem ${userCount} documentos.`);
    console.log(`Coleção 'colaboradores' existe e tem ${collabCount} documentos.`);

    const primeiraVenda = await db.collection('vendas').findOne(filtro, { sort: { dataVenda: -1 } });
    if (primeiraVenda) {
        console.log('Tipo de usuarioId na venda:', typeof primeiraVenda.usuarioId, `(É ObjectId: ${ObjectId.isValid(primeiraVenda.usuarioId)})`);
        
        const manualUserLookup = await db.collection('usuarios').findOne({ _id: primeiraVenda.usuarioId });
        console.log('Resultado do lookup manual:', manualUserLookup ? `ENCONTRADO: ${manualUserLookup.nome}` : 'NÃO ENCONTRADO');
    } else {
        console.log('Nenhuma venda encontrada para o filtro, debug manual não pode prosseguir.');
    }
    console.log('--- FIM DEBUG ESTRUTURAL ---');
    // ================= DEBUG BLOCK END =================

    
    const aggregatePipeline: any[] = [
      {
        $match: filtro
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
