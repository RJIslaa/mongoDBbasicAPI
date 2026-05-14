const { ConnectToDatabase, CloseDatabase } = require("./db");
const games = require("./games");

async function seed() {
  const { client, collection } = await ConnectToDatabase();
  await collection.deleteMany({});
  const result = await collection.insertMany(games);
  console.log(`${result.insertedCount} documents were inserted.`);
  return client;
}

seed()
  .then(async (client) => {
    if (client) {
      await client.close();
    }
  })
  .catch((error) => {
    console.error("Error seeding the database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await CloseDatabase();
  });