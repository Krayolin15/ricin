/**
 * RICIN XPRESS - Admin Dashboard JavaScript
 * CRUD operations, filtering, stats, PDF generation
 */

// Check login
if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
  window.location.href = 'login.html';
}

let currentOrderRef = null;
let allOrders = [];

// ---- Logout ----
function logout() {
  sessionStorage.removeItem('adminLoggedIn');
  window.location.href = 'login.html';
}

// ---- Load Orders ----
async function loadOrders() {
  allOrders = await RicinUtils.getOrders();
  updateStats();
  renderOrders();
}

// ---- Update Stats ----
function updateStats() {
  const total = allOrders.length;
  const pending = allOrders.filter(o => o.status === 'pending').length;
  const inProgress = allOrders.filter(o => ['confirmed', 'onway', 'pickedup'].includes(o.status)).length;
  const completed = allOrders.filter(o => o.status === 'completed').length;
  
  animateValue('statTotal', parseInt(document.getElementById('statTotal').textContent), total);
  animateValue('statPending', parseInt(document.getElementById('statPending').textContent), pending);
  animateValue('statInProgress', parseInt(document.getElementById('statInProgress').textContent), inProgress);
  animateValue('statCompleted', parseInt(document.getElementById('statCompleted').textContent), completed);
}

function animateValue(id, start, end) {
  if (start === end) return;
  const element = document.getElementById(id);
  const duration = 500;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(start + (end - start) * progress);
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// ---- Render Orders ----
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  const noOrders = document.getElementById('noOrders');
  const filtered = getFilteredOrders();
  
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    noOrders.style.display = 'block';
    return;
  }
  
  noOrders.style.display = 'none';
  
  tbody.innerHTML = filtered.map(order => `
    <tr>
      <td><span class="order-ref">${order.reference}</span></td>
      <td>
        <strong>${order.firstName} ${order.lastName}</strong><br>
        <small style="color: var(--text-lighter);">${order.phone}</small>
      </td>
      <td style="max-width: 150px; font-size: 0.85rem;">${truncate(order.pickupAddress, 40)}</td>
      <td style="max-width: 150px; font-size: 0.85rem;">${truncate(order.dropoffAddress, 40)}</td>
      <td style="white-space: nowrap;">
        ${formatDate(order.collectionDate)}<br>
        <small style="color: var(--text-lighter);">${order.collectionTime}</small>
      </td>
      <td>
        <select class="order-status-select status-${order.status}" onchange="updateStatus('${order.reference}', this.value, this)">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="onway" ${order.status === 'onway' ? 'selected' : ''}>On My Way</option>
          <option value="pickedup" ${order.status === 'pickedup' ? 'selected' : ''}>Picked Up</option>
          <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
      </td>
      <td>
        <div class="order-actions">
          <button class="btn-icon btn-view" onclick="viewOrder('${order.reference}')" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon btn-pdf" onclick="downloadOrderPDF('${order.reference}')" title="Download PDF">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="deleteOrder('${order.reference}')" title="Delete Order">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ---- Filter Orders ----
function getFilteredOrders() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const statusFilter = document.getElementById('statusFilter').value;
  const sortFilter = document.getElementById('sortFilter').value;
  
  let filtered = [...allOrders];
  
  // Search filter
  if (search) {
    filtered = filtered.filter(o => 
      o.reference.toLowerCase().includes(search) ||
      o.firstName.toLowerCase().includes(search) ||
      o.lastName.toLowerCase().includes(search) ||
      o.phone.includes(search) ||
      o.pickupAddress.toLowerCase().includes(search) ||
      o.dropoffAddress.toLowerCase().includes(search)
    );
  }
  
  // Status filter
  if (statusFilter) {
    filtered = filtered.filter(o => o.status === statusFilter);
  }
  
  // Sort
  filtered.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortFilter === 'oldest' ? dateA - dateB : dateB - dateA;
  });
  
  return filtered;
}

function filterOrders() {
  renderOrders();
}

// ---- Update Status ----
async function updateStatus(ref, status, selectEl) {
  const order = await RicinUtils.updateOrderStatus(ref, status);
  if (order) {
    selectEl.className = 'order-status-select status-' + status;
    allOrders = await RicinUtils.getOrders();
    updateStats();
    RicinUtils.showToast(`Order ${ref} status updated to ${formatStatus(status)}`, 'success');
  }
}

// ---- View Order ----
async function viewOrder(ref) {
  const order = await RicinUtils.getOrderByRef(ref);
  if (!order) return;
  
  currentOrderRef = ref;
  
  const modal = document.getElementById('orderModal');
  const content = document.getElementById('modalContent');
  
  content.innerHTML = `
    <div class="modal-row">
      <span class="modal-label">Reference</span>
      <span class="modal-value" style="font-family: monospace; font-weight: 700; color: var(--primary);">${order.reference}</span>
    </div>
    <div class="modal-row">
      <span class="modal-label">Customer</span>
      <span class="modal-value">${order.firstName} ${order.lastName}</span>
    </div>
    <div class="modal-row">
      <span class="modal-label">Phone</span>
      <span class="modal-value">${order.phone}</span>
    </div>
    <div class="modal-row">
      <span class="modal-label">Pickup Address</span>
      <span class="modal-value">${order.pickupAddress}</span>
    </div>
    <div class="modal-row">
      <span class="modal-label">Drop-off Address</span>
      <span class="modal-value">${order.dropoffAddress}</span>
    </div>
    <div class="modal-row">
      <span class="modal-label">Collection Date</span>
      <span class="modal-value">${formatDate(order.collectionDate)}</span>
    </div>
    <div class="modal-row">
      <span class="modal-label">Collection Time</span>
      <span class="modal-value">${order.collectionTime}</span>
    </div>
    <div class="modal-row">
      <span class="modal-label">Item Description</span>
      <span class="modal-value">${order.itemDescription}</span>
    </div>
    ${order.specialInstructions ? `
    <div class="modal-row">
      <span class="modal-label">Special Instructions</span>
      <span class="modal-value">${order.specialInstructions}</span>
    </div>
    ` : ''}
    <div class="modal-row">
      <span class="modal-label">Status</span>
      <span class="modal-value">
        <span class="status-badge status-${order.status}" style="display: inline-block;">${formatStatus(order.status)}</span>
      </span>
    </div>
    <div class="modal-row">
      <span class="modal-label">Order Date</span>
      <span class="modal-value">${new Date(order.createdAt).toLocaleString('en-ZA')}</span>
    </div>
  `;
  
  modal.classList.add('show');
}

// ---- Download Order PDF ----
async function downloadOrderPDF(ref) {
  const order = await RicinUtils.getOrderByRef(ref);
  if (order) RicinUtils.generatePDF(order);
}

function downloadCurrentPDF() {
  if (currentOrderRef) {
    downloadOrderPDF(currentOrderRef);
  }
}

// ---- Delete Order ----
async function deleteOrder(ref) {
  if (confirm(`Are you sure you want to delete order ${ref}? This action cannot be undone.`)) {
    await RicinUtils.deleteOrder(ref);
    allOrders = await RicinUtils.getOrders();
    updateStats();
    renderOrders();
    RicinUtils.showToast('Order deleted successfully', 'success');
  }
}

// ---- Modal ----
function closeModal(event) {
  if (event.target === event.currentTarget) {
    document.getElementById('orderModal').classList.remove('show');
    currentOrderRef = null;
  }
}

function closeModalDirect() {
  document.getElementById('orderModal').classList.remove('show');
  currentOrderRef = null;
}

// ---- Utilities ----
function formatStatus(status) {
  const statuses = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'onway': 'On My Way',
    'pickedup': 'Picked Up',
    'completed': 'Completed'
  };
  return statuses[status] || status;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncate(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
  // Wait until Supabase client is attached
  const waitForDb = setInterval(async () => {
    if (window.sb) {
      clearInterval(waitForDb);
      await loadOrders();

      // Realtime updates
      window.sb.channel('orders-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
          allOrders = await RicinUtils.getOrders();
          updateStats();
          renderOrders();
        })
        .subscribe();

      // Safety polling
      setInterval(async () => {
        allOrders = await RicinUtils.getOrders();
        updateStats();
        renderOrders();
      }, 30000);
    }
  }, 100);
});
