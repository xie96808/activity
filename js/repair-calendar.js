/**
 * Repair Calendar Module
 * Manages time slot selection and availability for guitar repair appointments
 */

import { supabase } from './supabase-client.js';

// Business hours configuration
const BUSINESS_HOURS = {
  start: 9, // 9:00 AM
  end: 18,  // 6:00 PM
  workDays: [1, 2, 3, 4, 5] // Monday to Friday
};

// Time slot status thresholds
const STATUS_THRESHOLDS = {
  idle: 1,    // <= 1 booking
  normal: 3,  // 2-3 bookings
  busy: 4     // > 3 bookings
};

/**
 * Generate time slots for a day
 * @returns {Array<{time: string, label: string}>}
 */
export function generateTimeSlots() {
  const slots = [];

  for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    const timeSlot = `${startTime}-${endTime}`;

    slots.push({
      time: timeSlot,
      label: timeSlot
    });
  }

  return slots;
}

/**
 * Check if a date is a workday
 * @param {Date} date
 * @returns {boolean}
 */
export function isWorkday(date) {
  const dayOfWeek = date.getDay();
  return BUSINESS_HOURS.workDays.includes(dayOfWeek);
}

/**
 * Get booking counts for each time slot on a specific date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Promise<Map<string, number>>}
 */
export async function getTimeSlotBookings(dateString) {
  try {
    const { data, error } = await supabase
      .from('guitar_repairs')
      .select('appointment_time')
      .eq('appointment_date', dateString)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error fetching bookings:', error);
      return new Map();
    }

    // Count bookings per time slot
    const bookingCounts = new Map();
    data.forEach(booking => {
      const time = booking.appointment_time;
      bookingCounts.set(time, (bookingCounts.get(time) || 0) + 1);
    });

    return bookingCounts;
  } catch (error) {
    console.error('Error in getTimeSlotBookings:', error);
    return new Map();
  }
}

/**
 * Get status for a time slot based on booking count
 * @param {number} bookingCount
 * @returns {string} 'idle' | 'normal' | 'busy'
 */
export function getTimeSlotStatus(bookingCount) {
  if (bookingCount <= STATUS_THRESHOLDS.idle) {
    return 'idle';
  } else if (bookingCount <= STATUS_THRESHOLDS.normal) {
    return 'normal';
  } else {
    return 'busy';
  }
}

/**
 * Get status label in Chinese
 * @param {string} status
 * @returns {string}
 */
export function getStatusLabel(status) {
  const labels = {
    idle: '空闲',
    normal: '一般',
    busy: '繁忙'
  };
  return labels[status] || '未知';
}

/**
 * Render time slots for a specific date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {HTMLElement} container - Container element to render slots
 * @param {Function} onSelect - Callback when a slot is selected
 */
export async function renderTimeSlots(dateString, container, onSelect) {
  if (!container) {
    console.error('Container element not found');
    return;
  }

  // Check if date is valid
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    container.innerHTML = '<p class="time-slots__hint">不能选择过去的日期</p>';
    return;
  }

  // Check if it's a workday
  if (!isWorkday(selectedDate)) {
    container.innerHTML = '<p class="time-slots__hint">维修店周末不营业，请选择工作日</p>';
    return;
  }

  // Show loading state
  container.innerHTML = '<p class="time-slots__hint">加载时间段...</p>';

  try {
    // Get booking counts
    const bookingCounts = await getTimeSlotBookings(dateString);

    // Generate time slots
    const slots = generateTimeSlots();

    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'time-slots__grid';

    slots.forEach(slot => {
      const bookingCount = bookingCounts.get(slot.time) || 0;
      const status = getTimeSlotStatus(bookingCount);
      const statusLabel = getStatusLabel(status);

      const slotElement = document.createElement('div');
      slotElement.className = 'time-slot';
      slotElement.dataset.time = slot.time;
      slotElement.dataset.status = status;

      slotElement.innerHTML = `
        <div class="time-slot__time">${slot.label}</div>
        <span class="time-slot__status time-slot__status--${status}">${statusLabel}</span>
      `;

      slotElement.addEventListener('click', () => {
        // Remove previous selection
        grid.querySelectorAll('.time-slot').forEach(el => {
          el.classList.remove('time-slot--selected');
        });

        // Add selection to clicked slot
        slotElement.classList.add('time-slot--selected');

        // Call callback
        if (onSelect) {
          onSelect(slot.time, status);
        }
      });

      grid.appendChild(slotElement);
    });

    container.innerHTML = '';
    container.appendChild(grid);
  } catch (error) {
    console.error('Error rendering time slots:', error);
    container.innerHTML = '<p class="time-slots__hint">加载时间段失败，请刷新重试</p>';
  }
}

/**
 * Set minimum and maximum dates for date input
 * @param {HTMLInputElement} dateInput
 */
export function setDateConstraints(dateInput) {
  if (!dateInput) return;

  // Set minimum date to today
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  dateInput.min = minDate;

  // Set maximum date to 30 days from now
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  dateInput.max = maxDate.toISOString().split('T')[0];
}

/**
 * Initialize repair calendar
 * @param {string} dateInputId - Date input element ID
 * @param {string} timeSlotContainerId - Time slot container element ID
 * @param {string} hiddenTimeInputId - Hidden input to store selected time
 */
export function initRepairCalendar(dateInputId, timeSlotContainerId, hiddenTimeInputId) {
  const dateInput = document.getElementById(dateInputId);
  const container = document.getElementById(timeSlotContainerId);
  const hiddenTimeInput = document.getElementById(hiddenTimeInputId);

  if (!dateInput || !container || !hiddenTimeInput) {
    console.error('Calendar elements not found');
    return;
  }

  // Set date constraints
  setDateConstraints(dateInput);

  // Handle date change
  dateInput.addEventListener('change', async (e) => {
    const selectedDate = e.target.value;

    if (!selectedDate) {
      container.innerHTML = '<p class="time-slots__hint">请先选择日期</p>';
      hiddenTimeInput.value = '';
      return;
    }

    // Render time slots
    await renderTimeSlots(selectedDate, container, (time, status) => {
      hiddenTimeInput.value = time;

      // Clear any previous error
      const errorElement = document.getElementById('appointment-time-error');
      if (errorElement) {
        errorElement.textContent = '';
      }
    });
  });
}
