/**
 * RICIN XPRESS - Track Order JavaScript
 */

async function trackOrder() {
  const input = document.getElementById('trackInput');
  const ref = input.value.trim().toUpperCase();

  if (!ref) {
    RicinUtils.showToast('Please enter an order reference number', 'error');
    input.focus();
    return;
  }

  const order = await RicinUtils.getOrderByRef(ref);
  const resultDiv = document.getElementById('trackResult');
  const notFoundDiv = document.getElementById('notFound');
  
  if (!order) {
    resultDiv.classList.remove('show');
    notFoundDiv.style.display = 'block';
    notFoundDiv.style.animation = 'fadeInUp 0.4s ease';
    return;
  }
  
  notFoundDiv.style.display = 'none';
  
  // Populate result
  document.getElementById('resultRef').textContent = order.reference;
  document.getElementById('resultDate').textContent = `Placed on ${new Date(order.createdAt).toLocaleDateString('en-ZA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`;
  
  // Status badge
  const statusBadge = document.getElementById('resultStatus');
  statusBadge.textContent = formatStatus(order.status);
  statusBadge.className = 'status-badge status-' + order.status;
  
  // Update timeline
  updateTimeline(order.status);
  
  // Details
  document.getElementById('detailSender').textContent = `${order.firstName} ${order.lastName}`;
  document.getElementById('detailPhone').textContent = order.phone;
  document.getElementById('detailPickup').textContent = order.pickupAddress;
  document.getElementById('detailDropoff').textContent = order.dropoffAddress;
  document.getElementById('detailDate').textContent = order.collectionDate;
  document.getElementById('detailTime').textContent = order.collectionTime;
  document.getElementById('detailItem').textContent = order.itemDescription;
  
  resultDiv.classList.add('show');
}

function formatStatus(status) {
  const statuses = {
    'pending': 'Pending',
    'confirmed': 'Order Confirmed',
    'onway': 'On My Way',
    'pickedup': 'Picked Up',
    'completed': 'Completed'
  };
  return statuses[status] || status;
}

function updateTimeline(status) {
  const steps = document.querySelectorAll('.timeline-step');
  const statusOrder = ['pending', 'confirmed', 'onway', 'pickedup', 'completed'];
  const currentIndex = statusOrder.indexOf(status);
  
  steps.forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index < currentIndex) {
      step.classList.add('completed');
    } else if (index === currentIndex) {
      step.classList.add('active');
    }
  });
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('trackInput');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        trackOrder();
      }
    });
  }
});
