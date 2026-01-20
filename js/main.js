/**
 * Main JavaScript - Core functionality and initialization
 */

import { isAuthenticated, getCurrentUser } from './supabase-client.js';

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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

