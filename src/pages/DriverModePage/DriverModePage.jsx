import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverAPI } from '../../api/driver.api';
import { trackingAPI } from '../../api/tracking.api';
import { bookingAPI } from '../../api/booking.api';
import MapboxMap from '../../components/MapboxMap';
import DriverBookingRequestModal from '../../components/DriverBookingRequestModal/DriverBookingRequestModal';
import { Icons } from '../../components/constants';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import useNotificationWebSocket from '../../hooks/useNotificationWebSocket';
import './DriverModePage.css';

const DriverModePage = () => {
  const navigate = useNavigate();
  const { location: currentLocation, requestLocation } = useCurrentLocation();

  const [driverProfile, setDriverProfile] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Key to force map re-render when going online
  const [pendingBooking, setPendingBooking] = useState(null); // Current booking request being shown
  const [offerQueue, setOfferQueue] = useState([]); // Queue of pending offers
  const [acceptingBooking, setAcceptingBooking] = useState(false); // Track if accepting
  const [focusLocation, setFocusLocation] = useState(null);
  const [rejectedBookingIds, setRejectedBookingIds] = useState(new Set()); // Track rejected booking IDs

  // WebSocket for real-time events - centralized via NotificationService
  const { isConnected: wsConnected, lastNotification, clearNotification } =
    useNotificationWebSocket(driverProfile?.userId);

  // Fetch driver profile and vehicle
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        setLoading(true);

        // Fetch driver profile
        const profile = await driverAPI.getMyProfile();
        setDriverProfile(profile);
        setIsOnline(profile.availabilityStatus === 'ONLINE');

        // Fetch vehicle info
        const vehicleData = await driverAPI.getMyVehicle();
        setVehicle(vehicleData);
      } catch (err) {
        console.error('Error fetching driver data:', err);
        // If not a driver, redirect or show error
        if (err.response?.status === 404 || err.response?.status === 403) {
          navigate('/profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [navigate]);

  // Update location when online
  useEffect(() => {
    if (!isOnline || !currentLocation || !driverProfile || !vehicle) {
      return;
    }

    // Update location function
    const updateLocation = async () => {
      if (!currentLocation || !driverProfile || !vehicle) return;

      try {
        await trackingAPI.updateLocation({
          driverId: driverProfile.driverId,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          status: 'ONLINE',
          vehicleType: vehicle.type,
          lastUpdatedAt: Date.now()
        });
      } catch (err) {
        console.warn('Failed to update location:', err);
      }
    };

    // Update location immediately
    updateLocation();

    // Set up interval to update location every 10 seconds
    const interval = setInterval(() => {
      updateLocation();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [isOnline, currentLocation, driverProfile, vehicle]);

  // Subscribe to WebSocket for real-time booking offers
  // Old WebSocket subscription logic removed.
  // Notification Service automatically pushes to user queue based on userId.


  // Handle WebSocket booking offer - DIRECT PAYLOAD
  // Receives DriverBookingOfferResponse directly (no wrapping)
  // Add to queue instead of showing immediately
  useEffect(() => {
    // Handle envelope { type: 'DRIVER_OFFER', payload: {...} }
    if (lastNotification && lastNotification.type === 'DRIVER_OFFER') {
      const lastOffer = lastNotification.payload;
      console.log('[DriverMode] ✓ Received DRIVER_OFFER:', lastOffer);
      console.log('[DriverMode] Offer details:', {
        bookingId: lastOffer.bookingId,
        fare: lastOffer.estimatedFare,
        pickup: lastOffer.pickupAddress,
        dropoff: lastOffer.dropoffAddress,
        vehicleType: lastOffer.vehicleType
      });

      // Map to booking format for modal
      const bookingOffer = {
        bookingId: lastOffer.bookingId,
        pickupLocation: {
          latitude: lastOffer.pickupLatitude,
          longitude: lastOffer.pickupLongitude,
          fullAddress: lastOffer.pickupAddress || 'Điểm đón',
          address: lastOffer.pickupAddress || 'Điểm đón',
          name: 'Điểm đón'
        },
        dropoffLocation: {
          latitude: lastOffer.dropoffLatitude,
          longitude: lastOffer.dropoffLongitude,
          fullAddress: lastOffer.dropoffAddress || 'Điểm đến',
          address: lastOffer.dropoffAddress || 'Điểm đến',
          name: 'Điểm đến'
        },
        vehicleType: lastOffer.vehicleType,
        estimatedDistanceKm: lastOffer.estimatedDistanceKm || 0,
        estimatedDurationMinutes: lastOffer.estimatedDurationMinutes || 0,
        estimatedFare: lastOffer.estimatedFare || 0,
        currency: lastOffer.currency || 'VND',
        price: {
          totalAmount: lastOffer.estimatedFare || 0,
          finalAmount: lastOffer.estimatedFare || 0,
          estimatedTotal: lastOffer.estimatedFare || 0
        },
        paymentMethod: 'CASH',
        timeLeftSeconds: lastOffer.timeLeftSeconds
      };

      // Check if rejected or mismatch locally
      if (rejectedBookingIds.has(bookingOffer.bookingId)) {
        console.log('[DriverMode] Skipping rejected offer:', bookingOffer.bookingId);
        clearNotification();
        return;
      }

      if (vehicle && bookingOffer.vehicleType &&
        bookingOffer.vehicleType.toUpperCase() !== vehicle.type.toUpperCase()) {
        console.log('[DriverMode] Vehicle type mismatch, skipping offer');
        clearNotification();
        return;
      }

      // ADD TO QUEUE instead of showing immediately
      console.log('[DriverMode] ✓ Adding offer to queue');
      setOfferQueue(prev => [...prev, bookingOffer]);
      clearNotification();
    }
  }, [lastNotification, clearNotification, rejectedBookingIds, vehicle]);

  // Process queue: Show next offer when no popup is active
  useEffect(() => {
    if (!pendingBooking && offerQueue.length > 0) {
      console.log('[DriverMode] ✓ Showing next offer from queue, remaining:', offerQueue.length - 1);
      setPendingBooking(offerQueue[0]);
      setOfferQueue(prev => prev.slice(1)); // Remove first item
    }
  }, [pendingBooking, offerQueue]);


  // Handle offer expired via WebSocket


  const handleToggleStatus = async () => {
    if (toggling) return;

    try {
      setToggling(true);

      if (isOnline) {
        // Go offline
        await driverAPI.setOffline();
        setIsOnline(false);
      } else {
        // Go online - request location if not available
        if (!currentLocation && requestLocation) {
          try {
            await requestLocation();
          } catch (err) {
            console.warn('Failed to get location:', err);
            alert('Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí.');
            setToggling(false);
            return;
          }
        }

        await driverAPI.setOnline();
        setIsOnline(true);

        // Force map to re-center on current location
        setMapKey(prev => prev + 1);
      }

      // Update profile to get latest status
      const updatedProfile = await driverAPI.getMyProfile();
      setDriverProfile(updatedProfile);
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Không thể thay đổi trạng thái. Vui lòng thử lại.');
    } finally {
      setToggling(false);
    }
  };

  const handleEditVehicle = () => {
    navigate('/driver/vehicle');
  };

  const handleAcceptBooking = async () => {
    if (!pendingBooking || acceptingBooking) return;

    try {
      setAcceptingBooking(true);
      const response = await bookingAPI.acceptBooking(pendingBooking.bookingId);

      console.log('[DriverMode] Accept booking response:', response);
      console.log('[DriverMode] Driver profile userId:', driverProfile?.userId);
      console.log('[DriverMode] Response driverId:', response?.driverId);

      // Check if booking was successfully assigned to this driver
      // Note: BookingService stores userId in driverId field, so compare with userId
      if (response && response.status === 'MATCHED' && response.driverId === driverProfile?.userId) {
        // Success - navigate to driver active booking screen
        console.log('[DriverMode] ✓ Booking accepted successfully');

        // NOTE: WebSocket stays connected via NotificationService
        // It uses a single shared connection for all realtime events

        setPendingBooking(null);
        navigate(`/driver/booking/${pendingBooking.bookingId}`);
      } else {
        // Booking was already accepted by another driver or status mismatch
        console.warn('[DriverMode] ✗ Booking accept failed:', {
          status: response?.status,
          responseDriverId: response?.driverId,
          profileUserId: driverProfile?.userId,
          match: response?.driverId === driverProfile?.userId
        });
        alert('Chuyến này đã được tài xế khác nhận');
        setPendingBooking(null);
      }
    } catch (err) {
      console.error('Failed to accept booking:', err);

      // Check error message
      const errorMessage = err.response?.data?.message || err.message || '';
      if (errorMessage.includes('already accepted') || errorMessage.includes('already assigned')) {
        alert('Chuyến này đã được tài xế khác nhận');
      } else {
        alert('Không thể nhận chuyến. Vui lòng thử lại.');
      }

      setPendingBooking(null);
    } finally {
      setAcceptingBooking(false);
    }
  };

  const handleDeclineBooking = async () => {
    if (!pendingBooking) return;

    const bookingId = pendingBooking.bookingId;

    // Immediately hide modal and mark as rejected locally
    setPendingBooking(null);
    setRejectedBookingIds(prev => new Set([...prev, bookingId]));

    // Call API to deactivate offer in backend
    try {
      await driverAPI.rejectBookingOffer(bookingId);
      console.log('[DriverMode] Successfully rejected booking offer:', bookingId);
    } catch (err) {
      console.error('[DriverMode] Failed to reject booking offer:', err);
      // Even if API call fails, we keep it in rejected list to prevent showing again
    }
  };

  if (loading) {
    return (
      <div className="driver-mode-container">
        <div className="driver-mode-loading">
          <div className="driver-mode-spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!driverProfile || !vehicle) {
    return (
      <div className="driver-mode-container">
        <div className="driver-mode-error">
          <p>Không tìm thấy thông tin tài xế</p>
          <button onClick={() => navigate('/profile')} className="driver-mode-back-btn">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Check if account is active
  const canGoOnline = driverProfile.accountStatus === 'ACTIVE';
  const statusText = isOnline ? 'TRỰC TUYẾN' : 'NGOẠI TUYẾN';
  const statusDescription = isOnline
    ? 'Bạn đang trực tuyến'
    : 'Bạn đang ngoại tuyến';
  const statusInstruction = isOnline
    ? 'Tắt trực tuyến để dừng nhận cuốc xe.'
    : 'Bật trực tuyến để bắt đầu nhận cuốc xe.';

  return (
    <div className="driver-mode-container">
      {/* Header */}
      <div className="driver-mode-header">
        <div className="driver-mode-header-left">
          <button
            className="driver-mode-back-button"
            onClick={() => navigate('/home')}
            title="Thoát chế độ tài xế"
          >
            <span className="driver-mode-back-icon">←</span>
            <span className="driver-mode-back-text">Thoát</span>
          </button>
        </div>
        <h1 className="driver-mode-title">Tài xế GoMirai</h1>
        <div className={`driver-mode-status-badge-small ${isOnline ? 'online' : 'offline'}`}>
          {statusText}
        </div>
      </div>

      {/* Map */}
      <div className="driver-mode-map">
        <MapboxMap
          key={mapKey}
          className="driver-mode-mapbox"
          height="100%"
          pickupMarker={isOnline && currentLocation ? {
            lat: currentLocation.lat,
            lng: currentLocation.lng
          } : null}
          focusLocation={focusLocation}
        />
        {/* Focus to current location button */}
        {currentLocation && (
          <button
            className="driver-mode-focus-btn"
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

      {/* Status Panel */}
      <div className="driver-mode-status-panel">
        <button
          className={`driver-mode-toggle-btn ${isOnline ? 'online' : 'offline'}`}
          onClick={handleToggleStatus}
          disabled={toggling || !canGoOnline}
        >
          {toggling ? 'Đang xử lý...' : isOnline ? 'TẮT' : 'BẬT'}
        </button>
        <p className="driver-mode-status-text">{statusDescription}</p>
        <p className="driver-mode-status-instruction">{statusInstruction}</p>
        {!canGoOnline && (
          <p className="driver-mode-warning">
            Tài khoản của bạn chưa được kích hoạt. Vui lòng chờ duyệt.
          </p>
        )}
      </div>

      {/* Vehicle Info Bar */}
      <div className="driver-mode-vehicle-bar">
        <div className="driver-mode-vehicle-info">
          <Icons.Car className="driver-mode-vehicle-icon" />
          <div className="driver-mode-vehicle-details">
            <div className="driver-mode-vehicle-name">
              {vehicle.brand} {vehicle.model}
            </div>
            <div className="driver-mode-vehicle-plate">
              {vehicle.plateNumber} - {vehicle.color}
            </div>
          </div>
        </div>
        <button
          className="driver-mode-edit-btn"
          onClick={handleEditVehicle}
        >
          Sửa
        </button>
      </div>

      {/* Booking Request Modal */}
      {pendingBooking && (
        <DriverBookingRequestModal
          booking={pendingBooking}
          onAccept={handleAcceptBooking}
          onDecline={handleDeclineBooking}
          onClose={handleDeclineBooking}
        />
      )}
    </div>
  );
};

export default DriverModePage;



