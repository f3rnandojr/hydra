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

    // Buscar vendas
    const vendas = await db.collection("vendas")
      .find(filtro)
      .sort({ dataVenda: -1 })
      .toArray();

    // Buscar informações dos colaboradores para vendas do tipo colaborador
    const vendasComColaboradores = await Promise.all(
      vendas.map(async (venda) => {
        if (venda.tipoCliente === 'colaborador' && venda.colaboradorId) {
          const colaborador = await db.collection("colaboradores").findOne({
            _id: new ObjectId(venda.colaboradorId)
          });
          
          return {
            ...venda,
            _id: venda._id.toString(),
            colaborador: colaborador ? {
              _id: colaborador._id.toString(),
              nome: colaborador.nome,
              email: colaborador.email
            } : undefined
          };
        }
        
        return {
          ...venda,
          _id: venda._id.toString()
        };
      })
    );

    return NextResponse.json(vendasComColaboradores);
  } catch (error) {
    console.error("Erro ao buscar relatório de vendas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
