/**
 * MandiX - Central Backend REST API Client
 * Connects frontend services to the Express + MySQL backend at http://localhost:3000/api
 */

export const API_BASE_URL = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(4000),
    ...options
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[MandiX API] ${options.method || 'GET'} ${endpoint} failed:`, err.message);
    return null;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Farmers
  getFarmers: () => request('/farmers'),
  getFarmer: (id) => request(`/farmers/${id}`),
  createFarmer: (data) => request('/farmers', { method: 'POST', body: JSON.stringify(data) }),
  updateFarmer: (id, data) => request(`/farmers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Procurement Queue
  getQueue: () => request('/queue'),
  addQueueToken: (data) => request('/queue', { method: 'POST', body: JSON.stringify(data) }),
  updateQueueStatus: (id, status) => request(`/queue/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Fertilizer Orders
  getFertilizerOrders: () => request('/fertilizer-orders'),
  createFertilizerOrder: (data) => request('/fertilizer-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateFertilizerOrderStatus: (id, status) => request(`/fertilizer-orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Equipment Bookings
  getEquipmentBookings: () => request('/equipment-bookings'),
  createEquipmentBooking: (data) => request('/equipment-bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateEquipmentBookingStatus: (id, status) => request(`/equipment-bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Drone Requests
  getDroneRequests: () => request('/drone-requests'),
  createDroneRequest: (data) => request('/drone-requests', { method: 'POST', body: JSON.stringify(data) }),
  updateDroneRequestStatus: (id, status) => request(`/drone-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Support Tickets
  getSupportTickets: () => request('/support-tickets'),
  createSupportTicket: (data) => request('/support-tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateSupportTicketStatus: (id, status) => request(`/support-tickets/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
};

export default api;
