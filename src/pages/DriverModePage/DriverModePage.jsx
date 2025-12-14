import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverAPI } from '../../api/driver.api';
import { trackingAPI } from '../../api/tracking.api';
import { bookingAPI } from '../../api/booking.api';
import MapboxMap from '../../components/MapboxMap';
import DriverBookingRequestModal from '../../components/DriverBookingRequestModal/DriverBookingRequestModal';
import { Icons } from '../../components/constants';
import useCurrentLocation from '../../hooks/useCurrentLocation';
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
  const [pendingBooking, setPendingBooking] = useState(null); // Current booking request
  const [acceptingBooking, setAcceptingBooking] = useState(false); // Track if accepting
  const [focusLocation, setFocusLocation] = useState(null);
  const [rejectedBookingIds, setRejectedBookingIds] = useState(new Set()); // Track rejected booking IDs

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
    
    // Set up interval to update location every 5 seconds
    const interval = setInterval(() => {
      updateLocation();
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isOnline, currentLocation, driverProfile, vehicle]);

  // Poll for booking offers when online
  useEffect(() => {
    if (!isOnline || !driverProfile || !vehicle) {
      return; // Don't poll if offline, no profile
    }
    
    const pollBookingOffers = async () => {
      try {
        const offers = await driverAPI.getBookingOffers();
        
        console.log('[DriverMode] Received offers:', offers);
        console.log('[DriverMode] Vehicle type:', vehicle?.type);
        console.log('[DriverMode] Current pending booking:', pendingBooking?.bookingId);
        
        if (!offers || offers.length === 0) {
          // No offers, clear pending if exists
          if (pendingBooking) {
            console.log('[DriverMode] No offers, clearing pending booking');
            setPendingBooking(null);
          }
          return;
        }
        
        // Filter by vehicle type, check if not expired, and not rejected
        const matchingOffers = offers.filter(offer => {
          if (!offer || !offer.bookingId) return false;
          
          // Skip if this booking was already rejected
          if (rejectedBookingIds.has(offer.bookingId)) {
            console.log(`[DriverMode] Skipping rejected offer: ${offer.bookingId}`);
            return false;
          }
          
          // Case-insensitive vehicle type comparison
          const vehicleMatch = offer.vehicleType && vehicle?.type 
            ? offer.vehicleType.toUpperCase() === vehicle.type.toUpperCase()
            : false;
          
          const notExpired = offer.timeLeftSeconds != null && offer.timeLeftSeconds > 0;
          
          console.log(`[DriverMode] Offer ${offer.bookingId}: vehicleType=${offer.vehicleType}, driverVehicle=${vehicle?.type}, match=${vehicleMatch}, timeLeft=${offer.timeLeftSeconds}, expired=${!notExpired}`);
          
          return vehicleMatch && notExpired;
        });
        
        console.log('[DriverMode] Matching offers after filter:', matchingOffers.length);
        
        // Show first matching offer if available
        if (matchingOffers.length > 0) {
          const firstOffer = matchingOffers[0];
          
          // Debug: Log full offer data
          console.log('[DriverMode] Full offer data:', JSON.stringify(firstOffer, null, 2));
          console.log('[DriverMode] estimatedFare:', firstOffer.estimatedFare);
          console.log('[DriverMode] pickupAddress:', firstOffer.pickupAddress);
          console.log('[DriverMode] dropoffAddress:', firstOffer.dropoffAddress);
          console.log('[DriverMode] estimatedDistanceKm:', firstOffer.estimatedDistanceKm);
          console.log('[DriverMode] estimatedDurationMinutes:', firstOffer.estimatedDurationMinutes);
          
          // Check if this is a new offer (different bookingId) or we don't have a pending booking
          if (!pendingBooking || pendingBooking.bookingId !== firstOffer.bookingId) {
            console.log('[DriverMode] Setting new booking offer:', firstOffer.bookingId);
            
            // Convert offer to booking format for modal - include all data from DB
            const bookingOffer = {
              bookingId: firstOffer.bookingId,
              pickupLocation: {
                latitude: firstOffer.pickupLatitude,
                longitude: firstOffer.pickupLongitude,
                fullAddress: firstOffer.pickupAddress || 'Điểm đón',
                address: firstOffer.pickupAddress || 'Điểm đón',
                name: 'Điểm đón'
              },
              dropoffLocation: {
                latitude: firstOffer.dropoffLatitude,
                longitude: firstOffer.dropoffLongitude,
                fullAddress: firstOffer.dropoffAddress || 'Điểm đến',
                address: firstOffer.dropoffAddress || 'Điểm đến',
                name: 'Điểm đến'
              },
              vehicleType: firstOffer.vehicleType,
              estimatedDistanceKm: firstOffer.estimatedDistanceKm || 0,
              estimatedDurationMinutes: firstOffer.estimatedDurationMinutes || 0,
              estimatedFare: firstOffer.estimatedFare || 0,
              currency: firstOffer.currency || 'VND',
              price: {
                totalAmount: firstOffer.estimatedFare || 0,
                finalAmount: firstOffer.estimatedFare || 0,
                estimatedTotal: firstOffer.estimatedFare || 0
              },
              paymentMethod: 'CASH', // Default, can be updated later
              timeLeftSeconds: firstOffer.timeLeftSeconds
            };
            
            console.log('[DriverMode] Mapped bookingOffer:', JSON.stringify(bookingOffer, null, 2));
            
            setPendingBooking(bookingOffer);
          } else {
            // Same booking, update timeLeftSeconds if needed
            if (firstOffer.timeLeftSeconds !== pendingBooking.timeLeftSeconds) {
              setPendingBooking(prev => ({
                ...prev,
                timeLeftSeconds: firstOffer.timeLeftSeconds
              }));
            }
          }
        } else if (pendingBooking) {
          // No matching offers, clear pending booking if it exists
          console.log('[DriverMode] No matching offers, clearing pending booking');
          setPendingBooking(null);
        }
      } catch (err) {
        console.error('[DriverMode] Failed to fetch booking offers:', err);
      }
    };
    
    // Poll immediately
    pollBookingOffers();
    
    // Poll every 2 seconds for new offers (faster than before for real-time feel)
    const interval = setInterval(() => {
      pollBookingOffers();
    }, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isOnline, driverProfile, vehicle]);

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



