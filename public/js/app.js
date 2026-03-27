// Global State
const state = {
  products: [],
  cart: [],
  categories: [],
  materials: [],
  currentEditingProductId: null,
  currentEditingMaterialId: null,
  toDeleteProductId: null,
  toDeleteMaterialId: null,
  pendingTopping: null, // For topping selection
  selectedTopping: null, // Currently selected topping
  toppingOptions: [
    { name: 'Sambal', price: 3000 },
    { name: 'Kecap Manis', price: 3000 },
    { name: 'Mayonaise', price: 3000 },
    { name: 'Keju', price: 3000 },
  ],
};

// Material usage mapping by product category
// Maps category -> { material_name: quantity_to_deduct }
// For categories with different items needing different materials, 
// product-specific overrides are checked first
const MATERIAL_USAGE = {
  'Ayam Original': {
    'Kertas Ayam': 1,
    'Saos Tomat': 1,
    'Saos Sambal': 1,
    'Kresek Kecil': 1,
  },
  'Paket Nasi': {
    'Kardus Nasi': 1,
    'Kertas Nasi': 1,
    'Saos Tomat': 1,
    'Saos Sambal': 1,
    'Kresek Tanggung': 1,
  },
  'Paket Komplit': {
    'Kardus Nasi': 1,
    'Kertas Nasi': 1,
    'Saos Tomat': 1,
    'Saos Sambal': 1,
    'Teh Sosro Original 200ml': 1,
    'Kresek Tanggung': 1,
  },
  'Sadas Cemplung': {
    'Topping Sadas': 1,
    'Kertas Nasi': 1,
    'Box Kecil Sadas': 1,
    'Saos Tomat': 1,
    'Saos Sambal': 1,
    'Kresek Kecil': 1,
  },
  'Sadas Mentai': {
    'Topping Sadas': 1,
    'Kertas Nasi': 1,
    'Box Kecil Sadas': 1,
    'Saos Tomat': 1,
    'Saos Sambal': 1,
    'Kresek Kecil': 1,
  },
  'Side Dish': {
    'Kresek Kecil': 1,
  },
  'Menu Lainnya': {
    'Kardus Nasi': 1,
  },
  'Extra Topping': {
    'Cup Saos 35ml': 1,
  },
};


// Product-specific material overrides
// Use this for products that need different materials than their category default
const PRODUCT_SPECIFIC_MATERIALS = {
  'Kulit Crispy': {
    'Box Kulit': 1,
    'Saos Tomat': 1,
    'Saos Sambal': 1,
    'Kresek Kecil': 1,
  },
  'Kentang Goreng': {
    'Box Kulit': 1,
    'Saos Tomat': 1,
    'Saos Sambal': 1,
    'Kresek Kecil': 1,
  },
  'Sadas': {
    'Cup Saos 35ml': 1,
  },
  'Blackpepper': {
    'Cup Saos 35ml': 1,
  },
  'Keju': {
    'Cup Saos 35ml': 1,
  },
  'Mentai': {
    'Cup Saos 35ml': 1,
  },
  'Sambal Geprek': {
    'Cup Saos 35ml': 1,
  },
  'Nasi Putih': {
    // No materials needed for rice-only items
  },
};

const API_URL = '/api';

// ======================
// UTILITY FUNCTIONS
// ======================

/**
 * Format number to IDR currency
 */
function formatIDR(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
}

/**
 * Format date from ISO string
 */
function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Show success toast
 */
function showSuccessToast(message) {
  const toast = document.getElementById('successToast');
  const toastMsg = document.getElementById('toastMessage');
  toastMsg.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

/**
 * Show error toast
 */
function showErrorToast(message) {
  const toast = document.getElementById('errorToast');
  const errorMsg = document.getElementById('errorMessage');
  errorMsg.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 4000);
}

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
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

// ======================
// INVENTORY MANAGEMENT
// ======================

/**
 * Load products from API
 */
async function loadProducts(date = null) {
  try {
    const endpoint = date ? `/products?date=${date}` : '/products';
    console.log('[PRODUCTS] Loading products from:', endpoint);
    state.products = await apiRequest(endpoint);
    console.log('[PRODUCTS] Loaded', state.products.length, 'products');
    renderProducts();
    renderInventoryTable();
  } catch (error) {
    console.error('[PRODUCTS] Error loading products:', error);
    showErrorToast('Gagal memuat produk');
  }
}

/**
 * Load categories
 */
async function loadCategories() {
  try {
    state.categories = [
      'Ayam Original',
      'Paket Nasi',
      'Paket Komplit',
      'Extra Topping',
      'Menu Lainnya',
      'Side Dish',
      'Sadas Cemplung',
      'Sadas Mentai'
    ];

    console.log('[CATEGORIES] Loaded', state.categories.length, 'categories:', state.categories);
    console.log('[CATEGORIES] Material usage mapping available for:', Object.keys(MATERIAL_USAGE));

    // Verify all categories have material mappings
    state.categories.forEach(cat => {
      if (!MATERIAL_USAGE[cat]) {
        console.warn(`[CATEGORIES] ⚠️  Category "${cat}" has NO material usage mapping!`);
      } else {
        console.log(`[CATEGORIES] ✅ "${cat}" → ${Object.keys(MATERIAL_USAGE[cat]).join(', ')}`);
      }
    });

    // Populate category dropdown in modal
    const categorySelect = document.getElementById('productCategory');
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
      state.categories.forEach(cat => {
        categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
      });
    }

    // Render category filter buttons on index.html
    if (document.getElementById('categoryList')) {
      renderCategoryButtons();
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

/**
 * Render categories as filter buttons
 */
function renderCategoryButtons() {
  const categoryList = document.getElementById('categoryList');
  if (!categoryList) return;

  categoryList.innerHTML = state.categories.map(cat => `
    <button
      class="category-btn px-6 py-2.5 rounded-full bg-white border border-gray-200 text-gray-600 font-bold text-sm whitespace-nowrap shadow-sm transition-all hover:shadow-md hover:border-orange-300"
      data-category="${cat}"
      onclick="filterByCategory('${cat}')"
    >
      ${cat}
    </button>
  `).join('');
}

/**
 * Filter products by category
 */
function filterByCategory(category) {
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    if ((btn.dataset.category === category && category === 'all') || btn.dataset.category === category) {
      btn.className = 'category-btn px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-sm whitespace-nowrap shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5';
    } else {
      btn.className = 'category-btn px-6 py-2.5 rounded-full bg-white border border-gray-200 text-gray-600 font-bold text-sm whitespace-nowrap shadow-sm transition-all hover:shadow-md hover:border-orange-300';
    }
  });

  renderProducts(category);
}

/**
 * Render products grid
 */
function renderProducts(filterCategory = 'all') {
  const productsList = document.getElementById('productsList');
  if (!productsList) return; // Not on index page

  let filtered = state.products;
  if (filterCategory && filterCategory !== 'all') {
    filtered = state.products.filter(p => p.category === filterCategory);
  }

  productsList.innerHTML = filtered.map(product => {
    const isLowStock = product.stock < product.min_stock;
    const outOfStock = product.stock === 0;
    return `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${isLowStock ? 'bg-orange-50/50 border-orange-200' : ''} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between">
        <div class="mb-3">
          <h3 class="font-extrabold text-gray-800 text-base leading-tight mb-1 line-clamp-2">${product.name}</h3>
          <p class="text-xs text-gray-400 font-medium">${product.category}</p>
        </div>
        <div class="border-t border-gray-100 pt-3 mt-auto space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500 font-medium">Harga</span>
            <span class="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">${formatIDR(product.price)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500 font-medium">Stok</span>
            <span class="font-bold text-sm px-2 py-0.5 rounded-md ${isLowStock ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}">${product.stock}</span>
          </div>
        </div>
        <button
          class="w-full mt-4 ${outOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 shadow-md hover:shadow-lg'} text-white font-bold py-2.5 flex items-center justify-center gap-2 rounded-xl transition-all transform ${outOfStock ? '' : 'hover:-translate-y-0.5'}"
          onclick="addToCart('${product.id}', '${product.name}', ${product.price})"
          ${outOfStock ? 'disabled' : ''}
        >
          ${outOfStock ? 'Habis' : '<span>🛒</span> Tambah'}
        </button>
      </div>
    `;
  }).join('');
}

/**
 * Render inventory table
 */
function renderInventoryTable(products = null) {
  const table = document.getElementById('inventoryTable');
  if (!table) return; // Not on admin page

  const data = products || state.products;

  if (data.length === 0) {
    table.innerHTML = '<tr class="text-center"><td colspan="6" class="py-8 text-gray-500">Tidak ada data</td></tr>';
    return;
  }

  table.innerHTML = data.map(product => {
    const isLowStock = product.stock < product.min_stock;
    return `
      <tr class="${isLowStock ? 'low-stock' : ''} border-b hover:bg-gray-50 transition">
        <td class="px-4 py-3">${product.name}</td>
        <td class="px-4 py-3">${product.category}</td>
        <td class="px-4 py-3 text-right font-semibold">${formatIDR(product.price)}</td>
        <td class="px-4 py-3 text-center ${isLowStock ? 'text-orange-600 font-bold' : ''}">${product.stock}</td>
        <td class="px-4 py-3 text-center">${product.min_stock}</td>
        <td class="px-4 py-3 text-center">
          <div class="flex gap-2 justify-center">
            <button
              onclick="openEditProductModal('${product.id}')"
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
            >
              ✏️ Edit
            </button>
            <button
              onclick="openDeleteModal('${product.id}')"
              class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Open add product modal
 */
function openAddProductModal() {
  state.currentEditingProductId = null;
  document.getElementById('productModalTitle').textContent = 'Tambah Produk';
  document.getElementById('productName').value = '';
  document.getElementById('productCategory').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productStock').value = '';
  document.getElementById('productMinStock').value = '5';
  document.getElementById('productModal').classList.remove('hidden');
}

/**
 * Open edit product modal
 */
async function openEditProductModal(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  state.currentEditingProductId = productId;
  document.getElementById('productModalTitle').textContent = 'Edit Produk';
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productStock').value = product.stock;
  document.getElementById('productMinStock').value = product.min_stock;
  document.getElementById('productModal').classList.remove('hidden');
}

/**
 * Save product (create or update)
 */
async function saveProduct() {
  try {
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = parseInt(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const min_stock = parseInt(document.getElementById('productMinStock').value);

    if (!name || !category || !price || stock === undefined) {
      showErrorToast('Isi semua field yang diperlukan');
      return;
    }

    const data = { name, category, price, stock, min_stock };

    if (state.currentEditingProductId) {
      // Update
      await apiRequest(`/products/${state.currentEditingProductId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      showSuccessToast('Produk diperbarui');
    } else {
      // Create
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showSuccessToast('Produk ditambahkan');
    }

    closeProductModal();
    await loadProducts();
    await renderInventoryTable();
  } catch (error) {
    showErrorToast(error.message || 'Gagal menyimpan produk');
  }
}

/**
 * Open delete modal
 */
function openDeleteModal(productId) {
  state.toDeleteProductId = productId;
  document.getElementById('deleteModal').classList.remove('hidden');
}

/**
 * Confirm delete
 */
async function confirmDelete() {
  try {
    await apiRequest(`/products/${state.toDeleteProductId}`, {
      method: 'DELETE',
    });
    showSuccessToast('Produk dihapus');
    closeDeleteModal();
    await loadProducts();
    await renderInventoryTable();
  } catch (error) {
    showErrorToast(error.message || 'Gagal menghapus produk');
  }
}

/**
 * Close product modal
 */
function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
  state.toDeleteProductId = null;
  document.getElementById('deleteModal').classList.add('hidden');
}

/**
 * Filter inventory by date
 */
async function filterInventory() {
  const date = document.getElementById('inventoryDate').value;
  if (!date) {
    showErrorToast('Pilih tanggal');
    return;
  }
  await loadProducts(date);
  renderInventoryTable();
}

// ======================
// CART MANAGEMENT
// ======================

/**
 * Add item to cart
 */
function addToCart(productId, name, price) {
  const product = state.products.find(p => p.id === productId);
  if (!product || product.stock === 0) {
    showErrorToast('Produk tidak tersedia');
    return;
  }

  // Check if this is the "Extra Topping" item
  if (name === 'Extra Topping') {
    // Open topping selection modal
    state.pendingTopping = {
      product_id: productId,
      name,
      price,
    };
    openToppingModal();
    return;
  }

  const existingItem = state.cart.find(item => item.product_id === productId);

  if (existingItem) {
    if (existingItem.qty < product.stock) {
      existingItem.qty++;
    } else {
      showErrorToast('Stok tidak cukup');
      return;
    }
  } else {
    state.cart.push({
      product_id: productId,
      name,
      price,
      qty: 1,
    });
  }

  updateCart();
  showSuccessToast(`${name} ditambahkan ke keranjang`);
}

/**
 * Update cart display
 */
function updateCart() {
  updateCartDisplay();
  updateCheckoutButton();
}

/**
 * Update cart display on both desktop and mobile
 */
function updateCartDisplay() {
  const total = calculateCartTotal();

  // Desktop cart
  const cartItems = document.getElementById('cartItems');
  if (cartItems) {
    cartItems.innerHTML = state.cart.length === 0
      ? '<p class="text-center text-gray-500 py-8">Keranjang kosong</p>'
      : state.cart.map((item, index) => `
        <div class="cart-item bg-white border border-gray-100 shadow-sm rounded-xl p-4 mb-3 transition-all hover:shadow-md">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold text-gray-800 text-sm">${item.name}</h4>
            <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors">✕</button>
          </div>
          <div class="flex justify-between items-center mb-3">
            <span class="text-sm font-medium text-gray-500">${formatIDR(item.price)}</span>
            <span class="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">Qty: ${item.qty}</span>
          </div>
          <div class="flex gap-2 items-center justify-between border-t border-gray-50 pt-3">
            <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button onclick="decreaseQty(${index})" class="bg-white hover:bg-gray-50 shadow-sm px-3 py-1 rounded-md text-sm font-bold transition">−</button>
              <button onclick="increaseQty(${index})" class="bg-white hover:bg-gray-50 shadow-sm px-3 py-1 rounded-md text-sm font-bold transition">+</button>
            </div>
            <span class="font-bold text-base text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">${formatIDR(item.price * item.qty)}</span>
          </div>
        </div>
      `).join('');
    document.getElementById('cartTotal').textContent = formatIDR(total);
  }

  // Mobile cart
  const mobileCartItems = document.getElementById('mobileCartItems');
  if (mobileCartItems) {
    mobileCartItems.innerHTML = state.cart.length === 0
      ? '<p class="text-center text-gray-500 py-8">Keranjang kosong</p>'
      : state.cart.map((item, index) => `
        <div class="cart-item bg-white border border-gray-100 shadow-sm rounded-xl p-4 mb-3 transition-all hover:shadow-md">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold text-gray-800 text-sm">${item.name}</h4>
            <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors">✕</button>
          </div>
          <div class="flex justify-between items-center mb-3">
            <span class="text-sm font-medium text-gray-500">${formatIDR(item.price)}</span>
            <span class="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">Qty: ${item.qty}</span>
          </div>
          <div class="flex gap-2 items-center justify-between border-t border-gray-50 pt-3">
            <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button onclick="decreaseQty(${index})" class="bg-white hover:bg-gray-50 shadow-sm px-3 py-1 rounded-md text-sm font-bold transition">−</button>
              <button onclick="increaseQty(${index})" class="bg-white hover:bg-gray-50 shadow-sm px-3 py-1 rounded-md text-sm font-bold transition">+</button>
            </div>
            <span class="font-bold text-base text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">${formatIDR(item.price * item.qty)}</span>
          </div>
        </div>
      `).join('');
    document.getElementById('mobileCartTotal').textContent = formatIDR(total);
  }

  // Update badge
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = state.cart.reduce((sum, item) => sum + item.qty, 0);
  }
}

/**
 * Calculate cart total
 */
function calculateCartTotal() {
  return state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/**
 * Remove item from cart
 */
function removeFromCart(index) {
  state.cart.splice(index, 1);
  updateCart();
}

/**
 * Increase quantity
 */
function increaseQty(index) {
  const item = state.cart[index];
  const product = state.products.find(p => p.id === item.product_id);
  if (product && item.qty < product.stock) {
    item.qty++;
    updateCart();
  } else {
    showErrorToast('Stok tidak cukup');
  }
}

/**
 * Decrease quantity
 */
function decreaseQty(index) {
  const item = state.cart[index];
  if (item.qty > 1) {
    item.qty--;
    updateCart();
  }
}

/**
 * Clear cart
 */
function clearCart() {
  if (state.cart.length === 0) return;
  if (confirm('Kosongkan keranjang?')) {
    state.cart = [];
    updateCart();
    showSuccessToast('Keranjang dikosongkan');
  }
}

/**
 * Update checkout button state
 */
function updateCheckoutButton() {
  const btn = document.getElementById('checkoutBtn');
  const mobileBtn = document.getElementById('mobileCheckoutBtn');
  if (btn) btn.disabled = state.cart.length === 0;
  if (mobileBtn) mobileBtn.disabled = state.cart.length === 0;
}

// ======================
// CHECKOUT
// ======================

/**
 * Open checkout modal
 */
function openCheckout() {
  if (state.cart.length === 0) {
    showErrorToast('Keranjang kosong');
    return;
  }

  const total = calculateCartTotal();
  document.getElementById('checkoutModal').classList.remove('hidden');
  renderCheckoutSummary();
  document.getElementById('checkoutTotal').textContent = formatIDR(total);
  document.getElementById('amountPaid').value = total;

  // Show QRIS section if selected
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  if (paymentMethod === 'QRIS') {
    showQrisSection();
  } else {
    showCashSection();
  }

  calculateChange();
  closeMobileCart();
}

/**
 * Render checkout summary
 */
function renderCheckoutSummary() {
  const summary = document.getElementById('checkoutSummary');
  summary.innerHTML = state.cart.map((item, i) => `
    <div class="flex justify-between text-gray-700">
      <span>${i + 1}. ${item.name} (${item.qty}x)</span>
      <span>${formatIDR(item.price * item.qty)}</span>
    </div>
  `).join('');
}

/**
 * Handle payment method change
 */
function handlePaymentMethodChange() {
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  if (['QRIS', 'GOJEK', 'GRAB', 'SHOPEE'].includes(method)) {
    showQrisSection(method);
  } else {
    showCashSection();
  }
}

/**
 * Show cash input section
 */
function showCashSection() {
  document.getElementById('cashSection').classList.remove('hidden');
  document.getElementById('qrisSection').classList.add('hidden');
  document.getElementById('completePaymentBtn').textContent = '✓ Selesaikan Pembayaran';
}

/**
 * Show QRIS/Digital payment section
 */
function showQrisSection(method = null) {
  document.getElementById('cashSection').classList.add('hidden');
  document.getElementById('qrisSection').classList.remove('hidden');
  const total = calculateCartTotal();
  document.getElementById('qrisAmount').textContent = total.toLocaleString('id-ID');

  // Update button text based on payment method
  const methName = method || document.querySelector('input[name="paymentMethod"]:checked').value;
  const buttonText = methName === 'QRIS'
    ? '✓ Scan QR Code'
    : `✓ Scan ${methName}`;
  document.getElementById('completePaymentBtn').textContent = buttonText;
}

/**
 * Calculate change
 */
function calculateChange() {
  const total = calculateCartTotal();
  const amountPaid = parseInt(document.getElementById('amountPaid').value) || 0;
  const change = amountPaid - total;

  const changeDisplay = document.getElementById('changeDisplay');
  if (changeDisplay) {
    if (change >= 0) {
      changeDisplay.textContent = formatIDR(change);
      changeDisplay.classList.remove('text-red-600');
      changeDisplay.classList.add('text-blue-600');
    } else {
      changeDisplay.textContent = formatIDR(Math.abs(change));
      changeDisplay.classList.remove('text-blue-600');
      changeDisplay.classList.add('text-red-600');
    }
  }
}

/**
 * Complete payment (for CASH and button clicks)
 */
async function completePayment() {
  try {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const total = calculateCartTotal();

    if (paymentMethod === 'CASH') {
      const amountPaid = parseInt(document.getElementById('amountPaid').value);
      if (amountPaid < total) {
        showErrorToast('Jumlah pembayaran tidak cukup');
        return;
      }

      const change = amountPaid - total;
      await createTransaction(paymentMethod, amountPaid, change);
    } else if (['QRIS', 'GOJEK', 'GRAB', 'SHOPEE'].includes(paymentMethod)) {
      // Forward to digital payment handler
      await completeQrisPayment();
    }
  } catch (error) {
    showErrorToast(error.message || 'Pembayaran gagal');
  }
}

/**
 * Complete QRIS payment
 */
/**
 * Complete QRIS/Digital payment (Gojek, Grab, Shopee)
 */
async function completeQrisPayment() {
  try {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const total = calculateCartTotal();

    // Handle any digital payment method
    if (['QRIS', 'GOJEK', 'GRAB', 'SHOPEE'].includes(paymentMethod)) {
      await createTransaction(paymentMethod, total, 0);
    } else {
      showErrorToast('Pilih metode pembayaran digital');
    }
  } catch (error) {
    showErrorToast(error.message || 'Pembayaran gagal');
  }
}

/**
 * Create transaction
 */
async function createTransaction(paymentMethod, amountPaid, change) {
  try {
    const total = calculateCartTotal();

    const transactionData = {
      items: state.cart.map(item => ({
        product_id: item.product_id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      })),
      total,
      payment_method: paymentMethod,
      amount_paid: amountPaid,
      change,
    };

    console.log('[TRANSACTION] Creating transaction with data:', transactionData);
    await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
    console.log('[TRANSACTION] ✅ Transaction created successfully');

    // Deduct materials based on purchased items
    console.log('[TRANSACTION] Starting material deduction process for cart items...');
    await deductMaterials(state.cart);

    // Clear state
    state.cart = [];
    updateCart();
    closeCheckout();
    showSuccessToast('✓ Transaksi berhasil! Terima kasih.');

    // Reload products to update stock
    console.log('[TRANSACTION] Reloading products to update stock...');
    await loadProducts();

    // Reload materials if on admin page
    if (state.materials.length > 0) {
      console.log('[TRANSACTION] Reloading materials to update inventory...');
      await loadMaterials();
    }
    console.log('[TRANSACTION] ✅ All operations completed successfully\n');
  } catch (error) {
    showErrorToast(error.message || 'Transaksi gagal');
  }
}

/**
 * Deduct materials based on sold items
 */
async function deductMaterials(cartItems) {
  try {
    console.log('\n========== MATERIAL DEDUCTION PROCESS START ==========');
    console.log('[DEDUCTION] Cart items to process:', cartItems);
    console.log(`[DEDUCTION] ℹ️  Total materials loaded in state: ${state.materials.length}`);

    // DEBUG: Show all loaded materials
    if (state.materials.length === 0) {
      console.error('[DEDUCTION] ❌ CRITICAL: No materials loaded in state.materials!');
      console.error('[DEDUCTION] Materials should have been loaded on page initialization');
      console.error('[DEDUCTION] Check browser console for [MATERIALS] logs above');
      return;
    }

    console.log('[DEDUCTION] Materials currently in memory:');
    state.materials.forEach((m, idx) => {
      console.log(`  [${idx + 1}] "${m.name}" (ID: ${m.id}, Stock: ${m.stock}, Unit: ${m.unit})`);
    });

    // Get product list with categories
    const productsMap = {};
    state.products.forEach(p => {
      productsMap[p.id] = p;
    });
    console.log('[DEDUCTION] Products map created with', Object.keys(productsMap).length, 'products');

    // Collect all materials to deduct
    const materialsToDeduct = {};
    console.log('[DEDUCTION] CATEGORY MATERIAL USAGE MAPPING:', MATERIAL_USAGE);
    console.log('[DEDUCTION] PRODUCT-SPECIFIC MATERIAL MAPPING:', PRODUCT_SPECIFIC_MATERIALS);

    for (const cartItem of cartItems) {
      const product = productsMap[cartItem.product_id];
      if (!product) {
        console.warn('[DEDUCTION] ⚠️  Product not found in map:', cartItem.product_id);
        continue;
      }

      console.log(`\n[DEDUCTION] Processing cart item: "${cartItem.name}" (${cartItem.qty}x)`);
      console.log(`[DEDUCTION]   Product ID: ${product.id}`);
      console.log(`[DEDUCTION]   Category: "${product.category}"`);

      // Check if product has specific material mapping first
      let materialUsage = PRODUCT_SPECIFIC_MATERIALS[product.name];

      if (materialUsage) {
        console.log(`[DEDUCTION]   ✅ Using PRODUCT-SPECIFIC materials for "${product.name}"`);
      } else {
        // Fall back to category-based mapping
        materialUsage = MATERIAL_USAGE[product.category];
        if (materialUsage) {
          console.log(`[DEDUCTION]   ℹ️  Using CATEGORY-BASED materials for category "${product.category}"`);
        }
      }

      if (!materialUsage) {
        console.warn(`[DEDUCTION] ⚠️  No material usage mapping found for product "${product.name}" or category "${product.category}"`);
        console.warn(`[DEDUCTION]   Available categories:`, Object.keys(MATERIAL_USAGE));
        console.warn(`[DEDUCTION]   Available product-specific mappings:`, Object.keys(PRODUCT_SPECIFIC_MATERIALS));
        continue;
      }

      console.log(`[DEDUCTION]   Material usage for this product:`, materialUsage);

      // For each material required by this product, multiply qty by item quantity in cart
      for (const [materialName, baseQty] of Object.entries(materialUsage)) {
        if (baseQty === 0) {
          console.log(`[DEDUCTION]   → ${materialName}: SKIPPED (qty=0)`);
          continue;
        }
        const totalQtyNeeded = baseQty * cartItem.qty;
        materialsToDeduct[materialName] = (materialsToDeduct[materialName] || 0) + totalQtyNeeded;
        console.log(`[DEDUCTION]   → ${materialName}: ${baseQty} × ${cartItem.qty} = ${totalQtyNeeded} unit(s)`);
      }
    }

    console.log('\n[DEDUCTION] TOTAL MATERIALS TO DEDUCT:', materialsToDeduct);
    console.log('[DEDUCTION] Materials required by names:');
    Object.keys(materialsToDeduct).forEach(name => {
      console.log(`  - "${name}"`);
    });

    // Deduct each material from inventory
    const deductedCount = 0;
    for (const [materialName, qtyToDeduct] of Object.entries(materialsToDeduct)) {
      if (qtyToDeduct === 0) {
        console.log(`\n[DEDUCTION] Skipping deduction for: "${materialName}" (qty=0)`);
        continue;
      }

      // Find material with EXACT name match (case-sensitive)
      const material = state.materials.find(m => m.name === materialName);

      if (!material) {
        console.error(`\n[DEDUCTION] ❌ MATERIAL NOT FOUND: "${materialName}"`);
        console.error(`[DEDUCTION] Searched for exact match in ${state.materials.length} materials`);
        console.error(`[DEDUCTION] Available material names:`);
        state.materials.forEach(m => {
          const match = m.name === materialName ? '✓ MATCH' : '';
          console.error(`  - "${m.name}" ${match}`);
        });
        continue;
      }

      console.log(`\n[DEDUCTION] Deducting: "${materialName}"`);
      console.log(`[DEDUCTION]   Material ID: ${material.id}`);
      console.log(`[DEDUCTION]   Stock before: ${material.stock}`);
      console.log(`[DEDUCTION]   Quantity to deduct: ${qtyToDeduct}`);
      console.log(`[DEDUCTION]   Expected stock after: ${material.stock - qtyToDeduct}`);

      // Call deduction API endpoint
      const response = await apiRequest(`/materials/${material.id}/deduct`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: qtyToDeduct }),
      });

      console.log(`[DEDUCTION] ✅ Deduction successful for "${materialName}"`);
      console.log(`[DEDUCTION]   API response:`, response);
    }

    console.log('\n========== MATERIAL DEDUCTION PROCESS COMPLETE ==========\n');
  } catch (error) {
    console.error('[DEDUCTION] ❌ Error deducting materials:', error);
    console.error('[DEDUCTION] Error stack:', error.stack);
    // Don't throw error here - transaction was successful, material deduction is secondary
  }
}

/**
 * Close checkout modal
 */
function closeCheckout() {
  document.getElementById('checkoutModal').classList.add('hidden');
}

/**
 * Close mobile cart modal
 */
function closeMobileCart() {
  document.getElementById('mobileCartModal').classList.add('hidden');
}

// ======================
// TOPPING SELECTION
// ======================

/**
 * Open topping selection modal
 */
function openToppingModal() {
  const toppingOptions = document.getElementById('toppingOptions');
  state.selectedTopping = null;

  toppingOptions.innerHTML = state.toppingOptions.map((topping, index) => `
    <label class="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50 transition"
           onclick="selectTopping('${topping.name}', ${topping.price}, this)">
      <input type="radio" name="topping" value="${topping.name}" class="w-4 h-4">
      <span class="ml-3 flex-1 font-semibold">${topping.name}</span>
      <span class="text-orange-600 font-bold">${formatIDR(topping.price)}</span>
    </label>
  `).join('');

  document.getElementById('toppingModal').classList.remove('hidden');
}

/**
 * Select a topping
 */
function selectTopping(toppingName, toppingPrice, labelElement) {
  state.selectedTopping = {
    name: toppingName,
    price: toppingPrice,
  };

  // Update UI to show selection
  document.querySelectorAll('#toppingOptions label').forEach(label => {
    label.classList.remove('border-orange-600', 'bg-orange-50');
    label.classList.add('border-gray-200');
  });

  labelElement.classList.add('border-orange-600', 'bg-orange-50');
  labelElement.classList.remove('border-gray-200');
}

/**
 * Confirm topping selection and add to cart
 */
function confirmTopping() {
  if (!state.selectedTopping) {
    showErrorToast('Pilih topping terlebih dahulu');
    return;
  }

  const topping = state.pendingTopping;
  // Create a unique product name with topping selection
  const itemName = `${topping.name} (${state.selectedTopping.name})`;
  const totalPrice = topping.price + state.selectedTopping.price;

  const existingItem = state.cart.find(item =>
    item.product_id === topping.product_id &&
    item.selectedTopping === state.selectedTopping.name
  );

  if (existingItem) {
    const product = state.products.find(p => p.id === topping.product_id);
    if (existingItem.qty < product.stock) {
      existingItem.qty++;
    } else {
      showErrorToast('Stok tidak cukup');
      return;
    }
  } else {
    state.cart.push({
      product_id: topping.product_id,
      name: itemName,
      basePrice: topping.price,
      selectedTopping: state.selectedTopping.name,
      toppingPrice: state.selectedTopping.price,
      price: totalPrice,
      qty: 1,
    });
  }

  updateCart();
  closeToppingModal();
  showSuccessToast(`${itemName} ditambahkan ke keranjang`);
}

/**
 * Close topping modal
 */
function closeToppingModal() {
  state.pendingTopping = null;
  state.selectedTopping = null;
  document.getElementById('toppingModal').classList.add('hidden');
}

// ======================
// HISTORY / LOGS
// ======================

/**
 * Load history logs
 */
async function loadLogs(type = null, date = null) {
  try {
    let endpoint = '/logs';
    const params = new URLSearchParams();

    if (type) params.append('type', type);
    if (date) params.append('date', date);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const logs = await apiRequest(endpoint);
    renderHistoryTable(logs);
  } catch (error) {
    showErrorToast('Gagal memuat riwayat');
  }
}

/**
 * Render history table
 */
function renderHistoryTable(logs) {
  const table = document.getElementById('historyTable');
  if (!table) return;

  if (logs.length === 0) {
    table.innerHTML = '<tr class="text-center"><td colspan="4" class="py-8 text-gray-500">Tidak ada data</td></tr>';
    return;
  }

  table.innerHTML = logs.map(log => {
    const typeIcon = log.type === 'inventory' ? '📦' : '💳';
    const actionText = {
      create: 'Buat',
      update: 'Perbarui',
      delete: 'Hapus',
      checkout: 'Checkout',
    };

    return `
      <tr class="border-b hover:bg-gray-50 transition">
        <td class="px-4 py-3">${typeIcon} ${log.type === 'inventory' ? 'Inventori' : 'Transaksi'}</td>
        <td class="px-4 py-3">${actionText[log.action] || log.action}</td>
        <td class="px-4 py-3">${log.message}</td>
        <td class="px-4 py-3 text-xs text-gray-500">${formatDate(log.timestamp)}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Filter logs
 */
async function filterLogs() {
  const type = document.getElementById('logType').value || null;
  const date = document.getElementById('logDate').value || null;
  await loadLogs(type, date);
}

// ======================
// MATERIALS MANAGEMENT
// ======================

// Add materials to state
state.materials = [];
state.currentEditingMaterialId = null;
state.toDeleteMaterialId = null;

/**
 * Load materials from API
 */
async function loadMaterials(date = null) {
  try {
    const endpoint = date ? `/materials?date=${date}` : '/materials';
    console.log('[MATERIALS] Loading materials from:', endpoint);
    state.materials = await apiRequest(endpoint);
    console.log('[MATERIALS] ✅ Successfully loaded', state.materials.length, 'materials');
    console.log('[MATERIALS] Materials loaded in state:');
    state.materials.forEach((m, idx) => {
      console.log(`  [${idx + 1}] ID="${m.id}" Name="${m.name}" Category="${m.category}" Stock=${m.stock} Unit="${m.unit}"`);
    });
    console.log('[MATERIALS] Materials are now ready for transactions');
    renderMaterialsTable();
  } catch (error) {
    console.error('[MATERIALS] ❌ Error loading materials:', error);
    console.error('[MATERIALS] Response:', error.response);
    showErrorToast('Gagal memuat bahan');
  }
}

/**
 * Render materials table
 */
function renderMaterialsTable(materials = null) {
  const table = document.getElementById('materialsTable');
  if (!table) return; // Not on admin page

  const data = materials || state.materials;

  if (data.length === 0) {
    table.innerHTML = '<tr class="text-center"><td colspan="6" class="py-8 text-gray-500">Tidak ada data</td></tr>';
    return;
  }

  table.innerHTML = data.map(material => {
    const isLowStock = material.stock < material.min_stock;
    return `
      <tr class="${isLowStock ? 'low-stock' : ''} border-b hover:bg-gray-50 transition">
        <td class="px-4 py-3">${material.name}</td>
        <td class="px-4 py-3">${material.category}</td>
        <td class="px-4 py-3 text-center">${material.unit}</td>
        <td class="px-4 py-3 text-center ${isLowStock ? 'text-orange-600 font-bold' : ''}">${material.stock}</td>
        <td class="px-4 py-3 text-center">${material.min_stock}</td>
        <td class="px-4 py-3 text-center">
          <div class="flex gap-2 justify-center">
            <button
              onclick="openEditMaterialModal('${material.id}')"
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
            >
              ✏️ Edit
            </button>
            <button
              onclick="openDeleteMaterialModal('${material.id}')"
              class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Open add material modal
 */
function openAddMaterialModal() {
  state.currentEditingMaterialId = null;
  document.getElementById('materialModalTitle').textContent = 'Tambah Bahan';
  document.getElementById('materialId').value = '';
  document.getElementById('materialName').value = '';
  document.getElementById('materialCategory').value = '';
  document.getElementById('materialUnit').value = '';
  document.getElementById('materialStock').value = '0';
  document.getElementById('materialMinStock').value = '10';
  document.getElementById('materialModal').classList.remove('hidden');
}

/**
 * Open edit material modal
 */
async function openEditMaterialModal(materialId) {
  const material = state.materials.find(m => m.id === materialId);
  if (!material) return;

  state.currentEditingMaterialId = materialId;
  document.getElementById('materialModalTitle').textContent = 'Edit Bahan';
  document.getElementById('materialId').value = material.id;
  document.getElementById('materialName').value = material.name;
  document.getElementById('materialCategory').value = material.category;
  document.getElementById('materialUnit').value = material.unit;
  document.getElementById('materialStock').value = material.stock;
  document.getElementById('materialMinStock').value = material.min_stock;
  document.getElementById('materialModal').classList.remove('hidden');
}

/**
 * Save material (create or update)
 */
async function saveMaterial() {
  try {
    const name = document.getElementById('materialName').value.trim();
    const category = document.getElementById('materialCategory').value;
    const unit = document.getElementById('materialUnit').value;
    const stock = parseInt(document.getElementById('materialStock').value);
    const min_stock = parseInt(document.getElementById('materialMinStock').value);

    if (!name || !category || !unit || stock === undefined) {
      console.warn('[MATERIALS] Save failed: Missing required fields');
      showErrorToast('Isi semua field yang diperlukan');
      return;
    }

    const data = { name, category, unit, stock, min_stock };

    if (state.currentEditingMaterialId) {
      // Update
      console.log('[MATERIALS] Updating material:', state.currentEditingMaterialId, data);
      await apiRequest(`/materials/${state.currentEditingMaterialId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      console.log('[MATERIALS] Material updated successfully');
      showSuccessToast('Bahan diperbarui');
    } else {
      // Create
      console.log('[MATERIALS] Creating new material:', data);
      await apiRequest('/materials', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('[MATERIALS] Material created successfully');
      showSuccessToast('Bahan ditambahkan');
    }

    closeMaterialModal();
    await loadMaterials();
  } catch (error) {
    console.error('[MATERIALS] Error saving material:', error);
    showErrorToast(error.message || 'Gagal menyimpan bahan');
  }
}

/**
 * Open delete material modal
 */
function openDeleteMaterialModal(materialId) {
  state.toDeleteMaterialId = materialId;
  document.getElementById('deleteMaterialModal').classList.remove('hidden');
}

/**
 * Close material modal
 */
function closeMaterialModal() {
  document.getElementById('materialModal').classList.add('hidden');
}

/**
 * Close delete material modal
 */
function closeDeleteMaterialModal() {
  state.toDeleteMaterialId = null;
  document.getElementById('deleteMaterialModal').classList.add('hidden');
}

/**
 * Confirm delete material
 */
async function confirmDeleteMaterial() {
  try {
    await apiRequest(`/materials/${state.toDeleteMaterialId}`, {
      method: 'DELETE',
    });
    showSuccessToast('Bahan dihapus');
    closeDeleteMaterialModal();
    await loadMaterials();
  } catch (error) {
    showErrorToast(error.message || 'Gagal menghapus bahan');
  }
}

/**
 * Filter materials by date
 */
async function filterMaterials() {
  const date = document.getElementById('materialsDate').value;
  if (!date) {
    showErrorToast('Pilih tanggal');
    return;
  }
  await loadMaterials(date);
  renderMaterialsTable();
}

// ======================
// ADMIN PANEL
// ======================

/**
 * Switch tab on admin page
 */
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('[id$="Tab"]').forEach(tab => {
    tab.classList.add('hidden');
  });

  // Deactivate all buttons
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  const tab = document.getElementById(`${tabName}Tab`);
  if (tab) {
    tab.classList.remove('hidden');
  }

  // Activate button
  const btn = document.querySelector(`[data-tab="${tabName}"]`);
  if (btn) {
    btn.classList.add('active');
  }

  // Load data if needed
  if (tabName === 'inventory') {
    loadProducts();
  } else if (tabName === 'history') {
    loadLogs();
  } else if (tabName === 'finance') {
    loadFinanceSummary();
    loadExpenses();
  }
}

// ======================
// EVENT LISTENERS
// ======================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('\n========== KASIR-KAF POS SYSTEM STARTING ==========');
  console.log('🚀 Initializing application...');
  // Load initial data
  await loadCategories();
  await loadProducts();
  console.log('[INIT] ✅ Products loaded, waiting for materials...');
  await loadMaterials(); // Load materials for both sales page (deduction) and admin page (management)

  // Verify materials loaded successfully
  if (state.materials.length === 0) {
    console.error('[INIT] ❌ CRITICAL: Materials failed to load! Check network tab in DevTools');
    console.error('[INIT] state.materials is empty - material deduction will not work');
  } else {
    console.log(`[INIT] ✅ All systems ready: ${state.products.length} products, ${state.materials.length} materials loaded`);
  }

  // Check if on admin page
  if (document.getElementById('inventoryTab')) {

    // Check URL for tab parameter
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'inventory';
    switchTab(tab);
    
    // Load settings from active JSON config
    loadSettings();
  }

  // Cart buttons
  const checkoutBtn = document.getElementById('checkoutBtn');
  const mobileCheckoutBtn = document.getElementById('mobileCheckoutBtn');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const mobileClearCartBtn = document.getElementById('mobileClearCartBtn');
  const mobileCartBtn = document.getElementById('mobileCartBtn');
  const completePaymentBtn = document.getElementById('completePaymentBtn');

  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
  if (mobileCheckoutBtn) mobileCheckoutBtn.addEventListener('click', openCheckout);
  if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
  if (mobileClearCartBtn) mobileClearCartBtn.addEventListener('click', clearCart);
  if (mobileCartBtn) mobileCartBtn.addEventListener('click', () => document.getElementById('mobileCartModal').classList.remove('hidden'));
  if (completePaymentBtn) completePaymentBtn.addEventListener('click', completePayment);

  // Payment method change
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', handlePaymentMethodChange);
  });

  // Amount paid input
  const amountPaidInput = document.getElementById('amountPaid');
  if (amountPaidInput) {
    amountPaidInput.addEventListener('input', calculateChange);
  }

  // Set today's date as default in filters
  const today = new Date().toISOString().split('T')[0];
  const inventoryDateInput = document.getElementById('inventoryDate');
  const logDateInput = document.getElementById('logDate');
  const materialsDateInput = document.getElementById('materialsDate');
  if (inventoryDateInput) inventoryDateInput.value = today;
  if (logDateInput) logDateInput.value = today;
  if (materialsDateInput) materialsDateInput.value = today;

  // Initial cart update
  updateCheckoutButton();

  console.log('========== KASIR-KAF POS SYSTEM READY ==========');
  console.log('ℹ️  Open DevTools Console (F12) to view debug logs for transactions and material deductions\\n');
});

// ======================
// SETTINGS LOGIC
// ======================
async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        const rTime = document.getElementById('resetTime');
        const aReset = document.getElementById('autoResetStock');
        if (rTime) rTime.value = data.resetTime || '00:00';
        if (aReset) aReset.checked = data.autoResetStock || false;
    } catch(e) { console.error('Failed fetching settings', e); }
}

async function saveSettings() {
    try {
        const rTime = document.getElementById('resetTime').value || '00:00';
        const aReset = document.getElementById('autoResetStock').checked;
        await fetch('/api/settings', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ resetTime: rTime, autoResetStock: aReset })
        });
        showSuccessToast('Pengaturan autopilot sistem berhasil disimpan!');
    } catch(e) {
        showErrorToast('Gagal menyimpan pengaturan.');
    }
}

async function forceResetStock() {
    if (!confirm('AWAS! Memaksa reset berarti stok PRODUK/MENU Anda saat ini akan seketika kembali ke 0. Stok Bahan tidak akan terpengaruh. Lanjutkan?')) return;
    try {
        await fetch('/api/settings/reset-stock', { method: 'POST' });
        showSuccessToast('Stok Produk berhasil dikosongkan menjadi 0!');
        await loadProducts(); 
    } catch (e) {
        showErrorToast('Gagal mengosongkan stok.');
    }
}

async function clearAllHistory() {
    if (!confirm('PERINGATAN KERAS! Anda akan menghapus secara PERMANEN semua data Riwayat Transaksi Penjualan dan Logs. Tindakan ini TIDAK BISA dibatalkan. Lanjutkan?')) return;
    try {
        await fetch('/api/settings/clear-history', { method: 'POST' });
        showSuccessToast('Semua Riwayat Log berhasil dihapus permanen!');
        document.getElementById('logsList').innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>';
        const logsTotal = document.getElementById('logsTotal');
        if (logsTotal) logsTotal.textContent = 'Rp0';
    } catch (e) {
        showErrorToast('Gagal menghapus riwayat.');
    }
}

// ======================
// FINANCE & EXPENSE MANAGEMENT
// ======================

function toggleFinanceFilter() {
    const type = document.getElementById('financeFilterType').value;
    if (type === 'month') {
        document.getElementById('financeMonth').classList.remove('hidden');
        document.getElementById('financeDate').classList.add('hidden');
    } else {
        document.getElementById('financeMonth').classList.add('hidden');
        document.getElementById('financeDate').classList.remove('hidden');
    }
}

async function loadFinanceSummary() {
    const type = document.getElementById('financeFilterType').value;
    const dateVal = document.getElementById('financeDate').value;
    const monthVal = document.getElementById('financeMonth').value;
    
    let query = '';
    if (type === 'month' && monthVal) {
        query = `?month=${monthVal}`;
    } else if (type === 'date' && dateVal) {
        query = `?date=${dateVal}`;
    }

    try {
        const data = await apiRequest('/finance/summary' + query);
        const finIncomeEle = document.getElementById('finIncome');
        if (finIncomeEle) finIncomeEle.textContent = formatIDR(data.totalIncome);
        const finExpEle = document.getElementById('finExpense');
        if (finExpEle) finExpEle.textContent = formatIDR(data.totalExpense);
        const finSalEle = document.getElementById('finSalary');
        if (finSalEle) finSalEle.textContent = formatIDR(data.totalSalary);
        const finProfEle = document.getElementById('finProfit');
        if (finProfEle) finProfEle.textContent = formatIDR(data.profit);
        
        const att1 = document.getElementById('attStaff1');
        if (att1) att1.textContent = data.staff1Attendance;
        const att2 = document.getElementById('attStaff2');
        if (att2) att2.textContent = data.staff2Attendance;
        
        // Render attendance table
        const tbodyAtt = document.getElementById('attendanceTable');
        if (tbodyAtt) {
            if (!data.attendanceList || data.attendanceList.length === 0) {
                tbodyAtt.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-gray-500">Belum ada absen...</td></tr>';
            } else {
                tbodyAtt.innerHTML = data.attendanceList.sort((a,b)=> new Date(b.loginTime) - new Date(a.loginTime)).map(att => `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">${att.employeeId}</td>
                        <td class="px-4 py-3 text-center">${att.date}</td>
                        <td class="px-4 py-3 text-right">${new Date(att.loginTime).toLocaleTimeString('id-ID')}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Failed to load summary', error);
    }
}

async function loadExpenses() {
    try {
        const expenses = await apiRequest('/finance/expenses');
        const tbody = document.getElementById('expenseTable');
        if (!tbody) return;
        
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-gray-500">Belum ada pengeluaran...</td></tr>';
            return;
        }

        tbody.innerHTML = expenses.sort((a,b)=> new Date(b.date) - new Date(a.date)).map(exp => `
            <tr class="border-b">
                <td class="px-4 py-3">${exp.name}</td>
                <td class="px-4 py-3"><span class="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold">${exp.category}</span></td>
                <td class="px-4 py-3">${exp.date}</td>
                <td class="px-4 py-3 text-right font-bold text-red-600">${formatIDR(exp.amount)}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="deleteExpense('${exp.id}')" class="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded">Hapus</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Failed fetching expenses', e);
    }
}

async function addExpense() {
    const name = document.getElementById('expName').value;
    const amount = document.getElementById('expAmount').value;
    const category = document.getElementById('expCat').value;
    const type = document.getElementById('financeFilterType').value;
    
    let targetDate = undefined;
    if (type === 'date') targetDate = document.getElementById('financeDate').value;
    else if (type === 'month') {
        const monthVal = document.getElementById('financeMonth').value;
        if (monthVal) targetDate = `${monthVal}-01`;
    }

    if (!name || !amount) {
        showErrorToast('Mohon lengkapi data pengeluaran');
        return;
    }
    
    try {
        await apiRequest('/finance/expenses', {
            method: 'POST',
            body: JSON.stringify({ name, amount: parseInt(amount), category, date: targetDate })
        });
        showSuccessToast('Pengeluaran berhasil dicatat!');
        document.getElementById('expName').value = '';
        document.getElementById('expAmount').value = '';
        loadExpenses();
        loadFinanceSummary();
    } catch(e) {
        showErrorToast('Gagal mencatat pengeluaran');
    }
}

async function deleteExpense(id) {
    if (!confirm('Hapus pengeluaran ini?')) return;
    try {
       await apiRequest('/finance/expenses/' + id, { method: 'DELETE' });
       showSuccessToast('Pengeluaran dihapus');
       loadExpenses();
       loadFinanceSummary();
    } catch(e) {
       showErrorToast('Gagal menghapus');
    }
}
