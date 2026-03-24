const { writeJSON, getDataPath } = require('./server/utils/db');
const path = require('path');
const fs = require('fs').promises;

async function seed() {
  const today = new Date().toISOString().split('T')[0];

  // Generate UUID
  function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Products with complete menu structure
  const products = [
    // Ayam Original
    { id: generateId(), name: 'Sayap', category: 'Ayam Original', price: 9000, stock: 20, min_stock: 5, date: today },
    { id: generateId(), name: 'Paha Bawah', category: 'Ayam Original', price: 9500, stock: 18, min_stock: 5, date: today },
    { id: generateId(), name: 'Dada', category: 'Ayam Original', price: 10000, stock: 22, min_stock: 5, date: today },
    { id: generateId(), name: 'Paha Atas', category: 'Ayam Original', price: 10000, stock: 19, min_stock: 5, date: today },

    // Paket Nasi + Ayam Original
    { id: generateId(), name: 'Nasi + Sayap', category: 'Paket Nasi + Ayam Original', price: 12000, stock: 25, min_stock: 5, date: today },
    { id: generateId(), name: 'Nasi + Paha Bawah', category: 'Paket Nasi + Ayam Original', price: 13000, stock: 23, min_stock: 5, date: today },
    { id: generateId(), name: 'Nasi + Dada', category: 'Paket Nasi + Ayam Original', price: 14000, stock: 20, min_stock: 5, date: today },
    { id: generateId(), name: 'Nasi + Paha Atas', category: 'Paket Nasi + Ayam Original', price: 14000, stock: 21, min_stock: 5, date: today },

    // Paket Komplit (Nasi + Ayam + Teh)
    { id: generateId(), name: 'Nasi + Sayap + Teh', category: 'Paket Komplit', price: 15500, stock: 15, min_stock: 5, date: today },
    { id: generateId(), name: 'Nasi + Paha Bawah + Teh', category: 'Paket Komplit', price: 15500, stock: 14, min_stock: 5, date: today },
    { id: generateId(), name: 'Nasi + Dada + Teh', category: 'Paket Komplit', price: 17000, stock: 16, min_stock: 5, date: today },
    { id: generateId(), name: 'Nasi + Paha Atas + Teh', category: 'Paket Komplit', price: 17000, stock: 15, min_stock: 5, date: today },

    // Sadas Cemplung & Sadas Mentai
    { id: generateId(), name: 'Sadas Sayap', category: 'Sadas Cemplung & Sadas Mentai', price: 13000, stock: 12, min_stock: 3, date: today },
    { id: generateId(), name: 'Sadas Paha Bawah', category: 'Sadas Cemplung & Sadas Mentai', price: 13000, stock: 10, min_stock: 3, date: today },
    { id: generateId(), name: 'Sadas Paha Atas', category: 'Sadas Cemplung & Sadas Mentai', price: 15000, stock: 8, min_stock: 3, date: today },
    { id: generateId(), name: 'Sadas Dada', category: 'Sadas Cemplung & Sadas Mentai', price: 15000, stock: 9, min_stock: 3, date: today },
    { id: generateId(), name: 'Sadas Tambah Nasi', category: 'Sadas Cemplung & Sadas Mentai', price: 4000, stock: 30, min_stock: 10, date: today },

    // Menu Tambahan & Extra Topping
    { id: generateId(), name: 'Nasi Putih', category: 'Menu Tambahan & Extra Topping', price: 4000, stock: 40, min_stock: 10, date: today },
    { id: generateId(), name: 'Kulit Crispy', category: 'Menu Tambahan & Extra Topping', price: 8000, stock: 25, min_stock: 5, date: today },
    { id: generateId(), name: 'Kentang Crispy', category: 'Menu Tambahan & Extra Topping', price: 8000, stock: 28, min_stock: 5, date: today },
    { id: generateId(), name: 'Extra Topping', category: 'Menu Tambahan & Extra Topping', price: 2000, stock: 50, min_stock: 10, date: today },
  ];

  // Empty transactions and logs
  const transactions = [];
  const logs = [];

  // Materials/Supplies inventory
  const materials = [
    // Sauces & Condiments
    { id: generateId(), name: 'Saos Tomat', category: 'Saos', unit: 'Botol', stock: 50, min_stock: 10, date: today },
    { id: generateId(), name: 'Saos Sambal', category: 'Saos', unit: 'Botol', stock: 50, min_stock: 10, date: today },
    
    // Packaging - Ayam
    { id: generateId(), name: 'Kertas Ayam', category: 'Kemasan Ayam', unit: 'Lembar', stock: 500, min_stock: 100, date: today },
    { id: generateId(), name: 'Kresek Kecil', category: 'Kemasan Ayam', unit: 'Pcs', stock: 300, min_stock: 50, date: today },
    
    // Packaging - Nasi
    { id: generateId(), name: 'Kardus Nasi', category: 'Kemasan Nasi', unit: 'Pcs', stock: 200, min_stock: 50, date: today },
    { id: generateId(), name: 'Kertas Nasi', category: 'Kemasan Nasi', unit: 'Lembar', stock: 500, min_stock: 100, date: today },
    { id: generateId(), name: 'Kresek Tanggung', category: 'Kemasan Nasi', unit: 'Pcs', stock: 250, min_stock: 50, date: today },
    { id: generateId(), name: 'Nasi', category: 'Makanan Pokok', unit: 'Kg', stock: 50, min_stock: 10, date: today },
    
    // Packaging - Kulit/Kentang
    { id: generateId(), name: 'Box Kulit', category: 'Kemasan Khusus', unit: 'Pcs', stock: 150, min_stock: 30, date: today },
    
    // Packaging - Sadas
    { id: generateId(), name: 'Box Kecil Sadas', category: 'Kemasan Khusus', unit: 'Pcs', stock: 150, min_stock: 30, date: today },
    { id: generateId(), name: 'Topping Sadas', category: 'Topping', unit: 'Pcs', stock: 150, min_stock: 30, date: today },
    
    // Beverages
    { id: generateId(), name: 'Teh Sosro Original 200ml', category: 'Minuman', unit: 'Pcs', stock: 100, min_stock: 20, date: today },
    
    // Sauce Cups & Toppings
    { id: generateId(), name: 'Cup Saos 35ml', category: 'Cup', unit: 'Pcs', stock: 500, min_stock: 100, date: today },
  ];

  try {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'server', 'data');
    await fs.mkdir(dataDir, { recursive: true });

    // Write all seed data
    await writeJSON(getDataPath('products.json'), products);
    await writeJSON(getDataPath('transactions.json'), transactions);
    await writeJSON(getDataPath('logs.json'), logs);
    await writeJSON(getDataPath('materials.json'), materials);

    console.log('✓ Database seeded successfully');
    console.log(`✓ Created ${products.length} products`);
    console.log(`✓ Created ${materials.length} materials`);
    console.log('✓ Initialized transactions.json');
    console.log('✓ Initialized logs.json');
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seed();
