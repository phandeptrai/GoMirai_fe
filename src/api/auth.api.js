import apiClient from './client';

export const authAPI = {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} data - { phoneNumber: string, password: string }
   * @returns {Promise<{userId: string, role: string, accessToken: string}>}
   */
  register: async (data) => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  },

  /**
   * Đăng nhập
   * @param {Object} data - { phoneNumber: string, password: string }
   * @returns {Promise<{userId: string, role: string, accessToken: string}>}
   */
  login: async (data) => {
    const response = await apiClient.post('/api/auth/login', data);
    return response.data;
  },

  /**
   * Refresh token để lấy role mới
   * Dùng khi role đã được update (VD: CUSTOMER → DRIVER)
   * @returns {Promise<{userId: string, role: string, accessToken: string}>}
   */
  refreshToken: async () => {
    const response = await apiClient.post('/api/auth/refresh');
    return response.data;
  },
};









