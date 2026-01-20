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
  const modalCloseBtn = document.querySelector('.modal__close');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalOverlay = document.querySelector('.modal__overlay');

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
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
        <span class="order-card__status order-card__status--${order.status}">${getStatusLabel(order.status)}</span>
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
        <button class="button button--small button--secondary" onclick="window.changeOrderStatus('${order.id}', '${order.status}')">更改状态</button>
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
            ${order.image_url ? `
              <p><strong>吉他图片/视频:</strong></p>
              ${order.image_url.endsWith('.mp4') ? `
                <video src="${order.image_url}" controls style="max-width: 100%; max-height: 400px; border-radius: 0.5rem; margin-top: 0.5rem;"></video>
              ` : `
                <img src="${order.image_url}" alt="吉他图片" style="max-width: 100%; max-height: 400px; border-radius: 0.5rem; margin-top: 0.5rem;">
              `}
            ` : ''}
          </div>

          <div class="order-detail__section">
            <h3>预约信息</h3>
            <p><strong>预约日期:</strong> ${order.appointment_date}</p>
            <p><strong>预约时间:</strong> ${order.appointment_time}</p>
            <p><strong>期望完成日期:</strong> ${order.expected_completion_date}</p>
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
 * Change order status
 */
async function changeOrderStatus(orderId, currentStatus) {
  const newStatus = prompt(
    `当前状态: ${getStatusLabel(currentStatus)}\n\n请输入新状态:\n- pending (待确认)\n- confirmed (已确认)\n- in_progress (维修中)\n- completed (已完成)\n- cancelled (已取消)`,
    currentStatus
  );

  if (!newStatus || newStatus === currentStatus) return;

  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    alert('无效的状态值');
    return;
  }

  const adminNotes = prompt('请输入管理员备注（可选）:');

  try {
    const result = await updateRepairOrderStatus(orderId, newStatus, adminNotes);

    if (result.success) {
      alert('状态更新成功');
      await loadOrders();
    } else {
      alert(`更新失败: ${result.error}`);
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('更新失败，请重试');
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
 */
function updateStatistics() {
  const stats = {
    pending: 0,
    active: 0,
    completed: 0,
    total: currentOrders.length
  };

  currentOrders.forEach(order => {
    if (order.status === 'pending') {
      stats.pending++;
    } else if (order.status === 'confirmed' || order.status === 'in_progress') {
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
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    if (!isWeekday) {
      html += `<div class="calendar-grid__cell calendar-grid__cell--weekend">
        <div class="calendar-grid__date">${day}</div>
        <div class="calendar-grid__info">休息日</div>
      </div>`;
    } else {
      const dateData = calendarData.get(dateString);
      const total = dateData ? dateData.total : 0;
      let statusClass = 'idle';
      if (total > 6) {
        statusClass = 'busy';
      } else if (total >= 4) {
        statusClass = 'normal';
      }

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
function showTimeSlotDetail(dateString) {
  const detailContainer = document.getElementById('time-slots-detail');
  const detailContent = document.getElementById('time-slots-detail-content');

  if (!detailContainer || !detailContent) return;

  const dateData = calendarData.get(dateString);

  if (!dateData || dateData.total === 0) {
    detailContent.innerHTML = '<p>该日期暂无预约</p>';
    detailContainer.style.display = 'block';
    return;
  }

  // Generate all time slots
  const allTimeSlots = [];
  for (let hour = 9; hour < 18; hour++) {
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

    html += `<div class="time-slot-card time-slot-card--${statusClass}">
      <div class="time-slot-card__time">${timeSlot}</div>
      <div class="time-slot-card__count">${count}单</div>
      <div class="time-slot-card__status">${statusText}</div>
    </div>`;
  });

  html += '</div>';
  detailContent.innerHTML = html;
  detailContainer.style.display = 'block';
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
      const headers = ['订单ID', '客户电话', '吉他类型', '品牌', '型号', '问题描述', '预约日期', '预约时间', '期望完成日期', '状态', '创建时间'];
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
    pending: '待确认',
    confirmed: '已确认',
    in_progress: '维修中',
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

// Expose functions to window for onclick handlers
window.viewOrderDetail = viewOrderDetail;
window.changeOrderStatus = changeOrderStatus;
window.deleteOrder = deleteOrder;
window.showTimeSlotDetail = showTimeSlotDetail;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminDashboard);
} else {
  initAdminDashboard();
}
