import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../api/booking.api';

const AdminBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Note: Admin endpoint might not exist, using mock for now
      setBookings([]);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDING: {
        label: 'Chờ xử lý',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '⏳',
      },
      MATCHED: {
        label: 'Đã tìm thấy',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '🔍',
      },
      IN_PROGRESS: {
        label: 'Đang di chuyển',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '🚗',
      },
      COMPLETED: {
        label: 'Hoàn thành',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: '✅',
      },
      CANCELLED: {
        label: 'Đã hủy',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: '❌',
      },
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: '📋' };
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
            <h1 className="text-xl font-bold text-[#1a1a1a]">Quản lý đặt xe</h1>
            <p className="text-sm text-gray-600">{bookings.length} đặt xe</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 border-b sticky top-[73px] z-10 shadow-sm">
        <div className="flex gap-2 overflow-x-auto max-w-5xl mx-auto">
          {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((f) => {
            const config = getStatusConfig(f);
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap touch-target ${
                  filter === f
                    ? 'bg-[#009b77] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }`}
              >
                {f === 'ALL' ? 'Tất cả' : config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings List */}
      <div className="p-4 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[#009b77] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 font-medium">Đang tải...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">📋</span>
            </div>
            <p className="text-gray-500 text-lg font-medium">Chưa có đặt xe nào</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {bookings.map((booking, index) => {
              const statusConfig = getStatusConfig(booking.status);
              return (
                <div
                  key={booking.bookingId}
                  className="ui-card border-l-4 border-[#009b77]"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">
                        {booking.pickupLocation?.fullAddress ||
                          booking.pickupAddress ||
                          'Điểm đón'}
                      </p>
                      <p className="text-sm text-gray-600">
                        → {booking.dropoffLocation?.fullAddress ||
                          booking.destinationAddress ||
                          'Điểm đến'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">💰 Tổng tiền</p>
                      <p className="font-extrabold text-[#009b77] text-lg">
                        {booking.price?.finalAmount || booking.totalFare
                          ? new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(booking.price?.finalAmount || booking.totalFare)
                          : 'Chưa tính'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">📅 Ngày</p>
                      <p className="text-sm font-medium text-gray-700">
                        {booking.createdAt
                          ? (() => {
                              const formatter = new Intl.DateTimeFormat('vi-VN', {
                                timeZone: 'Asia/Ho_Chi_Minh',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              });
                              return formatter.format(new Date(booking.createdAt));
                            })()
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingsPage;




