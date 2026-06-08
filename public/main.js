/**
 * RICIN XPRESS - Main JavaScript
 * Navigation, animations, mobile menu, utilities, Supabase order API
 */

// ---- Navigation ----
function initNavigation() {
  const header = document.querySelector('.header');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.pageYOffset > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileToggle) mobileToggle.classList.remove('active');
      if (nav) nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  const currentPage = window.location.pathname.split('/').pop() || '/';
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === '/')) {
      link.classList.add('active');
    }
  });
}

function initScrollAnimations() {
  const els = document.querySelectorAll('.animate-on-scroll');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  els.forEach(el => obs.observe(el));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

function animateCounter(element, target, duration = 1500) {
  const increment = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { element.textContent = target.toLocaleString(); clearInterval(timer); }
    else element.textContent = Math.floor(current).toLocaleString();
  }, 16);
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

// ---- Supabase helpers ----
function db() {
  if (!window.sb) throw new Error('Database not ready. Please refresh the page.');
  return window.sb;
}

// Map DB row (snake_case) <-> app object (camelCase)
function rowToOrder(r) {
  if (!r) return null;
  return {
    id: r.id,
    reference: r.reference,
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone,
    pickupAddress: r.pickup_address,
    dropoffAddress: r.dropoff_address,
    collectionDate: r.collection_date,
    collectionTime: r.collection_time,
    itemDescription: r.item_description,
    specialInstructions: r.special_instructions || '',
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function getOrders() {
  try {
    const { data, error } = await db().from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToOrder);
  } catch (e) { console.error('getOrders:', e); return []; }
}

async function saveOrder(order) {
  const { data, error } = await db().from('orders').insert({
    reference: order.reference,
    first_name: order.firstName,
    last_name: order.lastName,
    phone: order.phone,
    pickup_address: order.pickupAddress,
    dropoff_address: order.dropoffAddress,
    collection_date: order.collectionDate,
    collection_time: order.collectionTime,
    item_description: order.itemDescription,
    special_instructions: order.specialInstructions || null,
    status: order.status || 'pending',
  }).select().single();
  if (error) throw error;
  return rowToOrder(data);
}

async function getOrderByRef(ref) {
  const { data, error } = await db().from('orders').select('*').eq('reference', ref).maybeSingle();
  if (error) { console.error(error); return null; }
  return rowToOrder(data);
}

async function updateOrderStatus(ref, status) {
  const { data, error } = await db().from('orders').update({ status }).eq('reference', ref).select().single();
  if (error) { console.error(error); return null; }
  return rowToOrder(data);
}

async function deleteOrder(ref) {
  const { error } = await db().from('orders').delete().eq('reference', ref);
  if (error) console.error(error);
}

function generateReference() {
  return 'RXD' + Math.floor(100000 + Math.random() * 900000);
}

function sendWhatsAppMessage(order) {
  const phoneNumber = '27682937167';
  const message = encodeURIComponent(
    `*New Delivery Order - ${order.reference}*\n\n` +
    `*Sender:* ${order.firstName} ${order.lastName}\n*Phone:* ${order.phone}\n\n` +
    `*Pickup Address:*\n${order.pickupAddress}\n\n*Drop-off Address:*\n${order.dropoffAddress}\n\n` +
    `*Collection Date:* ${order.collectionDate}\n*Collection Time:* ${order.collectionTime}\n\n` +
    `*Item Description:*\n${order.itemDescription}\n\n` +
    (order.specialInstructions ? `*Special Instructions:*\n${order.specialInstructions}\n\n` : '') +
    `*Status:* ${order.status}`
  );
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
}

function generatePDF(order) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(211, 47, 47); doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.setFont('helvetica', 'bold');
  doc.text('RICIN XPRESS', 20, 25);
  doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.text('Delivery Receipt', 20, 33);
  doc.setTextColor(100, 100, 100); doc.setFontSize(10);
  doc.text(`Reference: ${order.reference}`, 150, 20);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 150, 26);
  doc.setTextColor(50, 50, 50); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('Order Details', 20, 55);
  doc.setDrawColor(211, 47, 47); doc.line(20, 58, 190, 58);
  let y = 68; doc.setFontSize(11);
  const fields = [
    ['Sender Name', `${order.firstName} ${order.lastName}`],
    ['Phone Number', order.phone],
    ['Pickup Address', order.pickupAddress],
    ['Drop-off Address', order.dropoffAddress],
    ['Collection Date', order.collectionDate],
    ['Collection Time', order.collectionTime],
    ['Item Description', order.itemDescription],
  ];
  if (order.specialInstructions) fields.push(['Special Instructions', order.specialInstructions]);
  fields.push(['Status', order.status.toUpperCase()]);
  fields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100); doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
    const split = doc.splitTextToSize(String(value), 120);
    doc.text(split, 80, y);
    y += 10 + (split.length - 1) * 5;
  });
  y += 15; doc.setDrawColor(200, 200, 200); doc.line(20, y, 190, y);
  y += 10; doc.setFontSize(10); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
  doc.text('Thank you for choosing Ricin Xpress!', 20, y);
  doc.text('For inquiries: 067 786 7203 | info@ricinxpress.co.za', 20, y + 5);
  doc.save(`RicinXpress-Receipt-${order.reference}.pdf`);
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation(); initScrollAnimations(); initSmoothScroll();
});

window.RicinUtils = {
  showToast, getOrders, saveOrder, getOrderByRef, updateOrderStatus, deleteOrder,
  generateReference, sendWhatsAppMessage, generatePDF, animateCounter,
};
