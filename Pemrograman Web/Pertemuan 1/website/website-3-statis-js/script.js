/* ============================================
   CATATAN PENGELUARAN — JavaScript
   Website Statis + JavaScript
   Data TIDAK disimpan di server/localStorage,
   hanya di memori (array JS). Hilang saat refresh.
   ============================================ */

// --- Data Store (hanya di memori, hilang saat refresh) ---
let expenses = [];
let nextId = 1;

// --- Kategori Map ---
const KATEGORI_MAP = {
    makanan: { emoji: '🍔', label: 'Makanan' },
    transport: { emoji: '🚗', label: 'Transport' },
    belanja: { emoji: '🛒', label: 'Belanja' },
    hiburan: { emoji: '🎮', label: 'Hiburan' },
    kesehatan: { emoji: '💊', label: 'Kesehatan' },
    pendidikan: { emoji: '📚', label: 'Pendidikan' },
    lainnya: { emoji: '📌', label: 'Lainnya' }
};

// --- DOM Elements ---
const expenseForm = document.getElementById('expenseForm');
const transactionList = document.getElementById('transactionList');
const filterKategori = document.getElementById('filterKategori');
const clearAllBtn = document.getElementById('clearAllBtn');
const categoryCard = document.getElementById('categoryCard');
const categoryList = document.getElementById('categoryList');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toastIcon');
const toastMessage = document.getElementById('toastMessage');
const warningClose = document.getElementById('warningClose');
const warningBanner = document.getElementById('warningBanner');

// Summary elements
const totalPengeluaranEl = document.getElementById('totalPengeluaran');
const jumlahTransaksiEl = document.getElementById('jumlahTransaksi');
const rataRataEl = document.getElementById('rataRata');
const tertinggiEl = document.getElementById('tertinggi');

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    render();
});

// --- Warning Banner Close ---
warningClose.addEventListener('click', () => {
    warningBanner.classList.add('hidden');
});

// --- Form Submit ---
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const keterangan = document.getElementById('keterangan').value.trim();
    const jumlah = parseInt(document.getElementById('jumlah').value);
    const kategori = document.getElementById('kategori').value;

    if (!keterangan || !jumlah || jumlah <= 0) {
        showToast('Mohon isi keterangan dan jumlah yang valid!', 'error');
        return;
    }

    const expense = {
        id: nextId++,
        keterangan,
        jumlah,
        kategori,
        waktu: new Date()
    };

    expenses.push(expense);
    expenseForm.reset();
    render();
    showToast(`Pengeluaran "${keterangan}" ditambahkan!`, 'success');
});

// --- Filter ---
filterKategori.addEventListener('change', () => {
    renderTransactions();
});

// --- Clear All ---
clearAllBtn.addEventListener('click', () => {
    if (expenses.length === 0) return;
    if (confirm('Hapus semua pengeluaran? Data tidak bisa dikembalikan.')) {
        expenses = [];
        nextId = 1;
        render();
        showToast('Semua data telah dihapus', 'success');
    }
});

// --- Delete Single ---
function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    render();
    showToast('Pengeluaran dihapus', 'success');
}

// --- Render All ---
function render() {
    updateSummary();
    renderTransactions();
    renderCategories();

    // Show/hide clear button
    clearAllBtn.style.display = expenses.length > 0 ? 'inline-flex' : 'none';
    categoryCard.style.display = expenses.length > 0 ? 'block' : 'none';
}

// --- Update Summary ---
function updateSummary() {
    const total = expenses.reduce((sum, e) => sum + e.jumlah, 0);
    const count = expenses.length;
    const avg = count > 0 ? Math.round(total / count) : 0;
    const highest = count > 0 ? Math.max(...expenses.map(e => e.jumlah)) : 0;

    animateValue(totalPengeluaranEl, total);
    jumlahTransaksiEl.textContent = count;
    animateValue(rataRataEl, avg);
    animateValue(tertinggiEl, highest);
}

function animateValue(el, target) {
    el.textContent = formatRupiah(target);
}

// --- Render Transactions ---
function renderTransactions() {
    const filter = filterKategori.value;
    let filtered = filter === 'all'
        ? [...expenses]
        : expenses.filter(e => e.kategori === filter);

    // Sort newest first
    filtered.reverse();

    if (filtered.length === 0) {
        const emptyMsg = expenses.length === 0
            ? '<p class="empty-title">Belum ada pengeluaran</p><p class="empty-subtitle">Mulai catat pengeluaran Anda hari ini!</p>'
            : '<p class="empty-title">Tidak ada pengeluaran di kategori ini</p>';

        transactionList.innerHTML = `
            <div class="empty-state">
                <div class="empty-illustration">📝</div>
                ${emptyMsg}
            </div>
        `;
        return;
    }

    transactionList.innerHTML = filtered.map(expense => {
        const cat = KATEGORI_MAP[expense.kategori] || KATEGORI_MAP.lainnya;
        const timeStr = formatTime(expense.waktu);

        return `
            <div class="transaction-card" data-cat="${expense.kategori}">
                <div class="transaction-emoji">${cat.emoji}</div>
                <div class="transaction-info">
                    <div class="transaction-name">${escapeHtml(expense.keterangan)}</div>
                    <div class="transaction-meta">
                        <span>${cat.label}</span>
                        <span class="dot"></span>
                        <span>${timeStr}</span>
                    </div>
                </div>
                <div class="transaction-amount">-${formatRupiah(expense.jumlah)}</div>
                <button class="transaction-delete" onclick="deleteExpense(${expense.id})" title="Hapus">✕</button>
            </div>
        `;
    }).join('');
}

// --- Render Categories ---
function renderCategories() {
    if (expenses.length === 0) return;

    const totals = {};
    let grandTotal = 0;

    expenses.forEach(e => {
        totals[e.kategori] = (totals[e.kategori] || 0) + e.jumlah;
        grandTotal += e.jumlah;
    });

    // Sort by amount descending
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    categoryList.innerHTML = sorted.map(([cat, amount]) => {
        const catInfo = KATEGORI_MAP[cat] || KATEGORI_MAP.lainnya;
        const percentage = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;

        return `
            <div class="category-item cat-${cat}">
                <span class="category-emoji">${catInfo.emoji}</span>
                <div class="category-info">
                    <div class="category-info-header">
                        <span class="category-name">${catInfo.label}</span>
                        <span class="category-amount">${formatRupiah(amount)} (${percentage}%)</span>
                    </div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Toast Notification ---
function showToast(message, type = 'success') {
    toastIcon.textContent = type === 'success' ? '✅' : '❌';
    toastMessage.textContent = message;
    toast.className = 'toast show';

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Utility Functions ---
function formatRupiah(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatTime(date) {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
