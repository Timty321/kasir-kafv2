require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = 3001;
const API_URL = 'http://localhost:3000/api';
const fs = require('fs');
let ADMIN_NUMBER = null;
let LOG_TARGET = null; // Menyimpan ID Grup/Chat untuk notifikasi web

try {
    if (fs.existsSync('./config.json')) {
        const config = JSON.parse(fs.readFileSync('./config.json'));
        ADMIN_NUMBER = config.ADMIN_NUMBER;
        LOG_TARGET = config.LOG_TARGET || config.ADMIN_NUMBER;
    }
} catch (e) { console.error('Gagal baca config', e); }

function saveConfig() {
    fs.writeFileSync('./config.json', JSON.stringify({ ADMIN_NUMBER, LOG_TARGET }));
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    console.log('Scan QR Code ini untuk login ke WhatsApp Bot Kasir-KAF:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Bot siap digunakan!');
    const notifTarget = LOG_TARGET || ADMIN_NUMBER;
    if (notifTarget) {
        client.sendMessage(notifTarget, '🤖 Sistem Kasir-KAF WhatsApp Bot berhasil terhubung dan siap menerima log serta perintah!');
    } else {
        console.log('Kirim !setadmin ke nomor ini dari nomor WA Admin Anda untuk mendaftarkan akses.');
    }
});

app.post('/send', async (req, res) => {
    try {
        const { message } = req.body;
        if (LOG_TARGET && message) {
            await client.sendMessage(LOG_TARGET, message);
            return res.json({ success: true });
        }
        res.status(400).json({ error: 'Missing message or LOG_TARGET not set' });
    } catch (error) {
        console.error('Error sending WA message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

client.on('message', async msg => {
    // msg.author berisi ID asli pengirim jika pesan datang dari Grup
    const sender = msg.author || msg.from;

    if (!ADMIN_NUMBER) {
        if (msg.body === '!setadmin') {
            ADMIN_NUMBER = sender;
            LOG_TARGET = msg.from; // Tempat perintah dikirim akan jadi tempat notifikasi log
            saveConfig();
            msg.reply('✅ Nomor Anda berhasil diverifikasi sebagai Admin Kasir-KAF.\n\nSemua notifikasi transaksi/web akan dikirimkan ke chat/grup ini.\nGunakan *!setgroup* di grup yang diinginkan untuk mengubah target notifikasi.\nSilakan ketik *!help* untuk melihat daftar command stok.');
            console.log(`ADMIN_NUMBER: ${ADMIN_NUMBER}, LOG_TARGET: ${LOG_TARGET}`);
        }
        return;
    }

    // Blokir jika pesannya bukan dari nomor admin yang terverifikasi (Penting untk sistem grup)
    if (sender !== ADMIN_NUMBER) return;

    const text = msg.body.trim();
    if (!text.startsWith('!')) return;

    const parts = text.split(' ');
    const cmd = parts[0].toLowerCase();
    const type = parts[1] ? parts[1].toLowerCase() : null;

    try {
        if (cmd === '!stock' || cmd === '!stok') {
            const pRes = await axios.get(API_URL + '/products');
            const mRes = await axios.get(API_URL + '/materials');
            const products = pRes.data;
            const materials = mRes.data;

            let replyMsg = `📊 *TOTAL STOK KESELURUHAN*\n`;
            replyMsg += `\n🍗 *PRODUK TERSEDIA*\n`;
            products.forEach(p => {
                const alert = p.stock <= p.min_stock ? ' ⚠️' : '';
                replyMsg += `▪️ ${p.name}: *${p.stock}*${alert}\n`;
            });
            replyMsg += `\n🧪 *BAHAN BAKU*\n`;
            materials.forEach(m => {
                const alert = m.stock <= m.min_stock ? ' ⚠️' : '';
                const unit = m.unit ? ` ${m.unit}` : '';
                replyMsg += `▪️ ${m.name}: *${m.stock}${unit}*${alert}\n`;
            });
            return msg.reply(replyMsg.trim());

        } else if (cmd === '!cek' && type) {
            const nameQuery = parts.slice(2).join(' ').toLowerCase();
            const endpoint = type === 'produk' ? '/products' : '/materials';
            const { data } = await axios.get(`${API_URL}${endpoint}`);

            const matches = data.filter(item => item.name.toLowerCase().includes(nameQuery));
            if (matches.length === 0) {
                return msg.reply(`Data ${type} dengan kata kunci '${nameQuery}' tidak ditemukan.`);
            }

            let reply = `📦 *Stok ${type.toUpperCase()}:*\n`;
            matches.forEach(m => {
                reply += `- ${m.name}: *${m.stock}* (Min: ${m.min_stock})\n`;
            });
            msg.reply(reply);

        } else if ((cmd === '!tambah' || cmd === '!kurang') && type) {
            const qtyStr = parts[parts.length - 1];
            const qty = parseInt(qtyStr);
            if (isNaN(qty)) {
                return msg.reply('Format salah. Contoh: !tambah produk Sayap 10');
            }

            const nameQuery = parts.slice(2, -1).join(' ').toLowerCase();
            const endpoint = type === 'produk' ? '/products' : '/materials';
            let { data } = await axios.get(`${API_URL}${endpoint}`);

            const match = data.find(item => item.name.toLowerCase() === nameQuery);
            if (!match) {
                return msg.reply(`Data ${type} dengan nama persis '${nameQuery}' tidak ditemukan. Coba jalankan !cek dulu.`);
            }

            let newStock = match.stock;
            if (cmd === '!tambah') newStock += qty;
            if (cmd === '!kurang') newStock -= qty;
            if (newStock < 0) newStock = 0;

            await axios.put(`${API_URL}${endpoint}/${match.id}`, {
                ...match,
                stock: newStock
            });

            msg.reply(`✅ Stok *${match.name}* berhasil diupdate!\nLama: ${match.stock}\nBaru: *${newStock}*`);
        } else if (cmd === '!setgroup') {
            // Change the notification/log target to the current chat (can be a group)
            LOG_TARGET = msg.from;
            saveConfig();
            msg.reply(`✅ *Target notifikasi diubah!*\n\nSemua log transaksi & stok dari sistem web akan dikirimkan ke chat/grup ini.\n\n_ID: ${LOG_TARGET}_`);
            console.log(`LOG_TARGET diubah ke: ${LOG_TARGET}`);
        } else if (cmd === '!help') {
            msg.reply(`📖 *Daftar Perintah Kasir-KAF*\n\n- !stock (Melihat keseluruhan stok)\n- !cek produk [nama]\n- !cek bahan [nama]\n- !tambah produk [nama_lengkap] [qty]\n- !tambah bahan [nama_lengkap] [qty]\n- !kurang produk [nama_lengkap] [qty]\n- !kurang bahan [nama_lengkap] [qty]\n- !setgroup (Ubah grup tujuan notifikasi ke chat ini)`);
        }
    } catch (error) {
        console.error('Error handling command:', error.message);
        msg.reply('Terjadi kesalahan saat menghubungi API Server Kasir-KAF. Pastikan server web utama (port 3000) sedang berjalan.');
    }
});

client.initialize();
app.listen(PORT, () => {
    console.log(`Bridge Server WA aktif di port ${PORT}`);
});
