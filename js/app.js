// ===== LOGIN =====
const USERS = [
    { username: 'admin', password: 'admin123' },
    { username: 'hartono', password: 'hartono123' }
];

function checkLogin() {
    const loggedIn = sessionStorage.getItem('loggedIn');
    if (loggedIn === 'true') {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('app-wrapper').style.display = '';
        const currentUser = sessionStorage.getItem('currentUser');
        applyRole(currentUser);
    }
}

document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    const user = USERS.find(u => u.username === username && u.password === password);
    
    if (user) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('currentUser', username);
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('app-wrapper').style.display = '';
        document.getElementById('login-error').style.display = 'none';
        applyRole(username);
        initApp();
        refreshCurrentPage();
        resetInactivityTimer();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

checkLogin();

// ===== ROLE MANAGEMENT =====
function applyRole(username) {
    const isAdmin = (username === 'admin');
    const adminOnlyPages = ['stok', 'master-data'];
    
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        const page = link.dataset.page;
        if (adminOnlyPages.includes(page)) {
            link.style.display = isAdmin ? '' : 'none';
        }
    });
    
    // If non-admin is on admin-only page, redirect to penjualan
    if (!isAdmin) {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id.replace('page-', '');
            if (adminOnlyPages.includes(pageId)) {
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById('page-penjualan').classList.add('active');
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelector('.nav-link[data-page="penjualan"]').classList.add('active');
            }
        }
    }
}

// Logout
function doLogout(auto) {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('currentUser');
    document.getElementById('app-wrapper').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    if (auto) {
        setTimeout(() => alert('Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan masuk kembali untuk melanjutkan.'), 100);
    }
}

document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Yakin ingin keluar?')) {
        doLogout(false);
    }
});

// ===== AUTO LOGOUT (10 menit tidak aktif) =====
let inactivityTimer = null;
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 menit

function resetInactivityTimer() {
    if (sessionStorage.getItem('loggedIn') !== 'true') return;
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        doLogout(true);
    }, INACTIVITY_LIMIT);
}

['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click'].forEach(evt => {
    document.addEventListener(evt, resetInactivityTimer, { passive: true });
});

// Start timer if already logged in
if (sessionStorage.getItem('loggedIn') === 'true') {
    resetInactivityTimer();
}

// ===== DATA STORE (localStorage) =====
const Store = {
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    getStok() {
        const stok = localStorage.getItem('stok');
        return stok ? JSON.parse(stok) : { lpg3kg: 0, lpg12kg: 0 };
    },
    setStok(stok) {
        localStorage.setItem('stok', JSON.stringify(stok));
    }
};

// ===== UTILITIES =====
function formatRupiah(angka) {
    return 'Rp ' + angka.toLocaleString('id-ID');
}

// ===== PAGINATION =====
const PAGE_SIZE = 10;
const paginationState = {};

function isAdminUser() {
    return sessionStorage.getItem('currentUser') === 'admin';
}

function renderPagination(tableId, data, renderRow) {
    if (!paginationState[tableId]) paginationState[tableId] = 1;
    
    const currentPage = paginationState[tableId];
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    
    // Clamp
    if (currentPage > totalPages) paginationState[tableId] = totalPages;
    
    const start = (paginationState[tableId] - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = data.slice(start, end);
    
    // Render rows
    const tbody = document.getElementById(tableId);
    tbody.innerHTML = pageData.map((item, i) => renderRow(item, start + i)).join('');
    
    // Render pagination controls
    let paginationEl = document.getElementById(`pagination-${tableId}`);
    if (!paginationEl) {
        paginationEl = document.createElement('div');
        paginationEl.id = `pagination-${tableId}`;
        paginationEl.className = 'pagination';
        tbody.closest('table').insertAdjacentElement('afterend', paginationEl);
    }
    
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    
    let paginationHtml = `<span class="pagination-info">Halaman ${paginationState[tableId]} dari ${totalPages} (${data.length} data)</span><div class="pagination-buttons">`;
    
    paginationHtml += `<button class="pagination-btn" onclick="goToPage('${tableId}', 1)" ${paginationState[tableId] === 1 ? 'disabled' : ''}>&laquo;</button>`;
    paginationHtml += `<button class="pagination-btn" onclick="goToPage('${tableId}', ${paginationState[tableId] - 1})" ${paginationState[tableId] === 1 ? 'disabled' : ''}>&lsaquo;</button>`;
    
    // Page numbers
    const startPage = Math.max(1, paginationState[tableId] - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    for (let p = startPage; p <= endPage; p++) {
        paginationHtml += `<button class="pagination-btn ${p === paginationState[tableId] ? 'active' : ''}" onclick="goToPage('${tableId}', ${p})">${p}</button>`;
    }
    
    paginationHtml += `<button class="pagination-btn" onclick="goToPage('${tableId}', ${paginationState[tableId] + 1})" ${paginationState[tableId] === totalPages ? 'disabled' : ''}>&rsaquo;</button>`;
    paginationHtml += `<button class="pagination-btn" onclick="goToPage('${tableId}', ${totalPages})" ${paginationState[tableId] === totalPages ? 'disabled' : ''}>&raquo;</button>`;
    paginationHtml += '</div>';
    
    paginationEl.innerHTML = paginationHtml;
}

function goToPage(tableId, page) {
    paginationState[tableId] = page;
    // Re-trigger the refresh for the appropriate table
    switch(tableId) {
        case 'recent-transactions': refreshDashboard(); break;
        case 'tabel-penjualan-hari': refreshPenjualanHari(); break;
        case 'tabel-barang-masuk': refreshBarangMasuk(); break;
        case 'tabel-pengeluaran': refreshPengeluaran(); break;
        case 'tabel-stok': refreshStok(); break;
        case 'tabel-laporan': 
            if (typeof generateLaporan === 'function') generateLaporan(currentPeriodeFilter);
            break;
    }
}

function formatTanggal(dateStr) {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
}

function getHargaPokokByJenis(jenis) {
    const lpgList = Store.get('master_lpg');
    const filtered = lpgList.filter(item => item.jenis === jenis);
    return filtered.map(item => item.harga);
}

function generateInvoiceNo() {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    return `INV-${y}${m}${d}-${rand}`;
}

function getTodayStr() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const page = document.querySelector('.page.active');
    page.insertBefore(alert, page.children[1]);
    
    setTimeout(() => alert.remove(), 3000);
}

// ===== NAVIGATION =====
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (!page) return;
        
        // Reset semua tampilan sementara sebelum pindah
        resetAllPageStates();
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');
        
        refreshPage(page);
    });
});

function resetAllPageStates() {
    // Reset filter/detail Laporan
    const laporanDetail = document.getElementById('laporan-detail-wrapper');
    if (laporanDetail) laporanDetail.style.display = 'none';
    const filterJenis = document.getElementById('filter-jenis-lpg');
    if (filterJenis) filterJenis.selectedIndex = 0;
    if (typeof currentLpgFilter !== 'undefined') currentLpgFilter = '';
    
    // Reset form Penyesuaian Stok
    const stokWrapper = document.getElementById('form-stok-wrapper');
    if (stokWrapper) stokWrapper.style.display = 'none';
    const btnSesuaikan = document.getElementById('btn-sesuaikan-stok');
    if (btnSesuaikan) btnSesuaikan.style.display = '';
    const stokDetail = document.getElementById('stok-adj-detail');
    if (stokDetail) stokDetail.style.display = 'none';
    const stokJenis = document.getElementById('stok-adj-jenis');
    if (stokJenis) stokJenis.selectedIndex = 0;
    const stokKet = document.getElementById('stok-adj-ket');
    if (stokKet) stokKet.value = '';
    
    // Reset form tambah LPG di Master Data
    const lpgWrapper = document.getElementById('form-lpg-wrapper');
    if (lpgWrapper) lpgWrapper.style.display = 'none';
    const btnTambahLpg = document.getElementById('btn-tambah-lpg');
    if (btnTambahLpg) btnTambahLpg.style.display = '';
    
    // Reset form tambah User di Master Data
    const userWrapper = document.getElementById('form-user-wrapper');
    if (userWrapper) userWrapper.style.display = 'none';
    const btnTambahUser = document.getElementById('btn-tambah-user');
    if (btnTambahUser) btnTambahUser.style.display = '';
    
    // Reset pagination ke halaman 1
    Object.keys(paginationState).forEach(key => paginationState[key] = 1);
}

function refreshPage(page) {
    switch(page) {
        case 'dashboard': refreshDashboard(); break;
        case 'penjualan': break;
        case 'barang-masuk': refreshBarangMasuk(); break;
        case 'pengeluaran': refreshPengeluaran(); break;
        case 'laporan': refreshLaporan(); break;
        case 'stok': refreshStok(); break;
        case 'master-data': refreshMasterData(); break;
    }
}

// ===== DASHBOARD =====
function refreshDashboard() {
    const today = getTodayStr();
    const penjualan = Store.get('penjualan');
    const stok = Store.getStok();
    
    const todaySales = penjualan.filter(p => p.tanggal === today);
    const totalHari = todaySales.reduce((sum, p) => sum + p.total, 0);
    
    document.getElementById('stat-penjualan-hari').textContent = formatRupiah(totalHari);
    document.getElementById('stat-transaksi-hari').textContent = todaySales.length;
    document.getElementById('stat-stok-3kg').textContent = stok.lpg3kg;
    document.getElementById('stat-stok-12kg').textContent = stok.lpg12kg;
    
    // Charts
    renderChartMingguan(penjualan);
    
    // Recent transactions
    const recent = penjualan.slice().reverse();
    renderPagination('recent-transactions', recent, (p) => `
        <tr>
            <td>${p.invoice}</td>
            <td>${formatTanggal(p.tanggal)}</td>
            <td>${p.pelanggan}</td>
            <td>${formatRupiah(p.total)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showInvoice('${p.invoice}')">&#128196; Invoice</button>
            </td>
        </tr>
    `);
}

// ===== CHARTS =====
function renderLineChart(containerId, data, labels, color, unit) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const containerWidth = container.parentElement.clientWidth || 900;
    const width = Math.max(containerWidth, data.length * 25);
    const height = 180;
    const padding = { top: 25, right: 15, bottom: 30, left: 15 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    
    const maxVal = Math.max(...data, 1);
    
    // Generate points
    const points = data.map((val, i) => {
        const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
        const y = padding.top + chartH - (val / maxVal) * chartH;
        return { x, y, val, label: labels[i] };
    });
    
    // Path
    let linePath = '';
    let areaPath = '';
    points.forEach((p, i) => {
        if (i === 0) {
            linePath += `M ${p.x} ${p.y}`;
            areaPath += `M ${p.x} ${height - padding.bottom} L ${p.x} ${p.y}`;
        } else {
            // Smooth curve
            const prev = points[i - 1];
            const cpx = (prev.x + p.x) / 2;
            linePath += ` C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
            areaPath += ` C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
        }
    });
    areaPath += ` L ${points[points.length - 1].x} ${height - padding.bottom} Z`;
    
    // Grid lines
    let gridLines = '';
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i / 4) * chartH;
        gridLines += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="line-chart-grid"/>`;
    }
    
    // Labels - show all dates
    const labelStep = data.length <= 7 ? 1 : 1; // Always show all
    let labelElements = '';
    labels.forEach((label, i) => {
        const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
        labelElements += `<text x="${x}" y="${height - 8}" class="line-chart-label">${label}</text>`;
    });
    
    // Dots & values
    let dotsElements = '';
    points.forEach(p => {
        if (p.val > 0) {
            dotsElements += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" class="line-chart-dot" stroke="white" stroke-width="2"/>`;
            dotsElements += `<text x="${p.x}" y="${p.y - 10}" class="line-chart-value">${p.val}${unit ? ' ' + unit : ''}</text>`;
        }
    });
    
    container.innerHTML = `
        <svg class="line-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
            ${gridLines}
            <path d="${areaPath}" class="line-chart-area" fill="${color}"/>
            <path d="${linePath}" class="line-chart-path" stroke="${color}"/>
            ${dotsElements}
            ${labelElements}
        </svg>
    `;
}

function renderBarChart(containerId, data, labels, color) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const containerWidth = container.parentElement.clientWidth || 600;
    const width = Math.max(containerWidth, data.length * 60);
    const height = 180;
    const padding = { top: 30, right: 15, bottom: 35, left: 15 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    
    const maxVal = Math.max(...data, 1);
    const barWidth = Math.min(50, (chartW / data.length) * 0.6);
    const gap = (chartW / data.length);
    
    // Grid lines
    let gridLines = '';
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i / 4) * chartH;
        gridLines += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`;
    }
    
    // Bars
    let bars = '';
    data.forEach((val, i) => {
        const x = padding.left + (i * gap) + (gap - barWidth) / 2;
        const barH = (val / maxVal) * chartH;
        const y = padding.top + chartH - barH;
        
        bars += `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${color}" opacity="0.85">
                <animate attributeName="height" from="0" to="${barH}" dur="0.5s" fill="freeze"/>
                <animate attributeName="y" from="${padding.top + chartH}" to="${y}" dur="0.5s" fill="freeze"/>
            </rect>
            <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.min(barH, 6)}" rx="4" fill="#64ffda" opacity="0.6"/>
        `;
        
        // Value on top
        if (val > 0) {
            bars += `<text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="${color}">${val}</text>`;
        }
        
        // Label at bottom
        bars += `<text x="${x + barWidth / 2}" y="${height - 8}" text-anchor="middle" font-size="9" fill="#64748b" font-weight="600">${labels[i] || ''}</text>`;
    });
    
    container.innerHTML = `
        <svg class="line-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
            ${gridLines}
            <line x1="${padding.left}" y1="${padding.top + chartH}" x2="${width - padding.right}" y2="${padding.top + chartH}" stroke="#e2e8f0" stroke-width="2"/>
            ${bars}
        </svg>
    `;
}

function renderChartMingguan(penjualan) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const data3kg = [];
    const data12kg = [];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const daySales = penjualan.filter(p => p.tanggal === dateStr);
        
        data3kg.push(daySales.reduce((sum, p) => sum + (p.qty3kg || 0), 0));
        data12kg.push(daySales.reduce((sum, p) => sum + (p.qty12kg || 0), 0));
    }
    
    renderLineChart('chart-mingguan-3kg', data3kg, days, '#10b981', '');
    renderLineChart('chart-mingguan-12kg', data12kg, days, '#f59e0b', '');
    
    // Labels
    const weekStart = monday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekEnd = sunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const label = `${weekStart} - ${weekEnd}`;
    document.getElementById('chart-week-label-3kg').textContent = label;
    document.getElementById('chart-week-label-12kg').textContent = label;
}

function renderChartBulanan(penjualan, startDate, endDate, jenisFilter) {
    let start, end;
    
    if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
    } else {
        const today = new Date();
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    
    const data = [];
    const labels = [];
    const current = new Date(start);
    
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const daySales = penjualan.filter(p => {
            if (jenisFilter && p.jenis !== jenisFilter) return false;
            return p.tanggal === dateStr;
        });
        const qty = daySales.reduce((sum, p) => sum + (p.qty3kg || 0) + (p.qty12kg || 0), 0);
        data.push(qty);
        labels.push(current.getDate().toString());
        current.setDate(current.getDate() + 1);
    }
    
    renderLineChart('chart-bulanan', data, labels, '#0A192F', '');
    
    const startLabel = start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const endLabel = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('chart-month-label').textContent = `${startLabel} - ${endLabel}`;
}

// ===== PENJUALAN =====
// Set default date
document.getElementById('tgl-jual').value = getTodayStr();

// Auto-calculate total
document.getElementById('jenis-lpg').addEventListener('change', function() {
    const jenis = this.value;
    if (jenis) {
        const hargaList = getHargaPokokByJenis(jenis);
        if (hargaList.length > 0) {
            showHargaModalPopup(hargaList, jenis);
        }
    }
    calculateTotal();
});

['qty-lpg', 'harga-lpg'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateTotal);
});

function showHargaModalPopup(options, jenis) {
    const stok = Store.getStok();
    let jenisLabel = '';
    
    if (jenis === '3kg') { jenisLabel = '3 Kg'; }
    else if (jenis === '12kg') { jenisLabel = '12 Kg'; }
    else if (jenis === '5.5kg') { jenisLabel = '5,5 Kg'; }
    else if (jenis === '50kg') { jenisLabel = '50 Kg'; }
    
    const stokAktual = jenis === '3kg' ? stok.lpg3kg : jenis === '12kg' ? stok.lpg12kg : 0;
    
    // Cek distribusi tersimpan
    const stokDistribusi = JSON.parse(localStorage.getItem('stok_distribusi') || '{}');
    const savedDistribusi = stokDistribusi[jenis];
    
    let stokPerHarga = {};
    
    if (savedDistribusi) {
        const savedTotal = Object.values(savedDistribusi).reduce((sum, val) => sum + val, 0);
        if (savedTotal === stokAktual) {
            stokPerHarga = { ...savedDistribusi };
        } else if (savedTotal > 0) {
            const rasio = stokAktual / savedTotal;
            const keys = Object.keys(savedDistribusi).sort((a, b) => Number(a) - Number(b));
            let distributed = 0;
            keys.forEach((key, i) => {
                if (i === keys.length - 1) {
                    stokPerHarga[key] = stokAktual - distributed;
                } else {
                    stokPerHarga[key] = Math.round(savedDistribusi[key] * rasio);
                    distributed += stokPerHarga[key];
                }
            });
        }
    } else {
        // Hitung dari barang masuk - penjualan
        const barangMasuk = Store.get('barang_masuk');
        const penjualan = Store.get('penjualan');
        
        barangMasuk.filter(b => b.jenis === jenis).forEach(b => {
            const hargaSatuan = b.jenis === '3kg' ? b.harga3kg : b.harga12kg;
            if (hargaSatuan > 0) {
                if (!stokPerHarga[hargaSatuan]) stokPerHarga[hargaSatuan] = 0;
                stokPerHarga[hargaSatuan] += (b.qty3kg || 0) + (b.qty12kg || 0);
            }
        });
        
        penjualan.filter(p => p.jenis === jenis && p.hargaModal > 0).forEach(p => {
            const qty = (p.qty3kg || 0) + (p.qty12kg || 0);
            if (stokPerHarga[p.hargaModal] !== undefined) {
                stokPerHarga[p.hargaModal] -= qty;
                if (stokPerHarga[p.hargaModal] < 0) stokPerHarga[p.hargaModal] = 0;
            }
        });
        
        const totalHitung = Object.values(stokPerHarga).reduce((sum, val) => sum + val, 0);
        if (totalHitung !== stokAktual && totalHitung > 0) {
            const rasio = stokAktual / totalHitung;
            const prices = Object.keys(stokPerHarga).map(Number).sort((a, b) => a - b);
            let distributed = 0;
            prices.forEach((price, i) => {
                if (i === prices.length - 1) {
                    stokPerHarga[price] = stokAktual - distributed;
                } else {
                    stokPerHarga[price] = Math.round(stokPerHarga[price] * rasio);
                    distributed += stokPerHarga[price];
                }
            });
        } else if (totalHitung === 0 && stokAktual > 0) {
            if (options.length > 0) {
                stokPerHarga[options[0]] = stokAktual;
            }
        }
    }
    
    const container = document.getElementById('harga-options');
    container.innerHTML = options.map(harga => {
        const qtyHarga = stokPerHarga[harga] || 0;
        const habis = qtyHarga <= 0;
        if (habis) {
            return `
        <button class="btn" style="width:100%; font-size:1rem; display:flex; justify-content:space-between; align-items:center; padding:0.8rem 1.5rem; background:#e2e8f0; color:#94a3b8; cursor:not-allowed;" disabled>
            <span>${formatRupiah(harga)}</span>
            <span style="font-size:0.8rem; font-weight:700; color:#dc2626;">Stok Habis</span>
        </button>
    `;
        }
        return `
        <button class="btn btn-primary" style="width:100%; font-size:1rem; display:flex; justify-content:space-between; align-items:center; padding:0.8rem 1.5rem;" onclick="selectHargaModal(${harga})">
            <span>${formatRupiah(harga)}</span>
            <span style="font-size:0.8rem; opacity:0.8;">Sisa Stok ${qtyHarga}</span>
        </button>
    `}).join('');
    document.getElementById('modal-pilih-harga').style.display = 'flex';
}

let selectedHargaModal = 0;

function selectHargaModal(harga) {
    selectedHargaModal = harga;
    document.getElementById('modal-pilih-harga').style.display = 'none';
}

function selectHarga(harga) {
    document.getElementById('harga-lpg').value = harga;
    document.getElementById('modal-pilih-harga').style.display = 'none';
    calculateTotal();
}

function calculateTotal() {
    const qty = parseInt(document.getElementById('qty-lpg').value) || 0;
    const harga = parseInt(document.getElementById('harga-lpg').value) || 0;
    const total = qty * harga;
    document.getElementById('total-penjualan').textContent = formatRupiah(total);
}

document.getElementById('form-penjualan').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const jenis = document.getElementById('jenis-lpg').value;
    const qty = parseInt(document.getElementById('qty-lpg').value) || 0;
    const harga = parseInt(document.getElementById('harga-lpg').value) || 0;
    
    if (qty === 0) {
        showAlert('Masukkan jumlah minimal 1!', 'error');
        return;
    }
    
    // Check stok
    const stok = Store.getStok();
    if (jenis === '3kg' && qty > stok.lpg3kg) {
        showAlert(`Stok LPG 3kg tidak cukup! Tersedia: ${stok.lpg3kg}`, 'error');
        return;
    }
    if (jenis === '12kg' && qty > stok.lpg12kg) {
        showAlert(`Stok LPG 12kg tidak cukup! Tersedia: ${stok.lpg12kg}`, 'error');
        return;
    }
    
    const qty3kg = jenis === '3kg' ? qty : 0;
    const qty12kg = jenis === '12kg' ? qty : 0;
    
    const transaksi = {
        invoice: generateInvoiceNo(),
        tanggal: document.getElementById('tgl-jual').value,
        pelanggan: document.getElementById('nama-pelanggan').value,
        alamat: '',
        telepon: '',
        jenis: jenis,
        qty3kg: qty3kg,
        harga3kg: jenis === '3kg' ? harga : 0,
        qty12kg: qty12kg,
        harga12kg: jenis === '12kg' ? harga : 0,
        subtotal3kg: qty3kg * (jenis === '3kg' ? harga : 0),
        subtotal12kg: qty12kg * (jenis === '12kg' ? harga : 0),
        total: qty * harga,
        hargaModal: selectedHargaModal,
        totalModal: qty * selectedHargaModal,
        keuntungan: (qty * harga) - (qty * selectedHargaModal),
        metodeBayar: document.getElementById('metode-bayar').value,
        keterangan: document.getElementById('keterangan-jual').value,
        inputBy: sessionStorage.getItem('currentUser') || '-',
        createdAt: new Date().toISOString()
    };
    
    // Save
    const penjualan = Store.get('penjualan');
    penjualan.push(transaksi);
    Store.set('penjualan', penjualan);
    
    // Update stok
    stok.lpg3kg -= qty3kg;
    stok.lpg12kg -= qty12kg;
    Store.setStok(stok);
    
    // Update distribusi stok per harga
    if (selectedHargaModal > 0) {
        const stokDistribusi = JSON.parse(localStorage.getItem('stok_distribusi') || '{}');
        if (stokDistribusi[jenis] && stokDistribusi[jenis][selectedHargaModal] !== undefined) {
            stokDistribusi[jenis][selectedHargaModal] -= qty;
            if (stokDistribusi[jenis][selectedHargaModal] < 0) stokDistribusi[jenis][selectedHargaModal] = 0;
            localStorage.setItem('stok_distribusi', JSON.stringify(stokDistribusi));
        }
    }
    
    // Save stok movement
    const movements = Store.get('stok_movements');
    movements.push({
        tanggal: transaksi.tanggal,
        jenis: 'keluar',
        lpg3kg: qty3kg,
        lpg12kg: qty12kg,
        keterangan: `Penjualan - ${transaksi.invoice}`
    });
    Store.set('stok_movements', movements);
    
    showAlert(`Transaksi ${transaksi.invoice} berhasil disimpan!`);
    
    // Reset form
    document.getElementById('nama-pelanggan').value = '';
    document.getElementById('qty-lpg').value = '';
    document.getElementById('harga-lpg').value = '';
    document.getElementById('keterangan-jual').value = '';
    document.getElementById('jenis-lpg').selectedIndex = 0;
    document.getElementById('metode-bayar').selectedIndex = 0;
    document.getElementById('total-penjualan').textContent = 'Rp 0';
    selectedHargaModal = 0;
    
    refreshPenjualanHari();
    
    // Tanya cetak invoice
    showCetakConfirm(transaksi.invoice);
});

function refreshPenjualanHari() {
    const today = getTodayStr();
    const penjualan = Store.get('penjualan');
    const todaySales = penjualan.filter(p => p.tanggal === today).reverse();
    
    renderPagination('tabel-penjualan-hari', todaySales, (p) => {
        const jenisLabel = p.jenis ? ({'3kg':'LPG 3 kg','5.5kg':'LPG 5,5 kg','12kg':'LPG 12 kg','50kg':'LPG 50 kg'}[p.jenis] || p.jenis) : 
                          (p.qty3kg > 0 ? 'LPG 3 kg' : 'LPG 12 kg');
        const qtyLabel = p.jenis ? (p.jenis === '3kg' ? p.qty3kg : p.qty12kg) : ((p.qty3kg || 0) + (p.qty12kg || 0));
        const hargaModalLabel = p.hargaModal ? formatRupiah(p.hargaModal) : '-';
        return `
        <tr>
            <td>${p.invoice}</td>
            <td>${p.pelanggan}</td>
            <td>${jenisLabel}</td>
            <td>${qtyLabel}</td>
            <td>${hargaModalLabel}</td>
            <td>${formatRupiah(p.total)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showInvoice('${p.invoice}')">&#128196; Invoice</button>
                ${isAdminUser() ? `<button class="btn btn-sm btn-danger" onclick="hapusPenjualan('${p.invoice}')">&#128465;</button>` : ''}
            </td>
        </tr>
    `});
}

function hapusPenjualan(invoice) {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    
    let penjualan = Store.get('penjualan');
    const item = penjualan.find(p => p.invoice === invoice);
    
    if (item) {
        // Return stok
        const stok = Store.getStok();
        stok.lpg3kg += item.qty3kg;
        stok.lpg12kg += item.qty12kg;
        Store.setStok(stok);
        
        // Remove
        penjualan = penjualan.filter(p => p.invoice !== invoice);
        Store.set('penjualan', penjualan);
        
        showAlert('Transaksi berhasil dihapus!');
        refreshPenjualanHari();
    }
}

// Edit Penjualan
function editPenjualan(invoice) {
    const penjualan = Store.get('penjualan');
    const item = penjualan.find(p => p.invoice === invoice);
    if (!item) return;
    
    const qty = (item.qty3kg || 0) + (item.qty12kg || 0);
    const hargaJual = qty > 0 ? Math.round(item.total / qty) : 0;
    
    document.getElementById('edit-penjualan-id').value = invoice;
    document.getElementById('edit-penjualan-tgl').value = item.tanggal;
    document.getElementById('edit-penjualan-pelanggan').value = item.pelanggan;
    document.getElementById('edit-penjualan-qty').value = qty;
    document.getElementById('edit-penjualan-harga').value = hargaJual;
    document.getElementById('edit-penjualan-metode').value = item.metodeBayar || 'tunai';
    document.getElementById('edit-penjualan-ket').value = item.keterangan || '';
    
    document.getElementById('modal-edit-penjualan').style.display = 'flex';
}

document.getElementById('btn-batal-edit-penjualan').addEventListener('click', () => {
    document.getElementById('modal-edit-penjualan').style.display = 'none';
});

document.getElementById('form-edit-penjualan').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const invoice = document.getElementById('edit-penjualan-id').value;
    let penjualan = Store.get('penjualan');
    const index = penjualan.findIndex(p => p.invoice === invoice);
    if (index === -1) return;
    
    const oldItem = penjualan[index];
    const oldQty3 = oldItem.qty3kg || 0;
    const oldQty12 = oldItem.qty12kg || 0;
    
    const newQty = parseInt(document.getElementById('edit-penjualan-qty').value) || 0;
    const newHarga = parseInt(document.getElementById('edit-penjualan-harga').value) || 0;
    const newTotal = newQty * newHarga;
    
    const jenis = oldItem.jenis || '3kg';
    const newQty3 = jenis === '3kg' ? newQty : 0;
    const newQty12 = jenis === '12kg' ? newQty : 0;
    
    penjualan[index] = {
        ...oldItem,
        tanggal: document.getElementById('edit-penjualan-tgl').value,
        pelanggan: document.getElementById('edit-penjualan-pelanggan').value,
        qty3kg: newQty3,
        qty12kg: newQty12,
        harga3kg: jenis === '3kg' ? newHarga : 0,
        harga12kg: jenis === '12kg' ? newHarga : 0,
        subtotal3kg: newQty3 * (jenis === '3kg' ? newHarga : 0),
        subtotal12kg: newQty12 * (jenis === '12kg' ? newHarga : 0),
        total: newTotal,
        keuntungan: oldItem.hargaModal ? newTotal - (newQty * oldItem.hargaModal) : 0,
        totalModal: oldItem.hargaModal ? newQty * oldItem.hargaModal : 0,
        metodeBayar: document.getElementById('edit-penjualan-metode').value,
        keterangan: document.getElementById('edit-penjualan-ket').value,
        editCount: (oldItem.editCount || 0) + 1,
        lastEditBy: sessionStorage.getItem('currentUser'),
        lastEditAt: new Date().toISOString()
    };
    
    Store.set('penjualan', penjualan);
    
    // Update stok
    const stok = Store.getStok();
    stok.lpg3kg = stok.lpg3kg + oldQty3 - newQty3;
    stok.lpg12kg = stok.lpg12kg + oldQty12 - newQty12;
    Store.setStok(stok);
    
    document.getElementById('modal-edit-penjualan').style.display = 'none';
    showAlert('Penjualan berhasil diperbarui!');
    
    if (currentLpgFilter) filterLaporanByJenis();
});

// ===== INVOICE =====
function showInvoice(invoiceNo) {
    const penjualan = Store.get('penjualan');
    const trx = penjualan.find(p => p.invoice === invoiceNo);
    
    if (!trx) return;
    
    const content = document.getElementById('invoice-content');
    content.innerHTML = `
        <div class="invoice-header-section" style="text-align:center; border-bottom:1px dashed #333; padding-bottom:8px; margin-bottom:8px;">
            <img src="img/hartono.png" alt="HARTONO" style="width:80px; height:auto; object-fit:contain; margin-bottom:4px;">
            <h1 style="font-size:16px; margin-bottom:2px;">HARTONO</h1>
            <p style="font-size:9px; margin:0;">Kp. Jagawana No. 64 Rt.004 Rw.005</p>
            <p style="font-size:9px; margin:0;">Desa Sukarukun, Kec. Sukatani, Kab. Bekasi 17631</p>
            <p style="font-size:9px; margin:0;">Hubungi : 0813-1675-6034 / 0896-5305-0516</p>
        </div>
        <div style="margin-bottom:8px; font-size:11px;">
            <p><strong>No:</strong> ${trx.invoice}</p>
            <p><strong>Tgl:</strong> ${formatTanggal(trx.tanggal)}</p>
            <p><strong>Pelanggan:</strong> ${trx.pelanggan}</p>
            <p><strong>Bayar:</strong> ${trx.metodeBayar.toUpperCase()}</p>
        </div>
        <table class="invoice-table" style="width:100%; border-collapse:collapse; margin-bottom:8px; font-size:10px;">
            <thead>
                <tr>
                    <th style="text-align:left; padding:3px; border-bottom:1px dashed #333;">Barang</th>
                    <th style="text-align:center; padding:3px; border-bottom:1px dashed #333;">Qty</th>
                    <th style="text-align:right; padding:3px; border-bottom:1px dashed #333;">Harga</th>
                    <th style="text-align:right; padding:3px; border-bottom:1px dashed #333;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${trx.qty3kg > 0 ? `
                <tr>
                    <td style="padding:3px;">LPG 3kg</td>
                    <td style="text-align:center; padding:3px;">${trx.qty3kg}</td>
                    <td style="text-align:right; padding:3px;">${formatRupiah(trx.harga3kg)}</td>
                    <td style="text-align:right; padding:3px;">${formatRupiah(trx.subtotal3kg)}</td>
                </tr>` : ''}
                ${trx.qty12kg > 0 ? `
                <tr>
                    <td style="padding:3px;">LPG 12kg</td>
                    <td style="text-align:center; padding:3px;">${trx.qty12kg}</td>
                    <td style="text-align:right; padding:3px;">${formatRupiah(trx.harga12kg)}</td>
                    <td style="text-align:right; padding:3px;">${formatRupiah(trx.subtotal12kg)}</td>
                </tr>` : ''}
            </tbody>
        </table>
        <div style="border-top:1px dashed #333; padding-top:6px; text-align:right; font-size:14px; font-weight:700;">
            TOTAL: ${formatRupiah(trx.total)}
        </div>
        <div style="margin-top:10px; text-align:center; font-size:9px; color:#666; border-top:1px dashed #333; padding-top:6px;">
            <p>Terima kasih atas pembelian Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat dikembalikan.</p>
        </div>
    `;
    
    document.getElementById('modal-invoice').style.display = 'flex';
}

document.getElementById('btn-close-invoice').addEventListener('click', () => {
    document.getElementById('modal-invoice').style.display = 'none';
});

document.getElementById('btn-close-invoice-2').addEventListener('click', () => {
    document.getElementById('modal-invoice').style.display = 'none';
});

// Close any modal when clicking outside the modal content
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

document.getElementById('btn-print-invoice').addEventListener('click', () => {
    window.print();
});

// ===== KONFIRMASI CETAK INVOICE =====
let pendingInvoiceNo = null;

function showCetakConfirm(invoiceNo) {
    pendingInvoiceNo = invoiceNo;
    document.getElementById('modal-cetak-confirm').style.display = 'flex';
}

document.getElementById('btn-cetak-ya').addEventListener('click', () => {
    document.getElementById('modal-cetak-confirm').style.display = 'none';
    if (pendingInvoiceNo) {
        showInvoice(pendingInvoiceNo);
        setTimeout(() => {
            window.print();
        }, 300);
    }
    pendingInvoiceNo = null;
});

document.getElementById('btn-cetak-tidak').addEventListener('click', () => {
    document.getElementById('modal-cetak-confirm').style.display = 'none';
    pendingInvoiceNo = null;
});

// ===== BARANG MASUK =====
document.getElementById('tgl-masuk').value = getTodayStr();

let selectedHargaMasuk = 0;
let pendingBarangMasuk = null;

// Pop up harga muncul saat pilih Jenis LPG
document.getElementById('masuk-jenis-lpg').addEventListener('change', function() {
    const jenis = this.value;
    selectedHargaMasuk = 0;
    
    const hargaList = getHargaPokokByJenis(jenis);
    if (hargaList.length > 0) {
        showHargaMasukPopup(hargaList);
    } else {
        const harga = prompt('Masukkan harga beli satuan:');
        if (harga) {
            selectedHargaMasuk = parseInt(harga) || 0;
        }
    }
    calculateTotalPembelian();
});

document.getElementById('masuk-qty').addEventListener('input', calculateTotalPembelian);

document.getElementById('form-barang-masuk').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const jenis = document.getElementById('masuk-jenis-lpg').value;
    const qty = parseInt(document.getElementById('masuk-qty').value) || 0;
    
    if (qty === 0) {
        showAlert('Masukkan jumlah minimal 1!', 'error');
        return;
    }
    
    if (selectedHargaMasuk === 0) {
        showAlert('Pilih harga beli terlebih dahulu! Silakan pilih ulang Jenis LPG.', 'error');
        return;
    }
    
    simpanBarangMasuk();
});

function showHargaMasukPopup(options) {
    const container = document.getElementById('harga-options');
    container.innerHTML = options.map(harga => `
        <button class="btn btn-primary" style="width:100%; font-size:1rem;" onclick="selectHargaMasuk(${harga})">
            ${formatRupiah(harga)}
        </button>
    `).join('');
    document.getElementById('modal-pilih-harga').style.display = 'flex';
}

function selectHargaMasuk(harga) {
    selectedHargaMasuk = harga;
    document.getElementById('modal-pilih-harga').style.display = 'none';
    calculateTotalPembelian();
}

function calculateTotalPembelian() {
    const qty = parseInt(document.getElementById('masuk-qty').value) || 0;
    const total = qty * selectedHargaMasuk;
    document.getElementById('total-pembelian').textContent = formatRupiah(total);
}

function simpanBarangMasuk() {
    const jenis = document.getElementById('masuk-jenis-lpg').value;
    const qty = parseInt(document.getElementById('masuk-qty').value) || 0;
    const harga = selectedHargaMasuk;
    const qty3kg = jenis === '3kg' ? qty : 0;
    const qty12kg = jenis === '12kg' ? qty : 0;
    
    const barangMasuk = {
        id: Date.now().toString(),
        tanggal: document.getElementById('tgl-masuk').value,
        vendor: document.getElementById('nama-vendor').value,
        jenis: jenis,
        qty3kg: qty3kg,
        harga3kg: jenis === '3kg' ? harga : 0,
        qty12kg: qty12kg,
        harga12kg: jenis === '12kg' ? harga : 0,
        total: qty * harga,
        keterangan: document.getElementById('keterangan-masuk').value,
        inputBy: sessionStorage.getItem('currentUser') || '-',
        createdAt: new Date().toISOString()
    };
    
    // Save
    const barangMasukList = Store.get('barang_masuk');
    barangMasukList.push(barangMasuk);
    Store.set('barang_masuk', barangMasukList);
    
    // Update stok
    const stok = Store.getStok();
    stok.lpg3kg += qty3kg;
    stok.lpg12kg += qty12kg;
    Store.setStok(stok);
    
    // Update distribusi stok per harga (jika ada)
    const stokDistribusi = JSON.parse(localStorage.getItem('stok_distribusi') || '{}');
    if (stokDistribusi[jenis]) {
        if (stokDistribusi[jenis][harga] === undefined) stokDistribusi[jenis][harga] = 0;
        stokDistribusi[jenis][harga] += qty;
        localStorage.setItem('stok_distribusi', JSON.stringify(stokDistribusi));
    }
    
    // Save stok movement
    const movements = Store.get('stok_movements');
    movements.push({
        tanggal: barangMasuk.tanggal,
        jenis: 'masuk',
        lpg3kg: qty3kg,
        lpg12kg: qty12kg,
        keterangan: `Vendor: ${barangMasuk.vendor}`
    });
    Store.set('stok_movements', movements);
    
    showAlert('Barang masuk berhasil disimpan!');
    
    // Reset
    document.getElementById('nama-vendor').value = '';
    document.getElementById('masuk-qty').value = '';
    document.getElementById('keterangan-masuk').value = '';
    document.getElementById('masuk-jenis-lpg').selectedIndex = 0;
    document.getElementById('total-pembelian').textContent = 'Rp 0';
    selectedHargaMasuk = 0;
    
    refreshBarangMasuk();
}

function refreshBarangMasuk() {
    const barangMasuk = Store.get('barang_masuk');
    const recent = barangMasuk.slice().reverse();
    const currentUser = sessionStorage.getItem('currentUser');
    const isAdmin = (currentUser === 'admin');
    
    renderPagination('tabel-barang-masuk', recent, (b) => {
        const jenisLabel = b.jenis ? ({'3kg':'LPG 3 kg','5.5kg':'LPG 5,5 kg','12kg':'LPG 12 kg','50kg':'LPG 50 kg'}[b.jenis] || b.jenis) :
                          (b.qty3kg > 0 ? 'LPG 3 kg' : 'LPG 12 kg');
        const qtyLabel = b.jenis ? (b.jenis === '3kg' ? b.qty3kg : b.jenis === '12kg' ? b.qty12kg : (b.qty3kg || 0) + (b.qty12kg || 0)) : ((b.qty3kg || 0) + (b.qty12kg || 0));
        
        const editCount = b.editCount || 0;
        const canEdit = isAdmin || editCount < 1;
        
        return `
        <tr>
            <td>${formatTanggal(b.tanggal)}</td>
            <td>${b.vendor}</td>
            <td>${jenisLabel}</td>
            <td>${qtyLabel}</td>
            <td>${formatRupiah(b.total / qtyLabel)}</td>
            <td>${formatRupiah(b.total)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewBarangMasuk('${b.id}')">&#128065; Lihat</button>
                ${canEdit ? `<button class="btn btn-sm btn-primary" onclick="editBarangMasuk('${b.id}')">&#9998; Ubah</button>` : '<span style="color:#94a3b8; font-size:0.75rem;">Sudah diubah</span>'}
                ${isAdminUser() ? `<button class="btn btn-sm btn-danger" onclick="hapusBarangMasuk('${b.id}')">&#128465;</button>` : ''}
            </td>
        </tr>
    `});
}

// View Barang Masuk
function viewBarangMasuk(id) {
    const barangMasuk = Store.get('barang_masuk');
    const item = barangMasuk.find(b => b.id === id);
    if (!item) return;
    
    const jenisLabel = item.jenis ? ({'3kg':'LPG 3 Kg','5.5kg':'LPG 5,5 Kg','12kg':'LPG 12 Kg','50kg':'LPG 50 Kg'}[item.jenis] || item.jenis) : '-';
    const qtyLabel = item.jenis ? (item.jenis === '3kg' ? item.qty3kg : item.jenis === '12kg' ? item.qty12kg : (item.qty3kg || 0) + (item.qty12kg || 0)) : ((item.qty3kg || 0) + (item.qty12kg || 0));
    const hargaSatuan = qtyLabel > 0 ? item.total / qtyLabel : 0;
    
    const content = document.getElementById('view-barang-content');
    content.innerHTML = `
        <table style="width:100%; font-size:0.9rem;">
            <tr><td style="padding:0.5rem 0; color:#64748b; width:40%;">Tanggal</td><td style="padding:0.5rem 0; font-weight:600;">${formatTanggal(item.tanggal)}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Vendor</td><td style="padding:0.5rem 0; font-weight:600;">${item.vendor}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Jenis LPG</td><td style="padding:0.5rem 0; font-weight:600;">${jenisLabel}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Jumlah (Qty)</td><td style="padding:0.5rem 0; font-weight:600;">${qtyLabel} tabung</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Harga Satuan</td><td style="padding:0.5rem 0; font-weight:600;">${formatRupiah(hargaSatuan)}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Total</td><td style="padding:0.5rem 0; font-weight:700; color:#0A192F; font-size:1.1rem;">${formatRupiah(item.total)}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Keterangan</td><td style="padding:0.5rem 0; font-weight:600;">${item.keterangan || '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Diinput oleh</td><td style="padding:0.5rem 0; font-weight:600;">${item.inputBy || '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Waktu input</td><td style="padding:0.5rem 0; font-weight:500; font-size:0.8rem; color:#94a3b8;">${item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-'}</td></tr>
            ${item.editCount ? `<tr><td style="padding:0.5rem 0; color:#64748b;">Diedit oleh</td><td style="padding:0.5rem 0; font-size:0.85rem; color:#f59e0b; font-weight:600;">${item.lastEditBy || '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Waktu edit</td><td style="padding:0.5rem 0; font-size:0.8rem; color:#f59e0b;">${item.lastEditAt ? new Date(item.lastEditAt).toLocaleString('id-ID') : '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Jumlah edit</td><td style="padding:0.5rem 0; font-size:0.8rem; color:#f59e0b;">${item.editCount}x</td></tr>` : ''}
        </table>
    `;
    
    document.getElementById('modal-view-barang').style.display = 'flex';
}

document.getElementById('btn-close-view-barang').addEventListener('click', () => {
    document.getElementById('modal-view-barang').style.display = 'none';
});

// View Pengeluaran
function viewPengeluaran(id) {
    const pengeluaran = Store.get('pengeluaran');
    const item = pengeluaran.find(p => p.id === id);
    if (!item) return;
    
    const content = document.getElementById('view-pengeluaran-content');
    content.innerHTML = `
        <table style="width:100%; font-size:0.9rem;">
            <tr><td style="padding:0.5rem 0; color:#64748b; width:40%;">Tanggal</td><td style="padding:0.5rem 0; font-weight:600;">${formatTanggal(item.tanggal)}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Keterangan</td><td style="padding:0.5rem 0; font-weight:600;">${item.keterangan}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Total Harga</td><td style="padding:0.5rem 0; font-weight:700; color:#dc2626; font-size:1.1rem;">${formatRupiah(item.total)}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Diinput oleh</td><td style="padding:0.5rem 0; font-weight:600;">${item.inputBy || '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Waktu input</td><td style="padding:0.5rem 0; font-size:0.8rem; color:#94a3b8;">${item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-'}</td></tr>
            ${item.editCount ? `<tr><td style="padding:0.5rem 0; color:#64748b;">Diedit oleh</td><td style="padding:0.5rem 0; font-size:0.85rem; color:#f59e0b; font-weight:600;">${item.lastEditBy || '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Waktu edit</td><td style="padding:0.5rem 0; font-size:0.8rem; color:#f59e0b;">${item.lastEditAt ? new Date(item.lastEditAt).toLocaleString('id-ID') : '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Jumlah edit</td><td style="padding:0.5rem 0; font-size:0.8rem; color:#f59e0b;">${item.editCount}x</td></tr>` : ''}
        </table>
    `;
    document.getElementById('modal-view-pengeluaran').style.display = 'flex';
}

document.getElementById('btn-close-view-pengeluaran').addEventListener('click', () => {
    document.getElementById('modal-view-pengeluaran').style.display = 'none';
});

// View Penjualan
function viewPenjualan(invoice) {
    const penjualan = Store.get('penjualan');
    const item = penjualan.find(p => p.invoice === invoice);
    if (!item) return;
    
    const jenisLabel = item.jenis ? ({'3kg':'LPG 3 Kg','5.5kg':'LPG 5,5 Kg','12kg':'LPG 12 Kg','50kg':'LPG 50 Kg'}[item.jenis] || item.jenis) : '-';
    const qty = (item.qty3kg || 0) + (item.qty12kg || 0);
    const hargaJual = qty > 0 ? Math.round(item.total / qty) : 0;
    
    const content = document.getElementById('view-penjualan-content');
    content.innerHTML = `
        <table style="width:100%; font-size:0.9rem;">
            <tr><td style="padding:0.5rem 0; color:#64748b; width:40%;">No. Invoice</td><td style="padding:0.5rem 0; font-weight:600;">${item.invoice}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Tanggal</td><td style="padding:0.5rem 0; font-weight:600;">${formatTanggal(item.tanggal)}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Pelanggan</td><td style="padding:0.5rem 0; font-weight:600;">${item.pelanggan}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Jenis LPG</td><td style="padding:0.5rem 0; font-weight:600;">${jenisLabel}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Qty</td><td style="padding:0.5rem 0; font-weight:600;">${qty} tabung</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Harga Jual</td><td style="padding:0.5rem 0; font-weight:600;">${formatRupiah(hargaJual)}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Harga Modal</td><td style="padding:0.5rem 0; font-weight:600;">${item.hargaModal ? formatRupiah(item.hargaModal) : '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Total</td><td style="padding:0.5rem 0; font-weight:700; color:#0A192F; font-size:1.1rem;">${formatRupiah(item.total)}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Keuntungan</td><td style="padding:0.5rem 0; font-weight:700; color:#16a34a;">${item.keuntungan ? formatRupiah(item.keuntungan) : '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Pembayaran</td><td style="padding:0.5rem 0; font-weight:600;">${(item.metodeBayar || '-').toUpperCase()}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Keterangan</td><td style="padding:0.5rem 0; font-weight:600;">${item.keterangan || '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Diinput oleh</td><td style="padding:0.5rem 0; font-weight:600;">${item.inputBy || '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Waktu input</td><td style="padding:0.5rem 0; font-size:0.8rem; color:#94a3b8;">${item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-'}</td></tr>
            ${item.editCount ? `<tr><td style="padding:0.5rem 0; color:#64748b;">Diedit oleh</td><td style="padding:0.5rem 0; font-size:0.85rem; color:#f59e0b; font-weight:600;">${item.lastEditBy || '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Waktu edit</td><td style="padding:0.5rem 0; font-size:0.8rem; color:#f59e0b;">${item.lastEditAt ? new Date(item.lastEditAt).toLocaleString('id-ID') : '-'}</td></tr>
            <tr><td style="padding:0.5rem 0; color:#64748b;">Jumlah edit</td><td style="padding:0.5rem 0; font-size:0.8rem; color:#f59e0b;">${item.editCount}x</td></tr>` : ''}
        </table>
    `;
    document.getElementById('modal-view-penjualan').style.display = 'flex';
}

document.getElementById('btn-close-view-penjualan').addEventListener('click', () => {
    document.getElementById('modal-view-penjualan').style.display = 'none';
});

// Delete Barang Masuk
function hapusBarangMasuk(id) {
    if (!confirm('Yakin ingin menghapus data barang masuk ini?')) return;
    
    let barangMasuk = Store.get('barang_masuk');
    const item = barangMasuk.find(b => b.id === id);
    
    if (item) {
        // Kurangi stok
        const stok = Store.getStok();
        stok.lpg3kg -= (item.qty3kg || 0);
        stok.lpg12kg -= (item.qty12kg || 0);
        if (stok.lpg3kg < 0) stok.lpg3kg = 0;
        if (stok.lpg12kg < 0) stok.lpg12kg = 0;
        Store.setStok(stok);
        
        // Kurangi distribusi stok per harga
        const hargaSatuan = item.jenis === '3kg' ? item.harga3kg : item.harga12kg;
        const qtyItem = (item.qty3kg || 0) + (item.qty12kg || 0);
        const stokDistribusi = JSON.parse(localStorage.getItem('stok_distribusi') || '{}');
        if (item.jenis && stokDistribusi[item.jenis] && stokDistribusi[item.jenis][hargaSatuan] !== undefined) {
            stokDistribusi[item.jenis][hargaSatuan] -= qtyItem;
            if (stokDistribusi[item.jenis][hargaSatuan] < 0) stokDistribusi[item.jenis][hargaSatuan] = 0;
            localStorage.setItem('stok_distribusi', JSON.stringify(stokDistribusi));
        }
        
        // Hapus dari list
        barangMasuk = barangMasuk.filter(b => b.id !== id);
        Store.set('barang_masuk', barangMasuk);
        
        showAlert('Data barang masuk berhasil dihapus!');
        refreshBarangMasuk();
    }
}

// Edit Barang Masuk
function editBarangMasuk(id) {
    const barangMasuk = Store.get('barang_masuk');
    const item = barangMasuk.find(b => b.id === id);
    if (!item) return;
    
    document.getElementById('edit-barang-id').value = id;
    document.getElementById('edit-barang-tgl').value = item.tanggal;
    document.getElementById('edit-barang-vendor').value = item.vendor;
    document.getElementById('edit-barang-jenis').value = item.jenis || '3kg';
    const qty = item.jenis ? (item.jenis === '3kg' ? item.qty3kg : item.jenis === '12kg' ? item.qty12kg : (item.qty3kg || 0) + (item.qty12kg || 0)) : (item.qty3kg + item.qty12kg);
    document.getElementById('edit-barang-qty').value = qty;
    const harga = item.total / qty || 0;
    document.getElementById('edit-barang-harga').value = Math.round(harga);
    document.getElementById('edit-barang-ket').value = item.keterangan || '';
    
    document.getElementById('modal-edit-barang').style.display = 'flex';
}

document.getElementById('btn-batal-edit-barang').addEventListener('click', () => {
    document.getElementById('modal-edit-barang').style.display = 'none';
});

document.getElementById('form-edit-barang').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('edit-barang-id').value;
    const jenis = document.getElementById('edit-barang-jenis').value;
    const qty = parseInt(document.getElementById('edit-barang-qty').value) || 0;
    const harga = parseInt(document.getElementById('edit-barang-harga').value) || 0;
    
    let barangMasuk = Store.get('barang_masuk');
    const index = barangMasuk.findIndex(b => b.id === id);
    if (index === -1) return;
    
    const oldItem = barangMasuk[index];
    const oldQty3 = oldItem.qty3kg || 0;
    const oldQty12 = oldItem.qty12kg || 0;
    
    // Update item
    const qty3kg = jenis === '3kg' ? qty : 0;
    const qty12kg = jenis === '12kg' ? qty : 0;
    
    barangMasuk[index] = {
        ...oldItem,
        tanggal: document.getElementById('edit-barang-tgl').value,
        vendor: document.getElementById('edit-barang-vendor').value,
        jenis: jenis,
        qty3kg: qty3kg,
        qty12kg: qty12kg,
        total: qty * harga,
        keterangan: document.getElementById('edit-barang-ket').value,
        editCount: (oldItem.editCount || 0) + 1,
        lastEditBy: sessionStorage.getItem('currentUser'),
        lastEditAt: new Date().toISOString()
    };
    
    Store.set('barang_masuk', barangMasuk);
    
    // Update stok (remove old, add new)
    const stok = Store.getStok();
    stok.lpg3kg = stok.lpg3kg - oldQty3 + qty3kg;
    stok.lpg12kg = stok.lpg12kg - oldQty12 + qty12kg;
    Store.setStok(stok);
    
    document.getElementById('modal-edit-barang').style.display = 'none';
    showAlert('Barang masuk berhasil diperbarui!');
    refreshBarangMasuk();
});

// ===== LAPORAN =====
function refreshLaporan() {
    const penjualan = Store.get('penjualan');
    renderChartBulanan(penjualan);
    
    // Set default harian view
    document.getElementById('laporan-date-range').style.display = 'none';
    document.getElementById('laporan-tanggal-harian').style.display = 'block';
    document.getElementById('laporan-tanggal').value = getTodayStr();
    
    // Don't show detail until jenis is selected
}

let currentLpgFilter = '';
let currentPeriodeFilter = 'harian';

// Filter Jenis LPG dropdown
document.getElementById('filter-jenis-lpg').addEventListener('change', function() {
    currentLpgFilter = this.value;
    document.getElementById('laporan-detail-wrapper').style.display = 'block';
    filterLaporanByJenis();
});

// Filter Periode buttons
// Filter Periode buttons
document.querySelectorAll('.btn-laporan').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.btn-laporan').forEach(b => {
            b.classList.remove('active', 'btn-primary');
            b.classList.add('btn-secondary');
        });
        this.classList.add('active', 'btn-primary');
        this.classList.remove('btn-secondary');
        currentPeriodeFilter = this.dataset.periode;
        
        if (currentPeriodeFilter === 'harian') {
            // Show single date, hide range
            document.getElementById('laporan-date-range').style.display = 'none';
            document.getElementById('laporan-tanggal-harian').style.display = 'block';
            document.getElementById('laporan-tanggal').value = getTodayStr();
        } else {
            // Show range, hide single date
            document.getElementById('laporan-date-range').style.display = 'grid';
            document.getElementById('laporan-tanggal-harian').style.display = 'none';
            const { startDate, endDate } = getDateRange(currentPeriodeFilter);
            document.getElementById('laporan-dari').value = startDate;
            document.getElementById('laporan-sampai').value = endDate;
        }
        
        filterLaporanByJenis();
    });
});

// Manual date change
document.getElementById('laporan-dari').addEventListener('change', filterLaporanByJenis);
document.getElementById('laporan-sampai').addEventListener('change', filterLaporanByJenis);
document.getElementById('laporan-tanggal').addEventListener('change', filterLaporanByJenis);

function getDateRange(periode) {
    const today = new Date();
    let startDate, endDate;
    
    switch(periode) {
        case 'harian':
            startDate = getTodayStr();
            endDate = getTodayStr();
            break;
        case 'mingguan':
            const dayOfWeek = today.getDay();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            startDate = weekStart.toISOString().split('T')[0];
            endDate = weekEnd.toISOString().split('T')[0];
            break;
        case 'bulanan':
            startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            break;
    }
    return { startDate, endDate };
}

function filterLaporanByJenis() {
    const penjualan = Store.get('penjualan');
    
    // Get date range based on mode
    let startDate, endDate;
    
    if (currentPeriodeFilter === 'harian') {
        const tanggal = document.getElementById('laporan-tanggal').value || getTodayStr();
        startDate = tanggal;
        endDate = tanggal;
    } else {
        startDate = document.getElementById('laporan-dari').value;
        endDate = document.getElementById('laporan-sampai').value;
        
        if (!startDate || !endDate) {
            const range = getDateRange(currentPeriodeFilter);
            startDate = range.startDate;
            endDate = range.endDate;
            document.getElementById('laporan-dari').value = startDate;
            document.getElementById('laporan-sampai').value = endDate;
        }
    }
    
    const jenisLabel = {'3kg':'3 Kg','5.5kg':'5,5 Kg','12kg':'12 Kg','50kg':'50 Kg'}[currentLpgFilter] || currentLpgFilter;
    
    // Show date range label
    if (startDate === endDate) {
        document.getElementById('lap-periode-label').textContent = formatTanggal(startDate);
    } else {
        document.getElementById('lap-periode-label').textContent = `${formatTanggal(startDate)} - ${formatTanggal(endDate)}`;
    }
    
    // Filter by jenis and date range
    const filtered = penjualan.filter(p => p.jenis === currentLpgFilter && p.tanggal >= startDate && p.tanggal <= endDate);
    
    // Summary cards
    const totalPenjualan = filtered.reduce((sum, p) => sum + p.total, 0);
    const totalQty = filtered.reduce((sum, p) => sum + (p.qty3kg || 0) + (p.qty12kg || 0), 0);
    const totalModal = filtered.reduce((sum, p) => sum + (p.totalModal || 0), 0);
    const totalKeuntungan = filtered.reduce((sum, p) => sum + (p.keuntungan || 0), 0);
    
    document.getElementById('lap-label-total').textContent = `Total Penjualan`;
    document.getElementById('lap-total-hari-ini').textContent = formatRupiah(totalPenjualan);
    document.getElementById('lap-label-qty').textContent = `LPG ${jenisLabel} Terjual`;
    document.getElementById('lap-qty-terjual').textContent = totalQty;
    document.getElementById('lap-total-modal-card').textContent = formatRupiah(totalModal);
    document.getElementById('lap-keuntungan-card').textContent = formatRupiah(totalKeuntungan);
    
    // Title
    const rentangLabel = startDate === endDate ? formatTanggal(startDate) : `${formatTanggal(startDate)} - ${formatTanggal(endDate)}`;
    document.getElementById('lap-riwayat-title').textContent = `Riwayat Penjualan LPG ${jenisLabel} (${rentangLabel})`;
    
    // Table
    renderPagination('tabel-penjualan-hari', filtered, (p) => {
        const qtyLabel = (p.qty3kg || 0) + (p.qty12kg || 0);
        const hargaModalLabel = p.hargaModal ? formatRupiah(p.hargaModal) : '-';
        const hargaJual = p.total / qtyLabel || 0;
        const editCount = p.editCount || 0;
        const canEdit = isAdminUser() || editCount < 1;
        return `
        <tr>
            <td>${p.invoice}</td>
            <td>${p.pelanggan}</td>
            <td>${qtyLabel}</td>
            <td>${hargaModalLabel}</td>
            <td>${formatRupiah(hargaJual)}</td>
            <td>${formatRupiah(p.total)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewPenjualan('${p.invoice}')">&#128065; Lihat</button>
                ${canEdit ? `<button class="btn btn-sm btn-primary" onclick="editPenjualan('${p.invoice}')">&#9998; Ubah</button>` : '<span style="color:#94a3b8; font-size:0.75rem;">Sudah diubah</span>'}
                <button class="btn btn-sm btn-primary" onclick="showInvoice('${p.invoice}')">&#128196;</button>
                ${isAdminUser() ? `<button class="btn btn-sm btn-danger" onclick="hapusPenjualan('${p.invoice}')">&#128465;</button>` : ''}
            </td>
        </tr>
    `});
    
    // Update chart with current filter
    if (currentPeriodeFilter === 'harian') {
        // Bar chart for daily - single bar total qty
        renderBarChart('chart-bulanan', [totalQty], [`LPG ${jenisLabel}`], '#0A192F');
        document.getElementById('chart-month-label').textContent = formatTanggal(startDate);
    } else {
        renderChartBulanan(penjualan, startDate, endDate, currentLpgFilter);
    }
    
    // Also update laporan-result if visible
    generateLaporan(currentPeriodeFilter);
}

function generateLaporan(periode) {
    if (!currentLpgFilter) return;
    
    let startDate, endDate, title;
    const today = new Date();
    const jenisLabel = {'3kg':'3 Kg','5.5kg':'5,5 Kg','12kg':'12 Kg','50kg':'50 Kg'}[currentLpgFilter] || currentLpgFilter;
    
    switch(periode) {
        case 'harian':
            startDate = getTodayStr();
            endDate = getTodayStr();
            title = `Laporan Harian LPG ${jenisLabel} - ${formatTanggal(getTodayStr())}`;
            break;
        case 'mingguan':
            const dayOfWeek = today.getDay();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            startDate = weekStart.toISOString().split('T')[0];
            endDate = weekEnd.toISOString().split('T')[0];
            title = `Laporan Mingguan LPG ${jenisLabel} (${formatTanggal(startDate)} - ${formatTanggal(endDate)})`;
            break;
        case 'bulanan':
            startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            title = `Laporan Bulanan LPG ${jenisLabel} - ${today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
            break;
    }
    
    const penjualan = Store.get('penjualan');
    // Filter by jenis LPG AND date range
    const filtered = penjualan.filter(p => p.jenis === currentLpgFilter && p.tanggal >= startDate && p.tanggal <= endDate);
    
    // Summary
    const totalTransaksi = filtered.length;
    const totalQty = filtered.reduce((sum, p) => sum + (p.qty3kg || 0) + (p.qty12kg || 0), 0);
    const totalPendapatan = filtered.reduce((sum, p) => sum + p.total, 0);
    const totalModal = filtered.reduce((sum, p) => sum + (p.totalModal || 0), 0);
    const totalKeuntungan = filtered.reduce((sum, p) => sum + (p.keuntungan || 0), 0);
    
    document.getElementById('laporan-title').textContent = title;
    document.getElementById('lap-total-transaksi').textContent = totalTransaksi;
    document.getElementById('lap-total-3kg').textContent = totalQty;
    document.getElementById('lap-total-12kg').textContent = `LPG ${jenisLabel}`;
    document.getElementById('lap-total-pendapatan').textContent = formatRupiah(totalPendapatan);
    document.getElementById('lap-total-modal').textContent = formatRupiah(totalModal);
    document.getElementById('lap-total-keuntungan').textContent = formatRupiah(totalKeuntungan);
    
    // Table
    renderPagination('tabel-laporan', filtered, (p) => {
        const qty = (p.qty3kg || 0) + (p.qty12kg || 0);
        return `
        <tr>
            <td>${p.invoice}</td>
            <td>${formatTanggal(p.tanggal)}</td>
            <td>${p.pelanggan}</td>
            <td>${qty}</td>
            <td>${p.hargaModal ? formatRupiah(p.hargaModal) : '-'}</td>
            <td>${formatRupiah(p.total)}</td>
            <td>${p.metodeBayar.toUpperCase()}</td>
        </tr>
    `});
    
    document.getElementById('laporan-result').style.display = 'block';
}

// Cetak laporan
document.getElementById('btn-cetak-laporan').addEventListener('click', () => {
    const title = document.getElementById('laporan-title').textContent;
    const content = document.getElementById('laporan-result').innerHTML;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 2rem; }
                h1, h2 { color: #1a237e; }
                .laporan-header { margin-bottom: 1rem; }
                .laporan-header button { display: none; }
                .laporan-summary {
                    display: grid; grid-template-columns: repeat(4, 1fr);
                    gap: 1rem; margin-bottom: 1.5rem; padding: 1rem;
                    background: #f5f5f5; border-radius: 5px;
                }
                .summary-item span { font-size: 0.8rem; color: #666; display: block; }
                .summary-item strong { color: #1a237e; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th, td { padding: 0.6rem; border: 1px solid #ddd; text-align: left; font-size: 0.85rem; }
                th { background: #1a237e; color: white; }
                .btn { display: none; }
                .store-header { text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid #1a237e; padding-bottom: 1rem; }
            </style>
        </head>
        <body>
            <div class="store-header">
                <h1>HARTONO</h1>
                <p>Kp. Jagawana No. 64 Rt.004 Rw.005 Desa Sukarukun, Kec. Sukatani, Kab. Bekasi 17631</p>
                <p>Telp : 0813-1675-6034 | WA : 0812-1302-0711</p>
            </div>
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
});

// ===== STOK =====
function refreshStok() {
    const stok = Store.getStok();
    const movements = Store.get('stok_movements');
    const today = new Date();
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    
    document.getElementById('stok-3kg-current').textContent = stok.lpg3kg;
    document.getElementById('stok-12kg-current').textContent = stok.lpg12kg;
    
    const monthMovements = movements.filter(m => m.tanggal >= monthStart);
    const masuk = monthMovements.filter(m => m.jenis === 'masuk');
    const keluar = monthMovements.filter(m => m.jenis === 'keluar');
    
    const totalMasuk = masuk.reduce((sum, m) => sum + m.lpg3kg + m.lpg12kg, 0);
    const totalKeluar = keluar.reduce((sum, m) => sum + m.lpg3kg + m.lpg12kg, 0);
    
    document.getElementById('stok-masuk-bulan').textContent = totalMasuk;
    document.getElementById('stok-keluar-bulan').textContent = totalKeluar;
    
    // Table with pagination
    const recent = movements.slice().reverse();
    renderPagination('tabel-stok', recent, (m) => `
        <tr>
            <td>${formatTanggal(m.tanggal)}</td>
            <td><span style="color: ${m.jenis === 'masuk' ? '#16a34a' : '#dc2626'}; font-weight: 600;">
                ${m.jenis === 'masuk' ? '↓ Masuk' : '↑ Keluar'}
            </span></td>
            <td>${m.lpg3kg}</td>
            <td>${m.lpg12kg}</td>
            <td>${m.keterangan}</td>
        </tr>
    `);
}

// ===== PENYESUAIAN STOK =====
document.getElementById('btn-sesuaikan-stok').addEventListener('click', () => {
    document.getElementById('form-stok-wrapper').style.display = 'block';
    document.getElementById('btn-sesuaikan-stok').style.display = 'none';
});

document.getElementById('btn-batal-stok').addEventListener('click', () => {
    document.getElementById('form-stok-wrapper').style.display = 'none';
    document.getElementById('btn-sesuaikan-stok').style.display = '';
    document.getElementById('stok-adj-detail').style.display = 'none';
});

// Show per-price breakdown when jenis is selected
document.getElementById('stok-adj-jenis').addEventListener('change', function() {
    const jenis = this.value;
    if (!jenis) {
        document.getElementById('stok-adj-detail').style.display = 'none';
        return;
    }
    
    const barangMasuk = Store.get('barang_masuk');
    const penjualan = Store.get('penjualan');
    const stok = Store.getStok();
    
    // Ambil harga dari Master Data (Harga Pokok Penjualan)
    const masterLpg = Store.get('master_lpg');
    const hargaPokok = masterLpg.filter(item => item.jenis === jenis).map(item => item.harga);
    
    // Cek apakah ada distribusi tersimpan dari penyesuaian terakhir
    const stokDistribusi = JSON.parse(localStorage.getItem('stok_distribusi') || '{}');
    const savedDistribusi = stokDistribusi[jenis];
    
    const jenisLabel = {'3kg':'3 Kg','5.5kg':'5,5 Kg','12kg':'12 Kg','50kg':'50 Kg'}[jenis];
    const totalStok = jenis === '3kg' ? stok.lpg3kg : jenis === '12kg' ? stok.lpg12kg : 0;
    
    let stokPerHarga = {};
    
    if (savedDistribusi) {
        // Gunakan distribusi tersimpan, sesuaikan dengan stok aktual
        const savedTotal = Object.values(savedDistribusi).reduce((sum, val) => sum + val, 0);
        if (savedTotal === totalStok) {
            stokPerHarga = { ...savedDistribusi };
        } else if (savedTotal > 0) {
            // Proporsionalkan ke stok aktual
            const rasio = totalStok / savedTotal;
            const keys = Object.keys(savedDistribusi).sort((a, b) => Number(a) - Number(b));
            let distributed = 0;
            keys.forEach((key, i) => {
                if (i === keys.length - 1) {
                    stokPerHarga[key] = totalStok - distributed;
                } else {
                    stokPerHarga[key] = Math.round(savedDistribusi[key] * rasio);
                    distributed += stokPerHarga[key];
                }
            });
        }
    } else {
        // Hitung dari barang masuk - penjualan
        hargaPokok.forEach(h => {
            if (!stokPerHarga[h]) stokPerHarga[h] = 0;
        });
        
        barangMasuk.filter(b => b.jenis === jenis).forEach(b => {
            const hargaSatuan = b.jenis === '3kg' ? b.harga3kg : b.harga12kg;
            if (hargaSatuan > 0) {
                if (!stokPerHarga[hargaSatuan]) stokPerHarga[hargaSatuan] = 0;
                stokPerHarga[hargaSatuan] += (b.qty3kg || 0) + (b.qty12kg || 0);
            }
        });
        
        penjualan.filter(p => p.jenis === jenis && p.hargaModal > 0).forEach(p => {
            const qty = (p.qty3kg || 0) + (p.qty12kg || 0);
            if (stokPerHarga[p.hargaModal] !== undefined) {
                stokPerHarga[p.hargaModal] -= qty;
                if (stokPerHarga[p.hargaModal] < 0) stokPerHarga[p.hargaModal] = 0;
            }
        });
        
        // Proporsionalkan ke stok aktual
        const totalHitung = Object.values(stokPerHarga).reduce((sum, val) => sum + val, 0);
        if (totalHitung !== totalStok && totalHitung > 0) {
            const rasio = totalStok / totalHitung;
            const keys = Object.keys(stokPerHarga).sort((a, b) => Number(a) - Number(b));
            let distributed = 0;
            keys.forEach((key, i) => {
                if (i === keys.length - 1) {
                    stokPerHarga[key] = totalStok - distributed;
                } else {
                    stokPerHarga[key] = Math.round(stokPerHarga[key] * rasio);
                    distributed += stokPerHarga[key];
                }
            });
        }
    }
    
    const prices = Object.keys(stokPerHarga).map(Number).sort((a, b) => a - b);
    
    let html = `
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:1rem; margin-top:0.5rem;">
            <p style="font-weight:600; color:#0A192F; margin-bottom:0.8rem;">Stok LPG ${jenisLabel} saat ini: <span style="color:#16a34a;">${totalStok} tabung</span></p>
    `;
    
    if (prices.length > 0) {
        html += `<table style="width:100%; border-collapse:collapse; margin-bottom:1rem;">
            <thead><tr style="border-bottom:1px solid #e2e8f0;">
                <th style="text-align:left; padding:0.4rem; font-size:0.8rem; color:#64748b;">Harga Modal</th>
                <th style="text-align:center; padding:0.4rem; font-size:0.8rem; color:#64748b;">Sisa Saat Ini</th>
                <th style="text-align:center; padding:0.4rem; font-size:0.8rem; color:#64748b;">Stok Aktual</th>
            </tr></thead><tbody>`;
        
        prices.forEach(harga => {
            html += `<tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:0.5rem; font-weight:500;">${formatRupiah(harga)}</td>
                <td style="padding:0.5rem; text-align:center; color:#16a34a; font-weight:600;">${stokPerHarga[harga]}</td>
                <td style="padding:0.5rem; text-align:center;">
                    <input type="number" class="stok-adj-input" data-harga="${harga}" value="${stokPerHarga[harga]}" min="0" style="width:80px; padding:0.4rem; border:2px solid #e2e8f0; border-radius:8px; text-align:center; font-size:0.9rem;">
                </td>
            </tr>`;
        });
        
        html += `</tbody></table>`;
    } else {
        html += `<p style="color:#94a3b8; font-size:0.85rem;">Tidak ada data harga untuk jenis ini.</p>
            <div class="form-group" style="margin-top:0.5rem;">
                <label>Stok Aktual</label>
                <input type="number" id="stok-adj-qty-single" min="0" value="${totalStok}" style="padding:0.6rem; border:2px solid #e2e8f0; border-radius:8px;">
            </div>`;
    }
    
    html += `</div>`;
    document.getElementById('stok-adj-detail').innerHTML = html;
    document.getElementById('stok-adj-detail').style.display = 'block';
});

document.getElementById('form-penyesuaian-stok').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const jenis = document.getElementById('stok-adj-jenis').value;
    const keterangan = document.getElementById('stok-adj-ket').value;
    const stok = Store.getStok();
    const movements = Store.get('stok_movements');
    const jenisLabel = {'3kg':'3 Kg','5.5kg':'5,5 Kg','12kg':'12 Kg','50kg':'50 Kg'}[jenis];
    
    // Check if per-price inputs exist
    const adjInputs = document.querySelectorAll('.stok-adj-input');
    
    if (adjInputs.length > 0) {
        // Per-price adjustment
        let totalNewStok = 0;
        const distribusi = {};
        adjInputs.forEach(input => {
            const harga = input.dataset.harga;
            const val = parseInt(input.value) || 0;
            distribusi[harga] = val;
            totalNewStok += val;
        });
        
        const oldStok = jenis === '3kg' ? stok.lpg3kg : stok.lpg12kg;
        const selisih = totalNewStok - oldStok;
        
        if (jenis === '3kg') stok.lpg3kg = totalNewStok;
        else if (jenis === '12kg') stok.lpg12kg = totalNewStok;
        
        Store.setStok(stok);
        
        // Simpan distribusi per-harga
        const stokDistribusi = JSON.parse(localStorage.getItem('stok_distribusi') || '{}');
        stokDistribusi[jenis] = distribusi;
        localStorage.setItem('stok_distribusi', JSON.stringify(stokDistribusi));
        
        movements.push({
            tanggal: getTodayStr(),
            jenis: selisih >= 0 ? 'masuk' : 'keluar',
            lpg3kg: jenis === '3kg' ? Math.abs(selisih) : 0,
            lpg12kg: jenis === '12kg' ? Math.abs(selisih) : 0,
            keterangan: `Penyesuaian Stok LPG ${jenisLabel}: ${keterangan} (${selisih >= 0 ? '+' : ''}${selisih})`
        });
        Store.set('stok_movements', movements);
        
        showAlert(`Stok berhasil disesuaikan! Selisih: ${selisih >= 0 ? '+' : ''}${selisih}`);
    } else {
        // Single qty adjustment
        const singleInput = document.getElementById('stok-adj-qty-single');
        const qtyAktual = singleInput ? parseInt(singleInput.value) || 0 : 0;
        const oldStok = jenis === '3kg' ? stok.lpg3kg : stok.lpg12kg;
        const selisih = qtyAktual - oldStok;
        
        if (jenis === '3kg') stok.lpg3kg = qtyAktual;
        else if (jenis === '12kg') stok.lpg12kg = qtyAktual;
        
        Store.setStok(stok);
        
        movements.push({
            tanggal: getTodayStr(),
            jenis: selisih >= 0 ? 'masuk' : 'keluar',
            lpg3kg: jenis === '3kg' ? Math.abs(selisih) : 0,
            lpg12kg: jenis === '12kg' ? Math.abs(selisih) : 0,
            keterangan: `Penyesuaian Stok LPG ${jenisLabel}: ${keterangan} (${selisih >= 0 ? '+' : ''}${selisih})`
        });
        Store.set('stok_movements', movements);
        
        showAlert(`Stok berhasil disesuaikan! Selisih: ${selisih >= 0 ? '+' : ''}${selisih}`);
    }
    
    // Reset
    document.getElementById('stok-adj-jenis').selectedIndex = 0;
    document.getElementById('stok-adj-ket').value = '';
    document.getElementById('stok-adj-detail').style.display = 'none';
    document.getElementById('form-stok-wrapper').style.display = 'none';
    document.getElementById('btn-sesuaikan-stok').style.display = '';
    
    refreshStok();
});

// ===== PENGELUARAN =====
document.getElementById('tgl-pengeluaran').value = getTodayStr();

document.getElementById('form-pengeluaran').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const tanggal = document.getElementById('tgl-pengeluaran').value;
    const keterangan = document.getElementById('ket-pengeluaran').value.trim();
    const total = parseInt(document.getElementById('total-pengeluaran').value) || 0;
    
    if (total === 0) {
        showAlert('Masukkan total harga!', 'error');
        return;
    }
    
    const pengeluaran = Store.get('pengeluaran');
    pengeluaran.push({
        id: Date.now().toString(),
        tanggal: tanggal,
        keterangan: keterangan,
        total: total,
        inputBy: sessionStorage.getItem('currentUser') || '-',
        createdAt: new Date().toISOString()
    });
    Store.set('pengeluaran', pengeluaran);
    
    showAlert('Pengeluaran berhasil disimpan!');
    
    // Reset
    document.getElementById('ket-pengeluaran').value = '';
    document.getElementById('total-pengeluaran').value = '';
    
    refreshPengeluaran();
});

function refreshPengeluaran() {
    const pengeluaran = Store.get('pengeluaran');
    const recent = pengeluaran.slice().reverse();
    
    renderPagination('tabel-pengeluaran', recent, (p, i) => {
        const editCount = p.editCount || 0;
        const canEdit = isAdminUser() || editCount < 1;
        return `
        <tr>
            <td>${i + 1}</td>
            <td>${formatTanggal(p.tanggal)}</td>
            <td>${p.keterangan}</td>
            <td>${formatRupiah(p.total)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewPengeluaran('${p.id}')">&#128065; Lihat</button>
                ${canEdit ? `<button class="btn btn-sm btn-primary" onclick="editPengeluaran('${p.id}')">&#9998; Ubah</button>` : '<span style="color:#94a3b8; font-size:0.75rem;">Sudah diubah</span>'}
                ${isAdminUser() ? `<button class="btn btn-sm btn-danger" onclick="hapusPengeluaran('${p.id}')">&#128465;</button>` : ''}
            </td>
        </tr>
    `});
    
    // Render chart
    renderChartPengeluaran(pengeluaran);
}

function renderChartPengeluaran(pengeluaran) {
    const today = new Date();
    const year = today.getFullYear();
    
    const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = [];
    
    for (let m = 0; m < 12; m++) {
        const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
        const total = pengeluaran.filter(p => p.tanggal && p.tanggal.startsWith(monthStr)).reduce((sum, p) => sum + p.total, 0);
        data.push(total);
    }
    
    renderLineChart('chart-pengeluaran', data, bulanNames, '#ef4444', '');
    document.getElementById('chart-pengeluaran-label').textContent = `Tahun ${year}`;
}

function hapusPengeluaran(id) {
    if (!confirm('Hapus pengeluaran ini?')) return;
    let pengeluaran = Store.get('pengeluaran');
    pengeluaran = pengeluaran.filter(p => p.id !== id);
    Store.set('pengeluaran', pengeluaran);
    refreshPengeluaran();
    showAlert('Pengeluaran berhasil dihapus!');
}

// Edit Pengeluaran
function editPengeluaran(id) {
    const pengeluaran = Store.get('pengeluaran');
    const item = pengeluaran.find(p => p.id === id);
    if (!item) return;
    
    document.getElementById('edit-pengeluaran-id').value = id;
    document.getElementById('edit-pengeluaran-tgl').value = item.tanggal;
    document.getElementById('edit-pengeluaran-ket').value = item.keterangan;
    document.getElementById('edit-pengeluaran-total').value = item.total;
    
    document.getElementById('modal-edit-pengeluaran').style.display = 'flex';
}

document.getElementById('btn-batal-edit-pengeluaran').addEventListener('click', () => {
    document.getElementById('modal-edit-pengeluaran').style.display = 'none';
});

document.getElementById('form-edit-pengeluaran').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('edit-pengeluaran-id').value;
    let pengeluaran = Store.get('pengeluaran');
    const index = pengeluaran.findIndex(p => p.id === id);
    if (index === -1) return;
    
    pengeluaran[index] = {
        ...pengeluaran[index],
        tanggal: document.getElementById('edit-pengeluaran-tgl').value,
        keterangan: document.getElementById('edit-pengeluaran-ket').value,
        total: parseInt(document.getElementById('edit-pengeluaran-total').value) || 0,
        editCount: (pengeluaran[index].editCount || 0) + 1,
        lastEditBy: sessionStorage.getItem('currentUser'),
        lastEditAt: new Date().toISOString()
    };
    
    Store.set('pengeluaran', pengeluaran);
    document.getElementById('modal-edit-pengeluaran').style.display = 'none';
    showAlert('Pengeluaran berhasil diperbarui!');
    refreshPengeluaran();
});

// ===== MASTER DATA =====
function refreshMasterData() {
    refreshLpgList();
    refreshUserList();
    loadMasterToko();
}

// Data Toko
function loadMasterToko() {
    const toko = localStorage.getItem('master_toko');
    if (toko) {
        const data = JSON.parse(toko);
        document.getElementById('master-nama-toko').value = data.nama || 'HARTONO';
        document.getElementById('master-alamat-toko').value = data.alamat || '';
        document.getElementById('master-telp-toko').value = data.telp || '';
        document.getElementById('master-wa-toko').value = data.wa || '';
    }
}

document.getElementById('form-master-toko').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        nama: document.getElementById('master-nama-toko').value,
        alamat: document.getElementById('master-alamat-toko').value,
        telp: document.getElementById('master-telp-toko').value,
        wa: document.getElementById('master-wa-toko').value
    };
    localStorage.setItem('master_toko', JSON.stringify(data));
    showAlert('Data toko berhasil disimpan!');
});

// LPG List
document.getElementById('btn-tambah-lpg').addEventListener('click', () => {
    document.getElementById('form-lpg-wrapper').style.display = 'block';
    document.getElementById('btn-tambah-lpg').style.display = 'none';
});

document.getElementById('btn-batal-lpg').addEventListener('click', () => {
    document.getElementById('form-lpg-wrapper').style.display = 'none';
    document.getElementById('btn-tambah-lpg').style.display = '';
    document.getElementById('master-lpg-harga').value = '';
});

document.getElementById('form-master-lpg').addEventListener('submit', (e) => {
    e.preventDefault();
    const jenis = document.getElementById('master-lpg-jenis').value;
    const harga = parseInt(document.getElementById('master-lpg-harga').value) || 0;
    
    if (harga === 0) { showAlert('Harga harus diisi!', 'error'); return; }
    
    const lpgList = Store.get('master_lpg');
    lpgList.push({ id: Date.now().toString(), jenis, harga });
    Store.set('master_lpg', lpgList);
    
    document.getElementById('master-lpg-harga').value = '';
    document.getElementById('form-lpg-wrapper').style.display = 'none';
    document.getElementById('btn-tambah-lpg').style.display = '';
    showAlert('Produk LPG berhasil ditambahkan!');
    refreshLpgList();
});

function refreshLpgList() {
    const lpgList = Store.get('master_lpg');
    const tbody = document.getElementById('tabel-lpg-list');
    tbody.innerHTML = lpgList.map((item, i) => {
        const jenisLabel = {'3kg':'3 Kg','5.5kg':'5,5 Kg','12kg':'12 Kg','50kg':'50 Kg'}[item.jenis] || item.jenis;
        return `
        <tr>
            <td>${i + 1}</td>
            <td>LPG ${jenisLabel}</td>
            <td>${formatRupiah(item.harga)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="hapusLpg('${item.id}')">&#128465;</button></td>
        </tr>
    `}).join('');
}

function hapusLpg(id) {
    if (!confirm('Hapus produk ini?')) return;
    let lpgList = Store.get('master_lpg');
    lpgList = lpgList.filter(item => item.id !== id);
    Store.set('master_lpg', lpgList);
    refreshLpgList();
    showAlert('Produk berhasil dihapus!');
}

// Users
document.getElementById('btn-tambah-user').addEventListener('click', () => {
    document.getElementById('form-user-wrapper').style.display = 'block';
    document.getElementById('btn-tambah-user').style.display = 'none';
});

document.getElementById('btn-batal-user').addEventListener('click', () => {
    document.getElementById('form-user-wrapper').style.display = 'none';
    document.getElementById('btn-tambah-user').style.display = '';
    document.getElementById('master-user-name').value = '';
    document.getElementById('master-user-pass').value = '';
});

document.getElementById('form-master-user').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('master-user-name').value.trim();
    const password = document.getElementById('master-user-pass').value.trim();
    
    if (!username || !password) { showAlert('Username dan password harus diisi!', 'error'); return; }
    
    const users = Store.get('master_users');
    if (users.find(u => u.username === username)) {
        showAlert('Nama pengguna sudah ada!', 'error');
        return;
    }
    
    users.push({ username, password });
    Store.set('master_users', users);
    
    // Update USERS array
    USERS.push({ username, password });
    
    document.getElementById('master-user-name').value = '';
    document.getElementById('master-user-pass').value = '';
    document.getElementById('form-user-wrapper').style.display = 'none';
    document.getElementById('btn-tambah-user').style.display = '';
    showAlert('Pengguna berhasil ditambahkan!');
    refreshUserList();
});

function refreshUserList() {
    const defaultUsers = [{ username: 'admin' }, { username: 'hartono' }];
    const customUsers = Store.get('master_users');
    const allUsers = [...defaultUsers, ...customUsers];
    
    const tbody = document.getElementById('tabel-users');
    tbody.innerHTML = allUsers.map((u, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${u.username}</td>
            <td>${i < 2 ? '<span style="color:#94a3b8; font-size:0.8rem;">Bawaan</span>' : 
                `<button class="btn btn-sm btn-danger" onclick="hapusUser('${u.username}')">&#128465;</button>`}</td>
        </tr>
    `).join('');
}

function hapusUser(username) {
    if (!confirm('Hapus user ini?')) return;
    let users = Store.get('master_users');
    users = users.filter(u => u.username !== username);
    Store.set('master_users', users);
    
    // Update USERS array
    const idx = USERS.findIndex(u => u.username === username);
    if (idx > -1) USERS.splice(idx, 1);
    
    refreshUserList();
    showAlert('Pengguna berhasil dihapus!');
}

// Load custom users on startup (dapat dipanggil ulang setelah data cloud dimuat)
function reloadCustomUsers() {
    const customUsers = Store.get('master_users');
    customUsers.forEach(u => {
        if (!USERS.find(x => x.username === u.username)) {
            USERS.push(u);
        }
    });
}
window.reloadCustomUsers = reloadCustomUsers;
reloadCustomUsers();

// ===== BACKUP & RESTORE =====
document.getElementById('btn-backup-data').addEventListener('click', () => {
    const backup = {};
    const keys = ['penjualan', 'barang_masuk', 'pengeluaran', 'stok', 'stok_movements', 'master_lpg', 'master_users', 'master_toko', 'master_harga'];
    keys.forEach(key => {
        backup[key] = localStorage.getItem(key);
    });
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-hartono-${getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert('Cadangan data berhasil diunduh!');
});

document.getElementById('input-restore-data').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const backup = JSON.parse(event.target.result);
            if (confirm('Memulihkan data akan menimpa data yang ada saat ini. Lanjutkan?')) {
                Object.keys(backup).forEach(key => {
                    if (backup[key] !== null) {
                        localStorage.setItem(key, backup[key]);
                    }
                });
                showAlert('Data berhasil dipulihkan! Halaman akan dimuat ulang.');
                setTimeout(() => location.reload(), 1500);
            }
        } catch (err) {
            showAlert('File cadangan tidak valid!', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// Sinkronkan data lama (localStorage) ke Cloud Firestore
document.getElementById('btn-sync-cloud').addEventListener('click', async () => {
    if (!window.db) {
        showAlert('Koneksi cloud belum siap. Pastikan ada internet.', 'error');
        return;
    }
    
    if (!confirm('Kirim semua data yang ada di perangkat ini ke cloud? Data di cloud akan diperbarui dengan data dari perangkat ini.')) {
        return;
    }
    
    const keys = ['penjualan', 'barang_masuk', 'pengeluaran', 'stok', 'stok_movements', 'master_lpg', 'master_users', 'master_toko', 'master_harga', 'stok_distribusi'];
    let berhasil = 0;
    
    showAlert('Sedang menyinkronkan data ke cloud...');
    
    try {
        for (const key of keys) {
            const value = localStorage.getItem(key);
            if (value !== null) {
                await window.db.collection('appdata').doc(key).set({ value: value, updatedAt: Date.now() });
                berhasil++;
            }
        }
        showAlert(`Berhasil! ${berhasil} data telah disinkronkan ke cloud.`);
    } catch (err) {
        console.error(err);
        showAlert('Gagal menyinkronkan sebagian data. Coba lagi.', 'error');
    }
});

document.getElementById('btn-clear-data').addEventListener('click', async () => {
    if (!confirm('PERINGATAN: Semua data transaksi, stok, dan pengaturan akan dihapus permanen. Pengguna bawaan (admin & hartono) tetap aman. Pastikan Anda sudah mencadangkan data terlebih dahulu. Lanjutkan?')) {
        return;
    }
    if (!confirm('Anda YAKIN? Data tidak bisa dikembalikan!')) {
        return;
    }
    
    // Data yang dihapus (semua kecuali akun bawaan yang memang hardcoded)
    const keys = ['penjualan', 'barang_masuk', 'pengeluaran', 'stok', 'stok_movements', 'master_lpg', 'master_users', 'master_toko', 'master_harga', 'stok_distribusi'];
    
    showAlert('Menghapus semua data...');
    
    // Hapus dari localStorage
    keys.forEach(key => localStorage.removeItem(key));
    
    // Hapus dari cloud Firestore (jika terhubung)
    if (window.db) {
        try {
            for (const key of keys) {
                await window.db.collection('appdata').doc(key).delete();
            }
        } catch (err) {
            console.error('Gagal menghapus data cloud:', err);
        }
    }
    
    showAlert('Semua data telah dihapus. Halaman akan dimuat ulang.');
    setTimeout(() => location.reload(), 1500);
});

// ===== INIT =====
function initApp() {
    refreshDashboard();
    refreshPenjualanHari();
    refreshBarangMasuk();
}

// Refresh halaman yang sedang aktif (dipanggil saat data cloud berubah realtime)
function refreshCurrentPage() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    const pageId = activePage.id.replace('page-', '');
    if (typeof refreshPage === 'function') {
        refreshPage(pageId);
    }
}
window.refreshCurrentPage = refreshCurrentPage;

// Tunggu data cloud selesai dimuat, lalu inisialisasi & refresh
if (window.cloudReady && typeof window.cloudReady.then === 'function') {
    window.cloudReady.then(() => {
        reloadCustomUsers();
        if (sessionStorage.getItem('loggedIn') === 'true') {
            initApp();
            refreshCurrentPage();
        }
    });
} else {
    if (sessionStorage.getItem('loggedIn') === 'true') {
        initApp();
    }
}
