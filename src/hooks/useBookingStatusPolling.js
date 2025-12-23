import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../api/booking.api';

/**
 * Hook để polling booking status và tự động navigate khi status thay đổi
 * @param {string} bookingId - ID của booking cần theo dõi
 * @param {string} currentPath - Path hiện tại của user (để tránh navigate nếu đã ở đúng trang)
 * @param {boolean} enabled - Có bật polling không
 */
export const useBookingStatusPolling = (bookingId, currentPath = null, enabled = true) => {
  const navigate = useNavigate();
  const previousStatusRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    if (!bookingId || !enabled) return;

    const pollBookingStatus = async () => {
      try {
        const booking = await bookingAPI.getBooking(bookingId);
        const currentStatus = booking?.status;

        // DISABLED: Tự động navigate khi status chuyển sang MATCHED
        // Người dùng muốn tự quyết định khi nào xem chi tiết booking
        // if (previousStatusRef.current === 'PENDING' && currentStatus === 'MATCHED') {
        //   // Chỉ navigate nếu user chưa ở trang activity detail
        //   if (!currentPath || !currentPath.includes(`/activity/${bookingId}`)) {
        //     console.log('[BookingPolling] Status changed to MATCHED, navigating to activity detail');
        //     navigate(`/activity/${bookingId}`);
        //   }
        // }

        previousStatusRef.current = currentStatus;

        // Dừng polling nếu booking đã hoàn thành hoặc bị hủy
        if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELED' || currentStatus === 'CANCELLED') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.warn('[BookingPolling] Failed to poll booking status:', err);
      }
    };

    // Poll ngay lập tức để lấy status hiện tại
    pollBookingStatus();

    // Poll mỗi 2 giây để detect status change
    pollingIntervalRef.current = setInterval(pollBookingStatus, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [bookingId, enabled, navigate, currentPath]);
};

export default useBookingStatusPolling;





