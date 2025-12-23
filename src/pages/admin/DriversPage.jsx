import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/AdminLayout.css';

const AdminDriversPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const filter = queryParams.get('status');
  const isPendingView = filter === 'PENDING_VERIFICATION';

  useEffect(() => {
    loadDrivers();
  }, [filter]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getDrivers(filter);
      setDrivers(data);
    } catch (error) {
      console.error('Error loading drivers:', error);
      alert('Không thể tải danh sách tài xế');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (driverId) => {
    if (!confirm('Bạn có chắc muốn phê duyệt tài xế này?')) return;
    setActionLoading(driverId);
    try {
      await adminAPI.approveDriver(driverId);
      alert('Đã phê duyệt tài xế thành công');
      window.location.reload(); // Reload trang để cập nhật data
    } catch (error) {
      console.error('Error approving driver:', error);
      alert('Lỗi: Không thể phê duyệt tài xế');
      setActionLoading(null);
    }
  };

  const handleReject = async (driverId) => {
    if (!confirm('Bạn có chắc muốn từ chối tài xế này?')) return;
    setActionLoading(driverId);
    try {
      await adminAPI.rejectDriver(driverId);
      alert('Đã từ chối tài xế');
      window.location.reload(); // Reload trang
    } catch (error) {
      console.error('Error rejecting driver:', error);
      alert('Lỗi: Không thể từ chối tài xế');
      setActionLoading(null);
    }
  };

  const handleSuspend = async (driverId) => {
    if (!confirm('Bạn có chắc muốn cấm tài xế này?')) return;
    setActionLoading(driverId);
    try {
      await adminAPI.suspendDriver(driverId);
      alert('Đã cấm tài xế');
      window.location.reload(); // Reload trang
    } catch (error) {
      console.error('Error suspending driver:', error);
      alert('Lỗi: Không thể cấm tài xế');
      setActionLoading(null);
    }
  };

  const handleUnsuspend = async (driverId) => {
    if (!confirm('Bạn có chắc muốn khôi phục tài xế này?')) return;
    setActionLoading(driverId);
    try {
      await adminAPI.unsuspendDriver(driverId);
      alert('Đã khôi phục tài xế');
      window.location.reload(); // Reload trang
    } catch (error) {
      console.error('Error unsuspending driver:', error);
      alert('Lỗi: Không thể khôi phục tài xế');
      setActionLoading(null);
    }
  };

  const getStatusBadge = (driver) => {
    if (isPendingView) {
      const statusMap = {
        PENDING_VERIFICATION: { label: 'Chờ duyệt', className: 'pending' },
        ACTIVE: { label: 'Hoạt động', className: 'active' },
        BANNED: { label: 'Đã khóa', className: 'banned' },
        REJECTED: { label: 'Từ chối', className: 'rejected' },
      };
      const statusInfo = statusMap[driver.accountStatus] || { label: driver.accountStatus, className: 'pending' };
      return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
    }

    const availabilityMap = {
      ONLINE: { label: 'Online', className: 'active' },
      OFFLINE: { label: 'Offline', className: 'banned' },
    };
    const availabilityInfo = availabilityMap[driver.availabilityStatus] || { label: 'Offline', className: 'banned' };
    return <span className={`status-badge ${availabilityInfo.className}`}>{availabilityInfo.label}</span>;
  };

  const renderActions = (driver) => {
    const isLoading = actionLoading === driver.driverId;

    if (isPendingView) {
      if (driver.accountStatus === 'PENDING_VERIFICATION') {
        return (
          <div className="table-actions">
            <button onClick={() => handleApprove(driver.driverId)} disabled={isLoading} className="action-btn approve">
              {isLoading ? 'Đang xử lý...' : 'Duyệt'}
            </button>
            <button onClick={() => handleReject(driver.driverId)} disabled={isLoading} className="action-btn reject">
              {isLoading ? 'Đang xử lý...' : 'Từ chối'}
            </button>
          </div>
        );
      }
      return null;
    }

    if (driver.accountStatus === 'ACTIVE') {
      return (
        <button onClick={() => handleSuspend(driver.driverId)} disabled={isLoading} className="action-btn reject">
          {isLoading ? 'Đang xử lý...' : 'Khóa'}
        </button>
      );
    }

    if (driver.accountStatus === 'BANNED') {
      return (
        <button onClick={() => handleUnsuspend(driver.driverId)} disabled={isLoading} className="action-btn approve">
          {isLoading ? 'Đang xử lý...' : 'Mở khóa'}
        </button>
      );
    }

    return null;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const title = isPendingView ? 'Xét duyệt tài xế' : 'Quản lý tài xế';
  const subtitle = isPendingView
    ? 'Xem và phê duyệt các yêu cầu đăng ký mới.'
    : 'Quản lý tất cả tài xế trong hệ thống.';

  return (
    <AdminLayout title={title} subtitle={subtitle}>
      <div className="admin-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Đang tải...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <h3 className="empty-title">Không có tài xế nào</h3>
            <p className="empty-subtitle">
              {isPendingView ? 'Chưa có tài xế nào đang chờ duyệt' : 'Chưa có tài xế nào trong hệ thống'}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                {isPendingView ? (
                  <>
                    <th>HỌ TÊN</th>
                    <th>SỐ ĐIỆN THOẠI</th>
                    <th>ĐỊA CHỈ</th>
                    <th>NGÀY SINH</th>
                    <th>EMAIL</th>
                    <th>GPLX</th>
                    <th>THÔNG TIN XE</th>
                    <th>TRẠNG THÁI</th>
                    <th>HÀNH ĐỘNG</th>
                  </>
                ) : (
                  <>
                    <th>TÀI XẾ</th>
                    <th>PHƯƠNG TIỆN</th>
                    <th>GIẤY TỜ</th>
                    <th>TRẠNG THÁI</th>
                    <th>HÀNH ĐỘNG</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.driverId}>
                  {isPendingView ? (
                    <>
                      {/* Họ tên */}
                      <td>
                        <div className="driver-info">
                          <span className="driver-name">
                            {driver.userInfo?.fullName || 'Chưa cập nhật'}
                          </span>
                          <span className="driver-id">#{driver.driverId?.substring(0, 8)}</span>
                        </div>
                      </td>

                      {/* Số điện thoại */}
                      <td>
                        <span style={{ fontWeight: '500' }}>
                          {driver.userInfo?.phone || 'N/A'}
                        </span>
                      </td>

                      {/* Địa chỉ */}
                      <td>
                        {driver.userInfo?.address ? (
                          <div style={{ fontSize: '13px', maxWidth: '200px' }}>
                            {driver.userInfo.address.street && <div>{driver.userInfo.address.street}</div>}
                            {driver.userInfo.address.ward && <div>{driver.userInfo.address.ward}</div>}
                            {driver.userInfo.address.district && <div>{driver.userInfo.address.district}</div>}
                            {driver.userInfo.address.city && <div>{driver.userInfo.address.city}</div>}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Chưa cập nhật</span>
                        )}
                      </td>

                      {/* Ngày sinh */}
                      <td>
                        {driver.userInfo?.dateOfBirth ? (
                          formatDate(driver.userInfo.dateOfBirth)
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Chưa có</span>
                        )}
                      </td>

                      {/* Email */}
                      <td>
                        {driver.userInfo?.email || <span style={{ color: '#9ca3af' }}>Chưa có</span>}
                      </td>

                      {/* GPLX */}
                      <td>
                        <div className="license-info">
                          <span className="license-number" style={{ fontWeight: '600' }}>
                            {driver.licenseNumber || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Thông tin xe */}
                      <td>
                        {driver.vehicle ? (
                          <button
                            onClick={() => setSelectedVehicle(driver.vehicle)}
                            className="vehicle-link"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            {driver.vehicle.brand} {driver.vehicle.model}
                            <br />
                            <span style={{ fontSize: '11px' }}>(Xem chi tiết)</span>
                          </button>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Chưa có</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td>{getStatusBadge(driver)}</td>

                      {/* Hành động */}
                      <td>{renderActions(driver)}</td>
                    </>
                  ) : (
                    <>
                      {/* Driver Info */}
                      <td>
                        <div className="driver-info">
                          <span className="driver-name">{driver.licenseNumber || 'N/A'}</span>
                          <span className="driver-id">#{driver.driverId?.substring(0, 8)}</span>
                        </div>
                      </td>

                      {/* Vehicle Info */}
                      <td>
                        {driver.vehicle ? (
                          <div className="vehicle-info">
                            <span className="vehicle-name">
                              {driver.vehicle.brand} {driver.vehicle.model}
                            </span>
                            <span className="vehicle-type">BKS: {driver.vehicle.plateNumber}</span>
                            <a href="#" className="vehicle-link" onClick={(e) => e.preventDefault()}>
                              {driver.vehicle.type}
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Chưa có thông tin</span>
                        )}
                      </td>

                      {/* License Info */}
                      <td>
                        <div className="license-info">
                          <span className="license-number">GPLX: {driver.licenseNumber || 'N/A'}</span>
                          {driver.vehicle?.registrationDate && (
                            <span className="license-date">{formatDate(driver.vehicle.registrationDate)}</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>{getStatusBadge(driver)}</td>

                      {/* Actions */}
                      <td>{renderActions(driver)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setSelectedVehicle(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '0',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                🚗 Thông tin phương tiện
              </h3>
              <button
                onClick={() => setSelectedVehicle(null)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                    Hãng xe
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                    {selectedVehicle.brand}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                    Model
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                    {selectedVehicle.model}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                    Biển số xe
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                    {selectedVehicle.plateNumber}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                    Loại xe
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                    {selectedVehicle.type}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                    Màu sắc
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                    {selectedVehicle.color}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                    Ngày đăng ký
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                    {formatDate(selectedVehicle.registrationDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setSelectedVehicle(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#009b77',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDriversPage;
