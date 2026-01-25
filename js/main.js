/**
 * Main JavaScript - Core functionality and initialization
 */

import { isAuthenticated, getCurrentUser } from './supabase-client.js';
import { supabase } from './supabase-client.js';

/**
 * Initialize the application
 */
async function init() {
  // Initialize mobile menu
  initMobileMenu();

  // Check authentication status
  await checkAuthStatus();

  // Initialize scroll reveal animations
  initScrollReveal();

  // Add keyboard navigation support
  initKeyboardNavigation();

  // Initialize home calendar if on home page
  if (document.getElementById('view-calendar-btn')) {
    initHomeCalendar();
  }

  // Initialize address modal if on home page
  if (document.getElementById('view-address-btn') || document.getElementById('view-address-btn-hero')) {
    initAddressModal();
  }

  // Initialize wechat modal if on home page
  if (document.getElementById('view-wechat-btn')) {
    initWechatModal();
  }
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('.header__menu-toggle');
  const menu = document.querySelector('.header__menu');

  if (!menuToggle || !menu) return;

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';

    menuToggle.setAttribute('aria-expanded', !isExpanded);
    menu.classList.toggle('header__menu--open');

    // Trap focus within menu when open
    if (!isExpanded) {
      trapFocus(menu);
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !menu.contains(e.target)) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('header__menu--open');
    }
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('header__menu--open')) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('header__menu--open');
      menuToggle.focus();
    }
  });
}

/**
 * Check authentication status and update UI
 */
async function checkAuthStatus() {
  // Authentication check removed - this system doesn't require user login
  // Only admins need to login via admin.html
}

/**
 * Initialize scroll reveal animations
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.scroll-reveal');

  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
}

/**
 * Initialize keyboard navigation
 */
function initKeyboardNavigation() {
  // Add keyboard support for custom interactive elements
  const interactiveElements = document.querySelectorAll('[role="button"]:not(button)');

  interactiveElements.forEach((element) => {
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        element.click();
      }
    });
  });
}

/**
 * Trap focus within an element (for modals and menus)
 * @param {HTMLElement} element - Element to trap focus within
 */
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}

/**
 * Show loading state
 * @param {HTMLElement} element - Element to show loading state in
 */
export function showLoading(element) {
  if (!element) return;

  element.innerHTML = '<div class="loading-spinner"></div>';
  element.setAttribute('aria-busy', 'true');
}

/**
 * Hide loading state
 * @param {HTMLElement} element - Element to hide loading state from
 */
export function hideLoading(element) {
  if (!element) return;

  element.innerHTML = '';
  element.setAttribute('aria-busy', 'false');
}

/**
 * Show error message
 * @param {string} message - Error message to display
 * @param {HTMLElement} container - Container to display error in
 */
export function showError(message, container) {
  if (!container) return;

  container.innerHTML = `
    <div class="error-message" role="alert">
      ${message}
    </div>
  `;
}

/**
 * Show success message
 * @param {string} message - Success message to display
 * @param {HTMLElement} container - Container to display success in
 */
export function showSuccess(message, container) {
  if (!container) return;

  container.innerHTML = `
    <div class="success-message" role="status">
      ${message}
    </div>
  `;
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for display
 * @param {string} timeString - Time string
 * @returns {string} Formatted time
 */
export function formatTime(timeString) {
  return timeString;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Initialize home page calendar
 */
function initHomeCalendar() {
  const viewCalendarBtn = document.getElementById('view-calendar-btn');
  const calendarModal = document.getElementById('calendar-modal');
  const modalOverlay = calendarModal?.querySelector('.modal__overlay');
  const modalClose = calendarModal?.querySelector('.modal__close');

  if (!viewCalendarBtn || !calendarModal) return;

  // Current month and year for calendar
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  // Open calendar modal
  viewCalendarBtn.addEventListener('click', () => {
    calendarModal.style.display = 'block';
    renderCalendar(currentMonth, currentYear);
  });

  // Close modal handlers
  const closeModal = () => {
    calendarModal.style.display = 'none';
  };

  modalOverlay?.addEventListener('click', closeModal);
  modalClose?.addEventListener('click', closeModal);

  // Month navigation
  const prevBtn = document.getElementById('prev-month-btn-home');
  const nextBtn = document.getElementById('next-month-btn-home');

  prevBtn?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
  });

  nextBtn?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  });

  /**
   * Render calendar for home page
   */
  async function renderCalendar(month, year) {
    const calendarGrid = document.getElementById('calendar-grid-home');
    const monthTitle = document.getElementById('calendar-month-title-home');

    if (!calendarGrid || !monthTitle) return;

    // Update title
    monthTitle.textContent = `${year}年${month + 1}月`;

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Fetch bookings for this month
    const bookings = await fetchBookingsForMonth(year, month);

    // Build calendar HTML
    let html = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; text-align: center;">';

    // Add weekday headers
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
      html += `<div style="font-weight: 600; color: #d4af37; padding: 8px; font-size: 0.875rem;">${day}</div>`;
    });

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      html += '<div></div>';
    }

    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const bookingCount = bookings[dateStr] || 0;

      let statusColor = '#10b981'; // Green - idle
      let statusClass = 'calendar-cell--idle';
      let statusText = '空闲';

      if (bookingCount > 6) {
        statusColor = '#ef4444'; // Red - busy
        statusClass = 'calendar-cell--busy';
        statusText = '繁忙';
      } else if (bookingCount >= 4) {
        statusColor = '#f59e0b'; // Orange - normal
        statusClass = 'calendar-cell--normal';
        statusText = '一般';
      }

      const isToday = day === currentDate.getDate() &&
                     month === currentDate.getMonth() &&
                     year === currentDate.getFullYear();

      html += `
        <div class="calendar-cell ${statusClass} ${isToday ? 'calendar-cell--today' : ''}"
             style="padding: 16px; border-radius: 8px; background: #ffffff;
                    border: 2px solid ${statusColor}; transition: all 0.2s;
                    ${isToday ? 'box-shadow: 0 0 10px ' + statusColor + ';' : ''}">
          <div style="font-weight: 600; color: #333333; font-size: 1.125rem;">${day}</div>
        </div>
      `;
    }

    html += '</div>';
    calendarGrid.innerHTML = html;
  }

  /**
   * Fetch bookings for a specific month
   */
  async function fetchBookingsForMonth(year, month) {
    try {
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('guitar_repairs')
        .select('appointment_date')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .not('status', 'eq', 'cancelled');

      if (error) throw error;

      // Count bookings per day
      const bookings = {};
      data?.forEach(booking => {
        const date = booking.appointment_date;
        bookings[date] = (bookings[date] || 0) + 1;
      });

      return bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return {};
    }
  }
}

/**
 * Initialize address modal
 */
function initAddressModal() {
  const viewAddressBtn = document.getElementById('view-address-btn');
  const viewAddressBtnHero = document.getElementById('view-address-btn-hero');
  const addressModal = document.getElementById('address-modal');
  const modalOverlay = addressModal?.querySelector('.modal__overlay');
  const modalClose = addressModal?.querySelector('.modal__close');

  if (!addressModal) return;

  // Open address modal function
  const openModal = () => {
    addressModal.style.display = 'block';
    // Reset scroll position to top when opening
    setTimeout(() => {
      const modalBody = addressModal.querySelector('.modal__body');
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    }, 0);
  };

  // Attach click handlers to both buttons if they exist
  if (viewAddressBtn) {
    viewAddressBtn.addEventListener('click', openModal);
  }

  if (viewAddressBtnHero) {
    viewAddressBtnHero.addEventListener('click', openModal);
  }

  // Close modal handlers
  const closeModal = () => {
    addressModal.style.display = 'none';
  };

  modalOverlay?.addEventListener('click', closeModal);
  modalClose?.addEventListener('click', closeModal);

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && addressModal.style.display === 'block') {
      closeModal();
    }
  });
}

/**
 * Initialize wechat modal
 */
function initWechatModal() {
  const viewWechatBtn = document.getElementById('view-wechat-btn');
  const wechatModal = document.getElementById('wechat-modal');
  const modalOverlay = wechatModal?.querySelector('.modal__overlay');
  const modalClose = wechatModal?.querySelector('.modal__close');

  if (!viewWechatBtn || !wechatModal) return;

  // Open wechat modal
  viewWechatBtn.addEventListener('click', () => {
    wechatModal.style.display = 'block';
  });

  // Close modal handlers
  const closeModal = () => {
    wechatModal.style.display = 'none';
  };

  modalOverlay?.addEventListener('click', closeModal);
  modalClose?.addEventListener('click', closeModal);

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wechatModal.style.display === 'block') {
      closeModal();
    }
  });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

