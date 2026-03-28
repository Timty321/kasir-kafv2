const express = require('express');
const path = require('path');
const cors = require('cors');

// Import routes
const productsRouter = require('./routes/products');
const transactionsRouter = require('./routes/transactions');
const logsRouter = require('./routes/logs');
const materialsRouter = require('./routes/materials');
const authRouter = require('./routes/auth');
const settingsRouter = require('./routes/settings');
const financeRouter = require('./routes/finance');
const { initCron } = require('./utils/cron');

// Initiate Daily Automations
initCron();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/products', productsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/finance', financeRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════╗`);
  console.log(`║  🍗 POS KASIR-KAF System                  ║`);
  console.log(`║  🚀 Server running on port ${PORT}              ║`);
  console.log(`║  📍 http://localhost:${PORT}                    ║`);
  console.log(`╚═══════════════════════════════════════════╝\n`);
});
