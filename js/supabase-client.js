/**
 * Supabase Client Configuration
 * Initializes and exports the Supabase client for use across the application
 */

// Import Supabase client from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Get Supabase configuration from config.js
// config.js should be loaded before this script in HTML
const SUPABASE_URL = window.SUPABASE_CONFIG?.url;
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase configuration is missing!\n' +
    'Please ensure js/config.js exists and contains valid credentials.\n' +
    'Copy js/config.example.js to js/config.js and fill in your Supabase credentials.'
  );
}

// Create Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Check authentication status with detailed info
 * @returns {Promise<{authenticated: boolean, user?: Object, session?: Object}>}
 */
export async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return {
        authenticated: true,
        user: session.user,
        session: session
      };
    }
    return { authenticated: false };
  } catch (error) {
    console.error('Error checking auth:', error);
    return { authenticated: false };
  }
}

/**
 * Get current user
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} metadata - Additional user metadata
 * @returns {Promise<Object>}
 */
export async function signUp(email, password, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error signing up:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign in an existing user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>}
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign out the current user
 * @returns {Promise<Object>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all activities
 * @returns {Promise<Array>}
 */
export async function fetchActivities() {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching activities:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Fetch a single activity by ID
 * @param {string} id - Activity ID
 * @returns {Promise<Object>}
 */
export async function fetchActivityById(id) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new booking
 * @param {Object} bookingData - Booking information
 * @returns {Promise<Object>}
 */
export async function createBooking(bookingData) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch user's bookings
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function fetchUserBookings(userId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        activities (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>}
 */
export async function cancelBooking(bookingId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new guitar repair order
 * @param {Object} repairData - Repair order information
 * @returns {Promise<Object>}
 */
export async function createRepairOrder(repairData) {
  try {
    const { data, error } = await supabase
      .from('guitar_repairs')
      .insert([repairData])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating repair order:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all repair orders
 * @param {Object} filters - Optional filters (status, date range, etc.)
 * @returns {Promise<Array>}
 */
export async function fetchRepairOrders(filters = {}) {
  try {
    let query = supabase
      .from('guitar_repairs')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.startDate) {
      query = query.gte('appointment_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('appointment_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching repair orders:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Fetch repair orders by customer email
 * @param {string} email - Customer email
 * @returns {Promise<Array>}
 */
export async function fetchRepairOrdersByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('guitar_repairs')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching repair orders by email:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Fetch a single repair order by ID
 * @param {string} id - Repair order ID
 * @returns {Promise<Object>}
 */
export async function fetchRepairOrderById(id) {
  try {
    const { data, error } = await supabase
      .from('guitar_repairs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching repair order:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update repair order status
 * @param {string} orderId - Repair order ID
 * @param {string} status - New status
 * @param {string} adminNotes - Optional admin notes
 * @returns {Promise<Object>}
 */
export async function updateRepairOrderStatus(orderId, status, adminNotes = null) {
  try {
    const updateData = { status };
    if (adminNotes !== null) {
      updateData.admin_notes = adminNotes;
    }

    const { data, error } = await supabase
      .from('guitar_repairs')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating repair order status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a repair order
 * @param {string} orderId - Repair order ID
 * @returns {Promise<Object>}
 */
export async function deleteRepairOrder(orderId) {
  try {
    const { error } = await supabase
      .from('guitar_repairs')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting repair order:', error);
    return { success: false, error: error.message };
  }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);

  // Dispatch custom event for other parts of the app to listen to
  window.dispatchEvent(new CustomEvent('authStateChange', {
    detail: { event, session },
  }));
});
