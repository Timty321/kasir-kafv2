const cron = require('node-cron');
const { readJSON, writeJSON, getDataPath } = require('./db');
const { sendAdminMessage } = require('./whatsapp');

let activeJob = null;

async function executeReset() {
    try {
        let products = await readJSON(getDataPath('products.json'));
        products = products.map(p => ({ ...p, stock: 0 }));
        await writeJSON(getDataPath('products.json'), products);
        
        sendAdminMessage('🔄 *Sistem Otomatis Pekerja*\n\nJadwal harian tiba! Stok seluruh **Produk (Inventori Menu)** telah berhasil direset menjadi 0. Stok Bahan (Material) tetap aman.');
        console.log('[CRON] Daily product stock reset executed successfully.');
    } catch (e) {
        console.error('[CRON] Failed executing reset', e);
    }
}

function initCron() {
    try {
        // Read file using standard raw fs to avoid require caching issues
        const fs = require('fs');
        const content = fs.readFileSync(getDataPath('settings.json'), 'utf-8');
        const settings = JSON.parse(content);

        if (activeJob) {
            activeJob.stop();
            activeJob = null;
        }

        if (settings.autoResetStock && settings.resetTime) {
            const [hour, minute] = settings.resetTime.split(':');
            const cronExpression = `${parseInt(minute)} ${parseInt(hour)} * * *`;
            
            activeJob = cron.schedule(cronExpression, executeReset, {
                timezone: 'Asia/Jakarta'
            });
            console.log(`[CRON] Scheduled daily reset at ${settings.resetTime} WIB`);
        } else {
            console.log('[CRON] Auto reset is disabled.');
        }

        // Add hourly stock report
        cron.schedule('0 * * * *', async () => {
            try {
                const products = await readJSON(getDataPath('products.json'));
                const materials = await readJSON(getDataPath('materials.json'));
                
                let reportMsg = `⏰ *LAPORAN STOK PER JAM*\n`;
                
                reportMsg += `\n🍗 *PRODUK/MENU (Top 5 Paling Sedikit)*\n`;
                const sortedProducts = products.filter(p=>p.stock <= p.min_stock || p.stock < 10).sort((a,b)=>a.stock - b.stock).slice(0, 5);
                if(sortedProducts.length === 0) reportMsg += `(Stok Menu AMAN)\n`;
                sortedProducts.forEach(p => { reportMsg += `➖ ${p.name}: *${p.stock}*\n`; });
                
                reportMsg += `\n🧪 *BAHAN BAKU (Top 5 Paling Sedikit)*\n`;
                const sortedMaterials = materials.filter(m=>m.stock <= m.min_stock).sort((a,b)=>a.stock - b.stock).slice(0, 5);
                if(sortedMaterials.length === 0) reportMsg += `(Stok Bahan AMAN)\n`;
                sortedMaterials.forEach(m => { 
                    const unit = m.unit ? ` ${m.unit}` : '';
                    reportMsg += `➖ ${m.name}: *${m.stock}${unit}*\n`; 
                });
                
                sendAdminMessage(reportMsg);
                console.log('[CRON] Hourly stock report sent to WA');
            } catch (error) {
                console.error('[CRON] Failed sending hourly report', error);
            }
        });
        
    } catch (error) {
        console.error('[CRON] Init error:', error);
    }
}

module.exports = { initCron, executeReset };
