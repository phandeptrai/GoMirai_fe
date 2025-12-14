import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../constants';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../api/user.api';
import { driverAPI } from '../../api/driver.api';
import './ProfileScreen.css';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const userData = await userAPI.getProfile(user.userId);
        setProfile(userData);

        // Fetch driver profile if exists (try-catch để không ảnh hưởng nếu chưa đăng ký)
        try {
          const driverData = await driverAPI.getMyProfile();
          setDriverProfile(driverData);
        } catch (driverErr) {
          // Không có driver profile hoặc chưa đăng ký - không phải lỗi
          if (driverErr.response?.status !== 404 && driverErr.response?.status !== 403) {
            console.error('Error fetching driver profile:', driverErr);
          }
          setDriverProfile(null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.userId]);

  // Format driver status for display
  const getDriverStatusLabel = (status) => {
    if (!status) return null;
    switch (status) {
      case 'PENDING_VERIFICATION':
        return { text: 'Chờ duyệt', color: '#f97316' };
      case 'ACTIVE':
        return { text: 'Đã duyệt', color: '#059669' };
      case 'REJECTED':
        return { text: 'Bị từ chối', color: '#ef4444' };
      case 'BANNED':
        return { text: 'Bị khóa', color: '#ef4444' };
      default:
        return null;
    }
  };

  // Menu items - hiển thị "Chuyển sang chế độ tài xế" nếu đã là DRIVER, "Đăng ký làm tài xế" nếu chưa
  const menuItems = [
    { icon: Icons.Person, iconColor: '#2563eb', label: 'Thông tin cá nhân', path: '/profile/info' },
    // Nếu đã là DRIVER thì hiển thị "Chuyển sang chế độ tài xế", nếu chưa thì "Đăng ký làm tài xế"
    user?.role === 'DRIVER' ? {
      icon: Icons.Car,
      iconColor: '#0ba360',
      label: 'Chuyển sang chế độ tài xế',
      path: '/driver',
    } : {
      icon: Icons.Car,
      iconColor: '#0ba360',
      label: 'Đăng ký làm tài xế',
      path: '/profile/driver-register',
      status: driverProfile?.accountStatus ? getDriverStatusLabel(driverProfile.accountStatus) : null,
    },
    { icon: Icons.Heart, iconColor: '#ef4444', label: 'Địa điểm đã lưu', path: '/profile/saved' },
    { icon: Icons.CreditCard, iconColor: '#f97316', label: 'Phương thức thanh toán', path: '/payment' },
    { icon: Icons.Shield, iconColor: '#059669', label: 'Trung tâm hỗ trợ', path: '/profile/support' },
    { icon: Icons.Settings, iconColor: '#6b7280', label: 'Cài đặt', path: '/profile/settings' },
  ];

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      navigate('/login');
    }
  };

  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return '';
    // Add +84 prefix if not present
    if (phone.startsWith('0')) {
      return '+84' + phone.substring(1);
    }
    if (!phone.startsWith('+84')) {
      return '+84' + phone;
    }
    return phone;
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.fullName) {
      return profile.fullName;
    }
    if (profile?.phone) {
      return formatPhone(profile.phone);
    }
    return 'Người dùng GoMirai';
  };

  // Get display phone
  const getDisplayPhone = () => {
    if (profile?.phone) {
      return formatPhone(profile.phone);
    }
    return '';
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#5f6c7b' }}>
          <div>Đang tải thông tin...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
          <div>{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '16px', 
              padding: '8px 16px', 
              background: '#0ba360', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Handle PENDING status (profile chưa được tạo)
  if (profile?.status === 'PENDING') {
    return (
      <div className="profile-container">
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#5f6c7b' }}>
          <div style={{ marginBottom: '12px' }}>Đang khởi tạo tài khoản...</div>
          <div style={{ fontSize: '13px', color: '#9aa4b5' }}>
            Vui lòng đợi vài giây rồi tải lại trang
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* User Profile Section */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop" alt="Avatar" />
          </div>
          <div className="profile-play-badge">
            <Icons.Play className="profile-play-icon" />
          </div>
        </div>
        <h2 className="profile-name">{getDisplayName()}</h2>
        {getDisplayPhone() && <p className="profile-phone">{getDisplayPhone()}</p>}
        {profile?.email && <p className="profile-phone" style={{ fontSize: '13px', color: '#9aa4b5', marginTop: '4px' }}>{profile.email}</p>}
      </div>

      {/* Statistics Bar */}
      <div className="profile-stats">
        {/* Đánh giá - Chỉ hiển thị cho DRIVER */}
        {user?.role === 'DRIVER' && (
          <>
            <div className="profile-stat-item">
              <div className="profile-stat-value">
                <span>4.9</span>
                <Icons.Star className="profile-stat-star" />
              </div>
              <div className="profile-stat-label">Đánh giá</div>
            </div>
            <div className="profile-stat-divider"></div>
          </>
        )}
        
        {/* Chuyến đi/chạy */}
        <div className="profile-stat-item">
          <div className="profile-stat-value">12</div>
          <div className="profile-stat-label">
            {user?.role === 'DRIVER' ? 'Chuyến đã chạy' : 'Chuyến đã đi'}
          </div>
        </div>
        <div className="profile-stat-divider"></div>
        
        {/* Thành viên */}
        <div className="profile-stat-item">
          <div className="profile-stat-value">Vàng</div>
          <div className="profile-stat-label">Thành viên</div>
        </div>
      </div>

      {/* Rewards Banner */}
      <div className="profile-rewards-banner">
        <div className="profile-rewards-content">
          <div className="profile-rewards-title">GoMirai Rewards</div>
          <div className="profile-rewards-subtitle">Tích lũy 300 điểm nữa để lên hạng</div>
        </div>
        <Icons.ArrowRight className="profile-rewards-arrow" />
      </div>

      {/* Menu List */}
      <div className="profile-menu">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <button
              key={index}
              className="profile-menu-item"
              onClick={() => navigate(item.path)}
            >
              <div className="profile-menu-left">
                <div className="profile-menu-icon" style={{ color: item.iconColor }}>
                  <IconComponent className="profile-menu-icon-svg" />
                </div>
              </div>
              <span className="profile-menu-label">{item.label}</span>
              {item.status ? (
                <span className="profile-menu-status" style={{ color: item.status.color }}>
                  {item.status.text}
                </span>
              ) : (
                <Icons.ArrowRight className="profile-menu-arrow" />
              )}
            </button>
          );
        })}
      </div>

      {/* Logout Button */}
      <button className="profile-logout-btn" onClick={handleLogout}>
        <div className="profile-logout-icon">
          <Icons.Logout className="profile-logout-icon-svg" />
        </div>
        <span className="profile-logout-text">Đăng xuất</span>
      </button>
    </div>
  );
};

export default ProfileScreen;

