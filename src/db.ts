import { type Collection, MongoClient } from "mongodb";
import type { Asset, BotCommand, BotCommandSentence } from "./types";

let dbClient: MongoClient;
export async function connectToDatabase(uri: string) {
  if (!dbClient) {
    dbClient = new MongoClient(uri);
    await dbClient.connect();
  }
  return dbClient;
}

export async function closeDatabase() {
  if (dbClient) {
    await dbClient.close();
  }
}
export async function getAssetCollection(client: MongoClient): Promise<Collection<Asset>> {
  return client.db("starBot").collection<Asset>("assets");
}
export async function getCommandCollection(client: MongoClient): Promise<Collection<BotCommand>> {
  return client.db("starBot").collection<BotCommand>("commands");
}
export async function getCommandSentenceCollection(
  client: MongoClient
): Promise<Collection<BotCommandSentence>> {
  return client.db("starBot").collection<BotCommandSentence>("commandsentences");
}
