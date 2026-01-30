/**
 * offlineQueue.js
 * 
 * IndexedDB-based offline queue for storing mutations when network is unavailable.
 * Automatically syncs when back online.
 */

const DB_NAME = 'senteng-erp-offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'offline-queue';

let db = null;

/**
 * Initialize IndexedDB
 */
export async function initOfflineQueue() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains(QUEUE_STORE)) {
                const store = database.createObjectStore(QUEUE_STORE, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                store.createIndex('status', 'status', { unique: false });
            }
        };
    });
}

/**
 * Generate idempotency key for a request
 */
function generateIdempotencyKey(request) {
    const data = JSON.stringify({
        method: request.method,
        url: request.url,
        body: request.body,
        timestamp: Math.floor(Date.now() / 60000) // 1-minute granularity
    });
    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `idem_${Math.abs(hash).toString(36)}`;
}

/**
 * Add a request to the offline queue
 */
export async function queueRequest(request) {
    if (!db) await initOfflineQueue();

    const queueItem = {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers || []),
        body: request.body,
        idempotencyKey: generateIdempotencyKey(request),
        createdAt: new Date().toISOString(),
        status: 'pending',
        retryCount: 0,
        lastError: null
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);

        // Check for duplicate idempotency key
        const index = store.index('status');
        const pendingRequest = index.openCursor(IDBKeyRange.only('pending'));

        pendingRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.idempotencyKey === queueItem.idempotencyKey) {
                    // Duplicate request, skip
                    resolve({ skipped: true, reason: 'duplicate' });
                    return;
                }
                cursor.continue();
            } else {
                // No duplicate, add to queue
                const addRequest = store.add(queueItem);
                addRequest.onsuccess = () => resolve({ id: addRequest.result });
                addRequest.onerror = () => reject(addRequest.error);
            }
        };
    });
}

/**
 * Get all pending requests
 */
export async function getPendingRequests() {
    if (!db) await initOfflineQueue();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const index = store.index('status');
        const request = index.getAll(IDBKeyRange.only('pending'));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update request status
 */
export async function updateRequestStatus(id, status, error = null) {
    if (!db) await initOfflineQueue();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
                item.status = status;
                item.lastError = error;
                item.retryCount = (item.retryCount || 0) + (status === 'pending' ? 1 : 0);
                item.updatedAt = new Date().toISOString();

                const putRequest = store.put(item);
                putRequest.onsuccess = () => resolve(item);
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                reject(new Error('Request not found'));
            }
        };
    });
}

/**
 * Remove completed request
 */
export async function removeRequest(id) {
    if (!db) await initOfflineQueue();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Process all pending requests when back online
 */
export async function processPendingRequests(onProgress) {
    const pending = await getPendingRequests();
    const results = { success: 0, failed: 0, skipped: 0 };

    for (const item of pending) {
        // Skip if too many retries
        if (item.retryCount >= 3) {
            await updateRequestStatus(item.id, 'failed', 'Max retries exceeded');
            results.skipped++;
            continue;
        }

        try {
            const response = await fetch(item.url, {
                method: item.method,
                headers: {
                    ...item.headers,
                    'X-Idempotency-Key': item.idempotencyKey
                },
                body: item.body
            });

            if (response.ok) {
                await removeRequest(item.id);
                results.success++;
            } else {
                const errorText = await response.text();
                await updateRequestStatus(item.id, 'pending', `HTTP ${response.status}: ${errorText}`);
                results.failed++;
            }
        } catch (error) {
            await updateRequestStatus(item.id, 'pending', error.message);
            results.failed++;
        }

        if (onProgress) {
            onProgress(results);
        }
    }

    return results;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
    if (!db) await initOfflineQueue();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            const items = request.result;
            resolve({
                total: items.length,
                pending: items.filter(i => i.status === 'pending').length,
                failed: items.filter(i => i.status === 'failed').length
            });
        };
        request.onerror = () => reject(request.error);
    });
}

// Auto-sync when back online
if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
        console.log('[OfflineQueue] Back online, processing pending requests...');
        const results = await processPendingRequests();
        console.log('[OfflineQueue] Sync complete:', results);
    });
}
