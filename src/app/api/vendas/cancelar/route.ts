import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const dbSession = (await clientPromise).startSession();
  try {
    const { vendaId, motivo, usuarioCancelamentoId } = await request.json();

    if (!vendaId || !motivo || !usuarioCancelamentoId) {
      return NextResponse.json({ message: "Dados incompletos para cancelamento." }, { status: 400 });
    }
    if (!ObjectId.isValid(vendaId) || !ObjectId.isValid(usuarioCancelamentoId)) {
        return NextResponse.json({ message: "ID de venda ou usuário inválido." }, { status: 400 });
    }
    
    let response: any;

    await dbSession.withTransaction(async (session) => {
        const db = (await clientPromise).db("hydra");
        
        // 1. Buscar a venda a ser cancelada
        const venda = await db.collection("vendas").findOne({ _id: new ObjectId(vendaId) }, { session });
        if (!venda) {
            throw new Error("Venda não encontrada.");
        }
        if (venda.status !== 'ativa') {
            throw new Error(`A venda já está com status '${venda.status}'.`);
        }

        // 2. Atualizar o status da venda para 'cancelada'
        const updateResult = await db.collection("vendas").updateOne(
            { _id: new ObjectId(vendaId) },
            {
                $set: {
                    status: "cancelada",
                    motivoCancelamento: motivo,
                    usuarioCancelamentoId: new ObjectId(usuarioCancelamentoId),
                    dataCancelamento: new Date().toISOString()
                }
            },
            { session }
        );
        
        if (updateResult.modifiedCount === 0) {
            throw new Error("Não foi possível atualizar o status da venda.");
        }
        
        // 3. Devolver os itens ao estoque
        const bulkStockOps = venda.itens.map((item: any) => ({
            updateOne: {
                filter: { 
                    produtoId: new ObjectId(item.produtoId), 
                    cafeteria: venda.cafeteria 
                },
                update: { 
                    $inc: { saldo: +item.quantidade },
                    $set: { dataAtualizacao: new Date() }
                }
            }
        }));
        
        if (bulkStockOps.length > 0) {
            await db.collection("estoque").bulkWrite(bulkStockOps, { session });
        }
        
        // 4. Se a venda era 'apagar', cancelar a conta a receber
        if (venda.formaPagamento === 'apagar') {
            await db.collection("contas_receber").updateOne(
                { vendaId: new ObjectId(vendaId) },
                { 
                    $set: {
                        status: 'cancelado',
                        dataAtualizacao: new Date(),
                        motivoCancelamento: `Venda #${venda.numeroVenda} cancelada.`,
                        usuarioQuitacaoId: new ObjectId(usuarioCancelamentoId)
                    } 
                },
                { session }
            );
        }

        response = { success: true, message: "Venda cancelada e estoque restaurado." };
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao cancelar venda:', error);
    return NextResponse.json({ message: error.message || 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await dbSession.endSession();
  }
}
