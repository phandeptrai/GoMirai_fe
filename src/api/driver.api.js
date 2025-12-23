import apiClient from './client';

export const driverAPI = {
  /**
   * Apply to become driver
   * @param {Object} data - { licenseNumber, vehicleBrand, vehicleModel, plateNumber, color, vehicleType, registrationDate }
   * @returns {Promise<DriverProfileResponse>}
   */
  apply: async (data) => {
    const response = await apiClient.post('/api/drivers/apply', data);
    // Backend trả về trực tiếp DriverProfileResponse, không có wrapper
    return response.data;
  },

  /**
   * Get driver profile
   * @returns {Promise<{driverId: string, userId: string, licenseNumber: string, accountStatus: string, ...}>}
   */
  getMyProfile: async () => {
    const response = await apiClient.get('/api/drivers/me');
    // Backend trả về trực tiếp DriverProfileResponse, không có wrapper
    return response.data;
  },

  /**
   * Update driver profile
   */
  updateMyProfile: async (data) => {
    const response = await apiClient.put('/api/drivers/me', data);
    return response.data?.data || response.data;
  },

  /**
   * Get my vehicle
   */
  getMyVehicle: async () => {
    const response = await apiClient.get('/api/drivers/me/vehicle');
    return response.data?.data || response.data;
  },

  /**
   * Update my vehicle
   */
  updateMyVehicle: async (data) => {
    const response = await apiClient.put('/api/drivers/me/vehicle', data);
    return response.data?.data || response.data;
  },

  /**
   * Set status online
   */
  setOnline: async () => {
    const response = await apiClient.patch('/api/drivers/me/status/online');
    return response.data?.data || response.data;
  },

  /**
   * Set status offline
   */
  setOffline: async () => {
    const response = await apiClient.patch('/api/drivers/me/status/offline');
    return response.data?.data || response.data;
  },

  /**
   * Get driver rating
   */
  getRating: async (driverId) => {
    const response = await apiClient.get(`/api/drivers/${driverId}/rating`);
    return response.data?.data || response.data;
  },

  /**
   * Get full driver profile by ID
   */
  getProfile: async (driverId) => {
    const response = await apiClient.get(`/api/drivers/${driverId}`);
    return response.data?.data || response.data;
  },

  /**
   * Get driver profile by userId (when booking stores userId instead of driverId)
   */
  getProfileByUserId: async (userId) => {
    const response = await apiClient.get(`/api/drivers/user/${userId}`);
    return response.data?.data || response.data;
  },

  /**
   * Get active booking offers for current driver
   */
  getBookingOffers: async () => {
    const response = await apiClient.get('/api/drivers/me/booking-offers');
    // Response có thể là { data: [...] } hoặc trực tiếp [...]
    const offers = response.data?.data || response.data || [];
    console.log('[API] getBookingOffers response:', response.data);
    console.log('[API] Parsed offers:', offers);
    return offers;
  },

  /**
   * Reject/decline a booking offer
   */
  rejectBookingOffer: async (bookingId) => {
    const response = await apiClient.patch(`/api/drivers/me/booking-offers/${bookingId}/reject`);
    return response.data;
  },
};


