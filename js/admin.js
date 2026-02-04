/**
 * Admin Panel - Guitar Repair Orders Management
 */

import {
  fetchRepairOrders,
  fetchRepairOrderById,
  updateRepairOrderStatus,
  deleteRepairOrder
} from './supabase-client.js';

// State
let currentOrders = [];
let currentFilter = { status: '', date: '' };

/**
 * Initialize admin panel
 */
async function initAdmin() {
  // Load orders
  await loadOrders();

  // Setup event listeners
  setupEventListeners();

  // Update statistics
  updateStatistics();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Status filter
  const statusFilter = document.getElementById('status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', async (e) => {
      currentFilter.status = e.target.value;
      await loadOrders();
    });
  }

  // Date filter
  const dateFilter = document.getElementById('date-filter');
  if (dateFilter) {
    dateFilter.addEventListener('change', async (e) => {
      currentFilter.date = e.target.value;
      await loadOrders();
    });
  }

  // Refresh button
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
        <span class="order-card__status order-card__status--${order.status}" onclick="window.changeOrderStatus('${order.id}', '${order.status}')" title="点击修改状态">${getStatusLabel(order.status)}</span>
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
          <p><strong>问题描述:</strong> ${order.problem_description}</p>
          <p><strong>期望完成:</strong> ${order.expected_completion_date}</p>
          <p><strong>创建时间:</strong> ${formatDateTime(order.created_at)}</p>
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

// Expose functions to window for onclick handlers
window.viewOrderDetail = viewOrderDetail;
window.changeOrderStatus = changeOrderStatus;
window.deleteOrder = deleteOrder;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}
