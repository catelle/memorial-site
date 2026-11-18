export type Tribute = { _id?: string; name: string; relation: string; message: string; city: string; date: string; status?: 'published' | 'hidden'; createdAt?: string };
export type MemorialUpdate = { _id?: string; title: string; date: string; location: string; description: string; imageUrl: string };
export type Candle = { _id?: string; name: string; message: string; createdAt?: string };
export type CandleSummary = { count: number; candles: Candle[] };
export type Photo = { _id?: string; caption: string; date: string; location: string; imageUrl: string; order?: number };
export type Laureate = { _id?: string; name: string; year: string; className: string; distinction: string; note: string; imageUrl: string };

const TOKEN_KEY = 'memorial-family-token';

export const session = {
  get(): string {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY) || '';
      const expiry = Number(token.split('.')[0]);
      return expiry > Date.now() ? token : '';
    } catch { return ''; }
  },
  set(token: string) { try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ } },
  clear() { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
};

export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}

/** fetch wrapper: JSON in/out, family token when available, readable French errors. */
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.auth) headers.Authorization = `Bearer ${session.get()}`;
  let response: Response;
  try {
    response = await fetch(path, { method: options.method || 'GET', headers, body: options.body !== undefined ? JSON.stringify(options.body) : undefined });
  } catch {
    throw new ApiError('Le serveur est injoignable. Vérifiez votre connexion ou que l’API est bien démarrée.');
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = response.status === 404 || response.status >= 502
      ? 'Le serveur de l’API ne répond pas. Il doit être démarré (npm run server) et configuré.'
      : `Erreur ${response.status}`;
    if (response.status === 401 && options.auth) session.clear();
    throw new ApiError((data && typeof data.message === 'string' && data.message) || fallback, response.status);
  }
  return data as T;
}

/** Resize and compress an image file in the browser so it can be stored as a data URL. */
export function compressImage(file: File, maxSize = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Le fichier choisi n’est pas une image.')); return; }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Impossible de lire cette image.')); };
    image.src = url;
  });
}
