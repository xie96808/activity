/**
 * Admin Dashboard - Main functionality
 */

import {
  checkAuth,
  signOut,
  fetchRepairOrders,
  fetchRepairOrderById,
  updateRepairOrderStatus,
  deleteRepairOrder,
  supabase
} from './supabase-client.js';

// State
let currentOrders = [];
let currentFilter = { status: '', date: '', phone: '' };
let currentMonth = new Date();
let calendarData = new Map();

/**
 * Initialize admin dashboard
 */
async function initAdminDashboard() {
  // Check authentication
  const authResult = await checkAuth();
  if (!authResult.authenticated) {
    window.location.href = 'admin.html';
    return;
  }

  // Display admin email
  const adminEmailEl = document.getElementById('admin-email');
  if (adminEmailEl && authResult.user) {
    adminEmailEl.textContent = authResult.user.email;
  }

  // Setup event listeners
  setupEventListeners();

  // Load initial data
  await loadOrders();
  await loadCalendar();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Tab switching
  const tabs = document.querySelectorAll('.tabs__tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Orders tab filters
  const statusFilter = document.getElementById('status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', async (e) => {
      currentFilter.status = e.target.value;
      await loadOrders();
    });
  }

  const dateFilter = document.getElementById('date-filter');
  if (dateFilter) {
    dateFilter.addEventListener('change', async (e) => {
      currentFilter.date = e.target.value;
      await loadOrders();
    });
  }

  const phoneSearch = document.getElementById('phone-search');
  if (phoneSearch) {
    phoneSearch.addEventListener('input', async (e) => {
      currentFilter.phone = e.target.value;
      await loadOrders();
    });
  }

  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadOrders();
    });
  }

  // Modal close buttons
  const modalCloseBtns = document.querySelectorAll('.modal__close');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalOverlays = document.querySelectorAll('.modal__overlay');

  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', closeModal);
  });

  // Status modal events
  const cancelStatusBtn = document.getElementById('cancel-status-btn');
  const confirmStatusBtn = document.getElementById('confirm-status-btn');
  const statusModalOverlay = document.getElementById('status-modal')?.querySelector('.modal__overlay');
  const statusModalClose = document.getElementById('status-modal')?.querySelector('.modal__close');

  if (cancelStatusBtn) {
    cancelStatusBtn.addEventListener('click', closeStatusModal);
  }
  if (confirmStatusBtn) {
    confirmStatusBtn.addEventListener('click', confirmStatusChange);
  }
  if (statusModalOverlay) {
    statusModalOverlay.addEventListener('click', closeStatusModal);
  }
  if (statusModalClose) {
    statusModalClose.addEventListener('click', closeStatusModal);
  }

  // Calendar navigation
  const prevMonthBtn = document.getElementById('prev-month-btn');
  const nextMonthBtn = document.getElementById('next-month-btn');

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      loadCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      loadCalendar();
    });
  }

  // Quick actions
  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', handleExportCSV);
  }

  const batchUpdateBtn = document.getElementById('batch-update-btn');
  if (batchUpdateBtn) {
    batchUpdateBtn.addEventListener('click', handleBatchUpdate);
  }

  // Work Orders tab filters
  const woStatusFilter = document.getElementById('wo-status-filter');
  if (woStatusFilter) {
    woStatusFilter.addEventListener('change', async (e) => {
      await loadWorkOrders();
    });
  }

  const woDateFilter = document.getElementById('wo-date-filter');
  if (woDateFilter) {
    woDateFilter.addEventListener('change', async (e) => {
      await loadWorkOrders();
    });
  }

  const woPhoneSearch = document.getElementById('wo-phone-search');
  if (woPhoneSearch) {
    woPhoneSearch.addEventListener('input', async (e) => {
      await loadWorkOrders();
    });
  }

  const woRefreshBtn = document.getElementById('wo-refresh-btn');
  if (woRefreshBtn) {
    woRefreshBtn.addEventListener('click', async () => {
      await loadWorkOrders();
    });
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  const result = await signOut();
  if (result.success) {
    window.location.href = 'admin.html';
  } else {
    alert('退出登录失败，请重试');
  }
}

/**
 * Switch tab
 */
function switchTab(tabName) {
  // Update tab buttons
  const tabs = document.querySelectorAll('.tabs__tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('tabs__tab--active');
      tab.setAttribute('aria-selected', 'true');
    } else {
      tab.classList.remove('tabs__tab--active');
      tab.setAttribute('aria-selected', 'false');
    }
  });

  // Update tab content
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.style.display = 'none';
    content.classList.remove('tab-content--active');
  });

  const activeContent = document.getElementById(`tab-${tabName}`);
  if (activeContent) {
    activeContent.style.display = 'block';
    activeContent.classList.add('tab-content--active');
  }

  // Load data for specific tabs
  if (tabName === 'workorders') {
    loadWorkOrders();
  }
}

/**
 * Load orders from database
 */
async function loadOrders() {
  const container = document.getElementById('orders-container');
  if (!container) return;

  // Show loading
  container.innerHTML = '<p style="text-align: center; padding: 2rem;">加载中...</p>';

  try {
    // Build filters
    const filters = {};
    if (currentFilter.status) {
      filters.status = currentFilter.status;
    }
    if (currentFilter.date) {
      filters.startDate = currentFilter.date;
      filters.endDate = currentFilter.date;
    }

    // Fetch orders
    const result = await fetchRepairOrders(filters);

    if (result.success) {
      currentOrders = result.data;

      // Filter by phone if needed
      if (currentFilter.phone) {
        currentOrders = currentOrders.filter(order =>
          order.customer_phone.includes(currentFilter.phone)
        );
      }

      renderOrders(currentOrders);
      updateStatistics();
    } else {
      container.innerHTML = `<p style="text-align: center; padding: 2rem; color: #ef4444;">加载失败: ${result.error}</p>`;
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #ef4444;">加载失败，请刷新重试</p>';
  }
}

/**
 * Render orders list
 */
function renderOrders(orders) {
  const container = document.getElementById('orders-container');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">暂无订单</p>';
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-card__header">
        <h3 class="order-card__title">订单 #${order.id.substring(0, 8)}</h3>
        <span class="order-card__status order-card__status--${order.status}" onclick="window.quickChangeStatus('${order.id}', '${order.status}', this)" title="点击快速修改状态">${getStatusLabel(order.status)}</span>
      </div>
      <div class="order-card__body">
        <div class="order-card__info">
          <p><strong>客户电话:</strong> ${order.customer_phone}</p>
          <p><strong>吉他类型:</strong> ${getGuitarTypeLabel(order.guitar_type)}</p>
          <p><strong>品牌/型号:</strong> ${order.guitar_brand || '未填写'} ${order.guitar_model || ''}</p>
        </div>
        <div class="order-card__info">
          <p><strong>预约时间:</strong> ${order.appointment_date} ${order.appointment_time}</p>
          <p><strong>期望完成:</strong> ${order.expected_completion_date}</p>
          <p><strong>创建时间:</strong> ${formatDateTime(order.created_at)}</p>
        </div>
        <div class="order-card__info">
          <p><strong>问题描述:</strong> ${order.problem_description.substring(0, 100)}${order.problem_description.length > 100 ? '...' : ''}</p>
        </div>
      </div>
      <div class="order-card__actions">
        <button class="button button--small button--primary" onclick="window.viewOrderDetail('${order.id}')">查看详情</button>
        <button class="button button--small button--secondary" onclick="window.changeOrderStatus('${order.id}', '${order.status}')">更改订单状态</button>
        ${order.status === 'cancelled' ? `<button class="button button--small button--danger" onclick="window.deleteOrder('${order.id}')">删除</button>` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * View order detail
 */
async function viewOrderDetail(orderId) {
  const modal = document.getElementById('order-modal');
  const detailContainer = document.getElementById('order-detail');

  if (!modal || !detailContainer) return;

  // Show modal
  modal.style.display = 'block';
  detailContainer.innerHTML = '<p style="text-align: center; padding: 2rem;">加载中...</p>';

  try {
    const result = await fetchRepairOrderById(orderId);

    if (result.success) {
      const order = result.data;
      detailContainer.innerHTML = `
        <div class="order-detail">
          <div class="order-detail__section">
            <h3>基本信息</h3>
            <p><strong>订单ID:</strong> ${order.id}</p>
            <p><strong>状态:</strong> <span class="order-card__status order-card__status--${order.status}">${getStatusLabel(order.status)}</span></p>
            <p><strong>创建时间:</strong> ${formatDateTime(order.created_at)}</p>
            <p><strong>更新时间:</strong> ${formatDateTime(order.updated_at)}</p>
          </div>

          <div class="order-detail__section">
            <h3>客户信息</h3>
            <p><strong>电话:</strong> ${order.customer_phone}</p>
          </div>

          <div class="order-detail__section">
            <h3>吉他信息</h3>
            <p><strong>类型:</strong> ${getGuitarTypeLabel(order.guitar_type)}</p>
            <p><strong>品牌:</strong> ${order.guitar_brand || '未填写'}</p>
            <p><strong>型号:</strong> ${order.guitar_model || '未填写'}</p>
            <p><strong>问题描述:</strong></p>
            <p style="white-space: pre-wrap; background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;">${order.problem_description}</p>
            ${(order.image_urls && order.image_urls.length > 0) ? `
              <p><strong>吉他图片/视频:</strong></p>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                ${order.image_urls.map(url => {
                  const isVideo = url.endsWith('.mp4');
                  return isVideo ? `
                    <video src="${url}" controls style="width: 100%; max-height: 300px; border-radius: 0.5rem;"></video>
                  ` : `
                    <img src="${url}" alt="吉他图片" style="width: 100%; max-height: 300px; border-radius: 0.5rem; object-fit: cover;">
                  `;
                }).join('')}
              </div>
            ` : ''}
          </div>

          <div class="order-detail__section">
            <h3>预约信息</h3>
            <p><strong>预约日期:</strong> ${order.appointment_date}</p>
            <p><strong>预约时间:</strong> ${order.appointment_time}</p>
            <p><strong>期望完成日期:</strong> ${order.expected_completion_date}</p>
            <p><strong>排班人员:</strong> <span style="padding: 0.25rem 0.75rem; background: #f3f4f6; border-radius: 9999px; font-size: 0.875rem;">${order.assigned_to || '未分配'}</span></p>
            ${order.customer_notes ? `
              <p><strong>客户备注:</strong></p>
              <p style="white-space: pre-wrap; background: #e0f2fe; padding: 1rem; border-radius: 0.5rem;">${order.customer_notes}</p>
            ` : ''}
          </div>

          ${order.admin_notes ? `
            <div class="order-detail__section">
              <h3>管理员备注</h3>
              <p style="white-space: pre-wrap; background: #fef3c7; padding: 1rem; border-radius: 0.5rem;">${order.admin_notes}</p>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      detailContainer.innerHTML = `<p style="text-align: center; padding: 2rem; color: #ef4444;">加载失败: ${result.error}</p>`;
    }
  } catch (error) {
    console.error('Error loading order detail:', error);
    detailContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: #ef4444;">加载失败</p>';
  }
}

/**
 * Quick change order status with dropdown
 */
async function quickChangeStatus(orderId, currentStatus, element) {
  // Prevent event bubbling
  event.stopPropagation();

  // Check if dropdown already exists for this order
  const existingDropdown = document.querySelector('.status-quick-dropdown');
  if (existingDropdown) {
    const existingOrderId = existingDropdown.getAttribute('data-order-id');
    if (existingOrderId === orderId) {
      // Same order - close the dropdown
      existingDropdown.remove();
      return;
    }
    // Different order - remove old dropdown
    existingDropdown.remove();
  }

  // Create dropdown with custom options list
  const dropdown = document.createElement('div');
  dropdown.className = 'status-quick-dropdown';
  dropdown.setAttribute('data-order-id', orderId);

  const statuses = [
    { value: 'pending', label: '待排期' },
    { value: 'confirmed', label: '已确认' },
    { value: 'in_progress', label: '进行中' },
    { value: 'delayed', label: '延期中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  const optionsHTML = statuses
    .map(s => {
      const isCurrentStatus = s.value === currentStatus;
      const currentClass = isCurrentStatus ? ' status-quick-option--current' : '';
      return `
        <div class="status-quick-option status-quick-option--${s.value}${currentClass}" data-status="${s.value}">
          <span class="status-quick-option__label">${s.label}</span>
        </div>
      `;
    }).join('');

  dropdown.innerHTML = optionsHTML;

  // Position dropdown near the status badge with boundary detection
  const rect = element.getBoundingClientRect();
  dropdown.style.position = 'fixed';
  dropdown.style.zIndex = '1000';
  dropdown.style.width = `${rect.width}px`; // Match status badge width

  document.body.appendChild(dropdown);

  // Get dropdown dimensions after adding to DOM
  const dropdownRect = dropdown.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate position - center dropdown under the badge
  let top = rect.bottom + 5;
  let left = rect.left + (rect.width / 2) - (dropdownRect.width / 2);

  // Check if dropdown exceeds right edge
  if (left + dropdownRect.width > viewportWidth - 10) {
    left = viewportWidth - dropdownRect.width - 10;
  }

  // Check if dropdown exceeds left edge
  if (left < 10) {
    left = 10;
  }

  // Check if dropdown exceeds bottom edge
  if (top + dropdownRect.height > viewportHeight - 10) {
    // Show above the badge instead
    top = rect.top - dropdownRect.height - 5;
  }

  // Check if dropdown exceeds top edge (rare case)
  if (top < 10) {
    top = 10;
  }

  dropdown.style.top = `${top}px`;
  dropdown.style.left = `${left}px`;

  // Handle option click
  const options = dropdown.querySelectorAll('.status-quick-option');
  options.forEach(option => {
    option.addEventListener('click', async () => {
      const newStatus = option.getAttribute('data-status');

      // Don't update if clicking current status
      if (!newStatus || newStatus === currentStatus) {
        dropdown.remove();
        return;
      }

      // Close dropdown immediately
      dropdown.remove();

      // Optimistic update - update UI immediately
      const statusBadge = element;
      const oldClass = `order-card__status--${currentStatus}`;
      const newClass = `order-card__status--${newStatus}`;

      statusBadge.classList.remove(oldClass);
      statusBadge.classList.add(newClass);
      statusBadge.textContent = getStatusLabel(newStatus);

      try {
        // Update database in background
        const { data, error } = await supabase
          .from('guitar_repairs')
          .update({ status: newStatus })
          .eq('id', orderId)
          .select()
          .single();

        if (error) throw error;

        // Update local data without full reload
        const orderIndex = currentOrders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
          currentOrders[orderIndex].status = newStatus;
          updateStatistics(false); // Don't update trend chart, only status distribution
        }

      } catch (error) {
        console.error('Error updating status:', error);

        // Revert UI on error
        statusBadge.classList.remove(newClass);
        statusBadge.classList.add(oldClass);
        statusBadge.textContent = getStatusLabel(currentStatus);

        alert(`更新失败: ${error.message}`);
      }
    });
  });

  // Close dropdown when clicking outside
  const closeDropdown = (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.remove();
      document.removeEventListener('click', closeDropdown);
    }
  };

  // Add listener after a short delay to prevent immediate closing
  setTimeout(() => {
    document.addEventListener('click', closeDropdown);
  }, 100);

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      dropdown.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/**
 * Change order status
 */
async function changeOrderStatus(orderId, currentStatus) {
  const statusModal = document.getElementById('status-modal');
  const adminNotesInput = document.getElementById('admin-notes');
  const orderIdInput = document.getElementById('status-order-id');
  const assignedToSelect = document.getElementById('assigned-to');
  const appointmentDateInput = document.getElementById('appointment-date');
  const appointmentTimeSelect = document.getElementById('appointment-time');

  if (!statusModal) return;

  // Fetch current order details
  try {
    const result = await fetchRepairOrderById(orderId);
    if (result.success) {
      const order = result.data;

      orderIdInput.value = orderId;

      // Set form values
      adminNotesInput.value = order.admin_notes || '';
      if (assignedToSelect) assignedToSelect.value = order.assigned_to || '';

      // Set current appointment date and time
      if (appointmentDateInput) appointmentDateInput.value = order.appointment_date || '';
      if (appointmentTimeSelect) appointmentTimeSelect.value = order.appointment_time || '';

      // Show modal
      statusModal.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
    alert('获取订单详情失败');
  }
}

/**
 * Confirm status change
 */
async function confirmStatusChange() {
  const orderId = document.getElementById('status-order-id').value;
  const assignedTo = document.getElementById('assigned-to').value;
  const adminNotes = document.getElementById('admin-notes').value;
  const appointmentDate = document.getElementById('appointment-date').value;
  const appointmentTime = document.getElementById('appointment-time').value;

  try {
    // Build update data (no status change here, only other fields)
    const updateData = {};

    if (assignedTo) {
      updateData.assigned_to = assignedTo;
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    // Update appointment date and time if provided
    if (appointmentDate) {
      updateData.appointment_date = appointmentDate;
    }

    if (appointmentTime) {
      updateData.appointment_time = appointmentTime;
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      alert('没有需要更新的内容');
      return;
    }

    // Call update function
    const { data, error } = await supabase
      .from('guitar_repairs')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    alert('订单更新成功');
    closeStatusModal();

    // Reload all data to reflect changes
    await loadOrders();
    await loadWorkOrders();
    await loadCalendar(); // Reload calendar to reflect date/time changes
  } catch (error) {
    console.error('Error updating order:', error);
    alert(`更新失败: ${error.message}`);
  }
}

/**
 * Delete order
 */
async function deleteOrder(orderId) {
  if (!confirm('确定要删除这个订单吗？此操作不可恢复。')) {
    return;
  }

  try {
    const result = await deleteRepairOrder(orderId);

    if (result.success) {
      alert('订单已删除');
      await loadOrders();
    } else {
      alert(`删除失败: ${result.error}`);
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    alert('删除失败，请重试');
  }
}

/**
 * Close modal
 */
function closeModal() {
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Update statistics
 * @param {boolean} updateCharts - Whether to update charts (default: true)
 */
function updateStatistics(updateCharts = true) {
  const stats = {
    pending: 0,
    active: 0,
    completed: 0,
    total: currentOrders.length
  };

  currentOrders.forEach(order => {
    if (order.status === 'pending') {
      stats.pending++;
    } else if (order.status === 'confirmed' || order.status === 'in_progress' || order.status === 'delayed') {
      stats.active++;
    } else if (order.status === 'completed') {
      stats.completed++;
    }
  });

  const statPending = document.getElementById('stat-pending');
  const statActive = document.getElementById('stat-active');
  const statCompleted = document.getElementById('stat-completed');
  const statTotal = document.getElementById('stat-total');

  if (statPending) statPending.textContent = stats.pending;
  if (statActive) statActive.textContent = stats.active;
  if (statCompleted) statCompleted.textContent = stats.completed;
  if (statTotal) statTotal.textContent = stats.total;

  // Only update charts if requested
  if (updateCharts && typeof window.initializeCharts === 'function') {
    window.initializeCharts(currentOrders);
  } else if (!updateCharts && typeof window.updateStatusChart === 'function') {
    // Only update status distribution chart, not trend chart
    window.updateStatusChart(currentOrders);
  }
}

/**
 * Load calendar data
 */
async function loadCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  const monthTitle = document.getElementById('calendar-month-title');

  if (!calendarGrid || !monthTitle) return;

  // Update month title
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  monthTitle.textContent = `${year}年${month}月`;

  // Show loading
  calendarGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">加载中...</p>';

  try {
    // Fetch orders for the current month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await fetchRepairOrders({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    });

    if (result.success) {
      // Build calendar data
      calendarData.clear();
      result.data.forEach(order => {
        if (order.status !== 'cancelled') {
          const date = order.appointment_date;
          const time = order.appointment_time;

          if (!calendarData.has(date)) {
            calendarData.set(date, { total: 0, timeSlots: new Map() });
          }

          const dateData = calendarData.get(date);
          dateData.total++;

          if (!dateData.timeSlots.has(time)) {
            dateData.timeSlots.set(time, 0);
          }
          dateData.timeSlots.set(time, dateData.timeSlots.get(time) + 1);
        }
      });

      renderCalendar();
    } else {
      calendarGrid.innerHTML = `<p style="text-align: center; padding: 2rem; color: #ef4444;">加载失败: ${result.error}</p>`;
    }
  } catch (error) {
    console.error('Error loading calendar:', error);
    calendarGrid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #ef4444;">加载失败</p>';
  }
}

/**
 * Render calendar
 */
function renderCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  if (!calendarGrid) return;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '<div class="calendar-grid__header">';
  ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
    html += `<div class="calendar-grid__day-name">${day}</div>`;
  });
  html += '</div><div class="calendar-grid__body">';

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-grid__cell calendar-grid__cell--empty"></div>';
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = formatDate(date);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dateData = calendarData.get(dateString);
    const total = dateData ? dateData.total : 0;
    let statusClass = 'idle';
    if (total > 8) {
      statusClass = 'packed';
    } else if (total >= 6) {
      statusClass = 'busy';
    } else if (total >= 4) {
      statusClass = 'normal';
    }

    if (isWeekend) {
      html += `<div class="calendar-grid__cell calendar-grid__cell--weekend calendar-grid__cell--${statusClass}" onclick="window.showTimeSlotDetail('${dateString}')">
        <div class="calendar-grid__date">${day}</div>
        <div class="calendar-grid__info">${total}单</div>
        <div class="calendar-grid__weekend-label">周末</div>
      </div>`;
    } else {
      html += `<div class="calendar-grid__cell calendar-grid__cell--${statusClass}" onclick="window.showTimeSlotDetail('${dateString}')">
        <div class="calendar-grid__date">${day}</div>
        <div class="calendar-grid__info">${total}单</div>
      </div>`;
    }
  }

  html += '</div>';
  calendarGrid.innerHTML = html;
}

/**
 * Show time slot detail
 */
async function showTimeSlotDetail(dateString) {
  const detailContainer = document.getElementById('time-slots-detail');
  const detailContent = document.getElementById('time-slots-detail-content');

  if (!detailContainer || !detailContent) return;

  const dateData = calendarData.get(dateString);

  if (!dateData || dateData.total === 0) {
    detailContent.innerHTML = '<p>该日期暂无预约</p>';
    detailContainer.style.display = 'block';
    return;
  }

  // Fetch orders for this date with admin_notes
  try {
    const { data: orders, error } = await supabase
      .from('guitar_repairs')
      .select('*')
      .eq('appointment_date', dateString)
      .neq('status', 'cancelled')
      .order('appointment_time');

    if (error) throw error;

    // Generate all time slots
    const allTimeSlots = [];
    for (let hour = 10; hour < 12; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`);
    }
    for (let hour = 13; hour < 18; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`);
    }

    let html = `<h4>${dateString} 时间段详情（共${dateData.total}单）</h4>`;
    html += '<div class="time-slots-grid">';

    allTimeSlots.forEach(timeSlot => {
      const count = dateData.timeSlots.get(timeSlot) || 0;
      let statusClass = 'idle';
      let statusText = '空闲';

      if (count >= 4) {
        statusClass = 'busy';
        statusText = '繁忙';
      } else if (count >= 2) {
        statusClass = 'normal';
        statusText = '一般';
      }

      // Get orders for this time slot
      const slotOrders = orders.filter(order => order.appointment_time === timeSlot);
      const hasNotes = slotOrders.some(order => order.admin_notes);

      html += `<div class="time-slot-card time-slot-card--${statusClass}" style="cursor: ${hasNotes ? 'pointer' : 'default'};" onclick="${hasNotes ? `window.showSlotOrders('${dateString}', '${timeSlot}')` : ''}">
        <div class="time-slot-card__time">${timeSlot}</div>
        <div class="time-slot-card__count">${count}单</div>
        <div class="time-slot-card__status">${statusText}</div>
        ${hasNotes ? '<div class="time-slot-card__notes" style="font-size: 0.75rem; color: #f59e0b; margin-top: 0.25rem;">💬 有备注</div>' : ''}
      </div>`;
    });

    html += '</div>';
    detailContent.innerHTML = html;
    detailContainer.style.display = 'block';
  } catch (error) {
    console.error('Error loading time slot details:', error);
    detailContent.innerHTML = '<p style="color: #ef4444;">加载失败</p>';
    detailContainer.style.display = 'block';
  }
}

/**
 * Show orders for a specific time slot with notes
 */
async function showSlotOrders(dateString, timeSlot) {
  try {
    const { data: orders, error } = await supabase
      .from('guitar_repairs')
      .select('*')
      .eq('appointment_date', dateString)
      .eq('appointment_time', timeSlot)
      .neq('status', 'cancelled')
      .order('created_at');

    if (error) throw error;

    let html = `<h5 style="margin-bottom: 1rem;">${dateString} ${timeSlot} 预约详情</h5>`;

    if (orders.length === 0) {
      html += '<p>暂无预约</p>';
    } else {
      html += '<div style="display: flex; flex-direction: column; gap: 1rem;">';

      orders.forEach(order => {
        html += `
          <div style="padding: 1rem; background: #f9fafb; border-radius: 0.5rem; border-left: 4px solid #3b82f6;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <strong>${order.customer_phone}</strong>
              <span class="order-card__status order-card__status--${order.status}" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;">
                ${getStatusLabel(order.status)}
              </span>
            </div>
            <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;">
              ${getGuitarTypeLabel(order.guitar_type)} ${order.guitar_brand || ''} ${order.guitar_model || ''}
            </div>
            ${order.admin_notes ? `
              <div style="margin-top: 0.5rem; padding: 0.5rem; background: #fef3c7; border-radius: 0.5rem; font-size: 0.875rem;">
                <strong style="color: #92400e;">备注：</strong>
                <div style="margin-top: 0.25rem; white-space: pre-wrap;">${order.admin_notes}</div>
              </div>
            ` : ''}
          </div>
        `;
      });

      html += '</div>';
    }

    // Show in a modal or replace content
    const detailContent = document.getElementById('time-slots-detail-content');
    if (detailContent) {
      detailContent.innerHTML = html + `<button onclick="window.showTimeSlotDetail('${dateString}')" class="button button--small button--secondary" style="margin-top: 1rem;">返回</button>`;
    }
  } catch (error) {
    console.error('Error loading slot orders:', error);
  }
}

/**
 * Handle export CSV
 */
async function handleExportCSV() {
  const status = document.getElementById('export-status').value;
  const dateFrom = document.getElementById('export-date-from').value;
  const dateTo = document.getElementById('export-date-to').value;

  try {
    const filters = {};
    if (status) filters.status = status;
    if (dateFrom) filters.startDate = dateFrom;
    if (dateTo) filters.endDate = dateTo;

    const result = await fetchRepairOrders(filters);

    if (result.success) {
      const orders = result.data;

      if (orders.length === 0) {
        alert('没有符合条件的订单');
        return;
      }

      // Generate CSV
      const headers = ['订单ID', '客户电话', '吉他类型', '品牌', '型号', '问题描述', '预约日期', '预约时间', '期望完成日期', '客户备注', '状态', '创建时间'];
      const rows = orders.map(order => [
        order.id,
        order.customer_phone,
        getGuitarTypeLabel(order.guitar_type),
        order.guitar_brand || '',
        order.guitar_model || '',
        order.problem_description,
        order.appointment_date,
        order.appointment_time,
        order.expected_completion_date,
        order.customer_notes || '',
        getStatusLabel(order.status),
        formatDateTime(order.created_at)
      ]);

      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      // Download CSV
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `repair-orders-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      alert(`成功导出 ${orders.length} 条订单`);
    } else {
      alert(`导出失败: ${result.error}`);
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('导出失败，请重试');
  }
}

/**
 * Handle batch update
 */
async function handleBatchUpdate() {
  const statusFrom = document.getElementById('batch-status-from').value;
  const statusTo = document.getElementById('batch-status-to').value;
  const date = document.getElementById('batch-date').value;

  if (!statusFrom || !statusTo) {
    alert('请选择状态');
    return;
  }

  if (statusFrom === statusTo) {
    alert('新旧状态不能相同');
    return;
  }

  try {
    const filters = { status: statusFrom };
    if (date) {
      filters.startDate = date;
      filters.endDate = date;
    }

    const result = await fetchRepairOrders(filters);

    if (result.success) {
      const orders = result.data;

      if (orders.length === 0) {
        alert('没有符合条件的订单');
        return;
      }

      if (!confirm(`确定要将 ${orders.length} 个订单的状态从 ${getStatusLabel(statusFrom)} 更改为 ${getStatusLabel(statusTo)} 吗？`)) {
        return;
      }

      // Update all orders
      let successCount = 0;
      let failCount = 0;

      for (const order of orders) {
        const updateResult = await updateRepairOrderStatus(order.id, statusTo);
        if (updateResult.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      alert(`批量更新完成\n成功: ${successCount}\n失败: ${failCount}`);
      await loadOrders();
    } else {
      alert(`批量更新失败: ${result.error}`);
    }
  } catch (error) {
    console.error('Error batch updating:', error);
    alert('批量更新失败，请重试');
  }
}

/**
 * Get status label in Chinese
 */
function getStatusLabel(status) {
  const labels = {
    pending: '待排期',
    confirmed: '已确认',
    in_progress: '进行中',
    delayed: '延期中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return labels[status] || status;
}

/**
 * Get guitar type label in Chinese
 */
function getGuitarTypeLabel(type) {
  const labels = {
    acoustic: '木吉他',
    classical: '古典吉他',
    electric: '电吉他',
    bass: '贝斯',
    other: '其他'
  };
  return labels[type] || type;
}

/**
 * Format date time
 */
function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Close status modal
 */
function closeStatusModal() {
  const statusModal = document.getElementById('status-modal');
  if (statusModal) {
    statusModal.style.display = 'none';
  }
}

/**
 * Load work orders table
 */
async function loadWorkOrders() {
  const tbody = document.getElementById('workorders-tbody');
  const emptyDiv = document.getElementById('workorders-empty');
  if (!tbody) return;

  // Show loading
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">加载中...</td></tr>';
  if (emptyDiv) emptyDiv.style.display = 'none';

  try {
    // Build filters
    const filters = {};
    const statusFilter = document.getElementById('wo-status-filter')?.value;
    const dateFilter = document.getElementById('wo-date-filter')?.value;
    const phoneSearch = document.getElementById('wo-phone-search')?.value;

    if (statusFilter) {
      filters.status = statusFilter;
    }
    if (dateFilter) {
      filters.startDate = dateFilter;
      filters.endDate = dateFilter;
    }

    // Fetch orders
    const result = await fetchRepairOrders(filters);

    if (result.success) {
      let orders = result.data;

      // Filter by phone if needed
      if (phoneSearch) {
        orders = orders.filter(order =>
          order.customer_phone.includes(phoneSearch)
        );
      }

      // Sort by appointment date and time
      orders.sort((a, b) => {
        const dateCompare = new Date(a.appointment_date) - new Date(b.appointment_date);
        if (dateCompare !== 0) return dateCompare;
        return a.appointment_time.localeCompare(b.appointment_time);
      });

      renderWorkOrdersTable(orders);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #ef4444;">加载失败: ${result.error}</td></tr>`;
    }
  } catch (error) {
    console.error('Error loading work orders:', error);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #ef4444;">加载失败，请刷新重试</td></tr>';
  }
}

/**
 * Render work orders table
 */
function renderWorkOrdersTable(orders) {
  const tbody = document.getElementById('workorders-tbody');
  const emptyDiv = document.getElementById('workorders-empty');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '';
    if (emptyDiv) emptyDiv.style.display = 'block';
    return;
  }

  if (emptyDiv) emptyDiv.style.display = 'none';

  tbody.innerHTML = orders.map(order => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 1rem;">
        <span style="font-family: monospace; font-size: 0.875rem;">#${order.id.substring(0, 8)}</span>
      </td>
      <td style="padding: 1rem;">${order.customer_phone}</td>
      <td style="padding: 1rem;">
        <div>${getGuitarTypeLabel(order.guitar_type)}</div>
        <div style="font-size: 0.875rem; color: #6b7280;">
          ${order.guitar_brand || '-'} ${order.guitar_model || ''}
        </div>
      </td>
      <td style="padding: 1rem;">
        <div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${order.problem_description}">
          ${order.problem_description}
        </div>
      </td>
      <td style="padding: 1rem;">
        <div>${order.appointment_date}</div>
        <div style="font-size: 0.875rem; color: #6b7280;">${order.appointment_time}</div>
      </td>
      <td style="padding: 1rem;">
        <span style="padding: 0.25rem 0.75rem; background: #f3f4f6; border-radius: 9999px; font-size: 0.875rem;">
          ${order.assigned_to || '未分配'}
        </span>
      </td>
      <td style="padding: 1rem;">
        <span class="order-card__status order-card__status--${order.status}" onclick="window.quickChangeStatus('${order.id}', '${order.status}', this)" title="点击快速修改状态" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; cursor: pointer;">
          ${getStatusLabel(order.status)}
        </span>
      </td>
      <td style="padding: 1rem;">
        <button class="button button--small button--primary" onclick="window.viewOrderDetail('${order.id}')" style="margin-right: 0.5rem;">查看</button>
        <button class="button button--small button--secondary" onclick="window.changeOrderStatus('${order.id}', '${order.status}')">更改订单状态</button>
      </td>
    </tr>
  `).join('');
}

// Expose functions to window for onclick handlers
window.viewOrderDetail = viewOrderDetail;
window.quickChangeStatus = quickChangeStatus;
window.changeOrderStatus = changeOrderStatus;
window.deleteOrder = deleteOrder;
window.showTimeSlotDetail = showTimeSlotDetail;
window.showSlotOrders = showSlotOrders;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminDashboard);
} else {
  initAdminDashboard();
}
