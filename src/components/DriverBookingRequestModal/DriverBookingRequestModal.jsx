import { useState, useEffect } from 'react';
import MapboxMap from '../MapboxMap';
import { Icons } from '../constants';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import './DriverBookingRequestModal.css';

// Format giá tiền
const formatPrice = (amount) => {
  if (!amount || amount === 0) return '0₫';
  return `${amount.toLocaleString('vi-VN')}₫`;
};

// Map payment method
const mapPaymentMethod = (method) => {
  const methodMap = {
    'CASH': 'Tiền mặt',
    'CARD': 'Thẻ',
    'WALLET': 'Ví điện tử',
  };
  return methodMap[method] || method;
};

const DriverBookingRequestModal = ({ booking, onAccept, onDecline, onClose }) => {
  const { location: currentLocation } = useCurrentLocation();
  
  // Use timeLeftSeconds from booking if available, otherwise default to 30
  const initialTimeLeft = booking?.timeLeftSeconds || 30;
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);

  // Update timeLeft when booking changes
  useEffect(() => {
    if (booking?.timeLeftSeconds !== undefined) {
      setTimeLeft(booking.timeLeftSeconds);
    }
  }, [booking?.timeLeftSeconds]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      // Auto decline when timer runs out
      if (onDecline) {
        onDecline();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onDecline]);

  // Load route if available
  useEffect(() => {
    if (booking?.pickupLocation && booking?.dropoffLocation) {
      // Optionally load route polyline here
      // For now, we'll just use the booking's routePolyline if available
      if (booking.routePolyline) {
        setRoutePolyline(booking.routePolyline);
      }
    }
  }, [booking]);

  if (!booking) return null;

  const price = booking.price?.totalAmount || booking.price?.finalAmount || booking.price?.estimatedTotal || booking.estimatedFare || 0;
  const distance = booking.estimatedDistanceKm || 0;
  const duration = booking.estimatedDurationMinutes || 0;
  const currency = booking.currency || 'VND';
  const paymentMethod = mapPaymentMethod(booking.paymentMethod || 'CASH');

  // Debug logging
  console.log('[Modal] Booking data:', booking);
  console.log('[Modal] Price:', price, 'from:', {
    totalAmount: booking.price?.totalAmount,
    finalAmount: booking.price?.finalAmount,
    estimatedTotal: booking.price?.estimatedTotal,
    estimatedFare: booking.estimatedFare
  });
  console.log('[Modal] Pickup address:', booking.pickupLocation?.fullAddress || booking.pickupLocation?.address);
  console.log('[Modal] Dropoff address:', booking.dropoffLocation?.fullAddress || booking.dropoffLocation?.address);

  return (
    <div className="driver-booking-modal-overlay" onClick={onClose}>
      <div className="driver-booking-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Map Area */}
        <div className="driver-booking-modal-map">
          <MapboxMap
            height="100%"
            pickupMarker={booking.pickupLocation ? {
              lat: booking.pickupLocation.latitude,
              lng: booking.pickupLocation.longitude
            } : null}
            destinationMarker={booking.dropoffLocation ? {
              lat: booking.dropoffLocation.latitude,
              lng: booking.dropoffLocation.longitude
            } : null}
            routePolyline={routePolyline}
            focusLocation={focusLocation}
          />
          <div className="driver-booking-modal-map-icon">
            <Icons.Navigation className="w-8 h-8" style={{ color: '#3b82f6' }} />
          </div>
          {/* Focus to current location button */}
          {currentLocation && (
            <button
              className="driver-booking-modal-focus-btn"
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

        {/* Booking Details Card */}
        <div className="driver-booking-modal-card">
          <div className="driver-booking-modal-badge">
            Cuốc xe mới
          </div>

          {/* Price and Distance */}
          <div className="driver-booking-modal-price-section">
            <div className="driver-booking-modal-price">
              {formatPrice(price)}
            </div>
            <div className="driver-booking-modal-distance">
              {distance > 0 ? `${distance.toFixed(2)} km` : ''} {duration > 0 ? `• ${duration} phút` : ''} • {paymentMethod}
            </div>
          </div>

          {/* Pickup Location */}
          <div className="driver-booking-modal-location">
            <div className="driver-booking-modal-location-icon pickup">
              <Icons.MapPin className="w-4 h-4" />
            </div>
            <div className="driver-booking-modal-location-details">
              <div className="driver-booking-modal-location-label">Đón khách tại</div>
              <div className="driver-booking-modal-location-name">
                {booking.pickupLocation?.name || 'Điểm đón'}
              </div>
              <div className="driver-booking-modal-location-address">
                {booking.pickupLocation?.fullAddress || booking.pickupLocation?.address || 'Đang tải địa chỉ...'}
              </div>
            </div>
          </div>

          {/* Dropoff Location */}
          <div className="driver-booking-modal-location">
            <div className="driver-booking-modal-location-icon dropoff">
              <Icons.MapPin className="w-4 h-4" />
            </div>
            <div className="driver-booking-modal-location-details">
              <div className="driver-booking-modal-location-label">- Trả khách tại</div>
              <div className="driver-booking-modal-location-name">
                {booking.dropoffLocation?.name || 'Điểm đến'}
              </div>
              <div className="driver-booking-modal-location-address">
                {booking.dropoffLocation?.fullAddress || booking.dropoffLocation?.address || 'Đang tải địa chỉ...'}
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="driver-booking-modal-timer">
            {timeLeft}s
          </div>

          {/* Action Buttons */}
          <div className="driver-booking-modal-actions">
            <button
              className="driver-booking-modal-btn decline"
              onClick={onDecline}
            >
              Bỏ qua
            </button>
            <button
              className="driver-booking-modal-btn accept"
              onClick={onAccept}
              disabled={timeLeft <= 0}
            >
              {timeLeft <= 0 ? 'Hết hạn' : 'Nhận chuyến'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverBookingRequestModal;


