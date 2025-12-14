import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    activeDrivers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Load basic stats (mock for now)
      setStats({
        totalUsers: 0,
        totalBookings: 0,
        activeDrivers: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Người dùng',
      value: stats.totalUsers,
      icon: '👥',
      color: 'from-blue-500 to-blue-600',
      path: '/admin/users',
    },
    {
      label: 'Đặt xe',
      value: stats.totalBookings,
      icon: '📋',
      color: 'from-purple-500 to-purple-600',
      path: '/admin/bookings',
    },
    {
      label: 'Tài xế',
      value: stats.activeDrivers,
      icon: '🚗',
      color: 'from-green-500 to-green-600',
      path: '/admin/drivers',
    },
  ];

  const menuItems = [
    { icon: '👥', label: 'Quản lý người dùng', path: '/admin/users', color: 'from-blue-50 to-blue-100' },
    { icon: '🚗', label: 'Quản lý tài xế', path: '/admin/drivers', color: 'from-green-50 to-green-100' },
    { icon: '📋', label: 'Quản lý đặt xe', path: '/admin/bookings', color: 'from-purple-50 to-purple-100' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7f8] pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Quản trị hệ thống</p>
          </div>
          <button onClick={logout} className="btn-secondary text-sm touch-target">
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 max-w-5xl mx-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <button
              key={stat.path}
              onClick={() => navigate(stat.path)}
              className="ui-card text-left hover:shadow-lg transition-all touch-target"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-[#009b77]/10 text-[#009b77] flex items-center justify-center text-2xl">
                  {stat.icon}
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
              <p className="text-2xl font-extrabold text-[#1a1a1a]">{stat.value}</p>
            </button>
          ))}
        </div>

        {/* Quick Navigation */}
        <div className="ui-card space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">⚙️</span>
            <h2 className="section-title m-0">Quản lý</h2>
          </div>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl active:bg-gray-100 touch-target"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white rounded-lg border border-gray-100 flex items-center justify-center text-xl text-[#009b77] shadow-sm">
                  {item.icon}
                </div>
                <span className="font-semibold text-gray-900">{item.label}</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;




