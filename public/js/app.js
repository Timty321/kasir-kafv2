// Global State
const state = {
  products: [],
  cart: [],
  categories: [],
  currentEditingProductId: null,
  toDeleteProductId: null,
  pendingTopping: null, // For topping selection
  selectedTopping: null, // Currently selected topping
  toppingOptions: [
    { name: 'Sambal', price: 2000 },
    { name: 'Kecap Manis', price: 2000 },
    { name: 'Mayonaise', price: 3000 },
    { name: 'Keju', price: 3000 },
  ],
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
    state.products = await apiRequest(endpoint);
    renderProducts();
    renderInventoryTable();
  } catch (error) {
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
      'Paket Nasi + Ayam Original',
      'Paket Komplit',
      'Sadas Cemplung & Sadas Mentai',
      'Menu Tambahan & Extra Topping',
    ];

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
      class="category-btn px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold text-sm whitespace-nowrap transition hover:bg-gray-300"
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
      btn.classList.add('bg-orange-600', 'text-white');
      btn.classList.remove('bg-gray-200', 'text-gray-700');
    } else if (btn.dataset.category === 'all') {
      btn.classList.remove('bg-orange-600', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-700');
    } else {
      btn.classList.remove('bg-orange-600', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-700');
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
      <div class="bg-white rounded-lg shadow-md p-4 ${isLowStock ? 'low-stock' : ''} transition hover:shadow-lg">
        <div class="mb-3">
          <h3 class="font-bold text-gray-800 text-sm line-clamp-2">${product.name}</h3>
          <p class="text-xs text-gray-500 mt-1">${product.category}</p>
        </div>
        <div class="border-t pt-3 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-600">Harga</span>
            <span class="font-bold text-orange-600">${formatIDR(product.price)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-600">Stok</span>
            <span class="font-bold ${isLowStock ? 'text-orange-600' : 'text-green-600'}">${product.stock}</span>
          </div>
        </div>
        <button
          class="w-full mt-4 ${outOfStock ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'} text-white font-bold py-2 rounded-lg transition"
          onclick="addToCart('${product.id}', '${product.name}', ${product.price})"
          ${outOfStock ? 'disabled' : ''}
        >
          ${outOfStock ? '✗ Habis' : '🛒 Tambah'}
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
        <div class="cart-item bg-gray-50 rounded-lg p-3 mb-3">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-semibold text-sm">${item.name}</h4>
            <button onclick="removeFromCart(${index})" class="text-red-600 hover:text-red-800 text-lg">✕</button>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">${formatIDR(item.price)}</span>
            <span class="text-sm font-semibold text-orange-600">Qty: ${item.qty}</span>
          </div>
          <div class="flex gap-2 items-center justify-between">
            <div class="flex gap-2">
              <button onclick="decreaseQty(${index})" class="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm transition">−</button>
              <button onclick="increaseQty(${index})" class="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm transition">+</button>
            </div>
            <span class="font-bold text-sm text-green-600">${formatIDR(item.price * item.qty)}</span>
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
        <div class="cart-item bg-gray-50 rounded-lg p-3 mb-3">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-semibold text-sm">${item.name}</h4>
            <button onclick="removeFromCart(${index})" class="text-red-600 hover:text-red-800 text-lg">✕</button>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">${formatIDR(item.price)}</span>
            <span class="text-sm font-semibold text-orange-600">Qty: ${item.qty}</span>
          </div>
          <div class="flex gap-2 items-center justify-between">
            <div class="flex gap-2">
              <button onclick="decreaseQty(${index})" class="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm transition">−</button>
              <button onclick="increaseQty(${index})" class="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm transition">+</button>
            </div>
            <span class="font-bold text-sm text-green-600">${formatIDR(item.price * item.qty)}</span>
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
  if (method === 'QRIS') {
    showQrisSection();
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
 * Show QRIS section
 */
function showQrisSection() {
  document.getElementById('cashSection').classList.add('hidden');
  document.getElementById('qrisSection').classList.remove('hidden');
  const total = calculateCartTotal();
  document.getElementById('qrisAmount').textContent = total.toLocaleString('id-ID');
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
 * Complete payment
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
    }
  } catch (error) {
    showErrorToast(error.message || 'Pembayaran gagal');
  }
}

/**
 * Complete QRIS payment
 */
async function completeQrisPayment() {
  try {
    const total = calculateCartTotal();
    await createTransaction('QRIS', total, 0);
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

    await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });

    // Clear state
    state.cart = [];
    updateCart();
    closeCheckout();
    showSuccessToast('✓ Transaksi berhasil! Terima kasih.');

    // Reload products to update stock
    await loadProducts();
  } catch (error) {
    showErrorToast(error.message || 'Transaksi gagal');
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
  }
}

// ======================
// EVENT LISTENERS
// ======================

document.addEventListener('DOMContentLoaded', async () => {
  // Load initial data
  await loadCategories();
  await loadProducts();

  // Check if on admin page
  if (document.getElementById('inventoryTab')) {
    // Check URL for tab parameter
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'inventory';
    switchTab(tab);
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
  if (inventoryDateInput) inventoryDateInput.value = today;
  if (logDateInput) logDateInput.value = today;

  // Initial cart update
  updateCheckoutButton();
});
