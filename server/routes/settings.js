const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, getDataPath } = require('../utils/db');
const { initCron, executeReset } = require('../utils/cron');

router.get('/', async (req, res) => {
    try {
        const settings = await readJSON(getDataPath('settings.json'));
        res.json(settings);
    } catch (e) { res.status(500).json({ error: 'Server Error' }); }
});

router.put('/', async (req, res) => {
    try {
        const payload = req.body;
        const current = await readJSON(getDataPath('settings.json'));
        const newSettings = { ...current, ...payload };
        await writeJSON(getDataPath('settings.json'), newSettings);
        
        // Re-inject cron if needed
        initCron();
        
        res.json({ message: 'Settings saved successfully', settings: newSettings });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

router.post('/reset-stock', async (req, res) => {
    try {
        await executeReset();
        res.json({ message: 'Stock reset executed naturally.' });
    } catch(e) {
        res.status(500).json({ error: 'Reset failed' });
    }
});

router.post('/clear-history', async (req, res) => {
    try {
        await writeJSON(getDataPath('transactions.json'), []);
        await writeJSON(getDataPath('logs.json'), []);
        res.json({ message: 'History & Logs deleted permanently.' });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

module.exports = router;
