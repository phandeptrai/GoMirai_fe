import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI } from '../../api/booking.api';
import { formatDateWithYesterday } from '../../utils/dateTime';
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
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Lấy tất cả bookings của customer (không filter theo status)
        const response = await bookingAPI.getCustomerBookings(null, 0, 50);
        
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
  }, []);

  // Polling để detect khi tài xế nhận chuyến (PENDING → MATCHED) và tự động navigate
  useEffect(() => {
    // Không polling nếu đang ở activity detail page
    if (location.pathname.includes('/activity/')) {
      return;
    }

    const pollPendingBookings = async () => {
      try {
        // Lấy danh sách bookings PENDING và MATCHED của customer để check
        const pendingBookings = await bookingAPI.getCustomerBookings('PENDING', 0, 10);
        const matchedBookings = await bookingAPI.getCustomerBookings('MATCHED', 0, 10);
        
        const pendingList = pendingBookings?.content || pendingBookings?.data || pendingBookings || [];
        const matchedList = matchedBookings?.content || matchedBookings?.data || matchedBookings || [];
        
        // DISABLED: Tự động navigate khi tìm thấy booking MATCHED
        // Người dùng muốn tự quyết định khi nào xem chi tiết booking
        // if (matchedList.length > 0) {
        //   // Lấy booking MATCHED đầu tiên và navigate
        //   const matchedBooking = matchedList[0];
        //   console.log('[ActivityScreen] Found MATCHED booking, navigating to activity detail:', matchedBooking.bookingId);
        //   // Dừng polling
        //   if (pollingIntervalRef.current) {
        //     clearInterval(pollingIntervalRef.current);
        //     pollingIntervalRef.current = null;
        //   }
        //   // Navigate đến màn hình chi tiết booking
        //   navigate(`/activity/${matchedBooking.bookingId}`);
        //   return;
        // }
        
        // Nếu không có MATCHED, check các booking PENDING để xem có chuyển sang MATCHED không
        if (pendingList.length > 0) {
          // Check từng booking để xem có booking nào chuyển sang MATCHED không
          for (const booking of pendingList) {
            try {
              const latestBooking = await bookingAPI.getBooking(booking.bookingId);
              
              // DISABLED: Tự động navigate khi status chuyển sang MATCHED
              // Người dùng muốn tự quyết định khi nào xem chi tiết booking
              // if (latestBooking?.status === 'MATCHED') {
              //   console.log('[ActivityScreen] Driver accepted booking, navigating to activity detail');
              //   // Dừng polling
              //   if (pollingIntervalRef.current) {
              //     clearInterval(pollingIntervalRef.current);
              //     pollingIntervalRef.current = null;
              //   }
              //   // Navigate đến màn hình chi tiết booking
              //   navigate(`/activity/${latestBooking.bookingId}`);
              //   return;
              // }
            } catch (err) {
              console.warn('[ActivityScreen] Failed to check booking status:', err);
            }
          }
        }
      } catch (err) {
        console.warn('[ActivityScreen] Failed to poll pending bookings:', err);
      }
    };

    // Poll ngay lập tức
    pollPendingBookings();

    // Poll mỗi 2 giây để detect status change
    pollingIntervalRef.current = setInterval(pollPendingBookings, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [navigate, location.pathname]);

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

