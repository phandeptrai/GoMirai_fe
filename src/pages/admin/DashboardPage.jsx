import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/AdminLayout.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    pendingDrivers: 0,
    pricingRules: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [users, drivers, pricingRules] = await Promise.all([
        adminAPI.getUsers().catch(() => []),
        adminAPI.getDrivers().catch(() => []),
        adminAPI.getPricingRules().catch(() => []),
      ]);

      const pendingDrivers = drivers.filter(d => d.accountStatus === 'PENDING_VERIFICATION').length;

      setStats({
        totalUsers: users.length,
        totalDrivers: drivers.length,
        pendingDrivers,
        pricingRules: pricingRules.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Tổng quan hệ thống"
      subtitle="Thống kê và quản lý tổng quan"
    >
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">Đang tải...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {/* Stats Cards */}
          <div
            onClick={() => navigate('/admin/users')}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Người dùng
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>
              {stats.totalUsers}
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/drivers')}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            {stats.pendingDrivers > 0 && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#e74c3c',
                color: 'white',
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '12px'
              }}>
                {stats.pendingDrivers}
              </div>
            )}
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Tài xế
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>
              {stats.totalDrivers}
            </div>
            {stats.pendingDrivers > 0 && (
              <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '8px', fontWeight: '600' }}>
                {stats.pendingDrivers} chờ duyệt
              </div>
            )}
          </div>

          <div
            onClick={() => navigate('/admin/pricing')}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Bảng giá
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>
              {stats.pricingRules}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
