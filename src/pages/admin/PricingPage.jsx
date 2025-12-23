import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/AdminLayout.css';

const AdminPricingPage = () => {
    const [pricingRules, setPricingRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRule, setEditingRule] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        vehicleType: '',
        baseFare: '',
        perKmRate: '',
        perMinuteRate: '',
        surgeMultiplier: '1.0',
        region: 'HCM',
        active: true,
    });

    useEffect(() => {
        loadPricingRules();
    }, []);

    const loadPricingRules = async () => {
        setLoading(true);
        try {
            const data = await adminAPI.getPricingRules();
            setPricingRules(data);
        } catch (error) {
            console.error('Error loading pricing rules:', error);
            alert('Không thể tải danh sách giá cước');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const ruleData = {
                ...formData,
                baseFare: parseFloat(formData.baseFare),
                perKmRate: parseFloat(formData.perKmRate),
                perMinuteRate: parseFloat(formData.perMinuteRate),
                surgeMultiplier: parseFloat(formData.surgeMultiplier),
            };

            if (editingRule) {
                await adminAPI.updatePricingRule(editingRule.ruleId, ruleData);
                alert('Cập nhật giá cước thành công');
            } else {
                await adminAPI.createPricingRule(ruleData);
                alert('Tạo giá cước mới thành công');
            }

            window.location.reload(); // Reload trang để cập nhật data
        } catch (error) {
            console.error('Error saving pricing rule:', error);
            alert('Lỗi: Không thể lưu giá cước');
        }
    };

    const openCreateModal = () => {
        setEditingRule(null);
        setFormData({
            vehicleType: '',
            baseFare: '',
            perKmRate: '',
            perMinuteRate: '',
            surgeMultiplier: '1.0',
            region: 'HCM',
            active: true,
        });
        setShowModal(true);
    };

    const openEditModal = (rule) => {
        setEditingRule(rule);
        setFormData({
            vehicleType: rule.vehicleType,
            baseFare: rule.baseFare.toString(),
            perKmRate: rule.perKmRate.toString(),
            perMinuteRate: rule.perMinuteRate.toString(),
            surgeMultiplier: rule.surgeMultiplier.toString(),
            region: rule.region,
            active: rule.active,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingRule(null);
    };

    const getVehicleTypeLabel = (type) => {
        const labels = {
            MOTORBIKE: '🏍️ Xe máy',
            CAR_4: '🚗 Xe 4 chỗ',
            CAR_7: '🚙 Xe 7 chỗ',
        };
        return labels[type] || type;
    };

    return (
        <AdminLayout
            title="Cấu hình giá cước"
            subtitle="Quản lý bảng giá theo loại phương tiện."
        >
            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <button
                    onClick={openCreateModal}
                    style={{
                        padding: '10px 20px',
                        background: '#009b77',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    + Tạo quy tắc giá mới
                </button>
            </div>

            <div className="admin-table-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Đang tải...</p>
                    </div>
                ) : pricingRules.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💰</div>
                        <h3 className="empty-title">Chưa có quy tắc giá nào</h3>
                        <p className="empty-subtitle">Tạo quy tắc giá đầu tiên để bắt đầu</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>LOẠI XE</th>
                                <th>KHU VỰC</th>
                                <th>GIÁ MỞ CỬA</th>
                                <th>GIÁ/KM</th>
                                <th>GIÁ/PHÚT</th>
                                <th>CAO ĐIỂM</th>
                                <th>TRẠNG THÁI</th>
                                <th>HÀNH ĐỘNG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pricingRules.map((rule) => (
                                <tr key={rule.ruleId}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>
                                            {getVehicleTypeLabel(rule.vehicleType)}
                                        </div>
                                    </td>
                                    <td>{rule.region}</td>
                                    <td style={{ fontWeight: '600' }}>{rule.baseFare.toLocaleString()}đ</td>
                                    <td>{rule.perKmRate.toLocaleString()}đ</td>
                                    <td>{rule.perMinuteRate.toLocaleString()}đ</td>
                                    <td>
                                        {rule.surgeMultiplier > 1 ? (
                                            <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                                                x{rule.surgeMultiplier}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#9ca3af' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${rule.active ? 'active' : 'banned'}`}>
                                            {rule.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => openEditModal(rule)}
                                            className="action-btn approve"
                                        >
                                            Chỉnh sửa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                                {editingRule ? 'Chỉnh sửa giá cước' : 'Tạo giá cước mới'}
                            </h2>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6b7280'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                    Loại xe
                                </label>
                                <select
                                    value={formData.vehicleType}
                                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="">Chọn loại xe</option>
                                    <option value="MOTORBIKE">🏍️ Xe máy</option>
                                    <option value="CAR_4">🚗 Xe 4 chỗ</option>
                                    <option value="CAR_7">🚙 Xe 7 chỗ</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                    Giá mở cửa (đ)
                                </label>
                                <input
                                    type="number"
                                    value={formData.baseFare}
                                    onChange={(e) => setFormData({ ...formData, baseFare: e.target.value })}
                                    required
                                    step="0.01"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                    Giá/km (đ)
                                </label>
                                <input
                                    type="number"
                                    value={formData.perKmRate}
                                    onChange={(e) => setFormData({ ...formData, perKmRate: e.target.value })}
                                    required
                                    step="0.01"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                    Giá/phút (đ)
                                </label>
                                <input
                                    type="number"
                                    value={formData.perMinuteRate}
                                    onChange={(e) => setFormData({ ...formData, perMinuteRate: e.target.value })}
                                    required
                                    step="0.01"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                    Hệ số cao điểm
                                </label>
                                <input
                                    type="number"
                                    value={formData.surgeMultiplier}
                                    onChange={(e) => setFormData({ ...formData, surgeMultiplier: e.target.value })}
                                    required
                                    step="0.1"
                                    min="1.0"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                                    Khu vực
                                </label>
                                <select
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="HCM">Hồ Chí Minh</option>
                                    <option value="HN">Hà Nội</option>
                                    <option value="DN">Đà Nẵng</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <label htmlFor="active" style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                    Kích hoạt quy tắc giá này
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        background: '#f3f4f6',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        background: '#009b77',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {editingRule ? 'Cập nhật' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminPricingPage;
