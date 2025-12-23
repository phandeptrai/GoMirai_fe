import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapboxMap from './MapboxMap';
import LocationInput from './LocationInput';
import VehicleSelectionModal from './VehicleSelectionModal';
import useCurrentLocation from '../hooks/useCurrentLocation';
import { calculateHaversineDistance, formatDistance } from '../utils/distance';
import { mapAPI } from '../api/map.api';
import { Icons } from './constants';
import './BookingSearchModal.css';

const BookingSearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { location: currentLocation, loading: locationLoading } = useCurrentLocation();

  const [pickupLocation, setPickupLocation] = useState('Đang lấy vị trí...');
  const [pickupCoords, setPickupCoords] = useState({ lat: 10.7716, lng: 106.7044 });
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [isEstimated, setIsEstimated] = useState(true);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [focusLocation, setFocusLocation] = useState(null);

  // Cập nhật vị trí đón khi có vị trí hiện tại
  useEffect(() => {
    if (currentLocation) {
      setPickupLocation(currentLocation.address || 'Vị trí hiện tại');
      setPickupCoords({ lat: currentLocation.lat, lng: currentLocation.lng });
    }
  }, [currentLocation]);

  // Tính khoảng cách khi có cả điểm đón và điểm đến
  useEffect(() => {
    if (pickupCoords && destinationCoords) {
      setIsCalculatingDistance(true);

      // Tính khoảng cách bằng Haversine ngay lập tức (ước tính nhanh)
      const haversineDistance = calculateHaversineDistance(pickupCoords, destinationCoords);
      setEstimatedDistance(haversineDistance);
      setIsEstimated(true);
      setIsCalculatingDistance(false);

      // Thử lấy khoảng cách thực tế từ API (async, không block UI)
      mapAPI.getRoute(pickupCoords.lat, pickupCoords.lng, destinationCoords.lat, destinationCoords.lng)
        .then((routeData) => {
          if (routeData && routeData.distance) {
            // API trả về khoảng cách bằng mét, chuyển sang km
            const distanceKm = routeData.distance / 1000;
            setEstimatedDistance(Math.round(distanceKm * 100) / 100);
            setIsEstimated(false);
          }
        })
        .catch((error) => {
          // Nếu API lỗi, giữ nguyên giá trị Haversine đã tính
          console.warn('Không thể lấy khoảng cách từ API, sử dụng ước tính:', error);
        });
    } else {
      setEstimatedDistance(0);
      setIsEstimated(true);
    }
  }, [pickupCoords, destinationCoords]);

  if (!isOpen) return null;

  const handleQuickSelect = (type) => {
    if (type === 'home') {
      setDestination('Nhà riêng');
    } else if (type === 'company') {
      setDestination('Công ty');
    } else if (type === 'map') {
      // TODO: Open map selection
      console.log('Chọn trên bản đồ');
    }
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Map Background */}
        <div className="booking-modal-map">
          <MapboxMap
            height="100%"
            pickupMarker={pickupCoords}
            destinationMarker={destinationCoords}
            focusLocation={focusLocation}
            onMapClick={(coords) => {
              // When clicking on map, set as destination
              setDestinationCoords(coords);
            }}
          />
          {/* Focus to current location button */}
          {currentLocation && (
            <button
              className="booking-modal-focus-btn"
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

        {/* Top Navigation Buttons */}
        <button className="booking-modal-back-btn" onClick={onClose}>
          ←
        </button>
        <button className="booking-modal-share-btn">
          ↗
        </button>

        {/* Bottom Sheet */}
        <div className="booking-modal-bottom-sheet">
          {/* Handle */}
          <div className="booking-modal-handle" onClick={onClose}>
            <div className="booking-modal-handle-icon"></div>
          </div>

          {/* Header */}
          <div className="booking-modal-header">
            <h2 className="booking-modal-title">Đặt xe</h2>
            <button className="booking-modal-close-btn" onClick={onClose}>
              Đóng
            </button>
          </div>

          {/* Location Inputs */}
          <div className="booking-modal-location-inputs">
            {/* Pickup Location */}
            <LocationInput
              value={pickupLocation}
              onChange={setPickupLocation}
              placeholder="Điểm đón"
              iconColor="#3b82f6"
              onLocationSelect={(location) => {
                setPickupLocation(location.address || location.name);
                setPickupCoords({ lat: location.lat, lng: location.lng });
              }}
              currentLocation={pickupCoords}
            />

            {/* Destination Location */}
            <LocationInput
              value={destination}
              onChange={setDestination}
              placeholder="Nhập điểm đến..."
              iconColor="#ef4444"
              onEnter={() => {
                // Nếu đã có tọa độ điểm đến thì mở modal chọn phương tiện
                if (destinationCoords) {
                  setShowVehicleModal(true);
                }
              }}
              onLocationSelect={(location) => {
                setDestination(location.address || location.name);
                setDestinationCoords({ lat: location.lat, lng: location.lng });
                // Hiển thị modal chọn phương tiện sau khi chọn điểm đến
                setTimeout(() => {
                  setShowVehicleModal(true);
                }, 300);
              }}
              currentLocation={pickupCoords}
            />
          </div>

          {/* Distance Display */}
          {estimatedDistance > 0 && (
            <div className="booking-modal-distance-display">
              <span className="booking-modal-distance-icon">📏</span>
              <span className="booking-modal-distance-text">
                {isCalculatingDistance ? (
                  'Đang tính khoảng cách...'
                ) : (
                  <>
                    Khoảng cách: <strong>{formatDistance(estimatedDistance)}</strong>
                    {isEstimated && <span className="booking-modal-distance-estimated"> (ước tính)</span>}
                  </>
                )}
              </span>
            </div>
          )}

          {/* Quick Selection Buttons */}
          <div className="booking-modal-quick-buttons">
            <button
              className="booking-modal-quick-btn"
              onClick={() => handleQuickSelect('home')}
            >
              <span className="quick-btn-icon">⭐</span>
              <span>Nhà riêng</span>
            </button>
            <button
              className="booking-modal-quick-btn"
              onClick={() => handleQuickSelect('company')}
            >
              <span className="quick-btn-icon">🏢</span>
              <span>Công ty</span>
            </button>
            <button
              className="booking-modal-quick-btn booking-modal-quick-btn-primary"
              onClick={() => handleQuickSelect('map')}
            >
              Chọn trên bản đồ
            </button>
          </div>
        </div>
      </div>

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onBack={() => setShowVehicleModal(false)} // Quay lại popup chọn địa điểm
        pickupLocation={pickupLocation}
        destinationLocation={destination}
        pickupCoords={pickupCoords}
        destinationCoords={destinationCoords}
        initialDistance={estimatedDistance}
        isDistanceEstimated={isEstimated}
        onConfirm={(bookingData) => {
          console.log('Booking confirmed:', bookingData);

          // Xử lý khi đặt xe thành công
          if (bookingData.booking) {
            const bookingId = bookingData.booking.bookingId;

            // Đóng modal
            setShowVehicleModal(false);
            onClose();

            // Navigate đến màn hình chi tiết booking để theo dõi
            navigate(`/activity/${bookingId}`);
          }
        }}
      />
    </div>
  );
};

export default BookingSearchModal;

