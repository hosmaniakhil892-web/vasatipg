import axios from "axios";

const API_BASE = "http://localhost:5000/api/owner";

function getAuthHeaders() {
  const token = localStorage.getItem("ownerToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

export const ownerApi = {
  // Auth
  register: (data) => axios.post(`${API_BASE}/register`, data),
  verifyOtp: (data) => axios.post(`${API_BASE}/verify-otp`, data),
  login: (data) => axios.post(`${API_BASE}/login`, data),
  getMe: () => axios.get(`${API_BASE}/me`, getAuthHeaders()),

  // Dashboard Summary & Analytics
  getDashboardSummary: (propertyId) =>
    axios.get(`${API_BASE}/dashboard/summary${propertyId ? `?propertyId=${propertyId}` : ""}`, getAuthHeaders()),
  getAnalytics: (propertyId) =>
    axios.get(`${API_BASE}/analytics${propertyId ? `?propertyId=${propertyId}` : ""}`, getAuthHeaders()),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API_BASE}/customers${query ? `?${query}` : ""}`, getAuthHeaders());
  },
  getCustomerProfile: (id) => axios.get(`${API_BASE}/customers/${id}`, getAuthHeaders()),
  updateRoomAllocation: (id, data) =>
    axios.put(`${API_BASE}/customers/${id}/room-allocation`, data, getAuthHeaders()),
  updateCustomerStatus: (id, data) =>
    axios.put(`${API_BASE}/customers/${id}/status`, data, getAuthHeaders()),

  // Bookings
  getBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API_BASE}/bookings${query ? `?${query}` : ""}`, getAuthHeaders());
  },
  acceptBooking: (id, data) =>
    axios.post(`${API_BASE}/bookings/${id}/accept`, data, getAuthHeaders()),
  rejectBooking: (id, data) =>
    axios.post(`${API_BASE}/bookings/${id}/reject`, data, getAuthHeaders()),
  checkInBooking: (id) =>
    axios.post(`${API_BASE}/bookings/${id}/check-in`, {}, getAuthHeaders()),

  // Rooms
  getRooms: (propertyId) =>
    axios.get(`${API_BASE}/rooms${propertyId ? `?propertyId=${propertyId}` : ""}`, getAuthHeaders()),
  addRoom: (data) => axios.post(`${API_BASE}/rooms`, data, getAuthHeaders()),
  updateRoom: (id, data) => axios.put(`${API_BASE}/rooms/${id}`, data, getAuthHeaders()),

  // Payments & Ledger
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API_BASE}/payments${query ? `?${query}` : ""}`, getAuthHeaders());
  },
  recordPayment: (data) => axios.post(`${API_BASE}/payments/record`, data, getAuthHeaders()),

  // Visits
  getVisits: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API_BASE}/visits${query ? `?${query}` : ""}`, getAuthHeaders());
  },
  updateVisit: (id, data) => axios.put(`${API_BASE}/visits/${id}`, data, getAuthHeaders()),

  // Complaints
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API_BASE}/complaints${query ? `?${query}` : ""}`, getAuthHeaders());
  },
  respondComplaint: (id, data) =>
    axios.put(`${API_BASE}/complaints/${id}/respond`, data, getAuthHeaders()),

  // Notifications & Audit
  getNotifications: () => axios.get(`${API_BASE}/notifications`, getAuthHeaders()),
  markNotificationRead: (id) => axios.put(`${API_BASE}/notifications/${id}/read`, {}, getAuthHeaders()),
  getAuditLogs: () => axios.get(`${API_BASE}/audit-logs`, getAuthHeaders()),
};

