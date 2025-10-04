import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const client = await clientPromise;
    const db = client.db('hydra');
    
    // Filtro base - apenas colaboradores não deletados
    let filter: any = { deletedAt: null };
    
    // Filtrar por status se especificado
    if (status === 'ativo') {
      filter.status = true;
    } else if (status === 'inativo') {
      filter.status = false;
    }
    
    const colaboradores = await db.collection('colaboradores')
      .find(filter)
      .sort({ nome: 1 })
      .toArray();
    
    // Formatar resposta (excluir senha por segurança)
    const formattedColaboradores = colaboradores.map(colab => ({
      _id: colab._id.toString(),
      nome: colab.nome,
      email: colab.email,
      status: colab.status,
      dataCriacao: colab.dataCriacao,
      dataAtualizacao: colab.dataAtualizacao
    }));
    
    return NextResponse.json(formattedColaboradores);
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar colaboradores' }, 
      { status: 500 }
    );
  }
}
