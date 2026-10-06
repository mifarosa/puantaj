// Match photos live in IndexedDB: they are far too large for localStorage.

const DB_NAME = 'puantaj';
const STORE = 'photos';
let dbPromise = null;

function db() {
  dbPromise ||= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('match', 'matchId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

// Runs `fn` in a transaction; resolves with a request's result or `fn`'s return value.
function tx(mode, fn) {
  return db().then((d) => new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out instanceof IDBRequest ? out.result : out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export function addPhoto(matchId, blob) {
  const rec = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    matchId,
    blob,
    createdAt: Date.now(),
  };
  return tx('readwrite', (s) => {
    s.put(rec);
    return rec;
  });
}

export async function photosFor(matchId) {
  const list = await tx('readonly', (s) => s.index('match').getAll(matchId));
  return list.sort((a, b) => a.createdAt - b.createdAt);
}

export async function photoCounts() {
  const all = await tx('readonly', (s) => s.getAll());
  const counts = new Map();
  for (const p of all) counts.set(p.matchId, [...(counts.get(p.matchId) || []), p]);
  return counts;
}

export function deletePhoto(id) {
  return tx('readwrite', (s) => s.delete(id));
}

export async function deletePhotosFor(matchIds) {
  const ids = new Set(matchIds);
  const all = await tx('readonly', (s) => s.getAll());
  const doomed = all.filter((p) => ids.has(p.matchId)).map((p) => p.id);
  if (!doomed.length) return;
  await tx('readwrite', (s) => doomed.forEach((id) => s.delete(id)));
}

export function clearPhotos() {
  return tx('readwrite', (s) => s.clear());
}

// Shrinks a camera photo to at most `max` px on the long side as JPEG.
export async function compressImage(file, max = 1600) {
  let bmp;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file; // unsupported format: keep the original
  }
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), 'image/jpeg', 0.82));
}
