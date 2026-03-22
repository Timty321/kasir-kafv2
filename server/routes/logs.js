const express = require('express');
const router = express.Router();
const { readJSON, getDataPath } = require('../utils/db');

/**
 * GET /api/logs
 * Get all logs, optionally filtered by type and/or date
 * Query params: ?type=inventory|transaction&date=YYYY-MM-DD
 */
router.get('/', async (req, res) => {
  try {
    const { type, date } = req.query;
    const logs = await readJSON(getDataPath('logs.json'));

    let filtered = logs;

    // Filter by type if provided
    if (type) {
      filtered = filtered.filter(log => log.type === type);
    }

    // Filter by date if provided
    if (date) {
      filtered = filtered.filter(log => log.timestamp.split('T')[0] === date);
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
