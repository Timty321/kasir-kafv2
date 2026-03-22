# 🍗 KASIR-KAF POS System - Quick Reference

## System Overview

A complete Point of Sale system with:
- ✅ Sales Dashboard with responsive cart
- ✅ Inventory Management (CRUD)
- ✅ Activity/Transaction Logs
- ✅ Mobile-responsive design
- ✅ Multiple payment methods (Cash, QRIS)
- ✅ Real-time stock updates
- ✅ Low stock alerts

## Quick Commands

```bash
# Install all dependencies
npm install

# Seed initial data (products, transactions, logs)
npm run seed

# Start the development server
npm start

# Server runs on http://localhost:3000
```

## Accessing the Application

### POS Sales Dashboard
- **URL**: `http://localhost:3000`
- **Features**: 
  - Browse products by category
  - Add items to cart
  - Multiple payment methods
  - Generate transactions
  - Mobile navigation

### Admin Panel
- **URL**: `http://localhost:3000/admin.html`
- **Tabs**:
  - 📦 **Inventory**: Manage products, add/edit/delete
  - 📊 **History**: View activity logs and transactions

## User Stories

### 1. Cashier - Making a Sale
1. Open `http://localhost:3000`
2. Browse products in the grid
3. Click "🛒 Tambah" to add items
4. Use bottom sheet or side panel cart
5. Click "💳 Bayar" to open checkout
6. Select payment method (Cash/QRIS)
7. For Cash: Enter amount, confirm change
8. For QRIS: Scan code, click "Pembayaran Berhasil"
9. Transaction saved, stock updated

### 2. Manager - Managing Inventory
1. Open `http://localhost:3000/admin.html`
2. Stay on "📦 Inventori" tab
3. Click "➕ Tambah Produk" to add new item
4. Fill form and click "✓ Simpan"
5. View all products in table
6. Click "✏️ Edit" to modify product
7. Click "🗑️" to delete (confirmation required)

### 3. Manager - Viewing Reports
1. Open `http://localhost:3000/admin.html`
2. Click "📊 Riwayat" tab
3. Filter by:
   - Type: All, Inventory, or Transactions
   - Date: Select specific date
4. View chronological log of all activities

## File Structure Explained

### Frontend
- **index.html**: POS sales dashboard (responsive grid + cart)
- **admin.html**: Admin panel (inventory + history)
- **app.js**: All client-side logic (state, API calls, UI)

### Backend
- **server.js**: Express setup, routes mounting
- **routes/products.js**: Product CRUD endpoints
- **routes/transactions.js**: Checkout endpoint
- **routes/logs.js**: Activity logs endpoint
- **utils/db.js**: Safe JSON file read/write functions
- **data/*.json**: Database files (auto-created on seed)

### Configuration
- **package.json**: Dependencies and scripts
- **seed.js**: Initialize database with menu data

## API Testing (cURL Examples)

```bash
# Get all products
curl http://localhost:3000/api/products

# Get products from specific date
curl http://localhost:3000/api/products?date=2024-01-15

# Create a product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Ayam","category":"Ayam Original","price":9000,"stock":20,"min_stock":5}'

# Get transactions
curl http://localhost:3000/api/transactions

# Get logs (filtered)
curl "http://localhost:3000/api/logs?type=transaction&date=2024-01-15"

# Create transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"product_id":"abc123","name":"Ayam Sayap","qty":2,"price":9000}],
    "total":18000,
    "payment_method":"CASH",
    "amount_paid":20000,
    "change":2000
  }'
```

## Important Features

### Stock Management
- Stock automatically decreases on transaction
- Low stock items highlighted in yellow
- Products with 0 stock are disabled ("✗ Habis")
- Min stock alerts in inventory table

### Payment Methods
- **Cash**: Enter amount paid, auto calculate change
- **QRIS**: Simulate payment (click button to complete)

### Date Filtering
- Inventory: Filter products by date
- Logs: Filter activities by date
- Transactions: Query by date
- Uses YYYY-MM-DD format

### JSON Storage
- **products.json**: All products with prices, stock
- **transactions.json**: All completed sales
- **logs.json**: All inventory and transaction activities
- Files created in `server/data/`

## Color Scheme

| Color | Usage |
|-------|-------|
| 🟠 Orange | Primary brand color, cart, buttons |
| 🟢 Green | Success actions, payment |
| 🔵 Blue | Edit, filter actions |
| 🔴 Red | Delete, errors |
| 🟡 Yellow | Low stock warning |

## Keyboard Shortcuts

- `Enter` in product form: Save
- `Escape` in modal: Close modal
- Arrow keys: Scroll in mobile modals

## Environmental Setup

### Node.js Required
```bash
node --version  # Should be >= 14.0.0
npm --version   # Should be >= 6.0.0
```

### Port Configuration
Default: 3000

Change with environment variable:
```bash
# Windows
set PORT=3001 && npm start

# Linux/Mac
PORT=3001 npm start
```

## Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### "EADDRINUSE: address already in use"
- Port 3000 is occupied
- Change port or kill process using port

### "Data files not found"
```bash
npm run seed
```

### "Module not found: ./data/products.json"
- Seed script needs to run first
- Use: `npm run seed`

## Performance Tips

1. **For Large Databases**: Consider implementing pagination
2. **Load Times**: Products load on demand with category filtering
3. **UI Responsiveness**: Debounced updates prevent lag
4. **Stock Sync**: Real-time updates via API calls

## Security Notes

- No authentication in demo version
- Consider adding user login for production
- Sanitize input for production
- Use HTTPS in production
- Database encrypted recommended for production

## Future Enhancements

1. ✨ User authentication & roles
2. ✨ Database migration (PostgreSQL/MongoDB)
3. ✨ Receipt printing
4. ✨ Multiple location support
5. ✨ Advanced reporting & analytics
6. ✨ Real QRIS integration
7. ✨ Product images
8. ✨ Discount/promo codes

---

**Start the system now:**
```bash
npm install && npm run seed && npm start
```

**Then open:** `http://localhost:3000` 🎉
