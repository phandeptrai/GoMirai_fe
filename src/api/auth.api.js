import apiClient from "./client";

export const authAPI = {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} data - { phoneNumber: string, password: string }
   * @returns {Promise<{userId: string, role: string, accessToken: string}>}
   */
  register: async (data) => {
    const response = await apiClient.post("/api/auth/register", data);
    return response.data;
  },

  /**
   * Đăng nhập
   * @param {Object} data - { phoneNumber: string, password: string }
   * @returns {Promise<{userId: string, role: string, accessToken: string}>}
   */
  login: async (data) => {
    const response = await apiClient.post("/api/auth/login", data);
    return response.data;
  },

  /**
   * Đăng nhập bằng Google OAuth
   *
   * Google OAuth chỉ thực hiện AUTHENTICATION (xác thực danh tính).
   * Không phân biệt "đăng ký" hay "đăng nhập" ở phía người dùng:
   * - Nếu Google account đã tồn tại → đăng nhập
   * - Nếu chưa tồn tại → tự động tạo tài khoản mới
   *
   * @param {string} idToken - Google ID Token từ Google Sign-In
   * @returns {Promise<{userId: string, role: string, accessToken: string}>}
   */
  loginWithGoogle: async (idToken) => {
    const response = await apiClient.post("/api/auth/google", { idToken });
    return response.data;
  },

  /**
   * Refresh token để lấy role mới
   * Dùng khi role đã được update (VD: CUSTOMER → DRIVER)
   * @returns {Promise<{userId: string, role: string, accessToken: string}>}
   */
  refreshToken: async () => {
    const response = await apiClient.post("/api/auth/refresh");
    return response.data;
  },
};
