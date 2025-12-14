import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../api/booking.api';
import { driverAPI } from '../../api/driver.api';
import { userAPI } from '../../api/user.api';
import { trackingAPI } from '../../api/tracking.api';
import { mapAPI } from '../../api/map.api';
import MapboxMap from '../MapboxMap';
import { Icons } from '../constants';
import { formatDate } from '../../utils/dateTime';
import './ActivityDetailScreen.css';

// Map BookingStatus sang tiếng Việt
const mapBookingStatusToVietnamese = (status) => {
  const statusMap = {
    'PENDING': 'Đang tìm tài xế',
    'MATCHED': 'Tài xế đang đến điểm đón',
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

// Format giá tiền
const formatPrice = (amount) => {
  if (!amount || amount === 0) return '0₫';
  return `${amount.toLocaleString('vi-VN')}₫`;
};

// Map vehicleType sang tên hiển thị
const mapVehicleTypeToName = (vehicleType) => {
  const typeMap = {
    'MOTORBIKE': 'Xe máy',
    'BIKE': 'Xe máy',
    'CAR_4': 'Ô tô 4 chỗ',
    'CAR_7': 'Ô tô 7 chỗ',
  };
  return typeMap[vehicleType] || vehicleType;
};

const ActivityDetailScreen = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverUser, setDriverUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Map states
  const [routePolyline, setRoutePolyline] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);

  // Fetch booking details
  const fetchBooking = useCallback(async (showLoading = true) => {
    if (!bookingId) return;
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const bookingData = await bookingAPI.getBooking(bookingId);
      setBooking(bookingData);
      
      console.log('[ActivityDetail] Booking fetched, status:', bookingData.status);
      
      // Set map center based on pickup location
      if (bookingData.pickupLocation) {
        setMapCenter({
          lat: bookingData.pickupLocation.latitude,
          lng: bookingData.pickupLocation.longitude,
        });
      }
      
      // Load route polyline based on status
      const bookingStatus = bookingData.status;
      if (bookingStatus === 'MATCHED' && bookingData.driverId) {
        // For MATCHED: Route will be fetched from driver location to pickup (in polling effect)
        // Clear existing route, will be set when driver location is available
        setRoutePolyline(null);
        console.log('[ActivityDetail] Status is MATCHED, route will be fetched when driver location is available');
      } else if (bookingStatus === 'IN_PROGRESS' && bookingData.pickupLocation && bookingData.dropoffLocation) {
        // For IN_PROGRESS: Show route from pickup to dropoff
        if (bookingData.routePolyline) {
          setRoutePolyline(bookingData.routePolyline);
        } else {
          try {
            const route = await mapAPI.getRoute(
              bookingData.pickupLocation.latitude,
              bookingData.pickupLocation.longitude,
              bookingData.dropoffLocation.latitude,
              bookingData.dropoffLocation.longitude,
              'driving'
            );
            if (route?.geometry && Array.isArray(route.geometry)) {
              setRoutePolyline(route.geometry);
            } else if (route?.polyline) {
              setRoutePolyline(route.polyline);
            }
          } catch (err) {
            console.warn('Could not fetch route:', err);
          }
        }
      } else if (bookingData.routePolyline) {
        // For other statuses: Use saved route if available
        setRoutePolyline(bookingData.routePolyline);
      } else if (bookingData.pickupLocation && bookingData.dropoffLocation && bookingStatus === 'PENDING') {
        // For PENDING: Show route from pickup to dropoff
        try {
          const route = await mapAPI.getRoute(
            bookingData.pickupLocation.latitude,
            bookingData.pickupLocation.longitude,
            bookingData.dropoffLocation.latitude,
            bookingData.dropoffLocation.longitude,
            'driving'
          );
          if (route?.geometry && Array.isArray(route.geometry)) {
            setRoutePolyline(route.geometry);
          } else if (route?.polyline) {
            setRoutePolyline(route.polyline);
          }
        } catch (err) {
          console.warn('Could not fetch route:', err);
        }
      }
      
      // Fetch driver info if driverId exists
      if (bookingData.driverId) {
        try {
          // Get driver profile
          const driverData = await driverAPI.getRating(bookingData.driverId);
          setDriverProfile(driverData);
          
          // Get driver user info (including phone number) if userId exists
          if (driverData?.userId) {
            try {
              const userData = await userAPI.getProfile(driverData.userId);
              setDriverUser(userData);
            } catch (userErr) {
              console.warn('Could not fetch driver user info:', userErr);
            }
          }
        } catch (err) {
          console.warn('Could not fetch driver profile:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Không thể tải thông tin chuyến đi.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Poll booking status liên tục để cập nhật realtime cho tất cả trạng thái
  useEffect(() => {
    if (!bookingId || !booking) return;
    
    const status = booking.status;
    // Dừng polling nếu booking đã hoàn thành hoặc hủy
    if (status === 'COMPLETED' || status === 'CANCELED' || status === 'CANCELLED' || status === 'EXPIRED' || status === 'NO_DRIVER_FOUND') {
      return;
    }
    
    let isPolling = true;
    
    const pollBookingStatus = async () => {
      if (!isPolling) return;
      
      try {
        const latestBooking = await bookingAPI.getBooking(bookingId);
        
        // Nếu status thay đổi, cập nhật ngay lập tức
        if (latestBooking?.status && latestBooking.status !== status) {
          console.log('[ActivityDetail] ✓ Status changed:', status, '→', latestBooking.status);
          
          // Cập nhật status và toàn bộ booking data ngay lập tức
          setBooking(prevBooking => {
            const updated = {
              ...prevBooking,
              ...latestBooking,
              status: latestBooking.status
            };
            return updated;
          });
          
          // Refresh toàn bộ booking để lấy đầy đủ thông tin (không hiển thị loading)
          fetchBooking(false).then(() => {
            console.log('[ActivityDetail] ✓ Full booking data refreshed');
          }).catch(err => {
            console.error('[ActivityDetail] ✗ Error refreshing booking:', err);
          });
          
          // Nếu chuyển sang trạng thái cuối cùng, dừng polling
          if (latestBooking.status === 'COMPLETED' || latestBooking.status === 'CANCELED' || latestBooking.status === 'CANCELLED') {
            isPolling = false;
            return;
          }
        } else if (latestBooking) {
          // Cập nhật các thông tin khác của booking (như timestamps, etc.) ngay cả khi status không đổi
          setBooking(prevBooking => ({
            ...prevBooking,
            ...latestBooking
          }));
        }
      } catch (err) {
        console.warn('[ActivityDetail] Failed to poll booking status:', err);
      }
    };
    
    // Poll ngay lập tức lần đầu
    pollBookingStatus();
    
    // Poll mỗi 2 giây để cập nhật realtime
    const interval = setInterval(() => {
      if (isPolling) {
        pollBookingStatus();
      }
    }, 2000);
    
    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [bookingId, booking?.status, fetchBooking]);

  // Poll driver location for MATCHED, DRIVER_ARRIVED, and IN_PROGRESS status (realtime)
  useEffect(() => {
    if (!booking?.driverId) return;
    
    const status = booking.status;
    if (status === 'MATCHED' || status === 'IN_PROGRESS' || status === 'DRIVER_ARRIVED') {
      let lastDriverLat = null;
      let lastDriverLng = null;
      let routeFetchInProgress = false;
      
      const fetchRouteFromDriverToPickup = async (driverLat, driverLng, pickupLat, pickupLng) => {
        if (routeFetchInProgress) return; // Prevent concurrent route fetches
        routeFetchInProgress = true;
        
        try {
          console.log('[ActivityDetail] Fetching route from driver to pickup:', {
            driver: { lat: driverLat, lng: driverLng },
            pickup: { lat: pickupLat, lng: pickupLng }
          });
          
          const route = await mapAPI.getRoute(
            driverLat,
            driverLng,
            pickupLat,
            pickupLng,
            'driving'
          );
          
          // Handle RouteResponse format from MapService
          if (route?.geometry && Array.isArray(route.geometry)) {
            const coordinates = route.geometry.map(point => {
              if (typeof point === 'object' && point !== null) {
                const lat = point.latitude || point.lat;
                const lng = point.longitude || point.lng;
                if (lat !== undefined && lng !== undefined) {
                  return [lng, lat]; // Mapbox uses [lng, lat] format
                }
              }
              if (Array.isArray(point) && point.length >= 2) {
                const first = point[0];
                const second = point[1];
                if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
                  return [second, first]; // Swap to [lng, lat]
                }
                return [first, second];
              }
              return null;
            }).filter(coord => coord !== null);
            
            if (coordinates.length > 0) {
              setRoutePolyline(coordinates);
            }
          } else if (route?.polyline) {
            setRoutePolyline(route.polyline);
          } else if (route?.routes && Array.isArray(route.routes) && route.routes.length > 0) {
            const firstRoute = route.routes[0];
            if (firstRoute.geometry) {
              setRoutePolyline(firstRoute.geometry);
            }
          }
        } catch (err) {
          console.error('[ActivityDetail] ✗ Could not fetch route from driver to pickup:', err);
        } finally {
          routeFetchInProgress = false;
        }
      };
      
      const fetchRouteFromDriverToDropoff = async (driverLat, driverLng, dropoffLat, dropoffLng) => {
        if (routeFetchInProgress) return;
        routeFetchInProgress = true;
        
        try {
          const route = await mapAPI.getRoute(
            driverLat,
            driverLng,
            dropoffLat,
            dropoffLng,
            'driving'
          );
          
          if (route?.geometry && Array.isArray(route.geometry)) {
            const coordinates = route.geometry.map(point => {
              if (typeof point === 'object' && point !== null) {
                const lat = point.latitude || point.lat;
                const lng = point.longitude || point.lng;
                if (lat !== undefined && lng !== undefined) {
                  return [lng, lat];
                }
              }
              if (Array.isArray(point) && point.length >= 2) {
                const first = point[0];
                const second = point[1];
                if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
                  return [second, first];
                }
                return [first, second];
              }
              return null;
            }).filter(coord => coord !== null);
            
            if (coordinates.length > 0) {
              setRoutePolyline(coordinates);
            }
          } else if (route?.polyline) {
            setRoutePolyline(route.polyline);
          }
        } catch (err) {
          console.error('[ActivityDetail] ✗ Could not fetch route from driver to dropoff:', err);
        } finally {
          routeFetchInProgress = false;
        }
      };
      
      const pollDriverLocation = async () => {
        try {
          const location = await trackingAPI.getDriverLocation(booking.driverId);
          if (location) {
            const newDriverLocation = {
              lat: location.latitude,
              lng: location.longitude,
            };
            
            // Always update driver location for realtime tracking
            setDriverLocation(newDriverLocation);
            
            // Check if driver location has changed significantly (more than ~10 meters) to update route
            const hasChanged = lastDriverLat === null || lastDriverLng === null ||
              Math.abs(location.latitude - lastDriverLat) > 0.0001 ||
              Math.abs(location.longitude - lastDriverLng) > 0.0001;
            
            if (hasChanged) {
              lastDriverLat = location.latitude;
              lastDriverLng = location.longitude;
            }
            
            // Update map center to driver location for MATCHED and IN_PROGRESS
            if (status === 'MATCHED' || status === 'IN_PROGRESS') {
              setMapCenter({
                lat: location.latitude,
                lng: location.longitude,
              });
            }
            
            // For MATCHED status: Fetch route from driver to pickup location
            if (status === 'MATCHED' && booking.pickupLocation && hasChanged) {
              await fetchRouteFromDriverToPickup(
                location.latitude,
                location.longitude,
                booking.pickupLocation.latitude,
                booking.pickupLocation.longitude
              );
            }
            
            // For IN_PROGRESS status: Fetch route from driver to dropoff location (realtime)
            if (status === 'IN_PROGRESS' && booking.dropoffLocation && hasChanged) {
              await fetchRouteFromDriverToDropoff(
                location.latitude,
                location.longitude,
                booking.dropoffLocation.latitude,
                booking.dropoffLocation.longitude
              );
            }
          }
        } catch (err) {
          console.warn('[ActivityDetail] Could not fetch driver location:', err);
        }
      };
      
      // Poll every 2 seconds for realtime tracking
      const interval = setInterval(pollDriverLocation, 2000);
      pollDriverLocation(); // Initial call
      
      return () => clearInterval(interval);
    }
  }, [booking?.driverId, booking?.status, booking?.pickupLocation, booking?.dropoffLocation]);

  if (loading) {
    return (
      <div className="activity-detail-container">
        <div className="activity-detail-loading">
          <div className="activity-detail-spinner"></div>
          <p>Đang tải thông tin chuyến đi...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="activity-detail-container">
        <div className="activity-detail-error">
          <p>{error || 'Không tìm thấy thông tin chuyến đi'}</p>
          <button onClick={() => navigate('/activity')} className="activity-detail-back-btn">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const status = booking.status || 'PENDING';
  const statusText = mapBookingStatusToVietnamese(status);
  
  // Determine map markers based on status
  let pickupMarker = null;
  let destinationMarker = null;
  let driverMarker = null;
  
  // PENDING: Show route from pickup to destination
  // MATCHED: Show driver location (if available) heading to pickup, and pickup/destination
  // IN_PROGRESS: Show driver location (if available) heading to destination, and destination
  if (booking.pickupLocation) {
    pickupMarker = {
      lat: booking.pickupLocation.latitude,
      lng: booking.pickupLocation.longitude,
    };
  }
  
  if (booking.dropoffLocation) {
    destinationMarker = {
      lat: booking.dropoffLocation.latitude,
      lng: booking.dropoffLocation.longitude,
    };
  }
  
  // For MATCHED: show driver location heading to pickup (if available)
  // For IN_PROGRESS: show driver location heading to destination (if available)
  // For DRIVER_ARRIVED: show driver location at pickup
  if ((status === 'MATCHED' || status === 'IN_PROGRESS' || status === 'DRIVER_ARRIVED') && driverLocation) {
    driverMarker = driverLocation;
  }
  
  // Route logic:
  // - PENDING: Show route from pickup to dropoff
  // - MATCHED: Show route from driver to pickup (updated realtime)
  // - IN_PROGRESS: Show route from pickup to dropoff

  // Calculate price breakdown
  const priceSnapshot = booking.price || {};
  const baseFare = priceSnapshot.baseFare || 0;
  const distanceFare = priceSnapshot.distanceFare || 0;
  const timeFare = priceSnapshot.timeFare || 0;
  const platformFee = 0; // May need to add this field
  const discount = priceSnapshot.discount || 0;
  const totalPrice = priceSnapshot.finalAmount || 0;

  return (
    <div className="activity-detail-container">
      {/* Header */}
      <div className="activity-detail-header">
        <button 
          className="activity-detail-back-button"
          onClick={() => navigate('/activity')}
        >
          <Icons.ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="activity-detail-title">Chi tiết chuyến đi</h1>
        <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
      </div>

      {/* Map Section */}
      <div className="activity-detail-map">
        <MapboxMap
          height="300px"
          pickupMarker={pickupMarker}
          destinationMarker={destinationMarker}
          driverMarker={driverMarker}
          routePolyline={routePolyline}
          focusLocation={focusLocation}
        />
        {/* Focus to driver location button */}
        {driverMarker && (
          <button
            className="activity-detail-focus-btn"
            onClick={() => {
              setFocusLocation({
                lat: driverMarker.lat,
                lng: driverMarker.lng,
              });
              // Reset focusLocation after a short delay to allow re-triggering
              setTimeout(() => setFocusLocation(null), 100);
            }}
            title="Focus vào vị trí tài xế"
          >
            <Icons.Crosshair className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Status Section */}
      <div className="activity-detail-status-section">
        <div className="activity-detail-status-badge">
          <div className="activity-detail-status-icon">
            {status === 'COMPLETED' ? '✓' : status === 'IN_PROGRESS' ? '🚗' : '⏳'}
          </div>
          <div className="activity-detail-status-info">
            <div className="activity-detail-status-text">{statusText}</div>
            <div className="activity-detail-status-time">
              {formatDate(booking.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Driver Information Section */}
      {booking.driverId && (
        <div className="activity-detail-section">
          <h2 className="activity-detail-section-title">THÔNG TIN TÀI XẾ</h2>
          <div className="activity-detail-driver-info">
            <div className="activity-detail-driver-avatar">
              {driverUser?.fullName?.[0] || 'T'}
            </div>
            <div className="activity-detail-driver-details">
              <div className="activity-detail-driver-name">
                {driverUser?.fullName || `Tài xế ${booking.driverId?.substring(0, 8) || ''}`}
                {driverProfile?.rating && (
                  <span className="activity-detail-driver-rating">
                    ⭐ {driverProfile.rating.toFixed(1)}
                  </span>
                )}
              </div>
              {driverProfile?.vehicle ? (
                <div className="activity-detail-driver-vehicle">
                  {driverProfile.vehicle.brand} {driverProfile.vehicle.model} ({driverProfile.vehicle.color}) - {driverProfile.vehicle.plateNumber}
                </div>
              ) : (
                <div className="activity-detail-driver-vehicle">
                  {mapVehicleTypeToName(booking.vehicleType)}
                </div>
              )}
              {driverUser?.phone && (
                <div className="activity-detail-driver-phone">
                  📞 {driverUser.phone}
                </div>
              )}
            </div>
            <div className="activity-detail-driver-actions">
              <button className="activity-detail-call-btn">
                <Icons.Phone className="w-5 h-5" />
                Gọi điện
              </button>
              <button className="activity-detail-message-btn">
                Nhắn tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Section */}
      <div className="activity-detail-section">
        <h2 className="activity-detail-section-title">LỘ TRÌNH</h2>
        <div className="activity-detail-route">
          <div className="activity-detail-route-item">
            <div className="activity-detail-route-icon pickup-icon">
              <div className="route-icon-circle"></div>
            </div>
            <div className="activity-detail-route-content">
              <div className="activity-detail-route-label">Điểm đón</div>
              <div className="activity-detail-route-address">
                {booking.pickupLocation?.fullAddress || 'Điểm đón'}
              </div>
            </div>
          </div>
          
          <div className="activity-detail-route-line"></div>
          
          <div className="activity-detail-route-item">
            <div className="activity-detail-route-icon destination-icon">
              <Icons.MapPin className="w-5 h-5" />
            </div>
            <div className="activity-detail-route-content">
              <div className="activity-detail-route-label">Điểm đến</div>
              <div className="activity-detail-route-address">
                {booking.dropoffLocation?.fullAddress || 'Điểm đến'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Section */}
      <div className="activity-detail-section">
        <h2 className="activity-detail-section-title">CHI TIẾT THANH TOÁN</h2>
        <div className="activity-detail-payment-details">
          <div className="activity-detail-payment-row">
            <span>Cước phí ({((booking.estimatedDistanceKm || booking.actualDistanceKm || 0).toFixed(2))}km)</span>
            <span>{formatPrice(distanceFare)}</span>
          </div>
          {baseFare > 0 && (
            <div className="activity-detail-payment-row">
              <span>Phí cơ bản</span>
              <span>{formatPrice(baseFare)}</span>
            </div>
          )}
          {timeFare > 0 && (
            <div className="activity-detail-payment-row">
              <span>Phí thời gian</span>
              <span>{formatPrice(timeFare)}</span>
            </div>
          )}
          {platformFee > 0 && (
            <div className="activity-detail-payment-row">
              <span>Phí nền tảng</span>
              <span>{formatPrice(platformFee)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="activity-detail-payment-row discount">
              <span>Khuyến mãi</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="activity-detail-payment-total">
            <span>Tổng cộng</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="activity-detail-payment-method">
            <span>Thanh toán bằng {booking.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Ví điện tử'}</span>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="activity-detail-section">
        <div className="activity-detail-support">
          <span>Cần hỗ trợ về chuyến đi này?</span>
          <button className="activity-detail-support-btn">Liên hệ hỗ trợ</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailScreen;



