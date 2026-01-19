/**
 * Form Handler - Handles form validation and submission
 */

import { createBooking, getCurrentUser } from './supabase-client.js';
import { showError, showSuccess, showLoading, hideLoading } from './main.js';

/**
 * Initialize booking form
 */
async function initBookingForm() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  // Get activity ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get('activity_id');

  if (!activityId) {
    showError('未找到活动信息', document.getElementById('form-status'));
    return;
  }

  // Load activity summary
  await loadActivitySummary(activityId);

  // Add form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm(form)) {
      return;
    }

    // Get form data
    const formData = new FormData(form);
    const bookingData = {
      activity_id: activityId,
      user_name: formData.get('userName'),
      user_email: formData.get('userEmail'),
      user_phone: formData.get('userPhone'),
      booking_date: formData.get('bookingDate'),
      participant_count: parseInt(formData.get('participantCount')),
      notes: formData.get('userNotes'),
      status: 'pending',
    };

    // Get current user if authenticated
    const user = await getCurrentUser();
    if (user) {
      bookingData.user_id = user.id;
    }

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '提交中...';

    // Submit booking
    const result = await createBooking(bookingData);

    // Hide loading state
    submitButton.disabled = false;
    submitButton.textContent = originalText;

    // Show result
    const statusContainer = document.getElementById('form-status');
    if (result.success) {
      showSuccess('预约成功！我们会尽快与您联系。', statusContainer);
      form.reset();

      // Redirect to profile page after 2 seconds
      setTimeout(() => {
        window.location.href = 'user-profile.html';
      }, 2000);
    } else {
      showError(`预约失败：${result.error}`, statusContainer);
    }
  });

  // Add real-time validation
  addRealTimeValidation(form);
}

/**
 * Load activity summary
 * @param {string} activityId - Activity ID
 */
async function loadActivitySummary(activityId) {
  const summaryContent = document.getElementById('summary-content');
  if (!summaryContent) return;

  showLoading(summaryContent);

  try {
    const { fetchActivityById } = await import('./supabase-client.js');
    const result = await fetchActivityById(activityId);

    if (result.success && result.data) {
      const activity = result.data;
      summaryContent.innerHTML = `
        <h3>${activity.title}</h3>
        <p><strong>日期:</strong> ${activity.date}</p>
        <p><strong>时间:</strong> ${activity.time}</p>
        <p><strong>地点:</strong> ${activity.location}</p>
        <p><strong>类型:</strong> ${activity.category}</p>
      `;
    } else {
      summaryContent.innerHTML = '<p>无法加载活动信息</p>';
    }
  } catch (error) {
    console.error('Error loading activity summary:', error);
    summaryContent.innerHTML = '<p>加载失败</p>';
  }
}

/**
 * Validate form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} Is form valid
 */
function validateForm(form) {
  let isValid = true;

  // Clear previous errors
  const errorElements = form.querySelectorAll('.form-group__error');
  errorElements.forEach((el) => (el.textContent = ''));

  // Validate name
  const nameInput = form.querySelector('#user-name');
  if (!nameInput.value.trim()) {
    showFieldError(nameInput, '请输入姓名');
    isValid = false;
  }

  // Validate email
  const emailInput = form.querySelector('#user-email');
  if (!emailInput.value.trim()) {
    showFieldError(emailInput, '请输入邮箱');
    isValid = false;
  } else if (!isValidEmail(emailInput.value)) {
    showFieldError(emailInput, '请输入有效的邮箱地址');
    isValid = false;
  }

  // Validate phone
  const phoneInput = form.querySelector('#user-phone');
  if (!phoneInput.value.trim()) {
    showFieldError(phoneInput, '请输入电话号码');
    isValid = false;
  } else if (!isValidPhone(phoneInput.value)) {
    showFieldError(phoneInput, '请输入有效的电话号码');
    isValid = false;
  }

  // Validate date
  const dateInput = form.querySelector('#booking-date');
  if (!dateInput.value) {
    showFieldError(dateInput, '请选择日期');
    isValid = false;
  } else if (new Date(dateInput.value) < new Date()) {
    showFieldError(dateInput, '日期不能早于今天');
    isValid = false;
  }

  // Validate participant count
  const countInput = form.querySelector('#participant-count');
  const count = parseInt(countInput.value);
  if (!count || count < 1) {
    showFieldError(countInput, '参与人数至少为1');
    isValid = false;
  } else if (count > 10) {
    showFieldError(countInput, '参与人数不能超过10');
    isValid = false;
  }

  // Validate terms agreement
  const termsCheckbox = form.querySelector('#terms-agreement');
  if (!termsCheckbox.checked) {
    showFieldError(termsCheckbox, '请同意服务条款');
    isValid = false;
  }

  return isValid;
}

/**
 * Show field error
 * @param {HTMLInputElement} input - Input element
 * @param {string} message - Error message
 */
function showFieldError(input, message) {
  const errorId = input.getAttribute('aria-describedby');
  const errorElement = document.getElementById(errorId);

  if (errorElement) {
    errorElement.textContent = message;
  }

  input.setAttribute('aria-invalid', 'true');
  input.classList.add('form-group__input--error');
}

/**
 * Clear field error
 * @param {HTMLInputElement} input - Input element
 */
function clearFieldError(input) {
  const errorId = input.getAttribute('aria-describedby');
  const errorElement = document.getElementById(errorId);

  if (errorElement) {
    errorElement.textContent = '';
  }

  input.removeAttribute('aria-invalid');
  input.classList.remove('form-group__input--error');
}

/**
 * Add real-time validation
 * @param {HTMLFormElement} form - Form element
 */
function addRealTimeValidation(form) {
  const inputs = form.querySelectorAll('input, textarea');

  inputs.forEach((input) => {
    input.addEventListener('blur', () => {
      validateField(input);
    });

    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        validateField(input);
      }
    });
  });
}

/**
 * Validate individual field
 * @param {HTMLInputElement} input - Input element
 */
function validateField(input) {
  clearFieldError(input);

  const value = input.value.trim();
  const type = input.type;
  const name = input.name;

  if (input.required && !value) {
    showFieldError(input, '此字段为必填项');
    return;
  }

  if (type === 'email' && value && !isValidEmail(value)) {
    showFieldError(input, '请输入有效的邮箱地址');
    return;
  }

  if (type === 'tel' && value && !isValidPhone(value)) {
    showFieldError(input, '请输入有效的电话号码');
    return;
  }

  if (type === 'date' && value && new Date(value) < new Date()) {
    showFieldError(input, '日期不能早于今天');
    return;
  }

  if (type === 'number') {
    const num = parseInt(value);
    const min = parseInt(input.min);
    const max = parseInt(input.max);

    if (num < min) {
      showFieldError(input, `最小值为 ${min}`);
      return;
    }

    if (num > max) {
      showFieldError(input, `最大值为 ${max}`);
      return;
    }
  }

  if (type === 'checkbox' && input.required && !input.checked) {
    showFieldError(input, '请勾选此项');
    return;
  }
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid phone
 */
function isValidPhone(phone) {
  // Simple validation for Chinese phone numbers
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBookingForm);
} else {
  initBookingForm();
}
