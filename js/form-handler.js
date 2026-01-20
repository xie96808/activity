/**
 * Form Handler - Handles guitar repair form validation and submission
 */

import { createRepairOrder } from './supabase-client.js';
import { uploadImage } from './image-upload.js';
import { initImageUpload } from './image-upload.js';
import { initRepairCalendar } from './repair-calendar.js';

/**
 * Initialize repair form
 */
async function initRepairForm() {
  const form = document.getElementById('repair-form');
  if (!form) return;

  // Initialize image upload
  initImageUpload('guitar-image', 'preview-img', 'image-preview');

  // Initialize repair calendar
  initRepairCalendar('appointment-date', 'time-slots-container', 'appointment-time');

  // Add form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm(form)) {
      return;
    }

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '提交中...';

    try {
      // Get form data
      const formData = new FormData(form);

      // Upload image if provided
      let imageUrl = null;
      const imageFile = formData.get('guitarImage');
      if (imageFile && imageFile.size > 0) {
        const uploadResult = await uploadImage(imageFile);
        if (uploadResult.success) {
          imageUrl = uploadResult.url;
        } else {
          showError(`图片上传失败：${uploadResult.error}`);
          submitButton.disabled = false;
          submitButton.textContent = originalText;
          return;
        }
      }

      // Prepare repair order data
      const repairData = {
        customer_name: formData.get('userPhone'), // 使用电话号码作为客户标识
        customer_email: formData.get('userPhone') + '@phone.local', // 生成虚拟邮箱
        customer_phone: formData.get('userPhone'),
        guitar_type: formData.get('guitarType'),
        guitar_brand: formData.get('guitarBrand') || null,
        guitar_model: formData.get('guitarModel') || null,
        problem_description: formData.get('problemDescription'),
        image_url: imageUrl,
        appointment_date: formData.get('appointmentDate'),
        appointment_time: formData.get('appointmentTime'),
        expected_completion_date: formData.get('expectedCompletionDate'),
        status: 'pending',
      };

      // Submit repair order
      const result = await createRepairOrder(repairData);

      // Hide loading state
      submitButton.disabled = false;
      submitButton.textContent = originalText;

      // Show result
      if (result.success) {
        showSuccess('维修单提交成功！我们会尽快与您联系确认。');
        form.reset();

        // Clear image preview
        const previewContainer = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        if (previewContainer) previewContainer.style.display = 'none';
        if (previewImg) previewImg.src = '';

        // Clear time slots
        const timeSlotsContainer = document.getElementById('time-slots-container');
        if (timeSlotsContainer) {
          timeSlotsContainer.innerHTML = '<p class="time-slots__hint">请先选择日期</p>';
        }

        // Redirect to home page after 2 seconds
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      } else {
        showError(`提交失败：${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting repair order:', error);
      showError('提交失败，请重试');
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  // Add real-time validation
  addRealTimeValidation(form);
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

  // Validate phone
  const phoneInput = form.querySelector('#user-phone');
  if (!phoneInput.value.trim()) {
    showFieldError(phoneInput, '请输入电话号码');
    isValid = false;
  } else if (!isValidPhone(phoneInput.value)) {
    showFieldError(phoneInput, '请输入有效的电话号码');
    isValid = false;
  }

  // Validate guitar type
  const guitarTypeInput = form.querySelector('#guitar-type');
  if (!guitarTypeInput.value) {
    showFieldError(guitarTypeInput, '请选择吉他类型');
    isValid = false;
  }

  // Validate problem description
  const problemInput = form.querySelector('#problem-description');
  if (!problemInput.value.trim()) {
    showFieldError(problemInput, '请描述吉他的问题');
    isValid = false;
  } else if (problemInput.value.trim().length < 10) {
    showFieldError(problemInput, '问题描述至少需要10个字符');
    isValid = false;
  }

  // Validate appointment date
  const dateInput = form.querySelector('#appointment-date');
  if (!dateInput.value) {
    showFieldError(dateInput, '请选择预约日期');
    isValid = false;
  } else {
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      showFieldError(dateInput, '日期不能早于今天');
      isValid = false;
    }
  }

  // Validate appointment time
  const timeInput = form.querySelector('#appointment-time');
  if (!timeInput.value) {
    showFieldError(timeInput, '请选择预约时间段');
    isValid = false;
  }

  // Validate expected completion date
  const completionDateInput = form.querySelector('#expected-completion-date');
  if (!completionDateInput.value) {
    showFieldError(completionDateInput, '请选择期望完成日期');
    isValid = false;
  } else {
    const appointmentDate = new Date(dateInput.value);
    const completionDate = new Date(completionDateInput.value);

    if (completionDate < appointmentDate) {
      showFieldError(completionDateInput, '完成日期不能早于预约日期');
      isValid = false;
    }
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
  const inputs = form.querySelectorAll('input, textarea, select');

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
  const id = input.id;

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

  if (type === 'date' && value) {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      showFieldError(input, '日期不能早于今天');
      return;
    }
  }

  if (id === 'problem-description' && value && value.length < 10) {
    showFieldError(input, '问题描述至少需要10个字符');
    return;
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

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  const statusContainer = document.getElementById('form-status');
  if (statusContainer) {
    statusContainer.innerHTML = `
      <div style="padding: 1rem; background-color: #d1fae5; color: #065f46; border-radius: 0.5rem; margin-top: 1rem;">
        ${message}
      </div>
    `;
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const statusContainer = document.getElementById('form-status');
  if (statusContainer) {
    statusContainer.innerHTML = `
      <div style="padding: 1rem; background-color: #fee2e2; color: #991b1b; border-radius: 0.5rem; margin-top: 1rem;">
        ${message}
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRepairForm);
} else {
  initRepairForm();
}
