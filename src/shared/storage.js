const DB_NAME = 'fpsc-captures';
const DB_VERSION = 1;
const STORE = 'captures';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * @param {object} record
 * @returns {Promise<string>} capture id
 */
export async function saveCapture(record) {
  const db = await openDb();
  const id = record.id || `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const data = { ...record, id, createdAt: record.createdAt || Date.now() };

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  return id;
}

/**
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
export async function getCapture(id) {
  const db = await openDb();
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

/**
 * @param {string} id
 */
export async function deleteCapture(id) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export const DEFAULT_OPTIONS = {
  imageFormat: 'png',
  jpegQuality: 92,
  autoDownload: false,
  saveAsDialog: true,
  pdfPaperSize: 'a4',
  pdfOrientation: 'portrait',
  pdfSmartSplit: true,
  showWelcome: true,
  browserFrame: 'none',
  urlPlacement: 'none',
  showDateStamp: false,
};

/**
 * @returns {Promise<object>}
 */
export async function getOptions() {
  const { fpscOptions = {} } = await chrome.storage.sync.get('fpscOptions');
  return { ...DEFAULT_OPTIONS, ...fpscOptions };
}

/**
 * @param {object} options
 */
export async function saveOptions(options) {
  await chrome.storage.sync.set({ fpscOptions: options });
}