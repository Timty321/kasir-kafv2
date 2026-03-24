const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, getDataPath } = require('../utils/db');

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * GET /api/transactions
 * Get all transactions, optionally filtered by date
 */
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const transactions = await readJSON(getDataPath('transactions.json'));

    let filtered = transactions;
    if (date) {
      filtered = transactions.filter(t => t.timestamp.split('T')[0] === date);
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * POST /api/transactions
 * Create a new transaction (checkout)
 * Expects: { items, total, payment_method, amount_paid, change }
 */
router.post('/', async (req, res) => {
  try {
    const { items, total, payment_method, amount_paid, change } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Transaction must have items' });
    }

    if (!payment_method || !['CASH', 'QRIS'].includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Read current data
    const products = await readJSON(getDataPath('products.json'));
    const transactions = await readJSON(getDataPath('transactions.json'));
    const logs = await readJSON(getDataPath('logs.json'));

    // Helper: Map product to its base chicken product if applicable
    const baseNames = ['Sayap', 'Paha Bawah', 'Dada', 'Paha Atas'];
    const getBaseProduct = (product, allProducts) => {
      if (product.category !== 'Ayam Original') {
        for (const name of baseNames) {
          if (product.name.includes(name)) {
            const bp = allProducts.find(p => p.category === 'Ayam Original' && p.name === name);
            if (bp) return bp;
          }
        }
      }
      return product;
    };

    // Calculate demands per base product
    const demands = {};
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }
      
      const baseProduct = getBaseProduct(product, products);
      if (!demands[baseProduct.id]) {
        demands[baseProduct.id] = { product: baseProduct, requested: 0 };
      }
      demands[baseProduct.id].requested += item.qty;
    }

    // Validate aggregated stock
    for (const id in demands) {
      const { product, requested } = demands[id];
      if (product.stock < requested) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Requested: ${requested}, Available: ${product.stock}`,
        });
      }
    }

    // Update stock only for base products and unrelated products
    for (const id in demands) {
      const prodIndex = products.findIndex(p => p.id === id);
      if (prodIndex !== -1) {
        products[prodIndex].stock -= demands[id].requested;
      }
    }

    // Create transaction
    const newTransaction = {
      id: generateId(),
      items,
      total: parseInt(total),
      payment_method,
      amount_paid: parseInt(amount_paid),
      change: parseInt(change),
      timestamp: new Date().toISOString(),
    };

    // Save all changes
    transactions.push(newTransaction);
    await writeJSON(getDataPath('products.json'), products);
    await writeJSON(getDataPath('transactions.json'), transactions);

    // Log transaction
    logs.push({
      id: generateId(),
      type: 'transaction',
      action: 'checkout',
      message: `Transaction completed: ${items.length} item(s), Total: Rp${total.toLocaleString('id-ID')}`,
      timestamp: new Date().toISOString(),
    });
    await writeJSON(getDataPath('logs.json'), logs);

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

module.exports = router;
