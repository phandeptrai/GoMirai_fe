import apiClient from './client';

export const userAPI = {
  /**
   * Get user profile
   * @param {string} userId - User ID (UUID)
   * @returns {Promise<{userId: string, fullName: string, phone: string, email: string, address: object, dateOfBirth: string, status: 'PENDING'|'INCOMPLETE'|'COMPLETE'}>}
   */
  getProfile: async (userId) => {
    const response = await apiClient.get(`/api/users/${userId}`);
    // Backend trả về trực tiếp UserProfileResponse, không có wrapper
    return response.data;
  },

  /**
   * Update user profile
   * @param {string} userId - User ID (UUID)
   * @param {Object} data - { fullName?: string, phone?: string, email?: string, address?: object, dateOfBirth?: string }
   * @returns {Promise<UserProfileResponse>}
   */
  updateProfile: async (userId, data) => {
    const response = await apiClient.put(`/api/users/${userId}`, data);
    return response.data;
  },

  /**
   * Get all users (admin only)
   * @returns {Promise<Array<UserProfileResponse>>}
   */
  getAllUsers: async () => {
    const response = await apiClient.get('/api/users');
    return response.data;
  },
};









