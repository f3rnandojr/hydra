
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface CafeteriaSession {
  _id?: ObjectId;
  ip: string;
  cafeteria: string;
  usuario: string;
  dataPrimeiraVenda: Date;
  dataUltimaVenda: Date;
  vendasHoje: number;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

async function findTodaySessionByIP(ip: string): Promise<CafeteriaSession | null> {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    
    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia = new Date(hoje.setHours(23, 59, 59, 999));
    
    const session = await db.collection("cafeteria_sessions").findOne({
      ip: ip,
      dataCriacao: {
        $gte: inicioDia,
        $lt: fimDia
      }
    });
    
    return session as CafeteriaSession | null;
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    return null;
  }
}

// GET /api/cafeteria-session?ip=...
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
        return NextResponse.json({ error: "IP é obrigatório" }, { status: 400 });
    }

    try {
        const session = await findTodaySessionByIP(ip);
        if (session) {
            return NextResponse.json({ cafeteria: session.cafeteria });
        }
        return NextResponse.json({ cafeteria: null });
    } catch (error) {
        console.error('Erro ao obter cafeteria por IP:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}


// POST /api/cafeteria-session
export async function POST(request: NextRequest) {
    const { ip, cafeteria, usuario } = await request.json();

    if (!ip || !cafeteria || !usuario) {
        return NextResponse.json({ error: "IP, cafeteria e usuário são obrigatórios" }, { status: 400 });
    }

    try {
        const client = await clientPromise;
        const db = client.db("hydra");
        
        const sessionExistente = await findTodaySessionByIP(ip);
        const agora = new Date();
        
        if (sessionExistente) {
          // UPDATE - sessão já existe hoje
          await db.collection("cafeteria_sessions").updateOne(
            { _id: sessionExistente._id },
            {
              $set: {
                dataUltimaVenda: agora,
                dataAtualizacao: agora,
                usuario: usuario
              },
              $inc: { vendasHoje: 1 }
            }
          );
        } else {
          // INSERT - primeira sessão do dia para este IP
          await db.collection("cafeteria_sessions").insertOne({
            ip: ip,
            cafeteria: cafeteria,
            usuario: usuario,
            dataPrimeiraVenda: agora,
            dataUltimaVenda: agora,
            vendasHoje: 1,
            dataCriacao: agora,
            dataAtualizacao: agora
          });
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao criar/atualizar sessão:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
