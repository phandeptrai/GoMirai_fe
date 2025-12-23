import apiClient from './client';

export const trackingAPI = {
  /**
   * Cập nhật vị trí realtime (chỉ DRIVER)
   * @param {Object} data - { driverId, latitude, longitude, status, vehicleType, lastUpdatedAt }
   */
  updateLocation: async (data) => {
    const response = await apiClient.post('/api/tracking/location', data);
    return response.data?.data || response.data;
  },

  /**
   * Tìm tài xế lân cận
   * @param {Object} data - { latitude, longitude, radiusKm, vehicleType?, status? }
   */
  findNearbyDrivers: async (data) => {
    const response = await apiClient.post('/api/tracking/nearby', data);
    return response.data?.data || response.data;
  },

  /**
   * Lấy vị trí của một tài xế cụ thể (chỉ ADMIN)
   * @param {string} driverId
   */
  getDriverLocation: async (driverId) => {
    const response = await apiClient.get(`/api/tracking/drivers/${driverId}`);
    return response.data?.data || response.data;
  },
};







