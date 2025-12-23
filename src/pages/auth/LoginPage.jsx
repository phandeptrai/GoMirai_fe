import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthInput from '../../components/auth/AuthInput';
import { PhoneIcon, LockIcon } from '../../components/auth/icons';
import { useAuth } from '../../contexts/AuthContext';
import { validatePhoneNumber } from '../../utils/validation';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;

