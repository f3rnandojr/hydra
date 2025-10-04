import clientPromise from './mongodb';
import { ObjectId, type WithId } from 'mongodb';
import type { Collaborator } from './definitions';
import bcrypt from 'bcrypt';

async function getDb() {
  const client = await clientPromise;
  return client.db('hydra');
}

export async function getCollaborators(): Promise<Collaborator[]> {
  const db = await getDb();
  const collaborators = await db.collection('colaboradores').find({ deletedAt: null }).toArray();
  // Convert _id to string for each document
  return collaborators.map(c => ({
    ...c,
    _id: c._id.toString(),
  })) as unknown as Collaborator[];
}

export async function getCollaboratorById(id: string): Promise<Collaborator | undefined> {
  if (!ObjectId.isValid(id)) {
    return undefined;
  }
  const db = await getDb();
  const collaborator = await db.collection('colaboradores').findOne({ _id: new ObjectId(id) });
  if (collaborator) {
    const { senha, ...rest } = collaborator;
    return {
        ...rest,
        _id: rest._id.toString(),
    } as unknown as Collaborator;
  }
  return undefined;
}

export async function createCollaborator(data: Omit<Collaborator, '_id' | 'dataCriacao' | 'dataAtualizacao' | 'deletedAt'>): Promise<WithId<Collaborator>> {
    const db = await getDb();
    
    const hashedPassword = await bcrypt.hash(data.senha!, 10);

    const newCollaborator = {
      ...data,
      senha: hashedPassword,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      deletedAt: null,
    };

    const result = await db.collection('colaboradores').insertOne(newCollaborator);
    
    return {
        ...newCollaborator,
        _id: result.insertedId,
    };
}

export async function updateCollaborator(id: string, data: Partial<Omit<Collaborator, '_id'>>): Promise<Collaborator | null> {
    if (!ObjectId.isValid(id)) {
        return null;
    }
    const db = await getDb();
    
    const dataToUpdate: any = { ...data };

    if (data.senha) {
        dataToUpdate.senha = await bcrypt.hash(data.senha, 10);
    } else {
        delete dataToUpdate.senha; // Don't update password if it's empty
    }
    
    const result = await db.collection('colaboradores').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...dataToUpdate, dataAtualizacao: new Date() } },
        { returnDocument: 'after' }
    );

    if (result) {
        return {
            ...result,
            _id: result._id.toString(),
        } as unknown as Collaborator;
    }

    return null;
}

export async function deleteCollaborator(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
        return false;
    }
    const db = await getDb();
    const result = await db.collection('colaboradores').updateOne(
        { _id: new ObjectId(id) },
        { $set: { deletedAt: new Date() } }
    );
    return result.modifiedCount === 1;
}
