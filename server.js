import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
let databasePromise;

// Images uploaded from the family space are sent as compressed data URLs.
app.use(express.json({ limit: '4mb' }));
app.set('etag', false);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.MEMORIAL_SITE_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

async function database() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI n’est pas configuré sur le serveur.');
  if (!databasePromise) databasePromise = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 }).connect().then(client => client.db(process.env.MONGODB_DB || 'memorial_site')).catch(error => { databasePromise = undefined; throw error; });
  return databasePromise;
}
const collection = async name => (await database()).collection(name);

const tributeFields = ['name', 'relation', 'message', 'city', 'date'];
const updateFields = ['title', 'date', 'location', 'description', 'imageUrl'];
const laureateFields = ['name', 'year', 'className', 'distinction', 'note', 'imageUrl'];
const clean = (fields, body = {}) => Object.fromEntries(fields.map(key => [key, typeof body[key] === 'string' ? body[key].trim() : '']));
const serialize = row => ({ ...row, _id: row._id?.toString() });
const objectId = id => { try { return new ObjectId(id); } catch { return null; } };
const fail = (res, error) => res.status(500).json({ message: error.message });

/* ---------- Family (admin) authentication ----------
   Stateless signed token: "<expiry>.<hmac>". Set ADMIN_PASSWORD (and optionally ADMIN_SECRET). */
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const adminSecret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';
const sign = value => crypto.createHmac('sha256', adminSecret()).update(value).digest('hex');
const sameText = (a, b) => {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
};
function validToken(token) {
  if (!adminSecret() || typeof token !== 'string') return false;
  const [expiry, signature] = token.split('.');
  if (!expiry || !signature || Number(expiry) < Date.now()) return false;
  return sameText(signature, sign(expiry));
}
function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!validToken(token)) return res.status(401).json({ message: 'Session expirée ou accès non autorisé. Veuillez vous reconnecter.' });
  next();
}

app.post('/api/memorial/admin/login', (req, res) => {
  if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ message: 'Le mot de passe de l’espace famille n’est pas configuré sur le serveur (ADMIN_PASSWORD).' });
  if (!sameText(req.body?.password || '', process.env.ADMIN_PASSWORD)) return res.status(401).json({ message: 'Mot de passe incorrect.' });
  const expiry = String(Date.now() + TOKEN_TTL_MS);
  res.json({ token: `${expiry}.${sign(expiry)}`, expiresAt: Number(expiry) });
});
app.get('/api/memorial/admin/session', requireAdmin, (_req, res) => res.json({ ok: true }));

/* ---------- Tributes ---------- */
app.get('/api/memorial/tributes', async (_req, res) => {
  try { const rows = await (await collection('memorial_tributes')).find({ status: 'published' }).sort({ createdAt: -1 }).toArray(); res.json(rows.map(serialize)); }
  catch (error) { fail(res, error); }
});
app.post('/api/memorial/tributes', async (req, res) => {
  try {
    const tribute = clean(tributeFields, req.body);
    if (!tribute.name || !tribute.message) return res.status(400).json({ message: 'Le nom et le message sont requis.' });
    if (tribute.message.length > 3000) return res.status(400).json({ message: 'Le message est trop long (3000 caractères maximum).' });
    const now = new Date(); const tributes = await collection('memorial_tributes');
    const result = await tributes.insertOne({ ...tribute, status: 'published', createdAt: now, updatedAt: now });
    res.status(201).json(serialize(await tributes.findOne({ _id: result.insertedId })));
  } catch (error) { fail(res, error); }
});
app.get('/api/memorial/admin/tributes', requireAdmin, async (_req, res) => {
  try { const rows = await (await collection('memorial_tributes')).find({}).sort({ createdAt: -1 }).toArray(); res.json(rows.map(serialize)); }
  catch (error) { fail(res, error); }
});
app.patch('/api/memorial/tributes/:id', requireAdmin, async (req, res) => {
  try {
    const _id = objectId(req.params.id); const status = req.body?.status;
    if (!_id || !['published', 'hidden'].includes(status)) return res.status(400).json({ message: 'Requête invalide.' });
    const row = await (await collection('memorial_tributes')).findOneAndUpdate({ _id }, { $set: { status, updatedAt: new Date() } }, { returnDocument: 'after' });
    if (!row) return res.status(404).json({ message: 'Hommage introuvable.' });
    res.json(serialize(row));
  } catch (error) { fail(res, error); }
});
app.delete('/api/memorial/tributes/:id', requireAdmin, async (req, res) => {
  try { const _id = objectId(req.params.id); if (!_id) return res.status(400).json({ message: 'Identifiant invalide.' }); await (await collection('memorial_tributes')).deleteOne({ _id }); res.status(204).end(); }
  catch (error) { fail(res, error); }
});

/* ---------- Generic CRUD for family-managed content (updates, laureates) ---------- */
function managedContent(path, collectionName, fields, required, sortField) {
  app.get(path, async (_req, res) => {
    try { const rows = await (await collection(collectionName)).find({ status: 'published' }).sort({ [sortField]: -1, createdAt: -1 }).toArray(); res.json(rows.map(serialize)); }
    catch (error) { fail(res, error); }
  });
  app.post(path, requireAdmin, async (req, res) => {
    try {
      const doc = clean(fields, req.body);
      if (required.some(key => !doc[key])) return res.status(400).json({ message: 'Veuillez remplir les champs obligatoires.' });
      const now = new Date(); const rows = await collection(collectionName);
      const result = await rows.insertOne({ ...doc, status: 'published', createdAt: now, updatedAt: now });
      res.status(201).json(serialize(await rows.findOne({ _id: result.insertedId })));
    } catch (error) { fail(res, error); }
  });
  app.put(`${path}/:id`, requireAdmin, async (req, res) => {
    try {
      const _id = objectId(req.params.id); const doc = clean(fields, req.body);
      if (!_id) return res.status(400).json({ message: 'Identifiant invalide.' });
      if (required.some(key => !doc[key])) return res.status(400).json({ message: 'Veuillez remplir les champs obligatoires.' });
      const row = await (await collection(collectionName)).findOneAndUpdate({ _id }, { $set: { ...doc, updatedAt: new Date() } }, { returnDocument: 'after' });
      if (!row) return res.status(404).json({ message: 'Élément introuvable.' });
      res.json(serialize(row));
    } catch (error) { fail(res, error); }
  });
  app.delete(`${path}/:id`, requireAdmin, async (req, res) => {
    try { const _id = objectId(req.params.id); if (!_id) return res.status(400).json({ message: 'Identifiant invalide.' }); await (await collection(collectionName)).deleteOne({ _id }); res.status(204).end(); }
    catch (error) { fail(res, error); }
  });
}
managedContent('/api/memorial/updates', 'memorial_updates', updateFields, ['title', 'description'], 'createdAt');
managedContent('/api/memorial/laureates', 'memorial_laureates', laureateFields, ['name', 'year'], 'year');

/* ---------- Candles (each visitor can leave a name and a short message) ---------- */
const candleFields = ['name', 'message'];
async function candleSummary(limit = 300) {
  const candles = await collection('memorial_candles');
  const [count, rows] = await Promise.all([
    candles.countDocuments({ status: { $ne: 'hidden' } }),
    candles.find({ status: { $ne: 'hidden' } }).sort({ createdAt: -1 }).limit(limit).toArray(),
  ]);
  return { count, candles: rows.map(serialize) };
}
app.get('/api/memorial/candles', async (_req, res) => {
  try { res.json(await candleSummary()); }
  catch (error) { fail(res, error); }
});
app.post('/api/memorial/candles', async (req, res) => {
  try {
    const candle = clean(candleFields, req.body);
    candle.name = candle.name.slice(0, 80); candle.message = candle.message.slice(0, 180);
    const now = new Date(); const candles = await collection('memorial_candles');
    const result = await candles.insertOne({ ...candle, status: 'published', createdAt: now });
    const saved = serialize(await candles.findOne({ _id: result.insertedId }));
    res.status(201).json({ candle: saved, count: await candles.countDocuments({ status: { $ne: 'hidden' } }) });
  } catch (error) { fail(res, error); }
});
app.delete('/api/memorial/candles/:id', requireAdmin, async (req, res) => {
  try { const _id = objectId(req.params.id); if (!_id) return res.status(400).json({ message: 'Identifiant invalide.' }); await (await collection('memorial_candles')).deleteOne({ _id }); res.status(204).end(); }
  catch (error) { fail(res, error); }
});

/* ---------- Captioned photos ----------
   The image is stored as a data URL but served from its own versioned URL,
   so the list stays light and browsers can cache each picture. */
const MAX_IMAGE_CHARS = 3_500_000;
const photoFields = ['caption', 'date', 'location'];
const photoMeta = row => {
  const { imageData, ...rest } = row;
  return { ...serialize(rest), imageUrl: `/api/memorial/photos/${row._id}/image?v=${new Date(row.updatedAt || row.createdAt).getTime()}` };
};
const photoSections = ['home', 'prix'];
const photoSection = value => (photoSections.includes(value) ? value : 'home');
// Photos created before sections existed have no `section` field: they belong to the home page.
const sectionFilter = section => (section === 'home' ? { section: { $in: [null, 'home'] } } : { section });
const validImage = value => typeof value === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,/.test(value) && value.length <= MAX_IMAGE_CHARS;
app.get('/api/memorial/photos', async (req, res) => {
  try { const rows = await (await collection('memorial_photos')).find({ status: 'published', ...sectionFilter(photoSection(req.query.section)) }, { projection: { imageData: 0 } }).sort({ order: 1, createdAt: 1 }).toArray(); res.json(rows.map(photoMeta)); }
  catch (error) { fail(res, error); }
});
app.get('/api/memorial/photos/:id/image', async (req, res) => {
  try {
    const _id = objectId(req.params.id); if (!_id) return res.status(400).end();
    const row = await (await collection('memorial_photos')).findOne({ _id }, { projection: { imageData: 1 } });
    const match = row?.imageData?.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match) return res.status(404).end();
    res.setHeader('Content-Type', match[1]);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(Buffer.from(match[2], 'base64'));
  } catch (error) { fail(res, error); }
});
app.post('/api/memorial/photos', requireAdmin, async (req, res) => {
  try {
    const doc = clean(photoFields, req.body);
    if (!validImage(req.body?.imageData)) return res.status(400).json({ message: 'Image manquante, invalide ou trop lourde.' });
    const section = photoSection(req.body?.section);
    const now = new Date(); const photos = await collection('memorial_photos');
    const last = await photos.find(sectionFilter(section)).sort({ order: -1 }).limit(1).toArray();
    const result = await photos.insertOne({ ...doc, section, imageData: req.body.imageData, order: (last[0]?.order ?? 0) + 1, status: 'published', createdAt: now, updatedAt: now });
    res.status(201).json(photoMeta(await photos.findOne({ _id: result.insertedId }, { projection: { imageData: 0 } })));
  } catch (error) { fail(res, error); }
});
app.put('/api/memorial/photos/:id', requireAdmin, async (req, res) => {
  try {
    const _id = objectId(req.params.id); if (!_id) return res.status(400).json({ message: 'Identifiant invalide.' });
    const update = { ...clean(photoFields, req.body), updatedAt: new Date() };
    if (req.body?.imageData) { if (!validImage(req.body.imageData)) return res.status(400).json({ message: 'Image invalide ou trop lourde.' }); update.imageData = req.body.imageData; }
    if (Number.isFinite(req.body?.order)) update.order = req.body.order;
    const row = await (await collection('memorial_photos')).findOneAndUpdate({ _id }, { $set: update }, { returnDocument: 'after', projection: { imageData: 0 } });
    if (!row) return res.status(404).json({ message: 'Photo introuvable.' });
    res.json(photoMeta(row));
  } catch (error) { fail(res, error); }
});
app.delete('/api/memorial/photos/:id', requireAdmin, async (req, res) => {
  try { const _id = objectId(req.params.id); if (!_id) return res.status(400).json({ message: 'Identifiant invalide.' }); await (await collection('memorial_photos')).deleteOne({ _id }); res.status(204).end(); }
  catch (error) { fail(res, error); }
});

export function configurationWarnings() {
  const warnings = [];
  if (!process.env.MONGODB_URI) warnings.push('MONGODB_URI is not set — tributes, candles and the family space will not work.');
  if (!process.env.ADMIN_PASSWORD) warnings.push('ADMIN_PASSWORD is not set — the family space (/famille) cannot be unlocked.');
  return warnings;
}

// Standalone mode (`npm run server`). In dev, vite.config.ts mounts this app directly; on Vercel, api/index.js imports it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3001);
  app.listen(port, () => {
    console.log(`Memorial API listening on port ${port}`);
    configurationWarnings().forEach(w => console.warn(`⚠ ${w}`));
  });
}
export default app;
