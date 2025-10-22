import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://admin:admin@dbadm.7qftqmv.mongodb.net/?retryWrites=true&w=majority&appName=hydra-sales-system";

if (!uri) {
  throw new Error('A variável de ambiente "MONGODB_URI" é inválida/inexistente.');
}

const options = {
  serverSelectionTimeoutMS: 60000, 
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

let globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(uri, options);
  globalWithMongo._mongoClientPromise = client.connect();
}
clientPromise = globalWithMongo._mongoClientPromise;

export default clientPromise;
