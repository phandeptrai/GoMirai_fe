import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/AdminLayout.css';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Quản lý người dùng"
      subtitle="Danh sách tất cả người dùng trong hệ thống."
    >
      <div className="admin-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Đang tải...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3 className="empty-title">Chưa có người dùng nào</h3>
            <p className="empty-subtitle">Chưa có người dùng nào đăng ký trong hệ thống</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>USER ID</th>
                <th>SỐ ĐIỆN THOẠI</th>
                <th>HỌ TÊN</th>
                <th>EMAIL</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <div className="driver-id">
                      #{user.userId?.substring(0, 8)}...
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>
                      {user.phoneNumber || 'N/A'}
                    </div>
                  </td>
                  <td>
                    {user.fullName || <span style={{ color: '#9ca3af' }}>Chưa cập nhật</span>}
                  </td>
                  <td>
                    {user.email || <span style={{ color: '#9ca3af' }}>Chưa có</span>}
                  </td>
                  <td>
                    <span className="status-badge active">
                      {user.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
