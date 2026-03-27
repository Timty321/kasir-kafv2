const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, getDataPath } = require('../utils/db');
const { sendAdminMessage } = require('../utils/whatsapp');
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * GET /api/products
 * Get all products, optionally filtered by date
 */
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const products = await readJSON(getDataPath('products.json'));

    let filtered = products;
    if (date) {
      filtered = products.filter(p => p.date === date);
    }

    // Connect stock for composite products to base chicken stock
    const baseNames = ['Sayap', 'Paha Bawah', 'Dada', 'Paha Atas'];
    const mappedFiltered = filtered.map(p => {
      let baseP = p;
      if (p.category !== 'Ayam Original') {
        for (const name of baseNames) {
          if (p.name.includes(name)) {
            const bp = products.find(bp => bp.category === 'Ayam Original' && bp.name === name);
            if (bp) {
              baseP = bp;
              break;
            }
          }
        }
      }
      if (baseP.id !== p.id) {
        return { ...p, stock: baseP.stock };
      }
      return p;
    });

    res.json(mappedFiltered);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/products/categories
 * Get unique product categories
 */
router.get('/categories', async (req, res) => {
  try {
    const products = await readJSON(getDataPath('products.json'));
    const categories = [...new Set(products.map(p => p.category))].sort();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/products
 * Create a new product
 */
router.post('/', async (req, res) => {
  try {
    const { name, category, price, stock, min_stock } = req.body;

    // Validation
    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const products = await readJSON(getDataPath('products.json'));
    const newProduct = {
      id: generateId(),
      name,
      category,
      price: parseInt(price),
      stock: parseInt(stock),
      min_stock: parseInt(min_stock) || 5,
      date: new Date().toISOString().split('T')[0],
    };

    products.push(newProduct);
    await writeJSON(getDataPath('products.json'), products);

    // Log the action
    const logs = await readJSON(getDataPath('logs.json'));
    logs.push({
      id: generateId(),
      type: 'inventory',
      action: 'create',
      message: `Product created: ${name}`,
      timestamp: new Date().toISOString(),
    });
    await writeJSON(getDataPath('logs.json'), logs);

    sendAdminMessage(`📦 *Produk Baru Ditambahkan*\nNama: ${name}\nHarga: Rp${parseInt(price).toLocaleString('id-ID')}\nStok: ${stock}`);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * PUT /api/products/:id
 * Update a product
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const products = await readJSON(getDataPath('products.json'));
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldP = { ...products[productIndex] };
    products[productIndex] = { ...products[productIndex], ...updates };
    const newP = products[productIndex];
    await writeJSON(getDataPath('products.json'), products);

    // Log the action
    const logs = await readJSON(getDataPath('logs.json'));
    logs.push({
      id: generateId(),
      type: 'inventory',
      action: 'update',
      message: `Product updated: ${oldP.name}`,
      timestamp: new Date().toISOString(),
    });
    await writeJSON(getDataPath('logs.json'), logs);

    let msgDiff = `✏️ *STOK/DATA PRODUK DIEDIT*\nNama: ${newP.name}\n\n`;
    if (oldP.stock !== newP.stock) msgDiff += `📦 Stok: *${oldP.stock}* ➡️ *${newP.stock}*\n`;
    if (oldP.price !== newP.price) msgDiff += `💰 Harga: *Rp${oldP.price}* ➡️ *Rp${newP.price}*\n`;
    if (oldP.stock === newP.stock && oldP.price === newP.price) msgDiff += `Data Informasi Makanan telah diperbarui.`;
    
    sendAdminMessage(msgDiff.trim());

    res.json(products[productIndex]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const products = await readJSON(getDataPath('products.json'));
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];
    await writeJSON(getDataPath('products.json'), products);

    // Log the action
    const logs = await readJSON(getDataPath('logs.json'));
    logs.push({
      id: generateId(),
      type: 'inventory',
      action: 'delete',
      message: `Product deleted: ${deletedProduct.name}`,
      timestamp: new Date().toISOString(),
    });
    await writeJSON(getDataPath('logs.json'), logs);

    sendAdminMessage(`🗑️ *Produk Dihapus*\nNama: ${deletedProduct.name} telah dihapus dari inventori.`);

    res.json({ message: 'Product deleted successfully', product: deletedProduct });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
