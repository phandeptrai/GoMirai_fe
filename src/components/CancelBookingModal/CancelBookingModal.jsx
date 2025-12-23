import { useState } from 'react';
import './CancelBookingModal.css';

const CancelBookingModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !booking) return null;

    const cancelReasons = [
        'Đổi ý, không đi nữa',
        'Tìm được phương tiện khác',
        'Thời gian chờ quá lâu',
        'Đặt nhầm địa điểm',
        'Thay đổi kế hoạch',
        'Khác (nhập lý do)',
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedReason) {
            alert('Vui lòng chọn lý do hủy chuyến!');
            return;
        }

        if (selectedReason === 'Khác (nhập lý do)' && !customReason.trim()) {
            alert('Vui lòng nhập lý do hủy chuyến!');
            return;
        }

        setSubmitting(true);

        try {
            const reason = selectedReason === 'Khác (nhập lý do)'
                ? customReason.trim()
                : selectedReason;

            await onConfirm(reason);
        } catch (error) {
            console.error('Error canceling booking:', error);
            alert('Không thể hủy chuyến. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="cancel-booking-modal-overlay" onClick={onClose}>
            <div className="cancel-booking-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cancel-booking-modal-header">
                    <h2 className="cancel-booking-modal-title">Hủy chuyến đi</h2>
                    <button onClick={onClose} className="cancel-booking-modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit} className="cancel-booking-modal-content">
                    <div className="cancel-booking-info">
                        <p className="cancel-booking-warning">
                            ⚠️ Bạn có chắc chắn muốn hủy chuyến đi này?
                        </p>
                        <p className="cancel-booking-trip-info">
                            Chuyến đi: {booking.pickupLocation?.fullAddress || 'Điểm đón'} → {booking.dropoffLocation?.fullAddress || 'Điểm đến'}
                        </p>
                    </div>

                    <div className="cancel-booking-reason-section">
                        <label className="cancel-booking-label">Lý do hủy chuyến *</label>
                        <div className="cancel-booking-reasons">
                            {cancelReasons.map((reason) => (
                                <label key={reason} className="cancel-booking-reason-option">
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                    />
                                    <span>{reason}</span>
                                </label>
                            ))}
                        </div>

                        {selectedReason === 'Khác (nhập lý do)' && (
                            <textarea
                                className="cancel-booking-custom-reason"
                                placeholder="Nhập lý do hủy chuyến..."
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                maxLength={200}
                                rows={3}
                            />
                        )}
                    </div>

                    <div className="cancel-booking-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cancel-booking-btn cancel-booking-btn-back"
                            disabled={submitting}
                        >
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            className="cancel-booking-btn cancel-booking-btn-confirm"
                            disabled={submitting}
                        >
                            {submitting ? 'Đang hủy...' : 'Xác nhận hủy'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CancelBookingModal;
