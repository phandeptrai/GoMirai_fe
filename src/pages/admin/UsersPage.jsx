import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../api/user.api';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      CUSTOMER: 'bg-blue-100 text-blue-800',
      DRIVER: 'bg-green-100 text-green-800',
      ADMIN: 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-[#f5f7f8] pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg active:bg-gray-200 touch-target"
          >
            <span className="text-xl text-[#1a1a1a]">←</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Quản lý người dùng</h1>
            <p className="text-sm text-gray-600">{users.length} người dùng</p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="p-4 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[#009b77] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 font-medium">Đang tải...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">👥</span>
            </div>
            <p className="text-gray-500 text-lg font-medium">Chưa có người dùng nào</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {users.map((user, index) => (
              <div
                key={user.userId}
                className="ui-card border-l-4 border-[#009b77]"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-11 h-11 bg-[#009b77]/10 rounded-lg flex items-center justify-center text-xl text-[#009b77]">
                        👤
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {user.fullName || 'Người dùng'}
                        </p>
                        <p className="text-xs text-gray-500">ID: {user.userId}</p>
                      </div>
                    </div>
                    <div className="ml-12 space-y-1">
                      {user.phoneNumber && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span>📱</span> {user.phoneNumber}
                        </p>
                      )}
                      {user.email && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span>📧</span> {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-xl text-xs font-bold border ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {user.role || 'CUSTOMER'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;




