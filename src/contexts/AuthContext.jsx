import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth.api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra token trong localStorage khi app khởi động
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');

    if (token && userId && role) {
      setUser({
        userId,
        role,
        token,
      });
    }
    setLoading(false);
  }, []);

  const login = async (phoneNumber, password) => {
    try {
      const response = await authAPI.login({ phoneNumber, password });
      const { userId, role, accessToken } = response;

      // Lưu vào localStorage (userId có thể là UUID object, convert sang string)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userId', userId?.toString() || userId);
      localStorage.setItem('role', role);

      // Cập nhật state
      setUser({
        userId,
        role,
        token: accessToken,
      });

      return { success: true };
    } catch (error) {
      // Xử lý lỗi validation từ backend
      let message = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Lỗi validation (400 Bad Request)
        if (error.response.status === 400) {
          if (Array.isArray(data.errors)) {
            message = data.errors.map(e => e.defaultMessage || e.message).join(', ');
          } else if (data.message) {
            message = data.message;
          } else if (typeof data === 'string') {
            message = data;
          }
        } 
        // Lỗi business logic (thường là 400 hoặc 401)
        else if (data.message) {
          message = data.message;
        } else if (data.error) {
          message = data.error;
        }
      } else if (error.message) {
        message = error.message;
      }
      
      return { success: false, error: message };
    }
  };

  const register = async (phoneNumber, password) => {
    try {
      const response = await authAPI.register({ phoneNumber, password });
      const { userId, role, accessToken } = response;

      // Lưu vào localStorage (userId có thể là UUID object, convert sang string)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userId', userId?.toString() || userId);
      localStorage.setItem('role', role);

      // Cập nhật state
      setUser({
        userId,
        role,
        token: accessToken,
      });

      return { success: true };
    } catch (error) {
      // Xử lý lỗi validation từ backend
      let message = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Lỗi validation (400 Bad Request)
        if (error.response.status === 400) {
          if (Array.isArray(data.errors)) {
            message = data.errors.map(e => e.defaultMessage || e.message).join(', ');
          } else if (data.message) {
            message = data.message;
          } else if (typeof data === 'string') {
            message = data;
          }
        } 
        // Lỗi business logic (thường là 400 - số điện thoại đã tồn tại)
        else if (data.message) {
          message = data.message;
        } else if (data.error) {
          message = data.error;
        }
      } else if (error.message) {
        message = error.message;
      }
      
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


