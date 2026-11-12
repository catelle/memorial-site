import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const client = new MongoClient(process.env.MONGODB_URI || '', { serverSelectionTimeoutMS: 10000 });
let databasePromise;

app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.MEMORIAL_SITE_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

async function database() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  if (!databasePromise) databasePromise = client.connect().then(() => client.db(process.env.MONGODB_DB || 'memorial_site'));
  return databasePromise;
}

const tributeFields = ['name', 'relation', 'message', 'city', 'date'];
const updateFields = ['title', 'date', 'location', 'description', 'imageUrl'];
const clean = (fields, body) => Object.fromEntries(fields.map(key => [key, typeof body[key] === 'string' ? body[key].trim() : '']));
const serialize = row => ({ ...row, _id: row._id?.toString() });

app.get('/api/memorial/tributes', async (_req, res) => {
  try { const rows = await (await database()).collection('memorial_tributes').find({ status: 'published' }).sort({ createdAt: -1 }).toArray(); res.json(rows.map(serialize)); }
  catch (error) { res.status(500).json({ message: error.message }); }
});
app.post('/api/memorial/tributes', async (req, res) => {
  try { const tribute = clean(tributeFields, req.body); if (!tribute.name || !tribute.message) return res.status(400).json({ message: 'Le nom et le message sont requis.' }); const now = new Date(); const collection = (await database()).collection('memorial_tributes'); const result = await collection.insertOne({ ...tribute, status: 'published', createdAt: now, updatedAt: now }); res.status(201).json(serialize(await collection.findOne({ _id: result.insertedId }))); }
  catch (error) { res.status(500).json({ message: error.message }); }
});
app.get('/api/memorial/updates', async (_req, res) => {
  try { const rows = await (await database()).collection('memorial_updates').find({ status: 'published' }).sort({ createdAt: -1 }).toArray(); res.json(rows.map(serialize)); }
  catch (error) { res.status(500).json({ message: error.message }); }
});
app.post('/api/memorial/updates', async (req, res) => {
  try { const update = clean(updateFields, req.body); if (!update.title || !update.description) return res.status(400).json({ message: 'Le titre et le contenu sont requis.' }); const now = new Date(); const collection = (await database()).collection('memorial_updates'); const result = await collection.insertOne({ ...update, status: 'published', createdAt: now, updatedAt: now }); res.status(201).json(serialize(await collection.findOne({ _id: result.insertedId }))); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

if (process.env.NODE_ENV !== 'production') app.listen(Number(process.env.PORT || 3001), () => console.log('Memorial API listening on port 3001'));
export default app;
