const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, getDataPath } = require('../utils/db');
const { sendAdminMessage } = require('../utils/whatsapp');
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * GET /api/materials
 * Get all materials, optionally filtered by date
 */
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    console.log('[SERVER] GET /api/materials requested' + (date ? ` (date: ${date})` : ''));
    const materials = await readJSON(getDataPath('materials.json'));
    
    console.log(`[SERVER] Loaded ${materials.length} materials from database`);
    materials.forEach((m, idx) => {
      console.log(`[SERVER]   [${idx + 1}] "${m.name}" (ID: ${m.id}, Stock: ${m.stock})`);
    });

    let filtered = materials;
    if (date) {
      filtered = materials.filter(m => m.date === date);
      console.log(`[SERVER] After date filter: ${filtered.length} materials`);
    }

    console.log(`[SERVER] Returning ${filtered.length} materials to client`);
    res.json(filtered);
  } catch (error) {
    console.error('[SERVER] Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

/**
 * POST /api/materials
 * Create a new material
 */
router.post('/', async (req, res) => {
  try {
    const { name, category, unit, stock, min_stock } = req.body;

    // Validation
    if (!name || !category || !unit || stock === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const materials = await readJSON(getDataPath('materials.json'));
    const newMaterial = {
      id: generateId(),
      name,
      category,
      unit,
      stock: parseInt(stock),
      min_stock: parseInt(min_stock) || 5,
      date: new Date().toISOString().split('T')[0],
    };

    materials.push(newMaterial);
    await writeJSON(getDataPath('materials.json'), materials);

    // Log the action
    const logs = await readJSON(getDataPath('logs.json'));
    logs.push({
      id: generateId(),
      type: 'inventory',
      action: 'create',
      message: `Material created: ${name}`,
      timestamp: new Date().toISOString(),
    });
    await writeJSON(getDataPath('logs.json'), logs);

    sendAdminMessage(`🧪 *Bahan Baru Ditambahkan*\nNama: ${name}\nKategori: ${category}\nStok Awal: ${stock} ${unit}`);

    res.status(201).json(newMaterial);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

/**
 * PUT /api/materials/:id
 * Update a material
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const materials = await readJSON(getDataPath('materials.json'));
    const materialIndex = materials.findIndex(m => m.id === id);

    if (materialIndex === -1) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const oldM = { ...materials[materialIndex] };
    materials[materialIndex] = { ...materials[materialIndex], ...updates };
    const newM = materials[materialIndex];
    await writeJSON(getDataPath('materials.json'), materials);

    // Log the action
    const logs = await readJSON(getDataPath('logs.json'));
    logs.push({
      id: generateId(),
      type: 'inventory',
      action: 'update',
      message: `Material updated: ${oldM.name}`,
      timestamp: new Date().toISOString(),
    });
    await writeJSON(getDataPath('logs.json'), logs);

    let msgDiff = `✏️ *STOK/DATA BAHAN DIEDIT*\nNama: ${newM.name}\n\n`;
    if (oldM.stock !== newM.stock) msgDiff += `📦 Stok: *${oldM.stock}* ➡️ *${newM.stock} ${newM.unit}*\n`;
    if (oldM.stock === newM.stock) msgDiff += `Data Detail Bahan telah diperbarui.`;
    
    sendAdminMessage(msgDiff.trim());

    res.json(materials[materialIndex]);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

/**
 * DELETE /api/materials/:id
 * Delete a material
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const materials = await readJSON(getDataPath('materials.json'));
    const materialIndex = materials.findIndex(m => m.id === id);

    if (materialIndex === -1) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const deletedMaterial = materials.splice(materialIndex, 1)[0];
    await writeJSON(getDataPath('materials.json'), materials);

    // Log the action
    const logs = await readJSON(getDataPath('logs.json'));
    logs.push({
      id: generateId(),
      type: 'inventory',
      action: 'delete',
      message: `Material deleted: ${deletedMaterial.name}`,
      timestamp: new Date().toISOString(),
    });
    await writeJSON(getDataPath('logs.json'), logs);

    sendAdminMessage(`🗑️ *Bahan Dihapus*\nNama: ${deletedMaterial.name} telah dihapus dari inventori.`);

    res.json({ message: 'Material deleted successfully', material: deletedMaterial });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

/**
 * PUT /api/materials/:id/deduct
 * Deduct material stock (used internally for transactions)
 */
router.put('/:id/deduct', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    console.log(`[SERVER] PUT /api/materials/${id}/deduct requested`);
    console.log(`[SERVER]   Quantity to deduct: ${quantity}`);

    if (quantity === undefined || quantity <= 0) {
      console.error('[SERVER] Invalid quantity provided:', quantity);
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const materials = await readJSON(getDataPath('materials.json'));
    console.log(`[SERVER] Loaded ${materials.length} materials from database`);
    
    const material = materials.find(m => m.id === id);

    if (!material) {
      console.error(`[SERVER] ❌ Material not found with ID: ${id}`);
      console.error(`[SERVER] Available material IDs: ${materials.map(m => m.id).join(', ')}`);
      return res.status(404).json({ error: 'Material not found' });
    }

    console.log(`[SERVER] ✅ Found material: "${material.name}" (Current stock: ${material.stock})`);

    if (material.stock < quantity) {
      console.warn(`[SERVER] ⚠️  Insufficient stock! Have: ${material.stock}, Need: ${quantity}`);
      return res.status(400).json({
        error: `Insufficient stock for ${material.name}. Available: ${material.stock}`,
      });
    }

    material.stock -= quantity;
    console.log(`[SERVER] Updated stock: ${material.stock} (${quantity} units deducted)`);
    
    await writeJSON(getDataPath('materials.json'), materials);
    console.log(`[SERVER] ✅ Deduction successful for "${material.name}"`);

    res.json(material);
  } catch (error) {
    console.error('[SERVER] Error deducting material:', error);
    res.status(500).json({ error: 'Failed to deduct material' });
  }
});

module.exports = router;
