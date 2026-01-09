import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../api/booking.api';
import { driverAPI } from '../../api/driver.api';
import { userAPI } from '../../api/user.api';
import { trackingAPI } from '../../api/tracking.api';
import { mapAPI } from '../../api/map.api';
import { reviewAPI } from '../../api/review.api';
import MapboxMap from '../MapboxMap';
import ReviewModal from '../ReviewModal';
import CancelBookingModal from '../CancelBookingModal/CancelBookingModal';
import { Icons } from '../constants';
import { formatDate } from '../../utils/dateTime';
import useNotificationWebSocket from '../../hooks/useNotificationWebSocket';
import { useAuth } from '../../contexts/AuthContext';
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false); // Track if already reviewed

  // Map states
  const [routePolyline, setRoutePolyline] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);

  const { user } = useAuth();
  
  // Chỉ connect WebSocket khi:
  // 1. Có user đăng nhập
  // 2. Booking chưa hoàn thành (COMPLETED) hoặc chưa bị hủy (CANCELED, NO_DRIVER_FOUND)
  // Disconnect khi booking đã kết thúc để tiết kiệm tài nguyên
  const isBookingEnded = booking && ['COMPLETED', 'CANCELED', 'NO_DRIVER_FOUND'].includes(booking.status);
  const shouldConnectWebSocket = user?.userId && !isBookingEnded;
  
  const { isConnected, lastNotification, clearNotification } = useNotificationWebSocket(
    shouldConnectWebSocket ? user.userId : null
  );

  // Log WebSocket connection status for debugging
  useEffect(() => {
    if (user?.userId) {
      console.log('[ActivityDetail] 📡 WebSocket:', isConnected ? '✅ CONNECTED' : '⏳ Connecting...');
      console.log('[ActivityDetail] User ID:', user.userId);
      console.log('[ActivityDetail] Booking status:', booking?.status || 'loading...');
    }
  }, [isConnected, user?.userId, booking?.status]);

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
      // NOTE: BookingService stores userId in driverId field!
      if (bookingData.driverId) {
        const driverUserId = bookingData.driverId;

        // Fetch aggregated driver info (Vehicle + Name + Real Rating)
        try {
          const driverPublicInfo = await driverAPI.getDriverPublicInfo(driverUserId);
          setDriverProfile(driverPublicInfo);
          
          // Driver name and phone are included in aggregrated response
          if (driverPublicInfo.fullName || driverPublicInfo.phone) {
            setDriverUser({
              fullName: driverPublicInfo.fullName,
              phone: driverPublicInfo.phone
            });
          }
          console.log('[ActivityDetail] ✅ Driver public info fetched:', driverPublicInfo);
        } catch (publicApiErr) {
          console.warn('[ActivityDetail] Public API failed, trying fallback:', publicApiErr.message);
          
          // Fallback to old API (getProfileByUserId)
          try {
            const driverProfileData = await driverAPI.getProfileByUserId(driverUserId);
            setDriverProfile(driverProfileData);
            console.log('[ActivityDetail] ⚠️ Fallback driver profile:', driverProfileData);
          } catch (fallbackErr) {
            console.warn('[ActivityDetail] Could not fetch driver info:', fallbackErr);
          }
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

  // Check if booking already has review
  useEffect(() => {
    const checkReview = async () => {
      if (booking && booking.status === 'COMPLETED') {
        try {
          const exists = await reviewAPI.checkReviewExists(bookingId);
          setHasReviewed(exists);
        } catch (err) {
          console.warn('Could not check review status:', err);
        }
      }
    };

    checkReview();
  }, [booking, bookingId]);

  // Handle cancel booking
  const handleCancelBooking = async (reason) => {
    try {
      await bookingAPI.cancelBooking(bookingId, reason);
      alert('Đã hủy chuyến đi thành công');
      setShowCancelModal(false);

      // Refresh booking data to show updated status
      await fetchBooking(false);

      // Navigate back to activity list after a short delay
      setTimeout(() => {
        navigate('/activity');
      }, 1000);
    } catch (err) {
      console.error('Error canceling booking:', err);
      throw err; // Let modal handle the error
    }
  };


  // Handle WebSocket booking updates via NotificationService
  useEffect(() => {
    if (lastNotification && lastNotification.type === 'BOOKING_STATUS') {
      const update = lastNotification.payload;

      console.log('[ActivityDetail] 📡 Received BOOKING_STATUS notification:', update);
      console.log('[ActivityDetail] Current bookingId:', bookingId, 'Update bookingId:', update.bookingId);

      // Ensure update is for current booking - convert both to string for comparison
      const updateBookingId = String(update.bookingId);
      const currentBookingId = String(bookingId);
      
      if (updateBookingId !== currentBookingId) {
        console.log('[ActivityDetail] ⏭ Skipping update - different booking');
        return;
      }

      console.log('[ActivityDetail] ✓ Received BOOKING_STATUS update:', update.status);

      // Update booking state immediately
      setBooking(prev => ({
        ...prev,
        status: update.status,
        driverId: update.driverId || prev?.driverId,
        // Update other fields if present in payload
        pickupLocation: update.pickupLatitude ? {
          ...prev?.pickupLocation,
          latitude: update.pickupLatitude,
          longitude: update.pickupLongitude,
          address: update.pickupAddress || prev?.pickupLocation?.address
        } : prev?.pickupLocation,
        dropoffLocation: update.dropoffLatitude ? {
          ...prev?.dropoffLocation,
          latitude: update.dropoffLatitude,
          longitude: update.dropoffLongitude,
          address: update.dropoffAddress || prev?.dropoffLocation?.address
        } : prev?.dropoffLocation,
        price: update.estimatedFare ? {
          ...prev?.price,
          finalAmount: update.estimatedFare
        } : prev?.price
      }));

      // Refresh full booking data to ensure consistency (especially driver info)
      if (update.status !== booking?.status) {
        console.log('[ActivityDetail] 🔄 Status changed, refreshing booking data...');
        fetchBooking(false).catch(err => console.error('Error refreshing booking:', err));
      }

      clearNotification();
    }
  }, [lastNotification, bookingId, booking?.status, fetchBooking, clearNotification]);

  // Poll driver location for MATCHED, DRIVER_ARRIVED, and IN_PROGRESS status (realtime)
  useEffect(() => {
    // Need driverProfile.driverId (not booking.driverId which is userId) for Tracking API
    if (!driverProfile?.driverId) return;

    const status = booking?.status;
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
          // Use driverProfile.driverId (driver profile ID) not booking.driverId (userId)
          const location = await trackingAPI.getDriverLocation(driverProfile.driverId);
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


      // Poll every 15 seconds for driver location tracking (reduced from 7s to lower server load)
      const interval = setInterval(pollDriverLocation, 15000);
      pollDriverLocation(); // Initial call

      return () => clearInterval(interval);
    }
  }, [driverProfile?.driverId, booking?.status, booking?.pickupLocation, booking?.dropoffLocation]);

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
              {(driverProfile?.fullName || driverUser?.fullName)?.[0] || 
               (driverProfile?.phone || driverUser?.phone)?.[0] || 'T'}
            </div>
            <div className="activity-detail-driver-details">
              {/* Driver Name */}
              <div className="activity-detail-driver-name">
                {driverProfile?.fullName || driverUser?.fullName || 
                 driverProfile?.phone || driverUser?.phone || 
                 `Tài xế ${booking.driverId?.substring(0, 8) || ''}`}
              </div>
              
              {/* Rating & Reviews (Aggregated from Backend) */}
              {driverProfile && (
                <div className="activity-detail-driver-stats">
                  <span className="activity-detail-driver-rating">
                    ⭐ {driverProfile.rating != null ? driverProfile.rating.toFixed(1) : '0.0'}
                  </span>
                  <span className="activity-detail-driver-trips">
                    • {driverProfile.completedTrips ?? 0} đánh giá
                  </span>
                </div>
              )}
              
              {/* Vehicle Info */}
              {driverProfile?.vehicle ? (
                <div className="activity-detail-driver-vehicle">
                  🚗 {driverProfile.vehicle.brand} {driverProfile.vehicle.model} ({driverProfile.vehicle.color}) - {driverProfile.vehicle.plateNumber}
                </div>
              ) : (
                <div className="activity-detail-driver-vehicle">
                  🚗 {mapVehicleTypeToName(booking.vehicleType)}
                </div>
              )}
              
              {/* Phone */}
              {(driverProfile?.phone || driverUser?.phone) && (
                <div className="activity-detail-driver-phone">
                  📞 {driverProfile?.phone || driverUser?.phone}
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

      {/* Review Button - Only show for COMPLETED trips */}
      {status === 'COMPLETED' && (
        <div className="activity-detail-section">
          {hasReviewed ? (
            <div style={{
              width: '100%',
              padding: '16px',
              background: '#f0f0f0',
              color: '#666',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              ✅ Đã đánh giá chuyến đi này
            </div>
          ) : (
            <button
              onClick={() => setShowReviewModal(true)}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              ⭐ Đánh giá chuyến đi
            </button>
          )}
        </div>
      )}

      {/* Cancel Button - Only show for PENDING trips */}
      {status === 'PENDING' && (
        <div className="activity-detail-section">
          <button
            onClick={() => setShowCancelModal(true)}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #ff5252, #f44336)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ❌ Hủy chuyến đi
          </button>
        </div>
      )}


      {/* Support Section */}
      <div className="activity-detail-section">
        <div className="activity-detail-support">
          <span>Cần hỗ trợ về chuyến đi này?</span>
          <button className="activity-detail-support-btn">Liên hệ hỗ trợ</button>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        booking={booking}
        onSuccess={() => {
          console.log('Review submitted successfully');
          setShowReviewModal(false);
          setHasReviewed(true); // Mark as reviewed
        }}
      />

      {/* Cancel Booking Modal */}
      <CancelBookingModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelBooking}
        booking={booking}
      />
    </div>
  );
};

export default ActivityDetailScreen;



