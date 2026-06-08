/**
 * RICIN XPRESS - Booking Form JavaScript
 * Validation, localStorage, WhatsApp, PDF generation
 */

// Set minimum date to today
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('collectionDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.value = today;
  }
});

function submitOrder(event) {
  event.preventDefault();
  
  const btn = document.getElementById('submitBtn');
  const originalText = btn.innerHTML;
  
  // Validate form
  if (!validateForm()) {
    return;
  }
  
  // Show loading
  btn.innerHTML = '<span class="spinner"></span> Processing...';
  btn.disabled = true;
  
  // Gather form data
  const order = {
    reference: RicinUtils.generateReference(),
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    pickupAddress: document.getElementById('pickupAddress').value.trim(),
    dropoffAddress: document.getElementById('dropoffAddress').value.trim(),
    collectionDate: document.getElementById('collectionDate').value,
    collectionTime: document.getElementById('collectionTime').value,
    itemDescription: document.getElementById('itemDescription').value.trim(),
    specialInstructions: document.getElementById('specialInstructions').value.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  (async () => {
    try {
      await RicinUtils.saveOrder(order);
      sessionStorage.setItem('lastOrderRef', order.reference);
      RicinUtils.sendWhatsAppMessage(order);
      setTimeout(() => {
        try { RicinUtils.generatePDF(order); }
        catch (e) { console.error('PDF generation error:', e); }
      }, 500);
      RicinUtils.showToast('Order submitted successfully!', 'success');
      setTimeout(() => { window.location.href = 'order-success.html'; }, 1000);
    } catch (error) {
      console.error('Order submission error:', error);
      RicinUtils.showToast('Could not save order. Please try again.', 'error');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  })();
}

function validateForm() {
  let isValid = true;
  
  // Required fields
  const requiredFields = [
    'firstName', 'lastName', 'phone',
    'pickupAddress', 'dropoffAddress',
    'collectionDate', 'collectionTime',
    'itemDescription'
  ];
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    const value = field.value.trim();
    
    if (!value) {
      field.classList.add('error');
      isValid = false;
    } else {
      field.classList.remove('error');
    }
  });
  
  // Phone validation
  const phone = document.getElementById('phone');
  const phoneValue = phone.value.trim();
  const phoneRegex = /^[0-9\s\-\(\)\+]{7,15}$/;
  
  if (phoneValue && !phoneRegex.test(phoneValue)) {
    phone.classList.add('error');
    RicinUtils.showToast('Please enter a valid phone number', 'error');
    isValid = false;
  }
  
  // Date validation - ensure not in the past
  const dateField = document.getElementById('collectionDate');
  const selectedDate = new Date(dateField.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    dateField.classList.add('error');
    RicinUtils.showToast('Please select today or a future date', 'error');
    isValid = false;
  }
  
  if (!isValid) {
    RicinUtils.showToast('Please fill in all required fields', 'error');
    
    // Scroll to first error
    const firstError = document.querySelector('.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }
  }
  
  return isValid;
}

// Remove error class on input
document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      this.classList.remove('error');
    });
  });
});
