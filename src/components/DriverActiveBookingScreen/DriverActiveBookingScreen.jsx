import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../api/booking.api';
import { userAPI } from '../../api/user.api';
import { driverAPI } from '../../api/driver.api';
import { mapAPI } from '../../api/map.api';
import { trackingAPI } from '../../api/tracking.api';
import MapboxMap from '../MapboxMap';
import { Icons } from '../constants';
import useCurrentLocation from '../../hooks/useCurrentLocation';
// useDriverWebSocket removed - WebSocket now handled by NotificationService
import './DriverActiveBookingScreen.css';

const DriverActiveBookingScreen = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { location: currentLocation } = useCurrentLocation();

  // WebSocket removed - NotificationService handles realtime via Kafka

  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [arriving, setArriving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Map states
  const [routePolyline, setRoutePolyline] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]); // Navigation steps
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // Current navigation step

  // WebSocket disconnect removed - not needed anymore since we use single NotificationService WebSocket

  // Fetch booking details
  const fetchBookingData = useCallback(async () => {
    if (!bookingId) return;

    try {
      setError(null);

      // Fetch booking
      const bookingData = await bookingAPI.getBooking(bookingId);
      setBooking(bookingData);

      // Fetch customer info if not already loaded or if customer changed
      if (bookingData.customerId) {
        try {
          const customerData = await userAPI.getProfile(bookingData.customerId);
          setCustomer(customerData);
        } catch (err) {
          console.warn('Could not fetch customer info:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching booking data:', err);
      setError('Không thể tải thông tin chuyến đi.');
    }
  }, [bookingId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch driver profile
        const profile = await driverAPI.getMyProfile();
        setDriverProfile(profile);

        // Fetch booking
        await fetchBookingData();
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải thông tin chuyến đi.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchData();
    }
  }, [bookingId, fetchBookingData]);

  // DISABLED: Polling is not needed for driver
  // Driver manually changes status via buttons, no need to poll
  // Customer uses WebSocket for realtime updates instead
  /*
  useEffect(() => {
    if (!bookingId || !booking) return;
    
    const status = booking.status;
    // Only poll if booking is active (not completed or cancelled)
    if (status === 'COMPLETED' || status === 'CANCELED' || status === 'CANCELLED') return;
    
    const pollBookingStatus = async () => {
      try {
        const latestBooking = await bookingAPI.getBooking(bookingId);
        
        // If status changed, update booking
        if (latestBooking?.status && latestBooking.status !== status) {
          console.log('[DriverActiveBooking] Status changed:', status, '→', latestBooking.status);
          setBooking(latestBooking);
        }
      } catch (err) {
        console.warn('[DriverActiveBooking] Failed to poll booking status:', err);
      }
    };
    
    // Poll every 2 seconds
    const interval = setInterval(pollBookingStatus, 2000);
    
    return () => clearInterval(interval);
  }, [bookingId, booking?.status, fetchBookingData]);
*/

  // Update driver location and fetch route
  useEffect(() => {
    if (!booking || !currentLocation) return;

    const status = booking.status;
    if (status === 'MATCHED' || status === 'DRIVER_ARRIVED' || status === 'IN_PROGRESS') {
      // Update driver location
      setDriverLocation({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      });

      // Fetch route from current location to pickup (only for MATCHED status)
      if (booking.pickupLocation && status === 'MATCHED') {
        const fetchRoute = async () => {
          try {
            console.log('[DriverActiveBooking] Fetching route from driver to pickup:', {
              driver: { lat: currentLocation.lat, lng: currentLocation.lng },
              pickup: { lat: booking.pickupLocation.latitude, lng: booking.pickupLocation.longitude }
            });

            const route = await mapAPI.getRoute(
              currentLocation.lat,
              currentLocation.lng,
              booking.pickupLocation.latitude,
              booking.pickupLocation.longitude,
              'driving'
            );

            console.log('[DriverActiveBooking] Route to pickup response:', route);

            // Save navigation steps
            if (route?.steps && Array.isArray(route.steps)) {
              setRouteSteps(route.steps);
              setCurrentStepIndex(0);
              console.log('[DriverActiveBooking] ✓ Navigation steps loaded for pickup:', route.steps.length);
            }

            // Handle RouteResponse format from MapService - convert to Mapbox format
            if (route?.geometry && Array.isArray(route.geometry)) {
              // Convert GeoPoint array to coordinate array for MapboxMap
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
                  // Check if it's [lat, lng] or [lng, lat] by value ranges
                  if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
                    return [second, first]; // Swap to [lng, lat]
                  }
                  return [first, second];
                }
                return null;
              }).filter(coord => coord !== null);

              console.log('[DriverActiveBooking] ✓ Route geometry converted for pickup, coordinates length:', coordinates.length);
              if (coordinates.length > 0) {
                setRoutePolyline(coordinates);
              }
            } else if (route?.polyline) {
              console.log('[DriverActiveBooking] ✓ Route polyline received for pickup');
              setRoutePolyline(route.polyline);
            } else if (route?.routes && Array.isArray(route.routes) && route.routes.length > 0) {
              const firstRoute = route.routes[0];
              if (firstRoute.geometry) {
                console.log('[DriverActiveBooking] ✓ Route from routes[0].geometry for pickup');
                // Convert if needed
                const coordinates = Array.isArray(firstRoute.geometry) ? firstRoute.geometry.map(point => {
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
                }).filter(coord => coord !== null) : firstRoute.geometry;
                setRoutePolyline(coordinates);
              }
            } else {
              console.warn('[DriverActiveBooking] ✗ Route data format not recognized for pickup:', route);
            }
          } catch (err) {
            console.warn('[DriverActiveBooking] Could not fetch route to pickup:', err);
          }
        };

        fetchRoute();
      }

      // For IN_PROGRESS: Fetch route from current driver location to dropoff (realtime)
      if (status === 'IN_PROGRESS' && booking.dropoffLocation) {
        const fetchRoute = async () => {
          try {
            console.log('[DriverActiveBooking] Fetching route from driver to dropoff:', {
              driver: { lat: currentLocation.lat, lng: currentLocation.lng },
              dropoff: { lat: booking.dropoffLocation.latitude, lng: booking.dropoffLocation.longitude }
            });

            const route = await mapAPI.getRoute(
              currentLocation.lat,
              currentLocation.lng,
              booking.dropoffLocation.latitude,
              booking.dropoffLocation.longitude,
              'driving'
            );

            console.log('[DriverActiveBooking] Route response:', route);

            // Save navigation steps
            if (route?.steps && Array.isArray(route.steps)) {
              setRouteSteps(route.steps);
              setCurrentStepIndex(0); // Reset to first step
              console.log('[DriverActiveBooking] ✓ Navigation steps loaded:', route.steps.length);
            }

            // Handle RouteResponse format from MapService
            if (route?.geometry && Array.isArray(route.geometry)) {
              // Convert GeoPoint array to coordinate array for MapboxMap
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

              console.log('[DriverActiveBooking] ✓ Route geometry converted, coordinates length:', coordinates.length);
              if (coordinates.length > 0) {
                setRoutePolyline(coordinates);
              }
            } else if (route?.polyline) {
              console.log('[DriverActiveBooking] ✓ Route polyline received');
              setRoutePolyline(route.polyline);
            } else if (route?.routes && Array.isArray(route.routes) && route.routes.length > 0) {
              const firstRoute = route.routes[0];
              if (firstRoute.geometry) {
                console.log('[DriverActiveBooking] ✓ Route from routes[0].geometry');
                setRoutePolyline(firstRoute.geometry);
              }
            } else {
              console.warn('[DriverActiveBooking] ✗ Route data format not recognized:', route);
            }
          } catch (err) {
            console.warn('[DriverActiveBooking] Could not fetch route to dropoff:', err);
          }
        };

        fetchRoute();
      }
    }
  }, [booking, currentLocation]);

  // Update location periodically
  useEffect(() => {
    if (!booking || !driverProfile || !currentLocation) return;

    const status = booking.status;
    // Only update location for active bookings
    if (status !== 'MATCHED' && status !== 'DRIVER_ARRIVED' && status !== 'IN_PROGRESS') return;

    const updateLocation = async () => {
      try {
        // Update location via tracking API
        await trackingAPI.updateLocation({
          driverId: driverProfile.driverId,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          status: 'ONLINE',
          vehicleType: driverProfile.vehicle?.type || 'MOTORBIKE',
          lastUpdatedAt: Date.now()
        });

        setDriverLocation({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        });
      } catch (err) {
        console.warn('Failed to update location:', err);
      }
    };

    // Update immediately
    updateLocation();

    // Update every 5 seconds
    const interval = setInterval(updateLocation, 5000);

    return () => clearInterval(interval);
  }, [booking, driverProfile, currentLocation]);

  // Update route for IN_PROGRESS (realtime route update when driver moves)
  useEffect(() => {
    if (!booking || !currentLocation) return;

    const status = booking.status;
    if (status !== 'IN_PROGRESS' || !booking.dropoffLocation) return;

    let lastDriverLat = null;
    let lastDriverLng = null;

    const updateRouteToDropoff = async () => {
      // Check if driver location has changed significantly (more than ~10 meters)
      const hasChanged = lastDriverLat === null || lastDriverLng === null ||
        Math.abs(currentLocation.lat - lastDriverLat) > 0.0001 ||
        Math.abs(currentLocation.lng - lastDriverLng) > 0.0001;

      if (hasChanged) {
        lastDriverLat = currentLocation.lat;
        lastDriverLng = currentLocation.lng;

        try {
          const route = await mapAPI.getRoute(
            currentLocation.lat,
            currentLocation.lng,
            booking.dropoffLocation.latitude,
            booking.dropoffLocation.longitude,
            'driving'
          );

          // Save navigation steps
          if (route?.steps && Array.isArray(route.steps)) {
            setRouteSteps(route.steps);
          }

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
          console.warn('[DriverActiveBooking] Could not update route to dropoff:', err);
        }
      }
    };

    // Update route every 5 seconds when driver moves
    const routeInterval = setInterval(updateRouteToDropoff, 5000);
    updateRouteToDropoff(); // Initial call

    return () => clearInterval(routeInterval);
  }, [booking?.status, booking?.dropoffLocation, currentLocation]);

  // Auto-focus to current location when IN_PROGRESS (navigation view)
  // Update focus when driver moves during trip
  useEffect(() => {
    if (!booking || !currentLocation) return;

    const status = booking.status;
    if (status === 'IN_PROGRESS') {
      // Auto-focus to driver's current location for navigation view
      // Update focus whenever currentLocation changes (driver moves)
      // Use a small delay to ensure it overrides any other focus logic
      const timeoutId = setTimeout(() => {
        setFocusLocation({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    } else if (status === 'MATCHED' || status === 'DRIVER_ARRIVED') {
      // For MATCHED and DRIVER_ARRIVED, also focus on current location
      if (currentLocation) {
        setFocusLocation({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        });
      }
    } else {
      // Clear focus when not in active status
      setFocusLocation(null);
    }
  }, [booking?.status, currentLocation?.lat, currentLocation?.lng]);

  // Calculate current step index based on driver location
  useEffect(() => {
    if (!booking || !currentLocation || booking.status !== 'IN_PROGRESS' || !routeSteps || routeSteps.length === 0) {
      return;
    }

    // Find the closest step to driver's current location
    let closestStepIndex = 0;
    let minDistance = Infinity;

    routeSteps.forEach((step, index) => {
      if (step.location) {
        const stepLat = step.location.latitude || step.location.lat;
        const stepLng = step.location.longitude || step.location.lng;

        if (stepLat !== undefined && stepLng !== undefined) {
          // Calculate distance using Haversine formula
          const R = 6371e3; // Earth radius in meters
          const φ1 = currentLocation.lat * Math.PI / 180;
          const φ2 = stepLat * Math.PI / 180;
          const Δφ = (stepLat - currentLocation.lat) * Math.PI / 180;
          const Δλ = (stepLng - currentLocation.lng) * Math.PI / 180;

          const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c; // Distance in meters

          // Prefer steps ahead of driver (index > currentStepIndex)
          // But find the closest step that hasn't been passed
          if (distance < minDistance && index >= currentStepIndex) {
            minDistance = distance;
            closestStepIndex = index;
          }
        }
      }
    });

    // Update current step if we found a closer step (within 50 meters)
    if (minDistance < 50 && closestStepIndex !== currentStepIndex) {
      setCurrentStepIndex(closestStepIndex);
    }
  }, [booking?.status, currentLocation, routeSteps, currentStepIndex]);

  const handleArrived = async () => {
    if (arriving || !booking) return;

    try {
      setArriving(true);
      await bookingAPI.driverArrived(bookingId);

      // Refresh booking to get updated status
      const updatedBooking = await bookingAPI.getBooking(bookingId);
      setBooking(updatedBooking);
      console.log('[DriverActiveBooking] Driver arrived, status updated to:', updatedBooking.status);
    } catch (err) {
      console.error('Failed to mark as arrived:', err);
      const errorMessage = err.response?.data?.message || err.message || '';
      alert(errorMessage || 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    } finally {
      setArriving(false);
    }
  };

  const handleStartTrip = async () => {
    if (starting || !booking) return;

    try {
      setStarting(true);
      await bookingAPI.startTrip(bookingId);

      // Immediately focus to current location when trip starts
      if (currentLocation) {
        setFocusLocation({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        });
      }

      // Refresh booking to get updated status
      await fetchBookingData();
      console.log('[DriverActiveBooking] Trip started, status updated to IN_PROGRESS');
    } catch (err) {
      console.error('Failed to start trip:', err);
      const errorMessage = err.response?.data?.message || err.message || '';
      alert(errorMessage || 'Không thể bắt đầu chuyến đi. Vui lòng thử lại.');
    } finally {
      setStarting(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (completing || !booking) return;

    try {
      setCompleting(true);

      // Calculate actual distance and duration
      // Use actualDistanceKm if available, otherwise use estimatedDistanceKm
      const actualDistanceKm = booking.actualDistanceKm || booking.estimatedDistanceKm || 0;

      // Calculate actual duration from start time to now
      let actualDurationMinutes = booking.actualDurationMinutes;
      if (!actualDurationMinutes && booking.actualPickupTime) {
        const startTime = new Date(booking.actualPickupTime);
        const now = new Date();
        actualDurationMinutes = Math.max(1, Math.round((now - startTime) / (1000 * 60))); // Convert to minutes
      } else if (!actualDurationMinutes) {
        // Fallback to estimated duration if no start time
        actualDurationMinutes = booking.estimatedDurationMinutes || 1;
      }

      // Prepare request data
      const completeData = {
        actualDistanceKm: actualDistanceKm,
        actualDurationMinutes: actualDurationMinutes
      };

      console.log('[DriverActiveBooking] Completing trip with data:', completeData);

      await bookingAPI.completeTrip(bookingId, completeData);

      // Refresh booking to get updated status
      await fetchBookingData();
      console.log('[DriverActiveBooking] Trip completed, status updated to COMPLETED');

      // Optionally navigate to completed screen or show success message
      alert('Chuyến đi đã hoàn thành!');

      // Navigate back to driver mode after completion
      setTimeout(() => {
        navigate('/driver');
      }, 2000);
    } catch (err) {
      console.error('Failed to complete trip:', err);
      const errorMessage = err.response?.data?.message || err.message || '';
      alert(errorMessage || 'Không thể hoàn thành chuyến đi. Vui lòng thử lại.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="driver-active-booking-container">
        <div className="driver-active-booking-loading">
          <div className="driver-active-booking-spinner"></div>
          <p>Đang tải thông tin chuyến đi...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="driver-active-booking-container">
        <div className="driver-active-booking-error">
          <p>{error || 'Không tìm thấy thông tin chuyến đi'}</p>
          <button onClick={() => navigate('/driver')} className="driver-active-booking-back-btn">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const status = booking.status || 'MATCHED';
  const pickupLocation = booking.pickupLocation;
  const customerName = customer?.fullName || 'Khách hàng';
  const customerRating = customer?.rating || 4.8;

  return (
    <div className="driver-active-booking-container">
      {/* Header with customer info */}
      <div className="driver-active-booking-header">
        <div className="driver-active-booking-customer-info">
          <div className="driver-active-booking-customer-avatar">
            {customerName[0]?.toUpperCase() || 'K'}
          </div>
          <div className="driver-active-booking-customer-details">
            <div className="driver-active-booking-customer-name">{customerName}</div>
            <div className="driver-active-booking-customer-rating">
              ⭐ {customerRating.toFixed(1)} - Khách hàng
            </div>
          </div>
        </div>
        <div className="driver-active-booking-header-actions">
          <button className="driver-active-booking-call-btn">
            <Icons.Phone className="w-6 h-6" />
          </button>
          <button className="driver-active-booking-menu-btn">
            <Icons.MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Status and location info */}
      <div className="driver-active-booking-status-section">
        <div className="driver-active-booking-status-text">
          {status === 'DRIVER_ARRIVED' ? 'ĐÃ ĐẾN ĐIỂM ĐÓN' : status === 'IN_PROGRESS' ? 'ĐANG TRONG CHUYẾN ĐI' : 'ĐANG ĐẾN ĐIỂM ĐÓN'}
        </div>
        {status === 'MATCHED' || status === 'DRIVER_ARRIVED' ? (
          pickupLocation && (
            <div className="driver-active-booking-pickup-info">
              <div className="driver-active-booking-pickup-name">
                {pickupLocation.name || 'Điểm đón'}
              </div>
              <div className="driver-active-booking-pickup-address">
                {pickupLocation.fullAddress || pickupLocation.address || 'Đang tải địa chỉ...'}
              </div>
            </div>
          )
        ) : status === 'IN_PROGRESS' && booking.dropoffLocation ? (
          <div className="driver-active-booking-pickup-info">
            <div className="driver-active-booking-pickup-name">
              {booking.dropoffLocation.name || 'Điểm đến'}
            </div>
            <div className="driver-active-booking-pickup-address">
              {booking.dropoffLocation.fullAddress || booking.dropoffLocation.address || 'Đang tải địa chỉ...'}
            </div>
          </div>
        ) : null}
      </div>

      {/* Map with route */}
      <div className="driver-active-booking-map">
        <MapboxMap
          height="100%"
          pickupMarker={status === 'MATCHED' || status === 'DRIVER_ARRIVED' ? (pickupLocation ? {
            lat: pickupLocation.latitude,
            lng: pickupLocation.longitude,
          } : null) : null}
          destinationMarker={status === 'IN_PROGRESS' && booking.dropoffLocation ? {
            lat: booking.dropoffLocation.latitude,
            lng: booking.dropoffLocation.longitude,
          } : null}
          driverMarker={driverLocation}
          routePolyline={routePolyline}
          focusLocation={focusLocation}
          navigationMode={status === 'IN_PROGRESS' || status === 'MATCHED'}
        />
        {/* Focus to current location button */}
        {currentLocation && (
          <button
            className="driver-active-booking-focus-btn"
            onClick={() => {
              setFocusLocation({
                lat: currentLocation.lat,
                lng: currentLocation.lng,
              });
              // Reset focusLocation after a short delay to allow re-triggering
              setTimeout(() => setFocusLocation(null), 100);
            }}
            title="Focus vào vị trí hiện tại"
          >
            <Icons.Crosshair className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Steps - Only show during IN_PROGRESS */}
      {status === 'IN_PROGRESS' && routeSteps && routeSteps.length > 0 && (
        <div className="driver-active-booking-navigation">
          <div className="driver-active-booking-navigation-header">
            <span className="driver-active-booking-navigation-title">Chỉ đường</span>
          </div>
          <div className="driver-active-booking-navigation-steps">
            {routeSteps.map((step, index) => {
              const isCurrentStep = index === currentStepIndex;
              const isPassed = index < currentStepIndex;
              const distance = step.distance ? (step.distance < 1000 ? `${Math.round(step.distance)}m` : `${(step.distance / 1000).toFixed(2)}km`) : '';

              return (
                <div
                  key={index}
                  className={`driver-active-booking-navigation-step ${isCurrentStep ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                >
                  <div className="driver-active-booking-navigation-step-icon">
                    {isCurrentStep ? '📍' : isPassed ? '✓' : '○'}
                  </div>
                  <div className="driver-active-booking-navigation-step-content">
                    <div className="driver-active-booking-navigation-step-instruction">
                      {step.instruction || 'Tiếp tục'}
                    </div>
                    {distance && (
                      <div className="driver-active-booking-navigation-step-distance">
                        {distance}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action button */}
      <div className="driver-active-booking-actions">
        {status === 'MATCHED' && (
          <button
            className="driver-active-booking-arrived-btn"
            onClick={handleArrived}
            disabled={arriving}
          >
            {arriving ? 'Đang xử lý...' : 'Đã đến điểm đón'}
          </button>
        )}
        {status === 'DRIVER_ARRIVED' && (
          <button
            className="driver-active-booking-start-btn"
            onClick={handleStartTrip}
            disabled={starting}
          >
            {starting ? 'Đang xử lý...' : 'Bắt đầu chuyến đi'}
          </button>
        )}
        {status === 'IN_PROGRESS' && (
          <button
            className="driver-active-booking-complete-btn"
            onClick={handleCompleteTrip}
            disabled={completing}
          >
            {completing ? 'Đang xử lý...' : 'Hoàn thành chuyến'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DriverActiveBookingScreen;

