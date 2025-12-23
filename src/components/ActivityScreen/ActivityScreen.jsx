import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../api/booking.api';
import { formatDateWithYesterday } from '../../utils/dateTime';
import { useAuth } from '../../contexts/AuthContext';
import './ActivityScreen.css';

// Map BookingStatus sang tiếng Việt
const mapBookingStatusToVietnamese = (status) => {
  const statusMap = {
    'PENDING': 'Chờ tài xế',
    'MATCHED': 'Đã có tài xế',
    'DRIVER_ARRIVED': 'Tài xế đã đến',
    'IN_PROGRESS': 'Đang di chuyển',
    'COMPLETED': 'Hoàn thành',
    'CANCELED': 'Đã hủy',
    'CANCELLED': 'Đã hủy',
    'EXPIRED': 'Hết hạn',
    'NO_DRIVER_FOUND': 'Không tìm thấy tài xế',
  };
  return statusMap[status] || status;
};

// Use formatDateWithYesterday from utils
const formatDate = formatDateWithYesterday;

// Format giá tiền
const formatPrice = (priceSnapshot) => {
  if (!priceSnapshot) return '0₫';

  const amount = priceSnapshot.finalAmount || priceSnapshot.estimatedFare || 0;
  return `${amount.toLocaleString('vi-VN')}₫`;
};

const ActivityScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if user is a driver
  const isDriver = user?.role === 'DRIVER';

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Gọi API phù hợp dựa trên role của user
        let response;
        if (isDriver) {
          // Driver: lấy danh sách bookings đã nhận
          response = await bookingAPI.getDriverBookings(null, 0, 50);
        } else {
          // Customer: lấy danh sách bookings đã đặt
          response = await bookingAPI.getCustomerBookings(null, 0, 50);
        }

        // Response có thể là Page object với content array hoặc trực tiếp là array
        const bookingsList = response?.content || response?.data || response || [];

        setBookings(Array.isArray(bookingsList) ? bookingsList : []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Không thể tải lịch sử đặt xe. Vui lòng thử lại.');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isDriver]);

  if (loading) {
    return (
      <div className="activity-list">
        <div className="activity-loading">
          <div className="activity-loading-spinner"></div>
          <p>Đang tải lịch sử đặt xe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-list">
        <div className="activity-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="activity-list">
        <div className="activity-empty">
          <p>Chưa có lịch sử đặt xe nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-list">
      {bookings.map((booking) => {
        const status = booking.status || 'PENDING';
        const statusText = mapBookingStatusToVietnamese(status);
        const isCancelled = status === 'CANCELED' || status === 'CANCELLED' || status === 'EXPIRED';

        return (
          <div
            key={booking.bookingId}
            className="activity-card"
            onClick={() => navigate(`/activity/${booking.bookingId}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="activity-left">
              <div className="activity-info">
                <div className="activity-dest">
                  {booking.dropoffLocation?.fullAddress || 'Điểm đến'}
                </div>
                <div className="activity-date">
                  {formatDate(booking.createdAt)}
                </div>
              </div>
            </div>
            <div className="activity-right">
              <div className="activity-price">
                {formatPrice(booking.price)}
              </div>
              <div className={`activity-status ${isCancelled ? 'status-cancelled' : ''}`}>
                {statusText}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityScreen;

