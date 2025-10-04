// src/app/api/relatorios/vendas-v2/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");

    console.log('=== FASE 1: INICIANDO API VENDAS-V2 ===');

    // Pipeline SIMPLES e TESTADO
    const aggregatePipeline = [
      {
        $match: {
          // Filtro básico inicial - últimas 10 vendas para teste
        }
      },
      {
        $sort: { dataVenda: -1 }
      },
      {
        $limit: 10
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

    console.log('=== EXECUTANDO PIPELINE ===');
    const vendas = await db.collection("vendas")
      .aggregate(aggregatePipeline)
      .toArray();

    // DEBUG CRÍTICO
    console.log('=== DEBUG FASE 1 ===');
    console.log('Total de vendas encontradas:', vendas.length);
    if (vendas.length > 0) {
      const primeiraVenda = vendas[0];
      console.log('Primeira venda - Estrutura:', {
        numeroVenda: primeiraVenda.numeroVenda,
        usuarioId: primeiraVenda.usuarioId,
        usuario: primeiraVenda.usuario, // ← DEVE SER OBJETO, NÃO ARRAY
        colaboradorId: primeiraVenda.colaboradorId,
        colaborador: primeiraVenda.colaborador // ← DEVE SER OBJETO, NÃO ARRAY
      });
    }

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

    console.log('=== FASE 1 CONCLUÍDA - ENVIANDO DADOS ===');
    return NextResponse.json(vendasFormatadas);

  } catch (error) {
    console.error('=== ERRO FASE 1 ===', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
