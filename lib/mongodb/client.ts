/**
 * Cliente MongoDB Singleton
 * 
 * Mantém uma única conexão com MongoDB reutilizada em toda a aplicação.
 * Configurado para trabalhar com Next.js e ambientes serverless.
 */

import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URL) {
  throw new Error('MONGODB_URL não está definida no .env');
}

if (!process.env.MONGODB_DATABASE) {
  throw new Error('MONGODB_DATABASE não está definida no .env');
}

const uri = process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DATABASE;
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 60000,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

/**
 * Obtém o cliente MongoDB (singleton)
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  if (!clientPromise) {
    console.log('🔌 [MongoDB] Conectando ao banco de dados...');
    clientPromise = MongoClient.connect(uri, options);
  }

  client = await clientPromise;
  console.log('✅ [MongoDB] Conexão estabelecida');
  
  return client;
}

/**
 * Obtém o banco de dados MongoDB
 */
export async function getMongoDatabase(): Promise<Db> {
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}

/**
 * Fecha a conexão com MongoDB
 * Útil para testes ou shutdown graceful
 */
export async function closeMongoConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    clientPromise = null;
    console.log('🔒 [MongoDB] Conexão fechada');
  }
}

/**
 * Testa a conexão com MongoDB
 */
export async function testMongoConnection(): Promise<boolean> {
  try {
    const db = await getMongoDatabase();
    await db.command({ ping: 1 });
    console.log('✅ [MongoDB] Ping bem-sucedido');
    return true;
  } catch (error) {
    console.error('❌ [MongoDB] Erro na conexão:', error);
    return false;
  }
}
