import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../api/user.api';
import { Icons } from '../../components/constants';
import './ProfileInfoPage.css';

const ProfileInfoPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await userAPI.getProfile(user.userId);
        
        // Format date for input (yyyy-mm-dd)
        let dateOfBirthFormatted = '';
        if (data.dateOfBirth) {
          const date = new Date(data.dateOfBirth);
          dateOfBirthFormatted = date.toISOString().split('T')[0];
        }

        // Format address as string
        let addressString = '';
        if (data.address) {
          const addr = data.address;
          const parts = [];
          if (addr.street) parts.push(addr.street);
          if (addr.city) parts.push(addr.city);
          if (addr.state) parts.push(addr.state);
          if (addr.zipCode) parts.push(addr.zipCode);
          if (addr.country) parts.push(addr.country);
          addressString = parts.join(', ');
        }

        setForm({
          fullName: data.fullName || '',
          phone: data.phone || '',
          email: data.email || '',
          dateOfBirth: dateOfBirthFormatted,
          address: addressString,
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) {
      setError(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (form.email && form.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = 'Email không hợp lệ';
      }
    }

    // Date validation
    if (form.dateOfBirth) {
      const date = new Date(form.dateOfBirth);
      if (isNaN(date.getTime())) {
        newErrors.dateOfBirth = 'Ngày sinh không hợp lệ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Parse address string to Address object
      let addressObj = null;
      if (form.address && form.address.trim() !== '') {
        const parts = form.address.split(',').map(p => p.trim());
        addressObj = {
          street: parts[0] || null,
          city: parts[1] || null,
          state: parts[2] || null,
          zipCode: parts[3] || null,
          country: parts[4] || 'Vietnam',
        };
      }

      // Parse date - backend nhận ISO string hoặc timestamp
      let dateOfBirthObj = null;
      if (form.dateOfBirth && form.dateOfBirth.trim() !== '') {
        // Gửi dạng ISO string, Spring Boot sẽ tự parse
        dateOfBirthObj = new Date(form.dateOfBirth).toISOString();
      }

      // Chỉ gửi các field có giá trị, null sẽ được backend ignore
      const updateData = {};
      if (form.fullName && form.fullName.trim() !== '') {
        updateData.fullName = form.fullName.trim();
      }
      if (form.email && form.email.trim() !== '') {
        updateData.email = form.email.trim();
      }
      if (addressObj) {
        updateData.address = addressObj;
      }
      if (dateOfBirthObj) {
        updateData.dateOfBirth = dateOfBirthObj;
      }
      // Phone không được thay đổi, không gửi lên

      const updatedProfile = await userAPI.updateProfile(user.userId, updateData);
      
      // Cập nhật form với data mới từ server
      let dateOfBirthFormatted = '';
      if (updatedProfile.dateOfBirth) {
        const date = new Date(updatedProfile.dateOfBirth);
        dateOfBirthFormatted = date.toISOString().split('T')[0];
      }

      let addressString = '';
      if (updatedProfile.address) {
        const addr = updatedProfile.address;
        const parts = [];
        if (addr.street) parts.push(addr.street);
        if (addr.city) parts.push(addr.city);
        if (addr.state) parts.push(addr.state);
        if (addr.zipCode) parts.push(addr.zipCode);
        if (addr.country) parts.push(addr.country);
        addressString = parts.join(', ');
      }

      setForm({
        fullName: updatedProfile.fullName || '',
        phone: updatedProfile.phone || '',
        email: updatedProfile.email || '',
        dateOfBirth: dateOfBirthFormatted,
        address: addressString,
      });

      // Hiển thị thông báo thành công
      setSuccess(true);
      setError(null);
      
      // Tự động ẩn thông báo sau 2 giây
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      let message = 'Không thể cập nhật thông tin. Vui lòng thử lại.';
      
      if (err.response?.data) {
        const data = err.response.data;
        if (Array.isArray(data.errors)) {
          message = data.errors.map(e => e.defaultMessage || e.message).join(', ');
        } else if (data.message) {
          message = data.message;
        }
      }
      
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    if (phone.startsWith('0')) {
      return '+84' + phone.substring(1);
    }
    if (!phone.startsWith('+84')) {
      return '+84' + phone;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="profile-info-page">
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#5f6c7b' }}>
          Đang tải thông tin...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-info-page">
      {/* Header */}
      <header className="profile-info-header">
        <button className="profile-info-back" onClick={() => navigate(-1)}>
          <Icons.ArrowLeft className="profile-info-back-icon" />
        </button>
        <h1 className="profile-info-title">Thông tin cá nhân</h1>
        <button 
          className="profile-info-save-btn" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </header>

      {/* Content */}
      <div className="profile-info-content">
        {error && (
          <div className="profile-info-error">
            {error}
          </div>
        )}
        {success && (
          <div className="profile-info-success">
            Đã lưu thông tin thành công!
          </div>
        )}

        {/* Profile Picture */}
        <div className="profile-info-avatar-section">
          <div className="profile-info-avatar-wrapper">
            <div className="profile-info-avatar">
              <img 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop" 
                alt="Avatar" 
              />
            </div>
            <div className="profile-info-avatar-edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
          </div>
          <p className="profile-info-avatar-hint">Chạm để đổi ảnh đại diện</p>
        </div>

        {/* Form Fields */}
        <div className="profile-info-fields">
          {/* Full Name */}
          <div className="profile-info-field">
            <label className="profile-info-field-label">HỌ VÀ TÊN</label>
            <input
              type="text"
              className="profile-info-field-input"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nhập họ và tên"
            />
            {errors.fullName && (
              <span className="profile-info-field-error">{errors.fullName}</span>
            )}
          </div>

          {/* Phone Number */}
          <div className="profile-info-field">
            <label className="profile-info-field-label">SỐ ĐIỆN THOẠI</label>
            <div className="profile-info-field-phone-wrapper">
              <input
                type="text"
                className="profile-info-field-input profile-info-field-input-readonly"
                name="phone"
                value={form.phone}
                readOnly
              />
              <div className="profile-info-field-phone-icon">
                <Icons.Shield className="profile-info-shield-icon" />
              </div>
            </div>
            <p className="profile-info-field-hint">
              Số điện thoại dùng để đăng nhập và không thể thay đổi.
            </p>
          </div>

          {/* Email */}
          <div className="profile-info-field">
            <label className="profile-info-field-label">EMAIL</label>
            <input
              type="email"
              className="profile-info-field-input"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Nhập email"
            />
            {errors.email && (
              <span className="profile-info-field-error">{errors.email}</span>
            )}
          </div>

          {/* Date of Birth */}
          <div className="profile-info-field">
            <label className="profile-info-field-label">NGÀY SINH</label>
            <input
              type="date"
              className="profile-info-field-input"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              placeholder="mm/dd/yyyy"
            />
            {errors.dateOfBirth && (
              <span className="profile-info-field-error">{errors.dateOfBirth}</span>
            )}
          </div>

          {/* Address */}
          <div className="profile-info-field">
            <label className="profile-info-field-label">ĐỊA CHỈ</label>
            <input
              type="text"
              className="profile-info-field-input"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Nhập địa chỉ của bạn"
            />
            {errors.address && (
              <span className="profile-info-field-error">{errors.address}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoPage;

