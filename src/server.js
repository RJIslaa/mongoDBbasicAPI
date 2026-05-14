require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path")
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;
const PORT = process.env.PORT || 3000;

let db;

// ── Connect to MongoDB, then start server ─────────────────────────────────────
MongoClient.connect(uri)
  .then((client) => {
    db = client.db(dbName);
    console.log(`✅ Connected to MongoDB — database: ${dbName}`);
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  });

// Helper — get the games collection
const col = () => db.collection(collectionName);

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    await db.command({ ping: 1 });
    res.json({ status: "ok", database: dbName });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── GET /api/games ────────────────────────────────────────────────────────────
// Supports query params:
//   ?mainCharacter=Leon S. Kennedy
//   ?minPrice=20&maxPrice=50
//   ?minYear=2000&maxYear=2020
//   ?maxPrice=30
app.get("/api/games", async (req, res) => {
  try {
    const query = req.query;
    const filter = {};

    // Filter by mainCharacter
    if (query.mainCharacter) {
      filter.mainCharacter = query.mainCharacter;
    }

    // Filter by price range
    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
    }

    // Filter by year range
    if (query.minYear || query.maxYear) {
      filter.year = {};
      if (query.minYear) filter.year.$gte = Number(query.minYear);
      if (query.maxYear) filter.year.$lte = Number(query.maxYear);
    }

    const games = await col().find(filter).toArray();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/games/:id ────────────────────────────────────────────────────────
app.get("/api/games/:id", async (req, res) => {
  try {
    const game = await col().findOne({ _id: new ObjectId(req.params.id) });
    if (!game) return res.status(404).json({ error: "Game not found" });
    res.json(game);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── POST /api/games ───────────────────────────────────────────────────────────
app.post("/api/games", async (req, res) => {
  try {
    const { name, year, price, mainCharacter } = req.body;
    if (!name || !year || !price || !mainCharacter) {
      return res.status(400).json({ error: "All fields are required: name, year, price, mainCharacter" });
    }
    const newGame = { name, year: Number(year), price: Number(price), mainCharacter };
    const result = await col().insertOne(newGame);
    res.status(201).json({ _id: result.insertedId, ...newGame });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/games/:id  (full replace) ────────────────────────────────────────
app.put("/api/games/:id", async (req, res) => {
  try {
    const { name, year, price, mainCharacter } = req.body;
    if (!name || !year || !price || !mainCharacter) {
      return res.status(400).json({ error: "All fields are required: name, year, price, mainCharacter" });
    }
    const replacement = { name, year: Number(year), price: Number(price), mainCharacter };
    const result = await col().replaceOne(
      { _id: new ObjectId(req.params.id) },
      replacement
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Game not found" });
    res.json({ _id: req.params.id, ...replacement });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PATCH /api/games/:id  (partial update) ────────────────────────────────────
app.patch("/api/games/:id", async (req, res) => {
  try {
    const updates = req.body;
    if (updates.year)  updates.year  = Number(updates.year);
    if (updates.price) updates.price = Number(updates.price);

    const result = await col().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Game not found" });
    res.json({ message: "Game updated", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/games/:id ─────────────────────────────────────────────────────
app.delete("/api/games/:id", async (req, res) => {
  try {
    const result = await col().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Game not found" });
    res.json({ message: "Game deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});