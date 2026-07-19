/* ============================================
   BUKU TAMU DIGITAL — Node.js Server
   Website Dinamis (Dynamic Website)
   
   Cara menjalankan:
   1. Buka terminal di folder ini
   2. Jalankan: node server.js
   3. Buka browser: http://localhost:3000
   ============================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types untuk serve static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// --- Helper: Baca Data dari JSON ---
function readData() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        // Jika file belum ada atau kosong, return array kosong
        return [];
    }
}

// --- Helper: Tulis Data ke JSON ---
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Helper: Generate ID unik ---
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// --- Helper: Parse request body ---
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

// --- Helper: Kirim response JSON ---
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

// --- Helper: Serve static file ---
function serveStaticFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

// --- Buat Server ---
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ==========================================
    //  API ROUTES
    // ==========================================

    // GET /api/pesan — Ambil semua pesan
    if (method === 'GET' && pathname === '/api/pesan') {
        const messages = readData();
        sendJSON(res, 200, messages);
        return;
    }

    // POST /api/pesan — Tambah pesan baru
    if (method === 'POST' && pathname === '/api/pesan') {
        try {
            const body = await parseBody(req);

            // Validasi
            if (!body.nama || !body.email || !body.pesan) {
                sendJSON(res, 400, { error: 'Nama, email, dan pesan wajib diisi' });
                return;
            }

            const messages = readData();
            const newMessage = {
                id: generateId(),
                nama: body.nama,
                email: body.email,
                instansi: body.instansi || '',
                pesan: body.pesan,
                tanggal: new Date().toISOString()
            };

            messages.push(newMessage);
            writeData(messages);

            console.log(`[+] Pesan baru dari: ${newMessage.nama}`);
            sendJSON(res, 201, newMessage);
        } catch (err) {
            sendJSON(res, 400, { error: 'Data tidak valid' });
        }
        return;
    }

    // DELETE /api/pesan/:id — Hapus pesan
    if (method === 'DELETE' && pathname.startsWith('/api/pesan/')) {
        const id = pathname.split('/').pop();
        let messages = readData();
        const initialLength = messages.length;

        messages = messages.filter(msg => msg.id !== id);

        if (messages.length === initialLength) {
            sendJSON(res, 404, { error: 'Pesan tidak ditemukan' });
            return;
        }

        writeData(messages);
        console.log(`[-] Pesan dihapus: ${id}`);
        sendJSON(res, 200, { message: 'Pesan berhasil dihapus' });
        return;
    }

    // ==========================================
    //  STATIC FILES
    // ==========================================
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    // Security: prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    serveStaticFile(res, filePath);
});

// --- Pastikan data.json ada ---
if (!fs.existsSync(DATA_FILE)) {
    writeData([]);
    console.log('[i] data.json telah dibuat');
}

// --- Jalankan Server ---
server.listen(PORT, () => {
    console.log('============================================');
    console.log('  BUKU TAMU DIGITAL — Server Berjalan');
    console.log('============================================');
    console.log(`  URL     : http://localhost:${PORT}`);
    console.log(`  Data    : ${DATA_FILE}`);
    console.log('  Tekan Ctrl+C untuk menghentikan server');
    console.log('============================================');
});
