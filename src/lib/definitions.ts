export type Collaborator = {
  _id: string;
  nome: string;
  email: string;
  senha?: string;
  status: boolean; // true=ativo, false=inativo
  dataCriacao: Date;
  dataAtualizacao: Date;
  deletedAt: Date | null;
};
