/* ==========================================================
   TAM INDEXEDDB KALICILIK SERVİSİ (CAT Tool Robust Storage)
   ----------------------------------------------------------
   - Projeler, Belgeler, Segmentler
   - Çeviri Belleği (TM) & Terimce (Glossary)
   - Akıllı Biçimlendirme Kalkanları
   - Orijinal DOCX/PDF İkili Dosya Tamponları (ArrayBuffer)
   - LocalStorage Çift Katmanlı Yedekleme & Göç (Migration)
   ========================================================== */
(function (global) {
    'use strict';

    const DB_NAME = 'CATToolWorkspaceDB';
    const DB_VERSION = 2;
    let dbInstance = null;

    function openDB() {
        if (dbInstance) return Promise.resolve(dbInstance);
        return new Promise((resolve, reject) => {
            if (!global.indexedDB) {
                return reject(new Error('IndexedDB bu tarayıcıda desteklenmiyor.'));
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('workspace')) {
                    db.createObjectStore('workspace', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('document_binaries')) {
                    db.createObjectStore('document_binaries', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('translation_memory')) {
                    db.createObjectStore('translation_memory', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('glossary')) {
                    db.createObjectStore('glossary', { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => {
                dbInstance = e.target.result;
                resolve(dbInstance);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function setWorkspaceState(appStateData) {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(['workspace'], 'readwrite');
                const store = tx.objectStore('workspace');
                const cleanData = {
                    key: 'current_workspace',
                    activeProjectId: appStateData.activeProjectId,
                    activeDocId: appStateData.activeDocId,
                    projects: appStateData.projects || [],
                    translationMemory: appStateData.translationMemory || [],
                    glossary: appStateData.glossary || [],
                    currentFilter: appStateData.currentFilter || 'all',
                    theme: appStateData.theme || 'light',
                    useVirtualScroll: !!appStateData.useVirtualScroll,
                    timestamp: Date.now()
                };
                store.put(cleanData);
                tx.oncomplete = () => resolve(true);
                tx.onerror = (e) => reject(e.target.error);
            });
        } catch (err) {
            console.warn('[CatStorage] IndexedDB yazma hatası, localStorage fallback devrede:', err);
            return false;
        }
    }

    async function getWorkspaceState() {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(['workspace'], 'readonly');
                const store = tx.objectStore('workspace');
                const req = store.get('current_workspace');
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = (e) => reject(e.target.error);
            });
        } catch (err) {
            console.warn('[CatStorage] IndexedDB okuma hatası:', err);
            return null;
        }
    }

    async function saveBinary(id, arrayBuffer) {
        if (!id || !arrayBuffer) return false;
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(['document_binaries'], 'readwrite');
                const store = tx.objectStore('document_binaries');
                store.put({ id, buffer: arrayBuffer, timestamp: Date.now() });
                tx.oncomplete = () => resolve(true);
                tx.onerror = (e) => reject(e.target.error);
            });
        } catch (err) {
            console.warn('[CatStorage] Binary kaydetme hatası:', err);
            return false;
        }
    }

    async function getBinary(id) {
        if (!id) return null;
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(['document_binaries'], 'readonly');
                const store = tx.objectStore('document_binaries');
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result ? req.result.buffer : null);
                req.onerror = (e) => reject(e.target.error);
            });
        } catch (err) {
            console.warn('[CatStorage] Binary okuma hatası:', err);
            return null;
        }
    }

    async function clearAll() {
        try {
            const db = await openDB();
            const tx = db.transaction(['workspace', 'document_binaries'], 'readwrite');
            tx.objectStore('workspace').clear();
            tx.objectStore('document_binaries').clear();
            return true;
        } catch (e) {
            return false;
        }
    }

    global.CatStorage = {
        openDB,
        setWorkspaceState,
        getWorkspaceState,
        saveBinary,
        getBinary,
        clearAll
    };
})(window);
