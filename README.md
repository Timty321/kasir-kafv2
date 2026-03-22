# 🍗 KASIR-KAF POS System

A modern, responsive Point of Sale (POS) web application for food outlets. Built with Node.js/Express backend and vanilla JavaScript frontend, using JSON file-based storage.

## ✨ Features

- **POS Dashboard**: Responsive product grid with real-time cart management
- **Inventory Management**: CRUD operations for products with stock tracking
- **Transaction History**: Complete log of all sales and inventory changes
- **Mobile Responsive**: Fully optimized for smartphones and tablets
- **Real-time Stock Updates**: Stock levels update immediately after each transaction
- **Multiple Payment Methods**: Cash and QRIS payment support
- **Low Stock Alerts**: Visual indicators for products below minimum stock
- **Date Filtering**: Track inventory and transactions by date
- **Clean UI**: Modern design with Tailwind CSS

## 🛠️ Tech Stack

**Frontend:**
- HTML5
- Tailwind CSS (CDN)
- Vanilla JavaScript (ES6+)

**Backend:**
- Node.js
- Express.js
- CORS

**Database:**
- JSON file-based storage
- Async file operations with proper error handling

## 📁 Project Structure

```
kasir-kaf-v2/
├── public/
│   ├── index.html          # Sales/POS Dashboard
│   ├── admin.html          # Inventory & History Management
│   └── js/
│       └── app.js          # Shared frontend logic
├── server/
│   ├── server.js           # Express server setup
│   ├── routes/
│   │   ├── products.js     # Product API endpoints
│   │   ├── transactions.js # Transaction API endpoints
│   │   └── logs.js         # Activity logs API
│   ├── utils/
│   │   └── db.js           # JSON database utilities
│   └── data/
│       ├── products.json       # Product inventory
│       ├── transactions.json   # Sales transactions
│       └── logs.json           # Activity logs
├── package.json
├── seed.js                 # Database initialization script
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn

### Installation

1. **Clone/Navigate to project:**
   ```bash
   cd "d:\Coding\Kasir-KAF v2"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Seed initial data:**
   ```bash
   npm run seed
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Access the application:**
   - Open browser and go to `http://localhost:3000`
   - POS Dashboard: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/admin.html`

## 📊 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products?date=YYYY-MM-DD` - Get products by date
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions?date=YYYY-MM-DD` - Filter transactions by date
- `POST /api/transactions` - Create new transaction (checkout)

### Logs/Activity
- `GET /api/logs` - Get all activity logs
- `GET /api/logs?type=inventory` - Filter by type
- `GET /api/logs?date=YYYY-MM-DD` - Filter by date
- `GET /api/logs?type=transaction&date=YYYY-MM-DD` - Combined filter

## 📱 Features Breakdown

### POS Dashboard (index.html)
- **Category Filter**: Browse products by category
- **Product Grid**: Display all items with price and stock
- **Shopping Cart**: Add/remove items with quantity controls
- **Checkout Modal**: Multiple payment methods
- **Mobile Navigation**: Bottom nav for mobile devices
- **Real-time Calculations**: Automatic total and change calculation

### Inventory Management (admin.html)
- **Product Table**: View all products in tabular format
- **Date Filter**: Filter inventory by specific date
- **CRUD Operations**: Add, edit, delete products
- **Stock Alerts**: Visual highlighting for low stock items
- **Stock Tracking**: Monitor minimum stock levels

### Activity Logs (admin.html)
- **Transaction Logs**: Track all sales
- **Inventory Logs**: Monitor product changes
- **Date Filtering**: View activities by date
- **Type Filtering**: Filter by inventory or transaction
- **Timestamps**: Complete audit trail

## 🗂️ Database Structure

### products.json
```json
[
  {
    "id": "uuid",
    "name": "Ayam Sayap",
    "category": "Ayam Original",
    "price": 9000,
    "stock": 20,
    "min_stock": 5,
    "date": "YYYY-MM-DD"
  }
]
```

### transactions.json
```json
[
  {
    "id": "uuid",
    "items": [
      {
        "product_id": "uuid",
        "name": "Ayam Sayap",
        "qty": 2,
        "price": 9000
      }
    ],
    "total": 18000,
    "payment_method": "CASH",
    "amount_paid": 20000,
    "change": 2000,
    "timestamp": "ISO_STRING"
  }
]
```

### logs.json
```json
[
  {
    "id": "uuid",
    "type": "inventory|transaction",
    "action": "create|update|delete|checkout",
    "message": "Product updated",
    "timestamp": "ISO_STRING"
  }
]
```

## 🎯 Initial Menu Data

The application comes pre-populated with these product categories:

**Ayam Original** - Individual chicken pieces
- Sayap: Rp 9,000
- Paha Bawah: Rp 9,500
- Dada: Rp 10,000
- Paha Atas: Rp 10,000

**Paket Nasi + Ayam Original** - Chicken with rice
- Nasi + Sayap: Rp 12,000
- Nasi + Paha Bawah: Rp 13,000
- Nasi + Dada: Rp 14,000
- Nasi + Paha Atas: Rp 14,000

**Paket Komplit** - Complete meal
- Nasi + Sayap + Teh: Rp 15,500
- Nasi + Paha Bawah + Teh: Rp 15,500
- Nasi + Dada + Teh: Rp 17,000
- Nasi + Paha Atas + Teh: Rp 17,000

**Sadas Special** - Premium preparations
- Sadas Sayap: Rp 13,000
- Sadas Paha Bawah: Rp 13,000
- Sadas Paha Atas: Rp 15,000
- Sadas Dada: Rp 15,000
- Tambah Nasi: Rp 4,000

**Menu Tambahan & Extra Topping** - Sides
- Nasi Putih: Rp 4,000
- Kulit Crispy: Rp 8,000
- Kentang Crispy: Rp 8,000
- Extra Topping: Rp 3,000

## 🔒 Data Safety

- **Async Operations**: All file operations use async/await
- **Error Handling**: Comprehensive error handling throughout
- **Race Condition Prevention**: Safe read-modify-write pattern
- **Directory Creation**: Automatic directory creation if needed
- **Format Validation**: Input validation on all endpoints

## 📈 Performance Features

- **Optimized Grid Layout**: Responsive CSS Grid
- **Efficient State Management**: Single global state object
- **Debounced Updates**: Debounced re-renders
- **Lazy Loading**: On-demand content loading
- **Cached Categories**: Category data cached in memory

## 🎨 UI/UX Highlights

- **Color Scheme**: Orange accent for brand, green for actions
- **Responsive Design**: Mobile-first approach
- **Touch-Friendly**: Large buttons and tap targets
- **Visual Feedback**: Toasts for all actions
- **Modal Dialogs**: Clean, centered modals
- **Loading States**: User-friendly loading indicators

## 📝 Development Notes

- All IDs are generated using: `Math.random().toString(36).substring(2) + Date.now().toString(36)`
- Timestamps are ISO strings: `new Date().toISOString()`
- Dates are YYYY-MM-DD format: `new Date().toISOString().split('T')[0]`
- Currency formatting uses Indonesian locale
- File operations include proper error handling

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Change port by setting environment variable
set PORT=3001 && npm start  # Windows
PORT=3001 npm start         # Linux/Mac
```

**Data corruption:**
```bash
# Reset database by re-running seed
npm run seed
```

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

MIT License - Feel free to use this project for commercial purposes.

## 👥 Support

For issues or feature requests, please check the project structure and ensure all dependencies are properly installed.

---

**Created for: Kasir KAF - Modern Food Outlet POS System** 🍗
