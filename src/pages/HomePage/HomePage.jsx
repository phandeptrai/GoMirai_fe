import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MapboxMap from '../../components/MapboxMap';
import { SearchIcon } from '../../components/auth/icons';
import BookingSearchModal from '../../components/BookingSearchModal';
import LocationPermissionModal from '../../components/LocationPermissionModal';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import { bookingAPI } from '../../api/booking.api';
import { Icons } from '../../components/constants';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const pollingIntervalRef = useRef(null);
  const [focusLocation, setFocusLocation] = useState(null);
  const { 
    location: currentLocation, 
    loading: locationLoading, 
    error: locationError,
    showPermissionModal,
    handleAllow,
    handleDeny
  } = useCurrentLocation(true); // Hiển thị popup ở HomePage

  // Polling để detect khi tài xế nhận chuyến (PENDING → MATCHED)
  // Chỉ polling khi user đang ở HomePage (không ở activity detail)
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
        //   console.log('[HomePage] Found MATCHED booking, navigating to activity detail:', matchedBooking.bookingId);
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
              //   console.log('[HomePage] Driver accepted booking, navigating to activity detail');
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
              console.warn('[HomePage] Failed to check booking status:', err);
            }
          }
        } else {
          // Không còn booking PENDING hoặc MATCHED nào, dừng polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.warn('[HomePage] Failed to poll pending bookings:', err);
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

  const services = [
    { id: 'car', label: 'Đặt xe', icon: '🚗', bg: 'bg-[#4f8df7]' },
    { id: 'bike', label: 'Xe máy', icon: '🛵', bg: 'bg-[#4f8df7]' },
    { id: 'delivery', label: 'Giao hàng', icon: '📦', bg: 'bg-[#4f8df7]' },
    { id: 'food', label: 'Đồ ăn', icon: '🍜', bg: 'bg-[#4f8df7]' },
  ];

  const recentPlaces = [
    { name: 'Công ty', address: 'Tòa nhà Keangnam, Hà Nội', icon: '🏢' },
    { name: 'Aeon Mall', address: 'Long Biên, Hà Nội', icon: '🛍️' },
  ];

  const navItems = [
    { icon: '🏠', label: 'Trang chủ', path: '/home', active: true },
    { icon: '💳', label: 'Thanh toán', path: '/payment' },
    { icon: '⏰', label: 'Hoạt động', path: '/activity' },
    { icon: '🔔', label: 'Thông báo', path: '/notifications' },
  ];

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-logo">
          <div className="logo-icon">▶</div>
          <span className="logo-text">GoMirai</span>
        </div>
        <div className="header-search" onClick={() => setIsBookingModalOpen(true)}>
          <span className="search-icon">
            <SearchIcon />
          </span>
          <input type="text" placeholder="Tìm kiếm địa điểm..." className="search-input" readOnly />
        </div>
        <div className="header-avatar" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className="avatar-circle">
            <span>👤</span>
          </div>
          <div className="avatar-dot"></div>
        </div>
      </header>

      {/* Map Area */}
      <div className="map-container">
        <MapboxMap 
          height="40vh" 
          focusLocation={focusLocation}
        />
        {/* Focus to current location button */}
        {currentLocation && (
          <button
            className="home-page-focus-btn"
            onClick={() => {
              setFocusLocation({
                lat: currentLocation.lat,
                lng: currentLocation.lng,
              });
              setTimeout(() => setFocusLocation(null), 100);
            }}
            title="Focus vào vị trí hiện tại"
          >
            <Icons.Crosshair className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content Card */}
      <div className="content-card">
        {/* Current Location */}
        <div className="location-section">
          <div className="location-label">
            <span className="location-icon">📍</span>
            <span>Vị trí hiện tại:</span>
          </div>
          <div className="location-address">
            {locationLoading ? 'Đang lấy vị trí...' : 
             locationError ? locationError : 
             currentLocation ? currentLocation.address : '2 Hải Triều, Bến Nghé, Q.1'}
          </div>
        </div>

        {/* Services Grid */}
        <div className="services-grid">
          {services.map((service) => (
            <button 
              key={service.id} 
              className="service-btn"
              onClick={() => {
                if (service.id === 'car') {
                  setIsBookingModalOpen(true);
                }
              }}
            >
              <div className="service-icon">{service.icon}</div>
              <span className="service-label">{service.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Places */}
        <div className="recent-section">
          <h3 className="recent-title">Điểm đến gần đây</h3>
          <div className="recent-list">
            {recentPlaces.map((place, idx) => (
              <div key={idx} className="recent-item">
                <div className="recent-item-icon">{place.icon}</div>
                <div className="recent-item-content">
                  <div className="recent-item-name">{place.name}</div>
                  <div className="recent-item-address">{place.address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Booking Search Modal */}
      <BookingSearchModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />

      {/* Location Permission Modal */}
      <LocationPermissionModal 
        isOpen={showPermissionModal}
        onAllow={handleAllow}
        onDeny={handleDeny}
      />
    </div>
  );
};

export default HomePage;

