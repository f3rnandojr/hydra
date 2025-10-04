import type { Collaborator } from './definitions';

// This is a hack to simulate a database in a stateless environment.
// In a real app, this would be a database connection.
// The data will reset on server restart.

let collaborators: Collaborator[] = [
  {
    _id: '1',
    nome: 'Alice Johnson',
    email: 'alice.j@example.com',
    status: true,
    dataCriacao: new Date('2023-01-15T09:30:00Z'),
    dataAtualizacao: new Date('2023-10-20T14:00:00Z'),
    deletedAt: null,
  },
  {
    _id: '2',
    nome: 'Bob Williams',
    email: 'bob.w@example.com',
    status: false,
    dataCriacao: new Date('2023-02-20T11:00:00Z'),
    dataAtualizacao: new Date('2023-11-01T10:00:00Z'),
    deletedAt: null,
  },
  {
    _id: '3',
    nome: 'Charlie Brown',
    email: 'charlie.b@example.com',
    status: true,
    dataCriacao: new Date('2023-03-10T16:45:00Z'),
    dataAtualizacao: new Date('2023-03-10T16:45:00Z'),
    deletedAt: null,
  },
  {
    _id: '4',
    nome: 'Diana Prince',
    email: 'diana.p@example.com',
    status: true,
    dataCriacao: new Date('2023-04-05T08:00:00Z'),
    dataAtualizacao: new Date('2024-01-15T18:30:00Z'),
    deletedAt: null,
  },
  {
    _id: '5',
    nome: 'Ethan Hunt',
    email: 'ethan.h@example.com',
    status: false,
    dataCriacao: new Date('2023-05-12T13:20:00Z'),
    dataAtualizacao: new Date('2023-05-12T13:20:00Z'),
    deletedAt: new Date(), // Soft-deleted user
  },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getCollaborators(): Promise<Collaborator[]> {
  await delay(500); // Simulate network latency
  return collaborators.filter(c => c.deletedAt === null);
}

export async function getCollaboratorById(id: string): Promise<Collaborator | undefined> {
  await delay(300);
  const collaborator = collaborators.find(c => c._id === id);
  if (collaborator) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha, ...rest } = collaborator;
    return rest as Collaborator;
  }
  return undefined;
}

export async function createCollaborator(data: Omit<Collaborator, '_id' | 'dataCriacao' | 'dataAtualizacao' | 'deletedAt'>): Promise<Collaborator> {
  await delay(700);
  const newCollaborator: Collaborator = {
    _id: (collaborators.length + 1 + Math.random()).toString(),
    ...data,
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
    deletedAt: null,
  };
  collaborators.push(newCollaborator);
  return newCollaborator;
}

export async function updateCollaborator(id: string, data: Partial<Omit<Collaborator, '_id'>>): Promise<Collaborator | null> {
  await delay(700);
  const index = collaborators.findIndex(c => c._id === id);
  if (index !== -1) {
    collaborators[index] = {
      ...collaborators[index],
      ...data,
      dataAtualizacao: new Date(),
    };
    return collaborators[index];
  }
  return null;
}

export async function deleteCollaborator(id: string): Promise<boolean> {
  await delay(500);
  const index = collaborators.findIndex(c => c._id === id);
  if (index !== -1) {
    collaborators[index].deletedAt = new Date();
    // In a real soft-delete, you might just set a flag.
    // For this simulation, we'll mark as deleted.
    return true;
  }
  return false;
}
