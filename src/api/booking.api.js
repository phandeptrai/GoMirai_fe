import apiClient from './client';

export const bookingAPI = {
  /**
   * Tạo booking mới
   */
  createBooking: async (data) => {
    const response = await apiClient.post('/api/booking', data);
    // Response structure: { success, message, data }
    return response.data?.data || response.data;
  },

  /**
   * Lấy booking theo ID
   */
  getBooking: async (bookingId) => {
    const response = await apiClient.get(`/api/booking/${bookingId}`);
    // Response structure: { success, message, data }
    return response.data?.data || response.data;
  },

  /**
   * Lấy danh sách bookings của customer
   */
  getCustomerBookings: async (status = null, page = 0, size = 10) => {
    const params = { page, size };
    if (status) params.status = status;
    const response = await apiClient.get('/api/booking/me', { params });
    // Response structure: { success, message, data } where data is Page<BookingResponse>
    return response.data?.data || response.data;
  },

  /**
   * Lấy danh sách bookings của driver
   */
  getDriverBookings: async (status = null, page = 0, size = 10) => {
    const params = { page, size };
    if (status) params.status = status;
    const response = await apiClient.get('/api/booking/driver/me', { params });
    // Response structure: { success, message, data } where data is Page<BookingResponse>
    return response.data?.data || response.data;
  },

  /**
   * Driver accept booking
   */
  acceptBooking: async (bookingId) => {
    const response = await apiClient.patch(`/api/booking/${bookingId}/accept`);
    return response.data?.data || response.data;
  },

  /**
   * Get pending bookings for driver
   */
  getPendingBookings: async () => {
    const response = await apiClient.get('/api/booking/driver/pending');
    return response.data?.data || response.data || [];
  },

  /**
   * Driver arrived at pickup point
   */
  driverArrived: async (bookingId) => {
    const response = await apiClient.patch(`/api/booking/${bookingId}/arrived`);
    return response.data?.data || response.data;
  },

  /**
   * Driver start trip (after customer gets in)
   */
  startTrip: async (bookingId) => {
    const response = await apiClient.patch(`/api/booking/${bookingId}/start`);
    return response.data?.data || response.data;
  },

  /**
   * Driver complete trip
   * @param {string} bookingId - Booking ID
   * @param {Object} data - { actualDistanceKm: number, actualDurationMinutes: number }
   */
  completeTrip: async (bookingId, data = {}) => {
    const response = await apiClient.post(`/api/booking/${bookingId}/complete`, data);
    return response.data?.data || response.data;
  },

  /**
   * Customer cancel booking with reason
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   */
  cancelBooking: async (bookingId, reason) => {
    const response = await apiClient.post(`/api/booking/${bookingId}/cancel`, { reason });
    return response.data?.data || response.data;
  },
};




