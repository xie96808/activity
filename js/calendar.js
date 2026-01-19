/**
 * Calendar - Handles date selection and availability
 */

/**
 * Initialize calendar functionality
 */
function initCalendar() {
  const dateInput = document.getElementById('booking-date');
  if (!dateInput) return;

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  // Set maximum date to 3 months from now
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  dateInput.max = maxDate.toISOString().split('T')[0];

  // Add date change handler
  dateInput.addEventListener('change', handleDateChange);

  // Initialize with available dates (if needed)
  loadAvailableDates();
}

/**
 * Handle date change
 * @param {Event} event - Change event
 */
function handleDateChange(event) {
  const selectedDate = event.target.value;

  if (!selectedDate) return;

  // Validate date
  const date = new Date(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    alert('不能选择过去的日期');
    event.target.value = '';
    return;
  }

  // Check if date is available
  checkDateAvailability(selectedDate);
}

/**
 * Load available dates for the activity
 */
async function loadAvailableDates() {
  // Get activity ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get('activity_id');

  if (!activityId) return;

  try {
    // Fetch activity schedule from Supabase
    const { supabase } = await import('./supabase-client.js');
    const { data, error } = await supabase
      .from('activity_schedules')
      .select('date, available_slots')
      .eq('activity_id', activityId)
      .gte('date', new Date().toISOString().split('T')[0]);

    if (error) throw error;

    // Store available dates
    if (data && data.length > 0) {
      window.availableDates = data;
    }
  } catch (error) {
    console.error('Error loading available dates:', error);
  }
}

/**
 * Check if selected date is available
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
async function checkDateAvailability(dateString) {
  // Get activity ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get('activity_id');

  if (!activityId) return;

  try {
    // Check availability in Supabase
    const { supabase } = await import('./supabase-client.js');
    const { data, error } = await supabase
      .from('activity_schedules')
      .select('available_slots, booked_slots')
      .eq('activity_id', activityId)
      .eq('date', dateString)
      .single();

    if (error) {
      console.warn('No schedule found for this date');
      return;
    }

    // Check if slots are available
    if (data && data.available_slots <= data.booked_slots) {
      alert('该日期已满，请选择其他日期');
      document.getElementById('booking-date').value = '';
      return;
    }

    // Show available slots info
    showAvailabilityInfo(data);
  } catch (error) {
    console.error('Error checking date availability:', error);
  }
}

/**
 * Show availability information
 * @param {Object} scheduleData - Schedule data
 */
function showAvailabilityInfo(scheduleData) {
  const dateInput = document.getElementById('booking-date');
  if (!dateInput) return;

  const availableSlots = scheduleData.available_slots - scheduleData.booked_slots;

  // Create or update info element
  let infoElement = document.getElementById('date-availability-info');
  if (!infoElement) {
    infoElement = document.createElement('div');
    infoElement.id = 'date-availability-info';
    infoElement.className = 'form-group__hint';
    dateInput.parentElement.appendChild(infoElement);
  }

  infoElement.textContent = `剩余名额: ${availableSlots}`;
  infoElement.style.color = availableSlots < 5 ? 'var(--color-warning)' : 'var(--color-success)';
}

/**
 * Create a simple calendar widget (optional enhancement)
 * This is a basic implementation that can be enhanced with a library like flatpickr
 */
function createCalendarWidget() {
  const dateInput = document.getElementById('booking-date');
  if (!dateInput) return;

  // Add calendar icon
  const calendarIcon = document.createElement('span');
  calendarIcon.className = 'calendar-icon';
  calendarIcon.innerHTML = '📅';
  calendarIcon.setAttribute('aria-hidden', 'true');

  // Insert icon after input
  dateInput.parentElement.style.position = 'relative';
  dateInput.parentElement.appendChild(calendarIcon);

  // Style the icon
  calendarIcon.style.position = 'absolute';
  calendarIcon.style.right = '10px';
  calendarIcon.style.top = '50%';
  calendarIcon.style.transform = 'translateY(-50%)';
  calendarIcon.style.pointerEvents = 'none';
}

/**
 * Get disabled dates (dates that are fully booked)
 * @returns {Promise<Array>} Array of disabled date strings
 */
async function getDisabledDates() {
  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get('activity_id');

  if (!activityId) return [];

  try {
    const { supabase } = await import('./supabase-client.js');
    const { data, error } = await supabase
      .from('activity_schedules')
      .select('date')
      .eq('activity_id', activityId)
      .gte('date', new Date().toISOString().split('T')[0])
      .filter('available_slots', 'lte', 'booked_slots');

    if (error) throw error;

    return data ? data.map((item) => item.date) : [];
  } catch (error) {
    console.error('Error getting disabled dates:', error);
    return [];
  }
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  return date.toLocaleDateString('zh-CN', options);
}

/**
 * Get day of week
 * @param {string} dateString - ISO date string
 * @returns {string} Day of week
 */
function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

/**
 * Check if date is weekend
 * @param {string} dateString - ISO date string
 * @returns {boolean} Is weekend
 */
function isWeekend(dateString) {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Initialize calendar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendar);
} else {
  initCalendar();
}

// Export functions for use in other modules
export {
  initCalendar,
  checkDateAvailability,
  getDisabledDates,
  formatDateForDisplay,
  getDayOfWeek,
  isWeekend,
};
