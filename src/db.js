require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

let client;
let collection;

async function ConnectToDatabase() {
  if (collection && client) {
    return { client, collection };
  }

  client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  collection = db.collection(collectionName);
  return { client, collection };
}

function ToObjectId(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return new ObjectId(id);
}

async function CloseDatabase() {
  if (client) {
    await client.close();
    client = undefined;
    collection = undefined;
  }
}

module.exports = {
  ConnectToDatabase,
  ToObjectId,
  CloseDatabase,
};