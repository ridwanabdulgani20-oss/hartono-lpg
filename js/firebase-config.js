// ===== KONFIGURASI FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyCl7mOzjV54oF0oZunnIARYED5A-lyA8CQ",
    authDomain: "lpgue-6ea73.firebaseapp.com",
    projectId: "lpgue-6ea73",
    storageBucket: "lpgue-6ea73.firebasestorage.app",
    messagingSenderId: "921438358143",
    appId: "1:921438358143:web:94395f7fdb4d8c8ac9cd4a",
    measurementId: "G-0N1NZXHPHL"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
window.db = db;

// Key data yang disinkronkan ke cloud
const SYNC_KEYS = [
    'penjualan', 'barang_masuk', 'pengeluaran', 'stok', 'stok_movements',
    'master_lpg', 'master_users', 'master_toko', 'master_harga', 'stok_distribusi'
];

// Simpan referensi asli localStorage
const _origSetItem = localStorage.setItem.bind(localStorage);
const _origGetItem = localStorage.getItem.bind(localStorage);

// Flag untuk mencegah loop saat update dari cloud
let _isApplyingCloudUpdate = false;
// Menandai apakah proses sinkron awal sudah selesai
let _initialSyncDone = false;
// Menandai proses penghapusan data sedang berlangsung (agar tidak ada push/pull liar)
window._clearingData = false;

// Intercept setItem: setiap kali data berubah, kirim ke Firestore
localStorage.setItem = function (key, value) {
    _origSetItem(key, value);
    if (SYNC_KEYS.includes(key) && !_isApplyingCloudUpdate && _initialSyncDone && !window._clearingData && window.db) {
        db.collection('appdata').doc(key).set({ value: value, updatedAt: Date.now() })
            .catch(err => console.error('Gagal sinkron ke cloud:', err));
    }
};

// Sinkron awal: gabungkan data cloud dan lokal dengan aman
async function initialSync() {
    if (!window.db) return;
    try {
        const snapshot = await db.collection('appdata').get();
        const cloudData = {};
        snapshot.forEach(doc => {
            cloudData[doc.id] = doc.data();
        });

        for (const key of SYNC_KEYS) {
            const localValue = _origGetItem(key);
            const cloudEntry = cloudData[key];

            if (cloudEntry && cloudEntry.value !== undefined) {
                // Cloud sudah punya entri (termasuk nilai kosong) -> cloud adalah sumber kebenaran
                _origSetItem(key, cloudEntry.value);
            } else if (localValue != null) {
                // Cloud belum pernah punya entri sama sekali -> dorong lokal ke cloud
                await db.collection('appdata').doc(key).set({ value: localValue, updatedAt: Date.now() });
            }
        }
        console.log('Sinkronisasi awal selesai. Data terhubung ke cloud.');
    } catch (err) {
        console.error('Gagal sinkronisasi awal:', err);
    } finally {
        _initialSyncDone = true;
    }
}

// Listener realtime: jika data berubah di perangkat lain, update otomatis
function setupRealtimeSync() {
    if (!window.db) return;
    db.collection('appdata').onSnapshot(snapshot => {
        if (snapshot.metadata.hasPendingWrites) return;
        // Jangan proses apa pun saat sedang menghapus semua data
        if (window._clearingData) return;

        let adaPerubahan = false;
        snapshot.docChanges().forEach(change => {
            const key = change.doc.id;
            if (change.type === 'added' || change.type === 'modified') {
                const value = change.doc.data().value;
                if (value != null && _origGetItem(key) !== value) {
                    _isApplyingCloudUpdate = true;
                    _origSetItem(key, value);
                    _isApplyingCloudUpdate = false;
                    adaPerubahan = true;
                }
            } else if (change.type === 'removed') {
                // Data dihapus di perangkat lain -> hapus juga di lokal
                _isApplyingCloudUpdate = true;
                localStorage.removeItem(key);
                _isApplyingCloudUpdate = false;
                adaPerubahan = true;
            }
        });
        if (adaPerubahan && typeof window.refreshCurrentPage === 'function') {
            window.refreshCurrentPage();
        }
    }, err => console.error('Realtime sync error:', err));
}

// Jalankan: sinkron awal dulu, baru pasang listener realtime
window.cloudReady = initialSync().then(() => {
    setupRealtimeSync();
    if (typeof window.reloadCustomUsers === 'function') {
        window.reloadCustomUsers();
    }
});
