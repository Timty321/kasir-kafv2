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

  try {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'server', 'data');
    await fs.mkdir(dataDir, { recursive: true });

    // Write all seed data
    await writeJSON(getDataPath('products.json'), products);
    await writeJSON(getDataPath('transactions.json'), transactions);
    await writeJSON(getDataPath('logs.json'), logs);

    console.log('✓ Database seeded successfully');
    console.log(`✓ Created ${products.length} products`);
    console.log('✓ Initialized transactions.json');
    console.log('✓ Initialized logs.json');
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seed();
