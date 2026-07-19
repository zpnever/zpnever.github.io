/* ============================================
   BUKU TAMU DIGITAL — Client JavaScript
   Website Dinamis (Dynamic Website)
   ============================================ */

const API_URL = 'http://localhost:5500';

// --- DOM Elements ---
const guestForm = document.getElementById('guestForm');
const messagesList = document.getElementById('messagesList');
const loadingState = document.getElementById('loadingState');
const submitBtn = document.getElementById('submitBtn');
const refreshBtn = document.getElementById('refreshBtn');
const totalPesan = document.getElementById('totalPesan');
const pesanHariIni = document.getElementById('pesanHariIni');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toastIcon');
const toastMessage = document.getElementById('toastMessage');
const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');
const infoClose = document.getElementById('infoClose');
const infoBanner = document.getElementById('infoBanner');

let deleteTargetId = null;

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
});

// --- Info Banner Close ---
infoClose.addEventListener('click', () => {
    infoBanner.classList.add('hidden');
});

// --- Form Submit ---
guestForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        nama: document.getElementById('nama').value.trim(),
        email: document.getElementById('email').value.trim(),
        instansi: document.getElementById('instansi').value.trim(),
        pesan: document.getElementById('pesan').value.trim()
    };

    if (!formData.nama || !formData.email || !formData.pesan) {
        showToast('Mohon lengkapi semua field yang wajib!', 'error');
        return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/pesan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Gagal mengirim pesan');

        guestForm.reset();
        showToast('Pesan berhasil dikirim! ✨', 'success');
        await loadMessages();
    } catch (error) {
        showToast('Gagal mengirim pesan. Coba lagi.', 'error');
        console.error('Error:', error);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

// --- Load Messages ---
async function loadMessages() {
    loadingState.style.display = 'flex';

    try {
        const response = await fetch(`${API_URL}/api/pesan`);
        if (!response.ok) throw new Error('Gagal memuat data');

        const data = await response.json();
        renderMessages(data);
        updateStats(data);
    } catch (error) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">❌</span>
                <p>Gagal memuat data. Pastikan server berjalan.</p>
            </div>
        `;
        console.error('Error:', error);
    }
}

// --- Render Messages ---
function renderMessages(messages) {
    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>Belum ada pesan. Jadilah yang pertama!</p>
            </div>
        `;
        return;
    }

    // Newest first
    const sorted = [...messages].reverse();

    messagesList.innerHTML = sorted.map(msg => {
        const initials = getInitials(msg.nama);
        const timeAgo = getTimeAgo(msg.tanggal);
        const instansiBadge = msg.instansi
            ? `<span class="message-instansi">🏫 ${escapeHtml(msg.instansi)}</span>`
            : '';

        return `
            <div class="message-card" data-id="${msg.id}">
                <div class="message-header">
                    <div class="message-author">
                        <div class="message-avatar">${initials}</div>
                        <div>
                            <div class="message-name">${escapeHtml(msg.nama)}</div>
                            <div class="message-meta">
                                ${instansiBadge}
                                ${msg.instansi ? '<span class="dot"></span>' : ''}
                                <span>${timeAgo}</span>
                            </div>
                        </div>
                    </div>
                    <button class="message-delete" onclick="showDeleteModal('${msg.id}')" title="Hapus pesan">🗑️</button>
                </div>
                <div class="message-body">${escapeHtml(msg.pesan)}</div>
            </div>
        `;
    }).join('');
}

// --- Update Stats ---
function updateStats(messages) {
    totalPesan.textContent = messages.length;

    const today = new Date().toISOString().split('T')[0];
    const todayCount = messages.filter(msg => {
        return msg.tanggal && msg.tanggal.startsWith(today);
    }).length;
    pesanHariIni.textContent = todayCount;
}

// --- Delete Functionality ---
function showDeleteModal(id) {
    deleteTargetId = id;
    deleteModal.classList.add('show');
}

cancelDelete.addEventListener('click', () => {
    deleteModal.classList.remove('show');
    deleteTargetId = null;
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        deleteModal.classList.remove('show');
        deleteTargetId = null;
    }
});

confirmDelete.addEventListener('click', async () => {
    if (!deleteTargetId) return;

    try {
        const response = await fetch(`${API_URL}/api/pesan/${deleteTargetId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Gagal menghapus pesan');

        deleteModal.classList.remove('show');
        showToast('Pesan berhasil dihapus', 'success');
        await loadMessages();
    } catch (error) {
        showToast('Gagal menghapus pesan', 'error');
        console.error('Error:', error);
    }

    deleteTargetId = null;
});

// --- Refresh Button ---
refreshBtn.addEventListener('click', async () => {
    refreshBtn.style.transform = 'rotate(360deg)';
    await loadMessages();
    setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
    }, 400);
});

// --- Toast Notification ---
function showToast(message, type = 'success') {
    toastIcon.textContent = type === 'success' ? '✅' : '❌';
    toastMessage.textContent = message;
    toast.className = 'toast show' + (type === 'error' ? ' error' : '');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Utility Functions ---
function getInitials(name) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getTimeAgo(dateStr) {
    if (!dateStr) return 'Baru saja';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay < 7) return `${diffDay} hari lalu`;

    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
