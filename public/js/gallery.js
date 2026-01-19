/**
 * Gallery - Handles activity listing and filtering
 */

import { fetchActivities } from './supabase-client.js';
import { showLoading, hideLoading, formatDate, debounce } from './main.js';

let allActivities = [];
let filteredActivities = [];

/**
 * Initialize gallery
 */
async function initGallery() {
  // Load activities
  await loadActivities();

  // Initialize filters
  initFilters();

  // Load featured activities on home page
  loadFeaturedActivities();
}

/**
 * Load all activities
 */
async function loadActivities() {
  const activitiesList = document.getElementById('activities-list');
  const loadingIndicator = document.getElementById('loading-indicator');
  const emptyState = document.getElementById('empty-state');

  if (!activitiesList) return;

  // Show loading state
  if (loadingIndicator) {
    loadingIndicator.hidden = false;
  }

  // Fetch activities from Supabase
  const result = await fetchActivities();

  // Hide loading state
  if (loadingIndicator) {
    loadingIndicator.hidden = true;
  }

  if (result.success && result.data.length > 0) {
    allActivities = result.data;
    filteredActivities = [...allActivities];
    renderActivities(filteredActivities);
  } else {
    // Show empty state
    if (emptyState) {
      emptyState.hidden = false;
    }
  }
}

/**
 * Render activities
 * @param {Array} activities - Array of activity objects
 */
function renderActivities(activities) {
  const activitiesList = document.getElementById('activities-list');
  if (!activitiesList) return;

  if (activities.length === 0) {
    activitiesList.innerHTML = '<p class="activities__empty">未找到符合条件的活动</p>';
    return;
  }

  activitiesList.innerHTML = activities
    .map((activity) => createActivityCard(activity))
    .join('');
}

/**
 * Create activity card HTML
 * @param {Object} activity - Activity object
 * @returns {string} HTML string
 */
function createActivityCard(activity) {
  return `
    <article class="activity-card">
      <img
        src="${activity.image_url || 'images/guitars/placeholder.jpg'}"
        alt="${activity.title}"
        class="activity-card__image"
        loading="lazy"
      >
      <div class="activity-card__content">
        <h3 class="activity-card__title">${activity.title}</h3>
        <div class="activity-card__meta">
          <span>${formatDate(activity.date)}</span> •
          <span>${activity.time}</span> •
          <span>${activity.location}</span>
        </div>
        <p class="activity-card__description">
          ${truncateText(activity.description, 100)}
        </p>
        <div class="activity-card__actions">
          <a href="activity-detail.html?id=${activity.id}" class="button button--primary">
            查看详情
          </a>
          <a href="booking.html?activity_id=${activity.id}" class="button button--secondary">
            立即预约
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Initialize filters
 */
function initFilters() {
  const categoryFilter = document.getElementById('filter-category');
  const searchInput = document.getElementById('filter-search');
  const applyButton = document.getElementById('apply-filters');

  if (!categoryFilter && !searchInput) return;

  // Apply filters on button click
  if (applyButton) {
    applyButton.addEventListener('click', applyFilters);
  }

  // Apply filters on enter key in search
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyFilters();
      }
    });

    // Debounced search
    searchInput.addEventListener(
      'input',
      debounce(() => {
        applyFilters();
      }, 500)
    );
  }

  // Apply filters on category change
  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilters);
  }
}

/**
 * Apply filters to activities
 */
function applyFilters() {
  const categoryFilter = document.getElementById('filter-category');
  const searchInput = document.getElementById('filter-search');

  let filtered = [...allActivities];

  // Filter by category
  if (categoryFilter && categoryFilter.value) {
    filtered = filtered.filter(
      (activity) => activity.category === categoryFilter.value
    );
  }

  // Filter by search term
  if (searchInput && searchInput.value.trim()) {
    const searchTerm = searchInput.value.trim().toLowerCase();
    filtered = filtered.filter(
      (activity) =>
        activity.title.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm)
    );
  }

  filteredActivities = filtered;
  renderActivities(filteredActivities);
}

/**
 * Load featured activities on home page
 */
async function loadFeaturedActivities() {
  const featuredGrid = document.getElementById('featured-activities');
  if (!featuredGrid) return;

  // Show loading state
  showLoading(featuredGrid);

  // Fetch activities
  const result = await fetchActivities();

  // Hide loading state
  hideLoading(featuredGrid);

  if (result.success && result.data.length > 0) {
    // Show first 3 activities as featured
    const featured = result.data.slice(0, 3);
    featuredGrid.innerHTML = featured
      .map((activity) => createActivityCard(activity))
      .join('');
  } else {
    featuredGrid.innerHTML = '<p>暂无精选活动</p>';
  }
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Load activity detail
 */
async function loadActivityDetail() {
  const activityContent = document.getElementById('activity-content');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorState = document.getElementById('error-state');

  if (!activityContent) return;

  // Get activity ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get('id');

  if (!activityId) {
    if (loadingIndicator) loadingIndicator.hidden = true;
    if (errorState) errorState.hidden = false;
    return;
  }

  // Show loading state
  if (loadingIndicator) loadingIndicator.hidden = false;

  // Fetch activity
  const { fetchActivityById } = await import('./supabase-client.js');
  const result = await fetchActivityById(activityId);

  // Hide loading state
  if (loadingIndicator) loadingIndicator.hidden = true;

  if (result.success && result.data) {
    const activity = result.data;

    // Populate activity details
    document.getElementById('activity-image').src =
      activity.image_url || 'images/guitars/placeholder.jpg';
    document.getElementById('activity-image').alt = activity.title;
    document.getElementById('activity-title').textContent = activity.title;
    document.getElementById('activity-category').textContent = activity.category;
    document.getElementById('activity-date').textContent = formatDate(activity.date);
    document.getElementById('activity-time').textContent = activity.time;
    document.getElementById('activity-location').textContent = activity.location;
    document.getElementById('activity-capacity').textContent =
      activity.capacity - activity.booked_count || activity.capacity;
    document.getElementById('activity-description').textContent = activity.description;

    // Update booking link
    const bookingLink = document.getElementById('booking-link');
    if (bookingLink) {
      bookingLink.href = `booking.html?activity_id=${activity.id}`;
    }

    // Show content
    activityContent.hidden = false;
  } else {
    // Show error state
    if (errorState) errorState.hidden = false;
  }
}

// Initialize based on current page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('activities-list')) {
      initGallery();
    } else if (document.getElementById('activity-detail')) {
      loadActivityDetail();
    } else if (document.getElementById('featured-activities')) {
      loadFeaturedActivities();
    }
  });
} else {
  if (document.getElementById('activities-list')) {
    initGallery();
  } else if (document.getElementById('activity-detail')) {
    loadActivityDetail();
  } else if (document.getElementById('featured-activities')) {
    loadFeaturedActivities();
  }
}
