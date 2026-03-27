// Check valid owner session
if (localStorage.getItem('user_role') !== 'owner') {
    window.location.href = '/login.html';
}

// Format numbers
function formatCurrency(number) {
    if(!number && number !== 0) return 'Rp0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(number);
}

// Global State
const state = {
    currentMonth: (function(){ const now = new Date(); const wib = new Date(now.getTime() + (7*60*60*1000)); return wib.toISOString().substring(0, 7); })(), // 'YYYY-MM' (WIB)
    summary: { staff1Attendance: 0, staff2Attendance: 0, totalSalary: 0, totalIncome: 0, totalExpense: 0, profit: 0 },
    transactions: [],
    expenses: [],
    attendance: [],
    transactionFilter: 'ALL' // 'ALL', 'INCOME', 'EXPENSE'
};

// UI Elements map
const els = {
    monthInput: document.getElementById('financeMonth'),
    loading: document.getElementById('loadingOverlay'),
    
    // Cards
    netProfit: document.getElementById('netProfit'),
    totalIncome: document.getElementById('totalIncome'),
    totalExpense: document.getElementById('totalExpense'),
    gajiExpense: document.getElementById('gajiExpense'),
    
    // Tables
    transactionTableBody: document.getElementById('transactionTableBody'),
    attendanceLogBody: document.getElementById('attendanceLogBody'),
    staffCardsContainer: document.getElementById('staffCardsContainer'),
    
    // Modals
    expenseModal: document.getElementById('expenseModal'),
    expenseModalContent: document.getElementById('expenseModalContent'),
    
    // Reports
    repIncome: document.getElementById('repIncome'),
    repExpenseBreakdown: document.getElementById('repExpenseBreakdown'),
    repSalary: document.getElementById('repSalary'),
    repProfit: document.getElementById('repProfit'),
    reportPeriod: document.getElementById('reportPeriod'),
    
    // Nav Buttons
    navTabs: ['dashboard','transactions','attendance','reports', 'settings-hr', 'settings-auto']
};

let mainChart, pieChart;
let systemSettings = {};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    els.monthInput.value = state.currentMonth;
    switchTab('dashboard');
    loadFinanceData();
    loadSettings();
});

// Settings Menu Dropdown Logic
function toggleSettingsMenu() {
    const submenu = document.getElementById('settings-submenu');
    const arrow = document.getElementById('settings-arrow');
    if (submenu.classList.contains('hidden')) {
        submenu.classList.remove('hidden');
        submenu.classList.add('flex');
        arrow.classList.add('rotate-180');
    } else {
        submenu.classList.add('hidden');
        submenu.classList.remove('flex');
        arrow.classList.remove('rotate-180');
    }
}

// Transactions Menu Dropdown
function toggleTransactionsMenu() {
    const submenu = document.getElementById('trx-submenu');
    const arrow = document.getElementById('trx-arrow');
    if (submenu.classList.contains('hidden')) {
        submenu.classList.remove('hidden');
        submenu.classList.add('flex');
        arrow.classList.add('rotate-180');
    } else {
        submenu.classList.add('hidden');
        submenu.classList.remove('flex');
        arrow.classList.remove('rotate-180');
    }
}

// Mobile Sidebar Toggle
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// Tab Switching logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('block'));
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
    
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-${tabId}`).classList.add('block');
    
    // Title mapping
    const titles = {
        'dashboard': 'Overview Dashboard',
        'transactions': 'Transaction Viewer',
        'attendance': 'HR & Attendance',
        'reports': 'Printable Reports',
        'settings-hr': 'HR & Payroll Configuration',
        'settings-auto': 'System Automation & Reset'
    };
    document.getElementById('pageTitle').textContent = titles[tabId] || 'Finance Pro';
    
    // Sidebar active styling
    els.navTabs.forEach(id => {
        const btn = document.getElementById(`nav-${id}`);
        if(id === tabId) {
            btn.className = `w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-indigo-400 bg-indigo-500/10 font-medium transition`;
        } else {
            btn.className = `w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-gray-400 hover:text-white hover:bg-[#27272A] font-medium transition`;
        }
    });

    if(window.innerWidth < 768) {
       document.getElementById('sidebar').classList.add('-translate-x-full');
       document.getElementById('mobileOverlay').classList.add('hidden');
    }
}

// Show/Hide Loading
function toggleLoading(show) {
    if(show) els.loading.classList.remove('hidden');
    else els.loading.classList.add('hidden');
}

// Load Data
async function loadFinanceData() {
    toggleLoading(true);
    state.currentMonth = els.monthInput.value || state.currentMonth;
    
    try {
        const [sumRes, trRes, exRes] = await Promise.all([
            fetch(`/api/finance/summary?month=${state.currentMonth}`),
            fetch('/api/transactions'),
            fetch('/api/finance/expenses')
        ]);
        
        state.summary = await sumRes.json();
        const allTrans = await trRes.json();
        const allExp = await exRes.json();
        
        state.transactions = allTrans.filter(t => t.timestamp.startsWith(state.currentMonth));
        state.expenses = allExp.filter(e => e.date.startsWith(state.currentMonth));
        state.attendance = state.summary.attendanceList || []; 

        updateDashboard();
        renderTransactionTable();
        renderAttendance();
        updateReportView();
        
    } catch (err) {
        console.error("Fetch Data Failed:", err);
        alert("Failed to sync finance data.");
    } finally {
        toggleLoading(false);
    }
}

// --- Dashboard ---
function updateDashboard() {
    els.netProfit.textContent = formatCurrency(state.summary.profit);
    els.totalIncome.textContent = formatCurrency(state.summary.totalIncome);
    els.totalExpense.textContent = formatCurrency(state.summary.totalExpense);
    els.gajiExpense.textContent = formatCurrency(state.summary.totalSalary);

    renderCharts();
}

function renderCharts() {
    const daysInMonth = new Date(state.currentMonth.split('-')[0], state.currentMonth.split('-')[1], 0).getDate();
    const labels = Array.from({length: daysInMonth}, (_, i) => `${i + 1}`);
    const incData = new Array(daysInMonth).fill(0);
    const expData = new Array(daysInMonth).fill(0);

    state.transactions.forEach(t => {
        const d = new Date(t.timestamp).getDate() - 1;
        if(d >= 0 && d < daysInMonth) incData[d] += t.total;
    });

    state.expenses.forEach(e => {
        const d = new Date(e.date).getDate() - 1;
        if(d >= 0 && d < daysInMonth) expData[d] += e.amount;
    });

    if(mainChart) mainChart.destroy();
    mainChart = new Chart(document.getElementById('mainChart').getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                { type: 'line', label: 'Income', data: incData, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.3 },
                { type: 'bar', label: 'Expenses', data: expData, backgroundColor: '#f43f5e', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { grid: { color: '#27272A' }, ticks: { color: '#a1a1aa' } },
                y: { grid: { color: '#27272A' }, ticks: { color: '#a1a1aa' } }
            },
            plugins: { legend: { labels: { color: '#a1a1aa' } } }
        }
    });

    if(pieChart) pieChart.destroy();
    pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Revenue', 'Op Expenses', 'Salary'],
            datasets: [{
                data: [state.summary.totalIncome, state.summary.totalExpense, state.summary.totalSalary],
                backgroundColor: ['#10b981', '#f43f5e', '#f59e0b'], borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa' } } }
        }
    });
}

// --- Transactions ---
function filterTransactionView(type) {
    state.transactionFilter = type;
    ['ALL','INCOME','EXPENSE'].forEach(id => {
        const btn = document.getElementById(`flt-${id}`);
        if(id === type) {
            btn.className = `px-4 py-1.5 rounded-md bg-[#3F3F46] text-white text-sm font-medium transition`;
        } else {
            btn.className = `px-4 py-1.5 rounded-md text-gray-400 hover:text-white text-sm font-medium transition`;
        }
    });
    renderTransactionTable();
}

function renderTransactionTable() {
    let combined = [];
    
    if(state.transactionFilter === 'ALL' || state.transactionFilter === 'INCOME') {
        state.transactions.forEach(t => {
            combined.push({
                isIncome: true, id: t.id,
                time: t.timestamp,
                desc: `Penjualan Kasir (${t.items.length} Barang)`,
                cat: 'Sales', amount: t.total
            });
        });
    }

    if(state.transactionFilter === 'ALL' || state.transactionFilter === 'EXPENSE') {
        state.expenses.forEach(e => {
             combined.push({
                 isIncome: false, id: e.id,
                 time: e.timestamp || e.date + "T00:00:00.000Z",
                 desc: e.name, cat: e.category || 'General', amount: e.amount
             });
        });
    }

    combined.sort((a,b) => new Date(b.time) - new Date(a.time));

    if(combined.length === 0) {
        els.transactionTableBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-500">Tidak ada transaksi tercatat.</td></tr>`;
        return;
    }

    els.transactionTableBody.innerHTML = combined.map(item => `
        <tr class="hover:bg-[#27272A]/50 transition group">
            <td class="p-4 text-gray-300 whitespace-nowrap">${new Date(item.time).toLocaleDateString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
            <td class="p-4 text-white font-medium">${item.desc}</td>
            <td class="p-4">
               <span class="px-2.5 py-1 text-xs rounded border border-[#3F3F46] bg-[#27272A] text-gray-400">${item.cat}</span>
            </td>
            <td class="p-4 text-right font-bold ${item.isIncome ? 'text-green-400' : 'text-red-400'}">
                ${item.isIncome ? '+' : '-'}${formatCurrency(item.amount)}
            </td>
            <td class="p-4 text-center no-print">
                ${!item.isIncome ? `<button onclick="deleteExpense('${item.id}')" class="text-xs px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded font-bold opacity-0 group-hover:opacity-100 transition">Delete</button>` : `<span class="text-xs text-gray-600">Locked</span>`}
            </td>
        </tr>
    `).join('');
}

async function deleteExpense(id) {
    if(!confirm('Delete this expense record permenantly?')) return;
    try {
        await fetch(`/api/finance/expenses/${id}`, { method: 'DELETE' });
        loadFinanceData();
    } catch(err) { alert('Error deleting'); }
}

// --- Expense Modal Mode Switcher ---
let currentExpenseMode = 'catalog';

function setExpenseMode(mode) {
    currentExpenseMode = mode;
    const tCat = document.getElementById('tab-exp-catalog');
    const tMan = document.getElementById('tab-exp-manual');
    const fCat = document.getElementById('form-exp-catalog');
    const fMan = document.getElementById('form-exp-manual');

    const activeClass = 'flex-1 py-3 text-sm font-bold text-indigo-400 border-b-2 border-indigo-500 transition';
    const inactiveClass = 'flex-1 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent hover:text-gray-300 hover:bg-[#27272A]/50 transition';

    if (mode === 'catalog') {
        tCat.className = activeClass;
        tMan.className = inactiveClass;
        fCat.classList.remove('hidden');
        fMan.classList.add('hidden');
    } else {
        tMan.className = activeClass;
        tCat.className = inactiveClass;
        fMan.classList.remove('hidden');
        fCat.classList.add('hidden');
    }
}

function calcCatalogPrice() {
    const sel = document.getElementById('catalogItem');
    const qty = parseInt(document.getElementById('catalogQty').value) || 0;
    const price = sel ? Number(sel.value) : 0;
    const total = price * qty;
    const display = document.getElementById('catalogTotalDisplay');
    if (display) display.textContent = formatCurrency(total);
}

function openExpenseModal() {
    els.expenseModal.classList.remove('hidden');
    currentExpenseMode = 'catalog';
    setExpenseMode('catalog');
    setTimeout(() => {
        document.getElementById('expenseModalContent').classList.remove('scale-95');
        document.getElementById('expenseModalContent').classList.add('scale-100');
    }, 10);
    calcCatalogPrice();
}

function closeExpenseModal() {
    document.getElementById('expenseModalContent').classList.remove('scale-100');
    document.getElementById('expenseModalContent').classList.add('scale-95');
    setTimeout(() => { els.expenseModal.classList.add('hidden'); }, 300);
}

async function submitExpense() {
    let desc, amount;

    if (currentExpenseMode === 'catalog') {
        const sel = document.getElementById('catalogItem');
        const qty = parseInt(document.getElementById('catalogQty').value) || 1;
        if (!sel || !sel.value) return alert('Silakan pilih item dari Katalog terlebih dahulu!');
        if (qty < 1) return alert('Kuantitas minimal 1!');
        const price = Number(sel.value);
        const itemName = sel.options[sel.selectedIndex].getAttribute('data-name');
        desc = `[Suplier Restock] ${itemName} (Qty: ${qty})`;
        amount = price * qty;
    } else {
        desc = (document.getElementById('expName').value || '').trim();
        amount = Number(document.getElementById('expAmount').value);
        if (desc.length < 3) return alert('Nama pengeluaran minimal 3 karakter.');
        if (!amount || amount <= 0) return alert('Nominal harus lebih dari Rp0.');
    }

    const category = document.getElementById('expCat').value;

    try {
        const res = await fetch('/api/finance/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: desc, amount, category })
        });
        if (res.ok) {
            closeExpenseModal();
            loadFinanceData();
            document.getElementById('expName').value = '';
            document.getElementById('expAmount').value = '';
            document.getElementById('catalogItem').value = '';
            document.getElementById('catalogQty').value = '1';
            calcCatalogPrice();
        } else {
            const info = await res.json();
            alert(info.message || 'Gagal menyimpan pengeluaran');
        }
    } catch (e) { console.error(e); alert('Network error'); }
}


function renderAttendance() {
    // 1. Staff Cards
    const maxSalary = state.summary.baseSalary || 1000000;
    const dailyRate = maxSalary / 30; // pro-rata logic
    
    const staff1Days = state.summary.staff1Attendance || 0;
    const staff2Days = state.summary.staff2Attendance || 0;
    const staff1Name = state.summary.staff1Name || 'Karyawan 1';
    const staff2Name = state.summary.staff2Name || 'Karyawan 2';
    
    els.staffCardsContainer.innerHTML = [
        {name: staff1Name, days: staff1Days, expectedSalary: Math.min(staff1Days * dailyRate, maxSalary), pct: Math.min((staff1Days/30)*100, 100) },
        {name: staff2Name, days: staff2Days, expectedSalary: Math.min(staff2Days * dailyRate, maxSalary), pct: Math.min((staff2Days/30)*100, 100) }
    ].map(st => `
        <div class="card-dark p-6 relative">
            <h4 class="text-white font-bold text-lg mb-4 flex items-center justify-between">
                ${st.name} 
                <span class="text-sm bg-[#27272A] text-gray-400 px-3 py-1 rounded-full border border-[#3F3F46]">Aktif</span>
            </h4>
            
            <div class="space-y-4">
                <div class="flex justify-between items-end border-b border-[#27272A] pb-3">
                   <p class="text-gray-400 text-sm">Valid Check-ins (Bulan Ini)</p>
                   <p class="text-2xl font-bold text-indigo-400">${st.days} <span class="text-sm text-gray-500 font-normal">/ 30 hr</span></p>
                </div>
                
                <div class="flex justify-between items-end">
                   <p class="text-gray-400 text-sm">Gaji Dihitung (Pro-rata)</p>
                   <p class="text-xl font-bold text-yellow-500">${formatCurrency(st.expectedSalary)}</p>
                </div>

                <div class="w-full bg-[#0F0F12] rounded-full h-2.5 outline outline-1 outline-[#27272A] mt-2">
                   <div class="bg-indigo-500 h-2.5 rounded-full" style="width: ${st.pct}%"></div>
                </div>
            </div>
        </div>
    `).join('');

    // 2. Attendance Table
    const attSorted = [...state.attendance].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if(attSorted.length === 0) {
        els.attendanceLogBody.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-gray-500">Belum ada absensi tercatat bulan ini.</td></tr>`;
        return;
    }

    els.attendanceLogBody.innerHTML = attSorted.map(a => `
        <tr class="hover:bg-[#27272A]/30">
            <td class="p-3 pl-4">
               <span class="bg-[#18181B] border border-[#3F3F46] text-white px-3 py-1 rounded shadow-sm text-xs font-bold uppercase tracking-wider">${a.employeeName || a.employeeId}</span>
            </td>
            <td class="p-3 text-gray-300">${(function(d){ const [y,m,day] = d.split('-').map(Number); return new Date(y,m-1,day).toLocaleDateString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric'}); })(a.date)}</td>
            <td class="p-3 text-gray-500 text-sm font-mono">${a.loginTime.substring(0, 19).replace('T', ' ')} WIB</td>
        </tr>
    `).join('');

    // 3. Calendar View
    renderAttendanceCalendar(staff1Name, staff2Name);
}

function renderAttendanceCalendar(s1Name, s2Name) {
    try {
        const [year, month] = state.currentMonth.split('-').map(Number);
        
        // Label
        const mName = new Date(year, month-1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        document.getElementById('calendarMonthLabel').textContent = `Jadwal Kehadiran - ${mName}`;
        
        const firstDay = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Get WIB today date string
        const now = new Date();
        const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const todayStr = wibTime.toISOString().split('T')[0];
        
        let html = '';
        
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="bg-[#18181B]/50 min-h-[60px] md:min-h-[80px] p-1"></div>`;
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const attendees = state.attendance.filter(a => a && a.date === dateStr);
            
            let pillsHtml = '';
            attendees.forEach(a => {
                // Null-safe: handle both "staff1"/"staff2" (new) and "Karyawan 1"/"Karyawan 2" (legacy)
                const eid = (a.employeeId || '').toString();
                const isK1 = eid === 'staff1' || eid.includes('1');
                const colorClass = isK1 
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                const displayName = a.employeeName || eid || 'Staff';
                const shortName = isK1 ? s1Name.substring(0, 6) : s2Name.substring(0, 6);
                pillsHtml += `<div class="text-[9px] md:text-[10px] mt-1 px-1 md:px-1.5 py-0.5 rounded border leading-tight ${colorClass} truncate" title="${displayName}">${shortName}</div>`;
            });
            
            const textClass = isToday ? 'text-white' : 'text-gray-400';
            const numBgClass = isToday ? 'bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center -ml-1 -mt-1 shadow-md shadow-indigo-500/30' : '';
            
            html += `
                <div class="bg-[#18181B] min-h-[60px] md:min-h-[80px] p-1.5 md:p-2 flex flex-col hover:bg-[#27272A]/50 transition cursor-default group">
                    <span class="text-[10px] md:text-xs font-semibold ${textClass} ${numBgClass}">${day}</span>
                    <div class="mt-0.5 md:mt-1 flex-1 flex flex-col gap-0.5">
                        ${pillsHtml}
                    </div>
                </div>
            `;
        }
        
        const totalCells = firstDay + daysInMonth;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) {
            html += `<div class="bg-[#18181B]/50 min-h-[60px] md:min-h-[80px] p-1"></div>`;
        }
        
        document.getElementById('calendarGrid').innerHTML = html;
    } catch(err) {
        console.error('[Calendar] Render error:', err);
        const grid = document.getElementById('calendarGrid');
        if (grid) grid.innerHTML = `<div class="col-span-7 p-6 text-center text-red-400 text-sm">Gagal memuat kalender. Cek console untuk detail.</div>`;
    }
}

// --- Printable Report Build ---
function updateReportView() {
    const [y, m] = state.currentMonth.split('-');
    const mName = new Date(y, m-1).toLocaleString('id-ID', {month:'long', year:'numeric'});
    els.reportPeriod.textContent = `Periode: ${mName}`;

    els.repIncome.textContent = formatCurrency(state.summary.totalIncome);
    els.repSalary.textContent = `(-) ${formatCurrency(state.summary.totalSalary)}`;
    
    // Group expenses by category
    const expDict = {};
    state.expenses.forEach(e => {
        const cat = e.category || 'Lain-lain';
        expDict[cat] = (expDict[cat] || 0) + e.amount;
    });

    if(Object.keys(expDict).length === 0) {
        els.repExpenseBreakdown.innerHTML = '<div class="text-gray-400 italic mb-2">Tidak ada pengeluaran operasi/bahan.</div>';
    } else {
        els.repExpenseBreakdown.innerHTML = Object.entries(expDict).map(([k,v]) => `
            <div class="flex justify-between items-center text-sm border-b border-gray-100 pb-1 mb-1">
                <span>↳ Total ${k}</span>
                <span class="text-red-500 font-semibold">(-) ${formatCurrency(v)}</span>
            </div>
        `).join('');
    }

    els.repProfit.textContent = formatCurrency(state.summary.profit);
}

// --- Settings Panel Logic ---
async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        systemSettings = await res.json() || {};
        
        document.getElementById('setStaff1').value = systemSettings.staff1Name || 'Karyawan 1';
        document.getElementById('setStaff1Pin').value = systemSettings.staff1Pin || '1111';
        
        document.getElementById('setStaff2').value = systemSettings.staff2Name || 'Karyawan 2';
        document.getElementById('setStaff2Pin').value = systemSettings.staff2Pin || '2222';
        
        document.getElementById('setBaseSalary').value = systemSettings.baseSalary || 1000000;
        
        document.getElementById('resetTime').value = systemSettings.resetTime || '00:00';
        document.getElementById('autoResetStock').checked = systemSettings.autoResetStock !== false;
    } catch(e) {
        console.error("Failed to load settings");
    }
}

async function saveHrSettings() {
    const s1 = document.getElementById('setStaff1').value.trim() || 'Karyawan 1';
    const s1Pin = document.getElementById('setStaff1Pin').value.trim() || '1111';
    
    const s2 = document.getElementById('setStaff2').value.trim() || 'Karyawan 2';
    const s2Pin = document.getElementById('setStaff2Pin').value.trim() || '2222';
    
    const bs = document.getElementById('setBaseSalary').value || 1000000;
    
    try {
        const res = await fetch('/api/settings', {
            method: 'PUT', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ 
               staff1Name: s1, staff1Pin: s1Pin, 
               staff2Name: s2, staff2Pin: s2Pin, 
               baseSalary: Number(bs) 
            })
        });
        if(res.ok) {
            alert('Konfigurasi HR (Nama, PIN & Gaji) berhasil disimpan!');
            loadFinanceData();
        }
    } catch(e) { alert("Network error saving configuration."); }
}

async function saveAutoSettings() {
    try {
        const res = await fetch('/api/settings', {
            method: 'PUT', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                resetTime: document.getElementById('resetTime').value || '00:00',
                autoResetStock: document.getElementById('autoResetStock').checked
            })
        });
        if(res.ok) alert('Jadwal Reset berhasil diperbarui!');
    } catch(e) { alert("Network error saving configuration."); }
}

async function forceResetStock() {
    if(!confirm("⚠️ AWAS! Tindakan ini akan mengosongkan semua stok produk olahan (Ayam, Nasi, dll) menjadi 0. Lanjutkan?")) return;
    try {
        const res = await fetch('/api/settings/reset-stock', { method: 'POST' });
        if(res.ok) alert("Stok Produk berhasil dikosongkan Manual.");
    } catch(e) { alert("Gagal Eksekusi Manual."); }
}

async function clearAllHistory() {
    const confirmation = prompt("Ketik 'HAPUS' jika Anda yakin ingin membersihkan seluruh data riwayat secara PERMANEN.");
    if (confirmation !== 'HAPUS') return;

    try {
        const res = await fetch('/api/settings/clear-history', { method: 'POST' });
        if(res.ok) {
            alert("Riwayat dihapus permanen!");
            loadFinanceData();
        }
    } catch(e) { alert("Gagal Eksekusi Manual."); }
}
