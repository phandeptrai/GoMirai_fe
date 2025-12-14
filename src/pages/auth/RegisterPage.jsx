import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthInput from '../../components/auth/AuthInput';
import { PhoneIcon, LockIcon } from '../../components/auth/icons';
import { useAuth } from '../../contexts/AuthContext';
import { validatePhoneNumber, validatePassword } from '../../utils/validation';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
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
    
    const passwordError = validatePassword(form.password);
    if (passwordError) {
      newErrors.password = passwordError;
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
      const result = await register(form.phone, form.password);
      if (result.success) {
        navigate('/home');
      } else {
        setSubmitError(result.error || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      setSubmitError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng ký tài khoản"
      subtitle="Nhập số điện thoại để tạo tài khoản mới"
      footer={
        <div>
          Đã có tài khoản?
          <Link className="link" to="/login">
            Đăng nhập
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
          placeholder="Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          icon={LockIcon}
          error={errors.password}
        />
        <div className="actions" />
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Đang đăng ký...' : 'Đăng ký ngay'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;

