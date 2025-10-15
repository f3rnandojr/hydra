
import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

export interface CafeteriaSession {
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

export async function findTodaySessionByIP(ip: string): Promise<CafeteriaSession | null> {
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

export async function createOrUpdateSession(
  ip: string, 
  cafeteria: string, 
  usuario: string
): Promise<boolean> {
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
    
    return true;
  } catch (error) {
    console.error('Erro ao criar/atualizar sessão:', error);
    return false;
  }
}

export async function getCafeteriaByIP(ip: string): Promise<string | null> {
  try {
    const session = await findTodaySessionByIP(ip);
    return session?.cafeteria || null;
  } catch (error) {
    console.error('Erro ao obter cafeteria por IP:', error);
    return null;
  }
}
