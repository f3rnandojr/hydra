import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const session = (await clientPromise).startSession();
  try {
    const { vendaId, itens, total, formaPagamento, tipoCliente, colaboradorId } = await request.json();

    console.log('📝 Editando venda:', { vendaId, itens, total });
    
    let novaVendaCriada;

    await session.withTransaction(async () => {
      const db = (await clientPromise).db("hydra");
      
      // 1. Buscar venda original
      const vendaOriginal = await db.collection('vendas').findOne({ _id: new ObjectId(vendaId) }, { session });
      if (!vendaOriginal) {
        throw new Error('Venda original não encontrada');
      }

      // 2. Devolver itens da venda original ao estoque
      const opsDevolucao = vendaOriginal.itens.map((item: any) => ({
        updateOne: {
          filter: { produtoId: new ObjectId(item.produtoId), cafeteria: vendaOriginal.cafeteria },
          update: { $inc: { saldo: +item.quantidade } }
        }
      }));
      if(opsDevolucao.length > 0) {
        await db.collection('estoque').bulkWrite(opsDevolucao, { session });
      }

      // 3. Retirar itens da nova venda do estoque
      const opsRetirada = itens.map((item: any) => ({
        updateOne: {
          filter: { produtoId: new ObjectId(item.produtoId), cafeteria: vendaOriginal.cafeteria },
          update: { $inc: { saldo: -item.quantidade } }
        }
      }));
       if(opsRetirada.length > 0) {
        await db.collection('estoque').bulkWrite(opsRetirada, { session });
      }

      // 4. Atualizar a venda original para status "editada"
      await db.collection('vendas').updateOne(
        { _id: new ObjectId(vendaId) },
        { $set: { status: "editada", dataEdicao: new Date() } },
        { session }
      );

      // 5. Criar NOVA venda com os dados editados
      const novaVenda = {
        numeroVenda: vendaOriginal.numeroVenda,
        dataVenda: vendaOriginal.dataVenda,
        cafeteria: vendaOriginal.cafeteria,
        formaPagamento: formaPagamento || vendaOriginal.formaPagamento,
        tipoCliente: tipoCliente || vendaOriginal.tipoCliente,
        total: total,
        usuarioId: vendaOriginal.usuarioId,
        colaboradorId: colaboradorId ? new ObjectId(colaboradorId) : vendaOriginal.colaboradorId,
        itens: itens.map((it:any) => ({...it, produtoId: new ObjectId(it.produtoId)})),
        status: "ativa",
        vendaOriginalId: vendaId,
        dataEdicao: new Date(),
        dataCriacao: new Date(),
      };
      
      const result = await db.collection('vendas').insertOne(novaVenda, { session });
      
      novaVendaCriada = {
          ...novaVenda,
          _id: result.insertedId
      };
    });

    return NextResponse.json(novaVendaCriada);

  } catch (error: any) {
    console.error('❌ Erro ao editar venda:', error);
    return NextResponse.json(
      { message: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await session.endSession();
  }
}
