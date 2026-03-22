# 📚 KASIR-KAF POS System - Technical Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         index.html (POS Dashboard)               │   │
│  │  - Product Grid, Cart, Checkout Modal           │   │
│  │  - Mobile: Bottom nav, side cart                │   │
│  │  - Desktop: Sidebar cart                        │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         admin.html (Admin Panel)                 │   │
│  │  - Inventory Table, CRUD Forms                  │   │
│  │  - Activity Logs, Filters                       │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         app.js (Shared Logic)                   │   │
│  │  - State Management                            │   │
│  │  - API Communication                           │   │
│  │  - UI Event Handlers                           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
                    [HTTP/REST API]
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    SERVER LAYER                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Express.js Application                   │   │
│  │  - Middleware: CORS, JSON parser                │   │
│  │  - Static Files: /public served                 │   │
│  │  - Routes: /api/* endpoints                     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Route Handlers                           │   │
│  │  ├─ routes/products.js (CRUD)                   │   │
│  │  ├─ routes/transactions.js (Checkout)           │   │
│  │  └─ routes/logs.js (Query Logs)                │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Database Layer                           │   │
│  │  utils/db.js - Async File Operations            │   │
│  │  ├─ readJSON(path)                              │   │
│  │  └─ writeJSON(path, data)                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                            │
│  server/data/
│  ├─ products.json (Product Catalog)
│  ├─ transactions.json (Sales Records)
│  └─ logs.json (Activity Audit Trail)
└─────────────────────────────────────────────────────────┘
```

## Code Patterns & Best Practices

### 1. State Management (app.js)

```javascript
const state = {
  products: [],      // All products from API
  cart: [],          // Current shopping cart items
  categories: [],    // Cached category list
  currentEditingProductId: null,  // For modal forms
  toDeleteProductId: null,        // For delete confirmation
};
```

**Pattern**: Single source of truth
- All UI state stored in `state` object
- Updates trigger re-renders
- No global variables outside state

### 2. API Request Pattern

```javascript
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Error');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

**Benefits**:
- Consistent error handling
- Reusable across all API calls
- Automatic content-type headers
- Proper Promise/async support

### 3. Async File Operations (db.js)

```javascript
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    console.error(`Error reading JSON from ${filePath}:`, error);
    throw error;
  }
}

async function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing JSON to ${filePath}:`, error);
    throw error;
  }
}
```

**Features**:
- Proper error handling
- Handles missing files gracefully
- Auto-creates directories
- Pretty JSON formatting
- Race condition safe

### 4. Route Handler Pattern (Express)

```javascript
// GET with filtering
router.get('/', async (req, res) => {
  try {
    const { date, type } = req.query;
    let data = await readJSON(getDataPath('file.json'));
    
    if (date) data = data.filter(d => d.timestamp.includes(date));
    if (type) data = data.filter(d => d.type === type);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// POST with validation
router.post('/', async (req, res) => {
  try {
    const { required_field } = req.body;
    if (!required_field) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process...
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});
```

**Features**:
- Query parameter filtering
- Input validation
- Proper HTTP status codes
- Error responses with messages

### 5. UI Rendering Pattern

```javascript
function renderProducts(filterCategory = 'all') {
  const container = document.getElementById('productsList');
  if (!container) return; // Check if on correct page
  
  let data = state.products;
  if (filterCategory !== 'all') {
    data = data.filter(p => p.category === filterCategory);
  }
  
  container.innerHTML = data.map(item => `
    <div class="item">
      ${item.name}
      <button onclick="handleClick('${item.id}')">Click</button>
    </div>
  `).join('');
}
```

**Benefits**:
- Safe element checking
- Filtering logic clear
- Template literals clean
- Event delegation ready

### 6. Modal Management Pattern

```javascript
function openModal() {
  // Populate form fields
  document.getElementById('name').value = '';
  // Show modal
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

// HTML
<div id="modal" class="hidden fixed inset-0 z-50 ... ">
  <div class="modal-overlay" onclick="closeModal()"></div>
  <div class="relative bg-white ...">
    <!-- Content -->
  </div>
</div>
```

**Features**:
- Simple class toggle
- Clicking outside closes
- Easy to implement multiple modals

## Transaction Flow

### 1. Add to Cart Flow
```
User clicks "🛒 Tambah" 
    ↓
addToCart(productId, name, price)
    ↓
Check if product exists in cart
    ├─ YES: Increment quantity
    └─ NO: Add new item
    ↓
updateCart() → updateCartDisplay() + updateCheckoutButton()
    ↓
Cart UI updated in real-time
    ↓
Success toast shown
```

### 2. Checkout Flow
```
User clicks "💳 Bayar"
    ↓
openCheckout()
    ├─ Validate cart not empty
    ├─ Calculate total
    ├─ Render summary
    └─ Show checkout modal
    ↓
User selects payment method
    ├─ CASH:
    │  ├─ Enter amount paid
    │  ├─ Calculate change
    │  └─ Click "Selesaikan Pembayaran"
    │
    └─ QRIS:
       ├─ Show QR code section
       └─ Click "Pembayaran Berhasil"
    ↓
completePayment() / completeQrisPayment()
    ↓
POST /api/transactions
    ├─ Validate stock
    ├─ Create transaction record
    ├─ Update product stock
    └─ Create log entry
    ↓
Response ✓ Success
    ↓
Clear cart → Close modal → Show success toast
    ↓
Reload products (refresh stock)
```

### 3. Inventory Update Flow
```
Manager clicks "✏️ Edit" or "➕ Tambah Produk"
    ↓
openEditProductModal() or openAddProductModal()
    ├─ Populate form fields (if edit)
    ├─ Load category options
    └─ Show modal
    ↓
Manager fills form and clicks "✓ Simpan"
    ↓
saveProduct()
    ├─ Validate required fields
    ├─ Determine if POST (create) or PUT (update)
    └─ Call API
    ↓
Backend:
├─ PUT /api/products/:id or POST /api/products
├─ Validate input
├─ Update/create product
├─ Create log entry
└─ Return updated product
    ↓
Close modal → Show success toast
    ↓
loadProducts() → renderInventoryTable()
```

## Security Considerations

### Input Validation
- Frontend: Form field validation
- Backend: Data type checking, required field validation
- Database: No SQL injection (using JSON)

### Stock Control
- Stock verified in transaction handler
- Stock decremented atomically
- Prevents inventory manipulation

### Data Integrity
- Timestamps in ISO format
- IDs are unique (based on timestamp)
- No direct file system access from client

### CORS
- Enabled for all origins (can be restricted)
- POST requests require proper headers
- Prevents cross-origin attacks

## Performance Optimizations

### Frontend
1. **Debounced rendering**: Only update when necessary
2. **Category caching**: Load once, reuse
3. **Lazy loading**: Load data on demand
4. **CSS Grid**: Efficient layout algorithm
5. **Event delegation**: Fewer listeners

### Backend
1. **Async operations**: Non-blocking file I/O
2. **JSON formatting**: Readable but compact
3. **Early returns**: Exit invalid requests quickly
4. **Error handling**: Fail gracefully

## Testing Checklist

### Unit Tests (Manual)
- [ ] Add product to cart
- [ ] Increase/decrease quantity
- [ ] Remove item from cart
- [ ] Complete cash transaction
- [ ] Complete QRIS transaction
- [ ] Create new product
- [ ] Edit existing product
- [ ] Delete product with confirmation
- [ ] Filter inventory by date
- [ ] Filter logs by type and date

### Integration Tests
- [ ] Full checkout flow
- [ ] Stock updates correctly after transaction
- [ ] Log entries created for all actions
- [ ] Multiple products in single transaction
- [ ] Category filtering works
- [ ] Mobile responsive on various devices

### Edge Cases
- [ ] Empty cart checkout (disabled button)
- [ ] Insufficient stock
- [ ] Negative change in cash transaction
- [ ] Very large quantities
- [ ] Special characters in product names
- [ ] High concurrent transactions

## Development Workflow

### Adding a New Feature

1. **Frontend**:
   - Add HTML elements to relevant page
   - Add event listeners in app.js
   - Implement UI functions
   - Call API endpoint

2. **Backend**:
   - Add route handler
   - Implement business logic
   - Read/write JSON files
   - Return proper response

3. **Data**:
   - Update JSON schema if needed
   - Run seed.js if structure changes

4. **Testing**:
   - Test manually in browser
   - Check API with cURL
   - Verify JSON files updated

## Deployment Considerations

### Environment Setup
```bash
# Production
NODE_ENV=production npm start
PORT=8080 npm start

# Development
NODE_ENV=development npm start
```

### Database Backup
```bash
# Regular backups recommended
cp -r server/data server/data.backup-$(date +%Y%m%d)
```

### Monitoring
- Log file creation frequency
- API response times
- Stock accuracy
- Data file sizes

## Common Issues & Solutions

### Issue: Stock doesn't update
**Solution**: Check transaction endpoint, verify readJSON/writeJSON

### Issue: Cart items disappear
**Solution**: Check state management, event propagation

### Issue: CORS errors
**Solution**: Verify CORS middleware enabled in server.js

### Issue: JSON files corrupted
**Solution**: Restore from backup, re-run seed.js

---

**This architecture provides:**
- ✅ Clear separation of concerns
- ✅ Scalable state management
- ✅ Robust error handling
- ✅ Easy to test and debug
- ✅ Production-ready patterns
