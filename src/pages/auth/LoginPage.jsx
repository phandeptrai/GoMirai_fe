import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthInput from '../../components/auth/AuthInput';
import { PhoneIcon, LockIcon } from '../../components/auth/icons';
import { useAuth } from '../../contexts/AuthContext';
import { validatePhoneNumber } from '../../utils/validation';
import useGoogleAuth from '../../hooks/useGoogleAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth handlers
  const handleGoogleSuccess = async (idToken) => {
    setGoogleLoading(true);
    setSubmitError('');
    
    try {
      const result = await loginWithGoogle(idToken);
      if (result.success) {
        const role = localStorage.getItem('role');
        if (role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        setSubmitError(result.error || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      setSubmitError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    setSubmitError(error || 'Đăng nhập Google thất bại');
    setGoogleLoading(false);
  };

  const { signInWithGoogle, isLoading: googleIsLoading, isReady: googleIsReady } = useGoogleAuth(
    handleGoogleSuccess,
    handleGoogleError
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const phoneError = validatePhoneNumber(form.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    if (!form.password || form.password.trim() === '') {
      newErrors.password = 'Mật khẩu là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await login(form.phone, form.password);
      if (result.success) {
        // Get role from localStorage to determine where to navigate
        const role = localStorage.getItem('role');
        if (role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        setSubmitError(result.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      setSubmitError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setSubmitError('');
    signInWithGoogle();
  };

  return (
    <AuthLayout
      title="Xin chào bạn!"
      subtitle="Nhập số điện thoại và mật khẩu để tiếp tục"
      footer={
        <div>
          Chưa có tài khoản?
          <Link className="link" to="/register">
            Đăng ký ngay
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="fields">
        {submitError && (
          <div style={{
            color: '#ef4444',
            fontSize: '13px',
            padding: '8px 12px',
            background: '#fef2f2',
            borderRadius: '8px',
            marginBottom: '8px'
          }}>
            {submitError}
          </div>
        )}
        <AuthInput
          label="Số điện thoại"
          placeholder="0901234567"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          icon={PhoneIcon}
          error={errors.phone}
        />
        <AuthInput
          label="Mật khẩu"
          placeholder="••••••••"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          icon={LockIcon}
          error={errors.password}
        />
        <div className="actions">
          <span></span>
          <Link className="link" to="/forgot">
            Quên mật khẩu?
          </Link>
        </div>
        <button type="submit" className="primary-btn" disabled={loading || googleLoading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span>hoặc</span>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleClick}
          disabled={loading || googleLoading || googleIsLoading || !googleIsReady}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading || googleIsLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;


